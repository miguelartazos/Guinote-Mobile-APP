module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ...(process.env.NODE_ENV === 'production' ? ['transform-remove-console'] : []),
    // Worklets plugin must be listed last (was moved from react-native-reanimated)
    'react-native-worklets/plugin',
  ],
};
