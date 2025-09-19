require('dotenv').config();

module.exports = {
  expo: {
    name: process.env.APP_NAME || 'ClimateReady',
    slug: process.env.APP_SLUG || 'climateready',
    version: process.env.APP_VERSION || '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: process.env.APP_SCHEME || 'climateready',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    
    // iOS Configuration
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'ClimateReady uses your location to provide accurate weather information and emergency alerts tailored to your area.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'ClimateReady uses your location to provide accurate weather information and emergency alerts even when the app is in the background.',
        NSLocationAlwaysUsageDescription: 'ClimateReady uses your location to provide accurate weather information and emergency alerts even when the app is in the background.',
        UIBackgroundModes: ['location', 'fetch']
      },
      bundleIdentifier: process.env.IOS_BUNDLE_ID || 'com.yourcompany.climateready',
      config: {
        usesNonExemptEncryption: false
      }
    },
    
    // Android Configuration
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: process.env.ANDROID_ICON_BG_COLOR || '#5ba24f'
      },
      edgeToEdgeEnabled: true,
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION'
      ],
      package: process.env.ANDROID_PACKAGE_NAME || 'com.yourcompany.climateready',
      versionCode: 1
    },
    
    // Web Configuration
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    
    // Plugins
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          'image': './assets/images/splash-icon.png',
          'imageWidth': 200,
          'resizeMode': 'contain',
          'backgroundColor': '#ffffff'
        }
      ],
      [
        'expo-location',
        {
          'locationAlwaysAndWhenInUsePermission': 'Allow ClimateReady to use your location to provide accurate weather and emergency alerts.',
          'locationAlwaysPermission': 'Allow ClimateReady to use your location to provide accurate weather and emergency alerts.',
          'locationWhenInUsePermission': 'Allow ClimateReady to use your location to provide accurate weather and emergency alerts.'
        }
      ],
      [
        'expo-build-properties',
        {
          'ios': {
            'deploymentTarget': '13.4'
          }
        }
      ]
    ],
    
    // Experiments
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true
    },
    
    // Extra configuration for app constants
    extra: {
      openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '74b1abc58a408ca6b11c27b8292797cb',
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'your-eas-project-id'
      }
    },
    
    // Update configuration
    updates: {
      url: 'https://u.expo.dev/your-project-id'
    },
    
    // Runtime version
    runtimeVersion: {
      policy: 'appVersion'
    },
    
    // Splash screen
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    
    // Asset configuration
    assetBundlePatterns: [
      '**/*'
    ]
  }
};