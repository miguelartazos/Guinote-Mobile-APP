import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

export function ConnectionStatus() {
  const { status, isConnected, isReconnecting, reconnectAttempts } = useConnectionStatus();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isReconnecting) {
      // Create pulsing animation when reconnecting
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isReconnecting, pulseAnim]);

  // Only show when not connected or reconnecting
  if (isConnected) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'disconnected':
        return {
          text: 'Offline',
          color: colors.error,
          backgroundColor: `${colors.error}20`,
        };
      case 'reconnecting':
        return {
          text: `Reconnecting${reconnectAttempts > 0 ? ` (${reconnectAttempts})` : ''}...`,
          color: colors.warning,
          backgroundColor: `${colors.warning}20`,
        };
      case 'checking':
        return {
          text: 'Checking connection...',
          color: colors.text,
          backgroundColor: `${colors.surface}80`,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.statusBadge,
          { 
            backgroundColor: config.backgroundColor,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        <View style={[styles.indicator, { backgroundColor: config.color }]} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
