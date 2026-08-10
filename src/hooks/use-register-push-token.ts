import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function useRegisterPushToken(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    let registration: Promise<void> | null = null;

    async function register() {
      // Expo SDK 57 requires an Android channel before requesting notification
      // permission or asking FCM for a device token.
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Moments',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;
      if (status !== 'granted') {
        const result = await Notifications.requestPermissionsAsync();
        status = result.status;
      }
      if (status !== 'granted') return;

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) throw new Error('Expo project ID is missing from app configuration');

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      if (cancelled) return;

      const { error } = await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);
      if (error) throw error;
    }

    function attemptRegistration() {
      if (registration) return;
      registration = register()
        .catch((error) => {
          // Keep this visible in development. Silently swallowing this error
          // previously made a missing Firebase configuration look like a
          // widget rendering bug.
          console.warn('Push-token registration failed', error);
        })
        .finally(() => {
          registration = null;
        });
    }

    attemptRegistration();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') attemptRegistration();
    });

    return () => {
      cancelled = true;
      appStateSubscription.remove();
    };
  }, [userId]);
}
