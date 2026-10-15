import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { MotiView } from 'moti';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, useWindowDimensions, View, type ViewToken } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Easing, runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Avatar } from '@/components/avatar';
import { BrandHeader } from '@/components/brand-header';
import { Lightbox } from '@/components/lightbox';
import { Logo } from '@/components/logo';
import { MomentVideo, type MomentVideoHandle } from '@/components/moment-video';
import { MusicBadge } from '@/components/music-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useComments } from '@/hooks/use-comments';
import { useMoments } from '@/hooks/use-moments';
import { useReactions } from '@/hooks/use-reactions';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { REACTION_EMOJIS } from '@/lib/reactions';
import { getMomentPhotoUrl, getMomentVideoUri } from '@/lib/storage';
import { timeAgo } from '@/lib/time';
import type { Moment, MomentReaction } from '@/lib/types';

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
  onOpenLightbox,
  commentCount,
  isVisible,
}: {
  moment: Moment;
  isMe: boolean;
  senderName: string;
  userId: string | undefined;
  reactions: MomentReaction[];
  onToggleReaction: (momentId: string, emoji: string) => void;
  onOpenLightbox: (url: string) => void;
  commentCount: number;
  isVisible: boolean;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const [url, setUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const trayWidth = Math.min(width - Spacing.four, 336);
  const videoRef = useRef<MomentVideoHandle>(null);

  useEffect(() => {
    let cancelled = false;
    if (!moment.storage_path) return;
    const resolveUrl =
      moment.type === 'video'
        ? getMomentVideoUri(moment.storage_path, moment.id)
        : getMomentPhotoUrl(moment.storage_path);
    resolveUrl.then((nextUrl) => !cancelled && setUrl(nextUrl)).catch(() => !cancelled && setUrl(null));
    return () => {
      cancelled = true;
    };
  }, [moment.storage_path, moment.id, moment.type]);

  const [showHeartBurst, setShowHeartBurst] = useState(false);

  const isVideo = moment.type === 'video';
  const hasPhoto = Boolean(moment.storage_path) && !isVideo;
  const hasText = Boolean(moment.text?.trim());
  const myReaction = reactions.find((reaction) => reaction.user_id === userId);
  const hasMyHeart = myReaction?.emoji === '❤️';

  useEffect(() => {
    if (!showHeartBurst) return;
    const timer = setTimeout(() => setShowHeartBurst(false), 700);
    return () => clearTimeout(timer);
  }, [showHeartBurst]);

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

  // Video has no lightbox (it already autoplays full-size in the feed), so a
  // single tap there toggles play/pause instead — routed through this
  // GestureDetector rather than a nested Pressable inside MomentVideo, since
  // mixing react-native-gesture-handler with the built-in touch responder
  // system in the same subtree is unreliable.
  const handleSingleTap = useCallback(() => {
    if (hasPhoto && url) onOpenLightbox(url);
    else if (isVideo) videoRef.current?.togglePlay();
  }, [hasPhoto, isVideo, onOpenLightbox, url]);

  // Instagram-style: double-tap always likes (never removes the heart via
  // double tap, only the heart button toggles it) and shows a heart burst;
  // a plain single tap opens the lightbox, delayed via
  // requireExternalGestureToFail so it doesn't fire ahead of a double tap.
  const handleDoubleTapLike = useCallback(() => {
    setShowHeartBurst(true);
    if (!hasMyHeart) onToggleReaction(moment.id, '❤️');
  }, [hasMyHeart, moment.id, onToggleReaction]);

  // handleSingleTap only reads videoRef.current when the gesture actually
  // fires (inside runOnJS), never during render — same established pattern
  // as in-app-camera.tsx's shutter gesture.
  /* eslint-disable react-hooks/refs */
  const mediaGesture = useMemo(() => {
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd((_event, success) => {
        if (success) runOnJS(handleDoubleTapLike)();
      });
    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .maxDuration(250)
      .requireExternalGestureToFail(doubleTap)
      .onEnd((_event, success) => {
        if (success) runOnJS(handleSingleTap)();
      });
    const longPress = Gesture.LongPress()
      .minDuration(260)
      .onStart(() => runOnJS(setPickerVisible)(true));
    return Gesture.Race(longPress, Gesture.Exclusive(doubleTap, singleTap));
  }, [handleDoubleTapLike, handleSingleTap]);
  /* eslint-enable react-hooks/refs */

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

      <View style={styles.mediaWrap}>
        <GestureDetector gesture={mediaGesture}>
          <MotiView
            animate={{
              scale: pickerVisible && !reducedMotion ? 0.985 : 1,
              opacity: pickerVisible ? 0.94 : 1,
            }}
            transition={{
              type: 'timing',
              duration: reducedMotion ? 0 : pickerVisible ? 180 : 140,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }}
            accessibilityActions={[{ name: 'activate', label: 'Show reactions' }]}
            accessibilityHint="Double tap to like, tap to expand, long press to react"
            accessibilityLabel={`${isMe ? 'Your' : `${senderName}'s`} moment`}
            accessibilityRole="button"
            onAccessibilityAction={() => setPickerVisible(true)}>
            {isVideo ? (
              url ? (
                <MotiView
                  from={{ opacity: reducedMotion ? 1 : 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: reducedMotion ? 0 : 180 }}
                  style={styles.photo}>
                  <MomentVideo ref={videoRef} uri={url} isVisible={isVisible} style={styles.photo} />
                </MotiView>
              ) : (
                <View style={[styles.photo, styles.mediaLoading, { backgroundColor: theme.backgroundElement }]}>
                  <ActivityIndicator color={theme.textSecondary} />
                </View>
              )
            ) : hasPhoto ? (
              url ? (
                <View style={[styles.photo, styles.photoFrame]}>
                  <Image
                    source={{ uri: url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={180}
                    cachePolicy="memory-disk"
                    priority={isVisible ? 'high' : 'normal'}
                    recyclingKey={moment.id}
                    onLoadStart={() => setPhotoLoading(true)}
                    onLoad={() => setPhotoLoading(false)}
                    onError={() => setPhotoLoading(false)}
                  />
                  {photoLoading ? (
                    <View pointerEvents="none" style={[styles.mediaLoading, styles.mediaLoadingOverlay]}>
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={[styles.photo, styles.mediaLoading, { backgroundColor: theme.backgroundElement }]}>
                  <ActivityIndicator color={theme.textSecondary} />
                </View>
              )
            ) : (
              <View style={[styles.noteMoment, { backgroundColor: theme.note, borderColor: theme.divider }]}>
                <ThemedText style={[styles.noteText, { color: theme.noteInk }]}>{moment.text}</ThemedText>
              </View>
            )}
          </MotiView>
        </GestureDetector>
        {showHeartBurst ? (
          <View pointerEvents="none" style={styles.heartBurstWrap}>
            <MotiView
              from={{ opacity: 0, scale: reducedMotion ? 1 : 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], scale: reducedMotion ? 1 : [0.4, 1.15, 1, 1] }}
              transition={{ type: 'timing', duration: reducedMotion ? 0 : 650 }}>
              <SymbolView
                name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
                size={84}
                tintColor="#FFFFFF"
                fallback={<ThemedText style={styles.heartBurstFallback}>❤️</ThemedText>}
              />
            </MotiView>
          </View>
        ) : null}
        {moment.youtube_video_id ? (
          <MusicBadge
            videoId={moment.youtube_video_id}
            title={moment.track_title ?? 'Track'}
            thumbnailUrl={moment.track_thumbnail_url}
            startSeconds={moment.track_start_seconds}
            isVisible={isVisible}
          />
        ) : null}
      </View>

      {(hasPhoto || isVideo) && hasText ? <ThemedText style={styles.caption}>{moment.text}</ThemedText> : null}

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={commentCount > 0 ? `${commentCount} comments` : 'Comment on this moment'}
            hitSlop={10}
            onPress={() => router.push({ pathname: '/comments-sheet', params: { momentId: moment.id } })}
            style={styles.commentButton}>
            <SymbolView
              name={{ ios: 'bubble.right', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
              size={20}
              tintColor={theme.textSecondary}
              fallback={<ThemedText type="small">Comment</ThemedText>}
            />
            {commentCount > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">{commentCount}</ThemedText>
            ) : null}
          </Pressable>
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
  const { comments } = useComments(pair?.id);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
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

  const reactionsByMoment = useMemo(() => {
    const grouped = new Map<string, MomentReaction[]>();
    for (const reaction of reactions) {
      const current = grouped.get(reaction.moment_id);
      if (current) current.push(reaction);
      else grouped.set(reaction.moment_id, [reaction]);
    }
    return grouped;
  }, [reactions]);

  const commentCountByMoment = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const comment of comments) {
      grouped.set(comment.moment_id, (grouped.get(comment.moment_id) ?? 0) + 1);
    }
    return grouped;
  }, [comments]);

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
          progressViewOffset={8}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={FEED_VIEWABILITY_CONFIG}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={5}
          maxToRenderPerBatch={3}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Logo size={56} />
                <ThemedText type="title" style={styles.emptyTitle}>Share your first moment</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.emptySub}>
                  Send a photo or note to {partnerName}. It will appear here and on their home screen.
                </ThemedText>
                <AnimatedPressable
                  onPress={() => router.push('/camera')}
                  style={styles.emptyAction}>
                  <ThemedText type="smallBold" style={styles.emptyActionText}>Send a moment</ThemedText>
                </AnimatedPressable>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const visible = visibleKeys.size === 0 || visibleKeys.has(item.key);
            if (item.type === 'section') {
              return <SectionLabel label={item.label} />;
            }
            const moment = item.moment;
            const isMe = moment.sender_id === session?.user.id;
            return (
              <MomentCard
                moment={moment}
                isMe={isMe}
                senderName={isMe ? myName : partnerName}
                userId={session?.user.id}
                reactions={reactionsByMoment.get(moment.id) ?? []}
                onToggleReaction={(momentId, emoji) => {
                  if (session) react(momentId, session.user.id, emoji);
                }}
                onOpenLightbox={setLightboxUrl}
                commentCount={commentCountByMoment.get(moment.id) ?? 0}
                isVisible={visible}
              />
            );
          }}
        />
      </SafeAreaView>
      <Lightbox uri={lightboxUrl} onClose={() => setLightboxUrl(null)} />
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
  senderBlock: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  timeText: { fontSize: 12 },
  mediaWrap: { position: 'relative' },
  heartBurstWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBurstFallback: { fontSize: 72 },
  photo: { width: '100%', aspectRatio: 1 },
  photoFrame: { position: 'relative', overflow: 'hidden' },
  mediaLoading: { alignItems: 'center', justifyContent: 'center' },
  mediaLoadingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.15)' },
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
  commentButton: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
