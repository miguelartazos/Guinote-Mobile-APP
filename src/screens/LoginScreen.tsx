import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import { useAuth } from '../hooks/useAuth';
import type { JugarStackScreenProps } from '../types/navigation';

export function LoginScreen({ navigation }: JugarStackScreenProps<'Login'>) {
  const { login, loginAsGuest, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      navigation.navigate('JugarHome');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await loginAsGuest();
      navigation.navigate('JugarHome');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al entrar como invitado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>♠♥♣♦</Text>
            <Text style={styles.title}>GUIÑOTE</Text>
            <Text style={styles.subtitle}>Inicia sesión para jugar online</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Usuario o Email</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu usuario o email"
                placeholderTextColor={colors.secondary}
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
                placeholder="Ingresa tu contraseña"
                placeholderTextColor={colors.secondary}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginButton}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.alternativeActions}>
            <Button
              variant="secondary"
              onPress={handleGuestLogin}
              disabled={isLoading}
              style={styles.guestButton}
            >
              Jugar como Invitado
            </Button>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>Volver al menú principal</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.xxl,
  },
  logo: {
    fontSize: 48,
    marginBottom: dimensions.spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  form: {
    marginBottom: dimensions.spacing.xl,
  },
  inputContainer: {
    marginBottom: dimensions.spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: dimensions.spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginTop: dimensions.spacing.sm,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: dimensions.spacing.lg,
  },
  linkButton: {
    marginTop: dimensions.spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: dimensions.spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.secondary,
  },
  dividerText: {
    marginHorizontal: dimensions.spacing.md,
    color: colors.text,
    fontSize: typography.fontSize.md,
  },
  alternativeActions: {
    alignItems: 'center',
  },
  guestButton: {
    width: '100%',
  },
});
