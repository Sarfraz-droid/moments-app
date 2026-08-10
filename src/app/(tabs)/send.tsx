import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { BrandHeader } from '@/components/brand-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
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
      setError('Photo access chahiye — Settings me jaake allow karo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setError(null);
    }
  }

  function openCamera() {
    setCameraCaptureHandler((uri) => setPhotoUri(uri));
    router.push('/camera');
  }

  async function sendMoment() {
    const trimmedNote = note.trim();
    if (!session || !pair || (!photoUri && !trimmedNote)) return;
    setSending(true);
    setError(null);
    try {
      let storagePath: string | null = null;
      if (photoUri) {
        const momentId = Crypto.randomUUID();
        storagePath = await uploadMomentPhoto(pair.id, momentId, photoUri);
        const { error: insertError } = await supabase.from('moments').insert({
          id: momentId,
          pair_id: pair.id,
          sender_id: session.user.id,
          type: 'photo',
          storage_path: storagePath,
          text: trimmedNote || null,
        });
        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase.from('moments').insert({
          pair_id: pair.id,
          sender_id: session.user.id,
          type: 'note',
          text: trimmedNote,
        });
        if (insertError) throw insertError;
      }
      setPhotoUri(null);
      setNote('');
      syncLatestMomentToWidget(pair.id).catch(() => {});
      router.replace('/');
    } catch {
      setError('Bhejne me dikkat aayi, dobara try karo.');
    } finally {
      setSending(false);
    }
  }

  const canSend = Boolean(photoUri || note.trim());
  const partnerName = partnerProfile?.display_name || 'them';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrap}>
          <BrandHeader subtitle={partnerProfile ? `For ${partnerName}` : undefined} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {photoUri ? (
            <MotiView
              from={{ opacity: 0, scale: 0.94, rotate: '-2deg' }}
              animate={{ opacity: 1, scale: 1, rotate: '0.5deg' }}
              transition={{ type: 'spring', damping: 14 }}
              style={styles.polaroid}>
              <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
              <Pressable
                onPress={() => setPhotoUri(null)}
                style={[styles.removeButton, { backgroundColor: theme.background }]}>
                <ThemedText type="smallBold">✕</ThemedText>
              </Pressable>
            </MotiView>
          ) : (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 360 }}
              style={styles.pickerArea}>
              <ThemedText type="display" style={styles.pickerHeadline}>
                What did you{'\n'}see today?
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.pickerSub}>
                A photo, a thought, or both — they show up on {partnerName}&apos;s home screen.
              </ThemedText>

              <AnimatedPressable
                onPress={openCamera}
                style={[styles.primaryButton, { backgroundColor: theme.brand }]}>
                <ThemedText style={{ color: '#fff' }} type="smallBold">
                  📷  Take a photo
                </ThemedText>
              </AnimatedPressable>

              <Pressable onPress={pickFromGallery} style={styles.secondaryButton}>
                <ThemedText type="smallBold">or pick from gallery</ThemedText>
              </Pressable>
            </MotiView>
          )}

          {photoUri ? (
            <Pressable onPress={pickFromGallery} style={styles.swapButton}>
              <ThemedText type="small" themeColor="textSecondary">
                Choose a different photo
              </ThemedText>
            </Pressable>
          ) : null}

          <View style={styles.noteWrap}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.noteLabel}>
              {photoUri ? 'Add a caption' : 'Or just a note'}
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={photoUri ? 'Say something sweet…' : 'Type a little thought…'}
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[
                styles.noteInput,
                {
                  color: photoUri ? theme.text : theme.noteInk,
                  backgroundColor: photoUri ? theme.backgroundElement : theme.note,
                },
              ]}
            />
          </View>

          {error ? (
            <ThemedText themeColor="textSecondary" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.divider }]}>
          <AnimatedPressable
            onPress={sendMoment}
            disabled={!canSend || sending}
            style={[
              styles.sendButton,
              {
                backgroundColor: canSend ? theme.text : theme.backgroundElement,
                opacity: !canSend || sending ? 0.6 : 1,
              },
            ]}>
            <ThemedText
              style={{ color: canSend ? theme.background : theme.textSecondary }}
              type="smallBold">
              {sending ? 'Sending…' : canSend ? `Send to ${partnerName} 💌` : 'Add a photo or note'}
            </ThemedText>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  headerWrap: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  pickerArea: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  pickerHeadline: {
    fontSize: 32,
    lineHeight: 38,
  },
  pickerSub: {
    maxWidth: 340,
  },
  primaryButton: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  polaroid: {
    position: 'relative',
    backgroundColor: '#fff',
    padding: Spacing.two,
    paddingBottom: Spacing.four,
    borderRadius: Radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.two,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  swapButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
  },
  noteWrap: {
    gap: Spacing.two,
  },
  noteLabel: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontSize: 11,
    paddingHorizontal: Spacing.two,
  },
  noteInput: {
    borderRadius: Radii.md,
    padding: Spacing.four,
    fontSize: 17,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  error: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderTopWidth: 1,
  },
  sendButton: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
});
