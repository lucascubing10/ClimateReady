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

// Initialize Firestore
export const db = getFirestore(app);

// Firebase collections references
export const usersCollection = collection(db, 'users');

// Helper functions to work with users collection
export const getUserDocRef = (userId) => doc(db, 'users', userId);
export const createUserDocument = (userId, userData) => setDoc(doc(db, 'users', userId), userData);
export const updateUserDocument = (userId, userData) => updateDoc(doc(db, 'users', userId), userData);
export const getUserDocument = (userId) => getDoc(doc(db, 'users', userId));