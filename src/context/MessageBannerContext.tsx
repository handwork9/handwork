import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import { useAppSelector } from '../store';
import { MessageNotification } from '../components/common/MessageBanner';

interface MessageBannerContextType {
  currentNotification: MessageNotification | null;
  showNotification: (notification: MessageNotification) => void;
  dismissNotification: () => void;
  /** Current conversation ID to prevent showing notifications for the active chat */
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

const MessageBannerContext = createContext<MessageBannerContextType | undefined>(undefined);

export const useMessageBanner = () => {
  const context = useContext(MessageBannerContext);
  if (!context) {
    throw new Error('useMessageBanner must be used within a MessageBannerProvider');
  }
  return context;
};

interface MessageBannerProviderProps {
  children: React.ReactNode;
}

export const MessageBannerProvider: React.FC<MessageBannerProviderProps> = ({
  children,
}) => {
  const [currentNotification, setCurrentNotification] = useState<MessageNotification | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const notificationQueue = useRef<MessageNotification[]>([]);
  const { user, isAuthenticated, accessToken } = useAppSelector((state) => state.auth);

  const showNotification = useCallback((notification: MessageNotification) => {
    // Don't show notification if user is viewing this conversation
    if (notification.conversationId === activeConversationId) {
      return;
    }

    // Don't show notification for own messages
    if (notification.senderId === user?.id) {
      return;
    }

    // If there's already a notification showing, queue this one
    if (currentNotification) {
      notificationQueue.current.push(notification);
    } else {
      setCurrentNotification(notification);
    }
  }, [activeConversationId, currentNotification, user?.id]);

  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);
    
    // Show next notification in queue if any
    if (notificationQueue.current.length > 0) {
      const nextNotification = notificationQueue.current.shift();
      if (nextNotification) {
        // Small delay before showing next notification
        setTimeout(() => {
          setCurrentNotification(nextNotification);
        }, 300);
      }
    }
  }, []);

  // Get the WebSocket URL for chat (port 3002 with /chat namespace)
  const getChatWsUrl = () => {
    // Convert WS URL to HTTP for socket.io and change port to 3002
    const baseUrl = API_CONFIG.WS_URL
      .replace('ws://', 'http://')
      .replace('wss://', 'https://')
      .replace(/:300[01]/, ':3002');
    return `${baseUrl}/chat`;
  };

  // Listen for incoming messages via dedicated socket connection
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !accessToken) return;

    console.log('[MessageBanner] Setting up socket connection for notifications');

    // Create dedicated socket connection for notifications
    const socket: Socket = io(getChatWsUrl(), {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[MessageBanner] Socket connected');
      socket.emit('chat:auth', { userId: user.id });
    });

    socket.on('chat:authenticated', () => {
      console.log('[MessageBanner] Socket authenticated');
    });

    socket.on('disconnect', (reason) => {
      console.log('[MessageBanner] Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[MessageBanner] Socket connection error:', error.message);
    });

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      console.log('[MessageBanner] Received message:', data);
      
      // Handle different message formats
      const messageData = data.message || data;
      
      // Find sender info from participants or message data
      let senderName = messageData.senderName || 'Unknown';
      let senderAvatar = messageData.senderAvatar;
      let senderRole = messageData.senderRole;
      
      // If we have conversation with participants, extract sender info
      if (data.conversation?.participants) {
        const sender = data.conversation.participants.find(
          (p: any) => p.id === messageData.senderId
        );
        if (sender) {
          senderName = sender.name || senderName;
          senderAvatar = sender.avatar || senderAvatar;
          senderRole = sender.role || senderRole;
        }
      }

      const notification: MessageNotification = {
        id: messageData.id || Date.now().toString(),
        conversationId: messageData.conversationId || data.conversationId,
        senderId: messageData.senderId,
        senderName,
        senderAvatar,
        message: messageData.text || messageData.content || '',
        timestamp: new Date(messageData.createdAt || Date.now()),
        senderRole,
      };

      console.log('[MessageBanner] Showing notification:', notification);
      showNotification(notification);
    };

    // Subscribe to various message event names
    socket.on('chat:message', handleNewMessage);
    socket.on('chat:new_message', handleNewMessage);
    socket.on('message:received', handleNewMessage);
    socket.on('new_message', handleNewMessage);

    return () => {
      console.log('[MessageBanner] Cleaning up socket');
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:new_message', handleNewMessage);
      socket.off('message:received', handleNewMessage);
      socket.off('new_message', handleNewMessage);
      socket.disconnect();
    };
  }, [isAuthenticated, user?.id, accessToken, showNotification]);

  const value: MessageBannerContextType = {
    currentNotification,
    showNotification,
    dismissNotification,
    activeConversationId,
    setActiveConversationId,
  };

  return (
    <MessageBannerContext.Provider value={value}>
      {children}
    </MessageBannerContext.Provider>
  );
};

export default MessageBannerContext;
