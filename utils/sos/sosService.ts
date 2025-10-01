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
    console.log('[SOS Service] Starting SOS session for user', userId);
    
    // Verify user profile exists
    if (!userProfile) {
      console.error('[SOS Service] Cannot start SOS session: User profile is missing');
      return null;
    }
    
    // Get SOS settings
    const settingsStr = await AsyncStorage.getItem(SOS_SETTINGS_KEY);
    const settings: SOSSettings = settingsStr ? JSON.parse(settingsStr) : DEFAULT_SOS_SETTINGS;
    console.log('[SOS Service] Using SOS settings:', settings);
    
    // Create user info based on settings
    const userInfo: any = {
      name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`,
    };
    console.log('[SOS Service] User name for SOS:', userInfo.name);
    
    // Add medical info based on settings
    if (settings.shareBloodType && userProfile.medicalInfo?.bloodType) {
      userInfo.bloodType = userProfile.medicalInfo.bloodType;
      console.log('[SOS Service] Including blood type:', userInfo.bloodType);
    }
    
    if (settings.shareAllergies && userProfile.medicalInfo?.allergies) {
      userInfo.allergies = userProfile.medicalInfo.allergies;
      console.log('[SOS Service] Including allergies:', userInfo.allergies.length, 'entries');
    }
    
    if (settings.shareMedicalConditions && userProfile.medicalInfo?.conditions) {
      userInfo.medicalConditions = userProfile.medicalInfo.conditions;
      console.log('[SOS Service] Including medical conditions:', userInfo.medicalConditions.length, 'entries');
    }
    
    if (settings.shareMedications && userProfile.medicalInfo?.medications) {
      userInfo.medications = userProfile.medicalInfo.medications;
      console.log('[SOS Service] Including medications:', userInfo.medications.length, 'entries');
    }
    
    if (settings.shareNotes && userProfile.medicalInfo?.notes) {
      userInfo.notes = userProfile.medicalInfo.notes;
      console.log('[SOS Service] Including notes:', userInfo.notes ? 'Yes' : 'No');
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
      console.log('[SOS Service] Including age:', userInfo.age);
    }
    
    // Generate a stronger initial token - 16 chars, alphanumeric
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let initialToken = '';
    for (let i = 0; i < 16; i++) {
      initialToken += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    console.log('[SOS Service] Generated initial access token:', initialToken);
    
    // Create the session document
    const session: Partial<SOSSession> = {
      userId,
      active: true,
      startTime: Timestamp.now(),
      userInfo,
      accessToken: initialToken,
      tokenCreatedAt: Timestamp.now(),
    };
    
    console.log('[SOS Service] Creating new session document in Firestore');
    const docRef = await addDoc(collection(db, 'sos_sessions'), session);
    const sessionId = docRef.id;
    console.log('[SOS Service] SOS session created with ID:', sessionId);
    
    // Verify the document was created successfully
    const sessionDoc = await getDoc(docRef);
    if (!sessionDoc.exists()) {
      console.error('[SOS Service] Failed to create SOS session document');
      return null;
    }
    
    // Double-check that the access token was properly saved
    const sessionData = sessionDoc.data();
    console.log('[SOS Service] Verifying token was saved:', 
      sessionData.accessToken ? 'Success' : 'Failed',
      'Token:', sessionData.accessToken?.substring(0, 5) + '...'
    );
    
    // Store the active session ID in AsyncStorage
    await AsyncStorage.setItem(SOS_ACTIVE_KEY, sessionId);
    console.log('[SOS Service] Session ID stored in AsyncStorage');
    
    return sessionId;
  } catch (error) {
    console.error('[SOS Service] Error starting SOS session:', error);
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
    console.log('[SOS Service] Generating secure access token for session:', sessionId);
    
    // Create a unique token based on session ID and current timestamp
    const tokenBase = sessionId + Date.now().toString();
    
    // Use expo-crypto to generate a secure hash
    const token = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      tokenBase
    );
    
    // Take first 16 chars for a shorter URL-friendly token
    const shortenedToken = token.substring(0, 16);
    console.log('[SOS Service] Generated token:', shortenedToken);
    
    // Update the session with the token
    const sessionRef = doc(db, 'sos_sessions', sessionId);
    await updateDoc(sessionRef, {
      accessToken: shortenedToken,
      tokenCreatedAt: Timestamp.now(),
    });
    
    console.log('[SOS Service] Token saved to session document');
    return shortenedToken;
  } catch (error) {
    console.error('[SOS Service] Error generating secure token:', error);
    throw error; // Don't silently fail, propagate the error
  }
}

// Create SOS tracking link with secure token
export async function createSOSTrackingLink(sessionId: string): Promise<string> {
  console.log('[SOS Service] Creating SOS tracking link for session:', sessionId);
  
  try {
    // Generate secure token for this session
    const accessToken = await generateSecureToken(sessionId);
    
    // Get the SOS web app URL from environment variables
    const sosWebAppUrl = Constants.expoConfig?.extra?.sosWebAppUrl || 'https://sos-live-tracker-map.vercel.app';
    
    const trackingLink = `${sosWebAppUrl}/session/${sessionId}?token=${accessToken}`;
    console.log('[SOS Service] Created tracking link:', trackingLink);
    
    return trackingLink;
  } catch (error) {
    console.error('[SOS Service] Error creating tracking link:', error);
    throw error;
  }
}