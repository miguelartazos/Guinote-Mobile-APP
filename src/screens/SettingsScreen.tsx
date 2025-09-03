import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { ScreenContainer } from '../components/ScreenContainer';
import { ColorButton } from '../components/game/ColorButton';
import { colors, TABLE_COLORS } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import { useGameSettings } from '../hooks/useGameSettings';
import type { MainTabScreenProps } from '../types/navigation';
import type { DifficultyLevel } from '../types/game.types';
import type { CardSize, TableColor } from '../utils/gameSettings';

export function SettingsScreen({ navigation: _ }: MainTabScreenProps<'Ajustes'>) {
  const {
    settings: gameSettings,
    updateSettings: updateGameSettings,
    resetSettings: resetGameSettings,
  } = useGameSettings();

  if (!gameSettings) {
    return null;
  }

  const handleMasterVolumeChange = async (newVolume: number) => {
    try {
      await updateGameSettings({ masterVolume: newVolume });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el volumen');
    }
  };

  const handleDifficultyChange = async (difficulty: DifficultyLevel) => {
    try {
      await updateGameSettings({ difficulty });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar la dificultad');
    }
  };

  const handleSoundEffectsToggle = async (enabled: boolean) => {
    try {
      await updateGameSettings({ soundEffectsEnabled: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar los efectos de sonido');
    }
  };

  const handleVoiceMessagesToggle = async (enabled: boolean) => {
    try {
      await updateGameSettings({ voiceMessagesEnabled: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar los mensajes de voz');
    }
  };

  const handleBackgroundMusicToggle = async (enabled: boolean) => {
    try {
      await updateGameSettings({ backgroundMusicEnabled: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la música de fondo');
    }
  };

  const handleCardSizeChange = async (size: CardSize) => {
    try {
      await updateGameSettings({ cardSize: size });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el tamaño de las cartas');
    }
  };

  const handleTableColorChange = async (color: TableColor) => {
    try {
      await updateGameSettings({ tableColor: color });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el color de la mesa');
    }
  };

  const handleHighContrastToggle = async (enabled: boolean) => {
    try {
      await updateGameSettings({ highContrastMode: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el modo de alto contraste');
    }
  };

  const handleResetSettings = async () => {
    Alert.alert(
      'Restablecer configuración',
      '¿Estás seguro de que quieres restablecer toda la configuración?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetGameSettings();
              Alert.alert('Éxito', 'Configuración restablecida correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo restablecer la configuración');
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Configura el juego a tu gusto</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* GAMEPLAY SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🎮</Text>
              <Text style={styles.sectionTitle}>Juego</Text>
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>Dificultad de la IA</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.difficulty === 'easy' && styles.optionButtonActive,
                  ]}
                  onPress={() => handleDifficultyChange('easy')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.difficulty === 'easy' && styles.optionButtonTextActive,
                    ]}
                  >
                    Fácil
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.difficulty === 'medium' && styles.optionButtonActive,
                  ]}
                  onPress={() => handleDifficultyChange('medium')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.difficulty === 'medium' && styles.optionButtonTextActive,
                    ]}
                  >
                    Medio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.difficulty === 'hard' && styles.optionButtonActive,
                  ]}
                  onPress={() => handleDifficultyChange('hard')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.difficulty === 'hard' && styles.optionButtonTextActive,
                    ]}
                  >
                    Difícil
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>Tamaño de cartas</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.cardSize === 'normal' && styles.optionButtonActive,
                  ]}
                  onPress={() => handleCardSizeChange('normal')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.cardSize === 'normal' && styles.optionButtonTextActive,
                    ]}
                  >
                    Normal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.cardSize === 'large' && styles.optionButtonActive,
                  ]}
                  onPress={() => handleCardSizeChange('large')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.cardSize === 'large' && styles.optionButtonTextActive,
                    ]}
                  >
                    Grande
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>Color de la mesa</Text>
              <View style={styles.colorButtonGroup}>
                <ColorButton
                  color={TABLE_COLORS.green}
                  isSelected={gameSettings.tableColor === 'green'}
                  onPress={() => handleTableColorChange('green')}
                />
                <ColorButton
                  color={TABLE_COLORS.blue}
                  isSelected={gameSettings.tableColor === 'blue'}
                  onPress={() => handleTableColorChange('blue')}
                />
                <ColorButton
                  color={TABLE_COLORS.red}
                  isSelected={gameSettings.tableColor === 'red'}
                  onPress={() => handleTableColorChange('red')}
                />
                <ColorButton
                  color={TABLE_COLORS.wood}
                  isSelected={gameSettings.tableColor === 'wood'}
                  onPress={() => handleTableColorChange('wood')}
                />
              </View>
            </View>
          </View>

          {/* AUDIO SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🔊</Text>
              <Text style={styles.sectionTitle}>Audio</Text>
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>
                Volumen general: {Math.round(gameSettings.masterVolume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={gameSettings.masterVolume}
                onValueChange={handleMasterVolumeChange}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.secondary}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Efectos de sonido</Text>
              <Switch
                value={gameSettings.soundEffectsEnabled}
                onValueChange={handleSoundEffectsToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={gameSettings.soundEffectsEnabled ? colors.white : colors.textMuted}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Mensajes de voz</Text>
              <Switch
                value={gameSettings.voiceMessagesEnabled}
                onValueChange={handleVoiceMessagesToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={gameSettings.voiceMessagesEnabled ? colors.white : colors.textMuted}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Música de fondo</Text>
              <Switch
                value={gameSettings.backgroundMusicEnabled}
                onValueChange={handleBackgroundMusicToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={gameSettings.backgroundMusicEnabled ? colors.white : colors.textMuted}
              />
            </View>
          </View>

          {/* ACCESSIBILITY SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>♿</Text>
              <Text style={styles.sectionTitle}>Accesibilidad</Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingRowText}>
                <Text style={styles.settingLabel}>Modo alto contraste</Text>
                <Text style={styles.settingDescription}>
                  Mejora la visibilidad de las cartas y textos
                </Text>
              </View>
              <Switch
                value={gameSettings.highContrastMode}
                onValueChange={handleHighContrastToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={gameSettings.highContrastMode ? colors.white : colors.textMuted}
              />
            </View>

            <Text style={styles.accessibilityTip}>
              💡 Tip: Usa "Cartas grandes" en la sección Juego para mejor visibilidad
            </Text>
          </View>

          {/* RESET BUTTON */}
          <View style={styles.resetSection}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Restablecer configuración</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: dimensions.spacing.xxl }} />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xxl,
    marginBottom: dimensions.spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowText: {
    flex: 1,
    marginRight: dimensions.spacing.md,
  },
  settingColumn: {
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: dimensions.spacing.sm,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: dimensions.spacing.sm,
    gap: dimensions.spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  optionButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  optionButtonTextActive: {
    color: colors.white,
  },
  colorButtonGroup: {
    flexDirection: 'row',
    marginTop: dimensions.spacing.sm,
    gap: dimensions.spacing.md,
  },
  accessibilityTip: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.md,
    fontStyle: 'italic',
    lineHeight: typography.fontSize.sm * 1.5,
  },
  resetSection: {
    marginTop: dimensions.spacing.md,
    marginBottom: dimensions.spacing.xl,
  },
  resetButton: {
    backgroundColor: colors.error + '20',
    borderRadius: dimensions.borderRadius.lg,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  resetButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
});
