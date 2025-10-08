import type { Coordinates, SafeZone, SafeZoneCategory } from '../types';

interface FetchGoogleSafeZonesParams {
  location: Coordinates;
  radiusMeters: number;
  apiKey: string;
  categories: SafeZoneCategory[];
  signal?: AbortSignal;
}

interface PlacesNewApiResponse {
  places?: Array<{
    id: string;
    types?: string[];
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    rating?: number;
    userRatingCount?: number;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
  }>;
}

const PLACES_NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';

const getRequestPayload = (
  category: SafeZoneCategory,
  location: Coordinates,
  radiusMeters: number,
) => {
  const basePayload: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: {
          latitude: location.lat,
          longitude: location.lng,
        },
        radius: radiusMeters,
      },
    },
    maxResultCount: 20,
    rankPreference: 'DISTANCE',
  };

  if (category === 'hospital') {
    return {
      ...basePayload,
      includedTypes: ['hospital'],
    };
  }

  return {
    ...basePayload,
    includedTypes: ['point_of_interest'],
    keyword: 'emergency shelter',
  };
};

const fetchCategory = async (
  category: SafeZoneCategory,
  params: Omit<FetchGoogleSafeZonesParams, 'categories'>,
): Promise<SafeZone[]> => {
  const { apiKey, location, radiusMeters, signal } = params;
  const response = await fetch(`${PLACES_NEARBY_SEARCH_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.location',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.websiteUri',
      ].join(','),
    },
    body: JSON.stringify(getRequestPayload(category, location, radiusMeters)),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch ${category} data from Google Places (HTTP ${response.status}): ${errorText}`,
    );
  }

  const payload = (await response.json()) as PlacesNewApiResponse;

  if (!payload.places?.length) {
    return [];
  }

  return payload.places
    .filter((place): place is NonNullable<typeof payload.places>[number] => Boolean(place?.id))
    .map((place) => ({
      id: place.id,
      name: place.displayName?.text ?? 'Unknown safe zone',
  type: category,
      location: {
        lat: place.location?.latitude ?? location.lat,
        lng: place.location?.longitude ?? location.lng,
      },
      address: place.formattedAddress,
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      phoneNumber: place.internationalPhoneNumber ?? place.nationalPhoneNumber,
      website: place.websiteUri,
      source: 'google',
      placeId: place.id,
    }));
};

export const fetchGoogleSafeZones = async (
  params: FetchGoogleSafeZonesParams,
): Promise<SafeZone[]> => {
  const { categories, ...rest } = params;
  if (!categories.length) {
    return [];
  }

  const allResults = await Promise.all(categories.map((category) => fetchCategory(category, rest)));
  const merged = allResults.flat();

  // Deduplicate by place_id in case the API returns overlapping entries
  const uniqueMap = new Map<string, SafeZone>();
  merged.forEach((zone) => {
    if (!uniqueMap.has(zone.id)) {
      uniqueMap.set(zone.id, zone);
    }
  });

  return Array.from(uniqueMap.values());
};
