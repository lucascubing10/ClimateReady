import React, { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SafeZone } from '../types';
import { metersToKilometers } from '../utils/distance';

interface SafeZoneCardProps {
  zone: SafeZone;
  onPressLocate: (zone: SafeZone) => void;
}

const getCategoryDisplay = (
  type: SafeZone['type'],
): { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] } => {
  switch (type) {
    case 'hospital':
      return { label: 'Hospital', icon: 'medkit' };
    case 'shelter':
    default:
      return { label: 'Shelter', icon: 'home' };
  }
};

const formatDistance = (meters?: number): string | null => {
  if (meters == null) {
    return null;
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m away`;
  }
  const km = metersToKilometers(meters);
  return `${km.toFixed(1)} km away`;
};

export const SafeZoneCard: React.FC<SafeZoneCardProps> = ({ zone, onPressLocate }) => {
  const categoryMeta = useMemo(() => getCategoryDisplay(zone.type), [zone.type]);
  const distanceLabel = useMemo(() => formatDistance(zone.distanceMeters), [zone.distanceMeters]);

  const handleOpenDirections = () => {
    const destinationParam = zone.placeId
      ? `destination_place_id=${zone.placeId}`
      : `destination=${zone.location.lat},${zone.location.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&${destinationParam}`;
    Linking.openURL(url).catch((error) => console.warn('Failed to open directions', error));
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name={categoryMeta.icon}
            size={20}
            color={zone.type === 'hospital' ? '#ef4444' : '#2563eb'}
            style={styles.icon}
          />
          <Text style={styles.title}>{zone.name}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{categoryMeta.label}</Text>
        </View>
      </View>

      {zone.address ? <Text style={styles.address}>{zone.address}</Text> : null}
      {distanceLabel ? <Text style={styles.distance}>{distanceLabel}</Text> : null}

      <View style={styles.footer}>
        <Pressable style={[styles.footerButton, styles.primaryButton]} onPress={() => onPressLocate(zone)}>
          <Ionicons name="locate" size={16} color="#fff" />
          <Text style={[styles.footerButtonText, styles.primaryButtonText]}>Show on Map</Text>
        </Pressable>

        <Pressable style={[styles.footerButton, styles.secondaryButton]} onPress={handleOpenDirections}>
          <Ionicons name="navigate" size={16} color="#2563eb" />
          <Text style={[styles.footerButtonText, styles.secondaryButtonText]}>Directions</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flexShrink: 1,
  },
  badge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 12,
  },
  address: {
    marginTop: 8,
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  distance: {
    marginTop: 4,
    color: '#2563eb',
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: '#fff',
  },
  footerButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#2563eb',
  },
});
