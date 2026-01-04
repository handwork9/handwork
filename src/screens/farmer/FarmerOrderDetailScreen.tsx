import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Animated,
  Dimensions,
  Image,
  Modal,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FarmerStackParamList, OrderStatus, SocketEvent } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import { API_CONFIG } from '../../constants/config';
import { useTheme } from '../../context/ThemeContext';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { useFarmerSocket } from '../../hooks/useFarmerSocket';
import { useOrderSubscription } from '../../hooks/useSocket';
import { useAppDispatch } from '../../store';
import { updateOrderStatus as updateOrderStatusAction } from '../../store/slices/farmerSlice';
import { getProductIllustration } from '../../assets/illustrations/products';
import { ExpoMapView } from '../../components/common/ExpoMapView';
import { openMapsLocation } from '../../utils/maps';
import { formatCurrency } from '../../utils/formatters';
import {
  CustomerIllustration,
  PhoneIllustration,
  LocationIllustration,
  BuildingIllustration,
  NotesIllustration,
  PendingIllustration,
  ConfirmedIllustration,
  PreparingIllustration,
  ReadyIllustration,
  DeliveredIllustration,
  CancelledIllustration,
} from '../../assets/illustrations/orders';

const { width: screenWidth } = Dimensions.get('window');

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerOrderDetail'>;

const STATUS_CONFIG: Record<OrderStatus, { color: string; bgColor: string; label: string; icon: keyof typeof Ionicons.glyphMap; Illustration: React.FC<{ width?: number; height?: number; color?: string }> }> = {
  pending: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Pending', icon: 'time-outline', Illustration: PendingIllustration },
  created: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Processing', icon: 'hourglass-outline', Illustration: PendingIllustration },
  confirmed: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'Confirmed', icon: 'checkmark-circle-outline', Illustration: ConfirmedIllustration },
  preparing: { color: '#8B5CF6', bgColor: '#EDE9FE', label: 'Preparing', icon: 'restaurant-outline', Illustration: PreparingIllustration },
  ready_for_pickup: { color: '#10B981', bgColor: '#D1FAE5', label: 'Ready', icon: 'cube-outline', Illustration: ReadyIllustration },
  rider_assigned: { color: '#6366F1', bgColor: '#E0E7FF', label: 'Rider Assigned', icon: 'bicycle-outline', Illustration: ConfirmedIllustration },
  picked_up: { color: '#14B8A6', bgColor: '#CCFBF1', label: 'Picked Up', icon: 'bag-check-outline', Illustration: ReadyIllustration },
  in_transit: { color: '#0EA5E9', bgColor: '#E0F2FE', label: 'In Transit', icon: 'navigate-outline', Illustration: ReadyIllustration },
  delivered: { color: '#22C55E', bgColor: '#DCFCE7', label: 'Delivered', icon: 'checkmark-done-circle-outline', Illustration: DeliveredIllustration },
  cancelled: { color: '#EF4444', bgColor: '#FEE2E2', label: 'Cancelled', icon: 'close-circle-outline', Illustration: CancelledIllustration },
};

// Order status flow for the timeline
const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered'];

// Calculate farmer earnings (90% after platform commission)
const calculateFarmerEarnings = (subtotal: number): number => {
  const platformCommission = 0.10; // 10%
  return subtotal * (1 - platformCommission);
};

export default function FarmerOrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  
  // Subscribe to real-time order updates
  const { subscribeToOrder, unsubscribeFromOrder, isConnected } = useFarmerSocket();
  
  useEffect(() => {
    if (isConnected && orderId) {
      subscribeToOrder(orderId);
      return () => unsubscribeFromOrder(orderId);
    }
  }, [isConnected, orderId, subscribeToOrder, unsubscribeFromOrder]);

  // Subscribe to real-time rider location updates
  useOrderSubscription(orderId, useCallback((event: SocketEvent) => {
    if (event.type === 'rider:location' && event.data) {
      setRiderLocation({
        lat: event.data.latitude || event.data.lat,
        lng: event.data.longitude || event.data.lng,
      });
    }
    if (event.type === 'rider:location_update' && event.data?.location) {
      setRiderLocation(event.data.location);
    }
  }, []));

  const { data: order, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
    refetchInterval: 30000,
  });

  // Fetch product images for items that don't have images stored
  useEffect(() => {
    const fetchMissingImages = async () => {
      if (!order?.items) return;
      
      const itemsWithoutImages = order.items.filter(
        (item: any) => !item.image && !item.productImage && !item.images?.length && item.productId
      );
      
      if (itemsWithoutImages.length === 0) return;
      
      const newImages: Record<string, string> = {};
      
      await Promise.all(
        itemsWithoutImages.map(async (item: any) => {
          try {
            const product = await productService.getProductById(item.productId);
            if (product?.images?.[0]) {
              newImages[item.productId] = product.images[0];
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
  }, [order?.items]);

  // Initialize rider location from order data
  useEffect(() => {
    if (order?.assignedRider?.currentLat && order?.assignedRider?.currentLng) {
      setRiderLocation({
        lat: order.assignedRider.currentLat,
        lng: order.assignedRider.currentLng,
      });
    }
  }, [order?.assignedRider?.currentLat, order?.assignedRider?.currentLng]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      orderService.updateOrderStatus(orderId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['farmer-orders'] });
      // Also update Redux state for real-time sync
      dispatch(updateOrderStatusAction({ orderId: variables.orderId, status: variables.status }));
      Alert.alert('Success', 'Order status updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update order status');
    },
  });

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    const statusConfig = STATUS_CONFIG[newStatus];
    Alert.alert(
      'Update Order Status',
      `Change order status to "${statusConfig.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateStatusMutation.mutate({ orderId, status: newStatus }),
        },
      ]
    );
  };

  const formatCurrency = (value: number): string => {
    return `₦${Number(value || 0).toLocaleString()}`;
  };

  // Helper to convert relative image URLs to full URLs
  const getImageUrl = (imageUrl?: string | null): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${cleanPath}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  
  // iOS-style section label
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <Text style={[styles.iosSectionLabel, { color: colors.textSecondary }]}>
      {typeof children === 'string' ? children.toUpperCase() : String(children).toUpperCase()}
    </Text>
  );

  const handleShareOrder = async () => {
    setShowMenu(false);
    try {
      await Share.share({
        title: `Order #${order?.orderNumber}`,
        message: `Order #${order?.orderNumber}\nStatus: ${order?.status}\nTotal: ₦${order?.total?.toLocaleString()}\nCustomer: ${order?.buyer?.fullName || 'Customer'}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContactSupport = () => {
    setShowMenu(false);
    Linking.openURL('mailto:support@handwork.ng?subject=Order%20Issue%20-%20' + (order?.orderNumber || orderId));
  };

  const handleReportIssue = () => {
    setShowMenu(false);
    Alert.alert(
      'Report Issue',
      'What issue would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Wrong Items', 
          onPress: () => Alert.alert('Issue Reported', 'Our support team will contact you shortly.') 
        },
        { 
          text: 'Customer Not Responding', 
          onPress: () => Alert.alert('Issue Reported', 'Our support team will contact you shortly.') 
        },
        { 
          text: 'Other', 
          onPress: () => handleContactSupport() 
        },
      ]
    );
  };

  const handlePrintOrder = async () => {
    setShowMenu(false);
    
    if (!order) return;
    
    const orderDate = order.createdAt 
      ? new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';
    
    // Generate HTML for the order receipt
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Order #${order.orderNumber || order.id?.slice(-8)}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #16A34A;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #16A34A;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            color: #666;
            margin: 5px 0 0;
          }
          .order-info {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .order-info h2 {
            margin: 0 0 10px;
            font-size: 16px;
            color: #16A34A;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .info-label {
            color: #666;
          }
          .items-section {
            margin-bottom: 20px;
          }
          .items-section h2 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #16A34A;
          }
          .item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .item-details {
            flex: 1;
          }
          .item-name {
            font-weight: 600;
          }
          .item-quantity {
            color: #666;
            font-size: 14px;
          }
          .item-price {
            font-weight: 600;
            color: #16A34A;
          }
          .totals {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .total-row.final {
            font-weight: 700;
            font-size: 18px;
            color: #16A34A;
            border-top: 2px solid #16A34A;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background: ${STATUS_CONFIG[order.status as OrderStatus]?.bgColor || '#f0f0f0'};
            color: ${STATUS_CONFIG[order.status as OrderStatus]?.color || '#666'};
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌿 Handwork</h1>
          <p>Order Receipt</p>
        </div>
        
        <div class="order-info">
          <h2>Order Details</h2>
          <div class="info-row">
            <span class="info-label">Order Number:</span>
            <span>#${order.orderNumber || order.id?.slice(-8)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span>${orderDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="status">${STATUS_CONFIG[order.status as OrderStatus]?.label || order.status}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Customer:</span>
            <span>${order.buyerName || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Delivery Address:</span>
            <span>${order.deliveryAddress || 'N/A'}</span>
          </div>
        </div>
        
        <div class="items-section">
          <h2>Items</h2>
          ${order.items?.map((item: { name?: string; title?: string; quantity?: number; price?: number }) => `
            <div class="item">
              <div class="item-details">
                <div class="item-name">${item.name || item.title || 'Product'}</div>
                <div class="item-quantity">Qty: ${item.quantity} × ${formatCurrency(item.price || 0)}</div>
              </div>
              <div class="item-price">${formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
            </div>
          `).join('') || '<p>No items</p>'}
        </div>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${formatCurrency(order.subtotal || order.total || 0)}</span>
          </div>
          <div class="total-row">
            <span>Delivery Fee</span>
            <span>${formatCurrency(order.deliveryFee || 0)}</span>
          </div>
          ${order.discount ? `
            <div class="total-row">
              <span>Discount</span>
              <span>-${formatCurrency(order.discount)}</span>
            </div>
          ` : ''}
          <div class="total-row final">
            <span>Total</span>
            <span>${formatCurrency(order.total || 0)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your order!</p>
          <p>Handwork - Fresh Farm Produce</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;
    
    try {
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Order #${order.orderNumber || order.id?.slice(-8)}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error) {
      console.error('Error printing order:', error);
      Alert.alert('Error', 'Failed to generate order receipt');
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      created: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready_for_pickup',
      ready_for_pickup: null, // Rider assignment is handled separately
      rider_assigned: null,
      picked_up: null,
      in_transit: null,
      delivered: null,
      cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.centered, { flex: 1 }]}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>Failed to load order</Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>Please try again later</Text>
        </View>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.pending;
  const nextStatus = getNextStatus(order.status as OrderStatus);
  const farmerEarnings = calculateFarmerEarnings(order.subtotal || 0);

  // Get current status index for timeline
  const currentStatusIndex = STATUS_FLOW.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === 'cancelled';

  // Time since order
  const getTimeSinceOrder = (): string => {
    if (!order.createdAt) return '';
    const now = new Date();
    const orderDate = new Date(order.createdAt);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* iOS-style Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iosBackButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Order</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>#{order.orderNumber || orderId.slice(-6)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.iosMoreButton}
          onPress={() => setShowMenu(true)}
        >
          <Ionicons name="ellipsis-horizontal-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View 
            style={[styles.menuContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF', top: insets.top + 60, right: 16 }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <TouchableOpacity style={styles.menuItem} onPress={handleShareOrder} activeOpacity={0.6}>
              <Ionicons name="share-outline" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Share Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handlePrintOrder} activeOpacity={0.6}>
              <Ionicons name="print-outline" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Print Order</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
            <TouchableOpacity style={styles.menuItem} onPress={handleReportIssue} activeOpacity={0.6}>
              <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
              <Text style={[styles.menuItemText, { color: COLORS.warning }]}>Report Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleContactSupport} activeOpacity={0.6}>
              <Ionicons name="help-circle-outline" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        {/* iOS-style Status Card */}
        <View style={[styles.iosStatusCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.iosStatusHeader}>
            <View style={[styles.iosStatusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
              <Text style={[styles.iosStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
            <Text style={[styles.iosStatusTime, { color: colors.textSecondary }]}>{getTimeSinceOrder()}</Text>
          </View>
          
          {/* iOS Progress Indicator */}
          {!isCancelled && (
            <View style={styles.iosProgressContainer}>
              <View style={[styles.iosProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                <View 
                  style={[
                    styles.iosProgressFill, 
                    { 
                      backgroundColor: statusConfig.color,
                      width: `${Math.min(((currentStatusIndex + 1) / STATUS_FLOW.length) * 100, 100)}%`
                    }
                  ]} 
                />
              </View>
              <View style={styles.iosProgressLabels}>
                <Text style={[styles.iosProgressLabel, { color: colors.textSecondary }]}>Placed</Text>
                <Text style={[styles.iosProgressLabel, { color: colors.textSecondary }]}>Delivered</Text>
              </View>
            </View>
          )}
        </View>

        {/* iOS-style Action Buttons */}
        {(nextStatus || order.status === 'pending') && order.status !== 'cancelled' && order.status !== 'delivered' && (
          <View style={[styles.iosActionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.iosActionButtonsContainer}>
              {nextStatus && (
                <TouchableOpacity
                  style={[styles.iosPrimaryActionButton, { backgroundColor: STATUS_CONFIG[nextStatus].color }]}
                  onPress={() => handleUpdateStatus(nextStatus)}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.iosPrimaryActionButtonText}>
                      Mark as {STATUS_CONFIG[nextStatus].label}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {order.status === 'pending' && (
                <TouchableOpacity
                  style={styles.iosSecondaryActionButton}
                  onPress={() => handleUpdateStatus('cancelled')}
                  disabled={updateStatusMutation.isPending}
                >
                  <Text style={styles.iosSecondaryActionButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* iOS-style Earnings Card */}
        <SectionLabel>{order.status === 'delivered' ? 'Earnings' : 'Expected Earnings'}</SectionLabel>
        <View style={[styles.iosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.iosEarningsRow}>
            <View style={styles.iosEarningsContent}>
              <Text style={[styles.iosEarningsLabel, { color: colors.textSecondary }]}>Your Earnings</Text>
              <Text style={[styles.iosEarningsAmount, { color: '#34C759' }]}>₦{farmerEarnings.toLocaleString()}</Text>
            </View>
          </View>
          <View style={[styles.iosDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C6C6C8' }]} />
          <View style={styles.iosDetailRow}>
            <Text style={[styles.iosDetailLabel, { color: colors.textSecondary }]}>Product Total</Text>
            <Text style={[styles.iosDetailValue, { color: colors.text }]}>{formatCurrency(order.subtotal)}</Text>
          </View>
          <View style={styles.iosDetailRow}>
            <Text style={[styles.iosDetailLabel, { color: colors.textSecondary }]}>Platform Fee (10%)</Text>
            <Text style={[styles.iosDetailValue, { color: '#FF3B30' }]}>-{formatCurrency(order.subtotal * 0.1)}</Text>
          </View>
        </View>

        {/* iOS-style Customer Info */}
        <SectionLabel>Customer</SectionLabel>
        <View style={[styles.iosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <TouchableOpacity 
            style={styles.iosContactRow}
            onPress={() => order.buyer?.id && navigation.navigate('CustomerDetail', {
              customerId: order.buyer.id,
              customerName: order.buyer.name,
              customerPhone: order.buyer.phone,
              customerAvatar: order.buyer.avatar,
            })}
            disabled={!order.buyer?.id}
          >
            <View style={[styles.iosAvatar, { backgroundColor: '#007AFF' }]}>
              <Text style={styles.iosAvatarText}>
                {(order.buyer?.name || 'C')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.iosContactInfo}>
              <Text style={[styles.iosContactName, { color: colors.text }]}>{order.buyer?.name || 'Customer'}</Text>
              <Text style={[styles.iosContactDetail, { color: colors.textSecondary }]}>{order.buyer?.phone || 'No phone'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'} />
          </TouchableOpacity>
          {order.buyer?.id && (
            <>
              <View style={[styles.iosDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C6C6C8', marginLeft: 70 }]} />
              <View style={styles.iosActionRow}>
                <TouchableOpacity
                  style={styles.iosActionButton}
                  onPress={() => navigation.navigate('BuyerChat', {
                    buyerId: order.buyer.id,
                    buyerName: order.buyer.name || 'Buyer',
                    orderId: order.id,
                  })}
                >
                  <View style={[styles.iosActionIcon, { backgroundColor: '#007AFF15' }]}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                        fill="#007AFF"
                      />
                      <Circle cx="8" cy="10" r="1.5" fill="white" />
                      <Circle cx="12" cy="10" r="1.5" fill="white" />
                      <Circle cx="16" cy="10" r="1.5" fill="white" />
                    </Svg>
                  </View>
                  <Text style={[styles.iosActionLabel, { color: '#007AFF' }]}>Message</Text>
                </TouchableOpacity>
                {order.buyer?.phone && (
                  <TouchableOpacity
                    style={styles.iosActionButton}
                    onPress={() => Linking.openURL(`tel:${order.buyer.phone}`)}
                  >
                    <View style={[styles.iosActionIcon, { backgroundColor: '#34C75915' }]}>
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20.01 15.38C18.78 15.38 17.59 15.18 16.48 14.82C16.13 14.7 15.74 14.79 15.47 15.06L13.9 17.03C11.07 15.68 8.42 13.13 7.01 10.2L8.96 8.54C9.23 8.26 9.31 7.87 9.2 7.52C8.83 6.41 8.64 5.22 8.64 3.99C8.64 3.45 8.19 3 7.65 3H4.19C3.65 3 3 3.24 3 3.99C3 13.28 10.73 21 20.01 21C20.72 21 21 20.37 21 19.82V16.37C21 15.83 20.55 15.38 20.01 15.38Z"
                          fill="#34C759"
                        />
                      </Svg>
                    </View>
                    <Text style={[styles.iosActionLabel, { color: '#34C759' }]}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>

        {/* Rider Info - Show when rider is assigned */}
        {order.assignedRider && (
          <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bicycle-outline" size={22} color="#6366F1" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Rider</Text>
              <View style={[styles.statusChip, { backgroundColor: '#E0E7FF' }]}>
                <Text style={[styles.statusChipText, { color: '#6366F1' }]}>Assigned</Text>
              </View>
            </View>
            <View style={styles.customerCard}>
              <View style={[styles.customerAvatar, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="bicycle" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {order.assignedRider.user?.name || order.assignedRider.user?.fullName || order.assignedRider.name || 'Rider'}
                </Text>
                <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
                  {order.assignedRider.user?.phone || order.assignedRider.phone || 'No phone'}
                </Text>
              </View>
            </View>
            {(order.assignedRider.user?.phone || order.assignedRider.phone) && (
              <View style={styles.contactButtonsRow}>
                <TouchableOpacity
                  style={[styles.contactButton, { backgroundColor: '#6366F1' }]}
                  onPress={() => Linking.openURL(`tel:${order.assignedRider.user?.phone || order.assignedRider.phone}`)}
                >
                  <Ionicons name="call-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.contactButtonText}>Call Rider</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Live Rider Tracking Map - Show when rider is assigned and order is in transit */}
        {order.assignedRider && ['rider_assigned', 'picked_up', 'in_transit'].includes(order.status) && order.deliveryAddress?.lat && (
          <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={22} color="#2196F3" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Tracking</Text>
              <View style={[styles.statusChip, { backgroundColor: '#E3F2FD' }]}>
                <View style={styles.liveDot} />
                <Text style={[styles.statusChipText, { color: '#2196F3' }]}>Live</Text>
              </View>
            </View>
            <View style={styles.riderMapContainer}>
              <ExpoMapView
                pickupLocation={{
                  latitude: order.pickupPoint?.lat || order.deliveryAddress.lat,
                  longitude: order.pickupPoint?.lng || order.deliveryAddress.lng,
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
                pickupAddress="Your Farm"
                deliveryAddress={order.deliveryAddress?.address || 'Delivery Address'}
                height={180}
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
                  <Text style={styles.trackRiderText}>Open in Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* iOS-style Delivery Address */}
        <SectionLabel>Delivery Address</SectionLabel>
        <View style={[styles.iosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.iosAddressRow}>
            <View style={[styles.iosAddressIcon, { backgroundColor: '#FF3B3015' }]}>
              <Ionicons name="location" size={20} color="#FF3B30" />
            </View>
            <View style={styles.iosAddressContent}>
              <Text style={[styles.iosAddressText, { color: colors.text }]}>
                {typeof order.deliveryAddress === 'object' && order.deliveryAddress
                  ? (order.deliveryAddress as any).address || 'N/A'
                  : order.deliveryAddress || 'N/A'}
              </Text>
              {order.deliveryAddress?.city && (
                <Text style={[styles.iosAddressSubtext, { color: colors.textSecondary }]}>
                  {order.deliveryAddress.city}, {order.deliveryAddress.state}
                </Text>
              )}
            </View>
          </View>
          {order.deliveryAddress?.instructions && (
            <>
              <View style={[styles.iosDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#C6C6C8', marginLeft: 58 }]} />
              <View style={styles.iosNoteRow}>
                <Ionicons name="document-text" size={16} color="#FF9500" />
                <Text style={[styles.iosNoteText, { color: colors.textSecondary }]}>
                  {order.deliveryAddress.instructions}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* iOS-style Order Items */}
        <SectionLabel>Items ({order.itemCount || order.items?.length || 0})</SectionLabel>
        <View style={[styles.iosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {order.items?.map((item: any, index: number) => {
            // Get the first valid image from various possible fields, or fallback to fetched product images
            const rawImageUrl = item.productImage || item.image || (item.images && item.images[0]) || productImages[item.productId] || null;
            const imageUrl = getImageUrl(rawImageUrl);
            
            return (
            <View key={index} style={[styles.itemRow, index > 0 && styles.itemRowBorder, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : COLORS.border }]}>
              <View style={[styles.itemImageContainer, { backgroundColor: isDark ? 'rgba(76,175,80,0.15)' : 'rgba(76,175,80,0.08)' }]}>
                {imageUrl ? (
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  getProductIllustration(item.title || item.name, 36)
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{item.title || item.name}</Text>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemQuantity, { color: COLORS.primary }]}>×{item.quantity}</Text>
                  <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>{formatCurrency(item.price)}/{item.unit || 'unit'}</Text>
                </View>
              </View>
              <Text style={[styles.itemSubtotal, { color: colors.text }]}>{formatCurrency(item.subtotal)}</Text>
            </View>
            );
          })}
        </View>

        {/* iOS-style Payment Summary */}
        <SectionLabel>Order Summary</SectionLabel>
        <View style={[styles.iosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(order.deliveryFee)}</Text>
            </View>
            {order.serviceFee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service Fee</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(order.serviceFee)}</Text>
              </View>
            )}
            {order.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>-{formatCurrency(order.discount)}</Text>
              </View>
            )}
          </View>
          <View style={[styles.totalContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: COLORS.primary }]}>{formatCurrency(order.total)}</Text>
          </View>
          <View style={[styles.paymentStatusContainer, { backgroundColor: order.paymentStatus === 'paid' ? '#DCFCE7' : '#FEF3C7' }]}>
            <Ionicons 
              name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'time-outline'} 
              size={18} 
              color={order.paymentStatus === 'paid' ? '#16A34A' : '#F59E0B'} 
            />
            <Text style={[styles.paymentStatusText, { color: order.paymentStatus === 'paid' ? '#16A34A' : '#F59E0B' }]}>
              {order.paymentStatus === 'paid' ? 'Payment Received' : 'Payment Pending'}
            </Text>
          </View>
        </View>

        {/* iOS-style Order Timeline */}
        <SectionLabel>Activity</SectionLabel>
        <View style={[styles.iosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.iosTimelineContainer}>
            <View style={styles.iosTimelineEvent}>
              <View style={[styles.iosTimelineDot, { backgroundColor: '#007AFF' }]} />
              <View style={[styles.iosTimelineLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]} />
              <View style={styles.iosTimelineContent}>
                <Text style={[styles.iosTimelineTitle, { color: colors.text }]}>Order Placed</Text>
                <Text style={[styles.iosTimelineTime, { color: colors.textSecondary }]}>
                  {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
                </Text>
              </View>
            </View>
            {order.confirmedAt && (
              <View style={styles.iosTimelineEvent}>
                <View style={[styles.iosTimelineDot, { backgroundColor: '#5856D6' }]} />
                <View style={[styles.iosTimelineLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]} />
                <View style={styles.iosTimelineContent}>
                  <Text style={[styles.iosTimelineTitle, { color: colors.text }]}>Confirmed</Text>
                  <Text style={[styles.iosTimelineTime, { color: colors.textSecondary }]}>
                    {formatDate(order.confirmedAt)}
                  </Text>
                </View>
              </View>
            )}
            {order.pickedUpAt && (
              <View style={styles.iosTimelineEvent}>
                <View style={[styles.iosTimelineDot, { backgroundColor: '#FF9500' }]} />
                <View style={[styles.iosTimelineLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]} />
                <View style={styles.iosTimelineContent}>
                  <Text style={[styles.iosTimelineTitle, { color: colors.text }]}>Picked Up</Text>
                  <Text style={[styles.iosTimelineTime, { color: colors.textSecondary }]}>
                    {formatDate(order.pickedUpAt)}
                  </Text>
                </View>
              </View>
            )}
            {order.deliveredAt && (
              <View style={styles.iosTimelineEvent}>
                <View style={[styles.iosTimelineDot, { backgroundColor: '#34C759' }]} />
                <View style={[styles.iosTimelineLine, { backgroundColor: 'transparent' }]} />
                <View style={styles.iosTimelineContent}>
                  <Text style={[styles.iosTimelineTitle, { color: colors.text }]}>Delivered</Text>
                  <Text style={[styles.iosTimelineTime, { color: colors.textSecondary }]}>
                    {formatDate(order.deliveredAt)}
                  </Text>
                </View>
              </View>
            )}
            {order.cancelledAt && (
              <View style={styles.iosTimelineEvent}>
                <View style={[styles.iosTimelineDot, { backgroundColor: '#FF3B30' }]} />
                <View style={[styles.iosTimelineLine, { backgroundColor: 'transparent' }]} />
                <View style={styles.iosTimelineContent}>
                  <Text style={[styles.iosTimelineTitle, { color: colors.text }]}>Cancelled</Text>
                  <Text style={[styles.iosTimelineTime, { color: colors.textSecondary }]}>
                    {formatDate(order.cancelledAt)}
                  </Text>
                  {order.cancellationReason && (
                    <Text style={[styles.iosTimelineNote, { color: '#FF3B30' }]}>
                      {order.cancellationReason}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: SPACING.xxl + insets.bottom }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    minHeight: 44,
  },
  
  // iOS-style Back Button
  iosBackButton: {
    padding: 8,
  },
  iosMoreButton: {
    padding: 8,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  errorSubtext: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  
  // iOS Section Label
  iosSectionLabel: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    letterSpacing: -0.08,
    marginBottom: 8,
    marginLeft: 0,
    marginTop: 24,
  },
  
  // iOS Card
  iosCard: {
    borderRadius: 10,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  
  // iOS Status Card
  iosStatusCard: {
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
  },
  iosStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iosStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  iosStatusText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  iosStatusTime: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  
  // iOS Progress Bar
  iosProgressContainer: {
    marginTop: 16,
  },
  iosProgressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  iosProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  iosProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  iosProgressLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  
  // iOS Divider
  iosDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  
  // iOS Earnings
  iosEarningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iosEarningsIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosEarningsContent: {
    marginLeft: 12,
    flex: 1,
  },
  iosEarningsLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  iosEarningsAmount: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: 0.35,
  },
  iosDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iosDetailLabel: {
    fontSize: 17,
    fontFamily: FONTS.regular,
  },
  iosDetailValue: {
    fontSize: 17,
    fontFamily: FONTS.regular,
  },
  
  // iOS Contact/Customer Row
  iosContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iosAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosAvatarText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  iosContactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  iosContactName: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  iosContactDetail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#8E8E93',
    marginTop: 1,
  },
  
  // iOS Action Buttons Row
  iosActionRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 24,
  },
  iosActionButton: {
    alignItems: 'center',
  },
  iosActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iosActionLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  
  // iOS Address
  iosAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iosAddressIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosAddressContent: {
    marginLeft: 12,
    flex: 1,
  },
  iosAddressText: {
    fontSize: 17,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  iosAddressSubtext: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#8E8E93',
    marginTop: 2,
  },
  iosNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingLeft: 60,
    gap: 8,
  },
  iosNoteText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    flex: 1,
  },
  
  // iOS Timeline
  iosTimelineContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iosTimelineEvent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  iosTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  iosTimelineLine: {
    position: 'absolute',
    left: 4,
    top: 20,
    width: 2,
    height: 36,
    borderRadius: 1,
  },
  iosTimelineContent: {
    marginLeft: 14,
    flex: 1,
    paddingBottom: 16,
  },
  iosTimelineTitle: {
    fontSize: 17,
    fontFamily: FONTS.regular,
  },
  iosTimelineTime: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#8E8E93',
    marginTop: 2,
  },
  iosTimelineNote: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Hero Card (legacy)
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  heroStatus: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  heroTime: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    opacity: 0.8,
    marginTop: 2,
  },
  quickTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineDotCurrent: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  timelineLine: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  
  // Earnings Card
  earningsCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsTextContainer: {
    marginLeft: SPACING.md,
  },
  earningsLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#16A34A',
  },
  earningsBreakdown: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
  },
  earningsBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  earningsBreakdownLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  earningsBreakdownValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  statusChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  
  // Customer Card
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  customerInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  customerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  customerPhone: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  
  // Contact Buttons
  contactButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },

  // Rider Tracking Map
  riderMapContainer: {
    height: 220,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    position: 'relative',
  },
  trackRiderButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
    ...SHADOWS.medium,
  },
  trackRiderText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2196F3',
    marginRight: 4,
  },
  
  // Address
  addressCard: {
    marginBottom: SPACING.sm,
  },
  addressText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    lineHeight: 22,
  },
  addressSubtext: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  instructionsText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    flex: 1,
    fontStyle: 'italic',
  },
  
  // Item Count Badge
  itemCountBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  itemCountText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  
  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    flexShrink: 0,
  },
  
  // Summary
  summaryContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 17,
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: 17,
    fontFamily: FONTS.regular,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
  },
  paymentStatusText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  
  // iOS Action Card & Buttons
  iosActionCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    ...SHADOWS.small,
  },
  iosActionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  iosPrimaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  iosPrimaryActionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  iosSecondaryActionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FF3B3015',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iosSecondaryActionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FF3B30',
  },
  
  // Action Buttons (legacy)
  
  // Timeline
  timelineContainer: {
    paddingLeft: SPACING.xs,
  },
  timelineEvent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  timelineEventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineEventContent: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  timelineEventTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  timelineEventTime: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  timelineCancelReason: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Legacy styles kept for compatibility
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  itemDetails: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  orderDate: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    minWidth: 200,
    borderRadius: 14,
    paddingVertical: 8,
    ...SHADOWS.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 17,
    fontFamily: FONTS.regular,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
});
