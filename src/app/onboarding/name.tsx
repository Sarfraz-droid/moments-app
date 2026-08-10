import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
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
            What should we{'\n'}call you?
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Just the name your person will see.
          </ThemedText>
        </MotiView>

        <View style={styles.spacer} />

        <View style={styles.inputWrap}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.divider },
            ]}
            autoFocus
            maxLength={30}
          />

          <AnimatedPressable
            onPress={handleContinue}
            disabled={!name.trim() || saving}
            style={[
              styles.button,
              {
                backgroundColor: theme.text,
                opacity: !name.trim() || saving ? 0.5 : 1,
              },
            ]}>
            <ThemedText style={{ color: theme.background }} type="smallBold">
              {saving ? 'Saving…' : 'Continue'}
            </ThemedText>
          </AnimatedPressable>
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
  inputWrap: { gap: Spacing.three },
  input: {
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    fontSize: 18,
    borderWidth: 1,
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
});
