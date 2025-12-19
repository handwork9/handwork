import apiClient from './apiClient';

export interface Notification {
  id: string;
  type: 'order' | 'delivery' | 'payment' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface NotificationSettings {
  pushNotificationsEnabled: boolean;
  orderUpdatesEnabled: boolean;
  deliveryAlertsEnabled: boolean;
  paymentAlertsEnabled: boolean;
  promotionsEnabled: boolean;
  newProductsEnabled: boolean;
  priceDropsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
}

class NotificationService {
  async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationsResponse> {
    return apiClient.get<NotificationsResponse>('/notifications', {
      params: { page, limit },
    });
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return response.unreadCount;
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(): Promise<{ updated: number }> {
    return apiClient.patch<{ updated: number }>('/notifications/read-all');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  }

  async sendTestNotification(): Promise<{ message: string; success: boolean }> {
    const response = await apiClient.post<{ success: boolean; data: { message: string; success: boolean } }>('/notifications/test');
    return response.data || response;
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get<{ success: boolean; data: NotificationSettings } | NotificationSettings>('/notifications/settings');
    // Handle wrapped response from backend
    if ('data' in response && response.success !== undefined) {
      return response.data;
    }
    return response as NotificationSettings;
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await apiClient.put<{ success: boolean; data: NotificationSettings } | NotificationSettings>('/notifications/settings', settings);
    // Handle wrapped response from backend
    if ('data' in response && response.success !== undefined) {
      return response.data;
    }
    return response as NotificationSettings;
  }

  async updateFcmToken(fcmToken: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/notifications/fcm-token', { fcmToken });
  }
}

export const notificationService = new NotificationService();
