import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthErrorBoundary } from './components/AuthErrorBoundary';
import { ClerkProvider } from './providers/ClerkProvider';
import { ConvexClientProvider } from './providers/ConvexClientProvider';
import { colors } from './constants/colors';

// Initialize orientation locker
let Orientation: any = null;
try {
  Orientation = require('react-native-orientation-locker').default;
} catch (error) {
  console.warn('react-native-orientation-locker not available');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function App() {
  useEffect(() => {
    // Set initial orientation to portrait for menu screens
    if (Orientation) {
      try {
        Orientation.lockToPortrait();
      } catch (error) {
        console.warn('Failed to set initial orientation:', error);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <ClerkProvider>
          <ConvexClientProvider>
            <GestureHandlerRootView style={styles.container}>
              <StatusBar
                barStyle="light-content"
                backgroundColor={colors.primary}
              />
              <RootNavigator />
            </GestureHandlerRootView>
          </ConvexClientProvider>
        </ClerkProvider>
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
