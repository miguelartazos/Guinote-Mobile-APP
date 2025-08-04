import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * AuthGuard component that protects routes requiring authentication
 * Redirects to login if user is not authenticated
 */
export function AuthGuard({
  children,
  fallback,
  requireAuth = true,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, isLoaded } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (isLoaded && !isAuthenticated && requireAuth) {
      // Redirect to login if auth is required but user is not authenticated
      navigation.navigate('Login' as never);
    }
  }, [isLoaded, isAuthenticated, requireAuth, navigation]);

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show fallback if provided and user is not authenticated
  if (!isAuthenticated && requireAuth && fallback) {
    return <>{fallback}</>;
  }

  // Show children if authenticated or auth not required
  if (!requireAuth || isAuthenticated) {
    return <>{children}</>;
  }

  // Default: show loading (navigation will happen via useEffect)
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
