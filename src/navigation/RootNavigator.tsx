import React, { useEffect, useRef } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { Linking } from 'react-native';
import { TabNavigator } from './TabNavigator';
import { isMultiplayerEnabled } from '../config/featureFlags';
import { handleDeepLink } from '../utils/invitations';

const linking: LinkingOptions<Record<string, unknown>> = {
  prefixes: ['guinote://'],
  config: {
    screens: {
      Jugar: {
        screens: {
          GameRoom: 'room/:roomCode',
        },
      },
    },
  },
  async getInitialURL() {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    return url;
  },
  subscribe(listener) {
    // Listen to incoming links from deep links
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    return () => {
      linkingSubscription.remove();
    };
  },
};

export function RootNavigator() {
  const navigationRef = useRef<Record<string, unknown>>(null);

  useEffect(() => {
    if (!isMultiplayerEnabled()) {
      return undefined;
    }

    // Handle deep links when multiplayer is enabled
    const handleUrl = (url: string) => {
      const result = handleDeepLink(url);
      if (result && navigationRef.current) {
        // @ts-expect-error Navigation ref typing
        navigationRef.current.navigate('Jugar', {
          screen: result.screen,
          params: result.params,
        });
      }
    };

    // Get initial URL if app was opened from deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl(url);
      }
    });

    // Subscribe to URL changes
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={isMultiplayerEnabled() ? linking : undefined}
    >
      <TabNavigator />
    </NavigationContainer>
  );
}
