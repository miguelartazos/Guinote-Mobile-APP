import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  BackHandler,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import { useConvexAuth } from '../hooks/useConvexAuth';
import { useConvexMatchmaking } from '../hooks/useConvexMatchmaking';
import type { JugarStackScreenProps } from '../types/navigation';

export function QuickMatchScreen({
  navigation,
}: JugarStackScreenProps<'QuickMatch'>) {
  const { user, isAuthenticated } = useConvexAuth();
  const { status, error, startMatchmaking, cancelMatchmaking } =
    useConvexMatchmaking();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || !user) {
      navigation.navigate('Login');
      return;
    }

    // Start matchmaking
    startMatchmaking(user._id);

    // Handle back button
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (user) {
          cancelMatchmaking(user._id);
        }
        navigation.goBack();
        return true;
      },
    );

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Cleanup
    return () => {
      if (user) {
        cancelMatchmaking(user._id);
      }
      backHandler.remove();
    };
  }, [isAuthenticated, user, startMatchmaking, cancelMatchmaking, navigation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Partida Rápida</Text>
          <Text style={styles.subtitle}>
            {status.status === 'searching'
              ? 'Buscando jugadores...'
              : status.status === 'found'
              ? '¡Partida encontrada!'
              : status.status === 'error'
              ? 'Error al buscar partida'
              : 'Preparando búsqueda...'}
          </Text>
        </View>

        <View style={styles.content}>
          {status.status === 'searching' && (
            <>
              <View style={styles.onlineStats}>
                <Text style={styles.onlineIcon}>🌐</Text>
                <Text style={styles.onlineNumber}>{status.playersInQueue}</Text>
                <Text style={styles.onlineLabel}>jugadores en cola</Text>
              </View>

              <View style={styles.searchCard}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <ActivityIndicator size="large" color={colors.accent} />
                </Animated.View>
                <Text style={styles.searchText}>Buscando partida...</Text>
                <Text style={styles.searchSubtext}>
                  ELO: {user?.elo || 1000} (±{status.eloRange})
                </Text>
                <Text style={styles.waitTime}>
                  Tiempo: {formatTime(status.waitTime)}
                </Text>
              </View>

              <View style={styles.playersContainer}>
                <Text style={styles.playersTitle}>
                  Sala de juego (4 jugadores)
                </Text>
                <View style={styles.playersList}>
                  <View style={styles.playerSlot}>
                    <Text style={styles.playerIcon}>
                      {user?.avatar || '👤'}
                    </Text>
                    <Text style={styles.playerName}>
                      {user?.username || 'Tú'}
                    </Text>
                    <Text style={styles.playerStatus}>Listo</Text>
                  </View>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={[styles.playerSlot, styles.emptySlot]}>
                      <Text style={styles.playerIcon}>⏳</Text>
                      <Text style={styles.playerName}>Buscando...</Text>
                      <Text style={styles.playerStatus}>—</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.estimateContainer}>
                <Text style={styles.estimateText}>
                  ⏱️ Tiempo estimado: {status.estimatedTime} segundos
                </Text>
              </View>
            </>
          )}

          {status.status === 'found' && (
            <View style={styles.foundContainer}>
              <Text style={styles.foundIcon}>✅</Text>
              <Text style={styles.foundText}>¡Partida encontrada!</Text>
              <Text style={styles.foundSubtext}>Preparando el juego...</Text>
              <ActivityIndicator
                size="large"
                color={colors.accent}
                style={styles.loader}
              />
            </View>
          )}

          {status.status === 'error' && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>❌</Text>
              <Text style={styles.errorText}>
                {error || 'Error al buscar partida'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            variant="secondary"
            onPress={() => {
              if (user) {
                cancelMatchmaking(user._id);
              }
              navigation.goBack();
            }}
            style={styles.button}
          >
            Cancelar Búsqueda
          </Button>

          <Button
            onPress={() =>
              navigation.navigate('Game', {
                gameMode: 'offline',
                difficulty: 'medium',
              })
            }
            style={styles.button}
          >
            Jugar Offline
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    marginTop: dimensions.spacing.xl,
    paddingHorizontal: dimensions.spacing.lg,
  },
  onlineStats: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  onlineIcon: {
    fontSize: typography.fontSize.xl,
    marginBottom: dimensions.spacing.sm,
  },
  onlineNumber: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  onlineLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  searchText: {
    fontSize: typography.fontSize.xl,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.sm,
  },
  searchSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  waitTime: {
    fontSize: typography.fontSize.md,
    color: colors.secondary,
    marginTop: dimensions.spacing.sm,
  },
  playersContainer: {
    marginTop: dimensions.spacing.lg,
  },
  playersTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playerSlot: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    alignItems: 'center',
    width: '48%',
    marginBottom: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  emptySlot: {
    borderColor: colors.secondary,
    opacity: 0.6,
  },
  playerIcon: {
    fontSize: typography.fontSize.xl,
    marginBottom: dimensions.spacing.sm,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: dimensions.spacing.xs,
  },
  playerStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  estimateContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
  },
  estimateText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontStyle: 'italic',
  },
  foundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foundIcon: {
    fontSize: 80,
    marginBottom: dimensions.spacing.lg,
  },
  foundText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  foundSubtext: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    marginBottom: dimensions.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: dimensions.spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    paddingHorizontal: dimensions.spacing.xl,
  },
  loader: {
    marginTop: dimensions.spacing.lg,
  },
  buttonContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xxl,
  },
  button: {
    marginTop: dimensions.spacing.md,
  },
});
