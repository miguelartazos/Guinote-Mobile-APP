import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Button } from '../Button';
import { InputField } from './InputField';
import { AuthCard } from '../auth/AuthCard';
import { SocialButton } from '../auth/SocialButton';
import { dimensions } from '../../constants/dimensions';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type AuthModalProps = {
  visible: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, username: string) => Promise<void>;
  onQuickSignIn?: () => Promise<void>;
  title?: string;
  message?: string;
};

export function AuthModal({
  visible,
  onClose,
  onSignIn,
  onSignUp,
  onQuickSignIn,
  title = 'Iniciar Sesión Requerido',
  message = 'Necesitas una cuenta para continuar',
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await onSignIn(email, password);
      resetForm();
      onClose();
    } catch (error) {
      // Error handling done in parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      await onSignUp(email, password, username);
      resetForm();
      onClose();
    } catch (error) {
      // Error handling done in parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSignIn = async () => {
    if (!onQuickSignIn) return;
    setIsLoading(true);
    try {
      await onQuickSignIn();
      resetForm();
      onClose();
    } catch (error) {
      // Error handling done in parent
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setIsSignUp(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
              <AuthCard
                title={title}
                subtitle={message}
                style={styles.modalContent}
                isStandalone={false}
                footerSlot={
                  __DEV__ && onQuickSignIn ? (
                    <Button variant="secondary" size="small" onPress={handleQuickSignIn} disabled={isLoading} style={styles.devButton} icon="🚀">
                      Quick Test Sign In
                    </Button>
                  ) : undefined
                }
              >
                <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {isSignUp && (
                    <InputField
                      icon="👤"
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Nombre de usuario"
                      autoCapitalize="none"
                      editable={!isLoading}
                      style={styles.input}
                    />
                  )}

                  <InputField
                    icon="📧"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    style={styles.input}
                  />

                  <InputField
                    icon="🔑"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Contraseña"
                    secureTextEntry
                    editable={!isLoading}
                    style={styles.input}
                  />

                  <Button variant="primary" size="large" onPress={isSignUp ? handleSignUp : handleSignIn} loading={isLoading} disabled={isLoading} style={styles.submitButton}>
                    {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                  </Button>

                  <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} disabled={isLoading} style={styles.switchMode}>
                    <Text style={styles.switchText}>{isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}</Text>
                  </TouchableOpacity>

                  <View style={styles.orContainer}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>o continúa con</Text>
                    <View style={styles.orLine} />
                  </View>

                  <View style={styles.socialButtonsContainer}>
                    <SocialButton
                      provider="google"
                      onPress={async () => {
                        try {
                          const { startOAuth } = await import('../../services/auth/oauth');
                          await startOAuth('google');
                          onClose();
                        } catch (e) {}
                      }}
                      disabled={isLoading}
                      style={styles.socialButton}
                    />
                    <SocialButton
                      provider="apple"
                      onPress={async () => {
                        try {
                          const { startOAuth } = await import('../../services/auth/oauth');
                          await startOAuth('apple');
                          onClose();
                        } catch (e) {}
                      }}
                      disabled={isLoading}
                      style={styles.socialButton}
                    />
                  </View>
                  <View style={styles.socialButtonsContainer}>
                    <SocialButton
                      provider="facebook"
                      onPress={async () => {
                        try {
                          const { startOAuth } = await import('../../services/auth/oauth');
                          await startOAuth('facebook');
                          onClose();
                        } catch (e) {}
                      }}
                      disabled={isLoading}
                      style={styles.socialButton}
                    />
                  </View>
                </ScrollView>
              </AuthCard>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: dimensions.spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    padding: dimensions.spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: -dimensions.spacing.sm,
    right: -dimensions.spacing.sm,
    padding: dimensions.spacing.sm,
    zIndex: 1,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: 400,
  },
  input: {
    marginBottom: dimensions.spacing.md,
  },
  submitButton: {
    marginTop: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.md,
  },
  switchMode: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
  },
  switchText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
  },
  devButton: {
    marginTop: dimensions.spacing.md,
    opacity: 0.7,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginHorizontal: dimensions.spacing.md,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.sm,
  },
  socialButton: {
    flex: 1,
  },
});
