import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import { store } from '../store';
import {
  setSocketConnected,
  addNewOrderNotification,
  updateOrderInList,
  NewOrderNotification,
} from '../store/slices/farmerSlice';

type EventHandler = (data: any) => void;

class FarmerSocketService {
  private socket: Socket | null = null;
  private farmerId: string | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server for farmer updates
   */
  connect(farmerId: string): void {
    if (this.socket?.connected && this.farmerId === farmerId) {
      console.log('Farmer socket already connected for:', farmerId);
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    this.farmerId = farmerId;

    const state = store.getState();
    const token = state.auth.accessToken;

    if (!token) {
      console.warn('No auth token available for farmer socket connection');
      return;
    }

    // Convert WS URL to HTTP for socket.io
    const socketUrl = API_CONFIG.WS_URL
      .replace('ws://', 'http://')
      .replace('wss://', 'https://');

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.farmerId = null;
      this.eventHandlers.clear();
      this.reconnectAttempts = 0;
      store.dispatch(setSocketConnected(false));
    }
  }

  /**
   * Subscribe to a custom event
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler?: EventHandler): void {
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
      this.socket?.off(event, handler);
    } else {
      this.eventHandlers.delete(event);
      this.socket?.off(event);
    }
  }

  /**
   * Emit an event to server
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Farmer socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Join farmer's order room to receive order updates
   */
  joinFarmerRoom(): void {
    if (this.farmerId) {
      this.emit('farmer:join', { farmerId: this.farmerId });
    }
  }

  /**
   * Subscribe to order updates for a specific order
   */
  subscribeToOrder(orderId: string): void {
    this.emit('order:track', { orderId });
  }

  /**
   * Unsubscribe from order updates
   */
  unsubscribeFromOrder(orderId: string): void {
    this.emit('order:untrack', { orderId });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Farmer socket connected');
      this.reconnectAttempts = 0;
      store.dispatch(setSocketConnected(true));

      // Join farmer room to receive order notifications
      this.joinFarmerRoom();

      // Re-register event handlers
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach(handler => {
          this.socket?.on(event, handler);
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Farmer socket disconnected:', reason);
      store.dispatch(setSocketConnected(false));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Farmer socket connection error:', error);
      this.reconnectAttempts++;
      store.dispatch(setSocketConnected(false));

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max farmer socket reconnection attempts reached');
        this.disconnect();
      }
    });

    // Handle new order notification
    this.socket.on('order:new', (data: {
      orderId: string;
      orderNumber: string;
      buyerName: string;
      itemCount: number;
      total: number;
      createdAt: string;
    }) => {
      console.log('New order received:', data);
      
      const notification: NewOrderNotification = {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        buyerName: data.buyerName,
        itemCount: data.itemCount,
        total: data.total,
        createdAt: data.createdAt,
      };
      
      store.dispatch(addNewOrderNotification(notification));
    });

    // Handle order status update
    this.socket.on('order:status', (data: {
      orderId: string;
      status: string;
      timestamp: string;
    }) => {
      console.log('Order status updated:', data);
      store.dispatch(updateOrderInList({
        orderId: data.orderId,
        status: data.status,
      }));
    });

    // Handle order cancelled
    this.socket.on('order:cancelled', (data: {
      orderId: string;
      reason?: string;
    }) => {
      console.log('Order cancelled:', data);
      store.dispatch(updateOrderInList({
        orderId: data.orderId,
        status: 'cancelled',
      }));
    });

    this.socket.on('error', (error) => {
      console.error('Farmer socket error:', error);
    });
  }
}

export const farmerSocketService = new FarmerSocketService();
