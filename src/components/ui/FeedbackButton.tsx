import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

const FEEDBACK_STORAGE_KEY = '@guinote/feedback';

type FeedbackType = 'bug' | 'feature' | 'performance' | 'other';

type FeedbackData = {
  type: FeedbackType;
  message: string;
  rating?: number;
  timestamp: number;
  version: string;
  platform: string;
};

export const FeedbackButton = React.memo(function FeedbackButton() {
  const [showModal, setShowModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Por favor escribe tu comentario');
      return;
    }

    setIsSending(true);

    try {
      const feedback: FeedbackData = {
        type: feedbackType,
        message: message.trim(),
        rating: rating || undefined,
        timestamp: Date.now(),
        version: '0.2.0',
        platform: Platform.OS,
      };

      // Save feedback locally (in real app, send to server)
      const existingFeedback = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
      const feedbackList = existingFeedback ? JSON.parse(existingFeedback) : [];
      feedbackList.push(feedback);
      await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackList));

      Alert.alert(
        '¡Gracias!',
        'Tu feedback ha sido enviado. ¡Apreciamos tu ayuda para mejorar el juego!',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowModal(false);
              setMessage('');
              setRating(null);
              setFeedbackType('bug');
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el feedback. Intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  const feedbackTypes: Array<{
    type: FeedbackType;
    label: string;
    emoji: string;
  }> = [
    { type: 'bug', label: 'Error/Bug', emoji: '🐛' },
    { type: 'feature', label: 'Sugerencia', emoji: '💡' },
    { type: 'performance', label: 'Rendimiento', emoji: '⚡' },
    { type: 'other', label: 'Otro', emoji: '💬' },
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.feedbackButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.feedbackButtonText}>Beta Feedback</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>📝 Enviar Feedback</Text>
              <Text style={styles.modalSubtitle}>Tu opinión nos ayuda a mejorar el juego</Text>

              {/* Feedback type selection */}
              <View style={styles.typeContainer}>
                {feedbackTypes.map(({ type, label, emoji }) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, feedbackType === type && styles.typeButtonActive]}
                    onPress={() => setFeedbackType(type)}
                  >
                    <Text style={styles.typeEmoji}>{emoji}</Text>
                    <Text
                      style={[styles.typeLabel, feedbackType === type && styles.typeLabelActive]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating */}
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingTitle}>¿Cómo calificas el juego?</Text>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starButton}
                    >
                      <Text
                        style={[styles.star, rating && rating >= star ? styles.starActive : null]}
                      >
                        ⭐
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Message input */}
              <TextInput
                style={styles.messageInput}
                placeholder="Escribe tu comentario aquí..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={message}
                onChangeText={setMessage}
                maxLength={500}
              />
              <Text style={styles.charCount}>{message.length}/500</Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowModal(false)}
                  disabled={isSending}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                  disabled={isSending}
                >
                  <Text style={styles.submitButtonText}>
                    {isSending ? 'Enviando...' : 'Enviar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  feedbackButton: {
    position: 'absolute',
    bottom: dimensions.spacing.xl,
    right: dimensions.spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 100,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  feedbackButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.lg,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
  },
  typeButtonActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  typeEmoji: {
    fontSize: 20,
    marginRight: dimensions.spacing.xs,
  },
  typeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  typeLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  ratingContainer: {
    marginBottom: dimensions.spacing.lg,
  },
  ratingTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: dimensions.spacing.sm,
  },
  starButton: {
    padding: dimensions.spacing.xs,
  },
  star: {
    fontSize: 24,
    opacity: 0.3,
  },
  starActive: {
    opacity: 1,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    minHeight: 120,
    maxHeight: 200,
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: dimensions.spacing.xs,
    marginBottom: dimensions.spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: dimensions.spacing.md,
  },
  button: {
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
});
