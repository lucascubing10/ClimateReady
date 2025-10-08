import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useSafeZones } from '@/features/safe-zones/hooks/useSafeZones';
import type { SafeZone, SafeZoneCategory } from '@/features/safe-zones/types';
import { SafeZoneCard } from '@/features/safe-zones/components/SafeZoneCard';

const CATEGORY_COLORS: Record<SafeZoneCategory, string> = {
  hospital: '#ef4444',
  shelter: '#2563eb',
};

const CATEGORY_LABELS: Record<SafeZoneCategory, string> = {
  hospital: 'Hospitals',
  shelter: 'Shelters',
};

const DEFAULT_RADIUS_KM = 5;
const RADIUS_OPTIONS = [2, 5, 10, 20];
const FALLBACK_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

const computeRegionDelta = (latitude: number, radiusKm: number) => {
  const safeRadius = Math.max(radiusKm, 0.5);
  const latitudeDelta = Math.max(safeRadius / 111, 0.02);
  const longitudeDelta = Math.max(
    safeRadius / (111 * Math.cos((latitude * Math.PI) / 180)),
    0.02,
  );

  return { latitudeDelta, longitudeDelta };
};

const SafeZonesScreen: React.FC = () => {
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const {
    isLoading,
    isRefreshing,
    error,
    hasLocationPermission,
    userLocation,
    filteredSafeZones,
    selectedCategories,
    radiusKm,
    requestPermission,
    refresh,
    toggleCategory,
    clearFilters,
    setRadiusKm,
  } = useSafeZones({ initialRadiusKm: DEFAULT_RADIUS_KM });

  const hasSafeZones = filteredSafeZones.length > 0;

  const initialRegion = useMemo(() => {
    if (userLocation) {
      const { latitudeDelta, longitudeDelta } = computeRegionDelta(userLocation.lat, radiusKm);
      return {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta,
        longitudeDelta,
      };
    }
    return FALLBACK_REGION;
  }, [userLocation, radiusKm]);

  const animateToLocation = useCallback(
    (latitude: number, longitude: number, targetRadiusKm = radiusKm) => {
      if (!mapRef.current) {
        return;
      }
      const { latitudeDelta, longitudeDelta } = computeRegionDelta(latitude, targetRadiusKm);
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        },
        600,
      );
    },
    [radiusKm],
  );

  useEffect(() => {
    if (mapReady && userLocation) {
      animateToLocation(userLocation.lat, userLocation.lng);
    }
  }, [animateToLocation, mapReady, userLocation]);

  const handleLocateMe = useCallback(async () => {
    if (!userLocation) {
      const granted = await requestPermission();
      if (granted) {
        return;
      }
    }
    if (userLocation) {
      animateToLocation(userLocation.lat, userLocation.lng);
    }
  }, [animateToLocation, requestPermission, userLocation]);

  const handleSelectZone = useCallback(
    (zone: SafeZone) => {
      setSelectedZoneId(zone.id);
      animateToLocation(zone.location.lat, zone.location.lng, Math.min(radiusKm, 2));
    },
    [animateToLocation, radiusKm],
  );

  const handleToggleCategory = useCallback(
    (category: SafeZoneCategory) => {
      toggleCategory(category);
    },
    [toggleCategory],
  );

  const handleRadiusChange = useCallback(
    (nextRadius: number) => {
      setRadiusKm(nextRadius);
      if (userLocation) {
        animateToLocation(userLocation.lat, userLocation.lng, nextRadius);
      }
    },
    [animateToLocation, setRadiusKm, userLocation],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    if (userLocation) {
      animateToLocation(userLocation.lat, userLocation.lng, DEFAULT_RADIUS_KM);
    }
  }, [animateToLocation, clearFilters, userLocation]);

  const renderSafeZone: ListRenderItem<SafeZone> = useCallback(
    ({ item }) => <SafeZoneCard zone={item} onPressLocate={handleSelectZone} />,
    [handleSelectZone],
  );

  const keyExtractor = useCallback((item: SafeZone) => item.id, []);

  const renderEmptyState = useMemo(() => {
    if (isLoading) {
      return null;
    }

    if (!hasLocationPermission) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="location" size={32} color="#2563eb" />
          <Text style={styles.emptyTitle}>Share your location to get started</Text>
          <Text style={styles.emptyDescription}>
            We need your permission to show nearby hospitals and emergency shelters.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonLabel}>Grant Location Access</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle" size={32} color="#f97316" />
        <Text style={styles.emptyTitle}>No safe zones found nearby</Text>
        <Text style={styles.emptyDescription}>
          Try expanding the distance filter or adjust your filters to discover more locations.
        </Text>
        <Pressable style={styles.secondaryButton} onPress={handleClearFilters}>
          <Text style={styles.secondaryButtonLabel}>Reset Filters</Text>
        </Pressable>
      </View>
    );
  }, [handleClearFilters, hasLocationPermission, isLoading, requestPermission]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Safe Zones', headerShown: true }} />

      <View style={styles.mapContainer}>
        <MapView
          ref={(instance) => {
            mapRef.current = instance;
          }}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          onMapReady={() => setMapReady(true)}
          showsUserLocation
          showsMyLocationButton={false}
          showsPointsOfInterest={false}
          toolbarEnabled={false}
          accessibilityLabel="Safe zones map"
        >
          {userLocation ? (
            <Circle
              center={{ latitude: userLocation.lat, longitude: userLocation.lng }}
              radius={radiusKm * 1000}
              strokeColor="rgba(37, 99, 235, 0.35)"
              fillColor="rgba(37, 99, 235, 0.08)"
            />
          ) : null}

          {filteredSafeZones.map((zone) => (
            <Marker
              key={zone.id}
              coordinate={{
                latitude: zone.location.lat,
                longitude: zone.location.lng,
              }}
              onPress={() => handleSelectZone(zone)}
              accessibilityLabel={`${zone.name} (${CATEGORY_LABELS[zone.type]})`}
            >
              <View
                style={[
                  styles.marker,
                  { backgroundColor: CATEGORY_COLORS[zone.type] },
                  selectedZoneId === zone.id ? styles.markerSelected : null,
                ]}
              >
                <View style={styles.markerIconWrapper}>
                  <Ionicons name={zone.type === 'hospital' ? 'medkit' : 'home'} size={18} color="#fff" />
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

        <View style={styles.controlsContainer} pointerEvents="box-none">
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <Pressable onPress={handleClearFilters}>
                <Text style={styles.clearFiltersLabel}>Clear</Text>
              </Pressable>
            </View>

            <View style={styles.chipRow}>
              {(Object.keys(CATEGORY_LABELS) as SafeZoneCategory[]).map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <Pressable
                    key={category}
                    style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
                    onPress={() => handleToggleCategory(category)}
                  >
                    <Ionicons
                      name={category === 'hospital' ? 'medkit' : 'home'}
                      size={16}
                      color={isSelected ? '#fff' : CATEGORY_COLORS[category]}
                    />
                    <Text style={[styles.chipLabel, isSelected ? styles.chipLabelSelected : styles.chipLabelUnselected]}>
                      {CATEGORY_LABELS[category]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.radiusSection}>
              <Text style={styles.radiusLabel}>Within</Text>
              <View style={styles.radiusOptions}>
                {RADIUS_OPTIONS.map((option) => {
                  const isSelected = option === radiusKm;
                  return (
                    <Pressable
                      key={option}
                      style={[styles.radiusChip, isSelected ? styles.radiusChipSelected : styles.radiusChipUnselected]}
                      onPress={() => handleRadiusChange(option)}
                    >
                      <Text
                        style={[
                          styles.radiusChipLabel,
                          isSelected ? styles.radiusChipLabelSelected : styles.radiusChipLabelUnselected,
                        ]}
                      >
                        {option} km
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Pressable style={styles.locateButton} onPress={handleLocateMe} accessibilityLabel="Locate me">
            <Ionicons name="navigate" size={22} color="#2563eb" />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingLabel}>Finding nearby safe zones…</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={filteredSafeZones}
        keyExtractor={keyExtractor}
        renderItem={renderSafeZone}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={hasSafeZones ? <Text style={styles.listHeader}>Nearby Safe Zones</Text> : null}
      />
    </SafeAreaView>
  );
};

export default SafeZonesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  mapContainer: {
    height: 320,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  controlsContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  clearFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipUnselected: {
    backgroundColor: '#fff',
    borderColor: '#cbd5f5',
  },
  chipLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: '#fff',
  },
  chipLabelUnselected: {
    color: '#1e293b',
  },
  radiusSection: {
    marginTop: 14,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  radiusChipSelected: {
    backgroundColor: 'rgba(37,99,235,0.1)',
    borderColor: '#2563eb',
  },
  radiusChipUnselected: {
    backgroundColor: '#fff',
    borderColor: '#cbd5f5',
  },
  radiusChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  radiusChipLabelSelected: {
    color: '#2563eb',
  },
  radiusChipLabelUnselected: {
    color: '#1f2937',
  },
  locateButton: {
    position: 'absolute',
    bottom: -26,
    right: 12,
    height: 52,
    width: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  marker: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  markerIconWrapper: {
    transform: [{ rotate: '45deg' }],
  },
  markerSelected: {
    transform: [{ scale: 1.05 }, { rotate: '-45deg' }],
    shadowColor: '#1e293b',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  listContent: {
    padding: 16,
    paddingTop: 28,
    gap: 12,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  primaryButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  secondaryButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
});