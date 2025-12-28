import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import apiClient from './apiClient';
import { store } from '../store';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order' | 'payment' | 'delivery' | 'account' | 'product' | 'refund' | 'technical' | 'other';
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  unreadCount: number;
  lastMessageAt?: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'user' | 'agent' | 'system';
  content: string;
  type: 'text' | 'image' | 'file' | 'location' | 'system';
  attachments?: {
    url: string;
    type: string;
    name: string;
    size?: number;
  }[];
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
}

type MessageHandler = (message: SupportMessage) => void;
type TypingHandler = (data: { ticketId: string; userId: string; isTyping: boolean; isAdmin: boolean }) => void;
type StatusHandler = (data: { ticketId: string; status: string }) => void;

class SupportService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private typingHandlers: Map<string, Set<TypingHandler>> = new Map();
  private statusHandlers: Map<string, Set<StatusHandler>> = new Map();
  private isConnecting = false;
  private currentTicketId: string | null = null;

  /**
   * Get the WebSocket URL for support
   */
  private getSupportWsUrl(): string {
    // Convert WS URL to HTTP for socket.io
    const baseUrl = API_CONFIG.WS_URL
      .replace('ws://', 'http://')
      .replace('wss://', 'https://');
    return `${baseUrl}/support`;
  }

  /**
   * Connect to support WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
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
        reject(new Error('Not authenticated'));
        return;
      }

      this.socket = io(this.getSupportWsUrl(), {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('[Support] Socket connected');
        this.socket?.emit('support:auth', { userId });
      });

      this.socket.on('support:authenticated', () => {
        console.log('[Support] Authenticated');
        this.isConnecting = false;
        this.setupSocketListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Support] Connection error:', error.message);
        this.isConnecting = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Support] Disconnected:', reason);
      });
    });
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Remove any existing listeners to prevent duplicates
    this.socket.off('support:message');
    this.socket.off('support:typing');
    this.socket.off('support:status_changed');
    this.socket.off('support:ticket_assigned');

    // Handle incoming messages
    this.socket.on('support:message', (data: { ticketId: string; message: SupportMessage }) => {
      console.log('[Support] Received message:', data.ticketId, data.message?.id);
      const handlers = this.messageHandlers.get(data.ticketId);
      console.log('[Support] Message handlers for ticket:', data.ticketId, handlers?.size || 0);
      if (handlers) {
        handlers.forEach((handler) => handler(data.message));
      }
    });

    // Handle typing indicators
    this.socket.on('support:typing', (data: { ticketId: string; userId: string; isTyping: boolean; isAdmin: boolean }) => {
      const handlers = this.typingHandlers.get(data.ticketId);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }
    });

    // Handle status changes
    this.socket.on('support:status_changed', (data: { ticketId: string; status: string }) => {
      const handlers = this.statusHandlers.get(data.ticketId);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }
    });

    // Handle ticket assignment
    this.socket.on('support:ticket_assigned', (data: { ticketId: string; adminId: string }) => {
      console.log('[Support] Ticket assigned:', data);
    });
  }

  /**
   * Disconnect from support WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.statusHandlers.clear();
    this.currentTicketId = null;
  }

  /**
   * Start or continue a live chat session
   */
  async startChat(options?: {
    subject?: string;
    category?: string;
    orderId?: string;
    initialMessage?: string;
  }): Promise<{ ticket: SupportTicket; messages: SupportMessage[] }> {
    try {
      await this.connect();

      const response = await apiClient.post<{
        success: boolean;
        data: { ticket: SupportTicket };
      }>('/support/chat/start', {
        subject: options?.subject || 'Live Support Chat',
        category: options?.category || 'other',
        orderId: options?.orderId,
        initialMessage: options?.initialMessage,
      });

      const ticket = response.data.ticket;
      this.currentTicketId = ticket.id;

      // Join the ticket room
      console.log('[Support] Joining ticket room:', ticket.id, 'Socket connected:', this.socket?.connected);
      if (this.socket?.connected) {
        this.socket.emit('support:join', { ticketId: ticket.id });
      } else {
        console.warn('[Support] Socket not connected when trying to join room');
      }

      // Get existing messages
      const messagesResponse = await apiClient.get<{
        success: boolean;
        data: { messages: SupportMessage[] };
      }>(`/support/chat/${ticket.id}/messages`);

      return {
        ticket,
        messages: messagesResponse.data.messages,
      };
    } catch (error) {
      console.error('[Support] Failed to start chat:', error);
      throw error;
    }
  }

  /**
   * Get active chat session
   */
  async getActiveChat(): Promise<{ ticket: SupportTicket; messages: SupportMessage[] } | null> {
    try {
      await this.connect();

      const response = await apiClient.get<{
        success: boolean;
        data: { ticket: SupportTicket; messages: SupportMessage[] };
      }>('/support/chat/active');

      const { ticket, messages } = response.data;
      this.currentTicketId = ticket.id;

      // Join the ticket room
      console.log('[Support] Joining ticket room:', ticket.id, 'Socket connected:', this.socket?.connected);
      if (this.socket?.connected) {
        this.socket.emit('support:join', { ticketId: ticket.id });
      } else {
        console.warn('[Support] Socket not connected when trying to join room');
      }

      return { ticket, messages };
    } catch (error) {
      console.error('[Support] Failed to get active chat:', error);
      return null;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    ticketId: string, 
    content: string, 
    type: 'text' | 'image' | 'file' | 'location' = 'text',
    attachments?: { url: string; type: string; name: string; size?: number }[]
  ): Promise<SupportMessage> {
    try {
      const payload: {
        content: string;
        type: string;
        attachments?: { url: string; type: string; name: string; size?: number }[];
      } = {
        content,
        type,
      };

      // For image messages, add the URL as an attachment
      if (type === 'image' && content.startsWith('http')) {
        payload.attachments = [{
          url: content,
          type: 'image/jpeg',
          name: 'image.jpg',
        }];
      } else if (attachments) {
        payload.attachments = attachments;
      }

      console.log('[Support] Sending message payload:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post<{
        success: boolean;
        data: { message: SupportMessage };
      }>(`/support/chat/${ticketId}/messages`, payload);

      console.log('[Support] Message response:', JSON.stringify(response.data, null, 2));

      return response.data.message;
    } catch (error) {
      console.error('[Support] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(ticketId: string, isTyping: boolean): void {
    this.socket?.emit('support:typing', { ticketId, isTyping });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(ticketId: string, messageIds?: string[]): Promise<void> {
    try {
      await apiClient.patch(`/support/chat/${ticketId}/read`, { messageIds });
    } catch (error) {
      console.error('[Support] Failed to mark as read:', error);
    }
  }

  /**
   * End chat session
   */
  async endChat(ticketId: string, rating?: number, feedback?: string): Promise<void> {
    try {
      await apiClient.post(`/support/chat/${ticketId}/end`, { rating, feedback });
      
      // Leave the ticket room
      this.socket?.emit('support:leave', { ticketId });
      this.currentTicketId = null;
    } catch (error) {
      console.error('[Support] Failed to end chat:', error);
      throw error;
    }
  }

  /**
   * Get user's ticket history
   */
  async getTicketHistory(): Promise<SupportTicket[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { tickets: SupportTicket[] };
      }>('/support/tickets');

      return response.data.tickets;
    } catch (error) {
      console.error('[Support] Failed to get ticket history:', error);
      return [];
    }
  }

  /**
   * Subscribe to messages for a ticket
   */
  subscribeToMessages(ticketId: string, handler: MessageHandler): void {
    console.log('[Support] Subscribing to messages for ticket:', ticketId);
    if (!this.messageHandlers.has(ticketId)) {
      this.messageHandlers.set(ticketId, new Set());
    }
    this.messageHandlers.get(ticketId)!.add(handler);
    console.log('[Support] Total handlers for ticket:', ticketId, this.messageHandlers.get(ticketId)?.size);
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribeFromMessages(ticketId: string, handler?: MessageHandler): void {
    if (handler) {
      this.messageHandlers.get(ticketId)?.delete(handler);
    } else {
      this.messageHandlers.delete(ticketId);
    }
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(ticketId: string, handler: TypingHandler): void {
    if (!this.typingHandlers.has(ticketId)) {
      this.typingHandlers.set(ticketId, new Set());
    }
    this.typingHandlers.get(ticketId)!.add(handler);
  }

  /**
   * Unsubscribe from typing indicators
   */
  unsubscribeFromTyping(ticketId: string, handler?: TypingHandler): void {
    if (handler) {
      this.typingHandlers.get(ticketId)?.delete(handler);
    } else {
      this.typingHandlers.delete(ticketId);
    }
  }

  /**
   * Subscribe to status changes
   */
  subscribeToStatus(ticketId: string, handler: StatusHandler): void {
    if (!this.statusHandlers.has(ticketId)) {
      this.statusHandlers.set(ticketId, new Set());
    }
    this.statusHandlers.get(ticketId)!.add(handler);
  }

  /**
   * Unsubscribe from status changes
   */
  unsubscribeFromStatus(ticketId: string, handler?: StatusHandler): void {
    if (handler) {
      this.statusHandlers.get(ticketId)?.delete(handler);
    } else {
      this.statusHandlers.delete(ticketId);
    }
  }

  /**
   * Submit a report
   */
  async submitReport(data: {
    type: 'inappropriate_behavior' | 'technical_problem' | 'spam' | 'other';
    ticketId?: string;
    description?: string;
  }): Promise<{ report: any }> {
    const response = await apiClient.post('/support/reports', data);
    return response.data;
  }

  /**
   * Get user's own submitted reports
   */
  async getMyReports(filters?: {
    status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    page?: number;
    limit?: number;
  }): Promise<{
    reports: SupportReport[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: { reports: SupportReport[]; total: number; page: number; limit: number };
    }>(`/support/reports/my?${params.toString()}`);

    return response.data.data;
  }

  /**
   * Get details of a specific report
   */
  async getMyReportById(reportId: string): Promise<SupportReport> {
    const response = await apiClient.get<{
      success: boolean;
      data: { report: SupportReport };
    }>(`/support/reports/my/${reportId}`);

    return response.data.data.report;
  }
}

// Add SupportReport interface for type safety
export interface SupportReport {
  id: string;
  userId: string;
  ticketId?: string;
  ticket?: {
    id: string;
    ticketNumber: string;
    subject: string;
  };
  type: 'inappropriate_behavior' | 'technical_problem' | 'spam' | 'other';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  description?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewer?: {
    id: string;
    name: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const supportService = new SupportService();
export default supportService;
