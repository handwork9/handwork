import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import { chatService, Conversation as ApiConversation, ChatMessage } from '../../services/chatService';
import { useAppSelector, useAppDispatch } from '../../store';
import { useBuyerSocket, useMessageNotifications } from '../../hooks/useBuyerSocket';
import { markConversationRead, clearMessageNotifications } from '../../store/slices/buyerSlice';
import { 
  EmptyMessagesIllustration, 
  NoSearchResultsIllustration,
  OfflineIllustration 
} from '../../assets/illustrations/messages';

const { width } = Dimensions.get('window');

interface Conversation {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerAvatar?: string;
  farmerPhone?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: Date;
  productId?: string;
  productName?: string;
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

export default function MessagesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(state => state.auth.user);
  
  // Initialize buyer socket for real-time message notifications
  const { isConnected } = useBuyerSocket();
  const { notifications: messageNotifications, unreadCount: totalUnread } = useMessageNotifications();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [pinnedConversations, setPinnedConversations] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Storage keys
  const ARCHIVED_IDS_KEY = '@buyer_archived_conversation_ids';
  const PINNED_IDS_KEY = '@buyer_pinned_conversation_ids';

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
  
  // Update conversation list when new message notification arrives
  useEffect(() => {
    if (messageNotifications.length > 0) {
      // Refetch to get updated conversation list
      fetchConversations();
    }
  }, [messageNotifications.length]);

  // Subscribe to real-time conversation updates (new messages)
  useEffect(() => {
    const handleConversationUpdate = (data: { conversationId: string; lastMessage: ChatMessage }) => {
      console.log('[MessagesScreen] Conversation update received:', data);
      
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

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const apiConversations = await chatService.getConversations();
      
      // If no conversations exist, clear any stale message notifications
      if (apiConversations.length === 0) {
        dispatch(clearMessageNotifications());
      }
      
      // Transform API conversations to local format
      const transformedConversations: Conversation[] = apiConversations.map((conv: ApiConversation) => {
        // Find the other participant (not the current user)
        const otherParticipant = conv.participants.find(p => p.id !== currentUser?.id);
        
        // Build display name from available info
        let displayName = 'Unknown';
        if (otherParticipant?.name && otherParticipant.name.trim()) {
          displayName = otherParticipant.name;
        } else if (otherParticipant?.phone) {
          displayName = otherParticipant.phone;
        } else if (otherParticipant?.role) {
          displayName = otherParticipant.role.charAt(0).toUpperCase() + otherParticipant.role.slice(1);
        }
        
        return {
          id: conv.id,
          farmerId: otherParticipant?.id || '',
          farmerName: displayName,
          farmerAvatar: otherParticipant?.avatar,
          farmerPhone: otherParticipant?.phone,
          lastMessage: conv.lastMessage?.text || 'No messages yet',
          lastMessageTime: new Date(conv.lastMessage?.createdAt || conv.createdAt),
          unreadCount: conv.unreadCount,
          isOnline: otherParticipant?.isOnline ?? false,
          lastSeen: otherParticipant?.lastSeen ? new Date(otherParticipant.lastSeen) : undefined,
          productId: conv.productId,
          isMuted: (conv as any).isMuted || false,
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
      
      // Fetch online status for all participants
      const allParticipantIds = uniqueConversations.map(c => c.farmerId).filter(Boolean);
      if (allParticipantIds.length > 0) {
        chatService.getOnlineStatus(allParticipantIds).then(onlineStatus => {
          setConversations(prev => prev.map(conv => ({
            ...conv,
            isOnline: onlineStatus[conv.farmerId] || false,
          })));
          setArchivedConversations(prev => prev.map(conv => ({
            ...conv,
            isOnline: onlineStatus[conv.farmerId] || false,
          })));
        });
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.id, archivedIds, dispatch]);

  // Load conversations on mount and when screen focuses
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F9FAFB' },
    header: { backgroundColor: isDark ? colors.background : '#F9FAFB' },
    searchBg: { backgroundColor: isDark ? colors.card : '#FFFFFF' },
    cardBg: { backgroundColor: isDark ? colors.card : '#FFFFFF' },
    filterPill: { backgroundColor: isDark ? colors.card : '#FFFFFF' },
    filterPillActive: { backgroundColor: '#22C55E' },
    filterText: { color: colors.textSecondary },
    filterTextActive: { color: '#FFFFFF' },
    statCardBorder: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
    skeletonBg: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' },
  }), [isDark, colors]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = conversations.length;
    const unread = conversations.filter(c => c.unreadCount > 0).length;
    const pinned = conversations.filter(c => pinnedConversations.has(c.id)).length;
    return { total, unread, pinned };
  }, [conversations, pinnedConversations]);

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

  // Apply filters
  const filteredConversations = useMemo(() => {
    let result = sortedConversations;
    
    // Apply active filter
    if (activeFilter === 'unread') {
      result = result.filter(c => c.unreadCount > 0);
    } else if (activeFilter === 'pinned') {
      result = result.filter(c => pinnedConversations.has(c.id));
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(conv => {
        const farmerName = (conv.farmerName || '').toLowerCase();
        const lastMessage = (conv.lastMessage || '').toLowerCase();
        return farmerName.includes(query) || lastMessage.includes(query);
      });
    }
    
    return result;
  }, [sortedConversations, activeFilter, searchQuery, pinnedConversations]);

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
    (navigation as any).navigate('FarmerChat', {
      conversationId: conversation.id,
      farmerId: conversation.farmerId,
      farmerName: conversation.farmerName,
      farmerPhone: conversation.farmerPhone,
      farmerAvatar: conversation.farmerAvatar,
      productId: conversation.productId,
    });
    // Mark conversation as read in Redux
    dispatch(markConversationRead(conversation.id));
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
          onPress: async () => {
            const success = await chatService.deleteConversation(conversationId);
            if (success) {
              setConversations(prev => prev.filter(c => c.id !== conversationId));
            } else {
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  }, []);

  const handleArchive = useCallback((conversationId: string) => {
    const conversationToArchive = conversations.find(c => c.id === conversationId);
    if (conversationToArchive) {
      setArchivedConversations(prev => [conversationToArchive, ...prev]);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      setArchivedIds(prev => new Set([...prev, conversationId]));
    }
    closeSwipeable(conversationId);
  }, [conversations]);

  const handleUnarchive = useCallback((conversationId: string) => {
    const conversationToUnarchive = archivedConversations.find(c => c.id === conversationId);
    if (conversationToUnarchive) {
      setConversations(prev => [conversationToUnarchive, ...prev]);
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

  const handleMute = useCallback(async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    const isMuted = (conversation as any)?.isMuted || false;
    const newMutedState = !isMuted;
    
    const success = await chatService.muteConversation(conversationId, newMutedState);
    if (success) {
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, isMuted: newMutedState } as any : c
      ));
      Alert.alert(
        newMutedState ? 'Muted' : 'Unmuted', 
        newMutedState 
          ? 'You will no longer receive notifications from this conversation.'
          : 'Notifications enabled for this conversation.'
      );
    } else {
      Alert.alert('Error', 'Failed to update notification settings');
    }
    closeSwipeable(conversationId);
  }, [conversations]);

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

  // Render right swipe actions (Archive/Unarchive, Delete)
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

  // Combine local unread count with WebSocket notifications
  // Only show unread count if there are actual conversations
  const localUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const combinedUnreadCount = conversations.length > 0 ? Math.max(localUnread, totalUnread) : 0;

  const renderConversation = ({ item }: { item: Conversation }) => {
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
            {item.farmerAvatar ? (
              <Image source={{ uri: item.farmerAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{item.farmerName.charAt(0)}</Text>
              </View>
            )}
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.farmerName, { color: colors.text }]} numberOfLines={1}>
                {item.farmerName}
              </Text>
              <Text style={[styles.timeText, { color: item.unreadCount > 0 ? colors.primary : colors.textSecondary }]}>
                {formatTime(item.lastMessageTime)}
              </Text>
            </View>
            
            {item.productName && (
              <View style={[styles.productBadge, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                <Ionicons name="cube-outline" size={10} color="#007AFF" />
                <Text style={styles.productBadgeText}>{item.productName}</Text>
              </View>
            )}
            
            <View style={styles.messageRow}>
              {isTyping ? (
                <Animated.View style={[styles.typingContainer, { opacity: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]}>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                    <View style={[styles.typingDot, { backgroundColor: colors.primary, opacity: 0.7 }]} />
                    <View style={[styles.typingDot, { backgroundColor: colors.primary, opacity: 0.5 }]} />
                  </View>
                  <Text style={[styles.typingText, { color: colors.primary }]}>typing...</Text>
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
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
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
            primaryColor={colors.primary}
            secondaryColor={isDark ? colors.textSecondary : '#FFB74D'}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            We couldn't find any conversations matching "{searchQuery}"
          </Text>
          <TouchableOpacity 
            style={[styles.browseButton, { backgroundColor: colors.primary }]}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.browseButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Check connection status
    if (!isConnected) {
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
            style={[styles.browseButton, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.browseButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Archived view empty state
    if (showArchived) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyArchiveIcon, { backgroundColor: isDark ? 'rgba(255,149,0,0.15)' : '#FFF3E0' }]}>
            <Ionicons name="archive-outline" size={48} color="#FF9500" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Archived Messages</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Conversations you archive will appear here
          </Text>
          <TouchableOpacity 
            style={[styles.browseButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowArchived(false)}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.browseButtonText}>Back to Messages</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // No conversations yet
    return (
      <View style={styles.emptyState}>
        <EmptyMessagesIllustration 
          size={140} 
          primaryColor={colors.primary}
          secondaryColor={isDark ? '#81C784' : '#A5D6A7'}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Start a conversation with a farmer by visiting their profile or product page
        </Text>
        <TouchableOpacity 
          style={[styles.browseButton, { backgroundColor: colors.primary }]}
          onPress={() => (navigation as any).navigate('Categories')}
        >
          <Ionicons name="leaf" size={20} color="#FFFFFF" />
          <Text style={styles.browseButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Filter options
  const FILTER_OPTIONS = [
    { id: 'all', label: 'All', icon: 'chatbubbles-outline' },
    { id: 'unread', label: 'Unread', icon: 'mail-unread-outline', count: stats.unread },
    { id: 'pinned', label: 'Pinned', icon: 'pin-outline', count: stats.pinned },
  ];

  // Stats Header Component
  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      {/* Main Stats Card */}
      <LinearGradient
        colors={['#22C55E', '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mainStatCard}
      >
        <View style={styles.statIconBg}>
          <Ionicons name="chatbubbles" size={24} color="#fff" />
        </View>
        <Text style={styles.mainStatNumber}>{stats.total}</Text>
        <Text style={styles.mainStatLabel}>Total Chats</Text>
        {isConnected && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        )}
      </LinearGradient>

      {/* Secondary Stats */}
      <View style={styles.secondaryStats}>
        <View style={[styles.secondaryStatCard, dynamicStyles.cardBg, dynamicStyles.statCardBorder]}>
          <View style={[styles.secondaryIconBg, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="mail-unread" size={18} color="#EF4444" />
          </View>
          <Text style={[styles.secondaryStatNumber, { color: colors.text }]}>{stats.unread}</Text>
          <Text style={[styles.secondaryStatLabel, { color: colors.textSecondary }]}>Unread</Text>
        </View>
        <View style={[styles.secondaryStatCard, dynamicStyles.cardBg, dynamicStyles.statCardBorder]}>
          <View style={[styles.secondaryIconBg, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="pin" size={18} color="#3B82F6" />
          </View>
          <Text style={[styles.secondaryStatNumber, { color: colors.text }]}>{stats.pinned}</Text>
          <Text style={[styles.secondaryStatLabel, { color: colors.textSecondary }]}>Pinned</Text>
        </View>
      </View>
    </View>
  );

  // Filter Pills Component
  const renderFilterPills = () => (
    <View style={styles.filterContainer}>
      {FILTER_OPTIONS.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterPill,
            dynamicStyles.filterPill,
            activeFilter === filter.id && dynamicStyles.filterPillActive,
          ]}
          onPress={() => setActiveFilter(filter.id as 'all' | 'unread' | 'pinned')}
        >
          <Ionicons 
            name={filter.icon as any} 
            size={16} 
            color={activeFilter === filter.id ? '#fff' : colors.textSecondary} 
          />
          <Text style={[
            styles.filterText,
            activeFilter === filter.id ? dynamicStyles.filterTextActive : dynamicStyles.filterText,
          ]}>
            {filter.label}
          </Text>
          {filter.count !== undefined && filter.count > 0 && (
            <View style={[
              styles.filterBadge,
              { backgroundColor: activeFilter === filter.id ? 'rgba(255,255,255,0.3)' : '#EF4444' }
            ]}>
              <Text style={styles.filterBadgeText}>{filter.count}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Loading Skeleton
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Stats skeleton */}
      <View style={styles.statsHeader}>
        <View style={[styles.mainStatCard, dynamicStyles.skeletonBg, { opacity: 0.5 }]} />
        <View style={styles.secondaryStats}>
          <View style={[styles.secondaryStatCard, dynamicStyles.skeletonBg]} />
          <View style={[styles.secondaryStatCard, dynamicStyles.skeletonBg]} />
        </View>
      </View>
      {/* Conversation skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={[styles.skeletonCard, dynamicStyles.cardBg]}>
          <View style={[styles.skeletonAvatar, dynamicStyles.skeletonBg]} />
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonName, dynamicStyles.skeletonBg]} />
            <View style={[styles.skeletonMessage, dynamicStyles.skeletonBg]} />
          </View>
        </View>
      ))}
    </View>
  );

  // List Header
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {renderStatsHeader()}
      {!showArchived && renderFilterPills()}
    </View>
  );

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Connection Status Banner */}
      {!isConnected && conversations.length > 0 && (
        <View style={[styles.connectionBanner, { paddingTop: insets.top }]}>
          <View style={styles.connectionBannerContent}>
            <View style={styles.connectionBannerDot} />
            <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
            <Text style={styles.connectionBannerText}>Reconnecting...</Text>
          </View>
        </View>
      )}
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: !isConnected && conversations.length > 0 ? 8 : insets.top + 8 }, dynamicStyles.header]}>
        <View style={styles.headerTop}>
          {showArchived ? (
            <TouchableOpacity style={styles.backToMessages} onPress={() => setShowArchived(false)}>
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text, marginLeft: 8 }]}>Archived</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
            </>
          )}
          <View style={styles.headerActions}>
            {!showArchived && archivedConversations.length > 0 && (
              <TouchableOpacity 
                style={styles.archiveButton}
                onPress={() => setShowArchived(true)}
              >
                <Ionicons name="archive-outline" size={22} color={colors.textSecondary} />
                {archivedConversations.length > 0 && (
                  <View style={styles.archiveBadge}>
                    <Text style={styles.archiveBadgeText}>{archivedConversations.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, dynamicStyles.searchBg]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={showArchived ? "Search archived..." : "Search conversations..."}
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
        renderSkeleton()
      ) : (
        /* Conversations List */
        <Animated.FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={[
            styles.listContent,
            filteredConversations.length === 0 && styles.emptyListContent
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          )}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalUnreadBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // Stats Header Styles
  listHeader: {
    paddingBottom: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mainStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mainStatNumber: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  mainStatLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  secondaryStats: {
    flex: 1,
    gap: 8,
  },
  secondaryStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  secondaryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  secondaryStatLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  // Skeleton Styles
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  skeletonName: {
    width: '50%',
    height: 16,
    borderRadius: 4,
  },
  skeletonMessage: {
    width: '80%',
    height: 14,
    borderRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    borderRadius: 12,
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
    fontFamily: FONTS.semiBold,
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
  farmerName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.medium,
    color: '#007AFF',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
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
  },
  unreadText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.bold,
    marginBottom: 8,
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  // Connection banner styles
  connectionBanner: {
    backgroundColor: '#FF9500',
    paddingBottom: 10,
  },
  connectionBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  connectionBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  connectionBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '600',
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
    fontFamily: FONTS.medium,
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
    fontFamily: FONTS.medium,
    fontStyle: 'italic',
  },
  // Archive styles
  archiveButton: {
    position: 'relative',
    padding: 8,
    marginRight: 8,
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
    fontFamily: FONTS.semiBold,
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
    fontFamily: FONTS.medium,
    color: '#007AFF',
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
