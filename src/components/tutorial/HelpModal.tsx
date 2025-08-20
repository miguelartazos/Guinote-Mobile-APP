import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { AnimatedButton } from '../ui/AnimatedButton';
import { haptics } from '../../utils/haptics';
import type { HelpSectionId } from '../../types/game.types';
import { helpSectionId } from '../../utils/brandedTypes';

type HelpSection = {
  id: HelpSectionId;
  title: string;
  icon: string;
  content: string;
  expanded?: boolean;
};

type HelpModalProps = {
  visible: boolean;
  onClose: () => void;
  contextualHelp?: string;
};

export function HelpModal({ visible, onClose, contextualHelp }: HelpModalProps) {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(300))[0];
  const [expandedSections, setExpandedSections] = useState<Record<HelpSectionId, boolean>>(
    {} as Record<HelpSectionId, boolean>,
  );

  const helpSections: HelpSection[] = [
    {
      id: helpSectionId('objective'),
      title: 'Objetivo del Juego',
      icon: '🎯',
      content:
        'El objetivo es ser el primero en llegar a 101 puntos. Se juega en parejas, tú y tu compañero contra los oponentes.',
    },
    {
      id: helpSectionId('cards'),
      title: 'Las Cartas',
      icon: '🃏',
      content:
        'Se usan 40 cartas españolas. Valor de las cartas:\n• As: 11 puntos\n• Tres: 10 puntos\n• Rey: 4 puntos\n• Caballo: 3 puntos\n• Sota: 2 puntos\n• 7, 6, 5, 4, 2: 0 puntos',
    },
    {
      id: helpSectionId('gameplay'),
      title: 'Cómo Jugar',
      icon: '🎮',
      content:
        'Cada jugador recibe 6 cartas. Hay un triunfo (palo ganador). Debes seguir el palo si puedes. Si no tienes del palo, puedes usar triunfo o descartar. El triunfo siempre gana.',
    },
    {
      id: helpSectionId('cantes'),
      title: 'Los Cantes',
      icon: '👑',
      content:
        'Cuando tienes Rey y Caballo del mismo palo:\n• Las 20: Rey y Caballo de cualquier palo (20 puntos)\n• Las 40: Rey y Caballo del palo de triunfo (40 puntos)\nDebes ganar una baza para cantar.',
    },
    {
      id: helpSectionId('special'),
      title: 'Reglas Especiales',
      icon: '⭐',
      content:
        '• Cambiar el 7: Si tienes el 7 de triunfo, puedes cambiarlo por la carta de triunfo\n• Vueltas: Si te quedas sin cartas del palo, puedes "volver" y usar cualquier carta\n• Arrastre: En las últimas 12 cartas, debes usar triunfo si el contrario lo usa',
    },
    {
      id: helpSectionId('scoring'),
      title: 'Puntuación',
      icon: '📊',
      content:
        'Al final de cada mano:\n• Contar puntos de las bazas ganadas\n• Sumar puntos de los cantes\n• El último truco vale 10 puntos extra\n• Capote: Si ganas todos los trucos, duplicas los puntos',
    },
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible, fadeAnim, slideAnim]);

  const toggleSection = (sectionId: HelpSectionId) => {
    haptics.light();
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Ayuda</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {contextualHelp && (
              <View style={styles.contextualHelpCard}>
                <Text style={styles.contextualHelpIcon}>💡</Text>
                <Text style={styles.contextualHelpText}>{contextualHelp}</Text>
              </View>
            )}

            {helpSections.map(section => {
              const isExpanded = expandedSections[section.id] || false;

              return (
                <TouchableOpacity
                  key={section.id}
                  onPress={() => toggleSection(section.id)}
                  style={styles.section}
                  activeOpacity={0.8}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionIcon}>{section.icon}</Text>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
                  </View>
                  {isExpanded && <Text style={styles.sectionContent}>{section.content}</Text>}
                </TouchableOpacity>
              );
            })}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                💡 Consejo: La práctica hace al maestro. ¡Juega el tutorial para aprender haciendo!
              </Text>
            </View>
          </ScrollView>

          <View style={styles.bottomActions}>
            <AnimatedButton
              onPress={() => {
                haptics.light();
                onClose();
              }}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>Entendido</Text>
            </AnimatedButton>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: dimensions.borderRadius.xl,
    borderTopRightRadius: dimensions.borderRadius.xl,
    maxHeight: '85%',
    elevation: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
  },
  closeButton: {
    width: dimensions.touchTarget.minimum,
    height: dimensions.touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: dimensions.spacing.xl,
  },
  contextualHelpCard: {
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.xl,
  },
  contextualHelpIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.md,
  },
  contextualHelpText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.lg,
    marginBottom: dimensions.spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.spacing.lg,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.md,
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  expandIcon: {
    fontSize: typography.fontSize.xl,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  sectionContent: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
  },
  footer: {
    backgroundColor: 'rgba(212, 165, 116, 0.05)',
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginTop: dimensions.spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: typography.lineHeight.normal * typography.fontSize.md,
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  actionButton: {
    backgroundColor: colors.accent,
    minHeight: dimensions.touchTarget.comfortable,
  },
  actionButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
