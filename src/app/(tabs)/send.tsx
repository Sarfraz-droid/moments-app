import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { MotiView } from 'moti';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { BrandHeader } from '@/components/brand-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { setCameraCaptureHandler } from '@/lib/camera-bridge';
import { supabase } from '@/lib/supabase';
import { uploadMomentPhoto } from '@/lib/storage';
import { syncLatestMomentToWidget } from '@/lib/widget-cache';

export default function SendScreen() {
  const { camera } = useLocalSearchParams<{ camera?: string }>();
  const { session, pair, partnerProfile } = useAuth();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didAutoOpenCamera = useRef(false);

  useEffect(() => {
    if (camera !== '1' || didAutoOpenCamera.current) return;
    didAutoOpenCamera.current = true;
    const timer = setTimeout(() => {
      setCameraCaptureHandler((uri) => {
        setPhotoUri(uri);
        setError(null);
      });
      router.push('/camera');
    }, 250);
    return () => clearTimeout(timer);
  }, [camera]);

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access in Settings to choose an image.');
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
    setCameraCaptureHandler((uri) => {
      setPhotoUri(uri);
      setError(null);
    });
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
      setError('Your moment could not be sent. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  const canSend = Boolean(photoUri || note.trim());
  const partnerName = partnerProfile?.display_name || 'your person';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.keyboardArea}>
          <View style={[styles.headerWrap, { borderBottomColor: theme.divider }]}>
            <AnimatedPressable
              accessibilityLabel="Close send sheet"
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.headerSideButton}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={20}
                tintColor={theme.textSecondary}
              />
            </AnimatedPressable>
            <View style={styles.headerTitle}>
              <BrandHeader title="Send" />
            </View>
            <AnimatedPressable
              accessibilityLabel={sending ? 'Sending moment' : `Send moment to ${partnerName}`}
              accessibilityRole="button"
              disabled={!canSend || sending}
              onPress={sendMoment}
              style={[
                styles.headerSendButton,
                {
                  backgroundColor: canSend ? theme.brand : theme.backgroundElement,
                  opacity: sending ? 0.72 : 1,
                },
              ]}>
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <SymbolView
                  name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                  size={19}
                  tintColor={canSend ? '#FFFFFF' : theme.textSecondary}
                />
              )}
            </AnimatedPressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.intro}>
              <ThemedText type="subtitle">What do you want to share?</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Add a photo, a message, or both for {partnerName}.
              </ThemedText>
            </View>

            <View style={styles.photoSection}>
            <View style={styles.sectionHeading}>
              <ThemedText type="smallBold">Photo</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Optional</ThemedText>
            </View>
            {photoUri ? (
              <MotiView
                from={{ opacity: 0, scale: reducedMotion ? 1 : 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: reducedMotion ? 0 : 180 }}
                style={[styles.previewWrap, { backgroundColor: theme.backgroundElement }]}>
                <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPhotoUri(null)}
                  style={[styles.removeButton, { backgroundColor: theme.background }]}>
                  <ThemedText type="smallBold">Remove</ThemedText>
                </Pressable>
              </MotiView>
            ) : (
              <View style={styles.mediaActions}>
                <AnimatedPressable
                  onPress={openCamera}
                  style={[styles.sourceAction, { backgroundColor: theme.brandSoft }]}>
                  <SymbolView
                    name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                    size={20}
                    tintColor={theme.brand}
                  />
                  <View style={styles.sourceCopy}>
                    <ThemedText type="smallBold" style={{ color: theme.brand }}>Camera</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Take a new photo</ThemedText>
                  </View>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={pickFromGallery}
                  style={[styles.sourceAction, { backgroundColor: theme.backgroundElement }]}>
                  <SymbolView
                    name={{ ios: 'photo.fill', android: 'photo', web: 'photo' }}
                    size={20}
                    tintColor={theme.text}
                  />
                  <View style={styles.sourceCopy}>
                    <ThemedText type="smallBold">Library</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Choose an existing photo</ThemedText>
                  </View>
                </AnimatedPressable>
              </View>
            )}
            </View>

            {photoUri ? (
              <Pressable onPress={pickFromGallery} style={styles.changePhoto}>
                <ThemedText type="smallBold" style={{ color: theme.brand }}>
                  Choose another photo
                </ThemedText>
              </Pressable>
            ) : null}

            <View style={styles.noteWrap}>
            <ThemedText type="smallBold">{photoUri ? 'Caption' : 'Message'}</ThemedText>
            <TextInput
              accessibilityLabel={photoUri ? 'Caption' : 'Message'}
              value={note}
              onChangeText={setNote}
              placeholder={photoUri ? 'Add a caption…' : `Write something for ${partnerName}…`}
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[
                styles.noteInput,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: theme.divider,
                },
              ]}
            />
            </View>

            {error ? (
              <View style={[styles.errorWrap, { backgroundColor: theme.brandSoft }]}>
                <ThemedText type="small" style={{ color: theme.brand }}>
                  {error}
                </ThemedText>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardArea: { flex: 1 },
  headerWrap: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { flex: 1 },
  headerSideButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  intro: { gap: Spacing.one, paddingTop: Spacing.two },
  photoSection: { gap: Spacing.two },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  mediaActions: { gap: Spacing.two },
  sourceAction: {
    minHeight: 68,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  sourceCopy: { gap: 1 },
  previewWrap: { position: 'relative', borderRadius: Radii.md, overflow: 'hidden' },
  preview: { width: '100%', aspectRatio: 1 },
  removeButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: { minHeight: 44, alignSelf: 'center', justifyContent: 'center' },
  noteWrap: { gap: Spacing.two },
  noteInput: {
    fontFamily: Fonts.sans,
    minHeight: 132,
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.three,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  errorWrap: { borderRadius: Radii.md, padding: Spacing.three },
});
