import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { LAYOUT } from './PlayerPositions';
import { hapticFeedback } from '../../utils/haptics';

interface ActionButtonsProps {
  onCante: () => void;
  onChange7: () => void;
  onExit: () => void;
  canCante: boolean;
  canChange7: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCante,
  onChange7,
  onExit,
  canCante,
  canChange7,
}) => {
  const canteScale = useSharedValue(1);
  const change7Scale = useSharedValue(1);
  const exitScale = useSharedValue(1);

  const handlePress = (
    action: () => void,
    scale: Animated.SharedValue<number>,
    enabled: boolean = true,
  ) => {
    if (!enabled) return;

    hapticFeedback.medium();
    scale.value = withSpring(0.9, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });

    action();
  };

  const canteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: canteScale.value }],
    opacity: canCante ? 1 : 0.3,
    backgroundColor: canCante ? '#4CAF50' : '#9E9E9E',
  }));

  const change7Style = useAnimatedStyle(() => ({
    transform: [{ scale: change7Scale.value }],
    opacity: canChange7 ? 1 : 0.5,
  }));

  const exitStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exitScale.value }],
  }));

  return (
    <View style={styles.container}>
      <AnimatedPressable
        style={[styles.button, styles.canteButton, canteStyle]}
        onPress={() => handlePress(onCante, canteScale, canCante)}
        disabled={!canCante}
      >
        <Text style={styles.buttonText}>Cantar</Text>
      </AnimatedPressable>

      <AnimatedPressable
        style={[styles.button, styles.change7Button, change7Style]}
        onPress={() => handlePress(onChange7, change7Scale, canChange7)}
        disabled={!canChange7}
      >
        <Text style={styles.buttonText}>Cambiar 7</Text>
      </AnimatedPressable>

      <AnimatedPressable
        style={[styles.button, styles.exitButton, exitStyle]}
        onPress={() => handlePress(onExit, exitScale)}
      >
        <Text style={styles.exitButtonText}>Salir</Text>
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  canteButton: {
    // backgroundColor is now dynamic in canteStyle
  },
  change7Button: {
    backgroundColor: '#26A69A',
  },
  exitButton: {
    backgroundColor: '#D32F2F', // Red for exit
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ActionButtons;
