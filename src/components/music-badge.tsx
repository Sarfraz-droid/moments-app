import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { YoutubeAudioPlayer } from '@/components/youtube-audio-player';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  startSeconds: number | null;
  isVisible: boolean;
};

// Audio-only in the UI: playback is driven entirely by mounting/unmounting a
// hidden YoutubeAudioPlayer — the visible surface is just this badge, never a
// video frame. Playback only keeps running while the app is foregrounded
// (WebView media suspends when backgrounded); there is no supported way to
// give a hidden WebView its own background/lock-screen audio session.
export function MusicBadge({ videoId, title, thumbnailUrl, startSeconds, isVisible }: Props) {
  const theme = useTheme();
  // Auto-plays whenever the moment card is focused/visible in the feed —
  // userPaused only overrides that while the card stays visible, and resets
  // once it scrolls away so the next time it's focused it plays again.
  const [userPaused, setUserPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playing = isVisible && !userPaused && !error;

  useEffect(() => {
    if (isVisible) return;
    const timer = setTimeout(() => {
      setUserPaused(false);
      setError(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={error ?? (playing ? `Pause ${title}` : `Play ${title}`)}
        onPress={() => {
          setError(null);
          setUserPaused((prev) => !prev);
        }}
        style={[styles.badge, { backgroundColor: theme.backgroundElement, borderColor: theme.divider }]}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
        ) : null}
        <SymbolView
          name={{ ios: playing ? 'pause.fill' : 'play.fill', android: playing ? 'pause' : 'play_arrow', web: playing ? 'pause' : 'play_arrow' }}
          size={12}
          tintColor={theme.text}
        />
        <ThemedText type="small" numberOfLines={1} style={styles.badgeText}>
          {error ?? title}
        </ThemedText>
      </Pressable>
      <YoutubeAudioPlayer
        videoId={videoId}
        startSeconds={startSeconds ?? 0}
        playing={playing}
        onError={(message) => {
          setError(message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: Spacing.two, right: Spacing.two },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 150,
    minHeight: 32,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  thumbnail: { width: 20, height: 20, borderRadius: Radii.sm },
  badgeText: { flexShrink: 1 },
});
