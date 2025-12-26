import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import { store } from '../store';
import { SocketEvent } from '../types';

type EventHandler = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const state = store.getState();
    const token = state.auth.accessToken;

    if (!token) {
      console.warn('No auth token available for socket connection');
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
      this.eventHandlers.clear();
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Subscribe to an event
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
   * Emit an event
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Join a room (e.g., order-specific room)
   */
  joinRoom(room: string): void {
    this.emit('join', { room });
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.emit('leave', { room });
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrder(orderId: string, handler: (event: SocketEvent) => void): void {
    const room = `order:${orderId}`;
    this.joinRoom(room);
    
    // Listen for all order-related events
    this.on('order:status', (data: any) => {
      if (data.orderId === orderId) {
        handler({ type: 'order:status', data });
      }
    });
    this.on('order:assigned', (data: any) => {
      if (data.orderId === orderId) {
        handler({ type: 'order:assigned', data });
      }
    });
    this.on('rider:location', (data: any) => {
      if (data.orderId === orderId) {
        handler({ type: 'rider:location', data });
      }
    });
  }

  /**
   * Unsubscribe from order updates
   */
  unsubscribeFromOrder(orderId: string, handler?: (event: SocketEvent) => void): void {
    const room = `order:${orderId}`;
    this.leaveRoom(room);
    this.off('order:status');
    this.off('order:assigned');
    this.off('rider:location');
  }

  /**
   * Subscribe to rider location updates
   */
  subscribeToRiderLocation(riderId: string, handler: EventHandler): void {
    const event = `rider.${riderId}.location`;
    this.on(event, handler);
  }

  /**
   * Unsubscribe from rider location updates
   */
  unsubscribeFromRiderLocation(riderId: string, handler?: EventHandler): void {
    const event = `rider.${riderId}.location`;
    this.off(event, handler);
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
      console.log('Socket connected');
      this.reconnectAttempts = 0;

      // Re-register event handlers
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach(handler => {
          this.socket?.on(event, handler);
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle order events
    this.socket.on('order:created', (data) => {
      console.log('Order created:', data);
    });

    this.socket.on('order:rider_assigned', (data) => {
      console.log('Rider assigned to order:', data);
    });

    this.socket.on('order:status_update', (data) => {
      console.log('Order status updated:', data);
    });

    this.socket.on('eta:update', (data) => {
      console.log('ETA updated:', data);
    });
  }
}

export const socketService = new SocketService();
