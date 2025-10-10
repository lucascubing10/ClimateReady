import type { Coordinates } from '../types';

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value: number): number => (value * Math.PI) / 180;

export const calculateDistanceMeters = (origin: Coordinates, destination: Coordinates): number => {
  const originLatRad = toRadians(origin.lat);
  const destinationLatRad = toRadians(destination.lat);
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(originLatRad) *
      Math.cos(destinationLatRad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

export const metersToKilometers = (meters: number): number => meters / 1000;
