import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { syncLatestMomentToWidget, WIDGET_PAIR_ID_KEY } from '@/lib/widget-cache';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

type MomentPushData = {
  pairId?: string;
  senderName?: string;
  preview?: string;
};

function parsePushData(taskData: unknown): MomentPushData {
  if (!taskData || typeof taskData !== 'object') return {};
  // Android delivers the raw FCM data payload as a JSON string under data.data.dataString.
  const inner = (taskData as Record<string, unknown>).data;
  const dataString =
    inner && typeof inner === 'object' ? (inner as Record<string, unknown>).dataString : undefined;
  if (typeof dataString === 'string') {
    try {
      return JSON.parse(dataString) as MomentPushData;
    } catch {
      return {};
    }
  }
  // Fallback shape (e.g. iOS), where fields may already be flattened onto data.
  return (inner as MomentPushData) ?? {};
}

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data }) => {
  const { pairId, senderName, preview } = parsePushData(data);
  const resolvedPairId = pairId ?? (await AsyncStorage.getItem(WIDGET_PAIR_ID_KEY));
  if (resolvedPairId) {
    await syncLatestMomentToWidget(resolvedPairId).catch(() => {});
  }

  // The push is data-only (see notify-moment edge function) so the OS never
  // shows anything on its own — we build the visible notification ourselves,
  // now that we're guaranteed to run even with the app fully killed.
  if (senderName || preview) {
    await Notifications.scheduleNotificationAsync({
      content: { title: senderName ?? 'Someone', body: preview ?? 'sent you a moment' },
      trigger: null,
    }).catch(() => {});
  }
});

export function registerBackgroundNotificationTask() {
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});
}
