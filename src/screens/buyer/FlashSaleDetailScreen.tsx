import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Share,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { setCart } from '../../store/slices/cartSlice';
import apiClient from '../../services/apiClient';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants/theme';
import { triggerHaptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');

interface FlashSaleDetail {
  id: string;
  title: string;
  description: string;
  product: {
    id: string;
    title: string;
    images: string[];
    category: string;
    unit: string;
  };
  farmer: {
    id: string;
    name: string;
    avatar: string;
  };
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  startTime: string;
  endTime: string;
  timeRemainingMs: number;
  status: string;
  isFeatured: boolean;
  views: number;
}

const CountdownTimer = ({ endTime, onEnd }: { endTime: string; onEnd?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onEnd?.();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <View style={styles.timeBlock}>
      <View style={styles.timeValue}>
        <Text style={styles.timeNumber}>{value.toString().padStart(2, '0')}</Text>
      </View>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.countdownRow}>
      {timeLeft.days > 0 && (
        <>
          <TimeBlock value={timeLeft.days} label="Days" />
          <Text style={styles.timeSeparator}>:</Text>
        </>
      )}
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <Text style={styles.timeSeparator}>:</Text>
      <TimeBlock value={timeLeft.minutes} label="Mins" />
      <Text style={styles.timeSeparator}>:</Text>
      <TimeBlock value={timeLeft.seconds} label="Secs" />
    </View>
  );
};

export default function FlashSaleDetailScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const insets = useSafeAreaInsets();
  const { saleId } = route.params || {};

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Pulse animation for urgency
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const { data: flashSale, isLoading, refetch } = useQuery({
    queryKey: ['flashSale', saleId],
    queryFn: async () => {
      const response = await apiClient.get(`/flash-sales/${saleId}`);
      // Handle both direct response and nested data response
      const sale = (response as any)?.data || response;
      
      // Calculate remaining quantity if not provided
      if (sale && typeof sale.remainingQuantity === 'undefined') {
        sale.remainingQuantity = (sale.totalQuantity || 0) - (sale.soldQuantity || 0);
      }
      
      return sale as FlashSaleDetail;
    },
    enabled: !!saleId,
    refetchInterval: 30000, // Refresh every 30s for stock updates
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/cart', {
        productId: flashSale?.product.id,
        quantity,
        flashSaleId: saleId,
      });
      return response;
    },
    onSuccess: (response: any) => {
      triggerHaptic();
      
      // Sync cart with Redux store
      const cartData = response?.data || response;
      if (cartData && cartData.items) {
        // Transform backend cart to Redux cart format
        const reduxCart = {
          items: cartData.items.map((item: any) => ({
            productId: item.productId,
            product: {
              id: item.productId,
              title: item.title,
              price: item.originalPrice || item.price,
              images: item.image ? [item.image] : [],
              unit: item.unit,
              farmerId: item.farmerId,
              farmer: { name: item.farmerName },
            },
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            flashSaleId: item.flashSaleId,
            flashSalePrice: item.flashSaleId ? item.price : undefined,
          })),
          total: cartData.total || 0,
          itemCount: cartData.itemCount || 0,
        };
        dispatch(setCart(reduxCart));
      }
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      Alert.alert(
        'Added to Cart!',
        'Flash sale item has been added to your cart. Complete your purchase before the sale ends!',
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add to cart');
    },
  });

  const handleShare = async () => {
    try {
      const shareDiscountPercent = flashSale?.discountPercent || 0;
      const shareTitle = flashSale?.product?.title || 'this product';
      const sharePrice = flashSale?.salePrice || 0;
      await Share.share({
        message: `🔥 Flash Sale Alert! Get ${shareDiscountPercent}% OFF on ${shareTitle}. Only ₦${sharePrice.toLocaleString()}! Limited stock - hurry before it's gone!`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    const maxQty = flashSale?.remainingQuantity || 1;
    if (newQty >= 1 && newQty <= maxQty) {
      triggerHaptic();
      setQuantity(newQty);
    }
  };

  if (isLoading || !flashSale) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Flash Sale</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="flash" size={48} color="#EF4444" />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading flash sale...</Text>
        </View>
      </View>
    );
  }

  const totalQty = flashSale.totalQuantity || 1;
  const soldQty = flashSale.soldQuantity || 0;
  const progress = totalQty > 0 ? (soldQty / totalQty) * 100 : 0;
  const remainingQty = flashSale.remainingQuantity ?? (totalQty - soldQty);
  const isEnded = flashSale.status === 'ended' || remainingQty <= 0;
  const images = flashSale.product?.images || [];
  const hasImages = images.length > 0;
  
  // Safe price values
  const salePrice = flashSale.salePrice || 0;
  const originalPrice = flashSale.originalPrice || 0;
  const discountPercent = flashSale.discountPercent || 0;
  const savings = originalPrice - salePrice;
  const productTitle = flashSale.product?.title || 'Flash Sale Product';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Flash Sale</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          {hasImages ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
            >
              {images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              <Text style={styles.placeholderText}>No image available</Text>
            </View>
          )}
          
          {/* Discount Badge */}
          <Animated.View style={[styles.discountOverlay, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.discountOverlayText}>-{discountPercent}%</Text>
          </Animated.View>

          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentImageIndex === index && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Countdown Timer */}
        <LinearGradient
          colors={['#EF4444', '#DC2626']}
          style={styles.countdownContainer}
        >
          <View style={styles.countdownHeader}>
            <Text style={styles.countdownTitle}>
              {isEnded ? '⏱️ Sale Ended' : '⏱️ Sale Ends In'}
            </Text>
            {flashSale.views > 0 && (
              <View style={styles.viewsContainer}>
                <Ionicons name="eye" size={14} color="#FFF" />
                <Text style={styles.viewsText}>{flashSale.views} views</Text>
              </View>
            )}
          </View>
          {!isEnded && <CountdownTimer endTime={flashSale.endTime} onEnd={refetch} />}
        </LinearGradient>

        {/* Product Info */}
        <View style={[styles.productInfo, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.productTitle, { color: colors.text }]}>
            {productTitle}
          </Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>₦{salePrice.toLocaleString()}</Text>
              <Text style={styles.originalPrice}>₦{originalPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.savingsBadge}>
              <Ionicons name="pricetag" size={14} color="#10B981" />
              <Text style={styles.savingsText}>
                You save ₦{savings.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Stock Progress */}
          <View style={styles.stockSection}>
            <View style={styles.stockHeader}>
              <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>
                {soldQty} sold
              </Text>
              <Text style={[styles.stockLabel, { color: progress > 80 ? '#EF4444' : colors.textSecondary }]}>
                {remainingQty} left
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress}%`,
                    backgroundColor: progress > 80 ? '#EF4444' : '#10B981'
                  }
                ]} 
              />
            </View>
            {progress > 70 && (
              <View style={styles.urgencyBadge}>
                <Ionicons name="flame" size={14} color="#EF4444" />
                <Text style={styles.urgencyText}>Selling fast! Limited stock remaining</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {flashSale.description && (
          <View style={[styles.descriptionSection, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Sale</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {flashSale.description}
            </Text>
          </View>
        )}

        {/* Seller Info */}
        {flashSale.farmer && (
          <TouchableOpacity
            style={[styles.sellerSection, { backgroundColor: isDark ? colors.card : '#FFF' }]}
            onPress={() => navigation.navigate('FarmerProfile', { farmerId: flashSale.farmer.id })}
          >
            <Image
              source={{ uri: flashSale.farmer.avatar || 'https://via.placeholder.com/50' }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerInfo}>
              <Text style={[styles.sellerName, { color: colors.text }]}>{flashSale.farmer.name}</Text>
              <Text style={[styles.sellerLabel, { color: colors.textSecondary }]}>Verified Seller</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Product Details Link */}
        <TouchableOpacity
          style={[styles.viewProductButton, { borderColor: colors.border }]}
          onPress={() => navigation.navigate('ProductDetail', { productId: flashSale.product.id })}
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.text} />
          <Text style={[styles.viewProductText, { color: colors.text }]}>View Full Product Details</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom Action */}
      {!isEnded && (
        <View style={[styles.bottomAction, { backgroundColor: isDark ? colors.card : '#FFF', paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={[styles.quantityButton, { borderColor: colors.border }]}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove" size={20} color={quantity <= 1 ? colors.textSecondary : colors.text} />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, { borderColor: colors.border }]}
              onPress={() => handleQuantityChange(1)}
              disabled={quantity >= remainingQty}
            >
              <Ionicons 
                name="add" 
                size={20} 
                color={quantity >= remainingQty ? colors.textSecondary : colors.text} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addToCartButton, addToCartMutation.isPending && styles.disabledButton]}
            onPress={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
          >
            <Ionicons name="cart" size={20} color="#FFF" />
            <View>
              <Text style={styles.addToCartText}>Add to Cart</Text>
              <Text style={styles.totalPrice}>₦{(salePrice * quantity).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Ended Overlay */}
      {isEnded && (
        <View style={[styles.endedOverlay, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Ionicons name="time-outline" size={32} color="#EF4444" />
          <Text style={[styles.endedText, { color: colors.text }]}>This flash sale has ended</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Search', { category: 'flash-sales' })}
          >
            <Text style={styles.browseButtonText}>Browse More Flash Sales</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  imageContainer: {
    width,
    height: width * 0.8,
    position: 'relative',
  },
  productImage: {
    width,
    height: width * 0.8,
    backgroundColor: '#F3F4F6',
  },
  discountOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EF4444',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  discountOverlayText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: '#FFF',
    width: 24,
  },
  countdownContainer: {
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 12,
  },
  countdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
  },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValue: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginHorizontal: 8,
  },
  productInfo: {
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
    borderRadius: SPACING.md,
  },
  productTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  priceSection: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 8,
  },
  salePrice: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#EF4444',
  },
  originalPrice: {
    fontSize: 18,
    fontFamily: FONTS.regular,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  savingsText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#10B981',
  },
  stockSection: {
    marginTop: 8,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  urgencyText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#EF4444',
  },
  descriptionSection: {
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  sellerLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  viewProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  viewProductText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    minWidth: 24,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  disabledButton: {
    backgroundColor: '#FCA5A5',
  },
  addToCartText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  totalPrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  endedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  endedText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  browseButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  browseButtonText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
});
