import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth, useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { Button } from '../components/Button';
import { dimensions } from '../constants/dimensions';

export function TestClerkScreen() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'verify'>('signup');

  useEffect(() => {
    console.log('[TestClerkScreen] State:', {
      isLoaded,
      isSignedIn,
      user: user?.id,
      mode,
      signUpStatus: signUp?.status,
    });
  }, [isLoaded, isSignedIn, user, mode, signUp]);

  const handleSignUp = async () => {
    if (!signUp) return;

    try {
      console.log('[TestClerkScreen] Creating account...');
      await signUp.create({
        emailAddress: email,
        password,
      });

      console.log('[TestClerkScreen] Preparing verification...');
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setMode('verify');
      Alert.alert('Success', 'Check your email for verification code');
    } catch (error: any) {
      console.error('[TestClerkScreen] Sign up error:', error);
      Alert.alert('Error', error.errors?.[0]?.message || 'Sign up failed');
    }
  };

  const handleVerify = async () => {
    if (!signUp) return;

    try {
      console.log('[TestClerkScreen] Verifying code...');
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      console.log('[TestClerkScreen] Verification result:', result);

      if (result.status === 'complete' && result.createdSessionId) {
        await signUp.setActive({ session: result.createdSessionId });
        Alert.alert('Success', 'Account verified and signed in!');
      } else {
        Alert.alert('Error', `Unexpected status: ${result.status}`);
      }
    } catch (error: any) {
      console.error('[TestClerkScreen] Verify error:', error);
      Alert.alert('Error', error.errors?.[0]?.message || 'Verification failed');
    }
  };

  const handleSignIn = async () => {
    if (!signIn) return;

    try {
      console.log('[TestClerkScreen] Signing in...');
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await signIn.setActive({ session: result.createdSessionId });
        Alert.alert('Success', 'Signed in!');
      }
    } catch (error: any) {
      console.error('[TestClerkScreen] Sign in error:', error);
      Alert.alert('Error', error.errors?.[0]?.message || 'Sign in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'Signed out');
    } catch (error) {
      console.error('[TestClerkScreen] Sign out error:', error);
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading Clerk...</Text>
      </View>
    );
  }

  if (isSignedIn && user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Signed In!</Text>
        <Text style={styles.text}>User ID: {user.id}</Text>
        <Text style={styles.text}>
          Email: {user.emailAddresses?.[0]?.emailAddress}
        </Text>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Clerk Test (No Convex)</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'signup' && styles.activeTab]}
          onPress={() => setMode('signup')}
        >
          <Text style={styles.tabText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'signin' && styles.activeTab]}
          onPress={() => setMode('signin')}
        >
          <Text style={styles.tabText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {mode !== 'verify' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.textSecondary}
          />
          <Button
            title={mode === 'signup' ? 'Sign Up' : 'Sign In'}
            onPress={mode === 'signup' ? handleSignUp : handleSignIn}
            style={styles.button}
          />
        </>
      ) : (
        <>
          <Text style={styles.text}>
            Enter verification code sent to {email}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Verification Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            placeholderTextColor={colors.textSecondary}
          />
          <Button title="Verify" onPress={handleVerify} style={styles.button} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: dimensions.spacing.md,
  },
  button: {
    marginTop: dimensions.spacing.md,
  },
});
