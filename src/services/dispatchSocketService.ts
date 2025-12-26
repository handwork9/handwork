import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import { store } from '../store';
import { addDeliveryOffer, removeDeliveryOffer, setDispatchConnected, setActiveDelivery } from '../store/slices/riderSlice';

export interface DeliveryOffer {
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: string;
  estimatedEta: number;
  totalAmount: number;
  earnings: number;
  timeoutSeconds: number;
  farmerName?: string;
  buyerName?: string;
  items?: number;
  pickupLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
}

type EventHandler = (data: any) => void;

class DispatchSocketService {
  private socket: Socket | null = null;
  private riderId: string | null = null;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private offerTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Connect to dispatch WebSocket server
   */
  connect(riderId: string): void {
    if (this.socket?.connected && this.riderId === riderId) {
      console.log('Dispatch socket already connected for rider:', riderId);
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    this.riderId = riderId;

    const state = store.getState();
    const token = state.auth.accessToken;

    if (!token) {
      console.warn('No auth token available for dispatch socket connection');
      return;
    }

    // Connect to dispatch namespace on port 3002
    // WS_URL is http://host:3001, we need to change to http://host:3002 for dispatch gateway
    const baseUrl = API_CONFIG.WS_URL
      .replace('ws://', 'http://')
      .replace('wss://', 'https://')
      .replace(/:30\d{2}/, ':3002'); // Dispatch runs on port 3002

    console.log('[DispatchSocket] Connecting to:', `${baseUrl}/dispatch`);

    this.socket = io(`${baseUrl}/dispatch`, {
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
   * Disconnect from dispatch WebSocket server
   */
  disconnect(): void {
    // Clear all offer timeouts
    this.offerTimeouts.forEach(timeout => clearTimeout(timeout));
    this.offerTimeouts.clear();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.riderId = null;
      this.eventHandlers.clear();
      this.reconnectAttempts = 0;
      store.dispatch(setDispatchConnected(false));
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
   * Emit an event to dispatch server
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Dispatch socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Accept a delivery offer
   */
  acceptOffer(orderId: string): void {
    if (!this.riderId) return;
    
    // Clear timeout for this offer
    const timeout = this.offerTimeouts.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      this.offerTimeouts.delete(orderId);
    }

    this.emit('offer:accept', { orderId, riderId: this.riderId });
    store.dispatch(removeDeliveryOffer(orderId));
  }

  /**
   * Decline a delivery offer
   */
  declineOffer(orderId: string, reason?: string): void {
    if (!this.riderId) return;
    
    // Clear timeout for this offer
    const timeout = this.offerTimeouts.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      this.offerTimeouts.delete(orderId);
    }

    this.emit('offer:decline', { orderId, riderId: this.riderId, reason });
    store.dispatch(removeDeliveryOffer(orderId));
  }

  /**
   * Update rider location via WebSocket
   */
  updateLocation(latitude: number, longitude: number): void {
    if (!this.riderId) return;
    this.emit('location:update', { riderId: this.riderId, lat: latitude, lng: longitude });
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
      console.log('Dispatch socket connected');
      this.reconnectAttempts = 0;
      store.dispatch(setDispatchConnected(true));

      // Join dispatch channel as rider
      if (this.riderId) {
        this.emit('rider:join', { riderId: this.riderId });
      }

      // Re-register event handlers
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach(handler => {
          this.socket?.on(event, handler);
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Dispatch socket disconnected:', reason);
      store.dispatch(setDispatchConnected(false));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Dispatch socket connection error:', error);
      this.reconnectAttempts++;
      store.dispatch(setDispatchConnected(false));

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max dispatch reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('dispatch:joined', (data) => {
      console.log('Successfully joined dispatch channel:', data);
    });

    // Handle delivery offers
    this.socket.on('order:offer', (offer: DeliveryOffer) => {
      console.log('Received delivery offer:', offer);
      
      // Add offer to Redux store
      store.dispatch(addDeliveryOffer(offer));

      // Set timeout to auto-decline if not responded
      if (offer.timeoutSeconds && offer.timeoutSeconds > 0) {
        const timeout = setTimeout(() => {
          console.log('Offer timed out:', offer.orderId);
          store.dispatch(removeDeliveryOffer(offer.orderId));
          this.offerTimeouts.delete(offer.orderId);
        }, offer.timeoutSeconds * 1000);
        
        this.offerTimeouts.set(offer.orderId, timeout);
      }
    });

    // Handle order assignment confirmation
    this.socket.on('order:assigned', (data) => {
      console.log('Order assigned:', data);
      // Trigger fetch of active delivery
      store.dispatch(setActiveDelivery(data));
    });

    // Handle offer accepted confirmation
    this.socket.on('offer:accepted', (data) => {
      console.log('Offer accepted confirmation:', data);
    });

    // Handle offer declined confirmation
    this.socket.on('offer:declined', (data) => {
      console.log('Offer declined confirmation:', data);
    });

    this.socket.on('error', (error) => {
      console.error('Dispatch socket error:', error);
    });
  }
}

export const dispatchSocketService = new DispatchSocketService();
