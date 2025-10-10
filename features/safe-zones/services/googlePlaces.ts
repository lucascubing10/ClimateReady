import type { Coordinates, SafeZone, SafeZoneCategory } from '../types';

const DEBUG_LOG_PREFIX = '[SafeZones][GooglePlaces]';

const CATEGORY_ALLOWED_TYPES: Record<SafeZoneCategory, string[]> = {
  hospital: ['hospital'],
  shelter: [
    'shelter',
    'civil_defense',
    'community_center',
    'local_government_office',
    'city_hall',
    'place_of_worship',
    'church',
    'synagogue',
    'mosque',
    'police',
    'fire_station',
    'school',
    'primary_school',
    'secondary_school',
    'university',
    'library',
    'lodging',
    'rv_park',
    'campground',
    'point_of_interest',
    'establishment',
  ],
};

interface TextSearchVariant {
  textQuery: string;
  filterTypes?: string[];
}

const SHELTER_TEXT_VARIANTS: TextSearchVariant[] = [
  {
    textQuery: 'official emergency shelter',
    filterTypes: ['shelter'],
  },
  {
    textQuery: 'public safety shelter',
    filterTypes: ['local_government_office', 'city_hall', 'civil_defense'],
  },
  {
    textQuery: 'community center shelter',
    filterTypes: ['community_center'],
  },
  {
    textQuery: 'place of worship shelter',
    filterTypes: ['place_of_worship', 'church', 'synagogue', 'mosque'],
  },
  {
    textQuery: 'school emergency shelter',
    filterTypes: ['school', 'primary_school', 'secondary_school', 'university'],
  },
  {
    textQuery: 'disaster relief center',
    filterTypes: ['local_government_office', 'community_center'],
  },
];

const HOSPITAL_TEXT_VARIANTS: TextSearchVariant[] = [
  {
    textQuery: 'emergency hospital',
    filterTypes: ['hospital'],
  },
  {
    textQuery: 'hospital emergency room',
    filterTypes: ['hospital'],
  },
];

const shouldLogDebug = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

const logDebug = (message: string, payload?: Record<string, unknown>) => {
  if (!shouldLogDebug) {
    return;
  }
  if (payload) {
    console.log(`${DEBUG_LOG_PREFIX} ${message}`, payload);
  } else {
    console.log(`${DEBUG_LOG_PREFIX} ${message}`);
  }
};

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

const PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

type PlaceResult = NonNullable<PlacesNewApiResponse['places']>[number];

const buildTextSearchPayload = (
  variant: TextSearchVariant,
  location: Coordinates,
  radiusMeters: number,
): Record<string, unknown> => ({
  textQuery: variant.textQuery,
  languageCode: 'en',
  regionCode: 'US',
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
});

const requestTextSearch = async (
  category: SafeZoneCategory,
  variant: TextSearchVariant,
  params: Omit<FetchGoogleSafeZonesParams, 'categories'>,
): Promise<PlaceResult[]> => {
  const { apiKey, location, radiusMeters, signal } = params;
  const payload = buildTextSearchPayload(variant, location, radiusMeters);

  logDebug('sending request', {
    category,
    endpoint: PLACES_TEXT_SEARCH_URL,
    textQuery: variant.textQuery,
    radiusMeters,
  });

  const response = await fetch(`${PLACES_TEXT_SEARCH_URL}?key=${apiKey}`, {
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
        'places.types',
      ].join(','),
    },
    body: JSON.stringify(payload),
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

    console.warn(`${DEBUG_LOG_PREFIX} request failed`, {
      category,
      endpoint: PLACES_TEXT_SEARCH_URL,
      status: response.status,
      body: payload,
      response: parsedBody ?? rawBody,
    });

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

  const payloadResponse = (await response.json()) as PlacesNewApiResponse;
  const places = payloadResponse.places ?? [];

  logDebug('received response', {
    category,
    textQuery: variant.textQuery,
    initialCount: places.length,
  });

  if (!places.length) {
    return [];
  }

  if (!variant.filterTypes?.length) {
    return places;
  }

  const filterSet = new Set(variant.filterTypes);
  const filtered = places.filter((place) => {
    const matches = place.types?.some((type) => filterSet.has(type)) ?? false;
    if (!matches) {
      logDebug('variant filtered place', {
        category,
        textQuery: variant.textQuery,
        placeId: place.id,
        types: place.types,
      });
    }
    return matches;
  });

  logDebug('variant kept places', {
    category,
    textQuery: variant.textQuery,
    keptCount: filtered.length,
  });

  return filtered;
};

const toSafeZones = (
  category: SafeZoneCategory,
  origin: Coordinates,
  places: PlaceResult[],
): SafeZone[] => {
  const allowedTypes = new Set(CATEGORY_ALLOWED_TYPES[category]);

  return places
    .filter((place) => {
      if (!allowedTypes.size || !place.types?.length) {
        return true;
      }
      const match = place.types.some((type) => allowedTypes.has(type));
      if (!match) {
        logDebug('filtered place due to types', {
          category,
          placeId: place.id,
          types: place.types,
          displayName: place.displayName?.text,
        });
      }
      return match;
    })
    .map((place) => ({
      id: place.id,
      name: place.displayName?.text ?? 'Unknown safe zone',
      type: category,
      location: {
        lat: place.location?.latitude ?? origin.lat,
        lng: place.location?.longitude ?? origin.lng,
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

const fetchCategory = async (
  category: SafeZoneCategory,
  params: Omit<FetchGoogleSafeZonesParams, 'categories'>,
): Promise<SafeZone[]> => {
  const variants: TextSearchVariant[] =
    category === 'shelter'
      ? SHELTER_TEXT_VARIANTS
      : HOSPITAL_TEXT_VARIANTS;

  const responses = await Promise.all(variants.map((variant) => requestTextSearch(category, variant, params)));

  const dedupedPlaces = new Map<string, PlaceResult>();
  responses.forEach((places) => {
    places.forEach((place) => {
      if (place?.id && !dedupedPlaces.has(place.id)) {
        dedupedPlaces.set(place.id, place);
      }
    });
  });

  if (!dedupedPlaces.size) {
    return [];
  }

  return toSafeZones(category, params.location, Array.from(dedupedPlaces.values()));
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
