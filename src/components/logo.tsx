import { StyleSheet, Text, View } from 'react-native';

import { Brand, Fonts } from '@/constants/theme';

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
          backgroundColor: Brand.gradientStart,
        },
      ]}>
      <Text style={[styles.mark, { fontSize: heartFontSize, lineHeight: heartFontSize * 1.05 }]}>M</Text>
    </View>
  );

  if (!animated) return seal;
  return seal;
}

const styles = StyleSheet.create({
  seal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    letterSpacing: -1,
  },
});
