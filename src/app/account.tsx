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

export default function AccountScreen() {
  const { session, profile } = useAuth();
  const theme = useTheme();
  const isAnonymous = Boolean(session?.user.is_anonymous);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);

  async function handleLinkGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle(true);
      setLinked(true);
    } catch {
      setError('Link nahi ho paya. Dobara try karo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.logoWrap}>
          <Logo size={56} animated />
        </ThemedView>
        <ThemedText type="title" style={styles.title}>
          Account
        </ThemedText>
        <ThemedText themeColor="textSecondary">{profile?.display_name}</ThemedText>

        {isAnonymous ? (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Guest account</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Naya phone ya app reinstall karne par ye data kho sakta hai. Google account link karo
                taaki safe rahe.
              </ThemedText>
            </ThemedView>

            <AnimatedPressable
              onPress={handleLinkGoogle}
              disabled={busy}
              style={[styles.button, { backgroundColor: theme.text, opacity: busy ? 0.6 : 1 }]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                {busy ? 'Connecting…' : 'Link Google account'}
              </ThemedText>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => router.push('/onboarding/phone')}
              disabled={busy}
              style={[styles.buttonOutline, { borderColor: theme.text, opacity: busy ? 0.6 : 1 }]}>
              <ThemedText type="smallBold">Link phone number</ThemedText>
            </AnimatedPressable>

            {linked && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Linked! ✅
              </ThemedText>
            )}
            {error && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {error}
              </ThemedText>
            )}
          </>
        ) : (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Account secured ✅</ThemedText>
          </ThemedView>
        )}

        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <ThemedText themeColor="textSecondary" type="small">
            Close
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.three, justifyContent: 'center' },
  logoWrap: { alignItems: 'center' },
  title: { fontSize: 28, textAlign: 'center' },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  button: { borderRadius: Spacing.five, paddingVertical: Spacing.three, alignItems: 'center' },
  buttonOutline: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
  },
  center: { textAlign: 'center' },
  closeButton: { alignItems: 'center', paddingVertical: Spacing.two, marginTop: Spacing.two },
});
