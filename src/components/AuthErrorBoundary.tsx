import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isAuthError =
        this.state.error?.message?.toLowerCase().includes('auth') ||
        this.state.error?.message?.toLowerCase().includes('auth');

      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>
            {isAuthError ? 'Error de Autenticación' : 'Algo salió mal'}
          </Text>
          <Text style={styles.message}>
            {isAuthError
              ? 'Hubo un problema con el sistema de autenticación.'
              : 'Se produjo un error inesperado.'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Intentar de nuevo</Text>
          </TouchableOpacity>
          {__DEV__ && <Text style={styles.errorDetail}>{this.state.error?.message}</Text>}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: dimensions.spacing.lg,
    backgroundColor: colors.background,
  },
  emoji: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  errorDetail: {
    ...typography.caption,
    color: colors.error,
    marginTop: dimensions.spacing.lg,
    textAlign: 'center',
    paddingHorizontal: dimensions.spacing.md,
  },
});
