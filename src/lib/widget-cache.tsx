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

/** Fetches the newest moment for a pair, caches its photo locally, and updates
 * the widget's AsyncStorage snapshot + triggers a widget redraw (Android only). */
export async function syncLatestMomentToWidget(pairId: string) {
  const { data: moment } = await supabase
    .from('moments')
    .select('type, text, storage_path, created_at, sender_id')
    .eq('pair_id', pairId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!moment) return;

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
