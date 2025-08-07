import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { ScreenContainer } from '../components/ScreenContainer';
import { ColorButton } from '../components/game/ColorButton';
import { colors, TABLE_COLORS } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import { useVoiceSettings } from '../hooks/useVoiceSettings';
import { useGameSettings } from '../hooks/useGameSettings';
import type { MainTabScreenProps } from '../types/navigation';
import type { DifficultyLevel } from '../types/game.types';
import type { CardSize, TableColor } from '../utils/gameSettings';

export function SettingsScreen({
  navigation: _,
}: MainTabScreenProps<'Ajustes'>) {
  const {
    globalVoiceEnabled,
    autoPlay,
    volume,
    updateSettings: updateVoiceSettings,
    resetSettings: resetVoiceSettings,
  } = useVoiceSettings();

  const {
    settings: gameSettings,
    updateSettings: updateGameSettings,
    resetSettings: resetGameSettings,
  } = useGameSettings();

  if (!gameSettings) {
    return null;
  }

  const handleGlobalVoiceToggle = async (enabled: boolean) => {
    try {
      await updateVoiceSettings({ globalVoiceEnabled: enabled });
      await updateGameSettings({ globalVoiceEnabled: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleAutoPlayToggle = async (enabled: boolean) => {
    try {
      await updateVoiceSettings({ autoPlay: enabled });
      await updateGameSettings({ autoPlay: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    try {
      await updateVoiceSettings({ volume: newVolume });
      await updateGameSettings({ volume: newVolume });
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

  const handleResetSettings = async () => {
    try {
      await resetVoiceSettings();
      await resetGameSettings();
      Alert.alert('Éxito', 'Configuración restablecida correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo restablecer la configuración');
    }
  };

  const handleBackgroundMusicToggle = async (enabled: boolean) => {
    try {
      await updateGameSettings({ backgroundMusicEnabled: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la música de fondo');
    }
  };

  const handleMusicVolumeChange = async (newVolume: number) => {
    try {
      await updateGameSettings({ musicVolume: newVolume });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el volumen de música');
    }
  };

  const handleEffectsVolumeChange = async (newVolume: number) => {
    try {
      await updateGameSettings({ effectsVolume: newVolume });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el volumen de efectos');
    }
  };

  const handleReactionsVolumeChange = async (newVolume: number) => {
    try {
      await updateGameSettings({ reactionsVolume: newVolume });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el volumen de reacciones');
    }
  };

  const handleMusicTypeChange = async (
    type: 'spanish_guitar' | 'cafe_ambiance' | 'nature_sounds',
  ) => {
    try {
      await updateGameSettings({ backgroundMusicType: type });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el tipo de música');
    }
  };

  const handleAccessibilityAudioToggle = async (enabled: boolean) => {
    try {
      await updateGameSettings({ accessibilityAudioCues: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar las señales de audio');
    }
  };

  const handleVoiceAnnouncementsToggle = async (enabled: boolean) => {
    try {
      await updateGameSettings({ voiceAnnouncements: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar los anuncios de voz');
    }
  };

  const handleHighContrastToggle = async (enabled: boolean) => {
    try {
      await updateGameSettings({ highContrastMode: enabled });
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el modo de alto contraste');
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Configuración del juego</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mensajes de Voz</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Activar mensajes de voz</Text>
              <Switch
                value={globalVoiceEnabled}
                onValueChange={handleGlobalVoiceToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={
                  globalVoiceEnabled ? colors.white : colors.textMuted
                }
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Reproducción automática</Text>
              <Switch
                value={autoPlay}
                onValueChange={handleAutoPlayToggle}
                disabled={!globalVoiceEnabled}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={
                  autoPlay && globalVoiceEnabled
                    ? colors.white
                    : colors.textMuted
                }
              />
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>
                Volumen: {Math.round(volume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                disabled={!globalVoiceEnabled}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.secondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración del Juego</Text>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>Dificultad de la IA</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.difficulty === 'easy' &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => handleDifficultyChange('easy')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.difficulty === 'easy' &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    Fácil
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.difficulty === 'medium' &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => handleDifficultyChange('medium')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.difficulty === 'medium' &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    Medio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.difficulty === 'hard' &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => handleDifficultyChange('hard')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.difficulty === 'hard' &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    Difícil
                  </Text>
                </TouchableOpacity>
              </View>
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
                thumbColor={
                  gameSettings.soundEffectsEnabled
                    ? colors.white
                    : colors.textMuted
                }
              />
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>Tamaño de cartas</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.cardSize === 'normal' &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => handleCardSizeChange('normal')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.cardSize === 'normal' &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    Normal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.cardSize === 'large' &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => handleCardSizeChange('large')}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.cardSize === 'large' &&
                        styles.optionButtonTextActive,
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración de Audio</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Música de fondo</Text>
              <Switch
                value={gameSettings.backgroundMusicEnabled}
                onValueChange={handleBackgroundMusicToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={
                  gameSettings.backgroundMusicEnabled
                    ? colors.white
                    : colors.textMuted
                }
              />
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>
                Volumen de música: {Math.round(gameSettings.musicVolume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={gameSettings.musicVolume}
                onValueChange={handleMusicVolumeChange}
                disabled={!gameSettings.backgroundMusicEnabled}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.secondary}
              />
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>
                Volumen de efectos:{' '}
                {Math.round(gameSettings.effectsVolume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={gameSettings.effectsVolume}
                onValueChange={handleEffectsVolumeChange}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.secondary}
              />
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>
                Volumen de reacciones:{' '}
                {Math.round(gameSettings.reactionsVolume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={gameSettings.reactionsVolume}
                onValueChange={handleReactionsVolumeChange}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.secondary}
              />
            </View>

            <View style={styles.settingColumn}>
              <Text style={styles.settingLabel}>Tipo de música</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.backgroundMusicType === 'spanish_guitar' &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => handleMusicTypeChange('spanish_guitar')}
                  disabled={!gameSettings.backgroundMusicEnabled}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.backgroundMusicType === 'spanish_guitar' &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    Guitarra
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.backgroundMusicType === 'cafe_ambiance' &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => handleMusicTypeChange('cafe_ambiance')}
                  disabled={!gameSettings.backgroundMusicEnabled}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.backgroundMusicType === 'cafe_ambiance' &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    Café
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    gameSettings.backgroundMusicType === 'nature_sounds' &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => handleMusicTypeChange('nature_sounds')}
                  disabled={!gameSettings.backgroundMusicEnabled}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      gameSettings.backgroundMusicType === 'nature_sounds' &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    Naturaleza
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accesibilidad</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Señales de audio</Text>
              <Switch
                value={gameSettings.accessibilityAudioCues}
                onValueChange={handleAccessibilityAudioToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={
                  gameSettings.accessibilityAudioCues
                    ? colors.white
                    : colors.textMuted
                }
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Anuncios de voz</Text>
              <Switch
                value={gameSettings.voiceAnnouncements}
                onValueChange={handleVoiceAnnouncementsToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={
                  gameSettings.voiceAnnouncements
                    ? colors.white
                    : colors.textMuted
                }
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Modo alto contraste</Text>
              <Switch
                value={gameSettings.highContrastMode}
                onValueChange={handleHighContrastToggle}
                trackColor={{
                  false: colors.secondary,
                  true: colors.accent,
                }}
                thumbColor={
                  gameSettings.highContrastMode
                    ? colors.white
                    : colors.textMuted
                }
              />
            </View>

            <Text style={styles.accessibilityInfo}>
              Las señales de audio proporcionan sonidos adicionales para eventos
              importantes del juego. Los anuncios de voz describen las cartas y
              acciones para usuarios con discapacidad visual.
            </Text>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>
                Restablecer configuración
              </Text>
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
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.xl,
  },
  section: {
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  settingColumn: {
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  settingLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: dimensions.spacing.xs,
  },
  resetButton: {
    backgroundColor: colors.secondary,
    borderRadius: dimensions.borderRadius.lg,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
  },
  resetButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  buttonContainer: {
    marginBottom: dimensions.spacing.xxl,
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
    borderColor: colors.secondary,
    alignItems: 'center',
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
  accessibilityInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: dimensions.spacing.md,
    lineHeight: typography.fontSize.sm * 1.5,
    fontStyle: 'italic',
  },
});
