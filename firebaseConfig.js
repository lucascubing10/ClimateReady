// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, collection, addDoc, getDoc, setDoc, doc, updateDoc, query, where, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB40FDC0EdiQIi2yOAmNUeK5qxRf2NTcnI",
  authDomain: "climateready-40665.firebaseapp.com",
  projectId: "climateready-40665",
  storageBucket: "climateready-40665.firebasestorage.app",
  messagingSenderId: "438204560483",
  appId: "1:438204560483:web:76dd8e0a5f5551e85fb456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = Platform.OS === 'web' 
  ? getAuth(app) 
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Export app for reference if needed
export const firebaseApp = app;

// Initialize Firestore with offline persistence
export const db = getFirestore(app);

// Enable offline persistence
import { enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

// Only enable persistence for non-web platforms or in production on web
if (Platform.OS !== 'web' || process.env.NODE_ENV === 'production') {
  enableIndexedDbPersistence(db, {cacheSizeBytes: CACHE_SIZE_UNLIMITED})
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        console.warn('Firestore persistence failed to enable: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser doesn't support IndexedDB persistence
        console.warn('Firestore persistence is not supported in this environment');
      }
    });
}

// Firebase collections references
export const usersCollection = collection(db, 'users');

// Helper functions to work with users collection
export const getUserDocRef = (userId) => doc(db, 'users', userId);

// Create user document with error handling
export const createUserDocument = async (userId, userData) => {
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, userData);
    return { success: true };
  } catch (error) {
    console.error("Error creating user document: ", error);
    // Store data locally if offline
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.warn('Device is offline, changes will sync when back online');
      // We're relying on Firestore's offline persistence here
    }
    return { success: false, error };
  }
};

// Update user document with error handling
export const updateUserDocument = async (userId, userData) => {
  try {
    // Clean the userData object to remove any undefined values
    // Firebase doesn't accept undefined values
    const cleanUserData = {};
    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        // Special handling for arrays
        if (Array.isArray(userData[key])) {
          console.log(`Processing array field ${key}:`, JSON.stringify(userData[key]));
          cleanUserData[key] = userData[key];
        } else if (typeof userData[key] === 'object' && userData[key] !== null) {
          // Handle nested objects (but not arrays)
          const cleanNestedObj = {};
          Object.keys(userData[key]).forEach(nestedKey => {
            if (userData[key][nestedKey] !== undefined) {
              cleanNestedObj[nestedKey] = userData[key][nestedKey];
            }
          });
          cleanUserData[key] = cleanNestedObj;
        } else {
          cleanUserData[key] = userData[key];
        }
      }
    });
    
    console.log('Sending to Firestore:', JSON.stringify(cleanUserData));
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, cleanUserData);
    return { success: true };
  } catch (error) {
    console.error("Error updating user document: ", error);
    // Store data locally if offline
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.warn('Device is offline, changes will sync when back online');
      // We're relying on Firestore's offline persistence here
    }
    return { success: false, error };
  }
};

// Get user document with error handling
export const getUserDocument = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot;
  } catch (error) {
    console.error("Error getting user document: ", error);
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.warn('Device is offline, returning cached data if available');
      // Try to get from cache if available - getDoc should return cached data when offline
      // but we explicitly handle the error to prevent app crashes
    }
    throw error;
  }
};