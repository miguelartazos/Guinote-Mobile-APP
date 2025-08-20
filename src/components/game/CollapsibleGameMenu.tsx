import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { AnimatedButton } from '../ui/AnimatedButton';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { haptics } from '../../utils/haptics';

type CollapsibleGameMenuProps = {
  onExitGame: () => void;
  onRenuncio: () => void;
  onSettings?: () => void;
  onRankings?: () => void;
  onEmojis?: () => void;
  onHelp?: () => void;
};

export function CollapsibleGameMenu({
  onExitGame,
  onRenuncio,
  onSettings,
  onRankings,
  onEmojis,
  onHelp,
}: CollapsibleGameMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, fadeAnim]);

  const toggleMenu = () => {
    haptics.light();
    setIsOpen(!isOpen);
  };

  const handleMenuAction = (action: () => void) => {
    haptics.medium();
    setIsOpen(false);
    setTimeout(action, 300);
  };

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      {/* Modal for Menu */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: fadeAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.menuTitle}>MENÚ</Text>

            <View style={styles.menuItems}>
              <AnimatedButton style={styles.menuItem} onPress={() => handleMenuAction(onExitGame)}>
                <Text style={styles.menuItemIcon}>🚪</Text>
                <Text style={styles.menuItemText}>Salir del Juego</Text>
              </AnimatedButton>

              <AnimatedButton
                style={[styles.menuItem, styles.dangerItem]}
                onPress={() => handleMenuAction(onRenuncio)}
              >
                <Text style={styles.menuItemIcon}>🏳️</Text>
                <Text style={styles.menuItemText}>Renuncio</Text>
              </AnimatedButton>

              <View style={styles.divider} />

              {onSettings && (
                <AnimatedButton
                  style={styles.menuItem}
                  onPress={() => handleMenuAction(onSettings)}
                >
                  <Text style={styles.menuItemIcon}>⚙️</Text>
                  <Text style={styles.menuItemText}>Configuración</Text>
                </AnimatedButton>
              )}

              {onRankings && (
                <AnimatedButton
                  style={styles.menuItem}
                  onPress={() => handleMenuAction(onRankings)}
                >
                  <Text style={styles.menuItemIcon}>🏆</Text>
                  <Text style={styles.menuItemText}>Clasificación</Text>
                </AnimatedButton>
              )}

              {onEmojis && (
                <AnimatedButton style={styles.menuItem} onPress={() => handleMenuAction(onEmojis)}>
                  <Text style={styles.menuItemIcon}>😊</Text>
                  <Text style={styles.menuItemText}>Emoticonos</Text>
                </AnimatedButton>
              )}

              {onHelp && (
                <AnimatedButton style={styles.menuItem} onPress={() => handleMenuAction(onHelp)}>
                  <Text style={styles.menuItemIcon}>❓</Text>
                  <Text style={styles.menuItemText}>Ayuda</Text>
                </AnimatedButton>
              )}
            </View>
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsOpen(false)}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  menuIcon: {
    fontSize: 24,
    color: colors.gold,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: colors.surface,
    shadowColor: colors.black,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  menuContent: {
    flex: 1,
    padding: dimensions.spacing.xl,
  },
  menuTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gold,
    marginBottom: dimensions.spacing.xl,
    textAlign: 'center',
  },
  menuItems: {
    gap: dimensions.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    gap: dimensions.spacing.md,
  },
  dangerItem: {
    backgroundColor: 'rgba(207, 102, 121, 0.1)',
  },
  menuItemIcon: {
    fontSize: 24,
    width: 30,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: dimensions.spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: colors.text,
  },
});
