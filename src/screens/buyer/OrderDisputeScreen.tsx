import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { BuyerStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner, ErrorState } from '../../components/common';
import disputeService, {
  Dispute,
  DisputeMessage,
  DisputeType,
  DisputeStatus,
  CreateDisputeData,
} from '../../services/disputeService';
import { orderService } from '../../services/orderService';
import { uploadService } from '../../services/uploadService';
import { formatCurrency } from '../../utils/formatters';

type Props = NativeStackScreenProps<BuyerStackParamList, 'OrderDispute'>;

const DISPUTE_TYPES: { value: DisputeType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'product_quality', label: 'Product Quality Issue', icon: 'alert-circle' },
  { value: 'missing_items', label: 'Missing Items', icon: 'remove-circle' },
  { value: 'wrong_items', label: 'Wrong Items Received', icon: 'swap-horizontal' },
  { value: 'damaged_products', label: 'Damaged Products', icon: 'bandage' },
  { value: 'late_delivery', label: 'Late Delivery', icon: 'time' },
  { value: 'refund_request', label: 'Refund Request', icon: 'cash' },
  { value: 'overcharge', label: 'Overcharged', icon: 'card' },
  { value: 'rider_issue', label: 'Rider Issue', icon: 'bicycle' },
  { value: 'farmer_issue', label: 'Farmer Issue', icon: 'person' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#E65100', bg: '#FFF3E0' },
  under_review: { label: 'Under Review', color: '#1976D2', bg: '#E3F2FD' },
  awaiting_response: { label: 'Awaiting Response', color: '#7B1FA2', bg: '#F3E5F5' },
  resolved: { label: 'Resolved', color: '#2E7D32', bg: '#E8F5E9' },
  closed: { label: 'Closed', color: '#616161', bg: '#F5F5F5' },
  escalated: { label: 'Escalated', color: '#C62828', bg: '#FFEBEE' },
};

export default function OrderDisputeScreen({ route, navigation }: Props) {
  const { orderId, disputeId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [existingDispute, setExistingDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Form state (for creating new dispute)
  const [selectedType, setSelectedType] = useState<DisputeType | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [requestedAmount, setRequestedAmount] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, [orderId, disputeId]);

  // Helper to get proper dispute ID (handles wrapped data)
  const getDisputeId = (dispute: Dispute | null): string | null => {
    if (!dispute) return null;
    return (dispute as any).data?.id || dispute.id || null;
  };

  // WebSocket connection for existing disputes
  useEffect(() => {
    const disputeId = getDisputeId(existingDispute);
    if (disputeId) {
      setupWebSocket(disputeId);
      return () => {
        disputeService.leaveDispute();
      };
    }
  }, [existingDispute]);

  // Helper function to deduplicate messages by ID
  const deduplicateMessages = (msgs: DisputeMessage[]): DisputeMessage[] => {
    const seen = new Map<string, DisputeMessage>();
    for (const msg of msgs) {
      if (msg.id && !seen.has(msg.id)) {
        seen.set(msg.id, msg);
      }
    }
    return Array.from(seen.values());
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load order details
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);

      // Check if there's an existing dispute
      if (disputeId) {
        const dispute = await disputeService.getDisputeById(disputeId);
        setExistingDispute(dispute);
        setMessages(deduplicateMessages(dispute.messages || []));
      } else {
        // Check for any existing disputes on this order
        try {
          const disputes = await disputeService.getOrderDisputes(orderId);
          console.log('Loaded disputes for order:', orderId, disputes);
          console.log('Disputes type:', typeof disputes);
          console.log('Is array:', Array.isArray(disputes));
          const disputesList = Array.isArray(disputes) ? disputes : [];
          console.log('Disputes list:', disputesList);
          const activeDispute = disputesList.find(
            (d) => !['resolved', 'closed'].includes(d.status)
          );
          if (activeDispute) {
            console.log('Found active dispute:', activeDispute);
            console.log('Active dispute id:', activeDispute.id);
            console.log('Active dispute id type:', typeof activeDispute.id);
            setExistingDispute(activeDispute);
            setMessages(deduplicateMessages(activeDispute.messages || []));
          }
        } catch (disputeError) {
          console.log('No existing disputes found or error:', disputeError);
          // It's ok if there are no disputes - user can create one
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = async (id: string) => {
    try {
      const dispute = await disputeService.joinDispute(id);
      // Merge messages, avoiding duplicates using deduplication helper
      setMessages((prev) => {
        const combined = [...prev, ...(dispute.messages || [])];
        return deduplicateMessages(combined);
      });

      // Listen for new messages
      const unsubMessage = disputeService.onMessage(id, (message) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        // Show new message indicator if not at bottom, otherwise scroll
        if (isAtBottomRef.current) {
          setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        } else {
          setHasNewMessage(true);
        }
      });

      // Listen for typing
      const unsubTyping = disputeService.onTyping(id, (data) => {
        if (data.isAdmin) {
          setIsTyping(data.isTyping);
        }
      });

      // Listen for status changes
      const unsubStatus = disputeService.onStatusChange(id, (data) => {
        setExistingDispute((prev) =>
          prev ? { ...prev, status: data.status, resolution: data.resolution } : null
        );
      });

      return () => {
        unsubMessage();
        unsubTyping();
        unsubStatus();
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - images.length,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        // Upload images
        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
          if (asset.base64) {
            const base64Data = `data:image/jpeg;base64,${asset.base64}`;
            const uploadResult = await uploadService.uploadImage(base64Data, 'disputes');
            if (uploadResult.success && uploadResult.data) {
              uploadedUrls.push(uploadResult.data.url);
            }
          }
        }
        setImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to pick images:', error);
      Alert.alert('Error', 'Failed to upload images');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitDispute = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a dispute type');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!description.trim() || description.length < 10) {
      Alert.alert('Error', 'Please provide a detailed description (at least 10 characters)');
      return;
    }

    try {
      setIsSubmitting(true);

      // Parse requested amount safely
      let parsedAmount: number | undefined = undefined;
      if (requestedAmount && requestedAmount.trim()) {
        const amount = parseFloat(requestedAmount);
        if (!isNaN(amount) && amount > 0) {
          parsedAmount = amount;
        }
      }

      const data: CreateDisputeData = {
        orderId,
        type: selectedType,
        subject: subject.trim(),
        description: description.trim(),
        images: images.length > 0 ? images : undefined,
        requestedAmount: parsedAmount,
      };

      console.log('Submitting dispute:', JSON.stringify(data, null, 2));

      const dispute = await disputeService.createDispute(data);
      setExistingDispute(dispute);
      setMessages(dispute.messages || []);

      Alert.alert('Success', 'Your dispute has been submitted. Our support team will review it shortly.');
    } catch (error: any) {
      console.error('Failed to submit dispute:', error);
      console.error('Error response:', error.response?.data);
      
      // Check if it's "already exists" error - load the existing dispute
      const errorMsg = error.response?.data?.message || '';
      if (errorMsg.includes('already exists')) {
        // Reload to get the existing dispute
        Alert.alert(
          'Existing Dispute Found',
          'You already have an active dispute for this order. Loading it now.',
          [{ text: 'OK', onPress: () => loadData() }]
        );
        return;
      }
      
      // Extract validation error messages if available
      let errorMessage = 'Failed to submit dispute';
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join('\n');
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !existingDispute) return;

    // Get the dispute ID - handle case where it might be wrapped
    const disputeId = (existingDispute as any).data?.id || existingDispute.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!disputeId || !uuidRegex.test(disputeId)) {
      console.error('[OrderDisputeScreen] Invalid dispute ID:', disputeId);
      console.error('[OrderDisputeScreen] Full dispute object:', JSON.stringify(existingDispute, null, 2));
      Alert.alert('Error', 'Invalid dispute ID. Please try again.');
      return;
    }

    console.log('[OrderDisputeScreen] handleSendMessage called');
    console.log('[OrderDisputeScreen] disputeId:', disputeId);
    console.log('[OrderDisputeScreen] newMessage:', newMessage.trim());

    try {
      setIsSending(true);
      console.log('[OrderDisputeScreen] Attempting WebSocket send...');
      const message = await disputeService.sendMessage(disputeId, newMessage.trim());
      console.log('[OrderDisputeScreen] WebSocket send successful, message:', message);
      // Add message to local state (in case we don't receive the new_message event)
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      setNewMessage('');
    } catch (error: any) {
      console.error('[OrderDisputeScreen] WebSocket failed:', error);
      console.error('[OrderDisputeScreen] WebSocket error message:', error?.message);
      // Try REST fallback
      try {
        console.log('[OrderDisputeScreen] Trying REST fallback...');
        const message = await disputeService.sendMessageRest(disputeId, newMessage.trim());
        console.log('[OrderDisputeScreen] REST fallback successful:', message);
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
      } catch (e: any) {
        console.error('[OrderDisputeScreen] REST fallback failed:', e);
        console.error('[OrderDisputeScreen] REST error message:', e?.message);
        console.error('[OrderDisputeScreen] REST error response:', e?.response?.data);
        Alert.alert('Error', 'Failed to send message');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    const disputeId = getDisputeId(existingDispute);
    if (disputeId) {
      disputeService.sendTyping(disputeId, text.length > 0);
    }
  };

  // Handle scroll to detect if user is at bottom
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    const atBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isAtBottomRef.current = atBottom;
    setShowScrollButton(!atBottom);
    if (atBottom) {
      setHasNewMessage(false);
    }
  };

  // Scroll to bottom and clear new message indicator
  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setHasNewMessage(false);
    setShowScrollButton(false);
    isAtBottomRef.current = true;
  };

  const renderMessage = ({ item }: { item: DisputeMessage }) => {
    const isUser = item.senderType === 'user';
    const isSystem = item.senderType === 'system';

    if (isSystem) {
      return (
        <View style={[styles.systemMessage, { backgroundColor: colors.background }]}>
          <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
          <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
            {item.content}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.adminMessage,
          {
            backgroundColor: isUser ? colors.primary : isDark ? '#2D2D2D' : '#F0F0F0',
          },
        ]}
      >
        {!isUser && (
          <View style={styles.senderInfo}>
            <Ionicons name="headset" size={14} color={colors.primary} />
            <Text style={[styles.senderName, { color: colors.primary }]}>Support</Text>
          </View>
        )}
        <Text style={[styles.messageText, { color: isUser ? '#FFFFFF' : colors.text }]}>
          {item.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
          ]}
        >
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!order) {
    return (
      <ErrorState
        message="Order Not Found - We couldn't find the order details."
        onRetry={loadData}
      />
    );
  }

  // If there's an existing dispute, show chat view
  if (existingDispute) {
    const statusConfig = STATUS_CONFIG[existingDispute.status] || { 
      label: existingDispute.status || 'Unknown', 
      color: '#666666', 
      bg: '#F5F5F5' 
    };

    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Dispute #{existingDispute.disputeNumber}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Dispute Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {DISPUTE_TYPES.find((t) => t.value === existingDispute.type)?.label}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Order:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              #{order.orderNumber}
            </Text>
          </View>
          {existingDispute.assignedTo && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Assigned to:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {existingDispute.assignedTo.name}
              </Text>
            </View>
          )}
        </View>

        {/* Messages Container with scroll indicators */}
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id || `msg-${index}`}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => {
              if (isAtBottomRef.current) {
                flatListRef.current?.scrollToEnd();
              }
            }}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No messages yet. Send a message to start the conversation.
                </Text>
              </View>
            }
          />

          {/* New message indicator - shows when scrolled up and new message arrives */}
          {hasNewMessage && (
            <TouchableOpacity 
              style={styles.newMessageIndicator}
              onPress={scrollToBottom}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
              <Text style={styles.newMessageText}>New message</Text>
            </TouchableOpacity>
          )}

          {/* Scroll to bottom button - shows when scrolled up */}
          {showScrollButton && !hasNewMessage && (
            <TouchableOpacity 
              style={styles.scrollToBottomButton}
              onPress={scrollToBottom}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={[styles.typingText, { color: colors.textSecondary }]}>
              Support is typing...
            </Text>
          </View>
        )}

        {/* Message Input */}
        {existingDispute.status !== 'resolved' && existingDispute.status !== 'closed' && (
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={newMessage}
              onChangeText={handleTyping}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: newMessage.trim() ? colors.primary : colors.textSecondary },
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Resolution banner */}
        {existingDispute.status === 'resolved' && existingDispute.resolution && (
          <View style={[styles.resolutionBanner, { backgroundColor: '#E8F5E9', marginBottom: insets.bottom }]}>
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
            <View style={styles.resolutionContent}>
              <Text style={styles.resolutionTitle}>Dispute Resolved</Text>
              <Text style={styles.resolutionText}>
                {existingDispute.resolutionNotes}
              </Text>
              {existingDispute.refundedAmount && existingDispute.refundedAmount > 0 && (
                <Text style={styles.refundText}>
                  Refund: {formatCurrency(existingDispute.refundedAmount)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Bottom safe area when dispute is closed with no banner */}
        {(existingDispute.status === 'closed' || (existingDispute.status === 'resolved' && !existingDispute.resolution)) && (
          <View style={{ height: insets.bottom }} />
        )}
      </KeyboardAvoidingView>
    );
  }

  // Show create dispute form
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Report an Issue</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Info */}
        <View style={[styles.orderCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Details</Text>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderNumber, { color: colors.text }]}>
              #{order.orderNumber}
            </Text>
            <Text style={[styles.orderAmount, { color: colors.primary }]}>
              {formatCurrency(order.total)}
            </Text>
          </View>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Issue Type */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What's the issue?</Text>
          <View style={styles.typeGrid}>
            {DISPUTE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor:
                      selectedType === type.value ? colors.primary + '20' : colors.background,
                    borderColor: selectedType === type.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedType(type.value)}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={selectedType === type.value ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    {
                      color: selectedType === type.value ? colors.primary : colors.text,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subject</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Brief summary of the issue"
            placeholderTextColor={colors.textSecondary}
            value={subject}
            onChangeText={setSubject}
            maxLength={255}
          />
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Please describe the issue in detail..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {description.length}/2000
          </Text>
        </View>

        {/* Images */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Attach Photos (Optional)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Add up to 5 photos to support your claim
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                style={[styles.addImageButton, { borderColor: colors.border }]}
                onPress={handlePickImages}
              >
                <Ionicons name="camera" size={32} color={colors.textSecondary} />
                <Text style={[styles.addImageText, { color: colors.textSecondary }]}>
                  Add Photo
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Requested Amount */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Requested Refund Amount (Optional)
          </Text>
          <View
            style={[
              styles.amountInput,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.currencySymbol, { color: colors.text }]}>₦</Text>
            <TextInput
              style={[styles.amountTextInput, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={requestedAmount}
              onChangeText={setRequestedAmount}
              keyboardType="numeric"
            />
          </View>
          <Text style={[styles.amountHint, { color: colors.textSecondary }]}>
            Max: {formatCurrency(order.total)}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitDispute}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Dispute</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
    marginTop: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  orderCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  orderNumber: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  orderAmount: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  orderDate: {
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  section: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  typeButton: {
    width: '31%',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  textArea: {
    minHeight: 120,
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'right',
    marginTop: 4,
  },
  imagesRow: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginRight: SPACING.xs,
  },
  amountTextInput: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    paddingVertical: SPACING.sm,
  },
  amountHint: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  // Chat styles
  infoCard: {
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  messagesList: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    alignSelf: 'center',
  },
  systemMessageText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  adminMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  senderName: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  newMessageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    marginHorizontal: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    gap: SPACING.xs,
    ...SHADOWS.medium,
    zIndex: 100,
    width: 150,
  },
  newMessageText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 16,
    right: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
    zIndex: 100,
  },
  typingIndicator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  typingText: {
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
    fontSize: FONT_SIZES.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolutionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  resolutionContent: {
    flex: 1,
  },
  resolutionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#2E7D32',
  },
  resolutionText: {
    fontSize: FONT_SIZES.sm,
    color: '#2E7D32',
    marginTop: 4,
  },
  refundText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#2E7D32',
    marginTop: SPACING.xs,
  },
});
