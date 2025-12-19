import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { buyerSocketService } from '../services/buyerSocketService';
import {
  fetchBuyerOrders,
  fetchActiveOrders,
  markConversationRead,
  clearOrderStatusUpdates,
  dismissOrderStatusUpdate,
  setTrackingOrder,
  OrderStatusUpdate,
  NewMessageNotification,
} from '../store/slices/buyerSlice';
import { OrderStatus } from '../types';

/**
 * Main hook for managing buyer socket connection
 */
export function useBuyerSocket() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const {
    isSocketConnected,
    orderStatusUpdates,
    unreadMessagesCount,
    activeOrderIds,
  } = useAppSelector(state => state.buyer);
  const [isInitialized, setIsInitialized] = useState(false);

  // Connect to socket when buyer is logged in
  useEffect(() => {
    if (user?.role === 'buyer' && user?.id) {
      buyerSocketService.connect(user.id);
      setIsInitialized(true);

      // Fetch initial orders
      dispatch(fetchBuyerOrders({ limit: 20 }));
      dispatch(fetchActiveOrders());

      return () => {
        buyerSocketService.disconnect();
        setIsInitialized(false);
      };
    }
  }, [user?.role, user?.id, dispatch]);

  // Subscribe to active orders for real-time updates
  useEffect(() => {
    if (isSocketConnected && activeOrderIds.length > 0) {
      activeOrderIds.forEach(orderId => {
        buyerSocketService.subscribeToOrder(orderId);
      });

      return () => {
        activeOrderIds.forEach(orderId => {
          buyerSocketService.unsubscribeFromOrder(orderId);
        });
      };
    }
  }, [isSocketConnected, activeOrderIds]);

  const subscribeToOrder = useCallback((orderId: string) => {
    buyerSocketService.subscribeToOrder(orderId);
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    buyerSocketService.unsubscribeFromOrder(orderId);
  }, []);

  const subscribeToConversation = useCallback((conversationId: string) => {
    buyerSocketService.subscribeToConversation(conversationId);
  }, []);

  const unsubscribeFromConversation = useCallback((conversationId: string) => {
    buyerSocketService.unsubscribeFromConversation(conversationId);
  }, []);

  const clearStatusUpdates = useCallback(() => {
    dispatch(clearOrderStatusUpdates());
  }, [dispatch]);

  const dismissStatusUpdate = useCallback((orderId: string) => {
    dispatch(dismissOrderStatusUpdate(orderId));
  }, [dispatch]);

  const reconnect = useCallback(() => {
    if (user?.id) {
      buyerSocketService.connect(user.id);
    }
  }, [user?.id]);

  return {
    isConnected: isSocketConnected,
    isInitialized,
    orderStatusUpdates,
    unreadMessagesCount,
    activeOrderIds,
    subscribeToOrder,
    unsubscribeFromOrder,
    subscribeToConversation,
    unsubscribeFromConversation,
    clearStatusUpdates,
    dismissStatusUpdate,
    reconnect,
  };
}

/**
 * Hook for order status notifications
 */
export function useOrderStatusUpdates(onStatusChange?: (update: OrderStatusUpdate) => void) {
  const { orderStatusUpdates } = useAppSelector(state => state.buyer);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (onStatusChange && orderStatusUpdates.length > lastCount) {
      // New status update
      const newUpdate = orderStatusUpdates[0];
      if (newUpdate) {
        onStatusChange(newUpdate);
      }
    }
    setLastCount(orderStatusUpdates.length);
  }, [orderStatusUpdates.length, onStatusChange, lastCount]);

  return {
    updates: orderStatusUpdates,
    hasUpdates: orderStatusUpdates.length > 0,
    latestUpdate: orderStatusUpdates[0] || null,
  };
}

/**
 * Hook for buyer orders management
 */
export function useBuyerOrders() {
  const dispatch = useAppDispatch();
  const { orders, ordersTotal, ordersLoading, activeOrderIds } = useAppSelector(state => state.buyer);

  const refreshOrders = useCallback(async (params?: { page?: number; limit?: number; status?: OrderStatus }) => {
    await dispatch(fetchBuyerOrders(params || {}));
  }, [dispatch]);

  const refreshActiveOrders = useCallback(async () => {
    await dispatch(fetchActiveOrders());
  }, [dispatch]);

  return {
    orders,
    total: ordersTotal,
    loading: ordersLoading,
    activeOrderIds,
    activeCount: activeOrderIds.length,
    refresh: refreshOrders,
    refreshActive: refreshActiveOrders,
  };
}

/**
 * Hook for order tracking
 */
export function useOrderTracking(orderId: string | null) {
  const dispatch = useAppDispatch();
  const {
    trackingOrderId,
    riderLocation,
    estimatedDelivery,
    isSocketConnected,
  } = useAppSelector(state => state.buyer);
  const order = useAppSelector(state => 
    state.buyer.orders.find(o => o.id === orderId)
  );

  // Set tracking order and subscribe
  useEffect(() => {
    if (orderId && isSocketConnected) {
      dispatch(setTrackingOrder(orderId));
      buyerSocketService.subscribeToOrder(orderId);

      return () => {
        dispatch(setTrackingOrder(null));
        buyerSocketService.unsubscribeFromOrder(orderId);
      };
    }
  }, [orderId, isSocketConnected, dispatch]);

  return {
    order,
    isTracking: trackingOrderId === orderId,
    riderLocation,
    estimatedDelivery,
    isConnected: isSocketConnected,
  };
}

/**
 * Hook for message notifications
 */
export function useMessageNotifications() {
  const dispatch = useAppDispatch();
  const { newMessageNotifications, unreadMessagesCount } = useAppSelector(state => state.buyer);

  const markAsRead = useCallback((conversationId: string) => {
    dispatch(markConversationRead(conversationId));
  }, [dispatch]);

  return {
    notifications: newMessageNotifications,
    unreadCount: unreadMessagesCount,
    hasUnread: unreadMessagesCount > 0,
    markAsRead,
  };
}

/**
 * Hook for conversation subscription
 */
export function useConversationSocket(conversationId: string | null) {
  const { isSocketConnected } = useAppSelector(state => state.buyer);

  useEffect(() => {
    if (conversationId && isSocketConnected) {
      buyerSocketService.subscribeToConversation(conversationId);

      return () => {
        buyerSocketService.unsubscribeFromConversation(conversationId);
      };
    }
  }, [conversationId, isSocketConnected]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (conversationId) {
      buyerSocketService.sendTypingIndicator(conversationId, isTyping);
    }
  }, [conversationId]);

  return {
    isConnected: isSocketConnected,
    sendTyping,
  };
}
