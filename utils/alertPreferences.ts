import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trigger } from './alerts/weatherThresholds';
import { auth, getUserDocument, updateUserDocument } from '../firebaseConfig';

const TTS_STORAGE_KEY = 'weather_alert_tts_enabled_v1';

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
        const remoteTts = userDoc?.exists() ? (userDoc.data()?.alertTextToSpeechEnabled as boolean | undefined) : undefined;
        if (remote) {
          const sanitized = sanitizePreferences(remote);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          if (typeof remoteTts === 'boolean') {
            await AsyncStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(remoteTts));
          }
          return sanitized;
        }
        if (typeof remoteTts === 'boolean') {
          await AsyncStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(remoteTts));
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

export async function getAlertTextToSpeechEnabled(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (user) {
      try {
        const doc = await getUserDocument(user.uid);
        if (doc?.exists()) {
          const remoteValue = doc.data()?.alertTextToSpeechEnabled;
          if (typeof remoteValue === 'boolean') {
            await AsyncStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(remoteValue));
            return remoteValue;
          }
        }
      } catch (error) {
        console.warn('[alertPreferences] Failed to load speech preference from Firestore, using cache', error);
      }
    }

    const stored = await AsyncStorage.getItem(TTS_STORAGE_KEY);
    if (stored !== null) {
      try {
        return Boolean(JSON.parse(stored));
      } catch (error) {
        return stored === 'true';
      }
    }
  } catch (error) {
    console.warn('[alertPreferences] Failed to load text-to-speech preference, defaulting to false', error);
  }
  return false;
}

export async function saveAlertTextToSpeechPreference(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TTS_STORAGE_KEY, JSON.stringify(!!enabled));
  } catch (error) {
    console.warn('[alertPreferences] Failed to persist speech preference locally', error);
  }

  const user = auth.currentUser;
  if (user) {
    try {
      await updateUserDocument(user.uid, { alertTextToSpeechEnabled: !!enabled });
    } catch (error) {
      console.warn('[alertPreferences] Failed to sync speech preference to Firestore', error);
    }
  }
}
