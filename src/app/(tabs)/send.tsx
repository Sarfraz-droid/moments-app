import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { setCameraCaptureHandler } from '@/lib/camera-bridge';
import { supabase } from '@/lib/supabase';
import { uploadMomentPhoto } from '@/lib/storage';
import { syncLatestMomentToWidget } from '@/lib/widget-cache';

export default function SendScreen() {
  const { session, pair, partnerProfile } = useAuth();
  const theme = useTheme();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permission chahiye photo ke liye.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setNote('');
    }
  }

  async function sendPhoto() {
    if (!session || !pair || !photoUri) return;
    setSending(true);
    setError(null);
    try {
      const momentId = Crypto.randomUUID();
      const path = await uploadMomentPhoto(pair.id, momentId, photoUri);
      const { error: insertError } = await supabase.from('moments').insert({
        id: momentId,
        pair_id: pair.id,
        sender_id: session.user.id,
        type: 'photo',
        storage_path: path,
      });
      if (insertError) throw insertError;
      setPhotoUri(null);
      syncLatestMomentToWidget(pair.id).catch(() => {});
      router.replace('/');
    } catch {
      setError('Bhejne me dikkat aayi, dobara try karo.');
    } finally {
      setSending(false);
    }
  }

  async function sendNote() {
    if (!session || !pair || !note.trim()) return;
    setSending(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('moments').insert({
        pair_id: pair.id,
        sender_id: session.user.id,
        type: 'note',
        text: note.trim(),
      });
      if (insertError) throw insertError;
      setNote('');
      syncLatestMomentToWidget(pair.id).catch(() => {});
      router.replace('/');
    } catch {
      setError('Bhejne me dikkat aayi, dobara try karo.');
    } finally {
      setSending(false);
    }
  }

  function openCamera() {
    setCameraCaptureHandler((uri) => {
      setPhotoUri(uri);
      setNote('');
    });
    router.push('/camera');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <BrandHeader
          subtitle={partnerProfile ? `Send to ${partnerProfile.display_name}` : undefined}
        />

        {photoUri ? (
          <>
            <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
            <Pressable
              onPress={sendPhoto}
              disabled={sending}
              style={[styles.button, { backgroundColor: theme.text, opacity: sending ? 0.5 : 1 }]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                {sending ? 'Sending…' : 'Send photo'}
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => setPhotoUri(null)} style={styles.buttonOutline}>
              <ThemedText type="smallBold">Cancel</ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={openCamera}
              style={[styles.button, { backgroundColor: theme.text }]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                📷 Take photo
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={pickFromGallery}
              style={[styles.buttonOutline, { borderColor: theme.text }]}>
              <ThemedText type="smallBold">Choose from gallery</ThemedText>
            </Pressable>

            <ThemedText themeColor="textSecondary" style={styles.or}>
              ya note likho
            </ThemedText>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Type a little note…"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.noteInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <Pressable
              onPress={sendNote}
              disabled={!note.trim() || sending}
              style={[
                styles.button,
                { backgroundColor: theme.text, opacity: !note.trim() || sending ? 0.5 : 1 },
              ]}>
              <ThemedText style={{ color: theme.background }} type="smallBold">
                {sending ? 'Sending…' : 'Send note'}
              </ThemedText>
            </Pressable>
          </>
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
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  preview: { width: '100%', aspectRatio: 1, borderRadius: Spacing.three },
  button: { borderRadius: Spacing.five, paddingVertical: Spacing.three, alignItems: 'center' },
  buttonOutline: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
  },
  or: { textAlign: 'center' },
  noteInput: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: { textAlign: 'center' },
});
