import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { disputeService, DisputeMessage, Dispute, DisputeStatus } from '../../services/disputeService';
import { uploadService } from '../../services/uploadService';
import { API_CONFIG } from '../../constants/config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

// Date formatter
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-US', options);
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  open: { label: 'Open', color: '#f59e0b', bg: '#fef3c7', icon: 'alert-circle' },
  under_review: { label: 'Under Review', color: '#3b82f6', bg: '#dbeafe', icon: 'eye' },
  awaiting_response: { label: 'Awaiting Response', color: '#8b5cf6', bg: '#ede9fe', icon: 'time' },
  resolved: { label: 'Resolved', color: '#10b981', bg: '#d1fae5', icon: 'checkmark-circle' },
  closed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6', icon: 'close-circle' },
  escalated: { label: 'Escalated', color: '#ef4444', bg: '#fee2e2', icon: 'warning' },
};

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  product_quality: { label: 'Product Quality', icon: '🥬' },
  missing_items: { label: 'Missing Items', icon: '📦' },
  wrong_items: { label: 'Wrong Items', icon: '🔄' },
  late_delivery: { label: 'Late Delivery', icon: '⏰' },
  damaged_products: { label: 'Damaged Products', icon: '💔' },
  refund_request: { label: 'Refund Request', icon: '💰' },
  overcharge: { label: 'Overcharge', icon: '💳' },
  rider_issue: { label: 'Rider Issue', icon: '🚴' },
  farmer_issue: { label: 'Farmer Issue', icon: '👨‍🌾' },
  other: { label: 'Other', icon: '❓' },
};

interface Props {
  userType: 'farmer' | 'rider';
}

export default function DisputeDetailScreen({ userType }: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { disputeId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  const loadDispute = useCallback(async () => {
    try {
      setLoading(true);
      const data = await disputeService.getDisputeById(disputeId);
      setDispute(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading dispute:', error);
      Alert.alert('Error', 'Failed to load dispute details');
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useFocusEffect(
    useCallback(() => {
      loadDispute();
    }, [loadDispute])
  );

  // Setup WebSocket for real-time messages
  useEffect(() => {
    if (dispute?.id) {
      const setup = async () => {
        try {
          await disputeService.connect();
          const joinedDispute = await disputeService.joinDispute(dispute.id);
          if (joinedDispute.messages) {
            setMessages(joinedDispute.messages);
          }

          const unsubMessage = disputeService.onMessage(dispute.id, (message) => {
            setMessages((prev) => [...prev, message]);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
          });

          return () => {
            unsubMessage();
            disputeService.leaveDispute();
          };
        } catch (error) {
          console.error('WebSocket setup error:', error);
        }
      };
      setup();
    }
  }, [dispute?.id]);

  const handlePickImage = async () => {
    if (attachments.length >= 3) {
      Alert.alert('Limit Reached', 'You can attach up to 3 images per message');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const uploadResult = await uploadService.uploadImage(base64Data, 'disputes');
        if (uploadResult.success && uploadResult.data?.url) {
          setAttachments((prev) => [...prev, uploadResult.data!.url]);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!dispute) return;

    try {
      setSending(true);
      const message = await disputeService.sendMessageRest(
        dispute.id,
        newMessage.trim(),
        attachments.length > 0 ? attachments : undefined
      );
      
      // Add message to local state if not already added via WebSocket
      setMessages((prev) => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      
      setNewMessage('');
      setAttachments([]);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const getSenderLabel = (msg: DisputeMessage) => {
    if (msg.senderType === 'system') return 'System';
    if (msg.senderType === 'admin') return 'Support';
    if (msg.senderType === 'farmer') return 'Farmer';
    if (msg.senderType === 'rider') return 'Rider';
    return msg.sender?.name || (msg.sender as any)?.fullName || 'Customer';
  };

  const isOwnMessage = (msg: DisputeMessage) => {
    return msg.senderId === currentUser?.id;
  };

  const renderMessage = ({ item }: { item: DisputeMessage }) => {
    const isOwn = isOwnMessage(item);
    const isSystem = item.senderType === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={[styles.systemMessage, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }]}>
            <Ionicons name="information-circle" size={14} color={colors.textSecondary} />
            <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
              {item.content}
            </Text>
          </View>
          <Text style={[styles.messageTime, { color: colors.textSecondary, textAlign: 'center' }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
        {!isOwn && (
          <Text style={[styles.senderLabel, { color: colors.textSecondary }]}>
            {getSenderLabel(item)}
          </Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn 
              ? { backgroundColor: colors.primary } 
              : { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' },
          ]}
        >
          <Text style={[styles.messageText, { color: isOwn ? '#fff' : colors.text }]}>
            {item.content}
          </Text>
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {item.attachments.map((attachment, index) => (
                <Image
                  key={index}
                  source={{ uri: getImageUrl(attachment) }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
        </View>
        <Text style={[styles.messageTime, { color: colors.textSecondary, textAlign: isOwn ? 'right' : 'left' }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading dispute...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dispute) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Dispute</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Dispute not found or you don't have access.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
  const typeConfig = TYPE_CONFIG[dispute.type] || TYPE_CONFIG.other;
  const isClosed = ['resolved', 'closed'].includes(dispute.status);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            #{dispute.disputeNumber}
          </Text>
          <View style={[styles.headerStatus, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.headerStatusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Dispute Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={styles.typeIcon}>{typeConfig.icon}</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{typeConfig.label}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.subject, { color: colors.text }]}>{dispute.subject}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{dispute.description}</Text>
          {dispute.order && (
            <View style={[styles.orderBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }]}>
              <Ionicons name="receipt-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.orderText, { color: colors.textSecondary }]}>
                Order: {dispute.order.orderNumber} • ₦{dispute.order.total?.toLocaleString()}
              </Text>
            </View>
          )}
          {dispute.images && dispute.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {dispute.images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: getImageUrl(img) }}
                  style={styles.disputeImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Input Area */}
        {!isClosed ? (
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            {attachments.length > 0 && (
              <ScrollView horizontal style={styles.attachmentPreview}>
                {attachments.map((url, index) => (
                  <View key={index} style={styles.attachmentPreviewItem}>
                    <Image source={{ uri: getImageUrl(url) }} style={styles.attachmentPreviewImage} />
                    <TouchableOpacity
                      style={styles.removeAttachment}
                      onPress={() => removeAttachment(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={[styles.attachButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]}
                onPress={handlePickImage}
              >
                <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F5F5F5', color: colors.text }]}
                placeholder="Type your response..."
                placeholderTextColor={colors.textSecondary}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: (newMessage.trim() || attachments.length > 0) ? colors.primary : colors.border },
                ]}
                onPress={handleSendMessage}
                disabled={sending || (!newMessage.trim() && attachments.length === 0)}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.closedBanner, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon as any} size={20} color={statusConfig.color} />
            <Text style={[styles.closedText, { color: statusConfig.color }]}>
              This dispute has been {dispute.status}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  headerStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  orderText: {
    fontSize: 13,
  },
  imagesScroll: {
    marginTop: 12,
  },
  disputeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  senderLabel: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 4,
  },
  systemMessageContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  systemMessageText: {
    fontSize: 13,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  attachmentPreview: {
    marginBottom: 8,
  },
  attachmentPreviewItem: {
    marginRight: 8,
    position: 'relative',
  },
  attachmentPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeAttachment: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 10,
  },
  closedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
