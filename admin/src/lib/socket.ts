'use client';

import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import Cookies from 'js-cookie';
import { message } from 'antd';
import { useNotificationStore } from './notificationStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

interface RecentOrder {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface PremiumSubscription {
  type: 'premium_subscription';
  userType: 'rider' | 'buyer' | 'farmer';
  tier: string;
  duration: string;
  amount: number;
  userName: string;
  userEmail: string;
  timestamp: string;
  message: string;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  riderLocations: Record<string, { lat: number; lng: number; timestamp: string }>;
  recentOrders: RecentOrder[];
  premiumSubscriptions: PremiumSubscription[];
  connect: () => void;
  disconnect: () => void;
  updateRiderLocation: (riderId: string, location: { lat: number; lng: number }) => void;
  addRecentOrder: (order: RecentOrder) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  riderLocations: {},
  recentOrders: [],
  premiumSubscriptions: [],
  
  connect: () => {
    const token = Cookies.get('admin_token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      set({ isConnected: true });
      
      // Join admin room
      socket.emit('admin:join');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    // Listen for rider location updates
    socket.on('rider:location_update', (data: { riderId: string; location: { lat: number; lng: number } }) => {
      set((state) => ({
        riderLocations: {
          ...state.riderLocations,
          [data.riderId]: {
            ...data.location,
            timestamp: new Date().toISOString(),
          },
        },
      }));
    });

    // Listen for new orders
    socket.on('order:created', (order: RecentOrder) => {
      set((state) => ({
        recentOrders: [order, ...state.recentOrders.slice(0, 49)],
      }));
      
      // Add to notification store
      useNotificationStore.getState().addNotification({
        type: 'order',
        title: 'New Order',
        message: `Order #${order.id.slice(0, 8)} has been placed`,
        data: order,
      });
    });

    // Listen for order status updates
    socket.on('order:status_updated', (data: { orderId: string; status: string }) => {
      set((state) => ({
        recentOrders: state.recentOrders.map((order) =>
          order.id === data.orderId ? { ...order, status: data.status } : order
        ),
      }));
    });

    // Listen for admin notifications (premium subscriptions, etc.)
    socket.on('admin:notification', (data: PremiumSubscription) => {
      console.log('Admin notification received:', data);
      
      if (data.type === 'premium_subscription') {
        // Show toast notification
        message.success({
          content: data.message,
          duration: 5,
        });
        
        // Store for dashboard display
        set((state) => ({
          premiumSubscriptions: [data, ...state.premiumSubscriptions.slice(0, 49)],
        }));
        
        // Add to notification store
        useNotificationStore.getState().addNotification({
          type: 'premium',
          title: 'Premium Subscription',
          message: data.message,
          data: {
            userId: data.userEmail,
            userName: data.userName,
          },
        });
      }
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  updateRiderLocation: (riderId, location) => {
    set((state) => ({
      riderLocations: {
        ...state.riderLocations,
        [riderId]: {
          ...location,
          timestamp: new Date().toISOString(),
        },
      },
    }));
  },

  addRecentOrder: (order) => {
    set((state) => ({
      recentOrders: [order, ...state.recentOrders.slice(0, 49)],
    }));
  },
}));
