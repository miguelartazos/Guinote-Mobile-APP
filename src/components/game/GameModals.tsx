import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SpanishCard } from './SpanishCard';
import { AnimatedButton } from '../ui/AnimatedButton';
import type { Card } from '../../types/game.types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type GameModalsProps = {
  // Last trick modal
  showLastTrick: boolean;
  lastTrick: Card[];
  onCloseLastTrick: () => void;

  // Declare victory modal
  showDeclareVictory: boolean;
  onCloseDeclareVictory: () => void;
  onConfirmVictory: () => void;

  // Renuncio modal
  showRenuncio: boolean;
  selectedRenuncioReason: string;
  onCloseRenuncio: () => void;
  onSelectRenuncioReason: (reason: string) => void;
  onConfirmRenuncio: () => void;
  renuncioReasons: Array<{ id: string; text: string; description: string }>;
};

export const GameModals = React.memo(function GameModals({
  showLastTrick,
  lastTrick,
  onCloseLastTrick,
  showDeclareVictory,
  onCloseDeclareVictory,
  onConfirmVictory,
  showRenuncio,
  selectedRenuncioReason,
  onCloseRenuncio,
  onSelectRenuncioReason,
  onConfirmRenuncio,
  renuncioReasons,
}: GameModalsProps) {
  return (
    <>
      {/* Last trick modal */}
      <Modal
        visible={showLastTrick}
        transparent
        animationType="fade"
        onRequestClose={onCloseLastTrick}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onCloseLastTrick}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Última baza</Text>
            <View style={styles.trickContainer}>
              {lastTrick.map(card => (
                <View key={card.id} style={styles.trickCard}>
                  <SpanishCard
                    card={{
                      suit: card.suit,
                      value: card.value,
                    }}
                    size="medium"
                  />
                </View>
              ))}
            </View>
            <AnimatedButton onPress={onCloseLastTrick} style={styles.primaryButton}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </AnimatedButton>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Declare victory modal */}
      <Modal
        visible={showDeclareVictory}
        transparent
        animationType="fade"
        onRequestClose={onCloseDeclareVictory}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onCloseDeclareVictory}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Declarar las 101?</Text>
            <Text style={styles.modalText}>
              Si tu equipo tiene 101 puntos o más, ganaréis la partida.
              {'\n\n'}
              Si no los tenéis, el equipo contrario ganará automáticamente.
            </Text>
            <View style={styles.modalButtons}>
              <AnimatedButton onPress={onCloseDeclareVictory} style={styles.secondaryButton}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </AnimatedButton>
              <AnimatedButton onPress={onConfirmVictory} style={styles.primaryButton}>
                <Text style={styles.buttonText}>¡Declarar!</Text>
              </AnimatedButton>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Renuncio modal */}
      <Modal
        visible={showRenuncio}
        transparent
        animationType="fade"
        onRequestClose={onCloseRenuncio}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onCloseRenuncio}>
          <View style={[styles.modalContent, styles.renuncioModal]}>
            <Text style={styles.modalTitle}>Declarar Renuncio</Text>
            <Text style={styles.modalText}>Selecciona el motivo del renuncio:</Text>
            <ScrollView style={styles.reasonsList}>
              {renuncioReasons.map(reason => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonItem,
                    selectedRenuncioReason === reason.id && styles.reasonItemSelected,
                  ]}
                  onPress={() => onSelectRenuncioReason(reason.id)}
                >
                  <Text style={styles.reasonText}>{reason.text}</Text>
                  <Text style={styles.reasonDescription}>{reason.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <AnimatedButton onPress={onCloseRenuncio} style={styles.secondaryButton}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </AnimatedButton>
              <AnimatedButton
                onPress={onConfirmRenuncio}
                style={[styles.dangerButton, !selectedRenuncioReason && styles.disabledButton]}
                disabled={!selectedRenuncioReason}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </AnimatedButton>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    maxWidth: 400,
    width: '90%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  modalText: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: dimensions.spacing.md,
  },
  trickContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: dimensions.spacing.lg,
    gap: dimensions.spacing.sm,
  },
  trickCard: {
    transform: [{ scale: 0.8 }],
  },
  renuncioModal: {
    maxHeight: '80%',
  },
  reasonsList: {
    maxHeight: 300,
    marginBottom: dimensions.spacing.lg,
  },
  reasonItem: {
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginBottom: dimensions.spacing.sm,
  },
  reasonItemSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  reasonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  reasonDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    minWidth: 100,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    minWidth: 100,
  },
  dangerButton: {
    backgroundColor: colors.error,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
});
