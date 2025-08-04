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
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { Button } from '../components/Button';
import { ScreenContainer } from '../components/ScreenContainer';

export function RegisterScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const navigation = useNavigation();

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
        // Navigation will be handled by auth state change
      } else {
        console.log('Verification status:', result.status);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert(
        'Error de verificación',
        error.errors?.[0]?.message || 'Código inválido',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.goBack();
  };

  if (pendingVerification) {
    return (
      <ScreenContainer>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Verificar Email</Text>
            <Text style={styles.subtitle}>
              Hemos enviado un código a {email}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Código de Verificación</Text>
              <TextInput
                style={styles.input}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="123456"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                editable={!isLoading}
              />
            </View>

            <Button
              title={isLoading ? 'Verificando...' : 'Verificar'}
              onPress={handleVerification}
              disabled={isLoading || !isLoaded}
              style={styles.signInButton}
            />

            {isLoading && (
              <ActivityIndicator style={styles.loader} color={colors.primary} />
            )}
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la comunidad de Guiñote</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre de Usuario</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="jugador123"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <Button
              title={isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              onPress={handleSignUp}
              disabled={isLoading || !isLoaded}
              style={styles.signInButton}
            />

            {isLoading && (
              <ActivityIndicator style={styles.loader} color={colors.primary} />
            )}
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={handleSignIn} disabled={isLoading}>
              <Text style={styles.signUpLink}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: dimensions.spacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    color: colors.primary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    ...typography.body,
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
  signInButton: {
    marginTop: dimensions.spacing.lg,
  },
  loader: {
    marginTop: dimensions.spacing.md,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});
