import type { SafeZoneCategory } from './types';

export const CATEGORY_COLORS: Record<SafeZoneCategory, string> = {
  hospital: '#ef4444',
  shelter: '#2563eb',
};

export const CATEGORY_LABELS: Record<SafeZoneCategory, string> = {
  hospital: 'Hospitals',
  shelter: 'Shelters',
};

export const DEFAULT_RADIUS_KM = 5;
export const RADIUS_OPTIONS = [2, 5, 10, 20];

export const FALLBACK_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

export const computeRegionDelta = (latitude: number, radiusKm: number) => {
  const safeRadius = Math.max(radiusKm, 0.5);
  const latitudeDelta = Math.max(safeRadius / 111, 0.02);
  const longitudeDelta = Math.max(
    safeRadius / (111 * Math.cos((latitude * Math.PI) / 180)),
    0.02,
  );

  return { latitudeDelta, longitudeDelta };
};
