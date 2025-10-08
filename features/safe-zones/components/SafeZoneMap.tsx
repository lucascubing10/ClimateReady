import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import type { SafeZoneMapHandle, SafeZoneMapProps } from './SafeZoneMap.types';
import { CATEGORY_COLORS, CATEGORY_LABELS, FALLBACK_REGION, computeRegionDelta } from '../constants';

const SafeZoneMap = forwardRef<SafeZoneMapHandle, SafeZoneMapProps>(
  ({ userLocation, safeZones, selectedZoneId, radiusKm, onSelectZone, onReady }, ref) => {
    const mapRef = useRef<MapView | null>(null);

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
    }, [radiusKm, userLocation]);

    const focusOnLocation = useCallback(
      (coords: { lat: number; lng: number }, targetRadiusKm = radiusKm) => {
        const { latitudeDelta, longitudeDelta } = computeRegionDelta(coords.lat, targetRadiusKm);
        mapRef.current?.animateToRegion(
          {
            latitude: coords.lat,
            longitude: coords.lng,
            latitudeDelta,
            longitudeDelta,
          },
          600,
        );
      },
      [radiusKm],
    );

    useImperativeHandle(ref, () => ({ focusOnLocation }), [focusOnLocation]);

    useEffect(() => {
      if (userLocation) {
        focusOnLocation(userLocation, radiusKm);
      }
    }, [focusOnLocation, radiusKm, userLocation]);

    return (
      <MapView
        ref={(instance) => {
          mapRef.current = instance;
        }}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
  onMapReady={() => onReady?.()}
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

        {safeZones.map((zone) => (
          <Marker
            key={zone.id}
            coordinate={{
              latitude: zone.location.lat,
              longitude: zone.location.lng,
            }}
            onPress={() => onSelectZone(zone)}
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
    );
  },
);

SafeZoneMap.displayName = 'SafeZoneMap';

export default SafeZoneMap;
export type { SafeZoneMapHandle } from './SafeZoneMap.types';

const styles = StyleSheet.create({
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
});
