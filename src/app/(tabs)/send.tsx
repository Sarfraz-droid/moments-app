import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
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
import { MediaViewer } from '@/components/media-viewer';
import { MomentPreview } from '@/components/moment-preview';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { setMusicSelectHandler } from '@/lib/music-bridge';
import { takePendingMedia, type PendingMedia } from '@/lib/pending-media';
import { supabase } from '@/lib/supabase';
import { uploadMomentMedia } from '@/lib/storage';
import { syncLatestMomentToWidget } from '@/lib/widget-cache';
import type { YoutubeTrack } from '@/lib/youtube';

export default function SendScreen() {
  const { session, pair, partnerProfile } = useAuth();
  const theme = useTheme();
  // Read once at mount: the camera screen (opened via the tab bar's "+" or
  // the widget deep link) sets this synchronously right before navigating
  // here, so it's guaranteed to be populated by the time this mounts.
  const [media, setMedia] = useState<PendingMedia | null>(() => takePendingMedia());
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [momentPreviewOpen, setMomentPreviewOpen] = useState(false);
  const [track, setTrack] = useState<YoutubeTrack | null>(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  // Some RN/platform combinations never fire xhr.upload.onprogress at all —
  // this stays false until a real event lands, so the UI can fall back to an
  // indeterminate animation instead of sitting frozen at a static 0% bar.
  const [hasRealProgress, setHasRealProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const clearTimer = setTimeout(() => {
      if (!cancelled) {
        setVideoThumbnail(null);
        setThumbnailFailed(false);
      }
    }, 0);
    if (!media || media.kind !== 'video') {
      return () => {
        cancelled = true;
        clearTimeout(clearTimer);
      };
    }
    // time: 0 fails on some devices for a just-recorded video (first frame
    // isn't yet a readable keyframe) — 100ms in reliably lands past that.
    VideoThumbnails.getThumbnailAsync(media.uri, { time: 100 })
      .then(({ uri }) => !cancelled && setVideoThumbnail(uri))
      .catch((err) => {
        if (cancelled) return;
        console.warn('[send] video thumbnail generation failed', err);
        setThumbnailFailed(true);
      });
    return () => {
      cancelled = true;
      clearTimeout(clearTimer);
    };
  }, [media]);

  function openMusicSearch() {
    setMusicSelectHandler(setTrack);
    router.push('/music-search-sheet');
  }

  function handleUploadProgress(fraction: number) {
    if (fraction > 0.02) setHasRealProgress(true);
    setUploadProgress(fraction);
  }

  async function sendMoment() {
    const trimmedNote = note.trim();
    if (!session || !pair || (!media && !trimmedNote)) return;
    setSending(true);
    setError(null);
    setUploadProgress(media ? 0 : null);
    setHasRealProgress(false);
    const trackColumns = {
      youtube_video_id: track?.videoId ?? null,
      track_title: track?.title ?? null,
      track_artist_channel: track?.channelTitle ?? null,
      track_thumbnail_url: track?.thumbnailUrl ?? null,
      track_start_seconds: track?.startSeconds ?? null,
    };
    try {
      if (media) {
        const momentId = Crypto.randomUUID();
        const storagePath = await uploadMomentMedia(pair.id, momentId, media.uri, media.kind, handleUploadProgress);
        const { error: insertError } = await supabase.from('moments').insert({
          id: momentId,
          pair_id: pair.id,
          sender_id: session.user.id,
          type: media.kind,
          storage_path: storagePath,
          text: trimmedNote || null,
          ...trackColumns,
        });
        if (insertError) throw insertError;
      } else {
        const { error: insertError } = await supabase.from('moments').insert({
          pair_id: pair.id,
          sender_id: session.user.id,
          type: 'note',
          text: trimmedNote,
          ...trackColumns,
        });
        if (insertError) throw insertError;
      }
      setMedia(null);
      setNote('');
      setTrack(null);
      syncLatestMomentToWidget(pair.id).catch(() => {});
      router.replace('/');
    } catch {
      setError('Your moment could not be sent. Check your connection and try again.');
    } finally {
      setSending(false);
      setUploadProgress(null);
    }
  }

  const canSend = Boolean(media || note.trim());
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
              accessibilityLabel="Preview how this moment will look"
              accessibilityRole="button"
              disabled={!canSend}
              onPress={() => setMomentPreviewOpen(true)}
              style={[styles.headerSideButton, { opacity: canSend ? 1 : 0.4 }]}>
              <SymbolView name={{ ios: 'eye', android: 'visibility', web: 'visibility' }} size={20} tintColor={theme.textSecondary} />
            </AnimatedPressable>
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

          {uploadProgress !== null ? (
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
              {hasRealProgress ? (
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.brand, width: `${Math.round(uploadProgress * 100)}%` },
                  ]}
                />
              ) : (
                <MotiView
                  from={{ translateX: -90 }}
                  animate={{ translateX: 400 }}
                  transition={{ type: 'timing', duration: 900, loop: true }}
                  style={[styles.progressIndeterminate, { backgroundColor: theme.brand }]}
                />
              )}
            </View>
          ) : null}

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.composeRow}>
              {media ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Preview attached ${media.kind}`}
                  onPress={() => setPreviewOpen(true)}
                  style={[styles.thumbnailWrap, { backgroundColor: theme.backgroundElement }]}>
                  {media.kind === 'video' ? (
                    videoThumbnail ? (
                      <Image source={{ uri: videoThumbnail }} style={styles.thumbnail} contentFit="cover" priority="high" />
                    ) : (
                      <View style={[styles.thumbnail, styles.videoFallback]}>
                        {!thumbnailFailed ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
                      </View>
                    )
                  ) : (
                    <Image source={{ uri: media.uri }} style={styles.thumbnail} contentFit="cover" priority="high" />
                  )}
                  {media.kind === 'video' ? (
                    <View style={styles.playBadge}>
                      <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={16} tintColor="#FFFFFF" />
                    </View>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove attachment"
                    hitSlop={8}
                    onPress={() => setMedia(null)}
                    style={[styles.removeButton, { backgroundColor: theme.background }]}>
                    <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={12} tintColor={theme.text} />
                  </Pressable>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add a photo or video"
                  onPress={() => router.push('/camera')}
                  style={[styles.thumbnailWrap, styles.addMediaButton, { backgroundColor: theme.backgroundElement, borderColor: theme.divider }]}>
                  <SymbolView name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }} size={22} tintColor={theme.textSecondary} />
                </Pressable>
              )}

              <TextInput
                accessibilityLabel={media ? 'Caption' : 'Message'}
                value={note}
                onChangeText={setNote}
                placeholder={media ? 'Add a caption…' : `Write something for ${partnerName}…`}
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

            <View style={styles.musicWrap}>
              <ThemedText type="smallBold">Music</ThemedText>
              {track ? (
                <View style={[styles.trackChip, { backgroundColor: theme.backgroundElement }]}>
                  {track.thumbnailUrl ? (
                    <Image source={{ uri: track.thumbnailUrl }} style={styles.trackThumbnail} contentFit="cover" />
                  ) : null}
                  <View style={styles.trackInfo}>
                    <ThemedText type="smallBold" numberOfLines={1}>{track.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>{track.channelTitle}</ThemedText>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Remove music" hitSlop={8} onPress={() => setTrack(null)}>
                    <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={16} tintColor={theme.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <AnimatedPressable onPress={openMusicSearch} style={[styles.sourceAction, { backgroundColor: theme.backgroundElement }]}>
                  <SymbolView name={{ ios: 'music.note', android: 'music_note', web: 'music_note' }} size={20} tintColor={theme.text} />
                  <View style={styles.sourceCopy}>
                    <ThemedText type="smallBold">Add music</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Attach a song, plays quietly in the background</ThemedText>
                  </View>
                </AnimatedPressable>
              )}
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
      {previewOpen ? <MediaViewer media={media} onClose={() => setPreviewOpen(false)} /> : null}
      {momentPreviewOpen ? (
        <MomentPreview
          media={media}
          caption={note}
          track={track}
          videoThumbnail={videoThumbnail}
          onClose={() => setMomentPreviewOpen(false)}
        />
      ) : null}
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
  progressTrack: { height: 3, width: '100%', overflow: 'hidden', position: 'relative' },
  progressFill: { height: 3 },
  progressIndeterminate: { position: 'absolute', top: 0, height: 3, width: 90, borderRadius: 2 },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  composeRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  thumbnailWrap: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  thumbnail: { width: '100%', height: '100%' },
  videoFallback: { backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  addMediaButton: { borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  playBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceAction: {
    minHeight: 68,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  sourceCopy: { gap: 1 },
  musicWrap: { gap: Spacing.two },
  trackChip: {
    minHeight: 60,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  trackThumbnail: { width: 40, height: 40, borderRadius: Radii.sm },
  trackInfo: { flex: 1, gap: 1 },
  noteInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    height: 84,
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.three,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  errorWrap: { borderRadius: Radii.md, padding: Spacing.three },
});
