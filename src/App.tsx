import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './navigation/RootNavigator';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { colors } from './constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <RootNavigator />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;
