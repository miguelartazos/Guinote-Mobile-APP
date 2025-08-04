module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-url-polyfill|react-native-contacts|react-native-sound|react-native-vector-icons|react-native-audio-recorder-player|react-native-permissions|react-native-voice|react-native-haptic-feedback|react-native-orientation-locker)/)',
  ],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
};
