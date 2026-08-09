import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <Text style={{ fontSize: size * 0.52 }}>💛</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage: `linear-gradient(135deg, ${Brand.gradientStart}, ${Brand.gradientEnd})`,
  },
});
