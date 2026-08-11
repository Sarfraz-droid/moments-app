import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { signInWithGoogle } from '@/lib/google-auth';

export default function WelcomeScreen() {
  const { continueAnonymously } = useAuth();
  const theme = useTheme();
  const [busy, setBusy] = useState<'google' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setBusy('google');
    setError(null);
    try {
      await signInWithGoogle(false);
    } catch {
      setError('Google sign-in did not work. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function handleGuest() {
    setBusy('guest');
    setError(null);
    try {
      await continueAnonymously();
    } catch {
      setError('We could not set up your account. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.hero}>
          <Logo size={72} />
          <View style={styles.titleWrap}>
            <ThemedText type="display" style={styles.title}>
              Moments
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Photos and notes, just for the two of you.
            </ThemedText>
          </View>
        </View>

        <View style={styles.buttons}>
          <AnimatedPressable
            onPress={handleGoogle}
            disabled={busy !== null}
            style={[
              styles.button,
              { backgroundColor: theme.brand, opacity: busy ? 0.6 : 1 },
            ]}>
            <ThemedText style={{ color: '#FFFFFF' }} type="smallBold">
              {busy === 'google' ? 'Connecting…' : 'Continue with Google'}
            </ThemedText>
          </AnimatedPressable>

          <Pressable
            onPress={() => router.push('/onboarding/phone')}
            disabled={busy !== null}
            style={[styles.buttonOutline, { borderColor: theme.text, opacity: busy ? 0.6 : 1 }]}>
            <ThemedText type="smallBold">Continue with phone</ThemedText>
          </Pressable>

          <Pressable onPress={handleGuest} disabled={busy !== null} style={styles.guestButton}>
            <ThemedText themeColor="textSecondary" type="small">
              {busy === 'guest' ? 'Setting up…' : 'Try as guest'}
            </ThemedText>
          </Pressable>
        </View>

        {error ? (
          <ThemedText themeColor="textSecondary" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.four },
  titleWrap: { alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 40, lineHeight: 46, letterSpacing: -1 },
  subtitle: { textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  buttons: {
    width: '100%',
    maxWidth: 420,
    gap: Spacing.three,
    marginTop: Spacing.six,
  },
  button: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonOutline: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 50,
    justifyContent: 'center',
  },
  guestButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  error: { textAlign: 'center', marginTop: Spacing.three },
});
