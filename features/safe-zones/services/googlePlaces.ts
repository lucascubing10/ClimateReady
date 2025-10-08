import type { Coordinates, SafeZone, SafeZoneCategory } from '../types';

interface FetchGoogleSafeZonesParams {
  location: Coordinates;
  radiusMeters: number;
  apiKey: string;
  categories: SafeZoneCategory[];
  signal?: AbortSignal;
}

interface PlacesApiResponse {
  status: string;
  results: Array<{
    place_id: string;
    name: string;
    types?: string[];
    geometry: {
      location: { lat: number; lng: number };
    };
    vicinity?: string;
    formatted_address?: string;
    rating?: number;
    user_ratings_total?: number;
    international_phone_number?: string;
    website?: string;
  }>;
  error_message?: string;
}

const GOOGLE_NEARBY_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

const buildSearchUrl = ({
  location,
  radiusMeters,
  apiKey,
  type,
  keyword,
}: {
  location: Coordinates;
  radiusMeters: number;
  apiKey: string;
  type?: string;
  keyword?: string;
}): string => {
  const params = [
    `location=${location.lat},${location.lng}`,
    `radius=${radiusMeters}`,
    type ? `type=${encodeURIComponent(type)}` : null,
    keyword ? `keyword=${encodeURIComponent(keyword)}` : null,
    `key=${apiKey}`,
  ].filter(Boolean);

  return `${GOOGLE_NEARBY_SEARCH_URL}?${params.join('&')}`;
};

const mapPlaceToSafeZone = (result: PlacesApiResponse['results'][number], type: SafeZoneCategory): SafeZone => ({
  id: result.place_id,
  name: result.name,
  type,
  location: {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  },
  address: result.vicinity ?? result.formatted_address,
  rating: result.rating,
  userRatingsTotal: result.user_ratings_total,
  phoneNumber: result.international_phone_number,
  website: result.website,
  source: 'google',
  placeId: result.place_id,
});

const fetchCategory = async (
  category: SafeZoneCategory,
  params: Omit<FetchGoogleSafeZonesParams, 'categories'>,
): Promise<SafeZone[]> => {
  const { apiKey, location, radiusMeters, signal } = params;
  const requestUrl =
    category === 'hospital'
      ? buildSearchUrl({ location, radiusMeters, apiKey, type: 'hospital' })
      : buildSearchUrl({
          location,
          radiusMeters,
          apiKey,
          type: 'point_of_interest',
          keyword: 'emergency shelter',
        });

  const response = await fetch(requestUrl, { signal });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${category} data from Google Places (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as PlacesApiResponse;

  if (payload.status === 'ZERO_RESULTS') {
    return [];
  }

  if (payload.status !== 'OK') {
    throw new Error(payload.error_message ?? `Google Places API error: ${payload.status}`);
  }

  return payload.results.map((result) => mapPlaceToSafeZone(result, category));
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
