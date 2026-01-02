import { NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

// Store navigation reference globally
let navigationRef: NavigationContainerRef<any> | null = null;

export const setNavigationRef = (ref: NavigationContainerRef<any> | null) => {
  navigationRef = ref;
};

export const getNavigationRef = () => navigationRef;

// Notification data types
export interface NotificationData {
  type?: string;
  screen?: string;
  orderId?: string;
  productId?: string;
  farmerId?: string;
  conversationId?: string;
  notificationId?: string;
  disputeId?: string;
  riderId?: string;
  groupBuyId?: string;
  [key: string]: any;
}

// Handle deep link navigation from notification tap
export const handleNotificationNavigation = (
  data: NotificationData,
  userRole?: 'buyer' | 'farmer' | 'rider'
) => {
  if (!navigationRef?.isReady()) {
    console.warn('[DeepLink] Navigation not ready, queuing navigation');
    // Queue navigation for when navigator is ready
    setTimeout(() => handleNotificationNavigation(data, userRole), 500);
    return;
  }

  const { type, screen } = data;
  console.log('[DeepLink] Handling navigation:', { type, screen, data });

  // Direct screen navigation if specified
  if (screen) {
    navigateToScreen(screen, data);
    return;
  }

  // Handle by notification type
  switch (type) {
    // Order related
    case 'order_created':
    case 'order_update':
    case 'order_status':
    case 'order_confirmed':
    case 'order_shipped':
    case 'order_delivered':
    case 'order_cancelled':
      if (data.orderId) {
        navigateToScreen('OrderTracking', { orderId: data.orderId });
      } else {
        navigateToScreen('Orders');
      }
      break;

    // Chat/Messages
    case 'new_message':
    case 'chat_message':
      if (data.conversationId && data.farmerId) {
        navigateToScreen('FarmerChat', { 
          farmerId: data.farmerId,
          conversationId: data.conversationId 
        });
      } else if (data.conversationId && data.riderId) {
        navigateToScreen('RiderChat', { 
          riderId: data.riderId,
          conversationId: data.conversationId 
        });
      } else {
        navigateToScreen('Messages');
      }
      break;

    // Product related
    case 'price_drop':
    case 'product_back_in_stock':
    case 'new_product':
      if (data.productId) {
        navigateToScreen('ProductDetail', { productId: data.productId });
      } else {
        navigateToScreen('Home');
      }
      break;

    // Promotions
    case 'promo':
    case 'flash_sale':
    case 'coupon':
      if (data.productId) {
        navigateToScreen('ProductDetail', { productId: data.productId });
      } else {
        navigateToScreen('Coupons');
      }
      break;

    // Wallet
    case 'wallet_credit':
    case 'wallet_debit':
    case 'withdrawal_approved':
    case 'withdrawal_rejected':
      navigateToScreen('Wallet');
      break;

    // Disputes
    case 'dispute_update':
    case 'dispute_resolved':
      if (data.disputeId) {
        navigateToScreen('MyDisputes');
      }
      break;

    // Review requests
    case 'review_request':
      if (data.orderId) {
        navigateToScreen('WriteReview', { orderId: data.orderId });
      }
      break;

    // Delivery updates (for riders/buyers)
    case 'delivery_assigned':
    case 'delivery_update':
      if (data.orderId) {
        navigateToScreen('OrderTracking', { orderId: data.orderId });
      }
      break;

    // Farmer specific
    case 'new_order':
      if (userRole === 'farmer') {
        navigateToScreen('FarmerOrders');
      }
      break;

    // Group buying
    case 'group_buy_update':
    case 'group_buy_completed':
      if (data.groupBuyId) {
        navigateToScreen('GroupBuyDetail', { groupBuyId: data.groupBuyId });
      } else {
        navigateToScreen('GroupBuying');
      }
      break;

    // Rewards
    case 'reward_earned':
    case 'badge_earned':
      navigateToScreen('Rewards');
      break;

    // Default - go to notifications
    default:
      if (data.notificationId) {
        navigateToScreen('NotificationDetail', { notificationId: data.notificationId });
      } else {
        navigateToScreen('Notifications');
      }
      break;
  }
};

// Navigate to a specific screen
const navigateToScreen = (screenName: string, params?: Record<string, any>) => {
  if (!navigationRef?.isReady()) {
    console.warn('[DeepLink] Navigation not ready');
    return;
  }

  try {
    // @ts-ignore - dynamic navigation
    navigationRef.navigate(screenName, params);
    console.log('[DeepLink] Navigated to:', screenName, params);
  } catch (error) {
    console.error('[DeepLink] Navigation error:', error);
  }
};

// Process notification response (when user taps notification)
export const processNotificationResponse = (
  response: Notifications.NotificationResponse,
  userRole?: 'buyer' | 'farmer' | 'rider'
) => {
  const data = response.notification.request.content.data as NotificationData;
  
  if (data) {
    handleNotificationNavigation(data, userRole);
  }
};

// Get initial notification (app opened from notification while closed)
export const getInitialNotification = async (): Promise<NotificationData | null> => {
  const response = await Notifications.getLastNotificationResponseAsync();
  
  if (response) {
    return response.notification.request.content.data as NotificationData;
  }
  
  return null;
};

export default {
  setNavigationRef,
  getNavigationRef,
  handleNotificationNavigation,
  processNotificationResponse,
  getInitialNotification,
};
