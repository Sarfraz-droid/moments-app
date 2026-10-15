import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Props = {
  uri: string | null;
  onClose: () => void;
};

const DISMISS_THRESHOLD = 100;
const DISMISS_VELOCITY = 900;

export function Lightbox({ uri, onClose }: Props) {
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(0);
  const entranceOpacity = useSharedValue(0);

  useEffect(() => {
    if (!uri) return;
    translateY.value = 0;
    entranceOpacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
  }, [entranceOpacity, reducedMotion, translateY, uri]);

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const closeWithFade = useCallback(() => {
    if (reducedMotion) {
      onClose();
      return;
    }
    entranceOpacity.value = withTiming(0, { duration: 140, easing: Easing.in(Easing.quad) }, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  }, [entranceOpacity, finishClose, onClose, reducedMotion]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationY) > DISMISS_THRESHOLD || Math.abs(event.velocityY) > DISMISS_VELOCITY) {
        if (reducedMotion) {
          runOnJS(finishClose)();
          return;
        }
        const direction = event.translationY < 0 ? -1 : 1;
        translateY.value = withTiming(direction * height, {
          duration: 180,
          easing: Easing.in(Easing.quad),
        }, (finished) => {
          if (finished) runOnJS(finishClose)();
        });
      } else {
        translateY.value = reducedMotion ? 0 : withSpring(0, { damping: 22, stiffness: 260 });
      }
    });

  const overlayStyle = useAnimatedStyle(() => ({
    opacity:
      entranceOpacity.value *
      interpolate(Math.abs(translateY.value), [0, height * 0.7], [1, 0.35], Extrapolation.CLAMP),
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reducedMotion ? 0 : translateY.value },
      {
        scale: reducedMotion
          ? 1
          : interpolate(Math.abs(translateY.value), [0, height], [1, 0.94], Extrapolation.CLAMP),
      },
    ],
  }));

  if (!uri) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, overlayStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close expanded photo"
        onPress={closeWithFade}
        style={[styles.backdrop, { height }]}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.imageWrap, imageStyle]}>
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="contain"
              transition={reducedMotion ? 0 : 120}
              cachePolicy="memory-disk"
              priority="high"
            />
          </Animated.View>
        </GestureDetector>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
});
