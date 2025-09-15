import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLandscapeTokens } from '../../utils/layout/tokens';

type LandscapeContainerProps = {
  children: React.ReactNode;
  backgroundColor?: string;
  unsafe?: boolean;
  noPadding?: boolean;
  style?: any;
};

export function LandscapeContainer({
  children,
  backgroundColor,
  unsafe = true,
  noPadding = true,
  style,
}: LandscapeContainerProps) {
  const t = useLandscapeTokens();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: backgroundColor || 'transparent' },
        noPadding && styles.noPadding,
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          alignSelf: 'center',
          width: Math.min(t.gutters.maxContentWidth, t.vw),
          paddingHorizontal: noPadding ? 0 : t.spacing.s4,
        }}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  noPadding: {
    padding: 0,
  },
});


