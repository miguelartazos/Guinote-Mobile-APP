import React, { useMemo } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/clerk-expo';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { APP_CONFIG } from '../config/appConfig';

// Create Convex client singleton
const convex = new ConvexReactClient(APP_CONFIG.CONVEX_URL, {
  unsavedChangesWarning: false,
});

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

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!APP_CONFIG.CONVEX_URL) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Convex Configuration Error</Text>
        <Text style={styles.instructionText}>
          Convex URL is not configured.{'\n'}
          Please check appConfig.ts
        </Text>
      </View>
    );
  }

  // Log when provider is ready
  if (APP_CONFIG.SHOW_AUTH_LOGS) {
    console.log(
      '[ConvexClientProvider] Initializing ConvexProviderWithClerk with URL:',
      APP_CONFIG.CONVEX_URL,
    );
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
