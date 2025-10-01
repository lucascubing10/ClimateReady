import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { useAuth } from '../../context/AuthContext';
import {
  startSOSSession,
  updateSOSLocation,
  endSOSSession,
  checkActiveSOSSession,
  createSOSTrackingLink
} from '../../utils/sos/sosService';
import {
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
  isBackgroundLocationAvailable
} from '../../utils/sos/backgroundLocationService';
import {
  notifyEmergencyResponders,
  sendLocalNotification
} from '../../utils/sos/notificationService';

export default function SOSScreen() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const autoActivate = params.autoActivate === 'true';
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const locationSubscription = useRef<any>(null);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);

  // Check if SOS is already active when screen loads
  useEffect(() => {
    const checkSOS = async () => {
      setLoading(true);
      const activeSession = await checkActiveSOSSession();
      
      if (activeSession) {
        setSessionId(activeSession);
        setIsSOSActive(true);
        startLocationTracking();
      } else if (autoActivate) {
        // If no active session but autoActivate is true, start SOS immediately
        startEmergencySOS();
        return; // Skip setting loading to false as handleSOSPress will handle it
      }
      
      setLoading(false);
    };
    
    checkSOS();
    
    // Clean up on unmount
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [autoActivate]); // Add autoActivate as a dependency

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for SOS tracking.');
        return;
      }

      // Get initial location and update
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      updateSOSLocation({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        accuracy: initialLocation.coords.accuracy || undefined
      });
      
      // First start foreground tracking for immediate updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000 // Update every 5 seconds
        },
        (location) => {
          updateSOSLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined
          });
          setLocationUpdateCount(prev => prev + 1);
        }
      );
      
      // Then try to start background tracking
      const backgroundAvailable = await isBackgroundLocationAvailable();
      
      if (backgroundAvailable) {
        try {
          await startBackgroundLocationUpdates();
          console.log('Background location tracking started');
        } catch (error) {
          console.error('Could not start background location tracking:', error);
        }
      }
      
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Location Error', 'Could not track your location. Please try again or check app permissions.');
    }
  };

  // Stop location tracking
  const stopLocationTracking = async () => {
    try {
      // Stop watchPosition
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      
      // Stop background tracking
      await stopBackgroundLocationUpdates();
      
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  // Handle SOS button press
  const handleSOSPress = async () => {
    if (isSOSActive) {
      // If SOS is already active, confirm cancellation
      Alert.alert(
        'End SOS Alert',
        'Are you sure you want to end the emergency alert? This will stop sharing your location with your emergency contacts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Alert',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const success = await endSOSSession();
              
              if (success) {
                stopLocationTracking();
                setSessionId(null);
                setIsSOSActive(false);
              } else {
                Alert.alert('Error', 'Could not end SOS session. Please try again.');
              }
              
              setLoading(false);
            }
          }
        ]
      );
    } else {
      // Check if user has emergency contacts
      if (!userProfile?.emergencyContacts || userProfile.emergencyContacts.length === 0) {
        Alert.alert(
          'No Emergency Contacts',
          'You need to add at least one emergency contact before using the SOS feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Contacts', onPress: () => router.push('/tabs/profile-edit/emergency-contacts') }
          ]
        );
        return;
      }
      
      // If auto-activate parameter is true, skip confirmation and start immediately
      if (autoActivate) {
        startEmergencySOS();
      } else {
        // Show confirmation dialog
        Alert.alert(
          'Confirm SOS Alert',
          'This will send an emergency alert with your location to all your emergency contacts. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send Alert',
              style: 'destructive',
              onPress: startEmergencySOS
            }
          ]
        );
      }
    }
  };
  
  // Function that actually starts the SOS process
  const startEmergencySOS = async () => {
    try {
      setLoading(true);
      console.log('Starting SOS session...');
      
      // Start SOS session
      const newSessionId = await startSOSSession(user?.uid || 'anonymous', userProfile);
      
      if (!newSessionId) {
        console.error('Failed to get session ID from startSOSSession');
        throw new Error('Could not start SOS session');
      }
      
      console.log('SOS session started with ID:', newSessionId);
      setSessionId(newSessionId);
      setIsSOSActive(true);
      
      // Start location tracking
      await startLocationTracking();
      
      // Generate tracking link
      const trackingLink = await createSOSTrackingLink(newSessionId);
      
      // Send SMS to emergency contacts
      await sendSOSSMS(trackingLink);

      // Send local notification to keep the user informed
      await sendLocalNotification(
        'SOS Activated', 
        'Your location is being shared with emergency contacts. Tap to return to the app.'
      );

      // Send push notifications to emergency contacts if available
      await notifyEmergencyResponders(newSessionId, userProfile);
      
      setLoading(false);
    } catch (error) {
      console.error('Error starting SOS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'SOS Error', 
        `Could not start SOS: ${errorMessage}. Please check your connection and try again.`
      );
      setLoading(false);
    }
  };

  // Send SOS SMS to emergency contacts
  const sendSOSSMS = async (trackingLink: string) => {
    if (!userProfile?.emergencyContacts || userProfile.emergencyContacts.length === 0) {
      return;
    }
    
    try {
      // Check SMS availability
      const isAvailable = await SMS.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('SMS is not available on this device');
      }
      
      // Construct message
      const name = `${userProfile.firstName} ${userProfile.lastName}`;
      const message = `EMERGENCY SOS ALERT from ${name}. I need help. Track my live location: ${trackingLink}`;
      
      // Get phone numbers
      const phoneNumbers = userProfile.emergencyContacts.map(contact => contact.phoneNumber);
      
      // Open SMS composer
      const { result } = await SMS.sendSMSAsync(phoneNumbers, message);
      
      if (result === 'cancelled') {
        Alert.alert(
          'SMS Cancelled',
          'You cancelled sending the emergency message. Your location is still being tracked and you can cancel the SOS alert anytime.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert(
        'SMS Error',
        'Could not send SMS automatically. Your location is still being tracked. Would you like to share the tracking link manually?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Link',
            onPress: async () => {
              try {
                await Linking.openURL(`sms:?body=EMERGENCY SOS ALERT. I need help. Track my live location: ${trackingLink}`);
              } catch (err) {
                Alert.alert('Error', 'Could not open SMS app.');
              }
            }
          }
        ]
      );
    }
  };

  // Navigate to SOS settings
  const goToSettings = () => {
    router.push('/tabs/sos-settings');
  };
  
  // Navigate to SOS history
  const goToHistory = () => {
    router.push('/tabs/sos-history');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Emergency SOS', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>
            {isSOSActive ? 'Updating location...' : 'Preparing SOS...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Emergency SOS', 
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={goToSettings} style={{ marginRight: 16 }}>
              <Ionicons name="settings-outline" size={24} color="#0284c7" />
            </TouchableOpacity>
          )
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.title}>Emergency SOS</Text>
          <Text style={styles.description}>
            {isSOSActive
              ? 'SOS is active. Your location is being shared with your emergency contacts.'
              : 'Press the SOS button to alert your emergency contacts with your location.'}
          </Text>
          
          {isSOSActive && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                Location updates: {locationUpdateCount}
              </Text>
              <View style={styles.indicator}>
                <View style={[styles.pulse, styles.pulse1]} />
                <View style={[styles.pulse, styles.pulse2]} />
                <View style={[styles.pulse, styles.pulse3]} />
                <View style={styles.indicatorDot} />
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.sosButton,
              isSOSActive ? styles.sosActiveButton : {}
            ]}
            onPress={handleSOSPress}
          >
            <View style={styles.buttonInner}>
              <Ionicons
                name={isSOSActive ? "alert-circle" : "alert-circle-outline"}
                size={50}
                color="#fff"
              />
              <Text style={styles.buttonText}>
                {isSOSActive ? 'END SOS' : 'SOS'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={goToSettings}
          >
            <Ionicons name="settings-outline" size={24} color="#0284c7" />
            <Text style={styles.actionText}>SOS Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={goToHistory}
          >
            <Ionicons name="time-outline" size={24} color="#0284c7" />
            <Text style={styles.actionText}>SOS History</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
          <Text style={styles.infoBoxText}>
            In case of emergency, press the SOS button to alert your emergency contacts. They will receive your location and be able to track you.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b5563',
  },
  infoSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  indicator: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dc2626',
    opacity: 0.3,
  },
  pulse1: {
    transform: [{ scale: 1 }],
    opacity: 0.3,
  },
  pulse2: {
    transform: [{ scale: 1.5 }],
    opacity: 0.2,
  },
  pulse3: {
    transform: [{ scale: 2 }],
    opacity: 0.1,
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sosActiveButton: {
    backgroundColor: '#991b1b',
  },
  buttonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#0284c7',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBoxText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});