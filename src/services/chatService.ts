import apiClient from './apiClient';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import { store } from '../store';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole: 'buyer' | 'farmer' | 'rider';
  text: string;
  type: 'text' | 'image' | 'location' | 'order_update';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  metadata?: {
    imageUrl?: string;
    location?: { lat: number; lng: number };
    orderUpdate?: { status: string; message: string };
  };
  createdAt: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  orderId?: string;
  productId?: string;
  participants: {
    id: string;
    name: string;
    role: 'buyer' | 'farmer' | 'rider';
    phone?: string;
    avatar?: string;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  conversationId: string;
  text: string;
  type?: 'text' | 'image' | 'location';
  metadata?: {
    imageUrl?: string;
    location?: { lat: number; lng: number };
  };
}

export interface CreateConversationPayload {
  orderId?: string;
  productId?: string;
  participantId: string;
  participantRole: 'buyer' | 'farmer' | 'rider';
}

type MessageHandler = (message: ChatMessage) => void;
type TypingHandler = (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
type ConversationUpdateHandler = (data: { conversationId: string; lastMessage: ChatMessage }) => void;

// Get the WebSocket URL for chat
const getChatWsUrl = () => {
  // Use base URL without namespace - namespaces have deployment issues
  // Events are already prefixed with 'chat:' so no conflicts
  const baseUrl = API_CONFIG.WS_URL
    .replace('ws://', 'http://')
    .replace('wss://', 'https://');
  return baseUrl;
};

class ChatService {
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private typingHandlers: Map<string, TypingHandler[]> = new Map();
  private conversationUpdateHandlers: ConversationUpdateHandler[] = [];
  private socket: Socket | null = null;
  private isSocketSetup = false;
  private isConnecting = false;

  /**
   * Connect to chat WebSocket
   */
  private connectSocket(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    const state = store.getState();
    const token = state.auth.accessToken;
    const userId = state.auth.user?.id;

    if (!token || !userId) {
      console.warn('No auth token or user ID for chat socket connection');
      return;
    }

    this.isConnecting = true;

    this.socket = io(getChatWsUrl(), {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Chat socket connected');
      this.isConnecting = false;
      // Authenticate with user ID
      this.socket?.emit('chat:auth', { userId });
      // Setup listeners after connection
      this.setupSocketListeners();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Chat socket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error);
      this.isConnecting = false;
    });

    this.socket.on('chat:authenticated', (data) => {
      console.log('Chat authenticated:', data);
    });

    this.socket.on('chat:error', (data) => {
      console.error('Chat error:', data);
    });
  }

  /**
   * Disconnect from chat WebSocket
   */
  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isSocketSetup = false;
    }
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { conversations: Conversation[] } }>('/chat/conversations');
      return response.data.conversations;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  }

  /**
   * Get or create a conversation for an order or product
   */
  async getOrCreateConversation(
    participantId: string,
    participantRole: 'buyer' | 'farmer' | 'rider',
    options?: { orderId?: string; productId?: string }
  ): Promise<Conversation | null> {
    try {
      // Validate participantId is a non-empty string that looks like a UUID
      if (!participantId || participantId.trim() === '' || participantId.length < 32) {
        console.error('Invalid participantId:', participantId);
        return null;
      }
      
      console.log('getOrCreateConversation called:', { participantId, participantRole, options });
      const response = await apiClient.post<{ success: boolean; data: { conversation: Conversation } }>('/chat/conversations', {
        orderId: options?.orderId,
        productId: options?.productId,
        participantId,
        participantRole,
      });
      console.log('getOrCreateConversation response:', response);
      return response.data.conversation;
    } catch (error) {
      console.error('Failed to get/create conversation:', error);
      return null;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string }
  ): Promise<ChatMessage[]> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.before) params.append('before', options.before);

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<{ success: boolean; data: { messages: ChatMessage[] } }>(
        `/chat/conversations/${conversationId}/messages${query}`
      );
      return response.data.messages;
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Send a message
   */
  async sendMessage(payload: SendMessagePayload): Promise<ChatMessage | null> {
    try {
      console.log('sendMessage called:', payload);
      const response = await apiClient.post<{ success: boolean; data: { message: ChatMessage } }>(
        `/chat/conversations/${payload.conversationId}/messages`,
        {
          text: payload.text,
          type: payload.type || 'text',
          metadata: payload.metadata,
        }
      );
      console.log('sendMessage response:', response);
      return response.data.message;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, messageIds?: string[]): Promise<boolean> {
    try {
      await apiClient.patch(`/chat/conversations/${conversationId}/read`, {
        messageIds,
      });
      return true;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      return false;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/chat/conversations/${conversationId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  /**
   * Mute/unmute a conversation
   */
  async muteConversation(conversationId: string, muted: boolean): Promise<boolean> {
    try {
      await apiClient.patch(`/chat/conversations/${conversationId}/mute`, { muted });
      return true;
    } catch (error) {
      console.error('Failed to mute/unmute conversation:', error);
      return false;
    }
  }

  /**
   * Get online status for a list of users
   */
  async getOnlineStatus(userIds: string[]): Promise<Record<string, boolean>> {
    try {
      const response = await apiClient.post<{ onlineStatus: Record<string, boolean> }>(
        '/chat/online-status',
        { userIds }
      );
      return response.data?.onlineStatus || {};
    } catch (error) {
      console.error('Failed to get online status:', error);
      return {};
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('chat:typing', { conversationId, isTyping });
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(conversationId: string, handler: MessageHandler): void {
    // Ensure socket is connected
    this.connectSocket();
    // Listeners are set up on connect event

    if (!this.messageHandlers.has(conversationId)) {
      this.messageHandlers.set(conversationId, []);
    }
    this.messageHandlers.get(conversationId)!.push(handler);

    // Join the conversation room once socket is connected
    const joinRoom = () => {
      if (this.socket?.connected) {
        this.socket.emit('chat:join', { conversationId });
      } else {
        // Retry after a short delay if not connected yet
        setTimeout(joinRoom, 500);
      }
    };
    joinRoom();
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribeFromMessages(conversationId: string, handler?: MessageHandler): void {
    if (handler) {
      const handlers = this.messageHandlers.get(conversationId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.messageHandlers.delete(conversationId);
    }

    // Leave the conversation room if no more handlers
    if (!this.messageHandlers.get(conversationId)?.length) {
      if (this.socket?.connected) {
        this.socket.emit('chat:leave', { conversationId });
      }
    }
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(conversationId: string, handler: TypingHandler): void {
    this.connectSocket();
    // Listeners are set up on connect event

    if (!this.typingHandlers.has(conversationId)) {
      this.typingHandlers.set(conversationId, []);
    }
    this.typingHandlers.get(conversationId)!.push(handler);
  }

  /**
   * Unsubscribe from typing indicators
   */
  unsubscribeFromTyping(conversationId: string, handler?: TypingHandler): void {
    if (handler) {
      const handlers = this.typingHandlers.get(conversationId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.typingHandlers.delete(conversationId);
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (this.isSocketSetup || !this.socket) return;
    this.isSocketSetup = true;

    // Listen for new messages
    this.socket.on('chat:message', (message: ChatMessage) => {
      console.log('Received chat message via socket:', message);
      const handlers = this.messageHandlers.get(message.conversationId);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      // Notify conversation update handlers
      this.conversationUpdateHandlers.forEach(handler => {
        handler({ conversationId: message.conversationId, lastMessage: message });
      });
    });

    // Listen for new message notifications (for when not in conversation room)
    this.socket.on('chat:new_message', (data: { conversationId: string; message: any }) => {
      console.log('Received new message notification:', data);
      const handlers = this.messageHandlers.get(data.conversationId);
      if (handlers) {
        handlers.forEach(handler => handler(data.message));
      }
      // Notify conversation update handlers
      this.conversationUpdateHandlers.forEach(handler => {
        handler({ conversationId: data.conversationId, lastMessage: data.message });
      });
    });

    // Listen for message status updates
    this.socket.on('chat:message_status', (data: { messageId: string; conversationId: string; status: string }) => {
      console.log('Message status update:', data);
    });

    // Listen for typing indicators
    this.socket.on('chat:typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      const handlers = this.typingHandlers.get(data.conversationId);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    });

    // Listen for joined confirmation
    this.socket.on('chat:joined', (data: { conversationId: string }) => {
      console.log('Joined conversation room:', data.conversationId);
    });
  }

  /**
   * Subscribe to conversation list updates (new messages in any conversation)
   * This is used by MessagesScreen to update the conversation list when new messages arrive
   */
  subscribeToConversationUpdates(handler: ConversationUpdateHandler): void {
    this.connectSocket();
    // Listeners are set up on connect event, no need to call here
    this.conversationUpdateHandlers.push(handler);
  }

  /**
   * Unsubscribe from conversation list updates
   */
  unsubscribeFromConversationUpdates(handler: ConversationUpdateHandler): void {
    const index = this.conversationUpdateHandlers.indexOf(handler);
    if (index > -1) {
      this.conversationUpdateHandlers.splice(index, 1);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.messageHandlers.forEach((_, conversationId) => {
      if (this.socket?.connected) {
        this.socket.emit('chat:leave', { conversationId });
      }
    });
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.conversationUpdateHandlers.length = 0;
    this.disconnectSocket();
  }
}

export const chatService = new ChatService();
