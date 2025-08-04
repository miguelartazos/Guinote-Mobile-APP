import React from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Text, View, StyleSheet } from 'react-native';
import { APP_CONFIG } from '../config/appConfig';
import { ClerkAuthSync } from './ClerkAuthSync';

// Create Convex client
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

  return (
    <ClerkAuthSync convexClient={convex}>
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ClerkAuthSync>
  );
}
