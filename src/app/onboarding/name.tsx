import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function NameScreen() {
  const { setDisplayName } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  async function handleContinue() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await setDisplayName(name.trim());
      router.replace('/onboarding/pair');
    } catch {
      setError('We could not save your name. Please try again.');
    } finally {
      setSaving(false);
    }
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
                What should we call you?
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                This is the name your person will see.
              </ThemedText>
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                accessibilityLabel="Your name"
                autoCapitalize="words"
                autoFocus
                maxLength={30}
                onChangeText={setName}
                onSubmitEditing={handleContinue}
                placeholder="Your name"
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
                value={name}
              />

              <AnimatedPressable
                onPress={handleContinue}
                disabled={!name.trim() || saving}
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.brand,
                    opacity: !name.trim() || saving ? 0.5 : 1,
                  },
                ]}>
                <ThemedText style={{ color: '#FFFFFF' }} type="smallBold">
                  {saving ? 'Saving…' : 'Continue'}
                </ThemedText>
              </AnimatedPressable>
              {error ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.error}>
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
  inputWrap: { gap: Spacing.three, width: '100%', maxWidth: 420, marginTop: Spacing.five },
  input: {
    fontFamily: Fonts.sans,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    fontSize: 18,
    borderWidth: 1,
    minHeight: 56,
  },
  button: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  error: { textAlign: 'center' },
});
