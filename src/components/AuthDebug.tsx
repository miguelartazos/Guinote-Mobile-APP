import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: '600',
    marginRight: 10,
    minWidth: 120,
  },
  value: {
    flex: 1,
    color: '#666',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
});

export function AuthDebug() {
  // Clerk auth
  const clerkAuth = useClerkAuth();
  const { user: clerkUser } = useUser();

  // Convex auth
  const convexAuth = useConvexAuth();

  // Test Convex authenticated query
  const currentUser = useQuery(api.auth.getCurrentUser);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Clerk Authentication</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Is Loaded:</Text>
          <Text
            style={[
              styles.value,
              clerkAuth.isLoaded ? styles.success : styles.error,
            ]}
          >
            {String(clerkAuth.isLoaded)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Is Signed In:</Text>
          <Text
            style={[
              styles.value,
              clerkAuth.isSignedIn ? styles.success : styles.error,
            ]}
          >
            {String(clerkAuth.isSignedIn)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>User ID:</Text>
          <Text style={styles.value}>{clerkUser?.id || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Username:</Text>
          <Text style={styles.value}>
            {clerkUser?.username ||
              clerkUser?.emailAddresses?.[0]?.emailAddress ||
              'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Convex Authentication</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Is Loading:</Text>
          <Text
            style={[
              styles.value,
              !convexAuth.isLoading ? styles.success : styles.error,
            ]}
          >
            {String(convexAuth.isLoading)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Is Authenticated:</Text>
          <Text
            style={[
              styles.value,
              convexAuth.isAuthenticated ? styles.success : styles.error,
            ]}
          >
            {String(convexAuth.isAuthenticated)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Convex User Query</Text>
        {currentUser === undefined ? (
          <Text style={styles.value}>Loading...</Text>
        ) : currentUser === null ? (
          <Text style={styles.error}>Not authenticated or user not found</Text>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Has Identity:</Text>
              <Text style={[styles.value, styles.success]}>
                {String(!!currentUser.identity)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Identity Subject:</Text>
              <Text style={styles.value}>
                {currentUser.identity?.subject || 'N/A'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Has User Record:</Text>
              <Text
                style={[
                  styles.value,
                  currentUser.user ? styles.success : styles.error,
                ]}
              >
                {String(!!currentUser.user)}
              </Text>
            </View>
            {currentUser.user && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>User ID:</Text>
                  <Text style={styles.value}>{currentUser.user._id}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Username:</Text>
                  <Text style={styles.value}>{currentUser.user.username}</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Integration Status</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Clerk → Convex:</Text>
          <Text
            style={[
              styles.value,
              clerkAuth.isSignedIn && convexAuth.isAuthenticated
                ? styles.success
                : styles.error,
            ]}
          >
            {clerkAuth.isSignedIn && convexAuth.isAuthenticated
              ? '✅ Working'
              : '❌ Not Working'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>JWT Token:</Text>
          <Text
            style={[
              styles.value,
              currentUser?.identity ? styles.success : styles.error,
            ]}
          >
            {currentUser?.identity ? '✅ Valid' : '❌ Invalid or Missing'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
