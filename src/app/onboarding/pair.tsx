import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radii, Spacing } from '@/constants/theme';
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
      setError('We could not create an invite. Please try again.');
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
      setError('That invite code is invalid or has expired.');
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!pair) return;
    await Share.share({
      message: `Join me on Moments. Invite code: ${pair.invite_code}\nhomescreennotifiers://join/${pair.invite_code}`,
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
          <View style={styles.content}>
            <Logo size={56} animated />
            <View style={styles.titleBlock}>
              <ThemedText type="display" style={styles.title}>
                Waiting for them to join…
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Share this code with your person.
              </ThemedText>
            </View>

            <View style={styles.codeWrap}>
              <ThemedView
                type="backgroundElement"
                style={[styles.codeBox, { borderColor: theme.divider }]}>
                <ThemedText type="display" style={styles.code}>
                  {pair.invite_code}
                </ThemedText>
              </ThemedView>

              <AnimatedPressable
                onPress={handleShare}
                style={[styles.button, { backgroundColor: theme.brand }]}>
                <ThemedText style={{ color: '#FFFFFF' }} type="smallBold">
                  Share invite
                </ThemedText>
              </AnimatedPressable>

              <Pressable onPress={handleCopy} style={styles.copyButton}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {copied ? 'Copied! ✓' : 'Copy code'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.keyboardArea}>
          <View style={styles.content}>
            <Logo size={56} animated />
            <View style={styles.titleBlock}>
              <ThemedText type="display" style={styles.title}>
                Connect with your person
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Create an invite, or enter theirs.
              </ThemedText>
            </View>

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
                accessibilityLabel="Invite code"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                onChangeText={setCode}
                onSubmitEditing={handleJoin}
                placeholder="Enter their code"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="done"
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.divider,
                  },
                ]}
                value={code}
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
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardArea: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  titleBlock: { gap: Spacing.two, alignItems: 'center', marginTop: Spacing.four },
  title: { fontSize: 32, lineHeight: 39, textAlign: 'center', maxWidth: 360 },
  subtitle: { lineHeight: 22, textAlign: 'center' },
  codeWrap: { gap: Spacing.three, width: '100%', maxWidth: 420, marginTop: Spacing.five },
  codeBox: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.five,
    alignItems: 'center',
    borderWidth: 1,
  },
  code: { fontSize: 44, letterSpacing: 10 },
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
  copyButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  formWrap: { gap: Spacing.three, width: '100%', maxWidth: 420, marginTop: Spacing.five },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  divider: { flex: 1, height: 1 },
  dividerLabel: { letterSpacing: 0.5 },
  input: {
    fontFamily: Fonts.sans,
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
