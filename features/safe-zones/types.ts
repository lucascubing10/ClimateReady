export type SafeZoneCategory = 'hospital' | 'shelter';

export type SafeZoneSource = 'google' | 'firestore';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SafeZoneMetadata {
  address?: string;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
}

export interface SafeZone extends SafeZoneMetadata {
  id: string;
  name: string;
  type: SafeZoneCategory;
  location: Coordinates;
  distanceMeters?: number;
  source: SafeZoneSource;
  placeId?: string;
}

export interface SafeZoneFilter {
  categories: SafeZoneCategory[];
  maxDistanceKm: number;
}
