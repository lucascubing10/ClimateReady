import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, getDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const PUSH_TOKEN_KEY = 'push_notification_token';
const EMERGENCY_NOTIFICATIONS_KEY = 'emergency_notifications_enabled';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Register for push notifications and get token
export async function registerForPushNotifications() {
  try {
    // Check permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If not determined, ask for permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If not granted, exit
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token: permission not granted');
      return null;
    }
    
    // Get token
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Replace with your Expo project ID
    })).data;
    
    // Store token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    
    // Configure for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF453A',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }
    
    // Save token to user document if logged in
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        pushTokens: arrayUnion(token),
        pushTokenUpdated: new Date()
      });
    }
    
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Toggle emergency notifications for responders
export async function toggleEmergencyNotifications(enabled: boolean) {
  try {
    await AsyncStorage.setItem(EMERGENCY_NOTIFICATIONS_KEY, JSON.stringify(enabled));
    return true;
  } catch (error) {
    console.error('Error toggling emergency notifications:', error);
    return false;
  }
}

// Check if emergency notifications are enabled
export async function isEmergencyNotificationsEnabled() {
  try {
    const value = await AsyncStorage.getItem(EMERGENCY_NOTIFICATIONS_KEY);
    return value !== null ? JSON.parse(value) : true; // Default to true
  } catch (error) {
    console.error('Error checking emergency notifications status:', error);
    return true; // Default to true in case of error
  }
}

// Send local notification
export async function sendLocalNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
      },
      trigger: null, // Send immediately
    });
    return true;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return false;
  }
}

// Add an emergency responder (stores their push token)
export async function addEmergencyResponder(contactId: string, pushToken: string) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const emergencyResponderRef = doc(db, 'emergency_responders', contactId);
    
    // Create or update the responder document
    await setDoc(emergencyResponderRef, {
      userId: user.uid,
      contactId,
      pushToken,
      addedAt: new Date(),
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error adding emergency responder:', error);
    return false;
  }
}

// Send notification to emergency responders
export async function notifyEmergencyResponders(sosSessionId: string, userProfile: any) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    // If no emergency contacts, exit
    if (!userProfile?.emergencyContacts || userProfile.emergencyContacts.length === 0) {
      return false;
    }
    
    // For each emergency contact that has a push token registered
    for (const contact of userProfile.emergencyContacts) {
      try {
        // Check if this contact is registered as an emergency responder
        const responderRef = doc(db, 'emergency_responders', contact.phoneNumber);
        const responderDoc = await getDoc(responderRef);
        
        if (responderDoc.exists() && responderDoc.data().pushToken) {
          // Add to the notifications collection to be sent by the server
          const notificationRef = doc(db, 'push_notifications', `${sosSessionId}_${contact.phoneNumber}`);
          await setDoc(notificationRef, {
            to: responderDoc.data().pushToken,
            title: `SOS EMERGENCY: ${userProfile.firstName} ${userProfile.lastName}`,
            body: 'Needs your help! Tap to view their live location.',
            data: {
              url: `/session/${sosSessionId}`,
              sosSessionId,
              type: 'sos_alert',
              timestamp: new Date(),
              senderName: `${userProfile.firstName} ${userProfile.lastName}`,
            },
            sendAt: new Date(),
            sent: false,
          });
        }
      } catch (contactError) {
        console.error(`Error notifying responder ${contact.phoneNumber}:`, contactError);
        // Continue with next contact
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error notifying emergency responders:', error);
    return false;
  }
}