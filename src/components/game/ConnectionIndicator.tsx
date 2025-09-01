import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { ConnectionStatus } from '../../hooks/useConnectionStatus';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  reconnectAttempts?: number;
  hideWhenConnected?: boolean;
}

const STATUS_CONFIG = {
  connected: {
    color: '#4CAF50',
    text: 'Conectado',
    pulse: false,
  },
  disconnected: {
    color: '#CF6679',
    text: 'Sin conexión',
    pulse: false,
  },
  reconnecting: {
    color: '#FFB74D',
    text: 'Reconectando...',
    pulse: true,
  },
  checking: {
    color: '#90A4AE',
    text: 'Verificando...',
    pulse: false,
  },
};

export function ConnectionIndicator({
  status,
  reconnectAttempts,
  hideWhenConnected = false,
}: ConnectionIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const config = STATUS_CONFIG[status];

  useEffect(() => {
    if (config.pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [config.pulse, pulseAnim]);

  if (hideWhenConnected && status === 'connected') {
    return null;
  }

  const displayText =
    reconnectAttempts && status === 'reconnecting'
      ? `${config.text} (intento ${reconnectAttempts})`
      : config.text;

  return (
    <View style={styles.container} testID="connection-indicator">
      <Animated.View
        testID="status-dot"
        style={[
          styles.dot,
          {
            backgroundColor: config.color,
            opacity: pulseAnim,
          },
        ]}
      />
      <Text style={styles.text}>{displayText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    zIndex: 1000,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: dimensions.spacing.sm,
  },
  text: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
