import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Animated,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { BuyerStackParamList, OrderStatus, SocketEvent } from '../../types';
import { LoadingSpinner, ErrorState } from '../../components/common';
import { ExpoMapView } from '../../components/common/ExpoMapView';
import LiveTrackingCard from '../../components/tracking/LiveTrackingCard';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { orderService } from '../../services/orderService';
import { cartService } from '../../services/cartService';
import { useOrderSubscription } from '../../hooks/useSocket';
import OrderIllustrations from '../../assets/illustrations/orders';
import CancelOrderModal from '../../components/buyer/CancelOrderModal';
import OrderReceiptModal from '../../components/buyer/OrderReceiptModal';
import { useAppDispatch } from '../../store';
import { setCart } from '../../store/slices/cartSlice';
import { MAP_CONFIG } from '../../constants/config';
import { openMapsLocation } from '../../utils/maps';

type Props = NativeStackScreenProps<BuyerStackParamList, 'OrderTracking'>;

const { width, height } = Dimensions.get('window');

// Define vibrant colors for each step
const STEP_COLORS: Record<OrderStatus, string> = {
  pending: '#9E9E9E',
  created: '#FF9800',       // Orange - payment processing
  confirmed: '#2196F3',     // Blue
  preparing: '#FF9800',     // Orange
  ready_for_pickup: '#9C27B0', // Purple
  rider_assigned: '#00BCD4', // Cyan
  picked_up: '#FF5722',     // Deep Orange
  in_transit: '#3F51B5',    // Indigo
  delivered: '#4CAF50',     // Green
  cancelled: '#F44336',     // Red
};

const ORDER_STEPS: { status: OrderStatus; label: string; description: string; icon: keyof typeof Ionicons.glyphMap; Illustration: React.FC<{ size?: number; primaryColor?: string; secondaryColor?: string }> }[] = [
  { status: 'created', label: 'Order Placed', description: 'Verifying payment...', icon: 'time', Illustration: OrderIllustrations.PendingIllustration },
  { status: 'confirmed', label: 'Order Confirmed', description: 'Payment received, order confirmed', icon: 'checkmark-circle', Illustration: OrderIllustrations.OrderConfirmedIllustration },
  { status: 'preparing', label: 'Preparing', description: 'Farmer is preparing your order', icon: 'leaf', Illustration: OrderIllustrations.PreparingOrderIllustration },
  { status: 'rider_assigned', label: 'Rider Assigned', description: 'A rider is on the way to pickup', icon: 'bicycle', Illustration: OrderIllustrations.RiderAssignedIllustration },
  { status: 'picked_up', label: 'Picked Up', description: 'Order picked up from farmer', icon: 'cube', Illustration: OrderIllustrations.PickedUpIllustration },
  { status: 'in_transit', label: 'On the Way', description: 'Your order is en route', icon: 'navigate', Illustration: OrderIllustrations.InTransitIllustration },
  { status: 'delivered', label: 'Delivered', description: 'Enjoy your fresh produce!', icon: 'checkmark-done-circle', Illustration: OrderIllustrations.DeliveredOrderIllustration },
];

const StatusBadge = ({ status, colors }: { status: string; colors: any }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
      case 'created':
        return { bg: '#FFF3E0', color: '#E65100', label: 'Processing' };
      case 'confirmed':
        return { bg: '#E3F2FD', color: '#1976D2', label: 'Confirmed' };
      case 'delivered':
        return { bg: '#E8F5E9', color: '#2E7D32', label: 'Delivered' };
      case 'cancelled':
        return { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled' };
      case 'in_transit':
        return { bg: '#E3F2FD', color: '#1565C0', label: 'On the Way' };
      case 'picked_up':
        return { bg: '#FFF3E0', color: '#E65100', label: 'Picked Up' };
      case 'rider_assigned':
        return { bg: '#F3E5F5', color: '#7B1FA2', label: 'Rider Assigned' };
      case 'preparing':
        return { bg: '#FFF8E1', color: '#FF8F00', label: 'Preparing' };
      default:
        return { bg: '#E5F1FF', color: colors.primary, label: 'Processing' };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

export default function OrderTrackingScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (order?.assignedRider?.currentLat && order?.assignedRider?.currentLng) {
      setRiderLocation({
        lat: order.assignedRider.currentLat,
        lng: order.assignedRider.currentLng,
      });
    }
  }, [order?.assignedRider?.currentLat, order?.assignedRider?.currentLng]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useOrderSubscription(orderId, useCallback((event: SocketEvent) => {
    if (event.type === 'rider:location' && event.data) {
      // Backend sends latitude/longitude, convert to lat/lng
      setRiderLocation({
        lat: event.data.latitude || event.data.lat,
        lng: event.data.longitude || event.data.lng,
      });
      setLastLocationUpdate(new Date());
    }
    if (event.type === 'rider:location_update' && event.data?.location) {
      setRiderLocation(event.data.location);
      setLastLocationUpdate(new Date());
    }
    if (event.type === 'eta:update' && event.data.eta) {
      setEta(event.data.eta);
    }
    if (event.type.startsWith('order:')) {
      refetch();
    }
  }, [refetch]));

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    const index = ORDER_STEPS.findIndex((step) => step.status === order.status);
    return index >= 0 ? index : 0;
  };

  const handleCallRider = () => {
    const phone = order?.assignedRider?.user?.phone || order?.assignedRiderPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleChatRider = () => {
    const riderPhone = order?.assignedRider?.user?.phone || order?.assignedRiderPhone;
    const riderName = order?.assignedRider?.user?.name || order?.assignedRiderName;
    // Use the rider's userId (not rider.id) for chat - chat needs user IDs
    const riderId = order?.assignedRider?.userId || order?.assignedRider?.user?.id || order?.assignedRiderId;
    const riderRating = order?.assignedRider?.rating;
    const vehicleType = order?.assignedRider?.vehicleType;
    const isOnline = order?.assignedRider?.isOnline;

    (navigation as any).navigate('RiderChat', {
      riderId,
      riderName,
      riderPhone,
      riderRating,
      vehicleType,
      isOnline,
      orderId,
    });
  };

  const handleChatFarmer = () => {
    // Get farmer info from order - farmer info is typically in items or at order level
    const farmerId = order?.farmerId || order?.items?.[0]?.farmerId;
    const farmerName = order?.farmerName || order?.items?.[0]?.farmerName || 'Farmer';
    const farmerAvatar = order?.farmerAvatar || order?.items?.[0]?.farmerAvatar;

    if (!farmerId) {
      Alert.alert('Unable to Chat', 'Farmer information not available for this order.');
      return;
    }

    (navigation as any).navigate('FarmerChat', {
      farmerId,
      farmerName,
      farmerAvatar,
      orderId,
    });
  };

  const handleCallFarmer = () => {
    const phone = order?.farmerPhone || order?.items?.[0]?.farmerPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleCancelOrder = async (reason: string) => {
    try {
      await orderService.cancelOrder(orderId, reason);
      // Invalidate orders query to refresh lists
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      refetch();
      Alert.alert(
        'Order Cancelled',
        'Your order has been cancelled. Refund will be processed within 3-5 business days.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to cancel order. Please try again.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  };

  const handleReorder = async () => {
    if (!order?.items || order.items.length === 0) {
      Alert.alert('Error', 'No items to reorder');
      return;
    }

    setIsReordering(true);
    try {
      // Clear existing cart first
      await cartService.clearCart();
      
      // Add each item from the order to the cart
      for (const item of order.items) {
        await cartService.addToCart(item.productId, item.quantity);
      }
      
      // Get updated cart from backend - the cart screen will sync properly
      const updatedCart = await cartService.getCart();
      
      // Update Redux with the backend cart data
      // Cast to any to handle partial Product data from backend
      dispatch(setCart({
        items: updatedCart.items.map((item: any) => ({
          productId: item.productId,
          product: {
            id: item.productId,
            title: item.title,
            price: item.price,
            unit: item.unit,
            farmerId: item.farmerId,
            farmerName: item.farmerName,
            // Required fields with defaults
            description: '',
            stock: 999,
            category: '',
            isAvailable: true,
            images: [],
          } as any,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        total: updatedCart.total,
        itemCount: updatedCart.itemCount,
      }));

      Alert.alert(
        'Items Added to Cart',
        'All items from this order have been added to your cart.',
        [
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
          { text: 'Continue Shopping', onPress: () => navigation.navigate('BuyerTabs') },
        ]
      );
    } catch (error: any) {
      console.error('Reorder error:', error);
      Alert.alert(
        'Error',
        'Some items may no longer be available. Please check your cart.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsReordering(false);
    }
  };

  // Buyers can only cancel while payment is still processing (pending or created)
  const canCancel = ['pending', 'created', 'confirmed', 'assigned'].includes(order?.status || '');

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading order..." />;
  }

  if (isError || !order) {
    return <ErrorState message="Failed to load order" onRetry={refetch} />;
  }

  const currentStep = getCurrentStepIndex();
  const showMap = ['rider_assigned', 'picked_up', 'in_transit'].includes(order.status);
  const displayEta = eta ?? order.eta;
  const isCompleted = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  const orderNumberOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Animated.Text style={[styles.headerTitle, { color: colors.text, opacity: titleOpacity, position: 'absolute' }]}>
            Track Order
          </Animated.Text>
          <Animated.Text style={[styles.headerTitle, { color: colors.text, opacity: orderNumberOpacity }]}>
            #{order.orderNumber || order.id?.slice(-8)}
          </Animated.Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Status Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {isCompleted ? (
            <View style={styles.heroContent}>
              <OrderIllustrations.DeliveredOrderIllustration size={140} primaryColor="#43A047" secondaryColor="#81C784" />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Order Delivered! 🎉</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Thank you for your order</Text>
            </View>
          ) : isCancelled ? (
            <View style={styles.heroContent}>
              <OrderIllustrations.OrderCancelledIllustration size={140} primaryColor="#E53935" secondaryColor="#EF9A9A" />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Order Cancelled</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                {order.cancellationReason || 'This order has been cancelled'}
              </Text>
            </View>
          ) : order.status === 'pending' ? (
            <View style={styles.heroContent}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <OrderIllustrations.PendingIllustration size={140} primaryColor="#FF9800" secondaryColor="#FFE0B2" />
              </Animated.View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Order Placed ⏳</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Waiting for payment confirmation</Text>
              <Text style={[styles.heroOrderNumber, { color: colors.textSecondary, marginTop: 8 }]}>
                Order #{order.orderNumber || order.id?.slice(-8)}
              </Text>
            </View>
          ) : order.status === 'created' ? (
            <View style={styles.heroContent}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <OrderIllustrations.PendingIllustration size={140} primaryColor="#FF9800" secondaryColor="#FFE0B2" />
              </Animated.View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Processing Payment ⏳</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Verifying your payment...</Text>
              <Text style={[styles.heroOrderNumber, { color: colors.textSecondary, marginTop: 8 }]}>
                Order #{order.orderNumber || order.id?.slice(-8)}
              </Text>
            </View>
          ) : order.status === 'confirmed' ? (
            <View style={styles.heroContent}>
              <OrderIllustrations.OrderConfirmedIllustration size={140} primaryColor={colors.primary} secondaryColor="#E3F2FD" />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Order Confirmed ✓</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Payment received, preparing soon</Text>
              <Text style={[styles.heroOrderNumber, { color: colors.textSecondary, marginTop: 8 }]}>
                Order #{order.orderNumber || order.id?.slice(-8)}
              </Text>
            </View>
          ) : order.status === 'preparing' ? (
            <View style={styles.heroContent}>
              <OrderIllustrations.PreparingOrderIllustration size={140} primaryColor="#FF9800" secondaryColor="#FFE0B2" />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Preparing Your Order 👨‍🍳</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>The farmer is preparing your items</Text>
              <Text style={[styles.heroOrderNumber, { color: colors.textSecondary, marginTop: 8 }]}>
                Order #{order.orderNumber || order.id?.slice(-8)}
              </Text>
            </View>
          ) : order.status === 'rider_assigned' ? (
            <View style={styles.heroContent}>
              <OrderIllustrations.RiderAssignedIllustration size={140} primaryColor="#00BCD4" secondaryColor="#B2EBF2" />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Rider Assigned 🏍️</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>A rider is heading to pickup your order</Text>
              {displayEta && (
                <View style={styles.etaRowSmall}>
                  <Text style={[styles.etaValueSmall, { color: colors.primary }]}>~{displayEta} min</Text>
                </View>
              )}
            </View>
          ) : order.status === 'picked_up' ? (
            <View style={styles.heroContent}>
              <OrderIllustrations.PickedUpIllustration size={140} primaryColor="#FF5722" secondaryColor="#FFCCBC" />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Order Picked Up 📦</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Your order is with the rider</Text>
              {displayEta && (
                <View style={styles.etaRowSmall}>
                  <Text style={[styles.etaValueSmall, { color: colors.primary }]}>~{displayEta} min</Text>
                </View>
              )}
            </View>
          ) : order.status === 'in_transit' ? (
            <View style={styles.heroContent}>
              <OrderIllustrations.InTransitIllustration size={140} primaryColor="#3F51B5" secondaryColor="#C5CAE9" />
              <Text style={[styles.heroTitle, { color: colors.text }]}>On The Way 🚚</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Your order is en route to you</Text>
              {displayEta && (
                <View style={styles.etaRowSmall}>
                  <Text style={[styles.etaValueSmall, { color: colors.primary }]}>Arriving in ~{displayEta} min</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.heroContent}>
              <OrderIllustrations.OrderReceivedIllustration size={140} primaryColor={colors.primary} secondaryColor="#E8F5E9" />
              <Text style={[styles.heroTitle, { color: colors.text }]}>Processing Order</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>We're working on your order</Text>
              <Text style={[styles.heroOrderNumber, { color: colors.textSecondary, marginTop: 8 }]}>
                Order #{order.orderNumber || order.id?.slice(-8)}
              </Text>
            </View>
          )}
        </View>

        {/* Map Section */}
        {showMap && order.deliveryAddress?.lat && (
          <View style={[styles.mapCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.mapHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LIVE TRACKING</Text>
            </View>
            <View style={styles.mapContainer}>
              <ExpoMapView
                pickupLocation={{
                  latitude: order.pickupPoint?.lat || order.pickupLocation?.lat || order.deliveryAddress.lat,
                  longitude: order.pickupPoint?.lng || order.pickupLocation?.lng || order.deliveryAddress.lng,
                }}
                deliveryLocation={{
                  latitude: order.deliveryAddress.lat,
                  longitude: order.deliveryAddress.lng,
                }}
                riderLocation={riderLocation ? {
                  latitude: riderLocation.lat,
                  longitude: riderLocation.lng,
                } : (order.assignedRider?.currentLat && order.assignedRider?.currentLng ? {
                  latitude: order.assignedRider.currentLat,
                  longitude: order.assignedRider.currentLng,
                } : null)}
                pickupAddress={order.pickupPoint?.address || order.farmerName || 'Farm Location'}
                deliveryAddress={order.deliveryAddress?.address || 'Delivery Address'}
                height={200}
                showFullscreenButton={true}
              />
              {/* Track Rider Button */}
              {riderLocation && (
                <TouchableOpacity
                  style={styles.trackRiderButton}
                  onPress={() => {
                    openMapsLocation(riderLocation.lat, riderLocation.lng, 'Rider Location');
                  }}
                >
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  <Text style={styles.trackRiderText}>See Rider on Map</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Live Tracking Stats Card */}
        {showMap && (order.status === 'rider_assigned' || order.status === 'picked_up' || order.status === 'in_transit') && (
          <View style={styles.section}>
            <LiveTrackingCard
              riderLocation={riderLocation}
              deliveryLocation={{
                lat: order.deliveryAddress.lat,
                lng: order.deliveryAddress.lng,
              }}
              riderName={order.assignedRider?.user?.name || order.assignedRiderName}
              isOnline={order.assignedRider?.isOnline ?? true}
              lastUpdateTime={lastLocationUpdate || undefined}
            />
          </View>
        )}

        {/* Rider Card */}
        {(order.assignedRider || order.assignedRiderName) && !isCompleted && !isCancelled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>YOUR RIDER</Text>
            <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <View style={styles.riderContent}>
                {order.assignedRider?.user?.avatar ? (
                  <Image source={{ uri: order.assignedRider.user.avatar }} style={styles.riderAvatarImage} />
                ) : (
                  <View style={[styles.riderAvatar, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={styles.riderInfo}>
                  <View style={styles.riderNameRow}>
                    <Text style={[styles.riderName, { color: colors.text }]}>
                      {order.assignedRider?.user?.name || order.assignedRiderName}
                    </Text>
                    <View style={[styles.onlineBadge, { backgroundColor: order.assignedRider?.isOnline ? '#E8F5E9' : '#F5F5F5' }]}>
                      <View style={[styles.onlineDot, { backgroundColor: order.assignedRider?.isOnline ? '#4CAF50' : '#9E9E9E' }]} />
                      <Text style={[styles.onlineText, { color: order.assignedRider?.isOnline ? '#4CAF50' : '#9E9E9E' }]}>
                        {order.assignedRider?.isOnline ? 'Active' : 'Offline'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.riderRating}>
                    <Ionicons name="star" size={14} color="#FFC107" />
                    <Text style={[styles.riderRatingText, { color: colors.text }]}>
                      {order.assignedRider?.rating ? Number(order.assignedRider.rating).toFixed(1) : '4.8'}
                    </Text>
                    <Text style={[styles.riderTrips, { color: colors.textSecondary }]}>
                      • {order.assignedRider?.totalDeliveries || 0} deliveries
                    </Text>
                  </View>
                  {order.assignedRider?.vehicleType && (
                    <View style={styles.riderVehicle}>
                      <Ionicons 
                        name={order.assignedRider.vehicleType === 'motorcycle' ? 'bicycle' : 
                              order.assignedRider.vehicleType === 'car' ? 'car' : 'cube'} 
                        size={12} 
                        color={colors.textSecondary} 
                      />
                      <Text style={[styles.riderVehicleText, { color: colors.textSecondary }]}>
                        {order.assignedRider.vehicleModel || order.assignedRider.vehicleType}
                        {order.assignedRider.vehiclePlate && ` • ${order.assignedRider.vehiclePlate}`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.riderActionsDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
              <View style={styles.riderActionsRow}>
                <TouchableOpacity style={styles.riderActionButton} onPress={handleCallRider}>
                  <View style={[styles.riderActionIcon, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                    <Ionicons name="call" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.riderActionText, { color: colors.primary }]}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.riderActionButton} onPress={handleChatRider}>
                  <View style={[styles.riderActionIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.riderActionText, { color: colors.primary }]}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Farmer Card - Show when order has farmer info and not cancelled */}
        {(order?.farmerId || order?.farmerName || order?.items?.[0]?.farmerId) && !isCancelled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>YOUR FARMER</Text>
            <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <View style={styles.riderContent}>
                <View style={[styles.riderAvatar, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' }]}>
                  <Ionicons name="leaf" size={24} color="#4CAF50" />
                </View>
                <View style={styles.riderInfo}>
                  <View style={styles.riderNameRow}>
                    <Text style={[styles.riderName, { color: colors.text }]}>
                      {order.farmerName || order.items?.[0]?.farmerName || 'Farmer'}
                    </Text>
                  </View>
                  <Text style={[styles.riderTrips, { color: colors.textSecondary }]}>
                    Preparing your fresh produce
                  </Text>
                </View>
              </View>
              <View style={[styles.riderActionsDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
              <View style={styles.riderActionsRow}>
                {(order?.farmerPhone || order?.items?.[0]?.farmerPhone) && (
                  <TouchableOpacity style={styles.riderActionButton} onPress={handleCallFarmer}>
                    <View style={[styles.riderActionIcon, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' }]}>
                      <Ionicons name="call" size={18} color="#4CAF50" />
                    </View>
                    <Text style={[styles.riderActionText, { color: '#4CAF50' }]}>Call</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.riderActionButton} onPress={handleChatFarmer}>
                  <View style={[styles.riderActionIcon, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.riderActionText, { color: '#4CAF50' }]}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Progress Timeline */}
        {!isCompleted && !isCancelled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ORDER PROGRESS</Text>
            
            {/* Current Step Illustration */}
            {currentStep >= 0 && currentStep < ORDER_STEPS.length && (
              <View style={[styles.currentStepCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <View style={styles.currentStepIllustration}>
                  {React.createElement(ORDER_STEPS[currentStep].Illustration, {
                    size: 80,
                    primaryColor: colors.primary,
                    secondaryColor: isDark ? 'rgba(0, 122, 255, 0.3)' : '#E5F1FF',
                  })}
                </View>
                <Text style={[styles.currentStepLabel, { color: colors.text }]}>
                  {ORDER_STEPS[currentStep].label}
                </Text>
                <Text style={[styles.currentStepDesc, { color: colors.textSecondary }]}>
                  {ORDER_STEPS[currentStep].description}
                </Text>
              </View>
            )}

            <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              {ORDER_STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                const isLast = index === ORDER_STEPS.length - 1;
                const StepIllustration = step.Illustration;
                const stepColor = STEP_COLORS[step.status] || colors.primary;
                const isNextAfterActive = index === currentStep + 1;

                return (
                  <View key={step.status} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <Animated.View
                        style={[
                          styles.timelineCircle,
                          { backgroundColor: isDark ? colors.surface : '#F5F5F5' },
                          isComplete && { backgroundColor: colors.primary },
                          isActive && { backgroundColor: stepColor },
                          isActive && { transform: [{ scale: pulseAnim }] },
                        ]}
                      >
                        {isComplete ? (
                          <Ionicons name="checkmark" size={24} color="#fff" />
                        ) : (
                          <StepIllustration
                            size={40}
                            primaryColor={isActive ? '#fff' : stepColor}
                          />
                        )}
                      </Animated.View>
                      {!isLast && (
                        <View style={styles.timelineLineContainer}>
                          <View
                            style={[
                              styles.timelineLine,
                              { backgroundColor: isDark ? colors.surface : '#E5E5EA' },
                            ]}
                          />
                          {/* Animated progress overlay */}
                          {isComplete && (
                            <View
                              style={[
                                styles.timelineLineProgress,
                                { backgroundColor: colors.primary },
                              ]}
                            />
                          )}
                          {isActive && (
                            <Animated.View
                              style={[
                                styles.timelineLineProgress,
                                { 
                                  backgroundColor: stepColor,
                                  opacity: pulseAnim.interpolate({
                                    inputRange: [1, 1.15],
                                    outputRange: [0.5, 1],
                                  }),
                                },
                              ]}
                            />
                          )}
                        </View>
                      )}
                    </View>
                    <View style={[styles.timelineContent, !isLast && styles.timelineContentBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
                      <Text style={[styles.timelineLabel, { color: isComplete || isActive ? colors.text : colors.textSecondary }]}>
                        {step.label}
                      </Text>
                      <Text style={[styles.timelineDesc, { color: colors.textSecondary }]}>{step.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ORDER SUMMARY</Text>
          <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {(order.items || []).map((item: any, index: number) => {
              const isLast = index === (order.items?.length || 0) - 1;
              return (
                <View 
                  key={index} 
                  style={[
                    styles.itemRow, 
                    !isLast && styles.itemRowBorder,
                    { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }
                  ]}
                >
                  <View style={[styles.itemQuantityBadge, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                    <Text style={[styles.itemQuantityText, { color: colors.primary }]}>{item.quantity}x</Text>
                  </View>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.title || item.productName || 'Item'}</Text>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>₦{Number(item.subtotal || 0).toLocaleString()}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAYMENT DETAILS</Text>
          <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={[styles.pricingRow, styles.pricingRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.pricingValue, { color: colors.text }]}>₦{Number(order.subtotal || 0).toLocaleString()}</Text>
            </View>
            <View style={[styles.pricingRow, styles.pricingRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
              <Text style={[styles.pricingValue, { color: colors.text }]}>₦{Number(order.deliveryFee || 0).toLocaleString()}</Text>
            </View>
            {(order.serviceFee || 0) > 0 && (
              <View style={[styles.pricingRow, styles.pricingRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
                <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Service Fee</Text>
                <Text style={[styles.pricingValue, { color: colors.text }]}>₦{Number(order.serviceFee).toLocaleString()}</Text>
              </View>
            )}
            {(order.discount || 0) > 0 && (
              <View style={[styles.pricingRow, styles.pricingRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
                <Text style={[styles.pricingLabel, { color: colors.textSecondary }]}>Discount</Text>
                <Text style={[styles.pricingValue, { color: '#34C759' }]}>-₦{Number(order.discount).toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.pricingRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>₦{Number(order.total || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DELIVERY ADDRESS</Text>
          <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.addressRow}>
              <View style={[styles.addressIconContainer, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <View style={styles.addressContent}>
                <Text style={[styles.addressText, { color: colors.text }]}>
                  {order.deliveryAddress?.address || 'Address not available'}
                </Text>
                <Text style={[styles.addressSubtext, { color: colors.textSecondary }]}>
                  {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons for Active Orders */}
        {!isCompleted && !isCancelled && (
          <View style={styles.section}>
            {/* Receipt Button */}
            <TouchableOpacity 
              style={[styles.secondaryActionButton, { backgroundColor: isDark ? colors.surface : '#F5F5F5' }]}
              onPress={() => setShowReceiptModal(true)}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>View Receipt</Text>
            </TouchableOpacity>

            {/* Report Issue Button */}
            <TouchableOpacity 
              style={[styles.secondaryActionButton, { backgroundColor: isDark ? colors.surface : '#FFF3E0', marginTop: 12 }]}
              onPress={() => navigation.navigate('OrderDispute', { orderId })}
            >
              <Ionicons name="alert-circle-outline" size={20} color="#E65100" />
              <Text style={[styles.secondaryActionText, { color: '#E65100' }]}>Report an Issue</Text>
            </TouchableOpacity>

            {/* Cancel Button - only for pending/confirmed */}
            {canCancel && (
              <TouchableOpacity 
                style={[styles.cancelOrderButton, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}
                onPress={() => setShowCancelModal(true)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#E53935" />
                <Text style={[styles.cancelOrderText, { color: '#E53935' }]}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Reorder Buttons */}
        {isCompleted && (
          <View style={styles.section}>
            {/* Receipt Button */}
            <TouchableOpacity 
              style={[styles.secondaryActionButton, { backgroundColor: isDark ? colors.surface : '#F5F5F5', marginBottom: 12 }]}
              onPress={() => setShowReceiptModal(true)}
            >
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>View Receipt</Text>
            </TouchableOpacity>

            {/* Report Issue Button */}
            <TouchableOpacity 
              style={[styles.secondaryActionButton, { backgroundColor: isDark ? colors.surface : '#FFF3E0', marginBottom: 12 }]}
              onPress={() => navigation.navigate('OrderDispute', { orderId })}
            >
              <Ionicons name="alert-circle-outline" size={20} color="#E65100" />
              <Text style={[styles.secondaryActionText, { color: '#E65100' }]}>Report an Issue</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.rateButton, { backgroundColor: '#FFF8E1', borderColor: '#FFD54F' }]}
              onPress={() => navigation.navigate('OrderCompleted', {
                orderId: order.id,
                orderNumber: order.orderNumber || order.id?.slice(-8) || '',
                total: order.total,
                farmerName: order.farmerName,
              })}
            >
              <Ionicons name="star" size={20} color="#FF8F00" />
              <Text style={[styles.rateButtonText, { color: '#FF8F00' }]}>Rate Your Experience</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.reorderButton, { backgroundColor: colors.primary, opacity: isReordering ? 0.7 : 1 }]}
              onPress={handleReorder}
              disabled={isReordering}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.reorderButtonText}>{isReordering ? 'Adding to Cart...' : 'Order Again'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancelled Order Actions */}
        {isCancelled && (
          <View style={styles.section}>
            {/* Receipt Button */}
            <TouchableOpacity 
              style={[styles.secondaryActionButton, { backgroundColor: isDark ? colors.surface : '#F5F5F5', marginBottom: 12 }]}
              onPress={() => setShowReceiptModal(true)}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>View Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.reorderButton, { backgroundColor: colors.primary, opacity: isReordering ? 0.7 : 1 }]}
              onPress={handleReorder}
              disabled={isReordering}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.reorderButtonText}>{isReordering ? 'Adding to Cart...' : 'Reorder Items'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 200 }} />
      </Animated.ScrollView>

      {/* Fixed Bottom Help Card */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.bottomCardHeader}>
          <View style={[styles.bottomCardIconBg, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
            <Ionicons name="help-circle" size={20} color={colors.primary} />
          </View>
          <View style={styles.bottomCardTextContainer}>
            <Text style={[styles.bottomCardTitle, { color: colors.text }]}>Need Help?</Text>
            <Text style={[styles.bottomCardSubtitle, { color: colors.textSecondary }]}>Our support team is available 24/7</Text>
          </View>
        </View>
        
        <View style={styles.helpActionsRow}>
          <TouchableOpacity style={styles.helpActionButton} onPress={() => navigation.navigate('LiveChat' as any)}>
            <View style={[styles.helpActionIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            </View>
            <Text style={[styles.helpActionText, { color: colors.text }]}>Live Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.helpActionButton} onPress={() => navigation.navigate('HelpCenter' as any)}>
            <View style={[styles.helpActionIcon, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="book-outline" size={18} color="#fff" />
            </View>
            <Text style={[styles.helpActionText, { color: colors.text }]}>Help Center</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.helpActionButton} onPress={() => navigation.navigate('ContactUs' as any)}>
            <View style={[styles.helpActionIcon, { backgroundColor: '#1976D2' }]}>
              <Ionicons name="call" size={18} color="#fff" />
            </View>
            <Text style={[styles.helpActionText, { color: colors.text }]}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        orderNumber={order?.orderNumber || order?.id?.slice(-8) || ''}
      />

      {/* Order Receipt Modal */}
      {order && (
        <OrderReceiptModal
          visible={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          order={order}
        />
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingTop: 8,
  },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  heroOrderNumber: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 12,
  },
  etaLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  etaValue: {
    fontSize: 56,
    fontFamily: FONTS.bold,
    lineHeight: 60,
  },
  etaUnit: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginLeft: 4,
  },
  etaRowSmall: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 20,
  },
  etaValueSmall: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  insetCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  mapHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  mapContainer: {
    height: 220,
    position: 'relative',
  },
  trackRiderButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    ...SHADOWS.medium,
  },
  trackRiderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  map: {
    flex: 1,
  },
  deliveryMarker: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pickupMarker: {
    backgroundColor: '#FF9800',
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  riderMarker: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  staticMapOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  staticMapText: {
    fontSize: 10,
    color: '#fff',
  },
  riderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  riderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  riderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  riderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  riderName: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  riderRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderRatingText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  riderTrips: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginLeft: 4,
  },
  riderVehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  riderVehicleText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  riderActionsDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  riderActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 32,
  },
  riderActionButton: {
    alignItems: 'center',
    gap: 6,
  },
  riderActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderActionText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    minHeight: 80,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 48,
    marginRight: 12,
  },
  timelineCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  timelineLineContainer: {
    flex: 1,
    width: 3,
    minHeight: 20,
    marginVertical: 4,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 3,
    borderRadius: 1.5,
  },
  timelineLineProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 3,
    borderRadius: 1.5,
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 12,
  },
  timelineContentBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timelineLabel: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  currentStepCard: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  currentStepIllustration: {
    marginBottom: 12,
  },
  currentStepLabel: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  currentStepDesc: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemQuantityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  itemQuantityText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pricingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pricingLabel: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  pricingValue: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  addressIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressContent: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  addressSubtext: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomCardIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCardTextContainer: {
    marginLeft: 12,
  },
  bottomCardTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  bottomCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  helpActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  helpActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  helpActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpActionText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  rateButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  rateButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  reorderButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reorderButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  secondaryActionButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  secondaryActionText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  cancelOrderButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  cancelOrderText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  // Map Modal Styles
  mapModalContainer: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mapModalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
  },
  mapModalContent: {
    flex: 1,
  },
  fullscreenMap: {
    flex: 1,
    width: '100%',
  },
  mapLegend: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 12,
    padding: 12,
    ...SHADOWS.small,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  mapAddressInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.medium,
  },
  mapAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mapAddressTextContainer: {
    flex: 1,
  },
  mapAddressLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  mapAddressValue: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  mapAddressDivider: {
    height: 1,
    marginVertical: 12,
  },
  openExternalMapsButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.medium,
  },
  openExternalMapsText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  // Route card styles (fallback when map fails)
  routeCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  routeCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  routeCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeCardDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  routeCardLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    width: 2,
    height: 24,
    backgroundColor: '#ddd',
  },
  routeCardTextContainer: {
    flex: 1,
  },
  routeCardLabel: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeCardAddress: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  // Visual route styles (when map image fails)
  visualRouteContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  visualRouteCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.large,
  },
  visualRoutePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  visualRouteCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  visualRouteTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  visualRouteLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  visualRouteAddress: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    lineHeight: 22,
  },
  visualRouteLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 23,
    height: 40,
  },
  visualRouteLineInner: {
    width: 2,
    height: '100%',
  },
  visualRouteArrow: {
    position: 'absolute',
    left: 13,
  },
});