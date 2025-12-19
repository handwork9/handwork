import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useMessageBanner } from '../../context/MessageBannerContext';
import { useAppSelector } from '../../store';
import { chatService, ChatMessage } from '../../services/chatService';
import { AttachmentMenu, EmojiPicker } from '../../components/common/ChatInputAccessories';
import ProfileModal, { ProfileData } from '../../components/common/ProfileModal';

interface Message {
  id: string;
  text: string;
  sender: 'buyer' | 'farmer';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'product';
  productData?: {
    name: string;
    price: number;
    image: string;
  };
}

interface Farmer {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: Date;
  rating: number;
  location: string;
  phone: string;
  email?: string;
  specialties: string[];
  totalOrders?: number;
  memberSince?: string;
  isVerified?: boolean;
  bio?: string;
  responseTime?: string;
}

const QUICK_MESSAGES = [
  'Is this still available?',
  'What\'s the best price?',
  'Can you deliver?',
  'When was it harvested?',
];

// Get farmer data from route params
const getFarmerFromParams = (params: any): Farmer => ({
  id: params?.farmerId || params?.senderId || '',
  name: params?.farmerName || params?.recipientName || 'Farmer',
  avatar: params?.farmerAvatar || params?.senderAvatar || '',
  isOnline: params?.isOnline ?? true,
  rating: params?.farmerRating || 0,
  location: params?.farmerLocation || '',
  phone: params?.farmerPhone || '',
  email: params?.farmerEmail || '',
  specialties: params?.specialties || [],
  totalOrders: params?.farmerTotalOrders || 0,
  memberSince: params?.farmerMemberSince || '',
  isVerified: params?.farmerIsVerified ?? false,
  bio: params?.farmerBio || '',
  responseTime: params?.farmerResponseTime || '',
});

const FarmerChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const currentUser = useAppSelector(state => state.auth.user);
  const { setActiveConversationId } = useMessageBanner();
  const { colors, isDark } = useTheme();

  // Get farmer data from route params
  const routeParams = route.params as any;
  const [farmer, setFarmer] = useState<Farmer>(getFarmerFromParams(routeParams));
  const orderId = routeParams?.orderId || '';
  const productId = routeParams?.productId || '';
  const initialConversationId = routeParams?.conversationId || null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickMessages, setShowQuickMessages] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const quickMessageAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initialize chat and load messages
  useEffect(() => {
    const initializeChat = async () => {
      console.log('initializeChat called:', { farmerId: farmer.id, currentUserId: currentUser?.id, initialConversationId });
      
      if (!currentUser?.id) {
        console.log('initializeChat early return - missing user ID');
        setIsLoading(false);
        return;
      }

      // If we don't have farmer ID but have conversationId, we can still proceed
      if (!farmer.id && !initialConversationId) {
        console.log('initializeChat early return - missing both farmerId and conversationId');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        let conversation;
        
        // If we have an initial conversationId (from notification), use it directly
        if (initialConversationId) {
          console.log('Using initial conversationId:', initialConversationId);
          setConversationId(initialConversationId);
          setActiveConversationId(initialConversationId);
          
          // Load messages for this conversation
          const existingMessages = await chatService.getMessages(initialConversationId);
          const formattedMessages: Message[] = existingMessages.map((msg: ChatMessage) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.senderId === currentUser.id ? 'buyer' : 'farmer',
            timestamp: new Date(msg.createdAt),
            status: msg.status as Message['status'],
          }));
          setMessages(formattedMessages);

          // Mark messages as read
          await chatService.markAsRead(initialConversationId);

          // Subscribe to new messages
          chatService.subscribeToMessages(initialConversationId, handleNewMessage);
          chatService.subscribeToTyping(initialConversationId, handleTypingIndicator);
          
          setIsLoading(false);
          return;
        }
        
        console.log('Calling getOrCreateConversation with:', { farmerId: farmer.id, orderId, productId });
        
        // Get or create conversation with farmer
        conversation = await chatService.getOrCreateConversation(
          farmer.id,
          'farmer',
          { orderId: orderId || undefined, productId: productId || undefined }
        );
        
        console.log('Conversation result:', conversation);
        
        if (!conversation) {
          throw new Error('Failed to create conversation');
        }
        
        setConversationId(conversation.id);
        
        // Set active conversation to prevent banner notifications for this chat
        setActiveConversationId(conversation.id);

        // Load existing messages
        const existingMessages = await chatService.getMessages(conversation.id);
        const formattedMessages: Message[] = existingMessages.map((msg: ChatMessage) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.senderId === currentUser.id ? 'buyer' : 'farmer',
          timestamp: new Date(msg.createdAt),
          status: msg.status as Message['status'],
        }));
        setMessages(formattedMessages);

        // Mark messages as read
        await chatService.markAsRead(conversation.id);

        // Subscribe to new messages
        chatService.subscribeToMessages(conversation.id, handleNewMessage);

        // Subscribe to typing indicators
        chatService.subscribeToTyping(conversation.id, handleTypingIndicator);

      } catch (error) {
        console.error('Failed to initialize chat:', error);
        Alert.alert('Error', 'Failed to load chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      // Clear active conversation when leaving the screen
      setActiveConversationId(null);
      
      if (conversationId) {
        chatService.unsubscribeFromMessages(conversationId);
        chatService.unsubscribeFromTyping(conversationId);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [farmer.id, currentUser?.id, orderId, productId, initialConversationId, setActiveConversationId]);

  // Handle new incoming messages
  const handleNewMessage = useCallback((chatMessage: ChatMessage) => {
    if (chatMessage.senderId === currentUser?.id) return;

    const newMessage: Message = {
      id: chatMessage.id,
      text: chatMessage.text,
      sender: 'farmer',
      timestamp: new Date(chatMessage.createdAt),
      status: chatMessage.status as Message['status'],
    };

    setMessages(prev => {
      // Avoid duplicates by checking if message already exists
      if (prev.some(m => m.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });
    setIsTyping(false);

    // Mark as read
    if (conversationId) {
      chatService.markAsRead(conversationId);
    }

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [currentUser?.id, conversationId]);

  // Handle typing indicators
  const handleTypingIndicator = useCallback((data: { conversationId: string; userId: string; isTyping: boolean }) => {
    if (data.userId !== currentUser?.id) {
      setIsTyping(data.isTyping);
    }
  }, [currentUser?.id]);

  const simulateFarmerTyping = () => {
    setIsTyping(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 }
    ).start(() => setIsTyping(false));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleSend = async () => {
    console.log('handleSend called:', { inputText: inputText.trim(), conversationId, isSending });
    if (!inputText.trim() || !conversationId || isSending) {
      console.log('handleSend early return:', { 
        noText: !inputText.trim(), 
        noConversationId: !conversationId, 
        isSending 
      });
      return;
    }

    const messageText = inputText.trim();
    const tempId = `temp-${Date.now()}`;

    // Create optimistic message
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      sender: 'buyer',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsSending(true);
    setShowQuickMessages(false);

    // Stop typing indicator
    chatService.sendTypingIndicator(conversationId, false);

    // Animate quick messages out
    Animated.timing(quickMessageAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send message via API
      const sentMessage = await chatService.sendMessage({
        conversationId,
        text: messageText,
      });

      if (!sentMessage) {
        throw new Error('Failed to send message');
      }

      // Update message with server response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, id: sentMessage.id, status: 'sent' }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark message as failed
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'sending' }
            : msg
        )
      );
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    
    // Send typing indicator
    if (conversationId && text.length > 0) {
      chatService.sendTypingIndicator(conversationId, true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        chatService.sendTypingIndicator(conversationId, false);
      }, 2000);
    }
  };

  const handleQuickMessage = (text: string) => {
    setInputText(text);
  };

  const handleCall = () => {
    if (!farmer.phone) {
      Alert.alert(
        'Contact Unavailable',
        'Farmer phone number is not available. You can continue messaging here.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Call Farmer',
      `Would you like to call ${farmer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Voice Call',
          onPress: () => {
            Linking.openURL(`tel:${farmer.phone}`).catch(() => {
              Alert.alert('Error', 'Unable to make phone call');
            });
          },
        },
        {
          text: 'Video Call',
          onPress: () => {
            // In a real app, this would initiate a video call
            Alert.alert('Video Call', 'Connecting video call...', [
              { text: 'OK' }
            ]);
          },
        },
      ]
    );
  };

  // Attachment handlers
  const handleSelectImage = (uri: string) => {
    // TODO: Implement image upload and send
    Alert.alert('Image Selected', 'Image sending feature coming soon!');
    console.log('Selected image:', uri);
  };

  const handleSelectCamera = (uri: string) => {
    // TODO: Implement camera image upload and send
    Alert.alert('Photo Taken', 'Photo sending feature coming soon!');
    console.log('Camera image:', uri);
  };

  const handleSelectLocation = () => {
    // TODO: Implement location sharing
    Alert.alert('Share Location', 'Location sharing feature coming soon!');
  };

  // Emoji handler
  const handleSelectEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const handleVideoCall = () => {
    Alert.alert(
      'Video Call',
      `Starting video call with ${farmer.name}...`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Call',
          onPress: () => {
            // In a real app, this would initiate a video call
            Alert.alert('Connecting', 'Please wait while we connect you...');
          },
        },
      ]
    );
  };

  const handleViewProfile = () => {
    setShowProfileModal(true);
  };

  const navigateToFullProfile = () => {
    (navigation as any).navigate('FarmerProfile', {
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerAvatar: farmer.avatar,
      farmerRating: farmer.rating,
      farmerLocation: farmer.location,
    });
  };

  const farmerProfileData: ProfileData = {
    id: farmer.id,
    name: farmer.name,
    avatar: farmer.avatar,
    phone: farmer.phone,
    email: farmer.email,
    location: farmer.location,
    role: 'farmer',
    rating: farmer.rating,
    totalOrders: farmer.totalOrders,
    memberSince: farmer.memberSince,
    isOnline: farmer.isOnline,
    isVerified: farmer.isVerified,
    specialties: farmer.specialties,
    bio: farmer.bio,
    responseTime: farmer.responseTime,
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color={COLORS.textSecondary} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color={COLORS.textSecondary} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color={COLORS.primary} />;
      default:
        return null;
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isBuyer = item.sender === 'buyer';
    const showAvatar = !isBuyer && (index === 0 || messages[index - 1]?.sender !== 'farmer');

    return (
      <View style={[styles.messageRow, isBuyer && styles.messageRowBuyer]}>
        {!isBuyer && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              farmer.avatar && farmer.avatar.trim() !== '' ? (
                <Image source={{ uri: farmer.avatar }} style={styles.messageAvatar} />
              ) : (
                <View style={[styles.messageAvatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={16} color={COLORS.white} />
                </View>
              )
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
        )}
        
        <View style={[styles.messageBubble, isBuyer ? styles.buyerBubble : [styles.farmerBubble, { backgroundColor: isDark ? colors.card : COLORS.white }]]}>
          <Text style={[styles.messageText, { color: isBuyer ? COLORS.white : colors.text }]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isBuyer && styles.buyerMessageTime, !isBuyer && { color: colors.textSecondary }]}>
              {formatTime(item.timestamp)}
            </Text>
            {isBuyer && (
              <View style={styles.statusIcon}>
                {getStatusIcon(item.status)}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        {farmer.avatar && farmer.avatar.trim() !== '' ? (
          <Image source={{ uri: farmer.avatar }} style={styles.typingAvatar} />
        ) : (
          <View style={[styles.typingAvatar, styles.avatarFallback]}>
            <Ionicons name="person" size={14} color={COLORS.white} />
          </View>
        )}
        <View style={[styles.typingBubble, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: colors.textSecondary },
              {
                opacity: typingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: colors.textSecondary },
              {
                opacity: typingAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 1, 0.3],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: colors.textSecondary },
              {
                opacity: typingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.3],
                }),
              },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: isDark ? colors.background : COLORS.background }]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerInfo} onPress={handleViewProfile}>
            <View style={styles.avatarWrapper}>
              {farmer.avatar && farmer.avatar.trim() !== '' ? (
                <Image source={{ uri: farmer.avatar }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={18} color={COLORS.white} />
                </View>
              )}
              {farmer.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{farmer.name}</Text>
              <Text style={styles.headerStatus}>
                {farmer.isOnline ? '🟢 Online' : `Last seen ${formatLastSeen(farmer.lastSeen)}`}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleCall}>
              <Ionicons name="call" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleVideoCall}>
              <Ionicons name="videocam" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages yet.{'\n'}Say hello to {farmer.name}!
              </Text>
            </View>
          }
        />
      )}

      {/* Quick Messages */}
      {showQuickMessages && (
        <Animated.View
          style={[
            styles.quickMessagesContainer,
            {
              opacity: quickMessageAnim,
              transform: [{ scale: quickMessageAnim }],
            },
          ]}
        >
          <Text style={[styles.quickMessagesTitle, { color: colors.textSecondary }]}>Quick Messages</Text>
          <View style={styles.quickMessagesList}>
            {QUICK_MESSAGES.map((msg, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickMessageChip, { backgroundColor: isDark ? colors.card : COLORS.white }]}
                onPress={() => handleQuickMessage(msg)}
              >
                <Text style={styles.quickMessageText}>{msg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : COLORS.white, borderTopColor: isDark ? colors.border : COLORS.border }]}>
          <TouchableOpacity style={styles.attachButton} onPress={() => setShowAttachmentMenu(true)}>
            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={[styles.inputWrapper, { backgroundColor: isDark ? colors.background : COLORS.background }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.emojiButton} onPress={() => setShowEmojiPicker(true)}>
              <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <View style={styles.sendButtonGradient}>
                <ActivityIndicator size="small" color={COLORS.white} />
              </View>
            ) : (
              <LinearGradient
                colors={inputText.trim() ? [COLORS.primary, COLORS.primaryDark] : [COLORS.border, COLORS.border]}
                style={styles.sendButtonGradient}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? COLORS.white : COLORS.textSecondary}
                />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Floating Call Button */}
      <TouchableOpacity style={styles.floatingCallButton} onPress={handleCall}>
        <LinearGradient
          colors={['#34C759', '#28A745']}
          style={styles.floatingCallGradient}
        >
          <Ionicons name="call" size={24} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Attachment Menu */}
      <AttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onSelectImage={handleSelectImage}
        onSelectCamera={handleSelectCamera}
        onSelectLocation={handleSelectLocation}
      />

      {/* Emoji Picker */}
      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleSelectEmoji}
      />

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={farmerProfileData}
        onNavigateToFullProfile={navigateToFullProfile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerWrapper: {
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  avatarWrapper: {
    position: 'relative',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  headerText: {
    marginLeft: SPACING.sm,
  },
  headerName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  headerStatus: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-end',
  },
  messageRowBuyer: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    marginRight: SPACING.xs,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  farmerBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  buyerBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  buyerMessageText: {
    color: COLORS.white,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  buyerMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  statusIcon: {
    marginLeft: 2,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.xs,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    gap: 4,
    ...SHADOWS.small,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
  quickMessagesContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  quickMessagesTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  quickMessagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  quickMessageChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickMessageText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
    maxHeight: 100,
  },
  emojiButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
  },
  sendButtonActive: {},
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCallButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 100,
    ...SHADOWS.medium,
  },
  floatingCallGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallback: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
});

export default FarmerChatScreen;
