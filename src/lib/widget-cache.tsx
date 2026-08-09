import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import { getMomentPhotoUrl } from '@/lib/storage';

export type WidgetMoment = {
  type: 'photo' | 'note';
  text: string | null;
  // https signed URL (ImageWidget only accepts http(s)/data URIs, not file://)
  photoUri: string | null;
  senderName: string;
  createdAt: string;
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

async function clearWidget() {
  await AsyncStorage.removeItem(KEY);
  if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { MomentWidget } = await import('@/widgets/moment-widget');
    await requestWidgetUpdate({
      widgetName: 'MomentWidget',
      renderWidget: () => <MomentWidget moment={null} />,
    });
  }
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
    .select('type, text, storage_path, created_at, sender_id')
    .eq('pair_id', pairId)
    .neq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!moment) {
    await clearWidget();
    return;
  }

  const { data: sender } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', moment.sender_id)
    .maybeSingle();

  let photoUri: string | null = null;
  if (moment.type === 'photo' && moment.storage_path) {
    photoUri = await getMomentPhotoUrl(moment.storage_path);
  }

  await saveLatestMomentForWidget({
    type: moment.type,
    text: moment.text,
    photoUri,
    senderName: sender?.display_name ?? 'Someone',
    createdAt: moment.created_at,
  });

  if (Platform.OS === 'android') {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { MomentWidget } = await import('@/widgets/moment-widget');
    const latest = await readLatestMomentForWidget();
    await requestWidgetUpdate({
      widgetName: 'MomentWidget',
      renderWidget: () => <MomentWidget moment={latest} />,
    });
  }
}
