import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import type { MainTabScreenProps, JugarStackParamList } from '../types/navigation';
import type { JugarStackNavigationProp } from '../types/navigation';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - dimensions.spacing.lg * 3) / 2;
const CARD_HEIGHT = 120;

type GameMode = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: keyof JugarStackParamList;
};

const gameModes: GameMode[] = [
  {
    id: 'quick',
    title: 'PARTIDA RÁPIDA',
    subtitle: 'Jugar Online',
    icon: '🎯',
    color: colors.quickMatchBlue,
    route: 'OnlineLobby',
  },
  {
    id: 'friends',
    title: 'CON AMIGOS',
    subtitle: 'Crear Sala',
    icon: '👥',
    color: colors.friendsGreen,
    route: 'FriendsLobby',
  },
  {
    id: 'bot',
    title: 'VS MÁQUINA',
    subtitle: 'Practica con IA',
    icon: '🤖',
    color: colors.botOrange,
    route: 'OfflineMode',
  },
  {
    id: 'local',
    title: 'PASAR Y JUGAR',
    subtitle: 'Multijugador Local',
    icon: '📱',
    color: colors.localPurple,
    route: 'LocalMultiplayer',
  },
];

function GameModeCard({ mode, index }: { mode: GameMode; index: number }) {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(1);
    }
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      speed: 50,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    navigation.navigate(mode.route);
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.gameCard, { backgroundColor: mode.color }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityLabel={mode.title}
        accessibilityHint={`Iniciar ${mode.subtitle.toLowerCase()}`}
        accessibilityRole="button"
      >
        <View style={styles.cardIconContainer}>
          <Text style={styles.cardIcon}>{mode.icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{mode.title}</Text>
          <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function JugarTab({ navigation: tabNavigation }: MainTabScreenProps<'Jugar'>) {
  const navigation = useNavigation<JugarStackNavigationProp>();

  const handleTutorial = () => {
    navigation.navigate('TutorialSetup');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>JUGAR</Text>
        <Text style={styles.headerSubtitle}>Elige tu modo de juego</Text>
      </View>

      {/* Main Content - 2x2 Grid */}
      <View style={styles.content}>
        <View style={styles.gridContainer}>
          {gameModes.map((mode, index) => (
            <GameModeCard key={mode.id} mode={mode} index={index} />
          ))}
        </View>

        {/* Tutorial Button */}
        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={handleTutorial}
          activeOpacity={0.8}
          accessibilityLabel="Tutorial"
          accessibilityHint="Aprender cómo jugar al Guiñote"
          accessibilityRole="button"
        >
          <Text style={styles.tutorialIcon}>🎓</Text>
          <Text style={styles.tutorialText}>Aprender a Jugar</Text>
          <Text style={styles.tutorialArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: dimensions.spacing.lg,
    paddingHorizontal: dimensions.spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.mediterraneanTerracotta,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.xs,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.xl,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'center',
    paddingVertical: dimensions.spacing.lg,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: dimensions.spacing.md,
  },
  gameCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dimensions.borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    padding: dimensions.spacing.md,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
  },
  cardContent: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xs,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    textAlign: 'center',
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.mediterraneanSand,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    marginTop: dimensions.spacing.lg,
    minHeight: dimensions.touchTarget.minimum,
  },
  tutorialIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.md,
  },
  tutorialText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.mediterraneanSand,
    flex: 1,
  },
  tutorialArrow: {
    fontSize: 28,
    color: colors.mediterraneanSand,
    fontWeight: '300',
  },
});
