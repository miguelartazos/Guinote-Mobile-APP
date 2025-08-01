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

// Setup animation mocks
global.requestAnimationFrame = callback => {
  setTimeout(callback, 0);
};

// Mock Animated timing to resolve immediately in tests
jest.mock('react-native', () => {
  const actualReactNative = jest.requireActual('react-native');
  const Animated = actualReactNative.Animated;

  return {
    ...actualReactNative,
    Animated: {
      ...Animated,
      timing: (value, config) => {
        return {
          start: callback => {
            value.setValue(config.toValue);
            callback && callback({ finished: true });
          },
          stop: jest.fn(),
        };
      },
      spring: (value, config) => {
        return {
          start: callback => {
            value.setValue(config.toValue);
            callback && callback({ finished: true });
          },
          stop: jest.fn(),
        };
      },
      sequence: animations => {
        return {
          start: callback => {
            animations.forEach(anim => {
              if (anim.start) {
                anim.start();
              }
            });
            callback && callback({ finished: true });
          },
          stop: jest.fn(),
        };
      },
      parallel: animations => {
        return {
          start: callback => {
            animations.forEach(anim => {
              if (anim.start) {
                anim.start();
              }
            });
            callback && callback({ finished: true });
          },
          stop: jest.fn(),
        };
      },
      stagger: (delay, animations) => {
        return {
          start: callback => {
            animations.forEach(anim => {
              if (anim.start) {
                anim.start();
              }
            });
            callback && callback({ finished: true });
          },
          stop: jest.fn(),
        };
      },
      loop: animation => {
        return {
          start: callback => {
            if (animation.start) {
              animation.start();
            }
            callback && callback({ finished: true });
          },
          stop: jest.fn(),
        };
      },
      delay: time => {
        return {
          start: callback => {
            setTimeout(() => {
              callback && callback({ finished: true });
            }, 0);
          },
          stop: jest.fn(),
        };
      },
    },
  };
});
