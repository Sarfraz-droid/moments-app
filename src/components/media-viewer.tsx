import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MotiView } from 'moti';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Media = { uri: string; kind: 'photo' | 'video' };

type Props = {
  media: Media | null;
  onClose: () => void;
};

function VideoPlayback({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return <VideoView style={StyleSheet.absoluteFill} player={player} nativeControls contentFit="contain" />;
}

// Full-screen tap-to-dismiss viewer for a single attached photo or video —
// used by the compose screen so a captured/picked video can actually be
// previewed (native controls, looping) rather than shown only as a thumbnail.
export function MediaViewer({ media, onClose }: Props) {
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();

  if (!media) return null;

  return (
    <MotiView
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      from={{ opacity: reducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: reducedMotion ? 0 : 180 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close preview"
        onPress={media.kind === 'photo' ? onClose : undefined}
        style={[styles.backdrop, { height }]}>
        {media.kind === 'video' ? (
          <VideoPlayback uri={media.uri} />
        ) : (
          <Image
            source={{ uri: media.uri }}
            style={styles.image}
            contentFit="contain"
            transition={reducedMotion ? 0 : 120}
            cachePolicy="memory-disk"
            priority="high"
          />
        )}
        {media.kind === 'video' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Close preview" onPress={onClose} style={styles.closeButton}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor="#FFFFFF" />
          </Pressable>
        ) : null}
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
