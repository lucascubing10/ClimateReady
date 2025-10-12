import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trigger } from './alerts/weatherThresholds';
import { auth, getUserDocument, updateUserDocument } from '../firebaseConfig';

export type AlertType = Trigger['type'];

export type AlertPreferenceMap = Record<AlertType, boolean>;

const STORAGE_KEY = 'weather_alert_preferences_v1';

export const DEFAULT_ALERT_PREFERENCES: AlertPreferenceMap = {
  rain: true,
  wind: true,
  'temp-high': true,
  'temp-low': true,
};

export const ALERT_TYPE_ORDER: AlertType[] = ['rain', 'wind', 'temp-high', 'temp-low'];

function sanitizePreferences(input: Partial<AlertPreferenceMap> | null | undefined): AlertPreferenceMap {
  const merged: AlertPreferenceMap = { ...DEFAULT_ALERT_PREFERENCES };
  if (input && typeof input === 'object') {
    for (const key of ALERT_TYPE_ORDER) {
      if (typeof input[key] === 'boolean') {
        merged[key] = input[key] as boolean;
      }
    }
  }
  return merged;
}

export async function getAlertPreferences(): Promise<AlertPreferenceMap> {
  try {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getUserDocument(user.uid);
        const remote = userDoc?.exists() ? (userDoc.data()?.alertPreferences as Partial<AlertPreferenceMap> | undefined) : undefined;
        if (remote) {
          const sanitized = sanitizePreferences(remote);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          return sanitized;
        }
      } catch (error) {
        console.warn('[alertPreferences] Failed to load from Firestore, falling back to local cache', error);
      }
    }

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AlertPreferenceMap>;
      return sanitizePreferences(parsed);
    }
  } catch (error) {
    console.warn('[alertPreferences] Failed to load preferences, using defaults', error);
  }

  return { ...DEFAULT_ALERT_PREFERENCES };
}

export async function saveAlertPreferences(preferences: AlertPreferenceMap): Promise<void> {
  const sanitized = sanitizePreferences(preferences);

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch (error) {
    console.warn('[alertPreferences] Failed to persist preferences locally', error);
  }

  const user = auth.currentUser;
  if (user) {
    try {
      await updateUserDocument(user.uid, { alertPreferences: sanitized });
    } catch (error) {
      console.warn('[alertPreferences] Failed to sync preferences to Firestore', error);
    }
  }
}

export function countEnabledPreferences(preferences: AlertPreferenceMap): number {
  return ALERT_TYPE_ORDER.reduce((acc, key) => (preferences[key] ? acc + 1 : acc), 0);
}
