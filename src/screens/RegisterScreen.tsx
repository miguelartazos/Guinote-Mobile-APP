import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { Button } from '../components/Button';
import { InputField } from '../components/ui/InputField';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useFeatureFlag } from '../config/featureFlags';
// Clerk removed

export function RegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const useSupabaseAuth = useFeatureFlag('useSupabaseAuth');

  // Unified auth for Supabase
  const unifiedAuth = useSupabaseAuth ? useUnifiedAuth() : null;

  const isLoaded = true;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  const handleSignUp = async () => {
    // Validate inputs
    if (!email || !password || !username) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      if (useSupabaseAuth && unifiedAuth) {
        // Use Supabase auth
        await unifiedAuth.signUp(email, password, username);

        // Supabase sends verification email automatically
        Alert.alert(
          'Verifica tu email',
          'Te hemos enviado un correo de verificación. Por favor verifica tu email antes de iniciar sesión.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login' as never),
            },
          ],
        );
      } else {
        throw new Error('Registro en línea deshabilitado');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Verifica tus datos e intenta de nuevo';

      if (useSupabaseAuth) {
        // Supabase error handling
        if (error.message?.includes('already registered')) {
          errorMessage = 'Este email ya está registrado';
        } else if (error.message?.includes('weak password')) {
          errorMessage =
            'La contraseña es muy débil. Usa al menos 8 caracteres con números y letras';
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else {
        errorMessage = 'Registro en línea deshabilitado';
      }

      Alert.alert('Error al registrarse', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    // No verification flow when online auth is disabled
    Alert.alert('No disponible', 'La verificación está deshabilitada.');
  };

  const handleOAuthSignUp = async () => {
    Alert.alert('No disponible', 'Registro con proveedores deshabilitado.');
  };

  const handleSignIn = () => {
    navigation.navigate('Login' as never);
  };

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Verificar Email</Text>
              <Text style={styles.subtitle}>
                Te hemos enviado un código de verificación a {email}
              </Text>
            </View>

            <View style={styles.formContainer}>
              <InputField
                label="Código de Verificación"
                icon="🔢"
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />

              <Button
                variant="white"
                onPress={handleVerification}
                disabled={isLoading}
                loading={isLoading}
                style={styles.verifyButton}
                icon="✅"
              >
                {isLoading ? 'Verificando...' : 'Verificar y Continuar'}
              </Button>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => setPendingVerification(false)}
                disabled={isLoading}
              >
                <Text style={styles.resendButtonText}>¿No recibiste el código? Volver atrás</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la comunidad de Guiñote</Text>
          </View>

          <View style={styles.formContainer}>
            <InputField
              label="Nombre de Usuario"
              icon="👤"
              value={username}
              onChangeText={setUsername}
              placeholder="JugadorGuiñote"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              testID="username-input"
              validation={{
                isValid: username.length >= 3,
                message: username.length > 0 ? `${username.length}/3 caracteres mínimo` : undefined,
              }}
            />

            <InputField
              label="Email"
              icon="✉️"
              value={email}
              onChangeText={setEmail}
              placeholder="tu_email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              testID="register-email-input"
              validation={{
                isValid: email.includes('@') && email.includes('.'),
                message: email.length > 0 ? 'Formato de email válido' : undefined,
              }}
            />

            <InputField
              label="Contraseña"
              icon="🔒"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              showPasswordToggle
              editable={!isLoading}
              testID="register-password-input"
              validation={{
                isValid: password.length >= 8,
                message: password.length > 0 ? `${password.length}/8 caracteres mínimo` : undefined,
              }}
            />

            <InputField
              label="Confirmar Contraseña"
              icon="🔐"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite tu contraseña"
              secureTextEntry
              showPasswordToggle
              editable={!isLoading}
              testID="confirm-password-input"
              error={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? 'Las contraseñas no coinciden'
                  : undefined
              }
            />

            <Button
              variant="white"
              onPress={handleSignUp}
              disabled={isLoading || !isLoaded}
              style={styles.signUpButton}
              testID="register-button"
            >
              {isLoading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>

            {isLoading && <ActivityIndicator style={styles.loader} color={colors.accent} />}

            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>o regístrate con</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOAuthSignUp('oauth_google')}
                disabled={isLoading}
              >
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleOAuthSignUp('oauth_apple')}
                disabled={isLoading}
              >
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>¿Ya tienes cuenta? Inicia Sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Al registrarte, aceptas nuestros </Text>
            <View style={styles.footerLinks}>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Términos de Servicio</Text>
              </TouchableOpacity>
              <Text style={styles.footerText}> y </Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Política de Privacidad</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  inputContainer: {
    marginBottom: dimensions.spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  signUpButton: {
    marginTop: dimensions.spacing.lg,
  },
  verifyButton: {
    marginTop: dimensions.spacing.lg,
  },
  loader: {
    marginTop: dimensions.spacing.md,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: dimensions.spacing.xl,
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
    marginBottom: dimensions.spacing.lg,
  },
  socialButton: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: dimensions.spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: dimensions.spacing.lg,
  },
  signInButton: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
  },
  signInButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.accent,
    fontWeight: typography.fontWeight.semibold,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.md,
    marginTop: dimensions.spacing.lg,
  },
  resendButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  footerContainer: {
    alignItems: 'center',
    paddingTop: dimensions.spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: typography.fontSize.xs,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
});
