import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { syncLatestMomentToWidget, WIDGET_PAIR_ID_KEY } from '@/lib/widget-cache';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  const pairId = await AsyncStorage.getItem(WIDGET_PAIR_ID_KEY);
  if (pairId) {
    await syncLatestMomentToWidget(pairId).catch(() => {});
  }
});

// Keeps the widget's cached photo/note fresh even when the app is backgrounded
// or killed, by re-syncing whenever a push notification arrives.
export function registerBackgroundNotificationTask() {
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});
}
