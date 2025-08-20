import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import type { GameState } from '../../types/game.types';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  gameState?: GameState | null;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  savedGameState?: string;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game Error Boundary caught:', error, errorInfo);

    // Try to save the current game state for debugging
    if (this.props.gameState) {
      try {
        await AsyncStorage.setItem(
          'crashed_game_state',
          JSON.stringify({
            gameState: this.props.gameState,
            error: error.toString(),
            errorInfo: errorInfo.componentStack,
            timestamp: Date.now(),
          }),
        );
        this.setState({ savedGameState: 'Game state saved for recovery' });
      } catch (saveError) {
        console.error('Failed to save crashed game state:', saveError);
      }
    }

    this.setState({ errorInfo });
  }

  handleReset = async () => {
    // Clear the saved error state
    try {
      await AsyncStorage.removeItem('crashed_game_state');
    } catch (err) {
      console.error('Failed to clear crashed state:', err);
    }

    // Reset error boundary state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      savedGameState: undefined,
    });

    // Call parent reset handler if provided
    this.props.onReset?.();
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
      componentStack: errorInfo?.componentStack || '',
      timestamp: new Date().toISOString(),
    };

    console.log('Error Report:', JSON.stringify(errorReport, null, 2));
    // In production, send this to your error tracking service
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.emoji}>🎴</Text>
            <Text style={styles.title}>¡Ups! Algo salió mal</Text>
            <Text style={styles.message}>
              Ha ocurrido un error en el juego. No te preocupes, tu progreso ha sido guardado.
            </Text>

            {this.state.savedGameState && (
              <View style={styles.savedStateContainer}>
                <Text style={styles.savedStateText}>✅ {this.state.savedGameState}</Text>
              </View>
            )}

            <View style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Detalles del error:</Text>
              <Text style={styles.errorText}>
                {this.state.error?.message || 'Error desconocido'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleReset}
              >
                <Text style={styles.primaryButtonText}>Reintentar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleReportError}
              >
                <Text style={styles.secondaryButtonText}>Reportar Error</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && this.state.errorInfo && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Info (Dev Only):</Text>
                <ScrollView style={styles.debugScroll} horizontal>
                  <Text style={styles.debugText}>{this.state.errorInfo.componentStack}</Text>
                </ScrollView>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  savedStateContainer: {
    backgroundColor: colors.success + '20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  savedStateText: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  errorDetails: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    width: '100%',
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  debugInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  debugScroll: {
    maxHeight: 100,
  },
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});
