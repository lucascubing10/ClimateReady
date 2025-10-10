const expoProjectId =
  process.env.EXPO_PUBLIC_PROJECT_ID ?? process.env.EXPO_PROJECT_ID ?? null;

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  process.env.VITE_GOOGLE_MAPS_API_KEY ??
  process.env.GOOGLE_MAPS_API_KEY ??
  null;

if (!expoProjectId) {
  console.warn(
    "No EAS project ID found. Set EXPO_PUBLIC_PROJECT_ID or EXPO_PROJECT_ID to enable push notifications."
  );
}

export default {
  expo: {
    name: 'ClimateReady',
    slug: 'climateready',
    version: '1.0.0',
    orientation: 'portrait',
  icon: './assets/images/ClimateReady.png',
    scheme: 'climateready',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'ClimateReady uses your location to provide accurate weather information and emergency alerts tailored to your area.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'ClimateReady uses your location to provide accurate weather information and emergency alerts even when the app is in the background.',
        NSLocationAlwaysUsageDescription: 'ClimateReady uses your location to provide accurate weather information and emergency alerts even when the app is in the background.',
        UIBackgroundModes: ['location', 'fetch']
      },
      bundleIdentifier: 'com.yourcompany.climateready',
      ...(googleMapsApiKey
        ? {
            config: {
              googleMapsApiKey,
            },
          }
        : {}),
    },
    android: {

      "googleServicesFile": "./google-services.json",
      
      icon: './assets/images/ClimateReady.png',
      adaptiveIcon: {
        foregroundImage: './assets/images/ClimateReady.png',
        backgroundColor: '#ffffff'
        //backgroundColor: '#5ba24f'

      },
      edgeToEdgeEnabled: true,
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION'
      ],
      package: 'com.yourcompany.climateready',
      ...(googleMapsApiKey
        ? {
            config: {
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            },
          }
        : {}),
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff'
        }
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow ClimateReady to use your location to provide accurate weather and emergency alerts.',
          locationAlwaysPermission: 'Allow ClimateReady to use your location to provide accurate weather and emergency alerts.',
          locationWhenInUsePermission: 'Allow ClimateReady to use your location to provide accurate weather and emergency alerts.'
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
      sosWebAppUrl: process.env.SOS_WEB_APP_URL,
      expoProjectId: process.env.EXPO_PROJECT_ID,
      GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY,
      EXPO_PUBLIC_API_BASE: process.env.EXPO_PUBLIC_API_BASE,
    }
  }
};