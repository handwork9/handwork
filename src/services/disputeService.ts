import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import apiClient from './apiClient';
import { store } from '../store';

export type DisputeStatus = 'open' | 'under_review' | 'awaiting_response' | 'resolved' | 'closed' | 'escalated';

export type DisputeType = 
  | 'product_quality'
  | 'missing_items'
  | 'wrong_items'
  | 'late_delivery'
  | 'damaged_products'
  | 'refund_request'
  | 'overcharge'
  | 'rider_issue'
  | 'farmer_issue'
  | 'other';

export type DisputePriority = 'low' | 'medium' | 'high' | 'urgent';

export type DisputeResolution = 'full_refund' | 'partial_refund' | 'replacement' | 'credit' | 'no_action' | 'other';

export interface Dispute {
  id: string;
  disputeNumber: string;
  userId: string;
  orderId: string;
  type: DisputeType;
  status: DisputeStatus;
  priority: DisputePriority;
  subject: string;
  description: string;
  images?: string[];
  requestedAmount?: number;
  resolution?: DisputeResolution;
  refundedAmount?: number;
  resolutionNotes?: string;
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    items: any[];
  };
  messages?: DisputeMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'system' | 'farmer' | 'rider';
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface CreateDisputeData {
  orderId: string;
  type: DisputeType;
  subject: string;
  description: string;
  images?: string[];
  requestedAmount?: number;
}

type MessageHandler = (message: DisputeMessage) => void;
type TypingHandler = (data: { disputeId: string; userId: string; isTyping: boolean; isAdmin: boolean }) => void;
type StatusHandler = (data: { disputeId: string; status: DisputeStatus; resolution?: DisputeResolution }) => void;

class DisputeService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private typingHandlers: Map<string, Set<TypingHandler>> = new Map();
  private statusHandlers: Map<string, Set<StatusHandler>> = new Map();
  private isConnecting = false;
  private currentDisputeId: string | null = null;

  /**
   * Get the WebSocket URL for disputes
   */
  private getDisputeWsUrl(): string {
    const baseUrl = API_CONFIG.WS_URL
      .replace('ws://', 'http://')
      .replace('wss://', 'https://')
      .replace(/:30\d{2}/, ':3003');
    return `${baseUrl}/disputes`;
  }

  /**
   * Connect to dispute WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log('[DisputeService] Already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('[DisputeService] Connection in progress, waiting...');
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        return;
      }

      this.isConnecting = true;
      const state = store.getState();
      const token = state.auth.accessToken;
      const userId = state.auth.user?.id;

      if (!token || !userId) {
        this.isConnecting = false;
        console.error('[DisputeService] Not authenticated - no token or userId');
        reject(new Error('Not authenticated'));
        return;
      }

      const wsUrl = this.getDisputeWsUrl();
      console.log('[DisputeService] Connecting to:', wsUrl);
      console.log('[DisputeService] userId:', userId);

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        console.error('[DisputeService] Connection timeout after 10s');
        this.isConnecting = false;
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket = io(wsUrl, {
        auth: { token, userId },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[DisputeService] Socket connected, socket.id:', this.socket?.id);
        console.log('[DisputeService] Sending dispute:auth...');
        // Send auth event to the server
        this.socket?.emit('dispute:auth', { userId, isAdmin: false });
      });

      this.socket.on('dispute:authenticated', (data: { success: boolean; userId: string }) => {
        clearTimeout(connectionTimeout);
        console.log('[DisputeService] Authenticated successfully:', data);
        this.isConnecting = false;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('[DisputeService] Connection error:', error.message);
        this.isConnecting = false;
        reject(error);
      });

      this.socket.on('error', (error: { message: string }) => {
        console.error('[DisputeService] Socket error:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[DisputeService] Disconnected:', reason);
      });

      this.socket.on('new_message', (message: DisputeMessage) => {
        console.log('[DisputeService] New message received:', message.id);
        const handlers = this.messageHandlers.get(message.disputeId);
        handlers?.forEach((handler) => handler(message));
      });

      this.socket.on('user_typing', (data: { disputeId: string; userId: string; isTyping: boolean; isAdmin: boolean }) => {
        const handlers = this.typingHandlers.get(data.disputeId);
        handlers?.forEach((handler) => handler(data));
      });

      this.socket.on('status_changed', (data: { disputeId: string; status: DisputeStatus; resolution?: DisputeResolution }) => {
        console.log('[DisputeService] Status changed:', data);
        const handlers = this.statusHandlers.get(data.disputeId);
        handlers?.forEach((handler) => handler(data));
      });

      this.socket.on('error', (error: { message: string }) => {
        console.error('[DisputeService] Socket error:', error.message);
      });
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      if (this.currentDisputeId) {
        this.socket.emit('leave_dispute', { disputeId: this.currentDisputeId });
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentDisputeId = null;
    this.isConnecting = false;
  }

  /**
   * Join a dispute chat
   */
  async joinDispute(disputeId: string): Promise<Dispute> {
    await this.connect();

    if (this.currentDisputeId && this.currentDisputeId !== disputeId) {
      this.socket?.emit('leave_dispute', { disputeId: this.currentDisputeId });
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join_dispute', { disputeId });

      const timeout = setTimeout(() => {
        reject(new Error('Join dispute timeout'));
      }, 10000);

      this.socket!.once('joined_dispute', (data: { disputeId: string; dispute: Dispute }) => {
        clearTimeout(timeout);
        this.currentDisputeId = data.disputeId;
        console.log('[DisputeService] Joined dispute:', data.disputeId);
        resolve(data.dispute);
      });

      this.socket!.once('error', (error: { message: string }) => {
        clearTimeout(timeout);
        reject(new Error(error.message));
      });
    });
  }

  /**
   * Leave current dispute chat
   */
  leaveDispute(): void {
    if (this.socket && this.currentDisputeId) {
      this.socket.emit('leave_dispute', { disputeId: this.currentDisputeId });
      this.currentDisputeId = null;
    }
  }

  /**
   * Send message in dispute
   */
  async sendMessage(disputeId: string, content: string, attachments?: string[]): Promise<DisputeMessage> {
    await this.connect();

    console.log('[DisputeService] sendMessage called with:', { disputeId, content, attachments });

    return new Promise((resolve, reject) => {
      const payload = { disputeId, content, attachments };
      console.log('[DisputeService] Emitting send_message with payload:', JSON.stringify(payload));
      
      this.socket!.emit(
        'send_message',
        payload,
        (response: { success: boolean; message?: DisputeMessage; error?: string }) => {
          console.log('[DisputeService] send_message response:', response);
          if (response.success && response.message) {
            resolve(response.message);
          } else {
            reject(new Error(response.error || 'Failed to send message'));
          }
        },
      );
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(disputeId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { disputeId, isTyping });
    }
  }

  /**
   * Register message handler
   */
  onMessage(disputeId: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(disputeId)) {
      this.messageHandlers.set(disputeId, new Set());
    }
    this.messageHandlers.get(disputeId)!.add(handler);

    return () => {
      this.messageHandlers.get(disputeId)?.delete(handler);
    };
  }

  /**
   * Register typing handler
   */
  onTyping(disputeId: string, handler: TypingHandler): () => void {
    if (!this.typingHandlers.has(disputeId)) {
      this.typingHandlers.set(disputeId, new Set());
    }
    this.typingHandlers.get(disputeId)!.add(handler);

    return () => {
      this.typingHandlers.get(disputeId)?.delete(handler);
    };
  }

  /**
   * Register status change handler
   */
  onStatusChange(disputeId: string, handler: StatusHandler): () => void {
    if (!this.statusHandlers.has(disputeId)) {
      this.statusHandlers.set(disputeId, new Set());
    }
    this.statusHandlers.get(disputeId)!.add(handler);

    return () => {
      this.statusHandlers.get(disputeId)?.delete(handler);
    };
  }

  // ============ REST API METHODS ============

  /**
   * Create a new dispute
   */
  async createDispute(data: CreateDisputeData): Promise<Dispute> {
    const response = await apiClient.post<{ success: boolean; data: Dispute }>('/disputes', data);
    return (response as any).data;
  }

  /**
   * Get user's disputes
   */
  async getMyDisputes(status?: DisputeStatus): Promise<{ success: boolean; data: Dispute[] }> {
    const params = status ? { status } : {};
    const response = await apiClient.get<{ success: boolean; data: Dispute[] }>('/disputes/my-disputes', { params });
    // Handle axios response wrapper
    const result = (response as any).data || response;
    return result;
  }

  /**
   * Get disputes for an order
   */
  async getOrderDisputes(orderId: string): Promise<Dispute[]> {
    const response = await apiClient.get<{ success: boolean; data: Dispute[] }>(`/disputes/order/${orderId}`);
    // Handle wrapped response: { success: true, data: [...] }
    const result = (response as any);
    console.log('[disputeService.getOrderDisputes] Raw response:', JSON.stringify(result, null, 2));
    
    let disputes: Dispute[] = [];
    
    if (result?.data && Array.isArray(result.data)) {
      disputes = result.data;
    } else if (result?.success && result?.data && Array.isArray(result.data)) {
      disputes = result.data;
    } else if (Array.isArray(result)) {
      disputes = result;
    }
    
    console.log('[disputeService.getOrderDisputes] Extracted disputes:', disputes.length);
    if (disputes.length > 0) {
      console.log('[disputeService.getOrderDisputes] First dispute id:', disputes[0]?.id);
    }
    
    return disputes;
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(disputeId: string): Promise<Dispute> {
    const response = await apiClient.get<{ success: boolean; data: Dispute }>(`/disputes/${disputeId}`);
    const result = (response as any);
    // Handle wrapped response
    if (result?.data?.id) {
      return result.data;
    }
    if (result?.success && result?.data) {
      return result.data;
    }
    return result;
  }

  /**
   * Send message via REST (fallback)
   */
  async sendMessageRest(disputeId: string, content: string, attachments?: string[]): Promise<DisputeMessage> {
    const response = await apiClient.post<{ success: boolean; data: DisputeMessage }>(
      `/disputes/${disputeId}/messages`,
      { content, attachments },
    );
    // apiClient already extracts response.data, so response here is { success: boolean, data: DisputeMessage }
    return (response as { success: boolean; data: DisputeMessage }).data;
  }

  /**
   * Get farmer's disputes (disputes involving their products)
   */
  async getFarmerDisputes(status?: DisputeStatus): Promise<{ success: boolean; data: Dispute[] }> {
    const params = status ? { status } : {};
    const response = await apiClient.get<{ success: boolean; data: Dispute[] }>('/disputes/farmer/my-disputes', { params });
    const result = (response as any).data || response;
    return result;
  }

  /**
   * Get rider's disputes (disputes involving their deliveries)
   */
  async getRiderDisputes(status?: DisputeStatus): Promise<{ success: boolean; data: Dispute[] }> {
    const params = status ? { status } : {};
    const response = await apiClient.get<{ success: boolean; data: Dispute[] }>('/disputes/rider/my-disputes', { params });
    const result = (response as any).data || response;
    return result;
  }
}

export const disputeService = new DisputeService();
export default disputeService;
