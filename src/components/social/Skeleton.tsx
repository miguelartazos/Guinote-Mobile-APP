import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type Props = { height?: number; width?: ViewStyle['width']; style?: ViewStyle };

export function Skeleton({ height = 16, width = '100%', style }: Props) {
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.box, { height, width, opacity }, style]} />;
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View>
      {new Array(count).fill(null).map((_, i) => (
        <View key={i} style={{ marginBottom: dimensions.spacing.sm }}>
          <Skeleton height={48} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.secondary,
    borderRadius: dimensions.borderRadius.sm,
  },
});


