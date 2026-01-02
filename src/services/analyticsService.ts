import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from './apiClient';

const CLIENT_ID_KEY = 'analytics_client_id';

interface AnalyticsEvent {
  eventName: string;
  params?: Record<string, any>;
  userId?: string;
  timestamp?: number;
}

interface EcommerceItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  brand?: string;
}

class AnalyticsService {
  private clientId: string | null = null;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private isInitialized = false;

  /**
   * Initialize analytics service
   */
  async initialize(userId?: string): Promise<void> {
    try {
      // Get or create client ID
      let storedClientId = await AsyncStorage.getItem(CLIENT_ID_KEY);
      if (!storedClientId) {
        storedClientId = `${Date.now()}.${Math.random().toString(36).substring(2, 15)}`;
        await AsyncStorage.setItem(CLIENT_ID_KEY, storedClientId);
      }
      this.clientId = storedClientId;

      // Set user ID if provided
      if (userId) {
        this.userId = userId;
      }

      // Generate session ID
      this.sessionId = `${Date.now()}.${Math.random().toString(36).substring(2, 10)}`;

      this.isInitialized = true;

      // Track app open
      this.trackEvent('app_open', {
        platform: Platform.OS,
        version: Application.nativeApplicationVersion,
        device_model: Device.modelName,
      });

      // Flush any queued events
      this.flushQueue();
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Set user ID (call after login)
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.trackEvent('user_identified', { user_id: userId });
  }

  /**
   * Clear user ID (call after logout)
   */
  clearUserId(): void {
    this.userId = null;
    this.trackEvent('user_logout');
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, params?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      eventName,
      params: {
        ...params,
        session_id: this.sessionId,
        platform: Platform.OS,
        app_version: Application.nativeApplicationVersion,
      },
      userId: this.userId || undefined,
      timestamp: Date.now(),
    };

    if (!this.isInitialized) {
      this.eventQueue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string, screenClass?: string): void {
    this.sendToBackend('screen-view', {
      screenName,
      screenClass: screenClass || screenName,
      userId: this.userId,
      clientId: this.clientId,
    });
  }

  // ============ E-commerce Events ============

  /**
   * Track product view
   */
  trackViewItem(item: EcommerceItem): void {
    this.sendToBackend('ecommerce/view-item', {
      item: {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        brand: item.brand || 'Handwork',
      },
      userId: this.userId,
      clientId: this.clientId,
    });
  }

  /**
   * Track add to cart
   */
  trackAddToCart(item: EcommerceItem): void {
    this.sendToBackend('ecommerce/add-to-cart', {
      item: {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity || 1,
      },
      userId: this.userId,
      clientId: this.clientId,
    });
  }

  /**
   * Track remove from cart
   */
  trackRemoveFromCart(item: EcommerceItem): void {
    this.trackEvent('remove_from_cart', {
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    });
  }

  /**
   * Track begin checkout
   */
  trackBeginCheckout(
    items: EcommerceItem[],
    totalValue: number,
    coupon?: string,
  ): void {
    this.sendToBackend('ecommerce/begin-checkout', {
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        category: item.category,
      })),
      totalValue,
      coupon,
      userId: this.userId,
      clientId: this.clientId,
    });
  }

  /**
   * Track purchase
   */
  trackPurchase(
    transactionId: string,
    items: EcommerceItem[],
    totalValue: number,
    shipping?: number,
    coupon?: string,
  ): void {
    this.sendToBackend('ecommerce/purchase', {
      transactionId,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        category: item.category,
      })),
      totalValue,
      shipping,
      coupon,
      clientId: this.clientId,
    });
  }

  // ============ User Events ============

  /**
   * Track sign up
   */
  trackSignUp(method: string): void {
    this.sendToBackend('custom/signup', {
      method,
      userId: this.userId,
      clientId: this.clientId,
    });
  }

  /**
   * Track login
   */
  trackLogin(method: string): void {
    this.sendToBackend('custom/login', {
      method,
      userId: this.userId,
      clientId: this.clientId,
    });
  }

  /**
   * Track search
   */
  trackSearch(searchTerm: string, resultsCount?: number): void {
    this.sendToBackend('custom/search', {
      searchTerm,
      resultsCount,
      userId: this.userId,
      clientId: this.clientId,
    });
  }

  // ============ Custom Events ============

  /**
   * Track button click
   */
  trackButtonClick(buttonId: string, buttonText?: string, screen?: string): void {
    this.trackEvent('button_click', {
      button_id: buttonId,
      button_text: buttonText,
      screen,
    });
  }

  /**
   * Track share
   */
  trackShare(contentType: string, itemId: string, method?: string): void {
    this.trackEvent('share', {
      content_type: contentType,
      item_id: itemId,
      method,
    });
  }

  /**
   * Track favorite add
   */
  trackAddToFavorites(itemId: string, itemName: string, category?: string): void {
    this.trackEvent('add_to_wishlist', {
      item_id: itemId,
      item_name: itemName,
      item_category: category,
    });
  }

  /**
   * Track rating
   */
  trackRating(itemId: string, rating: number, contentType: string): void {
    this.trackEvent('rate', {
      item_id: itemId,
      rating,
      content_type: contentType,
    });
  }

  /**
   * Track chat initiated
   */
  trackChatInitiated(chatType: 'farmer' | 'rider' | 'support', recipientId?: string): void {
    this.trackEvent('chat_initiated', {
      chat_type: chatType,
      recipient_id: recipientId,
    });
  }

  /**
   * Track notification received
   */
  trackNotificationReceived(notificationType: string, notificationId?: string): void {
    this.trackEvent('notification_received', {
      notification_type: notificationType,
      notification_id: notificationId,
    });
  }

  /**
   * Track notification opened
   */
  trackNotificationOpened(notificationType: string, notificationId?: string): void {
    this.trackEvent('notification_opened', {
      notification_type: notificationType,
      notification_id: notificationId,
    });
  }

  /**
   * Track error
   */
  trackError(errorType: string, errorMessage: string, screen?: string): void {
    this.trackEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage,
      screen,
    });
  }

  // ============ Private Methods ============

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.sendToBackend('event', {
        eventName: event.eventName,
        params: event.params,
        userId: event.userId,
        clientId: this.clientId,
      });
    } catch (error) {
      console.debug('Failed to send analytics event:', error);
    }
  }

  private async sendToBackend(endpoint: string, data: any): Promise<void> {
    try {
      await apiClient.post(`/integrations/analytics/${endpoint}`, data);
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug(`Analytics ${endpoint} failed:`, error);
    }
  }

  private async flushQueue(): Promise<void> {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        await this.sendEvent(event);
      }
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
