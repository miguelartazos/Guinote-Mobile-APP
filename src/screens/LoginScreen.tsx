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
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { Button } from '../components/Button';
import { InputField } from '../components/ui/InputField';
import { AuthCard } from '../components/auth/AuthCard';
import { SocialButton } from '../components/auth/SocialButton';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useFeatureFlag } from '../config/featureFlags';

export function LoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const useSupabaseAuth = useFeatureFlag('useSupabaseAuth');

  // Unified auth for Supabase
  const unifiedAuth = useSupabaseAuth ? useUnifiedAuth() : null;

  // Clerk removed
  const isLoaded = true;

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
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setIsLoading(true);

    try {
      if (useSupabaseAuth && unifiedAuth) {
        // Use Supabase auth
        await unifiedAuth.signIn(email, password);

        // Save email if remember me is checked
        if (rememberMe) {
          await AsyncStorage.setItem('savedEmail', email);
          await AsyncStorage.setItem('rememberMe', 'true');
        } else {
          await AsyncStorage.removeItem('savedEmail');
          await AsyncStorage.setItem('rememberMe', 'false');
        }

        // Navigate back to QuickMatch or previous screen
        if (route.params?.returnTo) {
          navigation.navigate(route.params.returnTo as never);
        } else {
          navigation.goBack();
        }
      } else {
        throw new Error('Online auth disabled');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Verifica tus credenciales e intenta de nuevo';

      if (useSupabaseAuth) {
        // Supabase error handling
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Por favor verifica tu email antes de iniciar sesión';
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else {
        errorMessage = 'Autenticación en línea deshabilitada';
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
    Alert.alert('No disponible', 'Recuperación de contraseña no disponible en modo offline');
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      const { startOAuth } = await import('../services/auth/oauth');
      await startOAuth(provider);
      // On success, navigate back like password sign-in
      if (route.params?.returnTo) {
        navigation.navigate(route.params.returnTo as never);
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      console.error('OAuth error:', e);
      Alert.alert('No se pudo iniciar sesión', e?.message || 'Inténtalo de nuevo');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <AuthCard
            title="Guiñote+"
            subtitle="Inicia sesión para jugar con amigos"
            footerSlot={
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Al continuar, aceptas nuestros </Text>
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
            }
          >
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
                testID="email-input"
                validation={{ isValid: email.includes('@') && email.includes('.'), message: email.length > 0 ? 'Formato de email válido' : undefined }}
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
                testID="password-input"
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

              <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading} style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <Button
                variant="white"
                onPress={handleSignIn}
                disabled={isLoading || !isLoaded}
                loading={isLoading}
                style={styles.signInButton}
                icon="➡️"
                iconPosition="right"
                testID="login-button"
              >
                {isLoading ? 'Iniciando sesión...' : 'Continuar'}
              </Button>

              <View style={styles.orContainer}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>o continúa con</Text>
                <View style={styles.orLine} />
              </View>

              <View style={styles.socialButtonsContainer}>
                <SocialButton provider="google" onPress={() => handleOAuthSignIn('google')} disabled={isLoading} style={styles.socialButton} />
                <SocialButton provider="apple" onPress={() => handleOAuthSignIn('apple')} disabled={isLoading} style={styles.socialButton} />
              </View>
              <View style={styles.socialButtonsContainer}>
                <SocialButton provider="facebook" onPress={() => handleOAuthSignIn('facebook')} disabled={isLoading} style={styles.socialButton} />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.registerButton} onPress={handleSignUp} disabled={isLoading} testID="register-link">
                <Text style={styles.registerButtonText}>¿No tienes cuenta? Regístrate</Text>
              </TouchableOpacity>
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={isLoading} message="Iniciando sesión..." />
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
