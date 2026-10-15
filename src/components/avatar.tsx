import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function Avatar({ name, mine }: { name: string; mine: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.avatar,
        { backgroundColor: mine ? theme.brandSoft : theme.backgroundSelected },
      ]}>
      <ThemedText style={[styles.avatarText, { color: mine ? theme.brand : theme.text }]}>
        {(name || '?').trim().charAt(0).toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800' },
});
