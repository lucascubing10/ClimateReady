import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type { SafeZone } from '../types';

const SAFE_ZONES_COLLECTION = 'safe_zones';

interface SafeZoneDocument {
  name: string;
  type: SafeZone['type'];
  latitude: number;
  longitude: number;
  address?: string;
  phoneNumber?: string;
  website?: string;
  isActive?: boolean;
}

export const fetchFirestoreSafeZones = async (): Promise<SafeZone[]> => {
  try {
    const snapshot = await getDocs(collection(db, SAFE_ZONES_COLLECTION));

    if (snapshot.empty) {
      return [];
    }

    const zones: SafeZone[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as SafeZoneDocument;
      if (!data?.name || !data?.type || !data?.latitude || !data?.longitude) {
        return;
      }
      if (data.isActive === false) {
        return;
      }

      zones.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        location: {
          lat: data.latitude,
          lng: data.longitude,
        },
        address: data.address,
        phoneNumber: data.phoneNumber,
        website: data.website,
        source: 'firestore',
      });
    });

    return zones;
  } catch (error) {
    console.error('Failed to load safe zones from Firestore', error);
    return [];
  }
};
