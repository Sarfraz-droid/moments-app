import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { BrandHeader } from '@/components/brand-header';
import { SegmentPicker } from '@/components/segment-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { YoutubeAudioPlayer } from '@/components/youtube-audio-player';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resolveMusicSelect } from '@/lib/music-bridge';
import { fetchVideoDurationSeconds, searchYoutubeMusic, YoutubeSearchError, type YoutubeTrack } from '@/lib/youtube';

const DEBOUNCE_MS = 400;
const SEGMENT_SECONDS = 20;

export default function MusicSearchSheet() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YoutubeTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedTrack, setSelectedTrack] = useState<YoutubeTrack | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      debounceRef.current = setTimeout(() => {
        setResults([]);
        setError(null);
        setLoading(false);
      }, 0);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const tracks = await searchYoutubeMusic(trimmed);
        setResults(tracks);
        setError(null);
      } catch (err) {
        setResults([]);
        setError(err instanceof YoutubeSearchError ? err.message : 'Something went wrong. Try again.');
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function openTrack(track: YoutubeTrack) {
    setSelectedTrack(track);
    setDuration(null);
    setDurationError(null);
    setStartSeconds(0);
    setPreviewing(false);
    setPreviewError(null);
    fetchVideoDurationSeconds(track.videoId)
      .then(setDuration)
      .catch((err) => setDurationError(err instanceof YoutubeSearchError ? err.message : 'Could not load this track.'));
  }

  function backToResults() {
    setPreviewing(false);
    setSelectedTrack(null);
  }

  function attachTrack() {
    if (!selectedTrack) return;
    resolveMusicSelect({ ...selectedTrack, startSeconds });
    router.back();
  }

  if (selectedTrack) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={[styles.headerWrap, { borderBottomColor: theme.divider }]}>
            <AnimatedPressable
              accessibilityLabel="Back to search results"
              accessibilityRole="button"
              onPress={backToResults}
              style={styles.headerSideButton}>
              <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.textSecondary} />
            </AnimatedPressable>
            <View style={styles.headerTitle}>
              <BrandHeader title="Choose a clip" />
            </View>
            <View style={styles.headerSideButton} />
          </View>

          <View style={styles.selectWrap}>
            <View style={styles.trackHeader}>
              {selectedTrack.thumbnailUrl ? (
                <Image source={{ uri: selectedTrack.thumbnailUrl }} style={styles.trackHeaderThumbnail} contentFit="cover" />
              ) : null}
              <View style={styles.trackHeaderBody}>
                <ThemedText type="smallBold" numberOfLines={2}>{selectedTrack.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>{selectedTrack.channelTitle}</ThemedText>
              </View>
            </View>

            {durationError ? (
              <ThemedText type="small" themeColor="textSecondary">{durationError}</ThemedText>
            ) : duration === null ? (
              <View style={styles.durationLoading}>
                <ActivityIndicator color={theme.brand} size="small" />
                <ThemedText type="small" themeColor="textSecondary">Loading track…</ThemedText>
              </View>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  Drag to pick which {SEGMENT_SECONDS}s plays with your moment.
                </ThemedText>
                <SegmentPicker
                  key={selectedTrack.videoId}
                  durationSeconds={duration}
                  segmentSeconds={SEGMENT_SECONDS}
                  startSeconds={startSeconds}
                  onChange={setStartSeconds}
                />
              </>
            )}

            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={previewing ? 'Pause preview' : 'Preview this clip'}
              disabled={duration === null}
              onPress={() => {
                setPreviewError(null);
                setPreviewing((prev) => !prev);
              }}
              style={[styles.previewButton, { backgroundColor: theme.backgroundElement, opacity: duration === null ? 0.5 : 1 }]}>
              <SymbolView
                name={{ ios: previewing ? 'pause.fill' : 'play.fill', android: previewing ? 'pause' : 'play_arrow', web: previewing ? 'pause' : 'play_arrow' }}
                size={16}
                tintColor={theme.text}
              />
              <ThemedText type="smallBold">{previewing ? 'Pause preview' : 'Preview'}</ThemedText>
            </AnimatedPressable>

            {previewError ? (
              <ThemedText type="small" style={{ color: theme.brand }}>{previewError}</ThemedText>
            ) : null}

            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={`Attach ${selectedTrack.title}`}
              onPress={attachTrack}
              style={[styles.attachButton, { backgroundColor: theme.brand }]}>
              <ThemedText type="smallBold" style={styles.attachButtonText}>Attach this clip</ThemedText>
            </AnimatedPressable>
          </View>

          <YoutubeAudioPlayer
            videoId={selectedTrack.videoId}
            startSeconds={startSeconds}
            playing={previewing}
            onError={(message) => {
              setPreviewError(message);
              setPreviewing(false);
            }}
          />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={[styles.headerWrap, { borderBottomColor: theme.divider }]}>
          <AnimatedPressable
            accessibilityLabel="Close music search"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.headerSideButton}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={theme.textSecondary} />
          </AnimatedPressable>
          <View style={styles.headerTitle}>
            <BrandHeader title="Add music" />
          </View>
          <View style={styles.headerSideButton} />
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            accessibilityLabel="Search for a song"
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a song…"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            style={[styles.searchInput, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.divider }]}
          />
        </View>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator color={theme.brand} />
          </View>
        ) : error ? (
          <View style={styles.centerWrap}>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>{error}</ThemedText>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.videoId}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.trim() ? (
                <View style={styles.centerWrap}>
                  <ThemedText themeColor="textSecondary">No results.</ThemedText>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Choose a clip from ${item.title} by ${item.channelTitle}`}
                onPress={() => openTrack(item)}
                style={styles.resultRow}>
                {item.thumbnailUrl ? (
                  <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
                ) : (
                  <View style={[styles.thumbnail, { backgroundColor: theme.backgroundElement }]} />
                )}
                <View style={styles.resultBody}>
                  <ThemedText type="smallBold" numberOfLines={1}>{item.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>{item.channelTitle}</ThemedText>
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  headerWrap: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { flex: 1 },
  headerSideButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  searchInput: {
    minHeight: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.five },
  centerText: { textAlign: 'center' },
  listContent: { padding: Spacing.three, gap: Spacing.two },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 56 },
  thumbnail: { width: 56, height: 56, borderRadius: Radii.sm },
  resultBody: { flex: 1, gap: 2 },
  selectWrap: { padding: Spacing.three, gap: Spacing.four },
  trackHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  trackHeaderThumbnail: { width: 56, height: 56, borderRadius: Radii.sm },
  trackHeaderBody: { flex: 1, gap: 2 },
  durationLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 48,
    borderRadius: Radii.md,
  },
  attachButton: {
    minHeight: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButtonText: { color: '#FFFFFF' },
});
