/* global jest */

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    initialWindowMetrics: {
      insets: inset,
      frame: { x: 0, y: 0, width: 0, height: 0 },
    },
  };
});

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  default: {
    trigger: jest.fn(),
  },
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) =>
      React.createElement('View', null, children),
    useNavigation: () => ({
      navigate: jest.fn(),
      dispatch: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock @react-navigation/stack
jest.mock('@react-navigation/stack', () => {
  const React = require('react');
  const actualStack = jest.requireActual('@react-navigation/stack');
  return {
    ...actualStack,
    createStackNavigator: () => ({
      Navigator: ({ children }) => React.createElement('View', null, children),
      Screen: ({ component: Component, ...props }) =>
        React.createElement(Component, props),
    }),
  };
});

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock react-native-url-polyfill completely to prevent auto.js from running
jest.mock('react-native-url-polyfill/auto', () => {});

// Mock react-native-contacts
jest.mock('react-native-contacts', () => ({
  getAll: jest.fn().mockResolvedValue([]),
  requestPermission: jest.fn().mockResolvedValue('authorized'),
  checkPermission: jest.fn().mockResolvedValue('authorized'),
}));

// Mock js-sha256
jest.mock('js-sha256', () => ({
  sha256: jest.fn((input) => `hash_${input}`),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    IOS: { CONTACTS: 'ios.permission.CONTACTS' },
    ANDROID: { READ_CONTACTS: 'android.permission.READ_CONTACTS' },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
  request: jest.fn().mockResolvedValue('granted'),
  check: jest.fn().mockResolvedValue('granted'),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Override some functions for better test compatibility
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Note: NativeAnimatedHelper is an internal module and mocking it can cause issues
// Instead, we'll handle animated values properly in the React Native mock above

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const React = require('react');
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(),
    Screen: ({ children }) => React.createElement('View', null, children),
    ScreenContainer: ({ children }) => React.createElement('View', null, children),
  };
});

// Note: @react-native-community/netinfo is not used in this project
// If it's needed in the future, install it and uncomment this mock

// Mock react-native-orientation-locker
jest.mock('react-native-orientation-locker', () => ({
  lockToPortrait: jest.fn(),
  lockToLandscape: jest.fn(),
  lockToLandscapeLeft: jest.fn(),
  lockToLandscapeRight: jest.fn(),
  unlockAllOrientations: jest.fn(),
  getOrientation: jest.fn((callback) => callback('PORTRAIT')),
  getDeviceOrientation: jest.fn((callback) => callback('PORTRAIT')),
  addDeviceOrientationListener: jest.fn(),
  removeDeviceOrientationListener: jest.fn(),
  addOrientationListener: jest.fn(),
  removeOrientationListener: jest.fn(),
  getInitialOrientation: jest.fn(() => 'PORTRAIT'),
}));

// Note: react-native-sound is not used in this project

// Mock react-native-audio-recorder-player
jest.mock('react-native-audio-recorder-player', () => {
  return jest.fn().mockImplementation(() => ({
    startRecorder: jest.fn().mockResolvedValue('path/to/audio'),
    stopRecorder: jest.fn().mockResolvedValue('path/to/audio'),
    startPlayer: jest.fn().mockResolvedValue({}),
    stopPlayer: jest.fn().mockResolvedValue({}),
    pausePlayer: jest.fn().mockResolvedValue({}),
    resumePlayer: jest.fn().mockResolvedValue({}),
    seekToPlayer: jest.fn().mockResolvedValue({}),
    setVolume: jest.fn().mockResolvedValue({}),
    removeRecordBackListener: jest.fn(),
    removePlayBackListener: jest.fn(),
    addRecordBackListener: jest.fn(),
    addPlayBackListener: jest.fn(),
  }));
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const mockComponent = (name) => {
    return React.forwardRef((props, ref) => 
      React.createElement('View', { ...props, ref })
    );
  };
  
  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Circle: mockComponent('Circle'),
    Ellipse: mockComponent('Ellipse'),
    G: mockComponent('G'),
    Text: mockComponent('Text'),
    TSpan: mockComponent('TSpan'),
    TextPath: mockComponent('TextPath'),
    Path: mockComponent('Path'),
    Polygon: mockComponent('Polygon'),
    Polyline: mockComponent('Polyline'),
    Line: mockComponent('Line'),
    Rect: mockComponent('Rect'),
    Use: mockComponent('Use'),
    Image: mockComponent('Image'),
    Symbol: mockComponent('Symbol'),
    Defs: mockComponent('Defs'),
    LinearGradient: mockComponent('LinearGradient'),
    RadialGradient: mockComponent('RadialGradient'),
    Stop: mockComponent('Stop'),
    ClipPath: mockComponent('ClipPath'),
    Pattern: mockComponent('Pattern'),
    Mask: mockComponent('Mask'),
  };
});

// Note: Additional module mocks will be added here as needed
// Currently we only mock the modules that are actually imported in our test files

// Setup animation mocks
global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

// Global test utilities
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Comprehensive React Native mock
jest.mock('react-native', () => {
  const React = require('react');
  const RN = jest.requireActual('react-native');
  
  // Mock components
  const mockComponent = (name) => {
    return ({ children, ...props }) => React.createElement('View', props, children);
  };

  return {
    // Keep actual implementations where possible
    ...RN,
    
    // Platform APIs
    Platform: {
      OS: 'ios',
      Version: 14,
      select: (obj) => obj.ios || obj.default,
      isTV: false,
      isTesting: true,
    },
    
    // Dimensions
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667, scale: 2, fontScale: 1 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      set: jest.fn(),
    },
    
    // StyleSheet
    StyleSheet: {
      create: (styles) => styles,
      compose: (style1, style2) => [style1, style2].filter(Boolean).flat(),
      flatten: (styles) => Object.assign({}, ...Array.isArray(styles) ? styles : [styles]),
      absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
      hairlineWidth: 1,
    },
    
    // Animated
    Animated: {
      ...RN.Animated,
      View: mockComponent('Animated.View'),
      Text: mockComponent('Animated.Text'),
      Image: mockComponent('Animated.Image'),
      ScrollView: mockComponent('Animated.ScrollView'),
      Value: class {
        constructor(value) {
          this._value = value;
        }
        setValue(value) {
          this._value = value;
        }
        interpolate(config) {
          return this;
        }
        addListener(callback) {
          return { remove: jest.fn() };
        }
        removeListener(id) {}
        removeAllListeners() {}
        stopAnimation(callback) {
          callback && callback(this._value);
        }
      },
      timing: jest.fn((value, config) => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      spring: jest.fn((value, config) => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      decay: jest.fn((value, config) => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      sequence: jest.fn((animations) => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      parallel: jest.fn((animations) => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      loop: jest.fn((animation) => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
      event: jest.fn(() => jest.fn()),
      add: jest.fn(),
      subtract: jest.fn(),
      divide: jest.fn(),
      multiply: jest.fn(),
      modulo: jest.fn(),
      diffClamp: jest.fn(),
    },
    
    // Easing
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      poly: jest.fn(),
      sin: jest.fn(),
      circle: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(),
      back: jest.fn(),
      bounce: jest.fn(),
      bezier: jest.fn(() => jest.fn()),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    
    // Components
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    TextInput: mockComponent('TextInput'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    TouchableHighlight: mockComponent('TouchableHighlight'),
    TouchableWithoutFeedback: mockComponent('TouchableWithoutFeedback'),
    ScrollView: mockComponent('ScrollView'),
    FlatList: mockComponent('FlatList'),
    SectionList: mockComponent('SectionList'),
    Image: mockComponent('Image'),
    Modal: mockComponent('Modal'),
    StatusBar: mockComponent('StatusBar'),
    ActivityIndicator: mockComponent('ActivityIndicator'),
    Switch: mockComponent('Switch'),
    RefreshControl: mockComponent('RefreshControl'),
    Button: mockComponent('Button'),
    Pressable: mockComponent('Pressable'),
    SafeAreaView: mockComponent('SafeAreaView'),
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    
    // APIs
    Alert: {
      alert: jest.fn(),
    },
    
    Keyboard: {
      dismiss: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
    },
    
    Linking: {
      openURL: jest.fn().mockResolvedValue(true),
      canOpenURL: jest.fn().mockResolvedValue(true),
      getInitialURL: jest.fn().mockResolvedValue(null),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
    },
    
    PermissionsAndroid: {
      request: jest.fn().mockResolvedValue('granted'),
      check: jest.fn().mockResolvedValue('granted'),
      requestMultiple: jest.fn().mockResolvedValue({}),
      PERMISSIONS: { 
        READ_CONTACTS: 'android.permission.READ_CONTACTS',
        WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
        READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      },
      RESULTS: { 
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
      },
    },
    
    // DeviceEventEmitter
    DeviceEventEmitter: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      emit: jest.fn(),
    },
    
    // NativeModules
    NativeModules: {
      UIManager: {
        RCTView: {
          directEventTypes: {},
        },
      },
      PlatformConstants: {
        forceTouchAvailable: false,
      },
      RNGestureHandlerModule: {
        State: {},
        attachGestureHandler: jest.fn(),
        createGestureHandler: jest.fn(),
        dropGestureHandler: jest.fn(),
        updateGestureHandler: jest.fn(),
      },
      RNCNetInfo: {
        getCurrentState: jest.fn().mockResolvedValue({
          type: 'wifi',
          isConnected: true,
        }),
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
    },
    
    // NativeEventEmitter
    NativeEventEmitter: jest.fn().mockImplementation(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      emit: jest.fn(),
    })),
    
    // Vibration
    Vibration: {
      vibrate: jest.fn(),
      cancel: jest.fn(),
    },
    
    // Share
    Share: {
      share: jest.fn().mockResolvedValue({ action: 'sharedAction' }),
    },
  };
});
