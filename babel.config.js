module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Path alias so we can use "@/..." from project root
      [
        'module-resolver',
        {
          alias: {
            '@': './',
          },
        },
      ],
      // NOTE: 'expo-router/babel' deprecated in SDK 50+. babel-preset-expo already includes what we need.
      // Reanimated MUST be the last plugin
      'react-native-reanimated/plugin',
    ],
  };
};
