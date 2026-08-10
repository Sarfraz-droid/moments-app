import * as Clipboard from 'expo-clipboard';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

export default function PairScreen() {
  const { pair, createPair, joinPair } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      await createPair();
    } catch {
      setError('Kuch gadbad ho gaya, dobara try karo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await joinPair(code);
    } catch {
      setError('Code galat hai ya expire ho gaya.');
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!pair) return;
    await Share.share({
      message: `Mujhse jud jao is app pe! Invite code: ${pair.invite_code}\nhomescreennotifiers://join/${pair.invite_code}`,
    });
  }

  async function handleCopy() {
    if (!pair) return;
    await Clipboard.setStringAsync(pair.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (pair && pair.status === 'pending') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.topRow}>
            <Logo size={48} animated />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350 }}
            style={styles.titleBlock}>
            <ThemedText type="display" style={styles.title}>
              Waiting for{'\n'}them to join…
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Send this code to your person. They enter it on their phone and you&apos;re connected.
            </ThemedText>
          </MotiView>

          <View style={styles.spacer} />

          <View style={styles.codeWrap}>
            <MotiView
              from={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 10, delay: 200 }}>
              <ThemedView type="backgroundElement" style={styles.codeBox}>
                <ThemedText type="display" style={styles.code}>
                  {pair.invite_code}
                </ThemedText>
              </ThemedView>
            </MotiView>

            <AnimatedPressable onPress={handleShare} style={[styles.button, { backgroundColor: theme.text }]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                Share invite
              </ThemedText>
            </AnimatedPressable>

            <Pressable onPress={handleCopy} style={styles.copyButton}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {copied ? 'Copied! ✓' : 'Copy code'}
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <Logo size={48} animated />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
          style={styles.titleBlock}>
          <ThemedText type="display" style={styles.title}>
            Connect with{'\n'}your person
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Create an invite to share, or enter the code they sent you.
          </ThemedText>
        </MotiView>

        <View style={styles.spacer} />

        <View style={styles.formWrap}>
          <AnimatedPressable
            onPress={handleCreate}
            disabled={busy}
            style={[styles.button, { backgroundColor: theme.brand, opacity: busy ? 0.6 : 1 }]}>
            <ThemedText style={{ color: '#fff' }} type="smallBold">
              {busy ? 'Creating…' : 'Create invite'}
            </ThemedText>
          </AnimatedPressable>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.dividerLabel}>
              or join theirs
            </ThemedText>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          </View>

          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter their code"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.divider },
            ]}
          />
          <AnimatedPressable
            onPress={handleJoin}
            disabled={!code.trim() || busy}
            style={[
              styles.buttonOutline,
              { borderColor: theme.text, opacity: !code.trim() || busy ? 0.5 : 1 },
            ]}>
            <ThemedText type="smallBold">Join</ThemedText>
          </AnimatedPressable>

          {error ? (
            <ThemedText themeColor="textSecondary" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, justifyContent: 'space-between' },
  topRow: { alignItems: 'flex-start' },
  titleBlock: { gap: Spacing.three },
  title: { fontSize: 36, lineHeight: 42 },
  subtitle: { lineHeight: 22 },
  spacer: { flex: 1 },
  codeWrap: { gap: Spacing.three },
  codeBox: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.five,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  code: { fontSize: 44, letterSpacing: 10 },
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
  copyButton: { alignItems: 'center', paddingVertical: Spacing.two },
  formWrap: { gap: Spacing.three },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  divider: { flex: 1, height: 1 },
  dividerLabel: { letterSpacing: 0.5 },
  input: {
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    borderWidth: 1,
  },
  error: { textAlign: 'center' },
});
