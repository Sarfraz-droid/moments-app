import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  replyingToName: string | null;
  onCancelReply: () => void;
  onSubmit: (body: string) => void;
};

export function CommentComposer({ replyingToName, onCancelReply, onSubmit }: Props) {
  const theme = useTheme();
  const [text, setText] = useState('');

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  }

  return (
    <View style={[styles.container, { borderTopColor: theme.divider, backgroundColor: theme.background }]}>
      {replyingToName ? (
        <View style={[styles.replyChip, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Replying to {replyingToName}
          </ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel reply" hitSlop={8} onPress={onCancelReply}>
            <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={14} tintColor={theme.textSecondary} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Write a comment"
          value={text}
          onChangeText={setText}
          placeholder={replyingToName ? 'Write a reply…' : 'Write a comment…'}
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.divider },
          ]}
        />
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Send comment"
          disabled={!text.trim()}
          onPress={submit}
          style={[
            styles.sendButton,
            { backgroundColor: text.trim() ? theme.brand : theme.backgroundElement },
          ]}>
          <SymbolView
            name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
            size={18}
            tintColor={text.trim() ? '#FFFFFF' : theme.textSecondary}
          />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Platform.OS === 'ios' ? Spacing.two : Spacing.three,
    gap: Spacing.two,
  },
  replyChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  input: {
    flex: 1,
    fontFamily: Fonts.sans,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
