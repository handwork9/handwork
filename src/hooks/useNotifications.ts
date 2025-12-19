import { useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { authService } from '../services/authService';
import { NOTIFICATION_CONFIG } from '../constants/config';

// Lazy import to avoid circular dependency
let storeModule: typeof import('../store') | null = null;

const getStore = () => {
  if (!storeModule) {
    storeModule = require('../store');
  }
  return storeModule!.store;
};

// Configure notification behavior dynamically based on user settings
Notifications.setNotificationHandler({
  handleNotification: async () => {
    // Get current notification settings from store (lazy loaded)
    try {
      const store = getStore();
      const state = store.getState();
      const settings = state.notificationSettings?.settings;
      
      return {
        shouldShowAlert: settings?.pushNotificationsEnabled ?? true,
        shouldPlaySound: settings?.soundEnabled ?? true,
        shouldSetBadge: settings?.badgeEnabled ?? true,
        shouldShowBanner: settings?.pushNotificationsEnabled ?? true,
        shouldShowList: settings?.pushNotificationsEnabled ?? true,
      };
    } catch (error) {
      // Fallback if store is not ready
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }
  },
});

export function useNotifications(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      const token = tokenData.data;

      // Register token with backend
      try {
        await authService.registerDeviceToken(token);
      } catch (error) {
        console.warn('Failed to register device token with backend:', error);
      }

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          NOTIFICATION_CONFIG.CHANNEL_ID,
          {
            name: NOTIFICATION_CONFIG.CHANNEL_NAME,
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4CAF50',
          }
        );
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        onNotificationReceived?.(notification);
      }
    );

    // Listen for notification responses (taps)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        onNotificationResponse?.(response);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [onNotificationReceived, onNotificationResponse, registerForPushNotifications]);

  const scheduleLocalNotification = useCallback(
    async (
      title: string,
      body: string,
      data?: Record<string, any>,
      trigger?: Notifications.NotificationTriggerInput
    ) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: trigger ?? null,
      });
    },
    []
  );

  const cancelAllNotifications = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, []);

  const getBadgeCount = useCallback(async () => {
    return Notifications.getBadgeCountAsync();
  }, []);

  const setBadgeCount = useCallback(async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  }, []);

  return {
    registerForPushNotifications,
    scheduleLocalNotification,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
  };
}
