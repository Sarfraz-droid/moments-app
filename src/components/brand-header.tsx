import { StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.row}>
      <Logo size={36} />
      <View style={styles.textColumn}>
        <ThemedText type="smallBold" style={styles.title}>
          Moments
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  textColumn: {
    gap: 1,
  },
  title: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
