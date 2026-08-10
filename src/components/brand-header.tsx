import { Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function BrandHeader({
  subtitle,
  trailing,
  onTrailingPress,
}: {
  subtitle?: string;
  trailing?: string;
  onTrailingPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.titleBlock}>
        <Logo size={36} />
        <View style={styles.textColumn}>
          <ThemedText type="display" style={styles.title}>
            Moments
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
      {trailing ? (
        <Pressable
          onPress={onTrailingPress}
          hitSlop={12}
          style={[styles.accountPill, { borderColor: theme.divider }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {trailing}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 1,
  },
  textColumn: {
    gap: 1,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  accountPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: 1,
  },
});
