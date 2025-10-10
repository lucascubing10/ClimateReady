import { Platform } from 'react-native';
import Constants from 'expo-constants';

const explicit = (process as any)?.env?.EXPO_PUBLIC_API_BASE;

function resolveDevHost(): string {
  const hostUri =
    (Constants as any).expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.developer?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest?.hostUri;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return host;
  }
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
}

function buildDevBase() {
  if (explicit) return explicit; // public override (Railway / tunnel)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:4000`;
  }
  return `http://${resolveDevHost()}:4000`; // LAN / emulator
}

// Production uses explicit first, else your Railway domain.
const PROD_DEFAULT = 'https://climateready-production.up.railway.app';

export const API_BASE = __DEV__ ? buildDevBase() : (explicit || PROD_DEFAULT);

export const debugApiBaseInfo = { explicit, resolved: API_BASE };
// You can temporarily uncomment to verify at runtime:
// console.log('[API_BASE]', debugApiBaseInfo);