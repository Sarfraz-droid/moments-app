import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Avatar } from '@/components/avatar';
import { BrandHeader } from '@/components/brand-header';
import { CommentComposer } from '@/components/comment-composer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useComments } from '@/hooks/use-comments';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { timeAgo } from '@/lib/time';
import type { MomentComment } from '@/lib/types';

export default function CommentsSheet() {
  const { momentId } = useLocalSearchParams<{ momentId: string }>();
  const { session, pair, partnerProfile, profile } = useAuth();
  const theme = useTheme();
  const { comments, addComment } = useComments(pair?.id);
  const [replyingTo, setReplyingTo] = useState<MomentComment | null>(null);

  const partnerName = partnerProfile?.display_name || 'Your person';
  const myName = profile?.display_name || 'You';
  const nameFor = (userId: string) => (userId === session?.user.id ? myName : partnerName);

  const topLevel = useMemo(
    () =>
      comments
        .filter((comment) => comment.moment_id === momentId && comment.parent_comment_id === null)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [comments, momentId]
  );

  function repliesFor(commentId: string) {
    return comments
      .filter((comment) => comment.parent_comment_id === commentId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async function submit(body: string) {
    if (!session || !pair || !momentId) return;
    await addComment(momentId, pair.id, session.user.id, body, replyingTo?.id ?? null);
    setReplyingTo(null);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.keyboardArea}>
          <View style={[styles.headerWrap, { borderBottomColor: theme.divider }]}>
            <AnimatedPressable
              accessibilityLabel="Close comments"
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.headerSideButton}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={20}
                tintColor={theme.textSecondary}
              />
            </AnimatedPressable>
            <View style={styles.headerTitle}>
              <BrandHeader title="Comments" />
            </View>
            <View style={styles.headerSideButton} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {topLevel.length === 0 ? (
              <View style={styles.emptyWrap}>
                <ThemedText themeColor="textSecondary">Be the first to comment.</ThemedText>
              </View>
            ) : null}
            {topLevel.map((comment) => (
              <View key={comment.id} style={styles.commentBlock}>
                <View style={styles.commentRow}>
                  <Avatar name={nameFor(comment.user_id)} mine={comment.user_id === session?.user.id} />
                  <View style={styles.commentBody}>
                    <View style={styles.commentMeta}>
                      <ThemedText type="smallBold">{nameFor(comment.user_id)}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{timeAgo(comment.created_at)}</ThemedText>
                    </View>
                    <ThemedText>{comment.body}</ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => setReplyingTo(comment)}
                      style={styles.replyAction}>
                      <ThemedText type="small" style={{ color: theme.brand }}>Reply</ThemedText>
                    </Pressable>
                  </View>
                </View>
                {repliesFor(comment.id).map((reply) => (
                  <View key={reply.id} style={styles.replyRow}>
                    <Avatar name={nameFor(reply.user_id)} mine={reply.user_id === session?.user.id} />
                    <View style={styles.commentBody}>
                      <View style={styles.commentMeta}>
                        <ThemedText type="smallBold">{nameFor(reply.user_id)}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">{timeAgo(reply.created_at)}</ThemedText>
                      </View>
                      <ThemedText>{reply.body}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <CommentComposer
            replyingToName={replyingTo ? nameFor(replyingTo.user_id) : null}
            onCancelReply={() => setReplyingTo(null)}
            onSubmit={submit}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardArea: { flex: 1 },
  headerWrap: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { flex: 1 },
  headerSideButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.four },
  emptyWrap: { paddingVertical: Spacing.six, alignItems: 'center' },
  commentBlock: { gap: Spacing.two },
  commentRow: { flexDirection: 'row', gap: Spacing.two },
  replyRow: { flexDirection: 'row', gap: Spacing.two, marginLeft: Spacing.five },
  commentBody: { flex: 1, gap: 2 },
  commentMeta: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  replyAction: { minHeight: 28, justifyContent: 'center', alignSelf: 'flex-start' },
});
