const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Try to load expo metro config if available
let expoMetroConfig = {};
try {
  expoMetroConfig = require('expo/metro-config');
} catch (e) {
  // expo/metro-config not available, continue without it
}

// Get the default config first
const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    port: 8083,
  },
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    unstable_allowRequireContext: true,
  },
  resolver: {
    // Add react-dom as an alias to our shim for compatibility
    extraNodeModules: {
      'react-dom': path.resolve(__dirname, 'src', 'utils', 'react-dom-shim.js'),
    },
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

// If expo metro config is available, merge it
const baseConfig = expoMetroConfig.getDefaultConfig
  ? expoMetroConfig.getDefaultConfig(__dirname)
  : defaultConfig;

module.exports = mergeConfig(baseConfig, config);
