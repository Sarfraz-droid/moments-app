import { router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
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
  const { session, profile, logout } = useAuth();
  const pathname = usePathname();
  const isProfileTab = pathname.endsWith('/profile');
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
      setError('We could not link your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Log out?', 'You can sign back in whenever you want.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          setError(null);
          try {
            await logout();
          } catch {
            setError('We could not log you out. Please try again.');
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <Logo size={48} animated />
        </View>

        <View style={styles.headerBlock}>
          <ThemedText type="display" style={styles.title}>
            Hi, {profile?.display_name || 'you'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            {isAnonymous
              ? 'A guest account right now. Link a real login so your moments are safe across devices.'
              : 'Your account is secure.'}
          </ThemedText>
        </View>

        <View style={styles.spacer} />

        {isAnonymous ? (
          <View style={styles.actionsWrap}>
            <ThemedView
              type="backgroundElement"
              style={[styles.card, { borderColor: theme.divider }]}>
              <ThemedText type="smallBold">Guest account</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Link Google or your phone number to keep your moments when you change devices or
                reinstall the app.
              </ThemedText>
            </ThemedView>

            <AnimatedPressable
              onPress={handleLinkGoogle}
              disabled={busy}
              style={[styles.button, { backgroundColor: theme.brand, opacity: busy ? 0.6 : 1 }]}>
              <ThemedText style={{ color: '#FFFFFF' }} type="smallBold">
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
                Account linked successfully.
              </ThemedText>
            ) : null}
            {error && !isProfileTab ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {error}
              </ThemedText>
            ) : null}
          </View>
        ) : (
          <ThemedView
            type="backgroundElement"
            style={[styles.card, styles.secureCard, { borderColor: theme.divider }]}>
            <ThemedText type="smallBold">Account secured</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Your moments are safe. We&apos;ll keep them synced to the home screen.
            </ThemedText>
          </ThemedView>
        )}

        {isProfileTab ? (
          <View style={styles.logoutWrap}>
            <AnimatedPressable
              accessibilityRole="button"
              disabled={busy}
              onPress={confirmLogout}
              style={[styles.logoutButton, { borderColor: theme.divider, opacity: busy ? 0.55 : 1 }]}>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                {busy ? 'Logging out…' : 'Log out'}
              </ThemedText>
            </AnimatedPressable>
            {error ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {error}
              </ThemedText>
            ) : null}
          </View>
        ) : null}

        {!isProfileTab ? (
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <ThemedText themeColor="textSecondary" type="small">Close</ThemedText>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    alignItems: 'center',
  },
  topRow: { alignItems: 'center', marginBottom: Spacing.three },
  headerBlock: { gap: Spacing.two, alignItems: 'center', width: '100%' },
  title: { fontSize: 32, lineHeight: 38, textAlign: 'center' },
  subtitle: { lineHeight: 22, textAlign: 'center', maxWidth: 340 },
  spacer: { height: Spacing.five },
  actionsWrap: { gap: Spacing.three, width: '100%', maxWidth: 420 },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
  },
  secureCard: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  button: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonOutline: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 50,
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  logoutButton: {
    width: '100%',
    maxWidth: 420,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  logoutWrap: { width: '100%', maxWidth: 420, gap: Spacing.two, marginTop: Spacing.three },
  closeButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 'auto' },
});
