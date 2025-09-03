import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';
import { useLandscapeStyles } from '../../hooks/useLandscapeStyles';
import type { GameState, MatchScore } from '../../types/game.types';

type MatchVictoryStatsProps = {
  gameState: GameState;
  matchScore: MatchScore;
  visible: boolean;
  playerTeamIndex: number;
};

type StatItem = {
  label: string;
  team1Value: string | number;
  team2Value: string | number;
  highlight?: 'team1' | 'team2' | null;
};

export function MatchVictoryStats({
  gameState,
  matchScore,
  visible,
  playerTeamIndex,
}: MatchVictoryStatsProps) {
  const styles = useLandscapeStyles(portraitStyles, landscapeStyles);

  // Animation values for each stat row
  const fadeAnims = useRef(Array.from({ length: 10 }, () => new Animated.Value(0))).current;

  const slideAnims = useRef(Array.from({ length: 10 }, () => new Animated.Value(-50))).current;

  useEffect(() => {
    if (visible) {
      // Stagger the animation of each stat row
      const animations = fadeAnims.map((fadeAnim, index) =>
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnims[index], {
            toValue: 0,
            duration: 400,
            delay: index * 100,
            useNativeDriver: true,
          }),
        ]),
      );

      Animated.sequence(animations).start();
    } else {
      // Reset animations
      fadeAnims.forEach(anim => anim.setValue(0));
      slideAnims.forEach(anim => anim.setValue(-50));
    }
  }, [visible, fadeAnims, slideAnims]);

  // Calculate statistics
  const stats: StatItem[] = [
    {
      label: 'Cotos Ganados',
      team1Value: matchScore.team1Cotos,
      team2Value: matchScore.team2Cotos,
      highlight: matchScore.team1Cotos > matchScore.team2Cotos ? 'team1' : 'team2',
    },
    {
      label: 'Partidas Totales',
      team1Value: matchScore.totalPartidasTeam1 || 0,
      team2Value: matchScore.totalPartidasTeam2 || 0,
      highlight:
        (matchScore.totalPartidasTeam1 || 0) > (matchScore.totalPartidasTeam2 || 0)
          ? 'team1'
          : (matchScore.totalPartidasTeam2 || 0) > (matchScore.totalPartidasTeam1 || 0)
          ? 'team2'
          : null,
    },
    {
      label: 'Puntos Totales',
      team1Value: gameState.teams[0].totalPoints || gameState.teams[0].score,
      team2Value: gameState.teams[1].totalPoints || gameState.teams[1].score,
      highlight:
        (gameState.teams[0].totalPoints || gameState.teams[0].score) >
        (gameState.teams[1].totalPoints || gameState.teams[1].score)
          ? 'team1'
          : 'team2',
    },
    {
      label: 'Bazas Ganadas',
      team1Value: gameState.teams[0].tricksWon || 0,
      team2Value: gameState.teams[1].tricksWon || 0,
      highlight:
        (gameState.teams[0].tricksWon || 0) > (gameState.teams[1].tricksWon || 0)
          ? 'team1'
          : (gameState.teams[1].tricksWon || 0) > (gameState.teams[0].tricksWon || 0)
          ? 'team2'
          : null,
    },
    {
      label: 'Cantas Realizadas',
      team1Value: gameState.teams[0].cantas?.length || 0,
      team2Value: gameState.teams[1].cantas?.length || 0,
      highlight:
        (gameState.teams[0].cantas?.length || 0) > (gameState.teams[1].cantas?.length || 0)
          ? 'team1'
          : (gameState.teams[1].cantas?.length || 0) > (gameState.teams[0].cantas?.length || 0)
          ? 'team2'
          : null,
    },
    {
      label: 'Vueltas Jugadas',
      team1Value: matchScore.vueltasCount || 0,
      team2Value: matchScore.vueltasCount || 0,
      highlight: null,
    },
  ];

  // Format time duration
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Add match duration if available
  if (gameState.startTime) {
    const duration = Date.now() - gameState.startTime;
    stats.push({
      label: 'Duración',
      team1Value: formatDuration(duration),
      team2Value: formatDuration(duration),
      highlight: null,
    });
  }

  const renderStatRow = (stat: StatItem, index: number) => {
    const isPlayerTeam1 = playerTeamIndex === 0;
    const team1Label = isPlayerTeam1 ? 'Tu Equipo' : 'Rival';
    const team2Label = isPlayerTeam1 ? 'Rival' : 'Tu Equipo';

    return (
      <Animated.View
        key={stat.label}
        style={[
          styles.statRow,
          {
            opacity: fadeAnims[index],
            transform: [{ translateX: slideAnims[index] }],
          },
        ]}
      >
        <Text style={styles.statLabel}>{stat.label}</Text>
        <View style={styles.statValues}>
          <View
            style={[
              styles.statValue,
              stat.highlight === 'team1' && styles.highlightedValue,
              isPlayerTeam1 && styles.playerTeamValue,
            ]}
          >
            <Text
              style={[styles.statValueText, stat.highlight === 'team1' && styles.highlightedText]}
            >
              {stat.team1Value}
            </Text>
            <Text style={styles.teamLabel}>{team1Label}</Text>
          </View>

          <Text style={styles.statSeparator}>-</Text>

          <View
            style={[
              styles.statValue,
              stat.highlight === 'team2' && styles.highlightedValue,
              !isPlayerTeam1 && styles.playerTeamValue,
            ]}
          >
            <Text
              style={[styles.statValueText, stat.highlight === 'team2' && styles.highlightedText]}
            >
              {stat.team2Value}
            </Text>
            <Text style={styles.teamLabel}>{team2Label}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>ESTADÍSTICAS DEL PARTIDO</Text>
        <View style={styles.headerDecoration} />
      </View>

      <ScrollView
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
        showsVerticalScrollIndicator={false}
      >
        {stats.map((stat, index) => renderStatRow(stat, index))}
      </ScrollView>

      {/* MVP Section */}
      {(gameState.teams[0].cantas?.length || 0) > 0 ||
      (gameState.teams[1].cantas?.length || 0) > 0 ? (
        <View style={styles.mvpSection}>
          <Text style={styles.mvpLabel}>⭐ JUGADA DESTACADA ⭐</Text>
          <Text style={styles.mvpText}>
            {(gameState.teams[0].cantas?.length || 0) > (gameState.teams[1].cantas?.length || 0)
              ? `${gameState.teams[0].cantas?.length} cantas del ${
                  playerTeamIndex === 0 ? 'tu equipo' : 'rival'
                }`
              : `${gameState.teams[1].cantas?.length} cantas del ${
                  playerTeamIndex === 1 ? 'tu equipo' : 'rival'
                }`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function colorWithOpacity(color: string, opacity: number): string {
  const hex = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hex}`;
}

const portraitStyles = StyleSheet.create({
  container: {
    backgroundColor: colorWithOpacity(colors.primary, 0.95),
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: colors.goldDark,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.gold,
    letterSpacing: 1.5,
  },
  headerDecoration: {
    width: 60,
    height: 2,
    backgroundColor: colors.goldDark,
    marginTop: 8,
    borderRadius: 1,
  },
  statsContainer: {
    maxHeight: 200,
  },
  statsContent: {
    paddingBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colorWithOpacity(colors.text, 0.1),
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: colorWithOpacity(colors.text, 0.8),
    fontWeight: '600',
  },
  statValues: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  statValue: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playerTeamValue: {
    backgroundColor: colorWithOpacity(colors.gold, 0.1),
  },
  highlightedValue: {
    backgroundColor: colorWithOpacity(colors.gold, 0.2),
  },
  statValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  highlightedText: {
    color: colors.gold,
  },
  teamLabel: {
    fontSize: 10,
    color: colorWithOpacity(colors.text, 0.6),
    marginTop: 2,
  },
  statSeparator: {
    fontSize: 14,
    color: colorWithOpacity(colors.text, 0.4),
    marginHorizontal: 8,
  },
  mvpSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colorWithOpacity(colors.text, 0.1),
    alignItems: 'center',
  },
  mvpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldBright,
    letterSpacing: 1,
    marginBottom: 4,
  },
  mvpText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
});

const landscapeStyles: Partial<typeof portraitStyles> = {
  container: {
    maxWidth: 500,
    padding: 20,
  },
  headerText: {
    fontSize: 20,
  },
  statsContainer: {
    maxHeight: 250,
  },
  statRow: {
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 15,
  },
  statValueText: {
    fontSize: 18,
  },
  teamLabel: {
    fontSize: 11,
  },
  mvpLabel: {
    fontSize: 14,
  },
  mvpText: {
    fontSize: 16,
  },
};
