import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

// SOS Session interface
export interface SOSSession {
  userId: string;
  startTime: Timestamp;
  active: boolean;
  accessToken?: string;
  tokenCreatedAt?: Timestamp;
  endTime?: Timestamp;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: Timestamp;
  };
  userInfo?: {
    name: string;
    bloodType?: string;
    age?: number;
    medicalConditions?: string[];
    allergies?: string[];
    medications?: string[];
    notes?: string;
  };
}

// Keys for AsyncStorage
export const SOS_ACTIVE_KEY = 'sos_active_session';
export const SOS_SETTINGS_KEY = 'sos_settings';

// Default SOS Settings
export const DEFAULT_SOS_SETTINGS = {
  shareBloodType: true,
  shareAllergies: true,
  shareMedicalConditions: true,
  shareMedications: true,
  shareNotes: false,
  shareAge: true,
};

// Interface for SOS Settings
export interface SOSSettings {
  shareBloodType: boolean;
  shareAllergies: boolean;
  shareMedicalConditions: boolean;
  shareMedications: boolean;
  shareNotes: boolean;
  shareAge: boolean;
}

// Create a new SOS session
export async function startSOSSession(userId: string, userProfile: any): Promise<string | null> {
  try {
    // Get SOS settings
    const settingsStr = await AsyncStorage.getItem(SOS_SETTINGS_KEY);
    const settings: SOSSettings = settingsStr ? JSON.parse(settingsStr) : DEFAULT_SOS_SETTINGS;
    
    // Create user info based on settings
    const userInfo: any = {
      name: `${userProfile.firstName} ${userProfile.lastName}`,
    };
    
    if (settings.shareBloodType && userProfile.medicalInfo?.bloodType) {
      userInfo.bloodType = userProfile.medicalInfo.bloodType;
    }
    
    if (settings.shareAllergies && userProfile.medicalInfo?.allergies) {
      userInfo.allergies = userProfile.medicalInfo.allergies;
    }
    
    if (settings.shareMedicalConditions && userProfile.medicalInfo?.conditions) {
      userInfo.medicalConditions = userProfile.medicalInfo.conditions;
    }
    
    if (settings.shareMedications && userProfile.medicalInfo?.medications) {
      userInfo.medications = userProfile.medicalInfo.medications;
    }
    
    if (settings.shareNotes && userProfile.medicalInfo?.notes) {
      userInfo.notes = userProfile.medicalInfo.notes;
    }
    
    if (settings.shareAge && userProfile.birthday) {
      const birthdate = new Date(userProfile.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthdate.getFullYear();
      const monthDiff = today.getMonth() - birthdate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
        age--;
      }
      userInfo.age = age;
    }
    
    // Generate a random initial token
    const initialToken = Math.random().toString(36).substring(2, 10) +
                       Math.random().toString(36).substring(2, 10);
    
    // Create the session document
    const session: Partial<SOSSession> = {
      userId,
      active: true,
      startTime: Timestamp.now(),
      userInfo,
      accessToken: initialToken,
      tokenCreatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'sos_sessions'), session);
    const sessionId = docRef.id;
    
    // Store the active session ID in AsyncStorage
    await AsyncStorage.setItem(SOS_ACTIVE_KEY, sessionId);
    
    return sessionId;
  } catch (error) {
    console.error('Error starting SOS session:', error);
    return null;
  }
}

// Update location for active SOS session
export async function updateSOSLocation(location: {
  latitude: number;
  longitude: number;
  accuracy?: number;
}): Promise<boolean> {
  try {
    const sessionId = await AsyncStorage.getItem(SOS_ACTIVE_KEY);
    
    if (!sessionId) {
      console.log('No active SOS session found');
      return false;
    }
    
    const sessionRef = doc(db, 'sos_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists() || !sessionSnap.data().active) {
      console.log('SOS session not found or not active');
      await AsyncStorage.removeItem(SOS_ACTIVE_KEY);
      return false;
    }
    
    await updateDoc(sessionRef, {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: Timestamp.now(),
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error updating SOS location:', error);
    return false;
  }
}

// End active SOS session
export async function endSOSSession(): Promise<boolean> {
  try {
    const sessionId = await AsyncStorage.getItem(SOS_ACTIVE_KEY);
    
    if (!sessionId) {
      console.log('No active SOS session found');
      return false;
    }
    
    const sessionRef = doc(db, 'sos_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      console.log('SOS session not found');
      await AsyncStorage.removeItem(SOS_ACTIVE_KEY);
      return false;
    }
    
    await updateDoc(sessionRef, {
      active: false,
      endTime: Timestamp.now(),
    });
    
    await AsyncStorage.removeItem(SOS_ACTIVE_KEY);
    return true;
  } catch (error) {
    console.error('Error ending SOS session:', error);
    return false;
  }
}

// Check if there is an active SOS session
export async function checkActiveSOSSession(): Promise<string | null> {
  try {
    const sessionId = await AsyncStorage.getItem(SOS_ACTIVE_KEY);
    
    if (!sessionId) {
      return null;
    }
    
    const sessionRef = doc(db, 'sos_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists() || !sessionSnap.data().active) {
      await AsyncStorage.removeItem(SOS_ACTIVE_KEY);
      return null;
    }
    
    return sessionId;
  } catch (error) {
    console.error('Error checking active SOS session:', error);
    return null;
  }
}

// Save SOS settings
export async function saveSOSSettings(settings: SOSSettings): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SOS_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving SOS settings:', error);
    return false;
  }
}

// Get SOS settings
export async function getSOSSettings(): Promise<SOSSettings> {
  try {
    const settings = await AsyncStorage.getItem(SOS_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : DEFAULT_SOS_SETTINGS;
  } catch (error) {
    console.error('Error getting SOS settings:', error);
    return DEFAULT_SOS_SETTINGS;
  }
}

// Generate a secure access token
export async function generateSecureToken(sessionId: string): Promise<string> {
  try {
    // Create a unique token based on session ID and current timestamp
    const tokenBase = sessionId + Date.now().toString();
    
    // Use expo-crypto to generate a secure hash
    const token = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      tokenBase
    );
    
    // Update the session with the token
    const sessionRef = doc(db, 'sos_sessions', sessionId);
    await updateDoc(sessionRef, {
      accessToken: token.substring(0, 16), // Use first 16 chars for shorter URL
      tokenCreatedAt: Timestamp.now(),
    });
    
    return token.substring(0, 16);
  } catch (error) {
    console.error('Error generating secure token:', error);
    return sessionId; // Fallback to using session ID if token generation fails
  }
}

// Create SOS tracking link with secure token
export async function createSOSTrackingLink(sessionId: string): Promise<string> {
  // Generate secure token for this session
  const accessToken = await generateSecureToken(sessionId);
  
  // Get the SOS web app URL from environment variables, or use a default
  const sosWebAppUrl = Constants.expoConfig?.extra?.sosWebAppUrl ;
  
  return `${sosWebAppUrl}/session/${sessionId}?token=${accessToken}`;
}