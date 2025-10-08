import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

import type { Coordinates, SafeZone, SafeZoneCategory } from '../types';
import { fetchGoogleSafeZones } from '../services/googlePlaces';
import { fetchFirestoreSafeZones } from '../services/firestore';
import { calculateDistanceMeters } from '../utils/distance';

export interface UseSafeZonesOptions {
  initialRadiusKm?: number;
}

const SUPPORTED_CATEGORIES: SafeZoneCategory[] = ['hospital', 'shelter'];
const MAX_FETCH_RADIUS_METERS = 10000; // 10km fetch radius for baseline data

const getGoogleMapsApiKey = (): string | undefined => {
  const extras = Constants.expoConfig?.extra ?? null;
  const extraKey =
    typeof extras === 'object' && extras && 'googleMapsApiKey' in extras
      ? (extras as Record<string, unknown>).googleMapsApiKey
      : undefined;

  return (
    (typeof extraKey === 'string' ? extraKey : undefined) ??
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.VITE_GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY
  );
};

interface UseSafeZonesState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasLocationPermission: boolean;
  userLocation: Coordinates | null;
  safeZones: SafeZone[];
  filteredSafeZones: SafeZone[];
  selectedCategories: SafeZoneCategory[];
  radiusKm: number;
  requestPermission: () => Promise<boolean>;
  refresh: () => Promise<void>;
  toggleCategory: (category: SafeZoneCategory) => void;
  clearFilters: () => void;
  setRadiusKm: (radius: number) => void;
}

export const useSafeZones = ({ initialRadiusKm = 5 }: UseSafeZonesOptions = {}): UseSafeZonesState => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<SafeZoneCategory[]>([...SUPPORTED_CATEGORIES]);
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm);

  const abortControllerRef = useRef<AbortController | null>(null);

  const apiKey = useMemo(() => getGoogleMapsApiKey(), []);

  const computeUserLocation = useCallback(async (): Promise<Coordinates | null> => {
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return { lat: current.coords.latitude, lng: current.coords.longitude };
    } catch (locationError) {
      console.warn('Failed to get user location', locationError);
      setError('Unable to determine your current location. Please try again.');
      return null;
    }
  }, []);

  const hydrateSafeZones = useCallback(
    async (location: Coordinates, signal?: AbortSignal) => {
      if (!apiKey) {
        setError('Missing Google Maps API key. Please configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.');
        setSafeZones([]);
        return;
      }

      try {
        setError(null);
        const [googleSafeZones, firestoreSafeZones] = await Promise.all([
          fetchGoogleSafeZones({
            location,
            radiusMeters: MAX_FETCH_RADIUS_METERS,
            apiKey,
            categories: SUPPORTED_CATEGORIES,
            signal,
          }),
          fetchFirestoreSafeZones(),
        ]);

        const combined = [...googleSafeZones, ...firestoreSafeZones];

        const withDistances = combined.map((zone) => ({
          ...zone,
          distanceMeters: calculateDistanceMeters(location, zone.location),
        }));

        setSafeZones(withDistances);
      } catch (fetchError) {
        console.error('Failed to load safe zones', fetchError);
        if ((fetchError as Error).name === 'AbortError') {
          return;
        }
        setError('We had trouble loading nearby safe zones. Please try again later.');
        setSafeZones([]);
      }
    },
    [apiKey],
  );

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === Location.PermissionStatus.GRANTED;
    setHasLocationPermission(granted);

    if (!granted) {
      setError('Location permission is required to show nearby safe zones.');
      return false;
    }

    const coords = await computeUserLocation();
    if (!coords) {
      return false;
    }
    setUserLocation(coords);
    return true;
  }, [computeUserLocation]);

  const refresh = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    setIsRefreshing(true);
    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      await hydrateSafeZones(userLocation, controller.signal);
    } finally {
      setIsRefreshing(false);
    }
  }, [hydrateSafeZones, userLocation]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const granted = await requestPermission();
      if (!granted && !cancelled) {
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      abortControllerRef.current?.abort();
    };
  }, [requestPermission]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    hydrateSafeZones(userLocation, controller.signal).finally(() => {
      setIsLoading(false);
    });
  }, [hydrateSafeZones, userLocation]);

  const filteredSafeZones = useMemo(() => {
    const activeCategories = new Set(selectedCategories);
    return safeZones.filter((zone) => {
      if (!activeCategories.has(zone.type)) {
        return false;
      }
      if (zone.distanceMeters === undefined) {
        return true;
      }
      return zone.distanceMeters <= radiusKm * 1000;
    });
  }, [safeZones, selectedCategories, radiusKm]);

  const toggleCategory = useCallback((category: SafeZoneCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      }
      return [...prev, category];
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([...SUPPORTED_CATEGORIES]);
    setRadiusKm(initialRadiusKm);
  }, [initialRadiusKm]);

  return {
    isLoading,
    isRefreshing,
    error,
    hasLocationPermission,
    userLocation,
    safeZones,
    filteredSafeZones,
    selectedCategories,
    radiusKm,
    requestPermission,
    refresh,
    toggleCategory,
    clearFilters,
    setRadiusKm,
  };
};
