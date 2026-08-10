import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand-header';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useMoments } from '@/hooks/use-moments';
import { useReactions } from '@/hooks/use-reactions';
import { useAuth } from '@/lib/auth-context';
import { REACTION_EMOJIS } from '@/lib/reactions';
import { getMomentPhotoUrl } from '@/lib/storage';
import type { Moment, MomentReaction } from '@/lib/types';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ReactionBar({
  reactions,
  userId,
  onToggle,
}: {
  reactions: MomentReaction[];
  userId: string | undefined;
  onToggle: (emoji: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.reactionRow}>
      {REACTION_EMOJIS.map((emoji) => {
        const forEmoji = reactions.filter((r) => r.emoji === emoji);
        const mine = forEmoji.some((r) => r.user_id === userId);
        return (
          <Pressable key={emoji} onPress={() => onToggle(emoji)}>
            <MotiView
              key={`${mine}-${forEmoji.length}`}
              from={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              style={[
                styles.reactionPill,
                { backgroundColor: mine ? theme.backgroundSelected : 'transparent' },
              ]}>
              <ThemedText type="small">
                {emoji}
                {forEmoji.length > 0 ? ` ${forEmoji.length}` : ''}
              </ThemedText>
            </MotiView>
          </Pressable>
        );
      })}
    </View>
  );
}

function MomentCard({
  moment,
  isMe,
  userId,
  reactions,
  onToggleReaction,
}: {
  moment: Moment;
  isMe: boolean;
  userId: string | undefined;
  reactions: MomentReaction[];
  onToggleReaction: (momentId: string, emoji: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (moment.storage_path) {
      getMomentPhotoUrl(moment.storage_path)
        .then(setUrl)
        .catch(() => setUrl(null));
    }
  }, [moment]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350 }}>
      <ThemedView type="backgroundElement" style={styles.card}>
        {moment.storage_path ? (
        url ? (
          <Image source={{ uri: url }} style={styles.photo} contentFit="cover" />
        ) : (
          <ThemedView style={[styles.photo, styles.photoLoading]} />
        )
      ) : null}
      {moment.text ? (
        <ThemedText style={moment.storage_path ? styles.captionText : styles.noteText}>
          {moment.text}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
        {isMe ? 'You' : 'Them'} · {timeAgo(moment.created_at)}
      </ThemedText>
        <ReactionBar
          reactions={reactions}
          userId={userId}
          onToggle={(emoji) => onToggleReaction(moment.id, emoji)}
        />
      </ThemedView>
    </MotiView>
  );
}

export default function FeedScreen() {
  const { session, pair, partnerProfile } = useAuth();
  const { moments, loading, refresh } = useMoments(pair?.id);
  const { reactions, react } = useReactions(pair?.id);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={moments}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          onRefresh={refresh}
          refreshing={loading}
          ListHeaderComponent={
            <View style={styles.headerRow}>
              <BrandHeader
                subtitle={partnerProfile ? `with ${partnerProfile.display_name}` : undefined}
              />
              <Pressable onPress={() => router.push('/account')} hitSlop={12}>
                <ThemedText type="small" themeColor="textSecondary">
                  Account
                </ThemedText>
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedView style={styles.emptyState}>
                <Logo size={56} animated />
                <ThemedText themeColor="textSecondary" style={styles.empty}>
                  Koi photo/note nahi abhi.{'\n'}Send tab se pehla moment bhejo!
                </ThemedText>
              </ThemedView>
            ) : null
          }
          renderItem={({ item }) => (
            <MomentCard
              moment={item}
              isMe={item.sender_id === session?.user.id}
              userId={session?.user.id}
              reactions={reactions.filter((r) => r.moment_id === item.id)}
              onToggleReaction={(momentId, emoji) => {
                if (session) react(momentId, session.user.id, emoji);
              }}
            />
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingBottom: BottomTabInset,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  listContent: { padding: Spacing.three, gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyState: { alignItems: 'center', gap: Spacing.three, marginTop: Spacing.six },
  empty: { textAlign: 'center' },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.two,
    gap: Spacing.two,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  photo: { width: '100%', aspectRatio: 1, borderRadius: Spacing.two },
  photoLoading: { backgroundColor: '#00000022' },
  noteText: { fontSize: 20, padding: Spacing.three },
  captionText: { fontSize: 15, paddingHorizontal: Spacing.one },
  meta: { paddingHorizontal: Spacing.one },
  reactionRow: { flexDirection: 'row', gap: Spacing.one },
  reactionPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.four,
  },
});
