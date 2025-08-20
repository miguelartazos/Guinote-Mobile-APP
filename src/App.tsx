import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthErrorBoundary } from './components/AuthErrorBoundary';
import { SupabaseLifecycleProvider } from './providers/SupabaseLifecycleProvider';
import { colors } from './constants/colors';

// Temporarily removed orientation-locker to fix prototype error
// Will re-add later with proper import instead of dynamic require

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function App() {
  // Removed orientation lock code temporarily to fix module loading issue
  // Will be re-added later when the prototype error is resolved

  // SupabaseLifecycleProvider only activates when Supabase features are enabled
  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <SupabaseLifecycleProvider>
          <GestureHandlerRootView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            <RootNavigator />
          </GestureHandlerRootView>
        </SupabaseLifecycleProvider>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
