import React, { useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { Button } from '../components/Button';
import { InputField } from '../components/ui/InputField';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigation = useNavigation();
  const route = useRoute();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved credentials if remember me was checked
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail');
      const savedRememberMe = await AsyncStorage.getItem('rememberMe');

      if (savedRememberMe === 'true' && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const handleSignIn = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        // Save email if remember me is checked
        if (rememberMe) {
          await AsyncStorage.setItem('savedEmail', email);
          await AsyncStorage.setItem('rememberMe', 'true');
        } else {
          await AsyncStorage.removeItem('savedEmail');
          await AsyncStorage.setItem('rememberMe', 'false');
        }

        await setActive({ session: result.createdSessionId });

        // Navigate back to QuickMatch or previous screen
        if (route.params?.returnTo) {
          navigation.navigate(route.params.returnTo as never);
        } else {
          navigation.goBack();
        }
      } else {
        console.log('Sign in status:', result.status);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Verifica tus credenciales e intenta de nuevo';

      if (error.errors?.[0]?.message?.includes('clerk_test')) {
        errorMessage =
          'Para iniciar sesión en modo de prueba, usa un email con formato: tu_email+clerk_test@example.com';
      } else if (error.errors?.[0]?.message?.includes('not found')) {
        errorMessage =
          'No se encontró una cuenta con ese email. ¿Quieres registrarte?';
      } else if (error.errors?.[0]?.message) {
        errorMessage = error.errors[0].message;
      }

      Alert.alert('Error al iniciar sesión', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Register' as never);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email primero');
      return;
    }

    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      Alert.alert(
        'Correo enviado',
        'Te hemos enviado un correo con instrucciones para restablecer tu contraseña',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to password reset screen if you have one
              // navigation.navigate('ResetPassword' as never);
            },
          },
        ],
      );
    } catch (error: any) {
      console.error('Forgot password error:', error);
      Alert.alert(
        'Error',
        error.errors?.[0]?.message ||
          'No se pudo enviar el correo de recuperación',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (
    strategy: 'oauth_google' | 'oauth_apple',
  ) => {
    if (!isLoaded) return;

    try {
      const { createdSessionId, setActive: setActiveSession } =
        await signIn.create({ strategy });

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
      console.error('OAuth sign in error:', error);
      Alert.alert(
        'Error de autenticación',
        'No se pudo iniciar sesión con este proveedor',
      );
    }
  };

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
            <Text style={styles.title}>Guiñote</Text>
            <Text style={styles.subtitle}>Inicia sesión para jugar</Text>
          </View>

          <View style={styles.formContainer}>
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
              placeholder="••••••••"
              secureTextEntry
              showPasswordToggle
              editable={!isLoading}
            />

            <View style={styles.rememberContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={rememberMe ? colors.white : colors.textSecondary}
                disabled={isLoading}
              />
              <Text style={styles.rememberText}>Recordarme</Text>
            </View>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPassword}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <Button
              variant="white"
              onPress={handleSignIn}
              disabled={isLoading || !isLoaded}
              loading={isLoading}
              style={styles.signInButton}
              icon="➡️"
              iconPosition="right"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>o continúa con</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <Button
                variant="white"
                onPress={() => handleOAuthSignIn('oauth_google')}
                disabled={isLoading}
                style={styles.socialButton}
                icon="🌐"
              >
                Google
              </Button>

              <Button
                variant="white"
                onPress={() => handleOAuthSignIn('oauth_apple')}
                disabled={isLoading}
                style={styles.socialButton}
                icon="🍎"
              >
                Apple
              </Button>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                ¿No tienes cuenta? Regístrate
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Al continuar, aceptas nuestros{' '}
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
      <LoadingOverlay
        visible={isLoading}
        message="Iniciando sesión..."
      />
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
  },
  formContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.md,
  },
  rememberText: {
    marginLeft: dimensions.spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: dimensions.spacing.lg,
  },
  forgotPassword: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  signInButton: {
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
    gap: dimensions.spacing.sm,
  },
  socialButton: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: dimensions.spacing.lg,
  },
  registerButton: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
  },
  registerButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.accent,
    fontWeight: typography.fontWeight.semibold,
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
