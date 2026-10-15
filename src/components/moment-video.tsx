import { useEvent } from 'expo';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MotiView } from 'moti';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Props = {
  uri: string;
  isVisible: boolean;
  style: StyleProp<ViewStyle>;
};

export type MomentVideoHandle = {
  togglePlay: () => void;
};

// Autoplays (muted, looping) whenever the moment is visible/focused in the
// feed, same as MusicBadge's focus-driven playback — but a tap (routed in
// from the parent's gesture composition in (tabs)/index.tsx, since this sits
// inside that GestureDetector and can't safely nest its own) can pause it,
// which resets the next time the card leaves and re-enters view. Shows a
// loading spinner while buffering and a play glyph whenever paused, so
// there's always a visible affordance instead of a silently frozen frame.
export const MomentVideo = forwardRef<MomentVideoHandle, Props>(function MomentVideo(
  { uri, isVisible, style },
  ref
) {
  const reducedMotion = useReducedMotion();
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [manuallyPaused, setManuallyPaused] = useState(false);

  useEffect(() => {
    if (isVisible) return;
    const timer = setTimeout(() => setManuallyPaused(false), 0);
    return () => clearTimeout(timer);
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && !manuallyPaused) player.play();
    else player.pause();
  }, [isVisible, manuallyPaused, player]);

  useImperativeHandle(ref, () => ({
    togglePlay: () => setManuallyPaused((prev) => !prev),
  }), []);

  return (
    <View style={style}>
      <VideoView style={StyleSheet.absoluteFill} player={player} nativeControls={false} contentFit="cover" />
      {status === 'loading' ? (
        <MotiView
          pointerEvents="none"
          from={{ opacity: reducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: reducedMotion ? 0 : 150 }}
          style={styles.overlay}>
          <ActivityIndicator color="#FFFFFF" />
        </MotiView>
      ) : !isPlaying ? (
        <MotiView
          pointerEvents="none"
          from={{ opacity: reducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: reducedMotion ? 0 : 150 }}
          style={styles.overlay}>
          <View style={styles.playBadge}>
            <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={28} tintColor="#FFFFFF" />
          </View>
        </MotiView>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
