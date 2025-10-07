import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This function returns a promise with the user profile (for non-hook usage)
export async function getUserProfile() {
  // If you store the profile in AsyncStorage or a global singleton, fetch it here.
  // Otherwise, you may need to expose a static getter from your AuthContext.
  // For now, let's assume you store it in localStorage or AsyncStorage:
  try {
    const profileStr = await AsyncStorage.getItem('userProfile');
    if (profileStr) return JSON.parse(profileStr);
  } catch (e) {
    // fallback: return minimal user
    return { username: 'User' };
  }
  return { username: 'User' };
}