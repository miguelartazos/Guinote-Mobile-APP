import React from 'react';
import { SafeAreaView, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { useOrientationLock } from '../hooks/useOrientationLock';
import type { OrientationLock } from '../hooks/useOrientationLock';

type ScreenContainerProps = ViewProps & {
  children: React.ReactNode;
  orientation?: OrientationLock;
};

export function ScreenContainer({
  children,
  style,
  orientation = null,
  ...props
}: ScreenContainerProps) {
  useOrientationLock(orientation);

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
