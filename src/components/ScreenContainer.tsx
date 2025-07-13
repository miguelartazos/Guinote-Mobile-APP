import React from 'react';
import { SafeAreaView, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';

type ScreenContainerProps = ViewProps & {
  children: React.ReactNode;
};

export function ScreenContainer({ children, style, ...props }: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.container, style]} {...props}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: dimensions.screen.paddingHorizontal,
    paddingVertical: dimensions.screen.paddingVertical,
  },
});