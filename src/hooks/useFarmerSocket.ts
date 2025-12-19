import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { farmerSocketService } from '../services/farmerSocketService';
import {
  fetchFarmerOrders,
  fetchFarmerProducts,
  fetchDashboardStats,
  clearOrderNotification,
  clearAllOrderNotifications,
  markNotificationsRead,
  NewOrderNotification,
} from '../store/slices/farmerSlice';

/**
 * Hook for managing farmer socket connection
 */
export function useFarmerSocket() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const {
    isSocketConnected,
    newOrderNotifications,
    unreadOrdersCount,
    pendingOrdersCount,
  } = useAppSelector(state => state.farmer);
  const [isInitialized, setIsInitialized] = useState(false);

  // Connect to socket when farmer is logged in
  useEffect(() => {
    if (user?.role === 'farmer' && user?.id) {
      farmerSocketService.connect(user.id);
      setIsInitialized(true);

      return () => {
        farmerSocketService.disconnect();
        setIsInitialized(false);
      };
    }
  }, [user?.role, user?.id]);

  // Fetch initial data when connected
  useEffect(() => {
    if (isSocketConnected && user?.role === 'farmer') {
      dispatch(fetchFarmerOrders({ limit: 20 }));
      dispatch(fetchFarmerProducts({}));
      dispatch(fetchDashboardStats());
    }
  }, [isSocketConnected, user?.role, dispatch]);

  const subscribeToOrder = useCallback((orderId: string) => {
    farmerSocketService.subscribeToOrder(orderId);
  }, []);

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    farmerSocketService.unsubscribeFromOrder(orderId);
  }, []);

  const dismissNotification = useCallback((orderId: string) => {
    dispatch(clearOrderNotification(orderId));
  }, [dispatch]);

  const dismissAllNotifications = useCallback(() => {
    dispatch(clearAllOrderNotifications());
  }, [dispatch]);

  const markAsRead = useCallback(() => {
    dispatch(markNotificationsRead());
  }, [dispatch]);

  const reconnect = useCallback(() => {
    if (user?.id) {
      farmerSocketService.connect(user.id);
    }
  }, [user?.id]);

  return {
    isConnected: isSocketConnected,
    isInitialized,
    newOrderNotifications,
    unreadOrdersCount,
    pendingOrdersCount,
    subscribeToOrder,
    unsubscribeFromOrder,
    dismissNotification,
    dismissAllNotifications,
    markAsRead,
    reconnect,
  };
}

/**
 * Hook for subscribing to new order notifications
 */
export function useNewOrderNotifications(onNewOrder?: (notification: NewOrderNotification) => void) {
  const { newOrderNotifications, unreadOrdersCount } = useAppSelector(state => state.farmer);
  const [lastCount, setLastCount] = useState(0);

  useEffect(() => {
    if (onNewOrder && newOrderNotifications.length > lastCount) {
      // New notification added
      const newNotification = newOrderNotifications[0];
      if (newNotification) {
        onNewOrder(newNotification);
      }
    }
    setLastCount(newOrderNotifications.length);
  }, [newOrderNotifications.length, onNewOrder, lastCount]);

  return {
    notifications: newOrderNotifications,
    unreadCount: unreadOrdersCount,
    hasNew: unreadOrdersCount > 0,
  };
}

/**
 * Hook for farmer order management
 */
export function useFarmerOrders() {
  const dispatch = useAppDispatch();
  const { orders, ordersTotal, ordersLoading, pendingOrdersCount } = useAppSelector(state => state.farmer);

  const refreshOrders = useCallback(async (params?: { page?: number; limit?: number; status?: string }) => {
    await dispatch(fetchFarmerOrders(params || {}));
  }, [dispatch]);

  return {
    orders,
    total: ordersTotal,
    loading: ordersLoading,
    pendingCount: pendingOrdersCount,
    refresh: refreshOrders,
  };
}

/**
 * Hook for farmer product management
 */
export function useFarmerProducts() {
  const dispatch = useAppDispatch();
  const { products, productsTotal, productsLoading } = useAppSelector(state => state.farmer);

  const refreshProducts = useCallback(async () => {
    await dispatch(fetchFarmerProducts({}));
  }, [dispatch]);

  return {
    products,
    total: productsTotal,
    loading: productsLoading,
    refresh: refreshProducts,
  };
}

/**
 * Hook for farmer dashboard stats
 */
export function useFarmerDashboard() {
  const dispatch = useAppDispatch();
  const { dashboardStats, earnings, isLoading } = useAppSelector(state => state.farmer);

  const refreshStats = useCallback(async () => {
    await dispatch(fetchDashboardStats());
  }, [dispatch]);

  return {
    stats: dashboardStats,
    earnings,
    loading: isLoading,
    refresh: refreshStats,
  };
}
