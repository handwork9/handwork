import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { io, Socket } from 'socket.io-client';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { socialService, LiveStream, CreateLiveStreamDto } from '../../services/socialService';
import { uploadService } from '../../services/uploadService';
import { API_CONFIG } from '../../constants/config';
import { useAppSelector } from '../../store';
import { productService, Product } from '../../services/productService';

interface ChatMessage {
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

const GoLiveScreen = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user } = useAppSelector(state => state.auth);

  // Setup state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  
  // Live state
  const [isLive, setIsLive] = useState(false);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch farmer's products for featuring
  const { data: productsData } = useQuery({
    queryKey: ['farmer-products'],
    queryFn: () => productService.getMyProducts({ limit: 50 }),
  });

  // Setup socket connection when live
  useEffect(() => {
    if (isLive && stream) {
      socketRef.current = io(`${API_CONFIG.WS_URL}/live`, {
        transports: ['websocket'],
      });

      socketRef.current.emit('host_stream', {
        streamId: stream.id,
        farmerId: user?.id,
        farmerName: user?.name || 'Farmer',
      });

      socketRef.current.on('chat_message', (message: ChatMessage) => {
        setMessages(prev => [...prev, message]);
      });

      socketRef.current.on('viewer_count', (data: { count: number }) => {
        setViewerCount(data.count);
      });

      socketRef.current.on('viewer_joined', () => {
        setViewerCount(prev => prev + 1);
      });

      socketRef.current.on('viewer_left', () => {
        setViewerCount(prev => Math.max(0, prev - 1));
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isLive, stream, user]);

  // Create stream mutation
  const createStreamMutation = useMutation({
    mutationFn: (data: CreateLiveStreamDto) => socialService.createLiveStream(data),
    onSuccess: async (newStream) => {
      // Start the stream
      const startedStream = await socialService.startLiveStream(newStream.id);
      setStream(startedStream);
      setIsLive(true);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to start live stream');
    },
  });

  // End stream mutation
  const endStreamMutation = useMutation({
    mutationFn: (streamId: string) => socialService.endLiveStream(streamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-streams'] });
      setIsLive(false);
      setStream(null);
      Alert.alert('Stream Ended', 'Your live stream has ended successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to end stream');
    },
  });

  const handleGoLive = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title for your stream');
      return;
    }

    setIsUploading(true);

    try {
      let thumbnailUrl: string | undefined;

      // Upload thumbnail if set
      if (thumbnail && thumbnail.startsWith('data:')) {
        const uploadResult = await uploadService.uploadImage(thumbnail, 'live-streams');
        if (uploadResult.success && uploadResult.data?.url) {
          thumbnailUrl = uploadResult.data.url;
        }
      }

      await createStreamMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnailUrl,
        tags: tags.length > 0 ? tags : undefined,
        productId: selectedProduct?.id,
      });
    } catch (error) {
      console.error('Error starting stream:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEndStream = () => {
    Alert.alert(
      'End Stream?',
      'Are you sure you want to end this live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Stream', 
          style: 'destructive',
          onPress: () => stream && endStreamMutation.mutate(stream.id),
        },
      ]
    );
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setThumbnail(imageUri);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('host_chat', {
      streamId: stream?.id,
      message: inputMessage.trim(),
    });

    setInputMessage('');
  };

  const pinProduct = (product: Product) => {
    if (!socketRef.current || !stream) return;
    
    socketRef.current.emit('pin_product', {
      streamId: stream.id,
      productId: product.id,
      productName: product.name || 'Product',
      productPrice: product.price,
      productImage: product.images?.[0],
    });

    setSelectedProduct(product);
    setShowProductPicker(false);
  };

  const isLoading = isUploading || createStreamMutation.isPending;

  // Live Stream View
  if (isLive && stream) {
    return (
      <View style={styles.liveContainer}>
        {/* Video placeholder - integrate with actual camera/streaming */}
        <View style={styles.liveVideoContainer}>
          <View style={[styles.videoPlaceholder, { backgroundColor: '#000' }]}>
            <Ionicons name="videocam" size={60} color="white" />
            <Text style={styles.streamingText}>You are live!</Text>
          </View>

          {/* Live overlay */}
          <SafeAreaView style={styles.liveOverlay}>
            <View style={styles.liveHeader}>
              <View style={styles.liveHeaderLeft}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveIndicator} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <View style={styles.viewerBadge}>
                  <Ionicons name="eye" size={14} color="white" />
                  <Text style={styles.viewerCount}>{viewerCount}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.endStreamBtn}
                onPress={handleEndStream}
              >
                <Text style={styles.endStreamText}>End</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.streamInfo}>
              <Text style={styles.streamTitle}>{stream.title}</Text>
            </View>
          </SafeAreaView>

          {/* Pinned product */}
          {selectedProduct && (
            <View style={styles.pinnedProduct}>
              {selectedProduct.images?.[0] && (
                <Image source={{ uri: selectedProduct.images[0] }} style={styles.pinnedProductImage} />
              )}
              <View style={styles.pinnedProductInfo}>
                <Text style={styles.pinnedProductName} numberOfLines={1}>
                  {selectedProduct.name}
                </Text>
                <Text style={styles.pinnedProductPrice}>
                  ₦{selectedProduct.price?.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Chat */}
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.chatMessage}>
                  <Text style={styles.chatUsername}>{item.username}:</Text>
                  <Text style={styles.chatText}>{item.message}</Text>
                </View>
              )}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Bottom controls */}
          <SafeAreaView style={styles.liveFooter} edges={['bottom']}>
            <View style={styles.liveControls}>
              <TouchableOpacity 
                style={styles.controlBtn}
                onPress={() => setShowProductPicker(true)}
              >
                <Ionicons name="pricetag" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn}>
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Say something..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={inputMessage}
                onChangeText={setInputMessage}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Product picker modal */}
        {showProductPicker && (
          <View style={styles.productPickerOverlay}>
            <View style={[styles.productPicker, { backgroundColor: colors.card }]}>
              <View style={styles.productPickerHeader}>
                <Text style={[styles.productPickerTitle, { color: colors.text }]}>
                  Feature a Product
                </Text>
                <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={productsData?.products || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.productItem}
                    onPress={() => pinProduct(item)}
                  >
                    {item.images?.[0] && (
                      <Image source={{ uri: item.images[0] }} style={styles.productItemImage} />
                    )}
                    <View style={styles.productItemInfo}>
                      <Text style={[styles.productItemName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.productItemPrice}>
                        ₦{item.price?.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={[styles.noProducts, { color: colors.textSecondary }]}>
                    No products available
                  </Text>
                }
              />
            </View>
          </View>
        )}
      </View>
    );
  }

  // Setup View
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Go Live
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView 
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Thumbnail */}
          <TouchableOpacity style={styles.thumbnailContainer} onPress={pickThumbnail}>
            {thumbnail ? (
              <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                <Ionicons name="camera" size={40} color={colors.textSecondary} />
                <Text style={[styles.thumbnailText, { color: colors.textSecondary }]}>
                  Add Cover Photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Stream Title *
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  color: colors.text,
                },
              ]}
              placeholder="What's your stream about?"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  color: colors.text,
                },
              ]}
              placeholder="Tell viewers more about your stream..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Tags (optional)
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.tagInput, { color: colors.text }]}
                placeholder="Add tags (press enter)"
                placeholderTextColor={colors.textSecondary}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
            </View>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.tag}
                    onPress={() => removeTag(index)}
                  >
                    <Text style={styles.tagText}>#{tag}</Text>
                    <Ionicons name="close" size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Feature Product */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              Feature a Product (optional)
            </Text>
            <TouchableOpacity 
              style={[styles.productSelector, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
              onPress={() => setShowProductPicker(true)}
            >
              {selectedProduct ? (
                <View style={styles.selectedProductRow}>
                  {selectedProduct.images?.[0] && (
                    <Image source={{ uri: selectedProduct.images[0] }} style={styles.selectedProductImage} />
                  )}
                  <View style={styles.selectedProductInfo}>
                    <Text style={[styles.selectedProductName, { color: colors.text }]} numberOfLines={1}>
                      {selectedProduct.name}
                    </Text>
                    <Text style={styles.selectedProductPrice}>
                      ₦{selectedProduct.price?.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.addProductRow}>
                  <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                  <Text style={[styles.addProductText, { color: colors.textSecondary }]}>
                    Select a product to showcase
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 150 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Go Live Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity 
          style={[styles.goLiveBtn, !title.trim() && styles.goLiveBtnDisabled]}
          onPress={handleGoLive}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="radio" size={20} color="white" />
              <Text style={styles.goLiveBtnText}>Go Live</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Product picker */}
      {showProductPicker && (
        <View style={styles.productPickerOverlay}>
          <View style={[styles.productPicker, { backgroundColor: colors.card }]}>
            <View style={styles.productPickerHeader}>
              <Text style={[styles.productPickerTitle, { color: colors.text }]}>
                Feature a Product
              </Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={productsData?.products || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.productItem}
                  onPress={() => {
                    setSelectedProduct(item);
                    setShowProductPicker(false);
                  }}
                >
                  {item.images?.[0] && (
                    <Image source={{ uri: item.images[0] }} style={styles.productItemImage} />
                  )}
                  <View style={styles.productItemInfo}>
                    <Text style={[styles.productItemName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.productItemPrice}>
                      ₦{item.price?.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.noProducts, { color: colors.textSecondary }]}>
                  No products available
                </Text>
              }
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  thumbnailContainer: {
    margin: SPACING.md,
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  input: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  textArea: {
    minHeight: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  tagInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  productSelector: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  addProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addProductText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  selectedProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  selectedProductImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  selectedProductPrice: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  goLiveBtn: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  goLiveBtnDisabled: {
    opacity: 0.5,
  },
  goLiveBtnText: {
    color: 'white',
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  productPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  productPicker: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  productPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productPickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: SPACING.sm,
  },
  productItemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  productItemPrice: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    marginTop: 2,
  },
  noProducts: {
    textAlign: 'center',
    padding: SPACING.xl,
  },
  // Live styles
  liveContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  liveVideoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamingText: {
    color: 'white',
    fontSize: FONT_SIZES.lg,
    marginTop: SPACING.md,
  },
  liveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  liveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  viewerCount: {
    color: 'white',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  endStreamBtn: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  endStreamText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  streamInfo: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  streamTitle: {
    color: 'white',
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  pinnedProduct: {
    position: 'absolute',
    bottom: 180,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  pinnedProductImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
  },
  pinnedProductInfo: {
    flex: 1,
  },
  pinnedProductName: {
    color: 'white',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  pinnedProductPrice: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    height: 200,
    paddingHorizontal: SPACING.md,
  },
  chatMessage: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: 4,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  chatUsername: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    marginRight: 4,
  },
  chatText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    flexShrink: 1,
  },
  liveFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  liveControls: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  chatInput: {
    flex: 1,
    height: 44,
    color: 'white',
    fontSize: FONT_SIZES.md,
  },
  sendBtn: {
    padding: SPACING.xs,
  },
});

export default GoLiveScreen;
