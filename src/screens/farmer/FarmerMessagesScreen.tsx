import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { chatService, Conversation as ApiConversation, ChatMessage } from '../../services/chatService';
import { useAppSelector } from '../../store';
import { 
  EmptyMessagesIllustration, 
  NoSearchResultsIllustration,
  OfflineIllustration 
} from '../../assets/illustrations/messages';

interface Conversation {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  buyerPhone?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: Date;
  productId?: string;
  productName?: string;
  orderId?: string;
  isTyping?: boolean;
  isPinned?: boolean;
}

// Swipe action colors
const SWIPE_COLORS = {
  delete: '#FF3B30',
  archive: '#FF9500',
  pin: '#007AFF',
  mute: '#8E8E93',
};

export default function FarmerMessagesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentUser = useAppSelector(state => state.auth.user);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [pinnedConversations, setPinnedConversations] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(true);

  // Storage keys
  const ARCHIVED_IDS_KEY = '@farmer_archived_conversation_ids';
  const PINNED_IDS_KEY = '@farmer_pinned_conversation_ids';

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const [archivedData, pinnedData] = await Promise.all([
          AsyncStorage.getItem(ARCHIVED_IDS_KEY),
          AsyncStorage.getItem(PINNED_IDS_KEY),
        ]);
        
        if (archivedData) {
          setArchivedIds(new Set(JSON.parse(archivedData)));
        }
        if (pinnedData) {
          setPinnedConversations(new Set(JSON.parse(pinnedData)));
        }
      } catch (error) {
        console.error('Failed to load persisted data:', error);
      }
    };
    loadPersistedData();
  }, []);

  // Persist archived IDs when they change
  useEffect(() => {
    const persistArchivedIds = async () => {
      try {
        await AsyncStorage.setItem(ARCHIVED_IDS_KEY, JSON.stringify([...archivedIds]));
      } catch (error) {
        console.error('Failed to persist archived IDs:', error);
      }
    };
    if (archivedIds.size > 0 || archivedConversations.length === 0) {
      persistArchivedIds();
    }
  }, [archivedIds]);

  // Persist pinned IDs when they change
  useEffect(() => {
    const persistPinnedIds = async () => {
      try {
        await AsyncStorage.setItem(PINNED_IDS_KEY, JSON.stringify([...pinnedConversations]));
      } catch (error) {
        console.error('Failed to persist pinned IDs:', error);
      }
    };
    persistPinnedIds();
  }, [pinnedConversations]);
  
  // Refs for swipeable items
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  
  // Typing indicator animation
  const typingAnim = useRef(new Animated.Value(0)).current;
  
  // Animate typing indicator
  useEffect(() => {
    const hasTyping = Object.values(typingUsers).some(Boolean);
    if (hasTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [typingUsers]);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const apiConversations = await chatService.getConversations();
      
      // Transform API conversations to local format
      const transformedConversations: Conversation[] = apiConversations.map((conv: ApiConversation) => {
        // Find the other participant (not the current user)
        const otherParticipant = conv.participants.find(p => p.id !== currentUser?.id);
        
        return {
          id: conv.id,
          buyerId: otherParticipant?.id || '',
          buyerName: otherParticipant?.name || 'Unknown',
          buyerAvatar: otherParticipant?.avatar,
          buyerPhone: otherParticipant?.phone,
          lastMessage: conv.lastMessage?.text || 'No messages yet',
          lastMessageTime: new Date(conv.lastMessage?.createdAt || conv.createdAt),
          unreadCount: conv.unreadCount,
          isOnline: otherParticipant?.isOnline ?? false,
          lastSeen: otherParticipant?.lastSeen ? new Date(otherParticipant.lastSeen) : undefined,
          productId: conv.productId,
          orderId: conv.orderId,
        };
      });
      
      // Deduplicate conversations by id
      const uniqueConversations = transformedConversations.reduce((acc: Conversation[], conv) => {
        if (!acc.find(existing => existing.id === conv.id)) {
          acc.push(conv);
        }
        return acc;
      }, []);
      
      // Filter out archived conversations and set them separately
      const activeConversations = uniqueConversations.filter(c => !archivedIds.has(c.id));
      const archived = uniqueConversations.filter(c => archivedIds.has(c.id));
      
      setConversations(activeConversations);
      setArchivedConversations(archived);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.id, archivedIds]);

  // Load conversations on mount and when screen focuses
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time conversation updates (new messages)
  useEffect(() => {
    const handleConversationUpdate = (data: { conversationId: string; lastMessage: ChatMessage }) => {
      console.log('[FarmerMessagesScreen] Conversation update received:', data);
      
      // Update the conversation in the list with the new last message
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === data.conversationId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          const isFromCurrentUser = data.lastMessage.senderId === currentUser?.id;
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: data.lastMessage.text,
            lastMessageTime: new Date(data.lastMessage.createdAt),
            // Only increment unread if message is from someone else
            unreadCount: isFromCurrentUser 
              ? updated[existingIndex].unreadCount 
              : updated[existingIndex].unreadCount + 1,
          };
          return updated;
        }
        // If conversation not found, refetch all conversations
        fetchConversations();
        return prev;
      });
      
      // Also update archived conversations if needed
      setArchivedConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === data.conversationId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          const isFromCurrentUser = data.lastMessage.senderId === currentUser?.id;
          updated[existingIndex] = {
            ...updated[existingIndex],
            lastMessage: data.lastMessage.text,
            lastMessageTime: new Date(data.lastMessage.createdAt),
            unreadCount: isFromCurrentUser 
              ? updated[existingIndex].unreadCount 
              : updated[existingIndex].unreadCount + 1,
          };
          return updated;
        }
        return prev;
      });
    };

    chatService.subscribeToConversationUpdates(handleConversationUpdate);
    
    return () => {
      chatService.unsubscribeFromConversationUpdates(handleConversationUpdate);
    };
  }, [currentUser?.id, fetchConversations]);

  // Subscribe to typing indicators for all conversations
  useEffect(() => {
    const typingHandlers: { conversationId: string; handler: (data: any) => void }[] = [];
    
    conversations.forEach((conv) => {
      const handler = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (data.userId !== currentUser?.id) {
          setTypingUsers(prev => ({ ...prev, [data.conversationId]: data.isTyping }));
        }
      };
      chatService.subscribeToTyping(conv.id, handler);
      typingHandlers.push({ conversationId: conv.id, handler });
    });

    return () => {
      typingHandlers.forEach(({ conversationId, handler }) => {
        chatService.unsubscribeFromTyping(conversationId, handler);
      });
    };
  }, [conversations, currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  // Sort conversations: pinned first, then by time
  const sortedConversations = [...(showArchived ? archivedConversations : conversations)].sort((a, b) => {
    if (!showArchived) {
      const aPinned = pinnedConversations.has(a.id);
      const bPinned = pinnedConversations.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
    }
    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
  });

  const filteredConversations = sortedConversations.filter(conv => {
    if (!conv) return false;
    const buyerName = (conv.buyerName || '').toLowerCase();
    const lastMessage = (conv.lastMessage || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return buyerName.includes(query) || lastMessage.includes(query);
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const handleConversationPress = (conversation: Conversation) => {
    (navigation as any).navigate('BuyerChat', {
      conversationId: conversation.id,
      buyerId: conversation.buyerId,
      buyerName: conversation.buyerName,
      buyerPhone: conversation.buyerPhone,
      buyerAvatar: conversation.buyerAvatar,
      productId: conversation.productId,
      orderId: conversation.orderId,
    });
  };

  // Swipe action handlers
  const handleDelete = useCallback((conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => closeSwipeable(conversationId) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setConversations(prev => prev.filter(c => c.id !== conversationId));
          },
        },
      ]
    );
  }, []);

  const handleArchive = useCallback((conversationId: string) => {
    const conversationToArchive = conversations.find(c => c.id === conversationId);
    if (conversationToArchive) {
      setArchivedConversations(prev => [...prev, conversationToArchive]);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setArchivedIds(prev => new Set([...prev, conversationId]));
    }
    closeSwipeable(conversationId);
  }, [conversations]);

  const handleUnarchive = useCallback((conversationId: string) => {
    const conversationToRestore = archivedConversations.find(c => c.id === conversationId);
    if (conversationToRestore) {
      setConversations(prev => [...prev, conversationToRestore]);
      setArchivedConversations(prev => prev.filter(c => c.id !== conversationId));
      setArchivedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversationId);
        return newSet;
      });
    }
    closeSwipeable(conversationId);
  }, [archivedConversations]);

  const handlePin = useCallback((conversationId: string) => {
    setPinnedConversations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId);
      } else {
        newSet.add(conversationId);
      }
      return newSet;
    });
    closeSwipeable(conversationId);
  }, []);

  const handleMute = useCallback((conversationId: string) => {
    closeSwipeable(conversationId);
    Alert.alert('Muted', 'You will no longer receive notifications from this conversation.');
  }, []);

  const closeSwipeable = (conversationId: string) => {
    swipeableRefs.current.get(conversationId)?.close();
  };

  // Render left swipe actions (Pin, Mute)
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    conversationId: string
  ) => {
    const isPinned = pinnedConversations.has(conversationId);
    
    const pinTranslate = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [-80, 0],
      extrapolate: 'clamp',
    });
    
    const muteTranslate = dragX.interpolate({
      inputRange: [0, 160],
      outputRange: [-160, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsLeft}>
        <Animated.View style={[styles.swipeAction, { transform: [{ translateX: pinTranslate }] }]}>
          <TouchableOpacity
            style={[styles.swipeButton, { backgroundColor: SWIPE_COLORS.pin }]}
            onPress={() => handlePin(conversationId)}
          >
            <Ionicons name={isPinned ? 'pin-outline' : 'pin'} size={22} color="white" />
            <Text style={styles.swipeText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.swipeAction, { transform: [{ translateX: muteTranslate }] }]}>
          <TouchableOpacity
            style={[styles.swipeButton, { backgroundColor: SWIPE_COLORS.mute }]}
            onPress={() => handleMute(conversationId)}
          >
            <Ionicons name="notifications-off-outline" size={22} color="white" />
            <Text style={styles.swipeText}>Mute</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Render right swipe actions (Archive/Restore, Delete)
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    conversationId: string
  ) => {
    const archiveTranslate = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [0, 160],
      extrapolate: 'clamp',
    });
    
    const deleteTranslate = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsRight}>
        <Animated.View style={[styles.swipeAction, { transform: [{ translateX: archiveTranslate }] }]}>
          <TouchableOpacity
            style={[styles.swipeButton, { backgroundColor: showArchived ? '#34C759' : SWIPE_COLORS.archive }]}
            onPress={() => showArchived ? handleUnarchive(conversationId) : handleArchive(conversationId)}
          >
            <Ionicons name={showArchived ? "arrow-undo-outline" : "archive-outline"} size={22} color="white" />
            <Text style={styles.swipeText}>{showArchived ? 'Restore' : 'Archive'}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={[styles.swipeAction, { transform: [{ translateX: deleteTranslate }] }]}>
          <TouchableOpacity
            style={[styles.swipeButton, { backgroundColor: SWIPE_COLORS.delete }]}
            onPress={() => handleDelete(conversationId)}
          >
            <Ionicons name="trash-outline" size={22} color="white" />
            <Text style={styles.swipeText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv?.unreadCount || 0), 0);

  const renderConversation = ({ item }: { item: Conversation }) => {
    if (!item || !item.id) return null;
    
    const isPinned = pinnedConversations.has(item.id);
    const isTyping = typingUsers[item.id];
    
    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
        }}
        renderLeftActions={(progress, dragX) => renderLeftActions(progress, dragX, item.id)}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
        overshootLeft={false}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity
          style={[
            styles.conversationItem, 
            { backgroundColor: isDark ? colors.card : '#FFFFFF' },
            isPinned && styles.pinnedConversation
          ]}
          activeOpacity={0.7}
          onPress={() => handleConversationPress(item)}
        >
          {/* Pin indicator */}
          {isPinned && (
            <View style={styles.pinIndicator}>
              <Ionicons name="pin" size={12} color={SWIPE_COLORS.pin} />
            </View>
          )}
          
          <View style={styles.avatarContainer}>
            {item.buyerAvatar && item.buyerAvatar.trim() !== '' ? (
              <Image source={{ uri: item.buyerAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#34C759' }]}>
                <Text style={styles.avatarText}>{item.buyerName.charAt(0)}</Text>
              </View>
            )}
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.buyerName, { color: colors.text }]} numberOfLines={1}>
                {item.buyerName}
              </Text>
              <Text style={[styles.timeText, { color: item.unreadCount > 0 ? '#34C759' : colors.textSecondary }]}>
                {formatTime(item.lastMessageTime)}
              </Text>
            </View>
            
            {item.productName && (
              <View style={[styles.productBadge, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#E8F8EE' }]}>
                <Ionicons name="leaf-outline" size={10} color="#34C759" />
                <Text style={styles.productBadgeText}>{item.productName}</Text>
              </View>
            )}

            {item.orderId && (
              <View style={[styles.productBadge, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                <Ionicons name="clipboard-outline" size={10} color="#007AFF" />
                <Text style={[styles.productBadgeText, { color: '#007AFF' }]}>Order #{item.orderId}</Text>
              </View>
            )}
            
            <View style={styles.messageRow}>
              {isTyping ? (
                <Animated.View style={[styles.typingContainer, { opacity: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]}>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, { backgroundColor: '#34C759' }]} />
                    <View style={[styles.typingDot, { backgroundColor: '#34C759', opacity: 0.7 }]} />
                    <View style={[styles.typingDot, { backgroundColor: '#34C759', opacity: 0.5 }]} />
                  </View>
                  <Text style={[styles.typingText, { color: '#34C759' }]}>typing...</Text>
                </Animated.View>
              ) : (
                <Text 
                  style={[
                    styles.lastMessage, 
                    { 
                      color: item.unreadCount > 0 ? colors.text : colors.textSecondary,
                      fontWeight: item.unreadCount > 0 ? '500' : '400',
                    }
                  ]} 
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
              )}
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderEmptyState = () => {
    // Check if we have no results due to search
    if (searchQuery && conversations.length > 0) {
      return (
        <View style={styles.emptyState}>
          <NoSearchResultsIllustration 
            size={120} 
            primaryColor="#34C759"
            secondaryColor={isDark ? colors.textSecondary : '#81C784'}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            We couldn't find any conversations matching "{searchQuery}"
          </Text>
          <TouchableOpacity 
            style={[styles.clearButton, { backgroundColor: '#34C759' }]}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.clearButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Check connection status
    if (!isConnected && !showArchived) {
      return (
        <View style={styles.emptyState}>
          <OfflineIllustration 
            size={120} 
            primaryColor="#F44336"
            secondaryColor="#EF5350"
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Connection Lost</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Please check your internet connection and try again
          </Text>
          <TouchableOpacity 
            style={[styles.clearButton, { backgroundColor: '#34C759' }]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.clearButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Archived view empty state
    if (showArchived) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyArchiveIcon, { backgroundColor: isDark ? 'rgba(255, 149, 0, 0.15)' : '#FFF3E0' }]}>
            <Ionicons name="archive-outline" size={40} color="#FF9500" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Archived Messages</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Conversations you archive will appear here. Swipe left on a conversation to archive it.
          </Text>
          <TouchableOpacity 
            style={[styles.clearButton, { backgroundColor: '#34C759' }]}
            onPress={() => setShowArchived(false)}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
            <Text style={styles.clearButtonText}>Back to Messages</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // No conversations yet
    return (
      <View style={styles.emptyState}>
        <EmptyMessagesIllustration 
          size={140} 
          primaryColor="#34C759"
          secondaryColor={isDark ? '#81C784' : '#A5D6A7'}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          When buyers message you about your products or orders, they will appear here
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Connection Status Banner */}
      {!isConnected && conversations.length > 0 && (
        <View style={styles.connectionBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
          <Text style={styles.connectionBannerText}>Reconnecting...</Text>
        </View>
      )}
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.headerTop}>
          {showArchived ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowArchived(false)}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {showArchived ? 'Archived' : 'Messages'}
          </Text>
          {!showArchived && totalUnread > 0 && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>{totalUnread}</Text>
            </View>
          )}
          {!showArchived && (
            <TouchableOpacity
              style={styles.archiveButton}
              onPress={() => setShowArchived(true)}
            >
              <Ionicons name="archive-outline" size={24} color={colors.text} />
              {archivedConversations.length > 0 && (
                <View style={styles.archiveBadge}>
                  <Text style={styles.archiveBadgeText}>{archivedConversations.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading conversations...</Text>
        </View>
      ) : (
        /* Conversations List */
        <FlatList
          data={filteredConversations}
          keyExtractor={(item, index) => item?.id || `conv-${index}`}
          renderItem={renderConversation}
          contentContainerStyle={[
            styles.listContent,
            filteredConversations.length === 0 && styles.emptyListContent
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" />
          }
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
  },
  totalUnreadBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#34C759',
  },
  totalUnreadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyListContent: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    marginBottom: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  buyerName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '400',
  },
  productBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
    marginBottom: 4,
  },
  productBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#34C759',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 15,
    fontWeight: '400',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    backgroundColor: '#34C759',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '400',
  },
  // Connection banner styles
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    paddingVertical: 8,
    gap: 6,
  },
  connectionBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  // Swipe action styles
  swipeActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  swipeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  // Pin indicator styles
  pinnedConversation: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  pinIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  // Typing indicator styles
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  typingText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  // Clear button style
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Archive styles
  archiveButton: {
    position: 'relative',
    padding: 8,
    marginLeft: 'auto',
  },
  archiveBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  archiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  backToMessages: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 8,
  },
  backText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
    color: '#34C759',
  },
  emptyArchiveIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
});
