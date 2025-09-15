import { useEffect } from 'react';
import { featureFlags } from '../config/featureFlags';

export type OrientationLock =
  | 'portrait'
  | 'landscape'
  | 'landscape-left'
  | 'landscape-right'
  | 'all';

let Orientation: any = null;

export function useOrientationLock(lock: OrientationLock | null) {
  useEffect(() => {
    // Global policy: if forceLandscape is enabled, override to landscape
    const policyLock: OrientationLock | null = (() => {
      try {
        const enforceLandscape = featureFlags.getFlag('forceLandscape');
        if (enforceLandscape) return 'landscape';
      } catch {}
      return lock;
    })();

    if (!policyLock) return;

    try {
      if (!Orientation) {
        Orientation = require('react-native-orientation-locker').default;
      }
    } catch (error) {
      console.warn(
        'react-native-orientation-locker not available. Please rebuild the app with: cd ios && pod install && cd .. && npx react-native run-ios',
      );
      return;
    }

    try {
      switch (policyLock) {
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

    // NO CLEANUP - orientations stay locked to prevent render bugs
  }, [lock]);
}
