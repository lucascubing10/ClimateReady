import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc, getDoc, arrayUnion, updateDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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
    // Check if we're running in Expo Go with SDK 53+
    const isExpoGo = Constants.executionEnvironment === 'standalone' || 
                     Constants.executionEnvironment === 'storeClient';
    
    // In Expo Go with SDK 53+, push notifications aren't supported
    if (isExpoGo) {
      console.log('Push notifications are not supported in Expo Go with SDK 53+');
      console.log('Use a development build for push notification functionality');
      return null;
    }
    
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
    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.expoProjectId || process.env.EXPO_PROJECT_ID, // Uses value from environment
      });
      const token = tokenResponse.data;
      
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
    } catch (tokenError) {
      console.error('Error getting push token:', tokenError);
      return null;
    }
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
    console.log('[SOS Notification] Starting emergency notification process', { 
      sessionId: sosSessionId,
      contactsCount: userProfile?.emergencyContacts?.length || 0 
    });
    
    const user = auth.currentUser;
    if (!user) {
      console.error('[SOS Notification] User not authenticated when sending notifications');
      throw new Error('User not authenticated');
    }
    
    // If no emergency contacts, exit
    if (!userProfile?.emergencyContacts || userProfile.emergencyContacts.length === 0) {
      console.warn('[SOS Notification] No emergency contacts to notify');
      return false;
    }
    
    // For each emergency contact that has a push token registered
    for (const contact of userProfile.emergencyContacts) {
      try {
        console.log(`[SOS Notification] Processing contact: ${contact.name} (${contact.phoneNumber})`);
        
        // Check if this contact is registered as an emergency responder
        const responderRef = doc(db, 'emergency_responders', contact.phoneNumber);
        const responderDoc = await getDoc(responderRef);
        
        if (responderDoc.exists()) {
          const pushToken = responderDoc.data().pushToken;
          if (pushToken) {
            console.log(`[SOS Notification] Found push token for ${contact.phoneNumber}`);
            
            // Generate the tracking URL with access token
            const accessToken = await generateAccessTokenIfNeeded(sosSessionId);
            const trackingUrl = `https://sos-live-tracker-map.vercel.app/session/${sosSessionId}?token=${accessToken}`;
            
            console.log(`[SOS Notification] Generated tracking URL with token: ${trackingUrl.substring(0, 60)}...`);
            
            // Add to the notifications collection to be sent by the server
            const notificationRef = doc(db, 'push_notifications', `${sosSessionId}_${contact.phoneNumber}`);
            await setDoc(notificationRef, {
              to: pushToken,
              title: `SOS EMERGENCY: ${userProfile.firstName} ${userProfile.lastName}`,
              body: 'Needs your help! Tap to view their live location.',
              data: {
                url: trackingUrl,
                sosSessionId,
                accessToken, // Include token in notification data
                type: 'sos_alert',
                timestamp: new Date(),
                senderName: `${userProfile.firstName} ${userProfile.lastName}`,
              },
              sendAt: new Date(),
              sent: false,
            });
            
            console.log(`[SOS Notification] Created notification for ${contact.phoneNumber}`);
          } else {
            console.warn(`[SOS Notification] No push token found for ${contact.phoneNumber}`);
          }
        } else {
          console.warn(`[SOS Notification] Contact ${contact.phoneNumber} not registered as responder`);
        }
      } catch (contactError) {
        console.error(`[SOS Notification] Error notifying responder ${contact.phoneNumber}:`, contactError);
        // Continue with next contact
      }
    }
    
    console.log('[SOS Notification] Emergency notifications prepared successfully');
    return true;
  } catch (error) {
    console.error('[SOS Notification] Error notifying emergency responders:', error);
    return false;
  }
}

// Helper function to ensure we have a valid access token
async function generateAccessTokenIfNeeded(sosSessionId: string): Promise<string> {
  try {
    // Get the session document
    const sessionRef = doc(db, 'sos_sessions', sosSessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data();
      
      // Check if there's already a token that's not too old
      if (sessionData.accessToken && sessionData.tokenCreatedAt) {
        const tokenAge = new Date().getTime() - sessionData.tokenCreatedAt.toMillis();
        const tokenAgeHours = tokenAge / (1000 * 60 * 60);
        
        // If token is less than 12 hours old, reuse it
        if (tokenAgeHours < 12) {
          console.log('[SOS Notification] Reusing existing access token');
          return sessionData.accessToken;
        }
      }
    }
    
    // Generate a new secure token (16 characters)
    const tokenChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
      token += tokenChars.charAt(Math.floor(Math.random() * tokenChars.length));
    }
    
    // Update the session with the new token
    await updateDoc(sessionRef, {
      accessToken: token,
      tokenCreatedAt: serverTimestamp()
    });
    
    console.log('[SOS Notification] Generated new access token');
    return token;
  } catch (error) {
    console.error('[SOS Notification] Error generating access token:', error);
    throw error;
  }
}