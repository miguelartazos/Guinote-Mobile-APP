import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  rightElement?: React.ReactNode;
  animateEntrance?: boolean;
};

export function SectionHeader({
  title,
  subtitle,
  icon,
  rightElement,
  animateEntrance = false,
}: SectionHeaderProps) {
  const fadeAnim = React.useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const slideAnim = React.useRef(new Animated.Value(animateEntrance ? -20 : 0)).current;

  React.useEffect(() => {
    if (animateEntrance) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateEntrance, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.leftContent}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.sm,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightElement: {
    marginLeft: dimensions.spacing.md,
  },
});
