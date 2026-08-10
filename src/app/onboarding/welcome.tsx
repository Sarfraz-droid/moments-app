import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
      setError('Google sign-in nahi ho paya. Dobara try karo.');
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
      setError('Kuch gadbad ho gaya, dobara try karo.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.logoWrap}>
          <Logo size={72} animated />
        </ThemedView>
        <ThemedText type="title" style={styles.title}>
          Moments 💛
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Apne khaas insaan ke saath photos aur notes share karo, seedha unke home screen par.
        </ThemedText>

        <ThemedView style={styles.buttons}>
          <AnimatedPressable
            onPress={handleGoogle}
            disabled={busy !== null}
            style={[styles.button, { backgroundColor: theme.text, opacity: busy ? 0.6 : 1 }]}>
            <ThemedText style={{ color: theme.background }} type="smallBold">
              {busy === 'google' ? 'Connecting…' : 'Continue with Google'}
            </ThemedText>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => router.push('/onboarding/phone')}
            disabled={busy !== null}
            style={[styles.buttonOutline, { borderColor: theme.text, opacity: busy ? 0.6 : 1 }]}>
            <ThemedText type="smallBold">Continue with phone number</ThemedText>
          </AnimatedPressable>

          <Pressable onPress={handleGuest} disabled={busy !== null} style={styles.guestButton}>
            <ThemedText themeColor="textSecondary" type="small">
              {busy === 'guest' ? 'Setting up…' : 'Continue as guest'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {error && (
          <ThemedText themeColor="textSecondary" style={styles.error}>
            {error}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, justifyContent: 'center', gap: Spacing.four },
  logoWrap: { alignItems: 'center' },
  title: { fontSize: 34, textAlign: 'center' },
  subtitle: { textAlign: 'center', paddingHorizontal: Spacing.three },
  buttons: { gap: Spacing.two, marginTop: Spacing.three },
  button: { borderRadius: Spacing.five, paddingVertical: Spacing.three, alignItems: 'center' },
  buttonOutline: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
  },
  guestButton: { alignItems: 'center', paddingVertical: Spacing.two },
  error: { textAlign: 'center' },
});
