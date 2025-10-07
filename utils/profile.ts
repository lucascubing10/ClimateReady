// utils/profile.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'user_household_profile';

export async function saveUserProfile(profile: any) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getUserProfile(): Promise<any> {
  const stored = await AsyncStorage.getItem(PROFILE_KEY);
  if (stored) return JSON.parse(stored);
  // Default profile
  return {
    adults: 2,
    children: 0,
    elderly: 0,
    pets: 0,
    specialNeeds: [],
    region: '',
    riskProfile: [],
  };
}
