import { router } from 'expo-router';
import { MotiView } from 'moti';
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topSpacer} />

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          style={styles.logoWrap}>
          <Logo size={96} animated />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
          style={styles.titleWrap}>
          <ThemedText type="display" style={styles.title}>
            Moments
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            A private journal for two.{'\n'}Send a photo, a thought, a sticker — straight to
            their home screen.
          </ThemedText>
        </MotiView>

        <View style={styles.spacer} />

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          style={styles.buttons}>
          <AnimatedPressable
            onPress={handleGoogle}
            disabled={busy !== null}
            style={[
              styles.button,
              { backgroundColor: theme.text, opacity: busy ? 0.6 : 1 },
            ]}>
            <ThemedText style={{ color: theme.background }} type="smallBold">
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
        </MotiView>

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
  safeArea: { flex: 1, padding: Spacing.four, justifyContent: 'space-between' },
  topSpacer: { height: Spacing.four },
  logoWrap: { alignItems: 'center', marginTop: Spacing.six },
  titleWrap: { alignItems: 'center', gap: Spacing.three, marginTop: Spacing.four },
  title: { fontSize: 44, letterSpacing: -1 },
  subtitle: { textAlign: 'center', paddingHorizontal: Spacing.four, lineHeight: 22 },
  spacer: { flex: 1 },
  buttons: { gap: Spacing.two },
  button: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  buttonOutline: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  guestButton: { alignItems: 'center', paddingVertical: Spacing.three },
  error: { textAlign: 'center', marginTop: Spacing.three },
});
