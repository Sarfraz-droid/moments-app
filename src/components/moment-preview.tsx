import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CapturedMediaKind } from '@/components/in-app-camera';
import { MomentVideo } from '@/components/moment-video';
import { MusicBadge } from '@/components/music-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { YoutubeTrack } from '@/lib/youtube';

type Media = { uri: string; kind: CapturedMediaKind } | null;

type Props = {
  media: Media;
  caption: string;
  track: YoutubeTrack | null;
  videoThumbnail: string | null;
  onClose: () => void;
};

type Tab = 'feed' | 'widget';

// A non-interactive mock-up of how the in-progress moment will actually
// render — once in the feed (matching MomentCard in (tabs)/index.tsx) and
// once on the Android home-screen widget (matching src/widgets/moment-widget.tsx).
// The widget can't animate anything (RemoteViews has no video/gif primitive),
// so video moments there show the same still thumbnail frame the real widget
// sync generates (src/lib/storage.ts's getMomentVideoThumbnailForWidget) —
// this preview must stay truthful to what the real widget will show.
export function MomentPreview({ media, caption, track, videoThumbnail, onClose }: Props) {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('feed');
  const hasPhoto = media?.kind === 'photo';
  const isVideo = media?.kind === 'video';

  return (
    <View style={StyleSheet.absoluteFill}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={[styles.headerWrap, { borderBottomColor: theme.divider }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close preview"
              onPress={onClose}
              style={styles.headerSideButton}>
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={theme.textSecondary} />
            </Pressable>
            <View style={[styles.tabRow, { backgroundColor: theme.backgroundElement }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setTab('feed')}
                style={[styles.tabButton, tab === 'feed' && { backgroundColor: theme.background }]}>
                <ThemedText type="smallBold" themeColor={tab === 'feed' ? 'text' : 'textSecondary'}>Feed</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setTab('widget')}
                style={[styles.tabButton, tab === 'widget' && { backgroundColor: theme.background }]}>
                <ThemedText type="smallBold" themeColor={tab === 'widget' ? 'text' : 'textSecondary'}>Widget</ThemedText>
              </Pressable>
            </View>
            <View style={styles.headerSideButton} />
          </View>

          <View style={styles.body}>
            {tab === 'feed' ? (
              <View style={styles.feedCard}>
                <View style={styles.feedHeader}>
                  <View style={[styles.avatar, { backgroundColor: theme.brandSoft }]}>
                    <ThemedText style={[styles.avatarText, { color: theme.brand }]}>Y</ThemedText>
                  </View>
                  <View>
                    <ThemedText type="smallBold">You</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Now</ThemedText>
                  </View>
                </View>

                <View style={styles.feedMediaWrap}>
                  {isVideo && media ? (
                    <MomentVideo uri={media.uri} isVisible style={styles.feedMedia} />
                  ) : hasPhoto && media ? (
                    <Image source={{ uri: media.uri }} style={styles.feedMedia} contentFit="cover" priority="high" />
                  ) : (
                    <View style={[styles.feedMedia, styles.feedNote, { backgroundColor: theme.note, borderColor: theme.divider }]}>
                      <ThemedText style={[styles.feedNoteText, { color: theme.noteInk }]}>
                        {caption.trim() || 'Your message'}
                      </ThemedText>
                    </View>
                  )}
                  {track ? (
                    <MusicBadge
                      videoId={track.videoId}
                      title={track.title}
                      thumbnailUrl={track.thumbnailUrl}
                      startSeconds={track.startSeconds ?? 0}
                      isVisible
                    />
                  ) : null}
                </View>

                {(hasPhoto || isVideo) && caption.trim() ? (
                  <ThemedText style={styles.feedCaption}>{caption.trim()}</ThemedText>
                ) : null}
              </View>
            ) : (
              <View style={styles.widgetOuter}>
                <View style={[styles.widgetCard, { backgroundColor: '#FFFFFF' }]}>
                  <View style={styles.widgetMediaWrap}>
                    {isVideo ? (
                      videoThumbnail ? (
                        <View style={styles.widgetMediaFill}>
                          <Image source={{ uri: videoThumbnail }} style={styles.widgetMedia} contentFit="cover" />
                          <View pointerEvents="none" style={styles.widgetPlayOverlay}>
                            <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={20} tintColor="#FFFFFF" />
                          </View>
                        </View>
                      ) : (
                        <View style={[styles.widgetMedia, styles.widgetVideoNotice]}>
                          <ActivityIndicator color="#6F6F6B" size="small" />
                        </View>
                      )
                    ) : hasPhoto && media ? (
                      <Image source={{ uri: media.uri }} style={styles.widgetMedia} contentFit="cover" priority="high" />
                    ) : (
                      <View style={[styles.widgetMedia, styles.widgetNote]}>
                        <ThemedText style={styles.widgetNoteText} numberOfLines={4}>
                          {caption.trim() || 'Your message'}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <View style={styles.widgetFooter}>
                    {hasPhoto && caption.trim() ? (
                      <ThemedText numberOfLines={2} style={styles.widgetCaption}>{caption.trim()}</ThemedText>
                    ) : null}
                    <View style={styles.widgetFooterRow}>
                      <View style={styles.widgetTrackSlot}>
                        {isVideo ? (
                          <View style={styles.widgetTrackBadge}>
                            <ThemedText style={styles.widgetTrackEmoji}>▶</ThemedText>
                            <ThemedText numberOfLines={1} style={styles.widgetTrackText}>Video</ThemedText>
                          </View>
                        ) : null}
                        {track ? (
                          <View style={styles.widgetTrackBadge}>
                            <ThemedText style={styles.widgetTrackEmoji}>🎵</ThemedText>
                            <ThemedText numberOfLines={1} style={styles.widgetTrackText}>{track.title}</ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.widgetBadgeRow}>
                        <View style={[styles.widgetIconButton, { backgroundColor: '#F5F5F3' }]}>
                          <ThemedText style={styles.widgetHeart}>❤️</ThemedText>
                        </View>
                        <View style={[styles.widgetIconButton, { backgroundColor: theme.brand }]}>
                          <ThemedText style={styles.widgetPlus}>+</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.widgetHint}>
                  This is roughly how it&apos;ll look on your partner&apos;s home screen.
                </ThemedText>
              </View>
            )}
          </View>
        </SafeAreaView>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  headerWrap: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flex: 1, flexDirection: 'row', borderRadius: Radii.pill, padding: 3, marginHorizontal: Spacing.two },
  tabButton: { flex: 1, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.pill },
  body: { flex: 1, padding: Spacing.four, alignItems: 'center', justifyContent: 'center' },

  feedCard: { width: '100%', maxWidth: 360 },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  feedMediaWrap: { position: 'relative' },
  feedMedia: { width: '100%', aspectRatio: 1, borderRadius: Radii.md, overflow: 'hidden' },
  feedNote: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, padding: Spacing.four },
  feedNoteText: { fontSize: 20, lineHeight: 28, fontWeight: '500', textAlign: 'center' },
  feedCaption: { marginTop: Spacing.two },

  widgetOuter: { alignItems: 'center', gap: Spacing.three },
  widgetCard: {
    width: 180,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  widgetMediaWrap: { flex: 1, width: '100%' },
  widgetMedia: { width: '100%', height: '100%' },
  widgetMediaFill: { width: '100%', height: '100%' },
  widgetPlayOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  widgetVideoNotice: { backgroundColor: '#F5F5F3', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 },
  widgetNote: { backgroundColor: '#F7F7F5', alignItems: 'center', justifyContent: 'center', padding: 12 },
  widgetNoteText: { fontSize: 13, color: '#222220', fontWeight: '500', textAlign: 'center' },
  widgetFooter: { paddingHorizontal: 10, paddingVertical: 4 },
  widgetCaption: { fontSize: 11, color: '#222220', fontWeight: '500', marginBottom: 3 },
  widgetFooterRow: { flexDirection: 'row', alignItems: 'center' },
  widgetTrackSlot: { flex: 1, flexDirection: 'row' },
  widgetTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 80,
    overflow: 'hidden',
    backgroundColor: '#F5F5F3',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  widgetTrackEmoji: { fontSize: 10 },
  widgetTrackText: { fontSize: 10, color: '#6F6F6B', fontWeight: '600', flexShrink: 1 },
  widgetBadgeRow: { flexDirection: 'row', gap: 5 },
  widgetIconButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  widgetHeart: { fontSize: 13 },
  widgetPlus: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  widgetHint: { textAlign: 'center', maxWidth: 260 },
});
