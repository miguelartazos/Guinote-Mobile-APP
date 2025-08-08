import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  useAuth as useClerkAuth,
  useUser,
  useSignIn,
  useSignUp,
} from '@clerk/clerk-expo';
import { APP_CONFIG } from '../config/appConfig';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

export function ClerkDebug() {
  const clerkAuth = useClerkAuth();
  const { user } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const debugInfo = {
    publishableKey: APP_CONFIG.CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing',
    convexUrl: APP_CONFIG.CONVEX_URL ? 'Set' : 'Missing',
    clerkAuth: {
      isLoaded: clerkAuth.isLoaded,
      isSignedIn: clerkAuth.isSignedIn,
      userId: clerkAuth.userId,
      sessionId: clerkAuth.sessionId,
      orgId: clerkAuth.orgId,
    },
    user: user
      ? {
          id: user.id,
          username: user.username,
          email: user.emailAddresses?.[0]?.emailAddress,
          verified: user.emailAddresses?.[0]?.verification?.status,
        }
      : null,
    signIn: {
      exists: !!signIn,
      status: (signIn as any)?.status,
    },
    signUp: {
      exists: !!signUp,
      status: signUp?.status,
      id: signUp?.id,
    },
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Clerk Debug Info</Text>
      <View style={styles.section}>
        <Text style={styles.json}>{JSON.stringify(debugInfo, null, 2)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 20,
  },
  section: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  json: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.text,
  },
});
