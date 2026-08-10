import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

// A Pressable that springs down slightly on press for tactile feedback,
// instead of the flat opacity toggle used elsewhere in RN by default.
export function AnimatedPressable({ style, onPressIn, onPressOut, children, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);

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
        animate={{ scale: pressed ? 0.96 : 1 }}
        transition={{ type: 'timing', duration: 100 }}
        style={style}>
        {children}
      </MotiView>
    </Pressable>
  );
}
