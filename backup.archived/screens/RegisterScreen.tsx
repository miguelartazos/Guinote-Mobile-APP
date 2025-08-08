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
import { useSignUp, useSignIn } from '@clerk/clerk-expo';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { Button } from '../components/Button';
import { InputField } from '../components/ui/InputField';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { signIn } = useSignIn();
  const navigation = useNavigation();
  const route = useRoute();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;

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
      // Create the user
      await signUp.create({
        emailAddress: email,
        password,
        username,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Verifica tus datos e intenta de nuevo';

      // Check for specific Clerk test mode errors
      if (error.errors?.[0]?.message?.includes('clerk_test')) {
        errorMessage =
          'Para registrarte en modo de prueba, usa un email con formato: tu_email+clerk_test@example.com';
      } else if (error.errors?.[0]?.message) {
        errorMessage = error.errors[0].message;
      }

      Alert.alert('Error al registrarse', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!isLoaded) return;

    if (!verificationCode) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });

        // Auto-login after successful registration
        if (signIn && email && password) {
          try {
            const signInResult = await signIn.create({
              identifier: email,
              password,
            });

            if (signInResult.status === 'complete') {
              await setActive({ session: signInResult.createdSessionId });
            }
          } catch (signInError) {
            console.error('Auto sign-in error:', signInError);
          }
        }

        // Navigate back to previous screen or home
        if (route.params?.returnTo) {
          navigation.navigate(route.params.returnTo as never);
        } else {
          navigation.goBack();
        }
      } else {
        console.log('Verification status:', result.status);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert(
        'Error de verificación',
        error.errors?.[0]?.message || 'Código inválido. Intenta de nuevo',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async (
    strategy: 'oauth_google' | 'oauth_apple',
  ) => {
    if (!isLoaded) return;

    try {
      const { createdSessionId, setActive: setActiveSession } =
        await signUp.create({ strategy });

      if (createdSessionId) {
        await setActiveSession({ session: createdSessionId });

        // Navigate back
        if (route.params?.returnTo) {
          navigation.navigate(route.params.returnTo as never);
        } else {
          navigation.goBack();
        }
      }
    } catch (error: any) {
      console.error('OAuth sign up error:', error);
      Alert.alert(
        'Error de registro',
        'No se pudo registrar con este proveedor',
      );
    }
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
                <Text style={styles.resendButtonText}>
                  ¿No recibiste el código? Volver atrás
                </Text>
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
              error={confirmPassword.length > 0 && password !== confirmPassword ? 'Las contraseñas no coinciden' : undefined}
            />

            <Button
              variant="white"
              onPress={handleSignUp}
              disabled={isLoading || !isLoaded}
              style={styles.signUpButton}
            >
              {isLoading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>

            {isLoading && (
              <ActivityIndicator style={styles.loader} color={colors.accent} />
            )}

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
              <Text style={styles.signInButtonText}>
                ¿Ya tienes cuenta? Inicia Sesión
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Al registrarte, aceptas nuestros{' '}
            </Text>
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
