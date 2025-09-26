module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 👇 This makes `@/...` work
      [
        'module-resolver',
        {
          alias: {
            '@': './', // "@" now means project root
          },
        },
      ],
      // keep expo-router plugin here (important for your team leader’s code)
      'expo-router/babel',
    ],
  };
};
