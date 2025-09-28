// Utility file to debug Firebase Auth issues
import { getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Debug function to check Firebase apps and auth instances
export async function debugFirebaseAuth() {
  console.log("=== DEBUG AUTH START ===");
  
  // Check for multiple Firebase apps
  const apps = getApps();
  console.log(`Number of Firebase apps: ${apps.length}`);
  apps.forEach((app, index) => {
    console.log(`App ${index} name: ${app.name}`);
  });
  
  // Check auth instance
  const auth = getAuth();
  console.log(`Auth current user: ${auth.currentUser ? auth.currentUser.email : 'none'}`);
  console.log(`Auth persistence: ${auth.persistenceManager?.type || 'unknown'}`);
  
  // Check AsyncStorage
  try {
    const isAuthenticated = await AsyncStorage.getItem('user_authenticated');
    console.log(`AsyncStorage user_authenticated: ${isAuthenticated}`);
    
    // List all keys in AsyncStorage to check for auth-related items
    const keys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', keys);
    
    // Check for any Firebase auth persistence items
    const firebaseKeys = keys.filter(key => key.includes('firebase'));
    console.log('Firebase-related AsyncStorage keys:', firebaseKeys);
    
    // Check for any auth-related items
    const authKeys = keys.filter(key => key.toLowerCase().includes('auth'));
    console.log('Auth-related AsyncStorage keys:', authKeys);
  } catch (error) {
    console.error('AsyncStorage error:', error);
  }
  
  console.log("=== DEBUG AUTH END ===");
}