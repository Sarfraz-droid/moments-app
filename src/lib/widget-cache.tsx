import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { REACTION_EMOJIS } from '@/lib/reactions';
import { getMomentPhotoForWidget, getMomentVideoThumbnailForWidget } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

export type WidgetReactionSummary = {
  emoji: string;
  count: number;
  mine: boolean;
};

export type WidgetMoment = {
  momentId: string;
  pairId: string;
  text: string | null;
  // Local file URI when caching succeeds, otherwise a signed HTTPS URL. For
  // video moments this is a still thumbnail frame, not the video itself —
  // RemoteViews widgets can't animate anything, only show a static image.
  photoUri: string | null;
  isVideo: boolean;
  senderName: string;
  createdAt: string;
  reactions: WidgetReactionSummary[];
  // Widgets can't play audio, so this is only ever shown as a small badge —
  // opening the app is required to actually hear the attached track.
  trackTitle: string | null;
};

const KEY = 'widget:latest-moment';
export const WIDGET_PAIR_ID_KEY = 'widget:pair-id';

export async function saveLatestMomentForWidget(moment: WidgetMoment) {
  await AsyncStorage.setItem(KEY, JSON.stringify(moment));
}

export async function readLatestMomentForWidget(): Promise<WidgetMoment | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as WidgetMoment) : null;
}

export async function redrawMomentWidget() {
  if (Platform.OS !== 'android') return;
  const { requestWidgetUpdate } = await import('react-native-android-widget');
  const { MomentWidget } = await import('@/widgets/moment-widget');
  const latest = await readLatestMomentForWidget();
  await requestWidgetUpdate({
    widgetName: 'MomentWidget',
    renderWidget: () => <MomentWidget moment={latest} />,
  });
}

export async function clearMomentWidget() {
  await AsyncStorage.removeItem(KEY);
  await redrawMomentWidget();
}

async function summarizeReactions(momentId: string, viewerId: string): Promise<WidgetReactionSummary[]> {
  const { data } = await supabase
    .from('moment_reactions')
    .select('emoji, user_id')
    .eq('moment_id', momentId);
  return REACTION_EMOJIS.map((emoji) => {
    const forEmoji = (data ?? []).filter((r) => r.emoji === emoji);
    return { emoji, count: forEmoji.length, mine: forEmoji.some((r) => r.user_id === viewerId) };
  });
}

/** Fetches the newest moment your *partner* sent for a pair (never your own —
 * the widget is meant to surface what they shared with you), caches its photo
 * locally, and updates the widget's AsyncStorage snapshot + redraws it (Android only). */
export async function syncLatestMomentToWidget(pairId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: moment } = await supabase
    .from('moments')
    .select('id, text, storage_path, created_at, sender_id, track_title, type')
    .eq('pair_id', pairId)
    .neq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!moment) {
    await clearMomentWidget();
    return;
  }

  const { data: sender } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', moment.sender_id)
    .maybeSingle();

  const isVideo = moment.type === 'video';
  let photoUri: string | null = null;
  if (moment.storage_path) {
    photoUri = isVideo
      ? await getMomentVideoThumbnailForWidget(moment.storage_path, moment.id)
      : await getMomentPhotoForWidget(moment.storage_path, moment.id);
  }

  const reactions = await summarizeReactions(moment.id, user.id);

  await saveLatestMomentForWidget({
    momentId: moment.id,
    pairId,
    text: moment.text,
    photoUri,
    isVideo,
    senderName: sender?.display_name ?? 'Someone',
    createdAt: moment.created_at,
    reactions,
    trackTitle: moment.track_title,
  });

  await redrawMomentWidget();
}

/** Re-summarizes reactions for whatever moment is currently cached, without
 * refetching the moment itself — used after a reaction tap on the widget so
 * the redraw is instant and doesn't need a full moment refetch. */
export async function refreshCachedMomentReactions(viewerId: string) {
  const cached = await readLatestMomentForWidget();
  if (!cached) return;
  const reactions = await summarizeReactions(cached.momentId, viewerId);
  await saveLatestMomentForWidget({ ...cached, reactions });
  await redrawMomentWidget();
}
