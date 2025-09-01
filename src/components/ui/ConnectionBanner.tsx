import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ConnectionIndicator } from '../game/ConnectionIndicator';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { connectionService } from '../../services/connectionService';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

interface ConnectionBannerProps {
  hideWhenConnected?: boolean;
  showQueuedActions?: boolean;
}

export function ConnectionBanner({
  hideWhenConnected = true,
  showQueuedActions = true,
}: ConnectionBannerProps) {
  const { status, reconnectAttempts, isConnected } = useConnectionStatus();
  const [queuedCount, setQueuedCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Update queued actions count
    const updateQueuedCount = () => {
      const count = connectionService.getQueuedCount();
      setQueuedCount(count);
    };

    updateQueuedCount();
    const interval = setInterval(updateQueuedCount, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Handle reconnection recovery
    const handleReconnection = async () => {
      if (status === 'connected' && queuedCount > 0) {
        setIsRecovering(true);

        try {
          await connectionService.handleReconnect();
        } catch (error) {
          console.error('[ConnectionBanner] Recovery failed:', error);
        } finally {
          setIsRecovering(false);
        }
      }
    };

    handleReconnection();
  }, [status, queuedCount]);

  useEffect(() => {
    // Animate visibility based on connection status
    const shouldShow = !isConnected || queuedCount > 0 || isRecovering;

    Animated.timing(fadeAnim, {
      toValue: shouldShow ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, queuedCount, isRecovering, fadeAnim]);

  if (hideWhenConnected && isConnected && queuedCount === 0 && !isRecovering) {
    return null;
  }

  const getStatusMessage = () => {
    if (isRecovering) {
      return 'Sincronizando...';
    }
    if (queuedCount > 0 && !isConnected) {
      return `${queuedCount} ${queuedCount === 1 ? 'acción pendiente' : 'acciones pendientes'}`;
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
      testID="connection-banner"
    >
      <ConnectionIndicator
        status={isRecovering ? 'reconnecting' : status}
        reconnectAttempts={reconnectAttempts}
        hideWhenConnected={false}
      />

      {showQueuedActions && statusMessage && (
        <View style={styles.queueInfo}>
          <Text style={styles.queueText}>{statusMessage}</Text>
        </View>
      )}
    </Animated.View>
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
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    zIndex: 1000,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: dimensions.spacing.md,
  },
  queueText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});

