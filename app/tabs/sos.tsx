import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
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
  }, []);

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
        // Ask for background permissions and start background updates
        const backgroundStarted = await startBackgroundLocationUpdates();
        
        if (backgroundStarted) {
          console.log('Background location tracking started');
        } else {
          console.log('Could not start background tracking, using foreground only');
        }
      } else {
        Alert.alert(
          'Limited Tracking',
          'Background location tracking is not available on this device. Location will only update when the app is open.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error tracking location:', error);
      Alert.alert('Location Error', 'Could not track your location. Please try again.');
    }
  };

  // Stop location tracking
  const stopLocationTracking = async () => {
    // Stop foreground tracking
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    
    // Stop background tracking
    await stopBackgroundLocationUpdates();
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
      
      // Confirm SOS activation
      Alert.alert(
        'Confirm SOS Alert',
        'This will send an emergency alert with your location to all your emergency contacts. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Alert',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                
                // Start SOS session
                const newSessionId = await startSOSSession(user?.uid || 'anonymous', userProfile);
                
                if (!newSessionId) {
                  throw new Error('Could not start SOS session');
                }
                
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
                Alert.alert('SOS Error', 'Could not start SOS. Please try again.');
                setLoading(false);
              }
            }
          }
        ]
      );
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
        
        <TouchableOpacity
          style={[
            styles.sosButton,
            isSOSActive ? styles.sosActiveButton : {}
          ]}
          onPress={handleSOSPress}
          disabled={loading}
        >
          <Text style={styles.sosButtonText}>
            {isSOSActive ? 'CANCEL SOS' : 'SOS'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.warningSection}>
          <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.warningText}>
            {isSOSActive
              ? 'Your battery may drain faster while SOS is active due to continuous location tracking.'
              : 'Please only use SOS in genuine emergency situations. Your emergency contacts will be alerted immediately.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 32,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  indicator: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    backgroundColor: 'rgba(220, 38, 38, 0.2)', // Red with opacity
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  pulse1: {
    transform: [{ scale: 1 }],
    opacity: 0.5,
  },
  pulse2: {
    transform: [{ scale: 1.2 }],
    opacity: 0.3,
  },
  pulse3: {
    transform: [{ scale: 1.4 }],
    opacity: 0.1,
  },
  indicatorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dc2626', // Red
  },
  sosButton: {
    backgroundColor: '#dc2626', // Red color for emergency
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sosActiveButton: {
    backgroundColor: '#9c1111', // Darker red
  },
  sosButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
});