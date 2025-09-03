import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import type { Player, AIConfig } from '../../hooks/useUnifiedRooms';

interface AIPersonality {
  id: 'agresivo' | 'defensivo' | 'equilibrado';
  name: string;
  description: string;
  mapped: AIConfig['personality'];
  riskTolerance: number;
  bluffRate: number;
}

const AI_PERSONALITIES: AIPersonality[] = [
  {
    id: 'agresivo',
    name: 'Agresivo',
    description: 'Juega arriesgado y presiona constantemente',
    mapped: 'aggressive',
    riskTolerance: 0.8,
    bluffRate: 0.6,
  },
  {
    id: 'defensivo',
    name: 'Defensivo',
    description: 'Juega conservador y espera oportunidades',
    mapped: 'defensive',
    riskTolerance: 0.3,
    bluffRate: 0.1,
  },
  {
    id: 'equilibrado',
    name: 'Equilibrado',
    description: 'Balancea riesgo y seguridad',
    mapped: 'balanced',
    riskTolerance: 0.5,
    bluffRate: 0.3,
  },
];

const AI_DIFFICULTIES: Array<{ id: AIConfig['difficulty']; name: string; description: string }> = [
  { id: 'easy', name: 'Fácil', description: 'Comete errores frecuentes' },
  { id: 'medium', name: 'Medio', description: 'Juega decentemente' },
  { id: 'hard', name: 'Difícil', description: 'Juega estratégicamente' },
];

interface AIPlayerManagerProps {
  players: Player[];
  roomId: string;
  isHost: boolean;
  onAddAI: (config: AIConfig) => Promise<void>;
  onRemoveAI?: (playerId: string) => Promise<void>;
  maxPlayers?: number;
  onOpenModal?: () => void;
}

export const AIPlayerManager = React.forwardRef<{ openModal: () => void }, AIPlayerManagerProps>(
  ({ players, roomId, isHost, onAddAI, onRemoveAI, maxPlayers = 4, onOpenModal }, ref) => {
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<AIConfig['difficulty']>('medium');
    const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality>(
      AI_PERSONALITIES[2],
    );
    const [isAdding, setIsAdding] = useState(false);

    const aiPlayers = players.filter(p => p.isBot);
    const emptySlots = maxPlayers - players.length;
    const canAddAI = isHost && emptySlots > 0;

    const handleAddAI = async () => {
      if (!canAddAI) return;

      setIsAdding(true);
      try {
        const config: AIConfig = {
          difficulty: selectedDifficulty,
          personality: selectedPersonality.mapped,
        };

        await onAddAI(config);
        setShowConfigModal(false);
        setSelectedDifficulty('medium');
        setSelectedPersonality(AI_PERSONALITIES[2]);
      } catch (error) {
        Alert.alert('Error', 'No se pudo añadir el jugador IA');
      } finally {
        setIsAdding(false);
      }
    };

    const handleRemoveAI = async (playerId: string) => {
      if (!isHost || !onRemoveAI) return;

      Alert.alert('Eliminar IA', '¿Estás seguro de que quieres eliminar este jugador IA?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveAI(playerId);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el jugador IA');
            }
          },
        },
      ]);
    };

    const renderAIPlayer = (player: Player) => {
      const config = player.botConfig;
      const personality = AI_PERSONALITIES.find(p => p.mapped === config?.personality);

      return (
        <View key={player.id} style={styles.aiPlayer}>
          <View style={styles.aiPlayerInfo}>
            <Text style={styles.aiPlayerIcon}>🤖</Text>
            <View style={styles.aiPlayerDetails}>
              <Text style={styles.aiPlayerName}>{player.name}</Text>
              <Text style={styles.aiPlayerConfig}>
                {config
                  ? `${getDifficultyName(config.difficulty)} - ${
                      personality?.name || config.personality
                    }`
                  : 'Sin configuración'}
              </Text>
            </View>
          </View>
          {isHost && onRemoveAI && (
            <TouchableOpacity onPress={() => handleRemoveAI(player.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    };

    const getDifficultyName = (difficulty: AIConfig['difficulty']) => {
      return AI_DIFFICULTIES.find(d => d.id === difficulty)?.name || difficulty;
    };

    // Expose openModal method to parent
    React.useImperativeHandle(
      ref,
      () => ({
        openModal: () => setShowConfigModal(true),
      }),
      [],
    );

    return (
      <>
        <Card style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Jugadores IA</Text>
            {canAddAI && (
              <TouchableOpacity
                style={styles.addIconButton}
                onPress={() => setShowConfigModal(true)}
              >
                <Text style={styles.addIcon}>➕</Text>
              </TouchableOpacity>
            )}
          </View>

          {aiPlayers.length > 0 ? (
            <View style={styles.aiPlayersList}>{aiPlayers.map(renderAIPlayer)}</View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.noAIText}>No hay jugadores IA</Text>
              {canAddAI && (
                <TouchableOpacity style={styles.addButton} onPress={() => setShowConfigModal(true)}>
                  <Text style={styles.addButtonIcon}>🤖</Text>
                  <Text style={styles.addButtonText}>Añadir Jugador IA</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!isHost && emptySlots > 0 && (
            <Text style={styles.infoText}>
              El anfitrión puede añadir {emptySlots} jugador{emptySlots > 1 ? 'es' : ''} IA
            </Text>
          )}
        </Card>

        <Modal
          visible={showConfigModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowConfigModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Configurar Jugador IA</Text>

                <Text style={styles.sectionTitle}>Dificultad</Text>
                <View style={styles.optionsContainer}>
                  {AI_DIFFICULTIES.map(difficulty => (
                    <TouchableOpacity
                      key={difficulty.id}
                      style={[
                        styles.option,
                        selectedDifficulty === difficulty.id && styles.selectedOption,
                      ]}
                      onPress={() => setSelectedDifficulty(difficulty.id)}
                    >
                      <Text style={styles.optionTitle}>{difficulty.name}</Text>
                      <Text style={styles.optionDescription}>{difficulty.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Personalidad</Text>
                <View style={styles.optionsContainer}>
                  {AI_PERSONALITIES.map(personality => (
                    <TouchableOpacity
                      key={personality.id}
                      style={[
                        styles.option,
                        selectedPersonality.id === personality.id && styles.selectedOption,
                      ]}
                      onPress={() => setSelectedPersonality(personality)}
                    >
                      <Text style={styles.optionTitle}>{personality.name}</Text>
                      <Text style={styles.optionDescription}>{personality.description}</Text>
                      <View style={styles.statsContainer}>
                        <Text style={styles.statText}>
                          Riesgo: {Math.round(personality.riskTolerance * 100)}%
                        </Text>
                        <Text style={styles.statText}>
                          Farol: {Math.round(personality.bluffRate * 100)}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowConfigModal(false)}
                    disabled={isAdding}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleAddAI}
                    disabled={isAdding}
                  >
                    <Text style={styles.confirmButtonText}>
                      {isAdding ? 'Añadiendo...' : 'Añadir IA'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  },
);

AIPlayerManager.displayName = 'AIPlayerManager';

const styles = StyleSheet.create({
  container: {
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dimensions.spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  addIconButton: {
    marginLeft: dimensions.spacing.sm,
    padding: dimensions.spacing.xs,
  },
  addIcon: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.lg,
  },
  aiPlayersList: {
    gap: dimensions.spacing.sm,
  },
  aiPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiPlayerIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  aiPlayerDetails: {
    flex: 1,
  },
  aiPlayerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  aiPlayerConfig: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: dimensions.spacing.xs,
  },
  removeButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    fontWeight: typography.fontWeight.bold,
  },
  noAIText: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: dimensions.spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
    marginTop: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: dimensions.spacing.md,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: dimensions.spacing.md,
    marginBottom: dimensions.spacing.sm,
  },
  optionsContainer: {
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.md,
  },
  option: {
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedOption: {
    borderColor: colors.accent,
    backgroundColor: colors.successLight,
  },
  optionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  optionDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
    marginTop: dimensions.spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  modalActions: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
    marginTop: dimensions.spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  confirmButton: {
    backgroundColor: colors.accent,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});
