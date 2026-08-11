import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/phone-auth';

export default function PhoneScreen() {
  const { session } = useAuth();
  const linkToCurrentUser = Boolean(session?.user.is_anonymous);
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!phone.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendPhoneOtp(phone.trim(), linkToCurrentUser);
      setStep('code');
    } catch {
      setError('We could not send a code. Check the full number and country code.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await verifyPhoneOtp(phone.trim(), code.trim(), linkToCurrentUser);
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch {
      setError('That code is not valid. Check it and try again.');
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

        <View style={styles.titleBlock}>
          <ThemedText type="display" style={styles.title}>
            {step === 'phone' ? 'Add your number' : 'Check the code'}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            {step === 'phone'
              ? 'Include the country code, for example +91. This keeps your account secure.'
              : `We sent a 6-digit code to ${phone}.`}
          </ThemedText>
        </View>

        <View style={styles.spacer} />

        <View style={styles.inputWrap}>
          {step === 'phone' ? (
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91XXXXXXXXXX"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              autoFocus
              style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.divider },
              ]}
            />
          ) : (
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              autoFocus
              style={[
                styles.input,
                styles.codeInput,
                { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.divider },
              ]}
              maxLength={6}
            />
          )}

          <AnimatedPressable
            onPress={step === 'phone' ? handleSend : handleVerify}
            disabled={busy || (step === 'phone' ? !phone.trim() : !code.trim())}
            style={[
              styles.button,
              { backgroundColor: theme.brand, opacity: busy || (step === 'phone' ? !phone.trim() : !code.trim()) ? 0.5 : 1 },
            ]}>
            <ThemedText style={{ color: '#FFFFFF' }} type="smallBold">
              {busy ? 'Please wait…' : step === 'phone' ? 'Send code' : 'Verify'}
            </ThemedText>
          </AnimatedPressable>

          {step === 'code' ? (
            <Pressable onPress={() => setStep('phone')} style={styles.linkButton}>
              <ThemedText themeColor="textSecondary" type="small">
                Change number
              </ThemedText>
            </Pressable>
          ) : null}

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
  inputWrap: { gap: Spacing.three },
  input: {
    fontFamily: Fonts.sans,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    fontSize: 18,
    borderWidth: 1,
  },
  codeInput: {
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 24,
  },
  button: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  linkButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  error: { textAlign: 'center' },
});
