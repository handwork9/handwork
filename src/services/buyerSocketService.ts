import io, { Socket } from 'socket.io-client';
import { store } from '../store';
import {
  setSocketConnected,
  updateOrderStatus,
  updateRiderLocation,
  addMessageNotification,
  OrderStatusUpdate,
  NewMessageNotification,
} from '../store/slices/buyerSlice';
import { API_CONFIG } from '../constants/config';

class BuyerSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscribedOrders: Set<string> = new Set();
  private subscribedConversations: Set<string> = new Set();

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('[BuyerSocket] Already connected');
      return;
    }

    // Connect to the dispatch namespace for order tracking
    // Use WS_URL if available, otherwise construct from BASE_URL
    let socketUrl: string;
    if (API_CONFIG.WS_URL) {
      socketUrl = API_CONFIG.WS_URL
        .replace('ws://', 'http://')
        .replace('wss://', 'https://') + '/dispatch';
    } else {
      // Fallback: construct from BASE_URL
      const baseUrl = API_CONFIG.BASE_URL
        .replace('/api/v1', '')
        .replace('/api', '');
      socketUrl = `${baseUrl}/dispatch`;
    }
    
    console.log('[BuyerSocket] Connecting to:', socketUrl);
    
    this.socket = io(socketUrl, {
      auth: {
        userId,
        role: 'buyer',
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[BuyerSocket] Connected');
      store.dispatch(setSocketConnected(true));
      this.reconnectAttempts = 0;
      
      // Re-subscribe to orders and conversations
      this.subscribedOrders.forEach(orderId => {
        this.socket?.emit('order:track', { orderId });
      });
      this.subscribedConversations.forEach(conversationId => {
        this.socket?.emit('conversation:subscribe', { conversationId });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[BuyerSocket] Disconnected:', reason);
      store.dispatch(setSocketConnected(false));
    });

    this.socket.on('connect_error', (error) => {
      console.error('[BuyerSocket] Connection error:', error.message);
      this.reconnectAttempts++;
      
      // If we've exhausted reconnect attempts, give up gracefully
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('[BuyerSocket] Max reconnect attempts reached, disabling socket');
        this.disconnect();
      }
    });

    // Order status updates
    this.socket.on('order:status', (data: {
      orderId: string;
      status: string;
      updatedAt: string;
      riderName?: string;
      riderPhone?: string;
      estimatedDelivery?: string;
    }) => {
      console.log('[BuyerSocket] Order status update:', data);
      const update: OrderStatusUpdate = {
        orderId: data.orderId,
        status: data.status as any,
        updatedAt: data.updatedAt,
        riderName: data.riderName,
        riderPhone: data.riderPhone,
        estimatedDelivery: data.estimatedDelivery,
      };
      store.dispatch(updateOrderStatus(update));
    });

    // Rider assigned to order
    this.socket.on('order:rider_assigned', (data: {
      orderId: string;
      riderId: string;
      riderName: string;
      riderPhone: string;
      estimatedPickup: string;
    }) => {
      console.log('[BuyerSocket] Rider assigned:', data);
      store.dispatch(updateOrderStatus({
        orderId: data.orderId,
        status: 'rider_assigned',
        updatedAt: new Date().toISOString(),
        riderName: data.riderName,
        riderPhone: data.riderPhone,
      }));
    });

    // Rider location updates (for tracking)
    this.socket.on('rider:location', (data: {
      orderId: string;
      lat: number;
      lng: number;
      eta?: string;
    }) => {
      store.dispatch(updateRiderLocation(data));
    });

    // Order delivered
    this.socket.on('order:delivered', (data: {
      orderId: string;
      deliveredAt: string;
    }) => {
      console.log('[BuyerSocket] Order delivered:', data);
      store.dispatch(updateOrderStatus({
        orderId: data.orderId,
        status: 'delivered',
        updatedAt: data.deliveredAt,
      }));
    });

    // Order cancelled
    this.socket.on('order:cancelled', (data: {
      orderId: string;
      reason?: string;
      cancelledAt: string;
    }) => {
      console.log('[BuyerSocket] Order cancelled:', data);
      store.dispatch(updateOrderStatus({
        orderId: data.orderId,
        status: 'cancelled',
        updatedAt: data.cancelledAt,
      }));
    });

    // New message notification
    this.socket.on('message:new', (data: {
      conversationId: string;
      senderId: string;
      senderName: string;
      content: string;
      timestamp: string;
    }) => {
      console.log('[BuyerSocket] New message:', data);
      const notification: NewMessageNotification = {
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        preview: data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content,
        timestamp: data.timestamp,
        unread: true,
      };
      store.dispatch(addMessageNotification(notification));
    });

    // Typing indicator (for UI if needed)
    this.socket.on('message:typing', (data: {
      conversationId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      // This can be handled by component state
      console.log('[BuyerSocket] Typing:', data);
    });
  }

  // Subscribe to order updates
  subscribeToOrder(orderId: string) {
    if (this.socket?.connected) {
      this.socket.emit('order:track', { orderId });
      this.subscribedOrders.add(orderId);
      console.log('[BuyerSocket] Subscribed to order:', orderId);
    }
  }

  // Unsubscribe from order updates
  unsubscribeFromOrder(orderId: string) {
    if (this.socket?.connected) {
      this.socket.emit('order:untrack', { orderId });
      this.subscribedOrders.delete(orderId);
      console.log('[BuyerSocket] Unsubscribed from order:', orderId);
    }
  }

  // Subscribe to conversation updates
  subscribeToConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:subscribe', { conversationId });
      this.subscribedConversations.add(conversationId);
      console.log('[BuyerSocket] Subscribed to conversation:', conversationId);
    }
  }

  // Unsubscribe from conversation updates
  unsubscribeFromConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:unsubscribe', { conversationId });
      this.subscribedConversations.delete(conversationId);
      console.log('[BuyerSocket] Unsubscribed from conversation:', conversationId);
    }
  }

  // Send typing indicator
  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('message:typing', { conversationId, isTyping });
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.subscribedOrders.clear();
      this.subscribedConversations.clear();
      this.socket.disconnect();
      this.socket = null;
      store.dispatch(setSocketConnected(false));
      console.log('[BuyerSocket] Disconnected');
    }
  }
}

export const buyerSocketService = new BuyerSocketService();
