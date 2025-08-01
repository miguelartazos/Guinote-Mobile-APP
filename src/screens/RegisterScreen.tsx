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

const AVATARS = ['👤', '👨', '👩', '🧔', '👱', '👨‍🦰', '👩‍🦰', '👴', '👵'];

export function RegisterScreen({
  navigation,
}: JugarStackScreenProps<'Register'>) {
  const { register, error } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validate inputs
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (username.length < 3 || username.length > 20) {
      Alert.alert(
        'Error',
        'El nombre de usuario debe tener entre 3 y 20 caracteres',
      );
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert(
        'Error',
        'El nombre de usuario solo puede contener letras, números y guiones bajos',
      );
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await register(username, email, password, selectedAvatar);
      Alert.alert('¡Éxito!', 'Tu cuenta ha sido creada exitosamente', [
        { text: 'OK', onPress: () => navigation.navigate('JugarHome') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al crear la cuenta');
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
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a la comunidad de Guiñote</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre de Usuario</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Elige un nombre único"
                placeholderTextColor={colors.secondary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                editable={!isLoading}
              />
              <Text style={styles.helperText}>
                3-20 caracteres, solo letras, números y _
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={colors.secondary}
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
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.secondary}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite tu contraseña"
                placeholderTextColor={colors.secondary}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.avatarSection}>
              <Text style={styles.label}>Elige tu Avatar</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.avatarScroll}
              >
                {AVATARS.map(avatar => (
                  <TouchableOpacity
                    key={avatar}
                    onPress={() => setSelectedAvatar(avatar)}
                    disabled={isLoading}
                    style={[
                      styles.avatarButton,
                      selectedAvatar === avatar && styles.avatarButtonSelected,
                    ]}
                  >
                    <Text style={styles.avatarText}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              onPress={handleRegister}
              disabled={isLoading}
              style={styles.registerButton}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
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
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },
  form: {
    flex: 1,
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
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    marginTop: dimensions.spacing.xs,
  },
  avatarSection: {
    marginBottom: dimensions.spacing.lg,
  },
  avatarScroll: {
    marginTop: dimensions.spacing.sm,
  },
  avatarButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  avatarButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.primary,
  },
  avatarText: {
    fontSize: 32,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    marginTop: dimensions.spacing.sm,
    textAlign: 'center',
  },
  registerButton: {
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
});
