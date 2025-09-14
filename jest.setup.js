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
  default: {
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
  },
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

// Mock @react-native-clipboard/clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {
    setString: jest.fn(),
    getString: jest.fn().mockResolvedValue(''),
    hasString: jest.fn().mockResolvedValue(false),
    getStringType: jest.fn().mockResolvedValue('plain-text'),
  },
}));

// Note: Additional module mocks will be added here as needed
// Currently we only mock the modules that are actually imported in our test files

// Setup animation mocks
global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

// Global test utilities
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Mock TurboModules
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn((name) => {
    if (name === 'DevMenu') {
      return {
        reload: jest.fn(),
        openDebugger: jest.fn(),
        show: jest.fn(),
      };
    }
    return {};
  }),
  get: jest.fn((name) => null),
}));

// Mock NativePlatformConstantsIOS
jest.mock('react-native/Libraries/Utilities/NativePlatformConstantsIOS', () => ({
  default: {
    getConstants: () => ({
      forceTouchAvailable: false,
      interfaceIdiom: 'phone',
      osVersion: '14.0',
      systemName: 'iOS',
      isTesting: true,
      isDisableAnimations: false,
    }),
  },
}));

// Mock NativeDeviceInfo
jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
  default: {
    getConstants: () => ({
      Dimensions: {
        window: {
          width: 375,
          height: 667,
          scale: 2,
          fontScale: 1,
        },
        screen: {
          width: 375,
          height: 667,
          scale: 2,
          fontScale: 1,
        },
      },
    }),
  },
}));

// Comprehensive React Native mock
jest.mock('react-native', () => {
  const React = require('react');
  
  // Mock components
  const mockComponent = (name) => {
    return ({ children, ...props }) => React.createElement('View', props, children);
  };
  
  // Special Text component that renders text properly
  const TextComponent = ({ children, ...props }) => {
    return React.createElement('Text', props, children);
  };

  return {
    // Basic Components
    View: mockComponent('View'),
    Text: TextComponent,
    ScrollView: mockComponent('ScrollView'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    TouchableWithoutFeedback: mockComponent('TouchableWithoutFeedback'),
    TouchableHighlight: mockComponent('TouchableHighlight'),
    TouchableNativeFeedback: mockComponent('TouchableNativeFeedback'),
    Pressable: mockComponent('Pressable'),
    TextInput: mockComponent('TextInput'),
    Image: mockComponent('Image'),
    SafeAreaView: mockComponent('SafeAreaView'),
    FlatList: mockComponent('FlatList'),
    SectionList: mockComponent('SectionList'),
    VirtualizedList: mockComponent('VirtualizedList'),
    ActivityIndicator: mockComponent('ActivityIndicator'),
    Button: mockComponent('Button'),
    Modal: mockComponent('Modal'),
    RefreshControl: mockComponent('RefreshControl'),
    StatusBar: mockComponent('StatusBar'),
    Switch: mockComponent('Switch'),
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    
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
    
    // Animated - Complete mock without spreading from RN
    Animated: {
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
      delay: jest.fn(),
      stagger: jest.fn(),
      createAnimatedComponent: jest.fn((Component) => Component),
      FlatList: mockComponent('Animated.FlatList'),
      SectionList: mockComponent('Animated.SectionList'),
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
    
    // Utilities
    PixelRatio: {
      get: () => 2,
      getFontScale: () => 1,
      getPixelSizeForLayoutSize: (size) => size * 2,
      roundToNearestPixel: (size) => Math.round(size * 2) / 2,
    },
    
    InteractionManager: {
      runAfterInteractions: (callback) => {
        callback();
        return { then: jest.fn(), done: jest.fn(), cancel: jest.fn() };
      },
      createInteractionHandle: jest.fn(),
      clearInteractionHandle: jest.fn(),
      setDeadline: jest.fn(),
    },
    
    PanResponder: {
      create: jest.fn(() => ({
        panHandlers: {
          onStartShouldSetPanResponder: jest.fn(),
          onMoveShouldSetPanResponder: jest.fn(),
          onStartShouldSetPanResponderCapture: jest.fn(),
          onMoveShouldSetPanResponderCapture: jest.fn(),
          onPanResponderGrant: jest.fn(),
          onPanResponderMove: jest.fn(),
          onPanResponderRelease: jest.fn(),
          onPanResponderTerminate: jest.fn(),
        },
      })),
    },
    
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
