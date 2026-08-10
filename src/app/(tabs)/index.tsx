import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandHeader } from '@/components/brand-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
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

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <ThemedText style={styles.avatarText}>{initial}</ThemedText>
    </View>
  );
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
        const active = forEmoji.length > 0;
        return (
          <Pressable
            key={emoji}
            onPress={() => onToggle(emoji)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.reactionPill,
              {
                backgroundColor: mine ? theme.brand : active ? theme.backgroundElement : theme.background,
                borderColor: mine ? theme.brand : theme.divider,
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}>
            <ThemedText
              style={{
                fontSize: 14,
                color: mine ? '#fff' : theme.text,
                fontWeight: mine ? 700 : 500,
              }}>
              {emoji}
              {active ? `  ${forEmoji.length}` : ''}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function MomentCard({
  moment,
  isMe,
  senderName,
  partnerName,
  userId,
  reactions,
  onToggleReaction,
}: {
  moment: Moment;
  isMe: boolean;
  senderName: string;
  partnerName: string;
  userId: string | undefined;
  reactions: MomentReaction[];
  onToggleReaction: (momentId: string, emoji: string) => void;
}) {
  const theme = useTheme();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (moment.storage_path) {
      getMomentPhotoUrl(moment.storage_path)
        .then((u) => !cancelled && setUrl(u))
        .catch(() => !cancelled && setUrl(null));
    }
    return () => {
      cancelled = true;
    };
  }, [moment]);

  const hasPhoto = Boolean(moment.storage_path);
  const hasText = Boolean(moment.text && moment.text.trim().length > 0);
  // Notes-only moments get the warm sticky-note treatment;
  // photo+text gets a polaroid; photo-only gets a clean print.
  const variant: 'polaroid' | 'sticky' | 'print' = !hasPhoto && hasText
    ? 'sticky'
    : hasPhoto && hasText
      ? 'polaroid'
      : 'print';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320 }}
      style={styles.cardWrap}>
      <View style={styles.cardHeader}>
        <Avatar name={senderName} color={isMe ? theme.brand : theme.glow} />
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" style={styles.senderName}>
            {isMe ? 'You' : partnerName || senderName}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.timeText}>
            {timeAgo(moment.created_at)}
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          variant === 'sticky' ? styles.stickyCard : styles.polaroidCard,
          {
            backgroundColor: variant === 'sticky' ? theme.note : theme.backgroundElement,
            transform: [{ rotate: variant === 'sticky' ? '-0.6deg' : '0.4deg' }],
          },
        ]}>
        {hasPhoto ? (
          url ? (
            <Image source={{ uri: url }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.photoLoading]} />
          )
        ) : null}
        {hasText ? (
          <ThemedText
            style={[
              variant === 'sticky' ? styles.stickyText : styles.polaroidCaption,
              { color: variant === 'sticky' ? theme.noteInk : theme.text },
            ]}>
            {moment.text}
          </ThemedText>
        ) : null}
      </View>

      <ReactionBar
        reactions={reactions}
        userId={userId}
        onToggle={(emoji) => onToggleReaction(moment.id, emoji)}
      />
    </MotiView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLine} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        {label}
      </ThemedText>
      <View style={styles.sectionLine} />
    </View>
  );
}

export default function FeedScreen() {
  const { session, pair, partnerProfile, profile } = useAuth();
  const { moments, loading, refresh } = useMoments(pair?.id);
  const { reactions, react } = useReactions(pair?.id);
  const theme = useTheme();

  const partnerName = partnerProfile?.display_name || 'your person';
  const myName = profile?.display_name || 'You';

  // Group moments by day for the section labels
  const grouped = useMemo(() => {
    const out: { day: string; items: Moment[] }[] = [];
    for (const m of moments) {
      const day = dayLabel(m.created_at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [moments]);

  const flatData = useMemo(() => {
    const rows: ({ type: 'section'; key: string; label: string } | { type: 'moment'; key: string; moment: Moment })[] = [];
    for (const g of grouped) {
      rows.push({ type: 'section', key: `s-${g.day}`, label: g.day });
      for (const m of g.items) rows.push({ type: 'moment', key: `m-${m.id}`, moment: m });
    }
    return rows;
  }, [grouped]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerWrap}>
          <BrandHeader
            subtitle={pair ? `with ${partnerName}` : undefined}
            trailing={profile?.display_name ? 'Me' : undefined}
            onTrailingPress={() => router.push('/account')}
          />
        </View>

        <FlatList
          data={flatData}
          keyExtractor={(r) => r.key}
          contentContainerStyle={styles.listContent}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400 }}
                style={styles.emptyWrap}>
                <View style={styles.emptyStack}>
                  <View
                    style={[
                      styles.emptyPolaroid,
                      { backgroundColor: theme.backgroundElement, transform: [{ rotate: '-8deg' }] },
                    ]}
                  />
                  <View
                    style={[
                      styles.emptyPolaroid,
                      {
                        backgroundColor: theme.note,
                        transform: [{ rotate: '5deg' }, { translateY: -10 }],
                      },
                    ]}>
                    <ThemedText style={{ color: theme.noteInk, fontSize: 13 }}>💛</ThemedText>
                  </View>
                  <View
                    style={[
                      styles.emptyPolaroid,
                      { backgroundColor: '#fff', transform: [{ rotate: '-2deg' }, { translateY: -20 }] },
                    ]}>
                    <ThemedText style={{ fontSize: 12, color: theme.text }}>+</ThemedText>
                  </View>
                </View>
                <ThemedText type="display" style={styles.emptyTitle}>
                  Your story{'\n'}starts here
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.emptySub}>
                  Send the first moment from the Send tab — a photo, a note, anything for {partnerName}.
                </ThemedText>
              </MotiView>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.type === 'section') return <SectionLabel label={item.label} />;
            const m = item.moment;
            return (
              <MomentCard
                moment={m}
                isMe={m.sender_id === session?.user.id}
                senderName={m.sender_id === session?.user.id ? myName : partnerName}
                partnerName={partnerName}
                userId={session?.user.id}
                reactions={reactions.filter((r) => r.moment_id === m.id)}
                onToggleReaction={(momentId, emoji) => {
                  if (session) react(momentId, session.user.id, emoji);
                }}
              />
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  headerWrap: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six + 40,
    gap: Spacing.four,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#00000010' },
  sectionLabel: {
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  cardWrap: {
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.one,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
  },
  senderName: { fontSize: 13 },
  timeText: { fontSize: 11, marginTop: 1 },
  polaroidCard: {
    borderRadius: Radii.md,
    padding: Spacing.two,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  stickyCard: {
    borderRadius: Radii.sm,
    padding: Spacing.four,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.two,
  },
  photoLoading: {
    backgroundColor: '#00000015',
  },
  polaroidCaption: {
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.two,
  },
  stickyText: {
    fontFamily: undefined,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 500,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingLeft: Spacing.one,
    marginTop: Spacing.one,
  },
  reactionPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 36,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  emptyStack: {
    width: 200,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  emptyPolaroid: {
    position: 'absolute',
    width: 110,
    height: 130,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 34,
  },
  emptySub: {
    textAlign: 'center',
    maxWidth: 320,
  },
});
