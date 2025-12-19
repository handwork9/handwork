'use client';

import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import Cookies from 'js-cookie';
import { useNotificationStore } from './notificationStore';

// Support socket runs on port 3003 - extract base URL and use correct port
const getSocketUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  // Replace any port with 3003 for support socket
  return baseUrl.replace(/:\d+/, ':3003');
};
const SUPPORT_SOCKET_URL = getSocketUrl();

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  subject: string;
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order' | 'payment' | 'delivery' | 'account' | 'product' | 'refund' | 'technical' | 'other';
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar?: string;
    role: string;
  };
  unreadCount: number;
  lastMessageAt?: string;
  lastMessage?: string;
  rating?: number;
  feedback?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
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

interface SupportSocketState {
  socket: Socket | null;
  isConnected: boolean;
  tickets: SupportTicket[];
  activeTicket: SupportTicket | null;
  messages: SupportMessage[];
  typingUsers: Record<string, boolean>;
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
  sendMessage: (ticketId: string, content: string, type?: string) => void;
  sendTyping: (ticketId: string, isTyping: boolean) => void;
  setActiveTicket: (ticket: SupportTicket | null) => void;
  setMessages: (messages: SupportMessage[]) => void;
  addMessage: (message: SupportMessage) => void;
  updateTicket: (ticket: SupportTicket) => void;
  setTickets: (tickets: SupportTicket[]) => void;
}

export const useSupportSocketStore = create<SupportSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  tickets: [],
  activeTicket: null,
  messages: [],
  typingUsers: {},
  unreadCount: 0,

  connect: () => {
    const token = Cookies.get('admin_token');
    if (!token) return;

    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    const socket = io(`${SUPPORT_SOCKET_URL}/support`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Support] Socket connected');
      // Authenticate as admin
      socket.emit('support:admin_auth');
    });

    socket.on('support:authenticated', () => {
      console.log('[Support] Admin authenticated');
      set({ isConnected: true });
    });

    socket.on('support:new_ticket', (data: { ticket: SupportTicket }) => {
      console.log('[Support] New ticket:', data.ticket.ticketNumber);
      set((state) => ({
        tickets: [data.ticket, ...state.tickets],
        unreadCount: state.unreadCount + 1,
      }));
      
      // Add notification for new ticket
      useNotificationStore.getState().addNotification({
        type: 'support_ticket',
        title: '🎫 New Support Ticket',
        message: `${data.ticket.user?.name || 'A user'} opened ticket #${data.ticket.ticketNumber}: ${data.ticket.subject}`,
        data: {
          ticketId: data.ticket.id,
          ticketNumber: data.ticket.ticketNumber,
          userId: data.ticket.userId,
          userName: data.ticket.user?.name,
        },
      });
    });

    socket.on('support:message', (data: { ticketId: string; message: SupportMessage }) => {
      const { activeTicket, messages } = get();
      if (activeTicket?.id === data.ticketId) {
        // Check for duplicate message by id
        if (!messages.some(m => m.id === data.message.id)) {
          set((state) => ({
            messages: [...state.messages, data.message],
          }));
        }
      }
      // Update ticket's last message
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === data.ticketId
            ? { 
                ...t, 
                lastMessage: data.message.content,
                lastMessageAt: data.message.createdAt,
                unreadCount: activeTicket?.id === data.ticketId ? t.unreadCount : t.unreadCount + 1,
              }
            : t
        ),
      }));
      
      // Add notification for new message (only from users, not agents)
      if (data.message.senderType === 'user' && activeTicket?.id !== data.ticketId) {
        const ticket = get().tickets.find(t => t.id === data.ticketId);
        useNotificationStore.getState().addNotification({
          type: 'support_message',
          title: '💬 New Support Message',
          message: `${data.message.sender?.name || 'User'}: ${data.message.content.substring(0, 50)}${data.message.content.length > 50 ? '...' : ''}`,
          data: {
            ticketId: data.ticketId,
            ticketNumber: ticket?.ticketNumber,
            userId: data.message.senderId,
            userName: data.message.sender?.name,
          },
        });
      }
    });

    socket.on('support:typing', (data: { ticketId: string; userId: string; isTyping: boolean; isAdmin: boolean }) => {
      if (!data.isAdmin) {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [data.userId]: data.isTyping,
          },
        }));
      }
    });

    socket.on('support:status_changed', (data: { ticketId: string; status: string }) => {
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === data.ticketId ? { ...t, status: data.status as SupportTicket['status'] } : t
        ),
        activeTicket: state.activeTicket?.id === data.ticketId 
          ? { ...state.activeTicket, status: data.status as SupportTicket['status'] }
          : state.activeTicket,
      }));
    });

    socket.on('support:ticket_assigned', (data: { ticketId: string; adminId: string; adminName: string }) => {
      set((state) => ({
        tickets: state.tickets.map((t) =>
          t.id === data.ticketId
            ? { ...t, assignedToId: data.adminId, assignedTo: { id: data.adminId, name: data.adminName } }
            : t
        ),
      }));
    });

    socket.on('disconnect', () => {
      console.log('[Support] Socket disconnected');
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('[Support] Connection error:', error.message);
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

  joinTicket: (ticketId: string) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('support:admin_join', { ticketId });
    }
  },

  leaveTicket: (ticketId: string) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('support:leave', { ticketId });
    }
  },

  sendMessage: (ticketId: string, content: string, type = 'text') => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('support:admin_message', { ticketId, content, type });
    }
  },

  sendTyping: (ticketId: string, isTyping: boolean) => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('support:typing', { ticketId, isTyping });
    }
  },

  setActiveTicket: (ticket) => set({ activeTicket: ticket }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateTicket: (ticket) =>
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticket.id ? ticket : t)),
      activeTicket: state.activeTicket?.id === ticket.id ? ticket : state.activeTicket,
    })),
  setTickets: (tickets) => set({ tickets, unreadCount: tickets.filter(t => t.status === 'open').length }),
}));
