import type { Coordinates, SafeZone, SafeZoneCategory } from '../types';

type PlacesApiErrorCode =
  | 'PLACES_API_DISABLED'
  | 'PLACES_API_DEPRECATED_SETTING'
  | 'API_KEY_INVALID'
  | 'QUOTA_EXCEEDED'
  | 'UNKNOWN';

export class SafeZonePlacesError extends Error {
  code: PlacesApiErrorCode;
  httpStatus: number;

  constructor(message: string, code: PlacesApiErrorCode, httpStatus: number) {
    super(message);
    this.name = 'SafeZonePlacesError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

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
const PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

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
  };
};

const fetchCategory = async (
  category: SafeZoneCategory,
  params: Omit<FetchGoogleSafeZonesParams, 'categories'>,
): Promise<SafeZone[]> => {
  const { apiKey, location, radiusMeters, signal } = params;
  const isShelter = category === 'shelter';

  const endpoint = isShelter ? PLACES_TEXT_SEARCH_URL : PLACES_NEARBY_SEARCH_URL;
  const bodyPayload = isShelter
    ? {
        textQuery: 'emergency shelter',
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng,
            },
            radius: radiusMeters,
          },
        },
        maxResultCount: 20,
      }
    : getRequestPayload(category, location, radiusMeters);

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
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
    body: JSON.stringify(bodyPayload),
    signal,
  });

  if (!response.ok) {
    const rawBody = await response.text();
    let parsedBody: unknown = null;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : null;
    } catch (parseError) {
      parsedBody = null;
    }

    if (__DEV__) {
      console.warn('[SafeZones][GooglePlaces] request failed', {
        category,
        endpoint,
        status: response.status,
        body: bodyPayload,
        response: parsedBody ?? rawBody,
      });
    }

    const detailsArray =
      typeof parsedBody === 'object' && parsedBody && 'error' in parsedBody
        ? ((parsedBody as Record<string, any>).error?.details as Array<Record<string, any>> | undefined)
        : undefined;

    const errorInfo = detailsArray?.find((detail) => detail?.['@type']?.includes('ErrorInfo'));
    const reason = errorInfo?.reason as string | undefined;
    const activationUrl = errorInfo?.metadata?.activationUrl as string | undefined;

    const defaultMessage =
      (typeof parsedBody === 'object' && parsedBody && 'error' in parsedBody
        ? (parsedBody as Record<string, any>).error?.message
        : undefined) ?? rawBody ?? 'Unknown error';

    let code: PlacesApiErrorCode = 'UNKNOWN';
    let message = `Failed to fetch ${category} data from Google Places (HTTP ${response.status}). ${defaultMessage}`;

    if (reason === 'SERVICE_DISABLED' || reason === 'ACCESS_NOT_CONFIGURED') {
      code = 'PLACES_API_DISABLED';
      message =
        'Google Places API (New) is disabled for this project. Enable it in Google Cloud Console (APIs & Services ▸ Library ▸ Places API (New)) and try again.';
      if (activationUrl) {
        message += ` Activation link: ${activationUrl}`;
      }
    } else if (reason === 'API_KEY_INVALID' || reason === 'API_KEY_EXPIRED') {
      code = 'API_KEY_INVALID';
      message = 'The configured Google Maps API key is invalid or missing the Places API scope. Check the key and regenerate if necessary.';
    } else if (reason === 'DAILY_LIMIT_EXCEEDED' || reason === 'USER_RATE_LIMIT_EXCEEDED') {
      code = 'QUOTA_EXCEEDED';
      message = 'This Google Maps API key has exceeded its quota for the Places API. Try again later or adjust quotas in Google Cloud Console.';
    }

    throw new SafeZonePlacesError(message, code, response.status);
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
