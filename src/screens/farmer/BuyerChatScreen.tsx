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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useMessageBanner } from '../../context/MessageBannerContext';
import { useAppSelector } from '../../store';
import { chatService, ChatMessage } from '../../services/chatService';
import { uploadService } from '../../services/uploadService';
import { AttachmentMenu, EmojiPicker } from '../../components/common/ChatInputAccessories';
import ProfileModal, { ProfileData } from '../../components/common/ProfileModal';
import { FarmerStackParamList } from '../../types';

interface Message {
  id: string;
  text: string;
  sender: 'buyer' | 'farmer';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'product' | 'location';
  imageUrl?: string;
  location?: { lat: number; lng: number };
  productData?: {
    name: string;
    price: number;
    image: string;
  };
}

interface Buyer {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: Date;
  phone: string;
  email?: string;
  location?: string;
  rating?: number;
  totalOrders?: number;
  memberSince?: string;
  isVerified?: boolean;
  bio?: string;
}

const QUICK_MESSAGES = [
  'Yes, it\'s available!',
  'Let me check for you',
  'Your order is ready',
  'Thank you for your order!',
];

// Get buyer data from route params
const getBuyerFromParams = (params: any): Buyer => ({
  id: params?.buyerId || params?.senderId || '',
  name: params?.buyerName || params?.recipientName || 'Customer',
  avatar: params?.buyerAvatar || params?.senderAvatar || '',
  isOnline: params?.isOnline ?? true,
  phone: params?.buyerPhone || '',
  email: params?.buyerEmail || '',
  location: params?.buyerLocation || '',
  rating: params?.buyerRating || 0,
  totalOrders: params?.buyerTotalOrders || 0,
  memberSince: params?.buyerMemberSince || '',
  isVerified: params?.buyerIsVerified ?? false,
  bio: params?.buyerBio || '',
});

const BuyerChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { colors, isDark } = useTheme();
  const { setActiveConversationId } = useMessageBanner();
  const currentUser = useAppSelector(state => state.auth.user);

  // Get buyer data from route params
  const routeParams = route.params as any;
  const [buyer, setBuyer] = useState<Buyer>(getBuyerFromParams(routeParams));
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }

      // Validate we have required data
      const hasBuyerId = buyer.id && buyer.id.length > 0;
      if (!hasBuyerId && !initialConversationId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // If we have an initial conversationId (from notification), use it directly
        if (initialConversationId) {
          setConversationId(initialConversationId);
          setActiveConversationId(initialConversationId);
          
          const existingMessages = await chatService.getMessages(initialConversationId);
          const formattedMessages: Message[] = existingMessages.map((msg: ChatMessage) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.senderId === currentUser.id ? 'farmer' : 'buyer',
            timestamp: new Date(msg.createdAt),
            status: msg.status as Message['status'],
            type: msg.type as Message['type'],
            imageUrl: msg.metadata?.imageUrl,
            location: msg.metadata?.location,
          }));
          setMessages(formattedMessages);

          await chatService.markAsRead(initialConversationId);
          chatService.subscribeToMessages(initialConversationId, handleNewMessage);
          chatService.subscribeToTyping(initialConversationId, handleTypingIndicator);
          
          setIsLoading(false);
          return;
        }
        
        // Get or create conversation with buyer
        const conversation = await chatService.getOrCreateConversation(
          buyer.id,
          'buyer',
          { orderId: orderId || undefined, productId: productId || undefined }
        );
        
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
          sender: msg.senderId === currentUser.id ? 'farmer' : 'buyer',
          timestamp: new Date(msg.createdAt),
          status: msg.status as Message['status'],
          type: msg.type as Message['type'],
          imageUrl: msg.metadata?.imageUrl,
          location: msg.metadata?.location,
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
  }, [buyer.id, currentUser?.id, orderId, productId, initialConversationId, setActiveConversationId]);

  // Handle new incoming messages
  const handleNewMessage = useCallback((chatMessage: ChatMessage) => {
    if (chatMessage.senderId === currentUser?.id) return;

    const newMessage: Message = {
      id: chatMessage.id,
      text: chatMessage.text,
      sender: 'buyer',
      timestamp: new Date(chatMessage.createdAt),
      status: chatMessage.status as Message['status'],
      type: chatMessage.type as Message['type'],
      imageUrl: chatMessage.metadata?.imageUrl,
      location: chatMessage.metadata?.location,
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

  const simulateBuyerTyping = () => {
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
    if (!inputText.trim() || !conversationId || isSending) return;

    const messageText = inputText.trim();
    const tempId = `temp-${Date.now()}`;

    // Create optimistic message
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      sender: 'farmer',
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
    if (!buyer.phone && !buyer.id) {
      Alert.alert(
        'Contact Unavailable',
        'Buyer contact is not available. You can continue messaging here.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Call Buyer',
      `Would you like to call ${buyer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Phone Call',
          onPress: () => {
            if (buyer.phone) {
              Linking.openURL(`tel:${buyer.phone}`).catch(() => {
                Alert.alert('Error', 'Unable to make phone call');
              });
            } else {
              Alert.alert('Error', 'Phone number not available');
            }
          },
        },
        {
          text: 'In-App Voice Call',
          onPress: () => {
            (navigation as NavigationProp<FarmerStackParamList>).navigate('VoiceCall', {
              userId: buyer.id,
              userName: buyer.name,
              userAvatar: buyer.avatar,
              isIncoming: false,
            });
          },
        },
      ]
    );
  };

  const handleVideoCall = () => {
    if (!buyer.id) {
      Alert.alert('Error', 'Cannot initiate video call. Buyer information not available.');
      return;
    }
    
    (navigation as NavigationProp<FarmerStackParamList>).navigate('VideoCall', {
      userId: buyer.id,
      userName: buyer.name,
      userAvatar: buyer.avatar,
      callType: 'video',
      isIncoming: false,
    });
  };

  const handleViewBuyerProfile = () => {
    setShowProfileModal(true);
  };

  const buyerProfileData: ProfileData = {
    id: buyer.id,
    name: buyer.name,
    avatar: buyer.avatar,
    phone: buyer.phone,
    email: buyer.email,
    location: typeof buyer.location === 'object' && buyer.location 
      ? (buyer.location as any).city || (buyer.location as any).state || (buyer.location as any).address || ''
      : buyer.location || '',
    role: 'buyer',
    rating: buyer.rating,
    totalOrders: buyer.totalOrders,
    memberSince: buyer.memberSince,
    isOnline: buyer.isOnline,
    isVerified: buyer.isVerified,
    bio: buyer.bio,
  };

  const handleSelectImage = async (uri: string) => {
    if (!conversationId) {
      Alert.alert('Error', 'Cannot send image without an active conversation');
      return;
    }

    try {
      let base64: string;
      
      // Read image as base64 with fallback
      if (FileSystem.EncodingType?.Base64) {
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        // Fallback using fetch and FileReader
        const response = await fetch(uri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      // Upload image
      const result = await uploadService.uploadImage(base64, 'chat');
      
      if (result.success && result.data?.url) {
        const imageMessage: Message = {
          id: `msg_${Date.now()}`,
          text: '',
          type: 'image',
          imageUrl: result.data.url,
          sender: 'farmer',
          timestamp: new Date(),
          status: 'sending',
        };
        
        setMessages(prev => [...prev, imageMessage]);
        
        // Send via chat service
        chatService.sendMessage({
          conversationId,
          text: '',
          type: 'image',
          metadata: { imageUrl: result.data.url },
        });
        
        // Update status
        setTimeout(() => {
          setMessages(prev => prev.map(m => 
            m.id === imageMessage.id ? { ...m, status: 'sent' } : m
          ));
        }, 500);
      } else {
        Alert.alert('Error', 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image');
    }
  };

  const handleSelectCamera = async (uri: string) => {
    await handleSelectImage(uri);
  };

  const handleSelectLocation = async () => {
    if (!conversationId) {
      Alert.alert('Error', 'Cannot share location without an active conversation');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to share your location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const locationMessage: Message = {
        id: `msg_${Date.now()}`,
        text: 'Shared current location',
        type: 'location',
        location: { lat: latitude, lng: longitude },
        sender: 'farmer',
        timestamp: new Date(),
        status: 'sending',
      };

      setMessages(prev => [...prev, locationMessage]);

      // Send via chat service
      chatService.sendMessage({
        conversationId,
        text: 'Shared current location',
        type: 'location',
        metadata: { location: { lat: latitude, lng: longitude } },
      });

      setTimeout(() => {
        setMessages(prev => prev.map(m => 
          m.id === locationMessage.id ? { ...m, status: 'sent' } : m
        ));
      }, 500);
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
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
        return <Ionicons name="checkmark-done" size={14} color="#34C759" />;
      default:
        return null;
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isFarmer = item.sender === 'farmer';
    const showAvatar = !isFarmer && (index === 0 || messages[index - 1]?.sender !== 'buyer');
    const isImage = item.type === 'image';
    const isLocation = item.type === 'location';
    const imageUrl = item.imageUrl || item.productData?.image || (item as any).metadata?.imageUrl;
    const locationData = item.location || (item as any).metadata?.location;

    return (
      <View style={[styles.messageRow, isFarmer && styles.messageRowFarmer]}>
        {!isFarmer && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              buyer.avatar && buyer.avatar.trim() !== '' ? (
                <Image source={{ uri: buyer.avatar }} style={styles.messageAvatar} />
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
        
        <View style={[
          styles.messageBubble, 
          isFarmer ? styles.farmerBubble : styles.buyerBubble,
          !isFarmer && { backgroundColor: isDark ? colors.card : COLORS.white }
        ]}>
          {(isImage || imageUrl) && imageUrl ? (
            <TouchableOpacity 
              onPress={() => setSelectedImage(imageUrl)}
              style={styles.imageMessageContainer}
            >
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : isLocation && locationData ? (
            <TouchableOpacity 
              onPress={() => {
                const url = Platform.select({
                  ios: `maps:0,0?q=${locationData.lat},${locationData.lng}`,
                  android: `geo:${locationData.lat},${locationData.lng}?q=${locationData.lat},${locationData.lng}`,
                }) || `https://www.google.com/maps/search/?api=1&query=${locationData.lat},${locationData.lng}`;
                Linking.openURL(url).catch(() => {
                  Alert.alert('Error', 'Unable to open maps');
                });
              }}
              style={styles.locationMessage}
            >
              <Ionicons name="location" size={24} color={isFarmer ? '#FFFFFF' : COLORS.primary} />
              <Text style={[styles.locationText, { color: isFarmer ? COLORS.white : colors.text }]}>
                {item.text || 'Tap to view location'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.messageText, isFarmer && styles.farmerMessageText, !isFarmer && { color: colors.text }]}>
              {item.text}
            </Text>
          )}
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isFarmer && styles.farmerMessageTime, !isFarmer && { color: colors.textSecondary }]}>
              {formatTime(item.timestamp)}
            </Text>
            {isFarmer && (
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
        {buyer.avatar && buyer.avatar.trim() !== '' ? (
          <Image source={{ uri: buyer.avatar }} style={styles.typingAvatar} />
        ) : (
          <View style={[styles.typingAvatar, styles.avatarFallback]}>
            <Ionicons name="person" size={14} color={COLORS.white} />
          </View>
        )}
        <View style={[styles.typingBubble, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
          <Animated.View
            style={[
              styles.typingDot,
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
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {/* SVG Background Decoration */}
          <View style={styles.headerSvgBackground}>
            <Svg width="100%" height="140" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice">
              <Defs>
                <SvgLinearGradient id="chatHeaderGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#34C759" stopOpacity={isDark ? 0.2 : 0.12} />
                  <Stop offset="100%" stopColor="#30D158" stopOpacity={isDark ? 0.12 : 0.06} />
                </SvgLinearGradient>
                <SvgLinearGradient id="chatHeaderGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#30D158" stopOpacity={isDark ? 0.15 : 0.08} />
                  <Stop offset="100%" stopColor="#34C759" stopOpacity={isDark ? 0.08 : 0.03} />
                </SvgLinearGradient>
              </Defs>
              <Circle cx="350" cy="20" r="80" fill="url(#chatHeaderGrad1)" />
              <Circle cx="380" cy="80" r="50" fill="url(#chatHeaderGrad2)" />
              <Circle cx="30" cy="100" r="60" fill="url(#chatHeaderGrad2)" />
              <Path d="M0,100 Q100,60 200,100 T400,80" fill="none" stroke="url(#chatHeaderGrad1)" strokeWidth="40" opacity={0.3} />
            </Svg>
          </View>

          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1C1C1E'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerInfo} onPress={handleViewBuyerProfile}>
            <View style={styles.avatarWrapper}>
              {buyer.avatar && buyer.avatar.trim() !== '' ? (
                <Image source={{ uri: buyer.avatar }} style={[styles.headerAvatar, { borderColor: '#34C759' }]} />
              ) : (
                <View style={[styles.headerAvatar, styles.avatarFallbackHeader, { backgroundColor: '#34C759' }]}>
                  <Ionicons name="person" size={18} color={COLORS.white} />
                </View>
              )}
              {buyer.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.headerName, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>{buyer.name}</Text>
              <Text style={[styles.headerStatus, { color: '#8E8E93' }]}>
                {buyer.isOnline ? '🟢 Online' : `Last seen ${formatLastSeen(buyer.lastSeen)}`}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#E8F8EE' }]} onPress={handleCall}>
              <Ionicons name="call" size={22} color="#34C759" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#E8F8EE' }]} onPress={handleVideoCall}>
              <Ionicons name="videocam" size={24} color="#34C759" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Messages */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading messages...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item?.id || `msg-${index}`}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages yet.{'\n'}Start the conversation!
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
          <Text style={[styles.quickMessagesTitle, { color: colors.textSecondary }]}>Quick Replies</Text>
          <View style={styles.quickMessagesList}>
            {QUICK_MESSAGES.map((msg, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickMessageChip, { backgroundColor: isDark ? colors.card : COLORS.white, borderColor: isDark ? 'rgba(52, 199, 89, 0.5)' : '#34C759' }]}
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
        <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : COLORS.white, borderTopColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }]}>
          <TouchableOpacity style={styles.attachButton} onPress={() => setShowAttachmentMenu(true)}>
            <Ionicons name="add-circle" size={28} color="#34C759" />
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
                colors={inputText.trim() ? ['#34C759', '#28A745'] : [COLORS.border, COLORS.border]}
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
        profile={buyerProfileData}
      />

      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreviewFull}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  headerSvgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  avatarFallbackHeader: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  headerText: {
    marginLeft: SPACING.sm,
  },
  headerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
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
  messageRowFarmer: {
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
  avatarFallback: {
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  buyerBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  farmerBubble: {
    backgroundColor: '#34C759',
    borderBottomRightRadius: 4,
  },
  imageMessageContainer: {
    marginBottom: SPACING.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  locationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  locationText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  farmerMessageText: {
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
  farmerMessageTime: {
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
    borderColor: '#34C759',
  },
  quickMessageText: {
    fontSize: FONT_SIZES.xs,
    color: '#34C759',
    fontWeight: '500',
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
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imagePreviewFull: {
    width: '100%',
    height: '80%',
  },
});

export default BuyerChatScreen;
