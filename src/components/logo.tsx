import { MotiView } from 'moti';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function Logo({ size = 40, animated = false }: { size?: number; animated?: boolean }) {
  const heartFontSize = size * 0.5;

  const seal = (
    <View
      style={[
        styles.seal,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          // Web gets the real gradient; native gets a single warm tone
          // standing in for it so the mark still reads as a wax seal.
          backgroundColor: Brand.gradientStart,
          shadowColor: Brand.gradientStart,
        },
      ]}>
      <View style={[styles.inner, { borderRadius: size / 2, borderColor: '#ffffff40' }]} />
      <Text style={{ fontSize: heartFontSize, lineHeight: heartFontSize * 1.05 }}>💛</Text>
    </View>
  );

  if (!animated) return seal;

  return (
    <MotiView
      from={{ scale: 0.6, opacity: 0, rotate: '-8deg' }}
      animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
      transition={{ type: 'spring', damping: 12, mass: 0.6 }}>
      <MotiView
        from={{ scale: 1 }}
        animate={{ scale: 1.06 }}
        transition={{ type: 'timing', duration: 1400, loop: true, repeatReverse: true }}>
        {seal}
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  seal: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    experimental_backgroundImage: `linear-gradient(135deg, ${Brand.gradientStart}, ${Brand.gradientEnd})`,
  },
  inner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 1.5,
  },
});
