import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  durationSeconds: number;
  segmentSeconds: number;
  startSeconds: number;
  onChange: (startSeconds: number) => void;
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// A horizontal timeline with a draggable window representing the clip that
// will play with the moment — same hold/drag idiom as the reaction tray's
// Gesture.Pan in (tabs)/index.tsx, translated into a scrub position.
export function SegmentPicker({ durationSeconds, segmentSeconds, startSeconds, onChange }: Props) {
  const theme = useTheme();
  const [barWidth, setBarWidth] = useState(0);
  const translateX = useSharedValue(0);
  const dragStartX = useSharedValue(0);

  const clampedDuration = Math.max(durationSeconds, segmentSeconds);
  const windowWidth = barWidth > 0 ? Math.max((segmentSeconds / clampedDuration) * barWidth, 32) : 0;
  const maxTranslateX = Math.max(barWidth - windowWidth, 0);
  const maxStart = Math.max(clampedDuration - segmentSeconds, 0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  }, []);

  const commitStart = useCallback(
    (x: number) => {
      const ratio = maxTranslateX > 0 ? x / maxTranslateX : 0;
      onChange(Math.round(ratio * maxStart));
    },
    [maxStart, maxTranslateX, onChange]
  );

  // Mutating shared values inside gesture callbacks is the standard reanimated
  // idiom (values only change while the user is actually dragging, never
  // during render) — mirrors the same pattern already used elsewhere for
  // Gesture.Pan handlers in this codebase.
  /* eslint-disable react-hooks/immutability */
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          dragStartX.value = translateX.value;
        })
        .onUpdate((event) => {
          const next = dragStartX.value + event.translationX;
          translateX.value = Math.max(0, Math.min(maxTranslateX, next));
        })
        .onEnd(() => {
          runOnJS(commitStart)(translateX.value);
        }),
    [commitStart, dragStartX, maxTranslateX, translateX]
  );
  /* eslint-enable react-hooks/immutability */

  const animatedStyle = useAnimatedStyle(() => ({
    width: windowWidth,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.wrap}>
      <View
        onLayout={onLayout}
        style={[styles.bar, { backgroundColor: theme.backgroundElement, borderColor: theme.divider }]}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.handle, { backgroundColor: theme.brand }, animatedStyle]} />
        </GestureDetector>
      </View>
      <View style={styles.timeRow}>
        <ThemedText type="small" themeColor="textSecondary">{formatTime(startSeconds)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(Math.min(startSeconds + segmentSeconds, clampedDuration))} of {formatTime(clampedDuration)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one },
  bar: {
    height: 44,
    borderRadius: Radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
  },
  handle: {
    height: 36,
    marginHorizontal: 4,
    borderRadius: Radii.sm - 2,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
