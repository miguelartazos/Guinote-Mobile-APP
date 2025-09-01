module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
    ...(process.env.NODE_ENV === 'production' ? ['transform-remove-console'] : []),
    // Worklets plugin must be listed last (previously reanimated plugin)
    'react-native-worklets/plugin',
  ],
};
