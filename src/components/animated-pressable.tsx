import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// A Pressable that springs down slightly on press for tactile feedback,
// instead of the flat opacity toggle used elsewhere in RN by default.
export function AnimatedPressable({ style, onPressIn, onPressOut, children, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...rest}>
      <MotiView
        animate={{ scale: reducedMotion ? 1 : pressed ? 0.98 : 1, opacity: pressed ? 0.86 : 1 }}
        transition={{ type: 'timing', duration: reducedMotion ? 0 : 90 }}
        style={style}>
        {children}
      </MotiView>
    </Pressable>
  );
}
