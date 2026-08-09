import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

export default function PairScreen() {
  const { pair, createPair, joinPair } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      await createPair();
    } catch (e) {
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
    } catch (e) {
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
  }

  if (pair && pair.status === 'pending') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title" style={styles.title}>
            Waiting for them…
          </ThemedText>
          <ThemedText themeColor="textSecondary">Ye code partner ko bhejo:</ThemedText>
          <ThemedView type="backgroundElement" style={styles.codeBox}>
            <ThemedText type="title" style={styles.code}>
              {pair.invite_code}
            </ThemedText>
          </ThemedView>
          <Pressable onPress={handleShare} style={[styles.button, { backgroundColor: theme.text }]}>
            <ThemedText style={{ color: theme.background }} type="smallBold">
              Share invite
            </ThemedText>
          </Pressable>
          <Pressable onPress={handleCopy} style={[styles.buttonOutline, { borderColor: theme.text }]}>
            <ThemedText type="smallBold">Copy code</ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Connect with{'\n'}your person 💛
        </ThemedText>

        <Pressable
          onPress={handleCreate}
          disabled={busy}
          style={[styles.button, { backgroundColor: theme.text, opacity: busy ? 0.5 : 1 }]}>
          <ThemedText style={{ color: theme.background }} type="smallBold">
            Create invite
          </ThemedText>
        </Pressable>

        <ThemedText themeColor="textSecondary" style={styles.or}>
          ya
        </ThemedText>

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Enter their code"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <Pressable
          onPress={handleJoin}
          disabled={!code.trim() || busy}
          style={[
            styles.buttonOutline,
            { borderColor: theme.text, opacity: !code.trim() || busy ? 0.5 : 1 },
          ]}>
          <ThemedText type="smallBold">Join</ThemedText>
        </Pressable>

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
  safeArea: { flex: 1, padding: Spacing.four, justifyContent: 'center', gap: Spacing.three },
  title: { fontSize: 32, lineHeight: 38 },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    letterSpacing: 2,
  },
  button: { borderRadius: Spacing.five, paddingVertical: Spacing.three, alignItems: 'center' },
  buttonOutline: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
  },
  or: { textAlign: 'center' },
  codeBox: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  code: { fontSize: 40, letterSpacing: 8 },
  error: { textAlign: 'center' },
});
