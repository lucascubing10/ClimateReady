import type { Coordinates, SafeZone } from '../types';

export interface SafeZoneMapHandle {
  focusOnLocation: (coords: Coordinates, radiusKm?: number) => void;
}

export interface SafeZoneMapProps {
  userLocation: Coordinates | null;
  safeZones: SafeZone[];
  selectedZoneId: string | null;
  radiusKm: number;
  onSelectZone: (zone: SafeZone) => void;
  onReady?: () => void;
}
