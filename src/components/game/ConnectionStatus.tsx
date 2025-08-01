import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import networkService from '../../services/networkService';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>('connecting');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const handleConnectionStatus = (data: { status: string }) => {
      setStatus(data.status as ConnectionState);
    };

    networkService.on('connection_status', handleConnectionStatus);

    // Initial status
    const currentStatus = networkService.getConnectionStatus();
    setStatus(currentStatus as ConnectionState);

    // Pulse animation for connecting/reconnecting states
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    if (status === 'connecting' || status === 'reconnecting') {
      animation.start();
    } else {
      animation.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      networkService.off('connection_status', handleConnectionStatus);
      animation.stop();
    };
  }, [status, pulseAnim]);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: '✓',
          text: 'Conectado',
          color: colors.success,
          show: false, // Hide when connected
        };
      case 'connecting':
        return {
          icon: '●',
          text: 'Conectando...',
          color: colors.warning,
          show: true,
        };
      case 'reconnecting':
        return {
          icon: '⟳',
          text: 'Reconectando...',
          color: colors.warning,
          show: true,
        };
      case 'disconnected':
        return {
          icon: '✗',
          text: 'Sin conexión',
          color: colors.error,
          show: true,
        };
      case 'error':
        return {
          icon: '!',
          text: 'Error de conexión',
          color: colors.error,
          show: true,
        };
      default:
        return {
          icon: '?',
          text: 'Estado desconocido',
          color: colors.secondary,
          show: true,
        };
    }
  };

  const config = getStatusConfig();

  if (!config.show) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: config.color }]}>
      <Animated.View style={{ opacity: pulseAnim }}>
        <Text style={styles.icon}>{config.icon}</Text>
      </Animated.View>
      <Text style={styles.text}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    zIndex: 1000,
  },
  icon: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    marginRight: dimensions.spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
});
