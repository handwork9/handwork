import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { API_CONFIG } from '../constants/config';
import * as Notifications from 'expo-notifications';

interface NotificationData {
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  notificationId?: string;
  timestamp?: string;
}

/**
 * Hook to connect to the notifications WebSocket for real-time notifications
 * This supplements Expo push notifications for in-app real-time updates
 */
export function useNotificationSocket(
  onNotification?: (notification: NotificationData) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated, user, accessToken } = useSelector(
    (state: RootState) => state.auth
  );
  
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !accessToken) {
      return;
    }

    // Connect to notifications namespace on port 3003
    const wsUrl = API_CONFIG.WS_URL.replace(/:300[01]/, ':3003');
    const notificationsUrl = `${wsUrl}/notifications`;
    
    console.log('[NotificationSocket] Connecting to:', notificationsUrl);

    const socket = io(notificationsUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[NotificationSocket] Connected, joining user channel');
      socket.emit('user:join', { userId: user.id });
    });

    socket.on('notifications:joined', (data: { success: boolean; userId: string }) => {
      console.log('[NotificationSocket] Joined notification channel:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('[NotificationSocket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[NotificationSocket] Connection error:', error.message);
    });

    // Listen for new notifications
    socket.on('notification:new', async (notification: NotificationData) => {
      console.log('[NotificationSocket] Received notification:', notification);
      
      // Call callback if provided
      callbackRef.current?.(notification);

      // Show local notification using Expo
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            sound: true,
          },
          trigger: null, // Show immediately
        });
      } catch (error) {
        console.error('[NotificationSocket] Error showing local notification:', error);
      }
    });

    // Listen for broadcast notifications
    socket.on('notification:broadcast', async (notification: NotificationData) => {
      console.log('[NotificationSocket] Received broadcast:', notification);
      
      callbackRef.current?.(notification);

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: notification.data,
            sound: true,
          },
          trigger: null,
        });
      } catch (error) {
        console.error('[NotificationSocket] Error showing broadcast notification:', error);
      }
    });

    return () => {
      console.log('[NotificationSocket] Cleaning up');
      if (socket.connected) {
        socket.emit('user:leave', { userId: user.id });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id, accessToken]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  return { disconnect };
}
