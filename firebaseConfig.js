// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
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
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, userData);
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
    const docSnapshot = await getDoc(doc(db, 'users', userId));
    return docSnapshot;
  } catch (error) {
    console.error("Error getting user document: ", error);
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.warn('Device is offline, returning cached data if available');
    }
    throw error;
  }
};