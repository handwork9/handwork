import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Image,
  Dimensions,
  Platform,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { orderService } from '../../services/orderService';
import { cartService } from '../../services/cartService';
import { productService } from '../../services/productService';
import { setCart } from '../../store/slices/cartSlice';
import type { BuyerStackParamList, Order, OrderItem } from '../../types';
import { useSocket } from '../../hooks/useSocket';
import { API_CONFIG } from '../../constants/config';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

// Order status configurations
const STATUS_CONFIG: Record<string, { 
  color: string; 
  bgColor: string; 
  icon: string; 
  label: string;
  progress: number;
}> = {
  pending: { color: '#F59E0B', bgColor: '#FEF3C7', icon: 'time-outline', label: 'Pending', progress: 0.1 },
  confirmed: { color: '#3B82F6', bgColor: '#DBEAFE', icon: 'checkmark-circle-outline', label: 'Confirmed', progress: 0.25 },
  processing: { color: '#8B5CF6', bgColor: '#EDE9FE', icon: 'construct-outline', label: 'Processing', progress: 0.4 },
  ready: { color: '#10B981', bgColor: '#D1FAE5', icon: 'cube-outline', label: 'Ready', progress: 0.55 },
  picked_up: { color: '#06B6D4', bgColor: '#CFFAFE', icon: 'bicycle-outline', label: 'Picked Up', progress: 0.7 },
  in_transit: { color: '#0EA5E9', bgColor: '#E0F2FE', icon: 'navigate-outline', label: 'In Transit', progress: 0.85 },
  delivered: { color: '#22C55E', bgColor: '#DCFCE7', icon: 'checkmark-done-outline', label: 'Delivered', progress: 1 },
  cancelled: { color: '#EF4444', bgColor: '#FEE2E2', icon: 'close-circle-outline', label: 'Cancelled', progress: 0 },
};

// Filter options
const FILTER_OPTIONS = [
  { id: 'all', label: 'All Orders', icon: 'list' },
  { id: 'active', label: 'Active', icon: 'sync' },
  { id: 'delivered', label: 'Delivered', icon: 'checkmark-done' },
  { id: 'cancelled', label: 'Cancelled', icon: 'close-circle' },
];

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const { isConnected } = useSocket();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [reorderingOrderId, setReorderingOrderId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  
  // Animated values for cards
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.background,
    },
    topBar: {
      backgroundColor: colors.background,
    },
    screenTitle: {
      color: colors.text,
    },
    menuIcon: colors.icon,
    smallStatCard: {
      backgroundColor: isDark ? colors.surface : '#EFF6FF',
    },
    smallStatCardGreen: {
      backgroundColor: isDark ? colors.surface : '#F0FDF4',
    },
    smallStatLabel: {
      color: colors.textSecondary,
    },
    liveIndicator: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#ECFDF5',
    },
    filterPill: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    filterPillText: {
      color: colors.textSecondary,
    },
    orderCard: {
      backgroundColor: colors.card,
    },
    orderNumber: {
      color: colors.text,
    },
    orderDate: {
      color: colors.textSecondary,
    },
    stackedImageBorder: {
      borderColor: colors.card,
    },
    stackedImageBg: {
      backgroundColor: isDark ? colors.surface : '#F3F4F6',
    },
    itemsCount: {
      color: colors.text,
    },
    itemsList: {
      color: colors.textSecondary,
    },
    progressTrack: {
      backgroundColor: colors.border,
    },
    cardFooterBorder: {
      borderTopColor: colors.borderLight,
    },
    totalLabel: {
      color: colors.textSecondary,
    },
    totalAmount: {
      color: colors.text,
    },
    actionButton: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
    },
    reorderButton: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
    },
    riderInfoBorder: {
      borderTopColor: colors.borderLight,
    },
    riderAvatarBg: {
      backgroundColor: isDark ? colors.surface : '#F3F4F6',
    },
    riderName: {
      color: colors.text,
    },
    riderLabel: {
      color: colors.textSecondary,
    },
    emptyIconContainer: {
      backgroundColor: isDark ? colors.surface : '#F3F4F6',
    },
    emptyIconColor: isDark ? colors.textSecondary : '#D1D5DB',
    emptyTitle: {
      color: colors.text,
    },
    emptyText: {
      color: colors.textSecondary,
    },
    skeletonCard: {
      backgroundColor: colors.card,
    },
    skeletonElement: {
      backgroundColor: isDark ? colors.surface : '#E5E7EB',
    },
    skeletonFooterBorder: {
      borderTopColor: colors.borderLight,
    },
  }), [isDark, colors]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Helper to get image URL
  const getImageUrl = (imageUrl?: string | null): string => {
    if (!imageUrl) return 'https://via.placeholder.com/48';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Fetch orders
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['buyerOrders'],
    queryFn: () => orderService.getOrders(),
  });

  const orders: Order[] = data?.orders || [];

  // Fetch product images for items that don't have images stored
  useEffect(() => {
    const fetchMissingImages = async () => {
      if (!orders.length) return;
      
      // Collect all productIds from items missing images
      const productIdsNeedingImages = new Set<string>();
      
      orders.forEach(order => {
        order.items?.forEach((item: any) => {
          if (!item.image && !item.productImage && !item.images?.length && item.productId) {
            if (!productImages[item.productId]) {
              productIdsNeedingImages.add(item.productId);
            }
          }
        });
      });
      
      if (productIdsNeedingImages.size === 0) return;
      
      const newImages: Record<string, string> = {};
      
      await Promise.all(
        Array.from(productIdsNeedingImages).map(async (productId) => {
          try {
            const product = await productService.getProductById(productId);
            if (product?.images?.[0]) {
              newImages[productId] = product.images[0];
            }
          } catch (e) {
            // Silently fail for individual product fetches
          }
        })
      );
      
      if (Object.keys(newImages).length > 0) {
        setProductImages(prev => ({ ...prev, ...newImages }));
      }
    };
    
    fetchMissingImages();
  }, [orders]);

  // Filter orders based on active filter
  const filteredOrders = useMemo(() => {
    let result = orders.filter((order) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'active') {
        return !['delivered', 'cancelled'].includes(order.status);
      }
      if (activeFilter === 'delivered') return order.status === 'delivered';
      if (activeFilter === 'cancelled') return order.status === 'cancelled';
      return true;
    });

    // Sort orders
    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'amount') {
        return b.total - a.total;
      }
      return 0;
    });

    return result;
  }, [orders, activeFilter, sortBy]);

  // Calculate stats
  const stats = {
    total: orders.length,
    active: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  // Header with stats
  const renderHeader = () => {
    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="cube-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={[styles.smallStatCard, dynamicStyles.smallStatCard]}>
              <View style={[styles.smallStatIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="sync" size={14} color="#fff" />
              </View>
              <View style={styles.smallStatContent}>
                <Text style={[styles.smallStatLabel, dynamicStyles.smallStatLabel]}>Active</Text>
                <Text style={[styles.smallStatNumber, { color: '#3B82F6' }]}>{stats.active}</Text>
              </View>
            </View>

            <View style={[styles.smallStatCard, dynamicStyles.smallStatCardGreen]}>
              <View style={[styles.smallStatIcon, { backgroundColor: '#22C55E' }]}>
                <Ionicons name="checkmark-done" size={14} color="#fff" />
              </View>
              <View style={styles.smallStatContent}>
                <Text style={[styles.smallStatLabel, dynamicStyles.smallStatLabel]}>Delivered</Text>
                <Text style={[styles.smallStatNumber, { color: '#22C55E' }]}>{stats.delivered}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Connection Status */}
        {isConnected && (
          <View style={[styles.liveIndicator, dynamicStyles.liveIndicator]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Updates Active</Text>
          </View>
        )}

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTER_OPTIONS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  dynamicStyles.filterPill,
                  activeFilter === item.id && styles.filterPillActive,
                ]}
                onPress={() => setActiveFilter(item.id)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={activeFilter === item.id ? '#fff' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    dynamicStyles.filterPillText,
                    activeFilter === item.id && styles.filterPillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Animated.View>
    );
  };

  // Progress bar component
  const ProgressBar = ({ progress, status }: { progress: number; status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const animatedWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }, [progress]);

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, dynamicStyles.progressTrack]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: config.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: config.color }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    );
  };

  // Product images stack
  const ProductImagesStack = ({ items }: { items: OrderItem[] }) => {
    const displayItems = items.slice(0, 3);
    const remaining = items.length - 3;

    // Helper to get the best available image URL for an item, with fallback to fetched product images
    const getItemImageUrl = (item: OrderItem): string => {
      const imageUrl = item.productImage || (item as any).image || ((item as any).images && (item as any).images[0]) || productImages[item.productId] || null;
      return getImageUrl(imageUrl) || 'https://via.placeholder.com/48';
    };

    return (
      <View style={styles.imageStack}>
        {displayItems.map((item, index) => (
          <View
            key={item.productId}
            style={[
              styles.stackedImage,
              dynamicStyles.stackedImageBg,
              { 
                zIndex: displayItems.length - index,
                marginLeft: index > 0 ? -12 : 0,
                borderColor: colors.card,
              },
            ]}
          >
            <Image
              source={{ uri: getItemImageUrl(item) }}
              style={styles.productImage}
            />
          </View>
        ))}
        {remaining > 0 && (
          <View style={[styles.stackedImage, styles.remainingBadge, { marginLeft: -12 }]}>
            <Text style={styles.remainingText}>+{remaining}</Text>
          </View>
        )}
      </View>
    );
  };

  // Order card component
  const renderOrderCard = ({ item, index }: { item: Order; index: number }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isActive = !['delivered', 'cancelled'].includes(item.status);

    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0],
    });

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.orderCard, dynamicStyles.orderCard]}
          onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
          activeOpacity={0.7}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.orderInfo}>
              <Text style={[styles.orderNumber, dynamicStyles.orderNumber]}>#{item.orderNumber}</Text>
              <Text style={[styles.orderDate, dynamicStyles.orderDate]}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isDark ? `${config.color}20` : config.bgColor }]}>
              <Ionicons name={config.icon as any} size={14} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          {/* Products Section */}
          <View style={styles.productsSection}>
            <ProductImagesStack items={item.items} />
            <View style={styles.productDetails}>
              <Text style={[styles.itemsCount, dynamicStyles.itemsCount]} numberOfLines={1}>
                {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
              </Text>
              <Text style={[styles.itemsList, dynamicStyles.itemsList]} numberOfLines={2}>
                {item.items.map(i => i.productName).join(', ')}
              </Text>
            </View>
          </View>

          {/* Progress Bar for Active Orders */}
          {isActive && (
            <ProgressBar progress={config.progress} status={item.status} />
          )}

          {/* Card Footer */}
          <View style={[styles.cardFooter, dynamicStyles.cardFooterBorder]}>
            <View style={styles.totalContainer}>
              <Text style={[styles.totalLabel, dynamicStyles.totalLabel]}>Total</Text>
              <Text style={[styles.totalAmount, dynamicStyles.totalAmount]}>
                {formatCurrency(item.total || 0)}
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {isActive && item.assignedRider && (
                <TouchableOpacity
                  style={[styles.actionButton, dynamicStyles.actionButton]}
                  onPress={() => {
                    navigation.navigate('RiderChat', {
                      riderId: item.assignedRider?.userId || item.assignedRider?.id,
                      riderName: item.assignedRider?.user?.name,
                      riderPhone: item.assignedRider?.user?.phone,
                      orderId: item.id,
                    });
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color="#22C55E" />
                </TouchableOpacity>
              )}
              {isActive && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.trackButton]}
                  onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
                >
                  <Ionicons name="location-outline" size={18} color="#fff" />
                  <Text style={styles.trackButtonText}>Track</Text>
                </TouchableOpacity>
              )}
              {item.status === 'delivered' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.reorderButton, dynamicStyles.reorderButton]}
                  disabled={reorderingOrderId === item.id}
                  onPress={async () => {
                    if (!item.items || item.items.length === 0) {
                      Alert.alert('Error', 'No items to reorder');
                      return;
                    }
                    setReorderingOrderId(item.id);
                    try {
                      await cartService.clearCart();
                      for (const orderItem of item.items) {
                        await cartService.addToCart(orderItem.productId, orderItem.quantity);
                      }
                      const updatedCart = await cartService.getCart();
                      dispatch(setCart({
                        items: updatedCart.items.map((cartItem: any) => ({
                          productId: cartItem.productId,
                          product: {
                            id: cartItem.productId,
                            title: cartItem.title,
                            price: cartItem.price,
                            unit: cartItem.unit,
                            farmerId: cartItem.farmerId,
                            farmerName: cartItem.farmerName,
                            description: '',
                            stock: 999,
                            category: '',
                            isAvailable: true,
                            images: [],
                          } as any,
                          quantity: cartItem.quantity,
                          subtotal: cartItem.price * cartItem.quantity,
                        })),
                        total: updatedCart.total,
                        itemCount: updatedCart.itemCount,
                      }));
                      Alert.alert(
                        'Items Added to Cart',
                        'All items from this order have been added to your cart.',
                        [{ text: 'View Cart', onPress: () => navigation.navigate('Cart') }, { text: 'OK' }]
                      );
                    } catch (error: any) {
                      Alert.alert('Error', error?.message || 'Failed to add items to cart');
                    } finally {
                      setReorderingOrderId(null);
                    }
                  }}
                >
                  <Ionicons name="refresh-outline" size={18} color="#22C55E" />
                  <Text style={styles.reorderButtonText}>{reorderingOrderId === item.id ? 'Adding...' : 'Reorder'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Rider Info (if assigned) */}
          {isActive && item.assignedRider?.user && (
            <View style={[styles.riderInfo, dynamicStyles.riderInfoBorder]}>
              <Image
                source={{ 
                  uri: item.assignedRider.user.avatar 
                    ? getImageUrl(item.assignedRider.user.avatar)
                    : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.assignedRider.user.name)
                }}
                style={[styles.riderAvatar, dynamicStyles.riderAvatarBg]}
              />
              <View style={styles.riderDetails}>
                <Text style={[styles.riderName, dynamicStyles.riderName]}>{item.assignedRider.user.name}</Text>
                <Text style={[styles.riderLabel, dynamicStyles.riderLabel]}>Delivery Partner</Text>
              </View>
              <TouchableOpacity style={[styles.callButton, dynamicStyles.actionButton]}>
                <Ionicons name="call-outline" size={18} color="#22C55E" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {/* SVG Background */}
      <View style={styles.emptyBackground}>
        <Svg width={200} height={200}>
          <Defs>
            <SvgLinearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#86EFAC" stopOpacity="0.08" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx="100" cy="100" r="90" fill="url(#emptyGrad)" />
          <Circle cx="100" cy="100" r="60" fill="url(#emptyGrad)" />
        </Svg>
      </View>
      <View style={[styles.emptyIconContainer, { backgroundColor: '#DCFCE7' }]}>
        <Ionicons name="cube" size={48} color="#22C55E" />
      </View>
      <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>No Orders Yet</Text>
      <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
        {activeFilter === 'all'
          ? "You haven't placed any orders yet. Start shopping to see your orders here!"
          : `No ${activeFilter} orders found.`}
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('BuyerTabs', { screen: 'Home' } as any)}
      >
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shopButtonGradient}
        >
          <Ionicons name="basket" size={20} color="#fff" />
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Loading skeleton
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.skeletonCard, dynamicStyles.skeletonCard]}>
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonTitle, dynamicStyles.skeletonElement]} />
            <View style={[styles.skeletonBadge, dynamicStyles.skeletonElement]} />
          </View>
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonImage, dynamicStyles.skeletonElement]} />
            <View style={styles.skeletonLines}>
              <View style={[styles.skeletonLine, dynamicStyles.skeletonElement]} />
              <View style={[styles.skeletonLine, dynamicStyles.skeletonElement, { width: '60%' }]} />
            </View>
          </View>
          <View style={[styles.skeletonFooter, dynamicStyles.skeletonFooterBorder]}>
            <View style={[styles.skeletonPrice, dynamicStyles.skeletonElement]} />
            <View style={[styles.skeletonButton, dynamicStyles.skeletonElement]} />
          </View>
        </View>
      ))}
    </View>
  );

  // Sort options
  const SORT_OPTIONS = [
    { id: 'newest', label: 'Newest First', icon: 'arrow-down' },
    { id: 'oldest', label: 'Oldest First', icon: 'arrow-up' },
    { id: 'amount', label: 'Highest Amount', icon: 'trending-up' },
  ];

  // Sort modal
  const renderSortModal = () => (
    <Modal
      visible={showSortOptions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortOptions(false)}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => setShowSortOptions(false)}
      >
        <Pressable style={[styles.bottomSheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.bottomSheetHandle} />
          <Text style={[styles.sortModalTitle, { color: colors.text }]}>Sort Orders</Text>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortOption,
                sortBy === option.id && styles.sortOptionActive,
                sortBy === option.id && { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4' },
              ]}
              onPress={() => {
                setSortBy(option.id as 'newest' | 'oldest' | 'amount');
                setShowSortOptions(false);
              }}
            >
              <Ionicons 
                name={option.icon as any} 
                size={20} 
                color={sortBy === option.id ? '#22C55E' : colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.sortOptionText, 
                  { color: sortBy === option.id ? '#22C55E' : colors.text }
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.id && (
                <Ionicons name="checkmark" size={20} color="#22C55E" />
              )}
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      {/* Sort Modal */}
      {renderSortModal()}

      {/* Top Bar */}
      <View style={[styles.topBar, dynamicStyles.topBar]}>
        <Text style={[styles.screenTitle, dynamicStyles.screenTitle]}>{t('orders.myOrders')}</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowSortOptions(true)}
        >
          <Ionicons name="options-outline" size={24} color={dynamicStyles.menuIcon} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        renderSkeleton()
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            filteredOrders.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#22C55E']}
              tintColor="#22C55E"
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#1F2937',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 6,
  },
  smallStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  smallStatContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallStatNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  smallStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  liveText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterList: {
    paddingVertical: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  filterPillText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  cardContainer: {
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  stackedImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  remainingBadge: {
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  productDetails: {
    flex: 1,
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemsList: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalContainer: {},
  totalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButton: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#22C55E',
    gap: 6,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reorderButton: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
    gap: 6,
  },
  reorderButtonText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  riderDetails: {
    flex: 1,
    marginLeft: 12,
  },
  riderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  riderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyBackground: {
    position: 'absolute',
    opacity: 0.8,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  shopButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonTitle: {
    width: 100,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 80,
    height: 28,
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
  },
  skeletonBody: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  skeletonImage: {
    width: 48,
    height: 48,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 12,
  },
  skeletonLines: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '80%',
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  skeletonPrice: {
    width: 80,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonButton: {
    width: 100,
    height: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  sortOptionActive: {
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default OrdersScreen;
