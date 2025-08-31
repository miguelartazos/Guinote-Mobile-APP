import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../constants/colors';
import type { TrickCard, TeamId } from '../../types/game.types';
import { calculateHandPoints, getLastTrickBonus } from '../../utils/scoringHelpers';

type HandEndOverlayProps = {
  visible: boolean;
  team1Score: number;
  team2Score: number;
  team1HandPoints?: number; // Points earned in this hand
  team2HandPoints?: number; // Points earned in this hand
  team1Cantes: number;
  team2Cantes: number;
  team1Tricks?: ReadonlyArray<TrickCard[]>; // Tricks collected by team 1
  team2Tricks?: ReadonlyArray<TrickCard[]>; // Tricks collected by team 2
  lastTrickWinnerTeam?: TeamId; // Team that won the last trick
  team1Id?: TeamId;
  team2Id?: TeamId;
  isVueltas: boolean;
  shouldPlayVueltas: boolean;
  onAutoAdvance: () => void;
};

// Constants
const ANIMATION_DURATIONS = {
  FADE_IN: 300,
  FADE_OUT: 200,
  SCORE_COUNT: 1200,
  SPRING_FRICTION: 10,
  SPRING_TENSION: 40,
} as const;

const CARD_DIMENSIONS = {
  // Optimized for iPhone landscape
  WIDTH_RATIO: 0.7, // Wider for landscape
  MAX_WIDTH: 600, // Increased for better landscape use
  HEIGHT_RATIO: 0.85, // Use more vertical space in landscape
  MAX_HEIGHT: 400, // Better for iPhone landscape
  SMALL_SCREEN_THRESHOLD: 380, // iPhone SE landscape height
  SMALL_SCREEN_HEIGHT_RATIO: 0.9, // Use most of the height on small screens
} as const;

// Utility function for color with opacity
const colorWithOpacity = (color: string, opacity: number): string => {
  // Convert opacity from 0-1 to hex (00-FF)
  const hex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hex}`;
};

export function HandEndOverlay({
  visible,
  team1Score,
  team2Score,
  team1HandPoints,
  team2HandPoints,
  team1Cantes,
  team2Cantes,
  team1Tricks = [],
  team2Tricks = [],
  lastTrickWinnerTeam,
  team1Id,
  team2Id,
  isVueltas,
  shouldPlayVueltas,
  onAutoAdvance,
}: HandEndOverlayProps) {
  const [showDetails, setShowDetails] = useState(true); // Show point breakdown initially

  // Animation values - using useRef to persist across renders
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Score counting animation
  const team1ScoreAnim = useRef(new Animated.Value(0)).current;
  const team2ScoreAnim = useRef(new Animated.Value(0)).current;

  // Calculate dimensions with useMemo for performance
  const { cardWidth, cardHeight, isSmallScreen } = useMemo(() => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const isSmall = screenHeight < CARD_DIMENSIONS.SMALL_SCREEN_THRESHOLD;

    return {
      cardWidth: Math.min(screenWidth * CARD_DIMENSIONS.WIDTH_RATIO, CARD_DIMENSIONS.MAX_WIDTH),
      cardHeight: isSmall
        ? screenHeight * CARD_DIMENSIONS.SMALL_SCREEN_HEIGHT_RATIO
        : Math.min(screenHeight * CARD_DIMENSIONS.HEIGHT_RATIO, CARD_DIMENSIONS.MAX_HEIGHT),
      isSmallScreen: isSmall,
    };
  }, []); // Empty deps since screen dimensions don't change during component lifecycle

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);

      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.FADE_IN,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: ANIMATION_DURATIONS.SPRING_FRICTION,
          tension: ANIMATION_DURATIONS.SPRING_TENSION,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate score counting
      Animated.parallel([
        Animated.timing(team1ScoreAnim, {
          toValue: team1Score,
          duration: ANIMATION_DURATIONS.SCORE_COUNT,
          useNativeDriver: false,
        }),
        Animated.timing(team2ScoreAnim, {
          toValue: team2Score,
          duration: ANIMATION_DURATIONS.SCORE_COUNT,
          useNativeDriver: false,
        }),
      ]).start();

      // Calculate actual hand points from tricks if available
      const calculatedTeam1Points =
        team1Tricks.length > 0 ? calculateHandPoints(team1Tricks) : team1HandPoints || 0;
      const calculatedTeam2Points =
        team2Tricks.length > 0 ? calculateHandPoints(team2Tricks) : team2HandPoints || 0;

      // Calculate 10 de últimas bonus
      const team1LastTrickBonus = team1Id ? getLastTrickBonus(lastTrickWinnerTeam, team1Id) : 0;
      const team2LastTrickBonus = team2Id ? getLastTrickBonus(lastTrickWinnerTeam, team2Id) : 0;
    } else {
      // Reset when hidden
      team1ScoreAnim.setValue(0);
      team2ScoreAnim.setValue(0);
    }
  }, [visible, team1Score, team2Score, fadeAnim, scaleAnim, team1ScoreAnim, team2ScoreAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      accessible={true}
    >
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Fin de la mano. Nosotros ${team1Score}, Ellos ${team2Score}`}
      >
        {/* Semi-transparent backdrop */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: fadeAnim }]}
        />

        {/* Score Card - Traditional Spanish design */}
        <Animated.View
          style={[
            styles.card,
            isSmallScreen && styles.cardSmall,
            {
              width: cardWidth,
              minHeight: cardHeight,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          accessible={true}
          accessibilityRole="alert"
        >
          {/* Header Section - Traditional Spanish style */}
          <View style={[styles.headerSection, isSmallScreen && styles.headerSectionSmall]}>
            {/* Decorative Spanish card suits */}
            <View style={styles.suitsDecoration}>
              <Text style={styles.suitIcon}>♠</Text>
              <Text style={[styles.suitIcon, styles.suitRed]}>♥</Text>
              <Text style={styles.suitIcon}>♣</Text>
              <Text style={[styles.suitIcon, styles.suitRed]}>♦</Text>
            </View>
            <Text
              style={[styles.title, isSmallScreen && styles.titleSmall]}
              accessibilityRole="header"
            >
              FIN DE LA MANO
            </Text>
            {isVueltas && (
              <View style={styles.vueltasBadge}>
                <Text style={styles.vueltasBadgeText}>VUELTAS</Text>
              </View>
            )}
            <View style={styles.decorativeLine} />
          </View>

          {/* Main Scores Section - Clean traditional layout */}
          <View
            style={[styles.mainContent, isSmallScreen && styles.mainContentSmall]}
            accessible={true}
          >
            {/* Team 1 - Traditional Spanish style */}
            <View style={[styles.teamSection, styles.teamSectionLeft]}>
              <View style={styles.teamHeader}>
                <Text style={[styles.teamName, isSmallScreen && styles.teamNameSmall]}>
                  NOSOTROS
                </Text>
              </View>
              <View style={styles.scoreContainer}>
                <Animated.Text
                  style={[styles.scoreNumber, isSmallScreen && styles.scoreNumberSmall]}
                  accessibilityLabel={`Nosotros: ${team1Score} puntos`}
                  accessibilityRole="text"
                >
                  {team1ScoreAnim.interpolate({
                    inputRange: [0, team1Score],
                    outputRange: ['0', team1Score.toString()],
                    extrapolate: 'clamp',
                  })}
                </Animated.Text>
                <Text style={styles.puntosLabel}>PUNTOS</Text>
              </View>
              {team1Tricks.length > 0 && (
                <View style={styles.handPointsContainer}>
                  <Text
                    style={[styles.handPointsInfo, isSmallScreen && styles.handPointsInfoSmall]}
                  >
                    +{calculateHandPoints(team1Tricks) + (team1Id === lastTrickWinnerTeam ? 10 : 0)}
                  </Text>
                  <Text style={styles.handPointsLabel}>esta mano</Text>
                </View>
              )}
              {team1Cantes > 0 && (
                <View style={styles.cantesContainer}>
                  <Text
                    style={[styles.cantesInfo, isSmallScreen && styles.cantesInfoSmall]}
                    accessibilityLabel={`más ${team1Cantes} puntos de cantes`}
                  >
                    +{team1Cantes}
                  </Text>
                  <Text style={styles.cantesLabel}>cantes</Text>
                </View>
              )}
            </View>

            {/* Separator - Traditional ornamental */}
            <View style={styles.separatorContainer}>
              <View style={styles.ornamentalDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.separator} accessibilityElementsHidden={true}>
                  VS
                </Text>
                <View style={styles.dividerLine} />
              </View>
            </View>

            {/* Team 2 - Traditional Spanish style */}
            <View style={[styles.teamSection, styles.teamSectionRight]}>
              <View style={styles.teamHeader}>
                <Text style={[styles.teamName, isSmallScreen && styles.teamNameSmall]}>ELLOS</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Animated.Text
                  style={[styles.scoreNumber, isSmallScreen && styles.scoreNumberSmall]}
                  accessibilityLabel={`Ellos: ${team2Score} puntos`}
                  accessibilityRole="text"
                >
                  {team2ScoreAnim.interpolate({
                    inputRange: [0, team2Score],
                    outputRange: ['0', team2Score.toString()],
                    extrapolate: 'clamp',
                  })}
                </Animated.Text>
                <Text style={styles.puntosLabel}>PUNTOS</Text>
              </View>
              {team2Tricks.length > 0 && (
                <View style={styles.handPointsContainer}>
                  <Text
                    style={[styles.handPointsInfo, isSmallScreen && styles.handPointsInfoSmall]}
                  >
                    +{calculateHandPoints(team2Tricks) + (team2Id === lastTrickWinnerTeam ? 10 : 0)}
                  </Text>
                  <Text style={styles.handPointsLabel}>esta mano</Text>
                </View>
              )}
              {team2Cantes > 0 && (
                <View style={styles.cantesContainer}>
                  <Text
                    style={[styles.cantesInfo, isSmallScreen && styles.cantesInfoSmall]}
                    accessibilityLabel={`más ${team2Cantes} puntos de cantes`}
                  >
                    +{team2Cantes}
                  </Text>
                  <Text style={styles.cantesLabel}>cantes</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Message Section - Traditional finish */}
          <View style={[styles.bottomSection, isSmallScreen && styles.bottomSectionSmall]}>
            {team1Score >= 101 ? (
              <Text style={[styles.messageText, styles.winMessage]} accessibilityRole="alert">
                ¡Victoria! Ganamos la partida
              </Text>
            ) : team2Score >= 101 ? (
              <Text style={[styles.messageText, styles.loseMessage]} accessibilityRole="alert">
                Derrota - Ellos ganan la partida
              </Text>
            ) : shouldPlayVueltas ? (
              <View style={styles.vueltasMessage}>
                <Text style={styles.messageText}>Ningún equipo alcanzó 101 puntos</Text>
                <Text style={styles.vueltasStarting}>¡Comenzando vueltas!</Text>
              </View>
            ) : null}

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                // Fade out before advancing
                Animated.parallel([
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: ANIMATION_DURATIONS.FADE_OUT,
                    useNativeDriver: true,
                  }),
                  Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: ANIMATION_DURATIONS.FADE_OUT,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  onAutoAdvance();
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>CONTINUAR</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // Darker for better contrast
  },
  card: {
    backgroundColor: colors.primary, // Traditional dark green
    borderRadius: 16,
    padding: 32,
    elevation: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    borderWidth: 2,
    borderColor: colors.goldDark,
  },
  cardSmall: {
    padding: 20,
    borderRadius: 12,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerSectionSmall: {
    marginBottom: 16,
  },
  suitsDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    opacity: 0.6,
  },
  suitIcon: {
    fontSize: 20,
    marginHorizontal: 8,
    color: colors.goldDark,
  },
  suitRed: {
    color: colors.error,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleSmall: {
    fontSize: 22,
  },
  decorativeLine: {
    width: 100,
    height: 2,
    backgroundColor: colors.goldDark,
    marginTop: 12,
    opacity: 0.8,
  },
  vueltasBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  vueltasBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingVertical: 20,
  },
  mainContentSmall: {
    paddingVertical: 12,
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  teamSectionLeft: {
    borderRightWidth: 0,
  },
  teamSectionRight: {
    borderLeftWidth: 0,
  },
  teamHeader: {
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  teamNameSmall: {
    fontSize: 15,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.gold,
    lineHeight: 72,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreNumberSmall: {
    fontSize: 56,
    lineHeight: 56,
  },
  puntosLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: -4,
  },
  handPointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  handPointsInfo: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: '700',
  },
  handPointsInfoSmall: {
    fontSize: 16,
  },
  handPointsLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
  },
  cantesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  cantesInfo: {
    fontSize: 16,
    color: colors.goldBright,
    fontWeight: '600',
  },
  cantesInfoSmall: {
    fontSize: 14,
  },
  cantesLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
  },
  separatorContainer: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ornamentalDivider: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    width: 1,
    height: 40,
    backgroundColor: colorWithOpacity(colors.goldDark, 0.3),
  },
  separator: {
    fontSize: 16,
    color: colors.goldDark,
    fontWeight: '700',
    letterSpacing: 1,
    marginVertical: 8,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colorWithOpacity(colors.goldDark, 0.2),
  },
  bottomSectionSmall: {
    marginTop: 12,
    paddingTop: 12,
  },
  vueltasMessage: {
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  vueltasStarting: {
    fontSize: 16,
    color: colors.gold,
    fontWeight: '600',
    marginTop: 4,
  },
  winMessage: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  loseMessage: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  // New styles for point breakdown
  breakdownSection: {
    backgroundColor: colorWithOpacity(colors.primary, 0.05),
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colorWithOpacity(colors.gold, 0.3),
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breakdownTeam: {
    flex: 1,
    paddingHorizontal: 10,
  },
  breakdownTeamName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownDetails: {
    backgroundColor: colorWithOpacity(colors.surface, 0.5),
    borderRadius: 8,
    padding: 10,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    minWidth: 40,
    textAlign: 'right',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: colorWithOpacity(colors.gold, 0.3),
    marginTop: 8,
    paddingTop: 8,
  },
  breakdownLabelTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
    flex: 1,
  },
  breakdownValueTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.gold,
    minWidth: 40,
    textAlign: 'right',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: colorWithOpacity(colors.textMuted, 0.2),
    marginHorizontal: 10,
  },
  // Continue button styles
  continueButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
