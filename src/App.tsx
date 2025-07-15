import React from 'react';
import { StatusBar } from 'react-native';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from './constants/colors';

function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <RootNavigator />
    </>
  );
}

export default App;
