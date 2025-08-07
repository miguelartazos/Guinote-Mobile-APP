import { Platform } from 'react-native';

let ReactNativeHapticFeedback: any;
let isHapticAvailable = false;

try {
  ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;
  isHapticAvailable = true;
} catch (error) {
  console.warn('Haptic feedback module not available:', error);
  isHapticAvailable = false;
}

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const triggerHaptic = (iosType: string, androidType: string) => {
  if (!isHapticAvailable || Platform.OS === 'web' || __DEV__) {
    if (__DEV__) {
      console.log(`Haptics: Would trigger ${iosType || androidType}`);
    }
    return;
  }

  try {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger(iosType, hapticOptions);
    } else {
      ReactNativeHapticFeedback.trigger(androidType, hapticOptions);
    }
  } catch (error) {
    console.warn(`Failed to trigger haptic feedback:`, error);
  }
};

export const haptics = {
  // Light haptic for button presses
  light: () => triggerHaptic('impactLight', 'soft'),

  // Medium haptic for card plays
  medium: () => triggerHaptic('impactMedium', 'impactMedium'),

  // Heavy haptic for important events
  heavy: () => triggerHaptic('impactHeavy', 'impactHeavy'),

  // Success haptic for wins/cantes
  success: () => triggerHaptic('notificationSuccess', 'notificationSuccess'),

  // Warning haptic for errors
  warning: () => triggerHaptic('notificationWarning', 'notificationWarning'),

  // Selection haptic for UI interactions
  selection: () => triggerHaptic('selection', 'soft'),
};

export const hapticFeedback = haptics;
