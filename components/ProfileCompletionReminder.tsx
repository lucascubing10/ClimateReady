import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const STORAGE_KEY = 'profile_reminder_dismissed';

const ProfileCompletionReminder = () => {
  const [visible, setVisible] = useState(false);
  const { userProfile } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Check if the profile needs attention and if reminder has been dismissed recently
    const checkProfileStatus = async () => {
      // Don't show reminders if no user profile
      if (!userProfile) return;
      
      // Get the last time the reminder was dismissed
      const lastDismissedStr = await AsyncStorage.getItem(STORAGE_KEY);
      const lastDismissed = lastDismissedStr ? parseInt(lastDismissedStr, 10) : 0;
      
      // If dismissed within the last 24 hours, don't show again
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (Date.now() - lastDismissed < ONE_DAY) return;
      
      // Only show reminder if profile is less than 70% complete
      const completeness = userProfile.profileCompleteness || 0;
      if (completeness < 70) {
        setVisible(true);
      }
    };
    
    checkProfileStatus();
  }, [userProfile]);
  
  const handleDismiss = async () => {
    // Save the current time as the last dismissed time
    await AsyncStorage.setItem(STORAGE_KEY, Date.now().toString());
    setVisible(false);
  };
  
  const handleComplete = () => {
    router.push('/(tabs)/edit-profile' as any);
    setVisible(false);
  };
  
  // Don't render anything if not visible or no user profile
  if (!visible || !userProfile) return null;
  
  // Get missing critical items
  const missingItems = [];
  if (!userProfile.phoneNumber) missingItems.push('phone number');
  if (!userProfile.hasAddedEmergencyContact) missingItems.push('emergency contact');
  if (!userProfile.preferredLanguage) missingItems.push('language preference');
  if (!userProfile.householdType) missingItems.push('household type');
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={48} color="#f59e0b" />
          </View>
          
          <Text style={styles.title}>Complete Your Profile</Text>
          
          <Text style={styles.description}>
            Your profile is {userProfile.profileCompleteness || 0}% complete.
            {missingItems.length > 0 ? (
              <Text>
                {' '}Please add your {missingItems.join(', ')} to ensure we can help you in an emergency.
              </Text>
            ) : (
              ' Adding more details will help ensure your safety during emergencies.'
            )}
          </Text>
          
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
          >
            <Text style={styles.completeButtonText}>Complete Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.laterButton}
            onPress={handleDismiss}
          >
            <Text style={styles.laterButtonText}>Remind Me Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  completeButton: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  laterButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});

export default ProfileCompletionReminder;