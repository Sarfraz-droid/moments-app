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
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <Logo size={48} animated />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 320 }}
          style={styles.headerBlock}>
          <ThemedText type="display" style={styles.title}>
            Hi, {profile?.display_name || 'you'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            {isAnonymous
              ? 'A guest account right now. Link a real login so your moments are safe across devices.'
              : 'Your account is secure.'}
          </ThemedText>
        </MotiView>

        <View style={styles.spacer} />

        {isAnonymous ? (
          <View style={styles.actionsWrap}>
            <ThemedView
              type="backgroundElement"
              style={[styles.card, { borderColor: theme.divider }]}>
              <ThemedText type="smallBold">Guest account</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Naya phone ya app reinstall karne par data kho sakta hai. Google ya phone se link
                karo taaki safe rahe.
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

            {linked ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Linked! ✅
              </ThemedText>
            ) : null}
            {error ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {error}
              </ThemedText>
            ) : null}
          </View>
        ) : (
          <ThemedView
            type="backgroundElement"
            style={[styles.card, styles.secureCard, { borderColor: theme.divider }]}>
            <View style={[styles.checkmark, { backgroundColor: theme.brand }]}>
              <ThemedText style={{ color: '#fff', fontWeight: 700 }}>✓</ThemedText>
            </View>
            <ThemedText type="smallBold">Account secured</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your moments are safe. We&apos;ll keep them synced to the home screen.
            </ThemedText>
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
  safeArea: { flex: 1, padding: Spacing.four, justifyContent: 'space-between' },
  topRow: { alignItems: 'flex-start' },
  headerBlock: { gap: Spacing.two },
  title: { fontSize: 32, lineHeight: 38 },
  subtitle: { lineHeight: 22 },
  spacer: { flex: 1 },
  actionsWrap: { gap: Spacing.three },
  card: {
    borderRadius: Radii.lg,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
  },
  secureCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  checkmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  center: { textAlign: 'center' },
  closeButton: { alignItems: 'center', paddingVertical: Spacing.two, marginTop: Spacing.three },
});
