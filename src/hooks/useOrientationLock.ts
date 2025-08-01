import { useEffect } from 'react';

export type OrientationLock =
  | 'portrait'
  | 'landscape'
  | 'landscape-left'
  | 'landscape-right'
  | 'all';

let Orientation: any = null;

try {
  Orientation = require('react-native-orientation-locker').default;
} catch (error) {
  console.warn(
    'react-native-orientation-locker not available. Please rebuild the app with: cd ios && pod install && cd .. && npx react-native run-ios',
  );
}

export function useOrientationLock(lock: OrientationLock | null) {
  useEffect(() => {
    if (!lock || !Orientation) return;

    try {
      switch (lock) {
        case 'portrait':
          Orientation.lockToPortrait();
          break;
        case 'landscape':
          Orientation.lockToLandscape();
          break;
        case 'landscape-left':
          Orientation.lockToLandscapeLeft();
          break;
        case 'landscape-right':
          Orientation.lockToLandscapeRight();
          break;
        case 'all':
          Orientation.unlockAllOrientations();
          break;
      }
    } catch (error) {
      console.warn('Failed to set orientation lock:', error);
    }

    return () => {
      try {
        if (Orientation) {
          Orientation.unlockAllOrientations();
        }
      } catch (error) {
        console.warn('Failed to unlock orientation:', error);
      }
    };
  }, [lock]);
}
