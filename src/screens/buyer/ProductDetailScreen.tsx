import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuyerStackParamList } from '../../types';
import { Button, LoadingSpinner, ErrorState } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToCart } from '../../store/slices/cartSlice';
import { useTheme } from '../../context/ThemeContext';
import { fixImageUrl } from '../../utils/formatters';

type Props = NativeStackScreenProps<BuyerStackParamList, 'ProductDetail'>;

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.cart);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    data: productData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
  });

  const product = productData;
  
  // Initialize quantity with minOrderQuantity if set
  const minOrder = product?.minOrderQuantity || 1;
  const [quantity, setQuantity] = useState(minOrder);
  
  // Update quantity when product loads with minOrderQuantity
  React.useEffect(() => {
    if (product?.minOrderQuantity && product.minOrderQuantity > 1) {
      setQuantity(product.minOrderQuantity);
    }
  }, [product?.minOrderQuantity]);
  
  // Calculate price with bulk discount
  const calculatePrice = () => {
    if (!product) return 0;
    const basePrice = Number(product.price || 0) * quantity;
    if (product.bulkDiscountPercent && product.bulkDiscountQuantity && quantity >= product.bulkDiscountQuantity) {
      return basePrice * (1 - product.bulkDiscountPercent / 100);
    }
    return basePrice;
  };
  
  const isBulkDiscountApplied = product?.bulkDiscountPercent && product?.bulkDiscountQuantity && quantity >= product.bulkDiscountQuantity;

  // Track product view for recommendation engine
  useEffect(() => {
    if (productId) {
      productService.trackProductView(productId);
    }
  }, [productId]);

  const existingCartItem = items.find((item) => item.productId === productId);
  const maxQuantity = product ? product.stock - (existingCartItem?.quantity || 0) : 0;

  const handleAddToCart = useCallback(async () => {
    if (!product) return;

    if (quantity > maxQuantity) {
      Alert.alert(
        'Stock limit reached',
        `Only ${maxQuantity} more available to add to cart.`
      );
      return;
    }

    try {
      await cartService.addToCart(product.id, quantity);
      dispatch(addToCart({ product, quantity }));
      Alert.alert('Added to cart!', `${quantity} ${product.unit}(s) of ${product.title}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to cart');
    }
  }, [product, quantity, maxQuantity, dispatch]);

  const handleGoToFarmer = useCallback(() => {
    if (product) {
      navigation.navigate('FarmerProfile', { farmerId: product.farmerId });
    }
  }, [navigation, product]);

  const handleChatFarmer = useCallback(() => {
    if (product) {
      navigation.navigate('FarmerChat', {
        farmerId: product.farmerId,
        farmerName: product.farmerName || 'Unknown Farmer',
        farmerPhone: product.farmerPhone,
        farmerAvatar: product.farmerAvatar,
        productId: product.id,
      });
    }
  }, [navigation, product]);

  const handleCallFarmer = useCallback(() => {
    const farmerPhone = product?.farmerPhone;
    
    if (!farmerPhone) {
      Alert.alert('Contact Unavailable', 'Farmer phone number is not available. Try sending a message instead.');
      return;
    }

    Alert.alert(
      'Contact Farmer',
      `Would you like to call ${product?.farmerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Voice Call',
          onPress: () => {
            Linking.openURL(`tel:${farmerPhone}`).catch(() => {
              Alert.alert('Error', 'Unable to make phone call');
            });
          },
        },
        {
          text: 'Video Call',
          onPress: () => {
            Alert.alert('Video Call', 'Connecting video call...');
          },
        },
      ]
    );
  }, [product]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isError || !product) {
    return (
      <ErrorState
        message="Failed to load product details"
        onRetry={refetch}
      />
    );
  }

  const validImages = (product.images ?? [])
    .map((uri: string) => fixImageUrl(uri))
    .filter((uri): uri is string => uri !== null);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image Card */}
        <View style={[styles.imageCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.imageContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                setActiveImageIndex(index);
              }}
            >
              {validImages.length > 0 ? (
                validImages.map((uri: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))
              ) : (
                <View style={[styles.image, styles.placeholderImage, { backgroundColor: isDark ? colors.surface : '#E8F5E9' }]}>
                  <Ionicons name="leaf" size={64} color={colors.primary} />
                </View>
              )}
            </ScrollView>
            {validImages.length > 1 && (
              <View style={styles.pagination}>
                {validImages.map((_: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)' },
                      index === activeImageIndex && [styles.paginationDotActive, { backgroundColor: colors.primary }],
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Product Info Card */}
        <View style={styles.section}>
          <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Category & Rating Row */}
            <View style={styles.categoryRow}>
              <View style={[styles.categoryBadge, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>{product.category}</Text>
              </View>
              {product.rating !== undefined && product.rating !== null && Number(product.rating) > 0 && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={[styles.ratingText, { color: colors.text }]}>{Number(product.rating).toFixed(1)}</Text>
                  {product.reviewCount !== undefined && (
                    <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>({product.reviewCount})</Text>
                  )}
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
              <Text style={[styles.unit, { color: colors.textSecondary }]}>/{product.unit}</Text>
            </View>

            {/* Stock */}
            <View style={[styles.stockRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              {product.stock > 0 ? (
                <>
                  <View style={[styles.stockIconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#43A047" />
                  </View>
                  <Text style={[styles.stockText, { color: '#43A047' }]}>
                    In stock • {product.stock} {product.unit}s available
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.stockIconContainer, { backgroundColor: '#FFEBEE' }]}>
                    <Ionicons name="close-circle" size={16} color="#E53935" />
                  </View>
                  <Text style={[styles.stockText, { color: '#E53935' }]}>Out of stock</Text>
                </>
              )}
            </View>

            {/* Certifications */}
            {((product.certifications && product.certifications.length > 0) || product.isOrganic) && (
              <View style={[styles.certificationsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
                {product.isOrganic && (
                  <View style={styles.certBadge}>
                    <Ionicons name="leaf" size={14} color="#FFFFFF" />
                    <Text style={styles.certBadgeText}>Organic</Text>
                  </View>
                )}
                {product.certifications?.includes('pesticide_free') && (
                  <View style={[styles.certBadge, { backgroundColor: '#2196F3' }]}>
                    <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                    <Text style={styles.certBadgeText}>Pesticide Free</Text>
                  </View>
                )}
                {product.certifications?.includes('non_gmo') && (
                  <View style={[styles.certBadge, { backgroundColor: '#9C27B0' }]}>
                    <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
                    <Text style={styles.certBadgeText}>Non-GMO</Text>
                  </View>
                )}
                {product.certifications?.includes('locally_grown') && (
                  <View style={[styles.certBadge, { backgroundColor: '#FF9800' }]}>
                    <Ionicons name="location" size={14} color="#FFFFFF" />
                    <Text style={styles.certBadgeText}>Locally Grown</Text>
                  </View>
                )}
              </View>
            )}

            {/* Harvest Date */}
            {product.harvestDate && (
              <View style={[styles.infoRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="calendar" size={16} color="#FB8C00" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Harvest Date</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {new Date(product.harvestDate).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Minimum Order */}
            {product.minOrderQuantity && product.minOrderQuantity > 1 && (
              <View style={[styles.infoRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="cube" size={16} color="#1976D2" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Minimum Order</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {product.minOrderQuantity} {product.unit}
                  </Text>
                </View>
              </View>
            )}

            {/* Bulk Discount */}
            {product.bulkDiscountPercent && product.bulkDiscountQuantity && (
              <View style={[styles.bulkDiscountRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
                <View style={[styles.infoIconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="pricetag" size={16} color="#E53935" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.bulkDiscountTitle, { color: colors.text }]}>Bulk Discount Available!</Text>
                  <Text style={[styles.bulkDiscountDesc, { color: colors.textSecondary }]}>
                    Get {product.bulkDiscountPercent}% off when you order {product.bulkDiscountQuantity}+ {product.unit}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Farmer Card */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SOLD BY</Text>
        <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', marginHorizontal: 16 }]}>
          <TouchableOpacity style={styles.farmerContent} onPress={handleGoToFarmer} activeOpacity={0.7}>
            <View style={[styles.farmerAvatar, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={styles.farmerInfo}>
              <Text style={[styles.farmerName, { color: colors.text }]}>{product.farmerName || 'Unknown Farmer'}</Text>
              <Text style={[styles.farmerLocation, { color: colors.textSecondary }]}>
                {product.pickupCity || product.pickupLocation?.city || ''}, {product.pickupState || product.pickupLocation?.state || 'Location'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Contact Actions */}
          <View style={[styles.farmerActionsDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          <View style={styles.farmerActionsRow}>
            <TouchableOpacity style={styles.farmerActionButton} onPress={handleChatFarmer}>
              <View style={[styles.farmerActionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.farmerActionText, { color: colors.primary }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.farmerActionButton} onPress={handleCallFarmer}>
              <View style={[styles.farmerActionIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.farmerActionText, { color: '#34C759' }]}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DESCRIPTION</Text>
        <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', marginHorizontal: 16, padding: 16 }]}>
          <Text style={[styles.description, { color: colors.text }]}>{product.description}</Text>
        </View>

        {/* Pickup Location Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PICKUP LOCATION</Text>
        <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', marginHorizontal: 16 }]}>
          <View style={styles.locationRow}>
            <View style={[styles.locationIconContainer, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.locationText, { color: colors.text }]}>
              {product.pickupCity || product.pickupLocation?.city || ''}, {product.pickupState || product.pickupLocation?.state || 'Location'}
            </Text>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Fixed Bottom Bar */}
      {product.stock > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={[styles.quantitySelector, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(minOrder, quantity - 1))}
              disabled={quantity <= minOrder}
            >
              <Ionicons name="remove" size={20} color={quantity <= minOrder ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
            >
              <Ionicons name="add" size={20} color={quantity >= maxQuantity ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
          </View>
          <Button
            title={`Add to Cart • ₦${calculatePrice().toLocaleString()}${isBulkDiscountApplied ? ' 🏷️' : ''}`}
            onPress={handleAddToCart}
            style={styles.addButton}
            disabled={maxQuantity <= 0}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingTop: 8,
  },
  imageCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width - 32,
    height: 280,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 20,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 32,
    marginTop: 24,
  },
  insetCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  reviewCount: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  price: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  unit: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: 2,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stockIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stockText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  farmerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  farmerName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  farmerLocation: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  farmerActionsDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  farmerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 40,
  },
  farmerActionButton: {
    alignItems: 'center',
    gap: 6,
  },
  farmerActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerActionText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  description: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    minWidth: 36,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
  },
  certificationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  certBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  bulkDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
  },
  bulkDiscountTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  bulkDiscountDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
});
