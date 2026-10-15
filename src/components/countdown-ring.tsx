import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';
import { useEffect } from 'react';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  active: boolean;
  durationMs: number;
  size: number;
  strokeWidth?: number;
  color?: string;
};

// A ring that drains over `durationMs` while `active`, wrapping the shutter
// button so a hold-to-record gesture shows how much of the max clip length
// is left — synced to the same cap that recordAsync's maxDuration enforces.
export function CountdownRing({ active, durationMs, size, strokeWidth = 4, color = '#FFFFFF' }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(1);

  useEffect(() => {
    if (active) {
      progress.value = 1;
      progress.value = withTiming(0, { duration: durationMs, easing: Easing.linear });
    } else {
      progress.value = withTiming(1, { duration: 150 });
    }
  }, [active, durationMs, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        animatedProps={animatedProps}
        strokeLinecap="round"
        fill="none"
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}
