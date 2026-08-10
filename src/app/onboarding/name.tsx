import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function NameScreen() {
  const { setDisplayName } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const theme = useTheme();

  async function handleContinue() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await setDisplayName(name.trim());
      router.replace('/onboarding/pair');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.logoWrap}>
          <Logo size={64} animated />
        </ThemedView>
        <ThemedText type="title" style={styles.title}>
          Kiske naam se{'\n'}bheju? 💌
        </ThemedText>
        <ThemedText themeColor="textSecondary">Apna naam likho, partner ko dikhega.</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          autoFocus
          maxLength={30}
        />
        <AnimatedPressable
          onPress={handleContinue}
          disabled={!name.trim() || saving}
          style={[styles.button, { backgroundColor: theme.text, opacity: !name.trim() || saving ? 0.5 : 1 }]}>
          <ThemedText style={{ color: theme.background }} type="smallBold">
            {saving ? 'Saving…' : 'Continue'}
          </ThemedText>
        </AnimatedPressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, justifyContent: 'center', gap: Spacing.three },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 32, lineHeight: 38 },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
