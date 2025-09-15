import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Vibration, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import type { MainTabScreenProps, JugarStackParamList } from '../types/navigation';
import type { JugarStackNavigationProp } from '../types/navigation';
import { ScreenContainer } from '../components/ScreenContainer';

// Landscape screen uses calculated sizes; no fixed Dimensions at module init

type GameMode = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: keyof JugarStackParamList;
};

const primaryModes: GameMode[] = [
  {
    id: 'online-quick',
    title: 'PARTIDA RÁPIDA',
    subtitle: 'Jugar Online',
    icon: '🎯',
    color: colors.quickMatchBlue,
    route: 'QuickMatch',
  },
  {
    id: 'friends',
    title: 'JUGAR CON AMIGOS',
    subtitle: 'Crear o unirse a sala',
    icon: '👥',
    color: colors.friendsGreen,
    route: 'FriendsLobby',
  },
  {
    id: 'offline',
    title: 'JUGAR OFFLINE',
    subtitle: 'Contra la máquina',
    icon: '🤖',
    color: colors.botOrange,
    route: 'OfflineMode',
  },
];

function TallModeCard({ mode, index, size }: { mode: GameMode; index: number; size: { width: number; height: number } }) {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      delay: index * 120,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, index]);

  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(1);
    }
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      speed: 50,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    navigation.navigate(mode.route);
  };

  return (
    <Animated.View
      style={[
        styles.tallCardContainer,
        { width: size.width, height: size.height, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.tallCard, { backgroundColor: mode.color }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
        accessibilityLabel={mode.title}
        accessibilityHint={`Iniciar ${mode.subtitle.toLowerCase()}`}
        accessibilityRole="button"
      >
        <Text style={styles.tallCardIcon}>{mode.icon}</Text>
        <View style={styles.tallCardTextWrap}>
          <Text style={styles.tallCardTitle}>{mode.title}</Text>
          <Text style={styles.tallCardSubtitle}>{mode.subtitle}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function JugarTab({ navigation: tabNavigation }: MainTabScreenProps<'Jugar'>) {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const { width, height } = useWindowDimensions();

  const cardHeight = Math.max(180, Math.min(height * 0.75, 360));
  const cardWidth = Math.max(160, Math.min(width * 0.22, 260));

  const handleTutorial = () => {
    navigation.navigate('TutorialSetup');
  };

  const goToFriends = () => {
    // @ts-expect-error tab nav type
    tabNavigation.navigate('Social');
  };

  return (
    <ScreenContainer gradient orientation="landscape" noPadding>
      <View style={styles.landscapeRoot}>
        <View style={styles.topBar}>
          <View style={styles.profileCompact}>
            <Text style={styles.profileAvatar}>👤</Text>
            <View>
              <Text style={styles.profileName}>Invitado</Text>
              <Text style={styles.profileSub}>ELO 1200</Text>
            </View>
          </View>
          <View style={styles.currency}>
            <Text style={styles.currencyText}>🪙 500</Text>
          </View>
        </View>

        <View style={styles.centerDeck}>
          {primaryModes.map((mode, idx) => (
            <TallModeCard key={mode.id} mode={mode} index={idx} size={{ width: cardWidth, height: cardHeight }} />
          ))}
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.bottomShortcut} onPress={handleTutorial} activeOpacity={0.9}>
            <Text style={styles.bottomEmoji}>🎓</Text>
            <Text style={styles.bottomText}>Tutorial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomShortcut} onPress={goToFriends} activeOpacity={0.9}>
            <Text style={styles.bottomEmoji}>👥</Text>
            <Text style={styles.bottomText}>Amigos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  landscapeRoot: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.spacing.sm,
  },
  profileAvatar: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  profileName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  profileSub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  currency: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyText: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  centerDeck: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: dimensions.spacing.lg,
  },
  tallCardContainer: {
    borderRadius: dimensions.borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  tallCard: {
    flex: 1,
    borderRadius: dimensions.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: dimensions.spacing.xl,
    paddingHorizontal: dimensions.spacing.md,
  },
  tallCardIcon: {
    fontSize: 48,
  },
  tallCardTextWrap: {
    alignItems: 'center',
  },
  tallCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  tallCardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomRow: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: dimensions.spacing.lg,
  },
  bottomShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomEmoji: {
    fontSize: 22,
    marginRight: dimensions.spacing.sm,
  },
  bottomText: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
