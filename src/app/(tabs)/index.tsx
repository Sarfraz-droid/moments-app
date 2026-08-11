import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { MotiView } from 'moti';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View, type ViewToken } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Easing, runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { BrandHeader } from '@/components/brand-header';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useMoments } from '@/hooks/use-moments';
import { useReactions } from '@/hooks/use-reactions';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { REACTION_EMOJIS } from '@/lib/reactions';
import { getMomentPhotoUrl } from '@/lib/storage';
import type { Moment, MomentReaction } from '@/lib/types';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
}

function Avatar({ name, mine }: { name: string; mine: boolean }) {
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

function ReactionSummary({
  reactions,
  userId,
  onToggle,
}: {
  reactions: MomentReaction[];
  userId: string | undefined;
  onToggle: (emoji: string) => void;
}) {
  const theme = useTheme();
  const visible = REACTION_EMOJIS.map((emoji) => {
    const matching = reactions.filter((reaction) => reaction.emoji === emoji);
    return {
      emoji,
      count: matching.length,
      mine: matching.some((reaction) => reaction.user_id === userId),
    };
  }).filter((reaction) => reaction.count > 0);

  if (visible.length === 0) return null;

  return (
    <View style={styles.reactionSummary}>
      {visible.map(({ emoji, count, mine }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${emoji} reaction, ${count}`}
          hitSlop={8}
          key={emoji}
          onPress={() => onToggle(emoji)}
          style={[
            styles.reactionCount,
            {
              backgroundColor: mine ? theme.brandSoft : theme.backgroundElement,
              borderColor: mine ? theme.brand : theme.divider,
            },
          ]}>
          <ThemedText type="small" style={styles.reactionCountText}>
            {emoji} {count}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function ReactionTray({
  onChoose,
  selectedIndex,
  width,
}: {
  onChoose: (emoji: string) => void;
  selectedIndex: number | null;
  width: number;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <MotiView
      from={{ opacity: 0, translateY: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={reducedMotion ? { type: 'timing', duration: 0 } : { type: 'spring', damping: 18 }}
      style={[
        styles.reactionTray,
        { width, backgroundColor: theme.background, borderColor: theme.divider },
      ]}>
      {REACTION_EMOJIS.map((emoji, index) => (
        <AnimatedPressable
          accessibilityLabel={`React with ${emoji}`}
          accessibilityRole="button"
          key={emoji}
          onPress={() => onChoose(emoji)}
          style={[
            styles.reactionChoice,
            selectedIndex === index && { backgroundColor: theme.brandSoft },
          ]}>
          <MotiView
            animate={{
              scale: selectedIndex === index && !reducedMotion ? 1.55 : 1,
              translateY: selectedIndex === index && !reducedMotion ? -7 : 0,
            }}
            transition={{ type: 'timing', duration: reducedMotion ? 0 : 140, easing: Easing.out(Easing.cubic) }}>
            <ThemedText style={styles.reactionEmoji}>{emoji}</ThemedText>
          </MotiView>
        </AnimatedPressable>
      ))}
    </MotiView>
  );
}

function MomentCard({
  moment,
  isMe,
  senderName,
  userId,
  reactions,
  onToggleReaction,
}: {
  moment: Moment;
  isMe: boolean;
  senderName: string;
  userId: string | undefined;
  reactions: MomentReaction[];
  onToggleReaction: (momentId: string, emoji: string) => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [url, setUrl] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const trayWidth = Math.min(width - Spacing.four, 336);

  useEffect(() => {
    let cancelled = false;
    if (!moment.storage_path) return;
    getMomentPhotoUrl(moment.storage_path)
      .then((nextUrl) => !cancelled && setUrl(nextUrl))
      .catch(() => !cancelled && setUrl(null));
    return () => {
      cancelled = true;
    };
  }, [moment.storage_path]);

  const hasPhoto = Boolean(moment.storage_path);
  const hasText = Boolean(moment.text?.trim());
  const myReaction = reactions.find((reaction) => reaction.user_id === userId);
  const hasMyHeart = myReaction?.emoji === '❤️';

  const chooseReaction = useCallback((emoji: string) => {
    onToggleReaction(moment.id, emoji);
    setPickerVisible(false);
    setSelectedIndex(null);
  }, [moment.id, onToggleReaction]);

  const reactionIndexForX = useCallback((absoluteX: number) => {
    const horizontalInset = Spacing.two;
    const index = Math.floor((absoluteX - horizontalInset) / (trayWidth / REACTION_EMOJIS.length));
    return Math.max(0, Math.min(REACTION_EMOJIS.length - 1, index));
  }, [trayWidth]);

  const beginReactionGesture = useCallback((absoluteX: number) => {
    setPickerVisible(true);
    setSelectedIndex(reactionIndexForX(absoluteX));
  }, [reactionIndexForX]);

  const moveReactionGesture = useCallback((absoluteX: number) => {
    setSelectedIndex(reactionIndexForX(absoluteX));
  }, [reactionIndexForX]);

  const finishReactionGesture = useCallback((absoluteX: number) => {
    chooseReaction(REACTION_EMOJIS[reactionIndexForX(absoluteX)]);
  }, [chooseReaction, reactionIndexForX]);

  const cancelReactionGesture = useCallback(() => {
    setPickerVisible(false);
    setSelectedIndex(null);
  }, []);

  const holdAndSlideGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(240)
        .onStart((event) => runOnJS(beginReactionGesture)(event.absoluteX))
        .onUpdate((event) => runOnJS(moveReactionGesture)(event.absoluteX))
        .onEnd((event) => runOnJS(finishReactionGesture)(event.absoluteX))
        .onFinalize((_event, success) => {
          if (!success) runOnJS(cancelReactionGesture)();
        }),
    [beginReactionGesture, cancelReactionGesture, finishReactionGesture, moveReactionGesture]
  );

  return (
    <View style={[styles.moment, { borderBottomColor: theme.divider }]}>
      <View style={styles.momentHeader}>
        <Avatar name={senderName} mine={isMe} />
        <View style={styles.senderBlock}>
          <ThemedText type="smallBold">{isMe ? 'You' : senderName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.timeText}>
            {timeAgo(moment.created_at)}
          </ThemedText>
        </View>
      </View>

      <Pressable
        accessibilityActions={[{ name: 'activate', label: 'Show reactions' }]}
        accessibilityHint="Long press to react"
        accessibilityLabel={`${isMe ? 'Your' : `${senderName}'s`} moment`}
        delayLongPress={260}
        onAccessibilityAction={() => setPickerVisible(true)}
        onLongPress={() => setPickerVisible(true)}>
        {hasPhoto ? (
          url ? (
            <Image source={{ uri: url }} style={styles.photo} contentFit="cover" transition={180} />
          ) : (
            <View style={[styles.photo, { backgroundColor: theme.backgroundElement }]} />
          )
        ) : (
          <View style={[styles.noteMoment, { backgroundColor: theme.note, borderColor: theme.divider }]}>
            <ThemedText style={[styles.noteText, { color: theme.noteInk }]}>{moment.text}</ThemedText>
          </View>
        )}
      </Pressable>

      {hasPhoto && hasText ? <ThemedText style={styles.caption}>{moment.text}</ThemedText> : null}

      <View style={styles.reactionDock}>
        {pickerVisible ? (
          <ReactionTray onChoose={chooseReaction} selectedIndex={selectedIndex} width={trayWidth} />
        ) : null}
        <View style={styles.reactionFooter}>
          <GestureDetector gesture={holdAndSlideGesture}>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Tap to send a heart, or press and hold then slide to choose another reaction"
              accessibilityLabel={myReaction ? `Your reaction is ${myReaction.emoji}` : 'Heart or react to this moment'}
              hitSlop={10}
              onPress={() => chooseReaction(myReaction?.emoji ?? '❤️')}
              style={[
                styles.reactButton,
                (pickerVisible || myReaction) && { backgroundColor: theme.brandSoft },
              ]}>
              {myReaction && !hasMyHeart ? (
                <MotiView
                  from={{ scale: 0.75 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}>
                  <ThemedText style={styles.selectedReactionEmoji}>{myReaction.emoji}</ThemedText>
                </MotiView>
              ) : (
                <SymbolView
                  name={{
                    ios: hasMyHeart ? 'heart.fill' : 'heart',
                    android: hasMyHeart ? 'favorite' : 'favorite_border',
                    web: hasMyHeart ? 'favorite' : 'favorite_border',
                  }}
                  size={22}
                  tintColor={pickerVisible || hasMyHeart ? theme.brand : theme.textSecondary}
                  fallback={<ThemedText type="small">Heart</ThemedText>}
                />
              )}
            </Pressable>
          </GestureDetector>
          <ReactionSummary reactions={reactions} userId={userId} onToggle={chooseReaction} />
        </View>
      </View>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
      {label}
    </ThemedText>
  );
}

type FeedRow =
  | { type: 'section'; key: string; label: string }
  | { type: 'moment'; key: string; moment: Moment };

const FEED_VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 18 };

export default function FeedScreen() {
  const { session, pair, partnerProfile, profile } = useAuth();
  const theme = useTheme();
  const { moments, loading, refresh } = useMoments(pair?.id);
  const { reactions, react } = useReactions(pair?.id);
  const reducedMotion = useReducedMotion();
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<FeedRow>[] }) => {
      setVisibleKeys(new Set(viewableItems.map(({ item }) => item.key)));
    },
    []
  );

  const partnerName = partnerProfile?.display_name || 'Your person';
  const myName = profile?.display_name || 'You';

  const flatData = useMemo(() => {
    const rows: FeedRow[] = [];
    let currentDay = '';
    for (const moment of moments) {
      const day = dayLabel(moment.created_at);
      if (day !== currentDay) {
        rows.push({ type: 'section', key: `section-${day}`, label: day });
        currentDay = day;
      }
      rows.push({ type: 'moment', key: `moment-${moment.id}`, moment });
    }
    return rows;
  }, [moments]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.headerWrap, { borderBottomColor: theme.divider }]}>
          <BrandHeader
            subtitle={pair ? partnerName : undefined}
          />
        </View>

        <FlatList
          data={flatData}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.listContent, flatData.length === 0 && styles.emptyList]}
          onRefresh={refresh}
          refreshing={loading}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={FEED_VIEWABILITY_CONFIG}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Logo size={56} />
                <ThemedText type="title" style={styles.emptyTitle}>Share your first moment</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.emptySub}>
                  Send a photo or note to {partnerName}. It will appear here and on their home screen.
                </ThemedText>
                <AnimatedPressable
                  onPress={() => router.push('/send-sheet')}
                  style={styles.emptyAction}>
                  <ThemedText type="smallBold" style={styles.emptyActionText}>Send a moment</ThemedText>
                </AnimatedPressable>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const visible = visibleKeys.size === 0 || visibleKeys.has(item.key);
            if (item.type === 'section') {
              return (
                <MotiView
                  animate={{ opacity: visible || reducedMotion ? 1 : 0.25 }}
                  transition={{ type: 'timing', duration: reducedMotion ? 0 : 180 }}>
                  <SectionLabel label={item.label} />
                </MotiView>
              );
            }
            const moment = item.moment;
            const isMe = moment.sender_id === session?.user.id;
            return (
              <MotiView
                animate={{
                  opacity: visible || reducedMotion ? 1 : 0.18,
                  translateY: visible || reducedMotion ? 0 : 8,
                }}
                transition={{
                  type: 'timing',
                  duration: reducedMotion ? 0 : visible ? 260 : 180,
                  easing: Easing.out(Easing.cubic),
                }}>
                <MomentCard
                  moment={moment}
                  isMe={isMe}
                  senderName={isMe ? myName : partnerName}
                  userId={session?.user.id}
                  reactions={reactions.filter((reaction) => reaction.moment_id === moment.id)}
                  onToggleReaction={(momentId, emoji) => {
                    if (session) react(momentId, session.user.id, emoji);
                  }}
                />
              </MotiView>
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
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listContent: { paddingBottom: Spacing.six + 48 },
  emptyList: { flexGrow: 1 },
  sectionLabel: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    fontSize: 13,
  },
  moment: {
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  momentHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800' },
  senderBlock: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  timeText: { fontSize: 12 },
  photo: { width: '100%', aspectRatio: 1 },
  noteMoment: {
    minHeight: 170,
    marginHorizontal: Spacing.three,
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  noteText: { fontSize: 21, lineHeight: 30, fontWeight: '500' },
  caption: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  reactionFooter: {
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  reactionDock: { position: 'relative', zIndex: 5 },
  reactionSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, flex: 1 },
  reactionCount: {
    minHeight: 32,
    minWidth: 44,
    paddingHorizontal: Spacing.two,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionCountText: { fontSize: 13 },
  reactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionTray: {
    position: 'absolute',
    left: Spacing.two,
    bottom: 46,
    paddingHorizontal: Spacing.two,
    minHeight: 58,
    borderRadius: Radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  reactionChoice: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionEmoji: { fontSize: 24 },
  selectedReactionEmoji: { fontSize: 21, lineHeight: 26 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  emptyTitle: { textAlign: 'center' },
  emptySub: { textAlign: 'center', maxWidth: 340 },
  emptyAction: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Radii.md,
    backgroundColor: '#F05D4E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  emptyActionText: { color: '#FFFFFF' },
});
