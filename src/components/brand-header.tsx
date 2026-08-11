import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function BrandHeader({
  title = 'Moments',
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.titleBlock}>
        <View style={styles.textColumn}>
          <ThemedText type="display" style={styles.title}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  titleBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    alignItems: 'center',
    gap: 1,
  },
  title: {
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
