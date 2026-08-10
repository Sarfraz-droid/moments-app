import { MotiView } from 'moti';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function Logo({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  const badge = (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.52 }}>💛</Text>
    </View>
  );

  if (!animated) return badge;

  return (
    <MotiView
      from={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 12, mass: 0.6 }}>
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: 1.06 }}
        transition={{ type: 'timing', duration: 1400, loop: true, repeatReverse: true }}>
        {badge}
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage: `linear-gradient(135deg, ${Brand.gradientStart}, ${Brand.gradientEnd})`,
  },
});
