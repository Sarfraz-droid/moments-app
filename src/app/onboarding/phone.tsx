import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
      setError('Code bhejne me dikkat aayi. Number check karo (+91...).');
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
      setError('Code galat hai. Dobara try karo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.logoWrap}>
          <Logo size={64} animated />
        </ThemedView>
        <ThemedText type="title" style={styles.title}>
          {step === 'phone' ? 'Apna number' : 'Code check karo'}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {step === 'phone'
            ? 'Country code ke saath (jaise +91XXXXXXXXXX)'
            : `${phone} par bheja gaya code daalo`}
        </ThemedText>

        {step === 'phone' ? (
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+91XXXXXXXXXX"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            autoFocus
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
        ) : (
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            autoFocus
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
        )}

        <AnimatedPressable
          onPress={step === 'phone' ? handleSend : handleVerify}
          disabled={busy || (step === 'phone' ? !phone.trim() : !code.trim())}
          style={[
            styles.button,
            { backgroundColor: theme.text, opacity: busy ? 0.6 : 1 },
          ]}>
          <ThemedText style={{ color: theme.background }} type="smallBold">
            {busy ? 'Please wait…' : step === 'phone' ? 'Send code' : 'Verify'}
          </ThemedText>
        </AnimatedPressable>

        {step === 'code' && (
          <Pressable onPress={() => setStep('phone')} style={styles.linkButton}>
            <ThemedText themeColor="textSecondary" type="small">
              Number badlo
            </ThemedText>
          </Pressable>
        )}

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
  logoWrap: { alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 32, lineHeight: 38 },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: { borderRadius: Spacing.five, paddingVertical: Spacing.three, alignItems: 'center' },
  linkButton: { alignItems: 'center', paddingVertical: Spacing.two },
  error: { textAlign: 'center' },
});
