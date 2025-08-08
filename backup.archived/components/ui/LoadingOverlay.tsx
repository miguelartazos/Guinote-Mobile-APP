import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
  progress?: number;
  fullScreen?: boolean;
};

export function LoadingOverlay({
  visible,
  message,
  progress,
  fullScreen = true,
}: LoadingOverlayProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) return null;

  const content = (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.accent} />
        {message && <Text style={styles.message}>{message}</Text>}
        {progress !== undefined && (
          <>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}%
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );

  if (fullScreen) {
    return (
      <Modal transparent visible={visible} animationType="none">
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  message: {
    marginTop: dimensions.spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
    fontWeight: typography.fontWeight.medium,
  },
  progressBar: {
    width: 150,
    height: 4,
    backgroundColor: colors.secondary,
    borderRadius: 2,
    marginTop: dimensions.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressText: {
    marginTop: dimensions.spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
