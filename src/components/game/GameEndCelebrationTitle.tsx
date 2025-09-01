import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { useLandscapeStyles } from '../../hooks/useLandscapeStyles';

type CelebrationType = 'partida' | 'coto' | 'match';

type GameEndCelebrationTitleProps = {
  isWinner: boolean;
  celebrationType: CelebrationType;
  titleAnimation: {
    opacity: Animated.Value;
    scale: Animated.Value;
    translateY: Animated.Value;
  };
  isVueltasTransition?: boolean;
};

export const GameEndCelebrationTitle = React.memo(
  ({
    isWinner,
    celebrationType,
    titleAnimation,
    isVueltasTransition = false,
  }: GameEndCelebrationTitleProps) => {
    const styles = useLandscapeStyles(portraitStyles, landscapeStyles);

    const getTitle = () => {
      if (isVueltasTransition) {
        return 'FIN DE MANO';
      }
      if (celebrationType === 'partida') {
        return isWinner ? 'PARTIDA GANADA' : 'PARTIDA PERDIDA';
      }
      if (celebrationType === 'coto') {
        return isWinner ? 'COTO GANADO' : 'COTO PERDIDO';
      }
      return isWinner ? '¡VICTORIA FINAL!' : 'FIN DEL JUEGO';
    };

    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: titleAnimation.opacity,
            transform: [{ scale: titleAnimation.scale }, { translateY: titleAnimation.translateY }],
          },
        ]}
      >
        <View style={styles.suitDecoration}>
          <Text style={[styles.suitIcon, styles.suitBlack]}>♠</Text>
          <Text style={[styles.suitIcon, styles.suitRed]}>♥</Text>
          <Text style={[styles.suitIcon, styles.suitBlack]}>♣</Text>
          <Text style={[styles.suitIcon, styles.suitRed]}>♦</Text>
        </View>

        {isWinner && (
          <Animated.View
            style={[
              styles.crownContainer,
              {
                transform: [
                  {
                    rotate: titleAnimation.scale.interpolate({
                      inputRange: [0.9, 1],
                      outputRange: ['-5deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.crownIcon}>♔</Text>
          </Animated.View>
        )}

        <View style={styles.titleBorder}>
          <Text style={[styles.titleText, isWinner && styles.winnerText]}>{getTitle()}</Text>
        </View>

        <View style={styles.decorativeContainer}>
          <View style={styles.decorativeLine} />
          <Text style={styles.decorativeDot}>◆</Text>
          <View style={styles.decorativeLine} />
        </View>
      </Animated.View>
    );
  },
);

GameEndCelebrationTitle.displayName = 'GameEndCelebrationTitle';

// Helper function for color with opacity
function colorWithOpacity(color: string, opacity: number): string {
  const hex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hex}`;
}

const portraitStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 30,
  },
  suitDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    opacity: 0.7,
  },
  suitIcon: {
    fontSize: 22,
    marginHorizontal: 10,
  },
  suitBlack: {
    color: colors.primary,
    textShadowColor: colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  suitRed: {
    color: colors.error,
    textShadowColor: colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  crownContainer: {
    marginBottom: 10,
  },
  crownIcon: {
    fontSize: 42,
    color: colors.gold,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleBorder: {
    borderWidth: 2,
    borderColor: colors.goldDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colorWithOpacity(colors.primary, 0.8),
  },
  titleText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  winnerText: {
    color: colors.gold,
  },
  decorativeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  decorativeLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.goldDark,
    opacity: 0.8,
  },
  decorativeDot: {
    fontSize: 12,
    color: colors.goldDark,
    marginHorizontal: 8,
    opacity: 0.8,
  },
});

const landscapeStyles: Partial<typeof portraitStyles> = {
  container: {
    marginBottom: 35,
  },
  titleText: {
    fontSize: 36,
    letterSpacing: 3,
  },
  decorativeLine: {
    width: 80,
  },
};
