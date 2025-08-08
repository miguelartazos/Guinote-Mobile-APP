import React from 'react';
import { ClerkProvider as ClerkProviderBase } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '../config/appConfig';
import { View, Text, StyleSheet } from 'react-native';

// Get publishable key from hardcoded config
const publishableKey = APP_CONFIG.CLERK_PUBLISHABLE_KEY;

if (!publishableKey && APP_CONFIG.ENABLE_AUTH) {
  console.error(
    '[ClerkProvider] No publishable key found! Auth will not work.',
  );
}

// Token cache using expo-secure-store for enhanced security
const tokenCache = {
  async getToken(key: string) {
    try {
      const token = await SecureStore.getItemAsync(key);
      return token;
    } catch (err) {
      console.error('Error getting token from SecureStore:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('Error saving token to SecureStore:', err);
    }
  },
};

// Token cache configured for Clerk

interface ClerkProviderProps {
  children: React.ReactNode;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Always provide ClerkProvider, even if auth is disabled
  if (!publishableKey) {
    if (APP_CONFIG.ENABLE_AUTH) {
      // Auth is required but no key provided
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Authentication Error</Text>
          <Text style={styles.instructionText}>
            Clerk publishable key is missing.{'\n'}
            Please check your configuration.
          </Text>
        </View>
      );
    }

    // Auth is disabled, provide a mock provider
    console.log('[ClerkProvider] Running without authentication');
    return <>{children}</>;
  }

  // Normal case: Clerk is properly configured
  return (
    <ClerkProviderBase publishableKey={publishableKey} tokenCache={tokenCache}>
      {children}
    </ClerkProviderBase>
  );
}
