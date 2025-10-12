import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SafeZoneMapHandle, SafeZoneMapProps } from './SafeZoneMap.types';

const SafeZoneMap = forwardRef<SafeZoneMapHandle, SafeZoneMapProps>(
  ({ userLocation, onReady }, ref) => {
    useImperativeHandle(ref, () => ({
      focusOnLocation: () => {},
    }));

    useEffect(() => {
      onReady?.();
    }, [onReady]);

    const handleOpenGoogleMaps = () => {
      const url = userLocation
        ? `https://www.google.com/maps/search/hospitals+and+shelters/@${userLocation.lat},${userLocation.lng},14z`
        : 'https://www.google.com/maps/search/hospitals+and+shelters/';

      Linking.openURL(url).catch((error) => {
        console.warn('Failed to open Google Maps', error);
      });
    };

    return (
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Ionicons name="map" size={28} color="#2563eb" />
        </View>
        <Text style={styles.title}>Interactive map unavailable on web preview</Text>
        <Text style={styles.description}>
          Use the list below to explore nearby safe zones, or open Google Maps for a full interactive
          experience.
        </Text>
        <Pressable style={styles.button} onPress={handleOpenGoogleMaps}>
          <Ionicons name="open" size={18} color="#fff" />
          <Text style={styles.buttonLabel}>Open in Google Maps</Text>
        </Pressable>
      </View>
    );
  },
);

SafeZoneMap.displayName = 'SafeZoneMapWebFallback';

export default SafeZoneMap;
export type { SafeZoneMapHandle } from './SafeZoneMap.types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
