import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useSafeZones } from '@/features/safe-zones/hooks/useSafeZones';
import type { SafeZone, SafeZoneCategory } from '@/features/safe-zones/types';
import { SafeZoneCard } from '@/features/safe-zones/components/SafeZoneCard';
import SafeZoneMap, {
  type SafeZoneMapHandle,
} from '@/features/safe-zones/components/SafeZoneMap';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  DEFAULT_RADIUS_KM,
  RADIUS_OPTIONS,
} from '@/features/safe-zones/constants';

const FILTER_PANEL_WIDTH = 280;
const FILTER_HANDLE_WIDTH = 36;

const SafeZonesScreen: React.FC = () => {
  const mapRef = useRef<SafeZoneMapHandle | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  const filtersWidthAnim = useRef(new Animated.Value(0)).current;
  const { width: viewportWidth } = useWindowDimensions();
  const shouldReserveSpace = Platform.OS === 'web' && viewportWidth >= 1200;

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

  useEffect(() => {
    if (mapReady && userLocation) {
      mapRef.current?.focusOnLocation(userLocation, radiusKm);
    }
  }, [mapReady, radiusKm, userLocation]);

  useEffect(() => {
    Animated.timing(filtersWidthAnim, {
      toValue: filtersOpen ? FILTER_PANEL_WIDTH : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [filtersOpen, filtersWidthAnim]);

  const handleLocateMe = useCallback(async () => {
    if (!userLocation) {
      const granted = await requestPermission();
      if (granted) {
        return;
      }
    }
    if (userLocation) {
      mapRef.current?.focusOnLocation(userLocation, radiusKm);
    }
  }, [radiusKm, requestPermission, userLocation]);

  const handleSelectZone = useCallback(
    (zone: SafeZone) => {
      setSelectedZoneId(zone.id);
      mapRef.current?.focusOnLocation(zone.location, Math.min(radiusKm, 2));
    },
    [radiusKm],
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
        mapRef.current?.focusOnLocation(userLocation, nextRadius);
      }
    },
    [setRadiusKm, userLocation],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setSelectedZoneId(null);
    if (userLocation) {
      mapRef.current?.focusOnLocation(userLocation, DEFAULT_RADIUS_KM);
    }
  }, [clearFilters, userLocation]);

  const renderSafeZone: ListRenderItem<SafeZone> = useCallback(
    ({ item }) => <SafeZoneCard zone={item} onPressLocate={handleSelectZone} />,
    [handleSelectZone],
  );

  const toggleFilters = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

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

  const filtersCard = useMemo(() => (
    <View style={styles.filterCard}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filters</Text>
        <Pressable onPress={handleClearFilters} accessibilityRole="button">
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
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
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
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
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
  ), [handleClearFilters, handleRadiusChange, handleToggleCategory, radiusKm, selectedCategories]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Safe Zones', headerShown: true }} />

      <View style={styles.mapContainer}>
        <SafeZoneMap
          ref={mapRef}
          onReady={() => setMapReady(true)}
          radiusKm={radiusKm}
          safeZones={filteredSafeZones}
          selectedZoneId={selectedZoneId}
          userLocation={userLocation}
          onSelectZone={handleSelectZone}
        />

        {Platform.OS !== 'web' ? (
          <Pressable
            style={[styles.locateButton, filtersOpen && shouldReserveSpace ? styles.locateButtonShifted : null]}
            onPress={handleLocateMe}
            accessibilityLabel="Locate me"
          >
            <Ionicons name="navigate" size={22} color="#2563eb" />
          </Pressable>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingLabel}>Finding nearby safe zones…</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.filterDrawerContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.filterDrawer,
            {
              width: filtersWidthAnim,
              transform: [
                {
                  translateX: filtersWidthAnim.interpolate({
                    inputRange: [0, FILTER_PANEL_WIDTH],
                    outputRange: [FILTER_PANEL_WIDTH + FILTER_HANDLE_WIDTH, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={filtersOpen ? 'auto' : 'none'}
        >
          {filtersCard}
        </Animated.View>
        <Pressable
          style={styles.filterDrawerHandle}
          onPress={toggleFilters}
          accessibilityRole="button"
          accessibilityLabel={filtersOpen ? 'Collapse filters' : 'Expand filters'}
        >
          <Ionicons
            name={filtersOpen ? 'chevron-forward' : 'chevron-back'}
            size={18}
            color="#2563eb"
          />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        style={styles.list}
        data={filteredSafeZones}
        keyExtractor={keyExtractor}
        renderItem={renderSafeZone}
        contentContainerStyle={[
          styles.listContent,
          filtersOpen && shouldReserveSpace ? styles.listContentWithDrawer : null,
        ]}
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
    marginBottom: 12,
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
    bottom: 16,
    right: 16,
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
  locateButtonShifted: {
    right: FILTER_PANEL_WIDTH + FILTER_HANDLE_WIDTH + 24,
  },
  filterDrawerContainer: {
    position: 'absolute',
    top: 88,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 20,
    width: FILTER_HANDLE_WIDTH,
    height: 'auto',
    overflow: 'visible',
  },
  filterDrawer: {
    overflow: 'hidden',
    borderRadius: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
    position: 'absolute',
    top: 0,
    right: FILTER_HANDLE_WIDTH,
  },
  filterDrawerHandle: {
    width: FILTER_HANDLE_WIDTH,
    height: 120,
    marginLeft: 0,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
    gap: 12,
  },
  listContentWithDrawer: {
    paddingRight: FILTER_PANEL_WIDTH + FILTER_HANDLE_WIDTH + 24,
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