import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Dimensions,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { FarmerStackParamList, Product } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/formatters';
import { useAppDispatch } from '../../store';
import { removeProduct } from '../../store/slices/farmerSlice';

const { width: screenWidth } = Dimensions.get('window');

type Props = NativeStackScreenProps<FarmerStackParamList, 'ProductDetail'>;

// Certification configs
const CERTIFICATION_CONFIG: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  organic: { label: 'Organic', icon: 'leaf', color: '#34C759', bgColor: '#E8F5E9' },
  pesticide_free: { label: 'Pesticide Free', icon: 'shield-checkmark', color: '#5856D6', bgColor: '#EDE9FE' },
  non_gmo: { label: 'Non-GMO', icon: 'nutrition', color: '#FF9500', bgColor: '#FFF3E0' },
  locally_grown: { label: 'Locally Grown', icon: 'location', color: '#007AFF', bgColor: '#E3F2FD' },
};

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { data: product, isLoading, error, refetch } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
  });

  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      dispatch(removeProduct(productId));
      navigation.goBack();
      Alert.alert('Success', 'Product deleted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete product');
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      productService.updateProduct(id, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update availability');
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      productService.updateProduct(id, { isFeatured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update featured status');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product?.title || product?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(productId),
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product?.title || product?.name} - ${formatCurrency(Number(product?.price))}/${product?.unit}\n\n${product?.description}`,
        title: product?.title || product?.name,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleDuplicate = () => {
    Alert.alert(
      'Duplicate Product',
      `Create a copy of "${product?.title || product?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => {
            navigation.navigate('AddProduct', {
              duplicateFrom: {
                title: `${product?.title || product?.name} (Copy)`,
                description: product?.description,
                price: product?.price,
                unit: product?.unit,
                stock: product?.stock,
                category: product?.category,
                images: product?.images,
              },
            } as any);
          },
        },
      ]
    );
  };

  const handleToggleAvailability = () => {
    if (!product) return;
    const newStatus = !product.isAvailable;
    Alert.alert(
      newStatus ? 'Make Available' : 'Make Unavailable',
      `Are you sure you want to ${newStatus ? 'make this product available' : 'hide this product from buyers'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => toggleAvailabilityMutation.mutate({ id: productId, isAvailable: newStatus }),
        },
      ]
    );
  };

  const handleToggleFeatured = () => {
    if (!product) return;
    const newStatus = !(product as any).isFeatured;
    toggleFeatureMutation.mutate({ id: productId, isFeatured: newStatus });
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: '#FF3B30', bgColor: '#FFEBEE', icon: 'close-circle' };
    if (stock < 10) return { label: 'Low Stock', color: '#FF9500', bgColor: '#FFF3E0', icon: 'alert-circle' };
    return { label: 'In Stock', color: '#34C759', bgColor: '#E8F5E9', icon: 'checkmark-circle' };
  };

  const images = product?.images?.filter((img: string) => img && typeof img === 'string') || [];

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={64} color="#FF3B30" />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Product Not Found</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          This product may have been deleted or is unavailable.
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stockStatus = getStockStatus(product.stock);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            paddingTop: insets.top,
            backgroundColor: colors.background,
            opacity: headerOpacity,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <Text style={[styles.animatedHeaderTitle, { color: colors.text }]} numberOfLines={1}>
          {product.title || product.name}
        </Text>
      </Animated.View>

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}
            onPress={() => navigation.navigate('EditProduct', { productId })}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                  setCurrentImageIndex(index);
                }}
              >
                {images.map((image: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {images.map((_: string, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.imageIndicator,
                        index === currentImageIndex && styles.imageIndicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? colors.card : '#E8F5E9' }]}>
              <Svg width={120} height={120}>
                <Defs>
                  <SvgLinearGradient id="placeholderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#34C759" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#34C759" stopOpacity="0.1" />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx="60" cy="60" r="50" fill="url(#placeholderGrad)" />
              </Svg>
              <Ionicons name="leaf" size={48} color="#34C759" style={styles.placeholderIcon} />
            </View>
          )}

          {/* Status Badges */}
          <View style={styles.imageBadges}>
            {(product as any).isFeatured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={12} color="#FFFFFF" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
            {!product.isAvailable && (
              <View style={styles.unavailableBadge}>
                <Ionicons name="eye-off" size={12} color="#FFFFFF" />
                <Text style={styles.unavailableText}>Hidden</Text>
              </View>
            )}
          </View>
        </View>

        {/* Product Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {/* SVG Background Decoration */}
          <View style={styles.cardDecoration}>
            <Svg width={150} height={150} style={styles.decorSvg}>
              <Defs>
                <SvgLinearGradient id="decorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#34C759" stopOpacity={isDark ? "0.08" : "0.06"} />
                  <Stop offset="100%" stopColor="#34C759" stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>
              <Circle cx="75" cy="75" r="75" fill="url(#decorGrad)" />
            </Svg>
          </View>

          {/* Title & Price */}
          <View style={styles.titleSection}>
            <Text style={[styles.productTitle, { color: colors.text }]}>
              {product.title || product.name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.text }]}>
                {formatCurrency(Number(product.price))}
              </Text>
              <Text style={[styles.unit, { color: colors.textSecondary }]}>
                / {product.unit}
              </Text>
            </View>
          </View>

          {/* Category & Stock */}
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#E8F5E9' }]}>
              <Ionicons name="pricetag" size={14} color="#34C759" />
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
              <Ionicons name={stockStatus.icon as any} size={14} color={stockStatus.color} />
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {product.stock} {product.unit} • {stockStatus.label}
              </Text>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Description</Text>
              <Text style={[styles.description, { color: colors.text }]}>
                {product.description}
              </Text>
            </View>
          )}

          {/* Certifications */}
          {product.certifications && product.certifications.length > 0 && (
            <View style={styles.certificationsSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Certifications</Text>
              <View style={styles.certificationsList}>
                {product.certifications.map((cert: string) => {
                  const config = CERTIFICATION_CONFIG[cert];
                  if (!config) return null;
                  return (
                    <View
                      key={cert}
                      style={[styles.certificationBadge, { backgroundColor: config.bgColor }]}
                    >
                      <Ionicons name={config.icon as any} size={14} color={config.color} />
                      <Text style={[styles.certificationText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Bulk Pricing */}
          {product.bulkDiscountQuantity && product.bulkDiscountPercent && (
            <View style={[styles.bulkSection, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.1)' : '#EEF6FF' }]}>
              <Ionicons name="pricetags" size={20} color="#007AFF" />
              <View style={styles.bulkInfo}>
                <Text style={[styles.bulkTitle, { color: colors.text }]}>Bulk Discount Available</Text>
                <Text style={[styles.bulkDetail, { color: colors.textSecondary }]}>
                  {product.bulkDiscountPercent}% off when ordering {product.bulkDiscountQuantity}+ {product.unit}
                </Text>
              </View>
            </View>
          )}

          {/* Min Order */}
          {product.minOrderQuantity && product.minOrderQuantity > 1 && (
            <View style={styles.minOrderRow}>
              <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
              <Text style={[styles.minOrderText, { color: colors.textSecondary }]}>
                Minimum order: {product.minOrderQuantity} {product.unit}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{(product as any).views || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Views</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5E5' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{(product as any).orderCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5E5' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {typeof product.rating === 'number' ? product.rating.toFixed(1) : '-'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
            </View>
          </View>

          {/* Created Date */}
          <Text style={[styles.createdDate, { color: colors.textSecondary }]}>
            Created {new Date(product.createdAt || '').toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.actionsTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <View style={styles.actionsList}>
            {/* Toggle Availability */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
              onPress={handleToggleAvailability}
              disabled={toggleAvailabilityMutation.isPending}
            >
              <View style={[styles.actionIconBox, { backgroundColor: product.isAvailable ? '#E8F5E9' : '#FFEBEE' }]}>
                <Ionicons
                  name={product.isAvailable ? 'eye' : 'eye-off'}
                  size={20}
                  color={product.isAvailable ? '#34C759' : '#FF3B30'}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {product.isAvailable ? 'Hide from Buyers' : 'Make Available'}
                </Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  {product.isAvailable ? 'Product is currently visible' : 'Product is currently hidden'}
                </Text>
              </View>
              {toggleAvailabilityMutation.isPending ? (
                <ActivityIndicator size="small" color="#34C759" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Toggle Featured */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
              onPress={handleToggleFeatured}
              disabled={toggleFeatureMutation.isPending}
            >
              <View style={[styles.actionIconBox, { backgroundColor: (product as any).isFeatured ? '#FFF3E0' : '#F2F2F7' }]}>
                <Ionicons
                  name={(product as any).isFeatured ? 'star' : 'star-outline'}
                  size={20}
                  color={(product as any).isFeatured ? '#FF9500' : '#8E8E93'}
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>
                  {(product as any).isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                </Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Featured products get more visibility
                </Text>
              </View>
              {toggleFeatureMutation.isPending ? (
                <ActivityIndicator size="small" color="#FF9500" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Update Stock */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
              onPress={() => navigation.navigate('EditProduct', { productId })}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="cube-outline" size={20} color="#007AFF" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Update Stock</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Current stock: {product.stock} {product.unit}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Create Flash Sale */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
              onPress={() => navigation.navigate('CreateFlashSale', { product })}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="flash" size={20} color="#FF3B30" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Create Flash Sale</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Offer limited-time discounts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Add Discount */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
              onPress={() => navigation.navigate('AddDiscount', { product })}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="pricetag" size={20} color="#5856D6" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Add Discount</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Set percentage or fixed discounts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Promote Product */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
              onPress={() => navigation.navigate('PromoteProduct', { product })}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="megaphone" size={20} color="#34C759" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Promote Product</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Boost visibility with ads
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* View Analytics */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
              onPress={() => navigation.navigate('ProductAnalyticsDetail', { product })}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="analytics" size={20} color="#FF9500" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>View Analytics</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  See performance metrics
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Duplicate Product */}
            <TouchableOpacity
              style={[styles.actionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F7' }]}
              onPress={handleDuplicate}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#F2F2F7' }]}>
                <Ionicons name="copy-outline" size={20} color="#8E8E93" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.text }]}>Duplicate Product</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Create a copy of this product
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Delete Product */}
            <TouchableOpacity
              style={[styles.actionItem, styles.actionItemLast]}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: '#FF3B30' }]}>Delete Product</Text>
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                  Permanently remove this product
                </Text>
              </View>
              {deleteMutation.isPending ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#E8F5E9' }]}
          onPress={() => navigation.navigate('EditProduct', { productId })}
        >
          <Ionicons name="create-outline" size={20} color="#34C759" />
          <Text style={styles.editButtonText}>Edit Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 60,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  animatedHeaderTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 101,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageCarousel: {
    width: screenWidth,
    height: 300,
    position: 'relative',
  },
  carouselImage: {
    width: screenWidth,
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  imagePlaceholder: {
    width: screenWidth,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    position: 'absolute',
  },
  imageBadges: {
    position: 'absolute',
    top: 100,
    left: 16,
    gap: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  featuredText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  unavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  unavailableText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  infoCard: {
    marginHorizontal: SPACING.md,
    marginTop: -24,
    borderRadius: 20,
    padding: SPACING.lg,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  cardDecoration: {
    position: 'absolute',
    top: -30,
    right: -30,
  },
  decorSvg: {},
  titleSection: {
    marginBottom: SPACING.md,
  },
  productTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 26,
    fontFamily: FONTS.bold,
  },
  unit: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#34C759',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  stockText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  descriptionSection: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  certificationsSection: {
    marginBottom: SPACING.md,
  },
  certificationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  certificationText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  bulkSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    gap: 12,
  },
  bulkInfo: {
    flex: 1,
  },
  bulkTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  bulkDetail: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  minOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  minOrderText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    marginTop: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  createdDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  actionsCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 16,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  actionsTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  actionsList: {},
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionItemLast: {
    borderBottomWidth: 0,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  actionDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#34C759',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#34C759',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
