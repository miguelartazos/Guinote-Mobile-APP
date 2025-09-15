import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import type { MainTabScreenProps } from '../types/navigation';
import { SocialScreen } from './SocialScreen';

export function SocialTab(_: MainTabScreenProps<'Social'>) {
  return (
    <View style={styles.container}>
      <SocialScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: dimensions.spacing.xs,
  },
});
