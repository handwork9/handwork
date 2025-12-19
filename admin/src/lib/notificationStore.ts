'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'support_ticket' | 'support_message' | 'order' | 'premium' | 'system';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    ticketId?: string;
    ticketNumber?: string;
    orderId?: string;
    orderNumber?: string;
    userId?: string;
    userName?: string;
    id?: string;
    [key: string]: unknown;
  };
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: AdminNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AdminNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: AdminNotification = {
          ...notification,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50 notifications
          unreadCount: state.unreadCount + 1,
        }));

        // Play notification sound
        if (typeof window !== 'undefined') {
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {}); // Ignore autoplay errors
          } catch {
            // Ignore audio errors
          }
        }

        // Show browser notification if permitted
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
            tag: newNotification.id,
          });
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.isRead 
              ? Math.max(0, state.unreadCount - 1) 
              : state.unreadCount,
          };
        });
      },
    }),
    {
      name: 'admin-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 20), // Persist only 20 recent
        unreadCount: state.unreadCount,
      }),
    }
  )
);
