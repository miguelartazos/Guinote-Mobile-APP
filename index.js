/**
 * @format
 */

// Ensure browser-like globals for libs that expect them
// Must be before any other imports
// eslint-disable-next-line no-undef
if (typeof global !== 'undefined') {
  // Some libs touch window/self prototypes during init
  // Provide aliases to the React Native global
  // eslint-disable-next-line no-undef
  global.window = global;
  // eslint-disable-next-line no-undef
  global.self = global;
}

import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
// Temporarily disable Sentry to isolate Hermes prototype crash
// Re-enable after confirming the root cause
// import './sentry.config';
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
