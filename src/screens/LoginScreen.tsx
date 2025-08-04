import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { Button } from '../components/Button';

export function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        await setActive({ session: result.createdSessionId });
        // Navigation will be handled by auth state change
      } else {
        // Handle other statuses if needed
        console.log('Sign in status:', result.status);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Verifica tus credenciales e intenta de nuevo';

      // Check for specific Clerk test mode errors
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

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar Contraseña',
      'Esta función estará disponible pronto',
    );
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
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu_email@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPassword}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <Button
              title={isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              onPress={handleSignIn}
              disabled={isLoading || !isLoaded}
              style={styles.signInButton}
            />

            {isLoading && (
              <ActivityIndicator style={styles.loader} color={colors.primary} />
            )}

            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>o</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>Crear Cuenta Nueva</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
              <Text style={styles.signUpLink}>Regístrate</Text>
            </TouchableOpacity>
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
    ...typography.largeTitle,
    color: colors.primary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  formContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  inputContainer: {
    marginBottom: dimensions.spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.cardBackground,
  },
  forgotPassword: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'right',
    marginTop: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.lg,
  },
  signInButton: {
    marginTop: dimensions.spacing.md,
  },
  loader: {
    marginTop: dimensions.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: dimensions.spacing.lg,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.md,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: dimensions.spacing.xs,
  },
  signUpLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.lg,
    textDecorationLine: 'underline',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: dimensions.spacing.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: dimensions.spacing.md,
  },
  registerButton: {
    backgroundColor: colors.accent,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  registerButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: typography.fontSize.md,
  },
});
