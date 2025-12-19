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
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useMessageBanner } from '../../context/MessageBannerContext';
import { chatService, ChatMessage } from '../../services/chatService';
import { useAppSelector } from '../../store';
import { AttachmentMenu, EmojiPicker } from '../../components/common/ChatInputAccessories';
import ProfileModal, { ProfileData } from '../../components/common/ProfileModal';

interface Message {
  id: string;
  text: string;
  sender: 'rider' | 'buyer' | 'farmer';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  email?: string;
  location?: string;
  role: 'buyer' | 'farmer';
  rating?: number;
  totalOrders?: number;
  memberSince?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  bio?: string;
  specialties?: string[];
}

const QUICK_MESSAGES = [
  'On my way!',
  'I\'ve arrived',
  'Please come outside',
  'Where should I deliver?',
  'Running a bit late',
  'Can you confirm the address?',
];

const DeliveryChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { colors, isDark } = useTheme();
  const { setActiveConversationId } = useMessageBanner();
  const { user } = useAppSelector((state) => state.auth);

  // Get contact data from route params
  const routeParams = route.params as any;
  const contact: Contact = {
    id: routeParams?.contactId || routeParams?.senderId || '',
    name: routeParams?.contactName || routeParams?.recipientName || 'Customer',
    avatar: routeParams?.contactAvatar || '',
    phone: routeParams?.contactPhone || '',
    email: routeParams?.contactEmail || '',
    location: routeParams?.contactLocation || '',
    role: routeParams?.contactRole || routeParams?.senderRole || 'buyer',
    rating: routeParams?.contactRating || 0,
    totalOrders: routeParams?.contactTotalOrders || 0,
    memberSince: routeParams?.contactMemberSince || '',
    isOnline: routeParams?.contactIsOnline ?? true,
    isVerified: routeParams?.contactIsVerified ?? false,
    bio: routeParams?.contactBio || '',
    specialties: routeParams?.contactSpecialties || [],
  };
  const orderId = routeParams?.orderId || '';
  const initialConversationId = routeParams?.conversationId || null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const quickMessageAnim = useRef(new Animated.Value(1)).current;

  // Dynamic styles
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: isDark ? colors.background : '#F2F2F7',
    },
    headerBg: {
      backgroundColor: isDark ? colors.card : COLORS.surface,
    },
    inputContainer: {
      backgroundColor: isDark ? colors.card : COLORS.surface,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border,
    },
    inputBg: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : COLORS.background,
    },
    messageBubbleOther: {
      backgroundColor: isDark ? colors.card : '#E5E5EA',
    },
  }), [colors, isDark]);

  // Load conversation and messages
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      try {
        // If we have an initial conversationId (from notification), use it directly
        if (initialConversationId) {
          setConversationId(initialConversationId);
          setActiveConversationId(initialConversationId);

          const existingMessages = await chatService.getMessages(initialConversationId);
          const formattedMessages: Message[] = existingMessages.map(msg => ({
            id: msg.id,
            text: msg.text,
            sender: msg.senderRole as 'rider' | 'buyer' | 'farmer',
            timestamp: new Date(msg.createdAt),
            status: msg.status,
          }));
          setMessages(formattedMessages);

          chatService.subscribeToMessages(initialConversationId, handleNewMessage);
          chatService.subscribeToTyping(initialConversationId, handleTypingIndicator);
          chatService.markAsRead(initialConversationId);
          
          setIsLoading(false);
          return;
        }

        // Get or create conversation
        const conversation = await chatService.getOrCreateConversation(
          contact.id,
          contact.role as 'buyer' | 'farmer' | 'rider',
          { orderId: orderId || undefined }
        );

        if (conversation) {
          setConversationId(conversation.id);
          
          // Set active conversation to prevent banner notifications for this chat
          setActiveConversationId(conversation.id);

          // Load existing messages
          const existingMessages = await chatService.getMessages(conversation.id);
          const formattedMessages: Message[] = existingMessages.map(msg => ({
            id: msg.id,
            text: msg.text,
            sender: msg.senderRole as 'rider' | 'buyer' | 'farmer',
            timestamp: new Date(msg.createdAt),
            status: msg.status,
          }));
          setMessages(formattedMessages);

          // Subscribe to new messages
          chatService.subscribeToMessages(conversation.id, handleNewMessage);

          // Subscribe to typing indicators
          chatService.subscribeToTyping(conversation.id, handleTypingIndicator);

          // Mark messages as read
          chatService.markAsRead(conversation.id);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
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
  }, [orderId, contact.id, initialConversationId, setActiveConversationId]);

  // Handle new incoming message from socket
  const handleNewMessage = useCallback((chatMessage: ChatMessage) => {
    const newMsg: Message = {
      id: chatMessage.id,
      text: chatMessage.text,
      sender: chatMessage.senderRole as 'rider' | 'buyer' | 'farmer',
      timestamp: new Date(chatMessage.createdAt),
      status: chatMessage.status,
    };

    setMessages(prev => {
      // Avoid duplicates
      if (prev.find(m => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });

    // Mark as read
    if (conversationId && chatMessage.senderRole !== 'rider') {
      chatService.markAsRead(conversationId, [chatMessage.id]);
    }

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationId]);

  // Handle typing indicator
  const handleTypingIndicator = useCallback((data: { conversationId: string; userId: string; isTyping: boolean }) => {
    if (data.userId !== user?.id) {
      setIsTyping(data.isTyping);
    }
  }, [user?.id]);

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle text input change with typing indicator
  const handleTextChange = (text: string) => {
    setInputText(text);

    if (conversationId) {
      // Send typing indicator
      chatService.sendTypingIndicator(conversationId, true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        chatService.sendTypingIndicator(conversationId, false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId) return;

    const messageText = inputText.trim();
    const tempId = Date.now().toString();

    // Optimistic update
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      sender: 'rider',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setShowQuickMessages(false);
    setIsSending(true);

    // Stop typing indicator
    chatService.sendTypingIndicator(conversationId, false);

    // Animate quick messages out
    Animated.timing(quickMessageAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      // Send to backend
      const sentMessage = await chatService.sendMessage({
        conversationId,
        text: messageText,
      });

      if (sentMessage) {
        // Update with real message data
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {
                  id: sentMessage.id,
                  text: sentMessage.text,
                  sender: 'rider',
                  timestamp: new Date(sentMessage.createdAt),
                  status: sentMessage.status,
                }
              : msg
          )
        );
      } else {
        // Mark as failed
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? { ...msg, status: 'sending' } : msg
          )
        );
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickMessage = (text: string) => {
    setInputText(text);
  };

  const handleCall = () => {
    if (!contact.phone) {
      Alert.alert(
        'Contact Unavailable',
        'Phone number is not available.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Call ' + (contact.role === 'buyer' ? 'Buyer' : 'Farmer'),
      `Would you like to call ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${contact.phone}`).catch(() => {
              Alert.alert('Error', 'Unable to make phone call');
            });
          },
        },
      ]
    );
  };

  const handleViewContactProfile = () => {
    setShowProfileModal(true);
  };

  const contactProfileData: ProfileData = {
    id: contact.id,
    name: contact.name,
    avatar: contact.avatar,
    phone: contact.phone,
    email: contact.email,
    location: contact.location,
    role: contact.role,
    rating: contact.rating,
    totalOrders: contact.totalOrders,
    memberSince: contact.memberSince,
    isOnline: contact.isOnline,
    isVerified: contact.isVerified,
    bio: contact.bio,
    specialties: contact.role === 'farmer' ? contact.specialties : undefined,
  };

  const handleSelectImage = (uri: string) => {
    Alert.alert('Image Selected', 'Image sending feature coming soon!');
    console.log('Selected image:', uri);
  };

  const handleSelectCamera = (uri: string) => {
    Alert.alert('Photo Taken', 'Photo sending feature coming soon!');
    console.log('Camera photo:', uri);
  };

  const handleSelectLocation = () => {
    Alert.alert('Share Location', 'Location sharing feature coming soon!');
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" />;
      case 'sent':
        return <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.7)" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.7)" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={12} color="#34C759" />;
      default:
        return null;
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isRider = item.sender === 'rider';
    const showAvatar = !isRider && (index === 0 || messages[index - 1].sender === 'rider');

    return (
      <View style={[
        styles.messageContainer,
        isRider ? styles.messageContainerRight : styles.messageContainerLeft,
      ]}>
        {!isRider && showAvatar && (
          <View style={[
            styles.avatarSmall,
            { backgroundColor: contact.role === 'buyer' ? COLORS.success : COLORS.primary }
          ]}>
            <Ionicons 
              name={contact.role === 'buyer' ? 'cart' : 'leaf'} 
              size={14} 
              color="#FFFFFF" 
            />
          </View>
        )}
        {!isRider && !showAvatar && <View style={styles.avatarPlaceholder} />}
        
        <View style={[
          styles.messageBubble,
          isRider ? styles.messageBubbleRight : [styles.messageBubbleLeft, dynamicStyles.messageBubbleOther],
        ]}>
          <Text style={[
            styles.messageText,
            isRider ? styles.messageTextRight : { color: colors.text },
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isRider ? styles.messageTimeRight : { color: colors.textSecondary },
            ]}>
              {formatTime(item.timestamp)}
            </Text>
            {isRider && getStatusIcon(item.status)}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, dynamicStyles.container]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          dynamicStyles.headerBg,
          {
            paddingTop: insets.top,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
            opacity: headerAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} onPress={handleViewContactProfile}>
          <View style={[
            styles.avatar,
            { backgroundColor: contact.role === 'buyer' ? COLORS.success : COLORS.primary }
          ]}>
            <Ionicons 
              name={contact.role === 'buyer' ? 'cart' : 'leaf'} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.text }]}>{contact.name}</Text>
            <Text style={[styles.headerRole, { color: colors.textSecondary }]}>
              {contact.role === 'buyer' ? 'Buyer' : 'Farmer'} • Order #{orderId.slice(-6)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCall}>
            <Ionicons name="call" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
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
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          }
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingContainer}>
                <View style={[styles.typingBubble, dynamicStyles.messageBubbleOther]}>
                  <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                    {contact.name} is typing...
                  </Text>
                </View>
              </View>
            ) : null
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
              transform: [
                {
                  translateY: quickMessageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <FlatList
            horizontal
            data={QUICK_MESSAGES}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickMessagesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.quickMessageButton,
                  { backgroundColor: isDark ? colors.card : '#E5E5EA' }
                ]}
                onPress={() => handleQuickMessage(item)}
              >
                <Text style={[styles.quickMessageText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, dynamicStyles.inputContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.md }]}>
        <TouchableOpacity style={styles.attachButton} onPress={() => setShowAttachmentMenu(true)}>
          <Ionicons name="add-circle" size={28} color="#FF9500" />
        </TouchableOpacity>
        <View style={[styles.inputWrapper, dynamicStyles.inputBg]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <TouchableOpacity style={styles.emojiButton} onPress={() => setShowEmojiPicker(true)}>
            <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            inputText.trim() && !isSending ? styles.sendButtonActive : {},
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? '#FFFFFF' : colors.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Attachment Menu Modal */}
      <AttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onSelectImage={handleSelectImage}
        onSelectCamera={handleSelectCamera}
        onSelectLocation={handleSelectLocation}
      />

      {/* Emoji Picker Modal */}
      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleSelectEmoji}
      />

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={contactProfileData}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: SPACING.sm,
  },
  headerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  headerRole: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 139, 34, 0.1)',
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-end',
  },
  messageContainerLeft: {
    justifyContent: 'flex-start',
  },
  messageContainerRight: {
    justifyContent: 'flex-end',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  avatarPlaceholder: {
    width: 28,
    marginRight: SPACING.xs,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
  },
  messageBubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  messageTextRight: {
    color: '#FFFFFF',
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
  },
  messageTimeRight: {
    color: 'rgba(255,255,255,0.7)',
  },
  quickMessagesContainer: {
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  quickMessagesList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  quickMessageButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    marginRight: SPACING.xs,
  },
  quickMessageText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
    marginBottom: Platform.OS === 'ios' ? 4 : 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    paddingTop: Platform.OS === 'ios' ? 0 : SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 0 : SPACING.sm,
  },
  emojiButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
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
  },
  typingContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  typingBubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '60%',
  },
  typingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
});

export default DeliveryChatScreen;
