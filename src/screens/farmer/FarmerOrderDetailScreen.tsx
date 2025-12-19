import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FarmerStackParamList, OrderStatus } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { orderService } from '../../services/orderService';
import { useFarmerSocket } from '../../hooks/useFarmerSocket';
import { useAppDispatch } from '../../store';
import { updateOrderStatus as updateOrderStatusAction } from '../../store/slices/farmerSlice';
import { getProductIllustration } from '../../assets/illustrations/products';
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

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerOrderDetail'>;

const STATUS_CONFIG: Record<OrderStatus, { color: string; bgColor: string; label: string; Illustration: React.FC<{ width?: number; height?: number; color?: string }> }> = {
  pending: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Pending', Illustration: PendingIllustration },
  created: { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Processing', Illustration: PendingIllustration },
  confirmed: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'Confirmed', Illustration: ConfirmedIllustration },
  preparing: { color: '#8B5CF6', bgColor: '#EDE9FE', label: 'Preparing', Illustration: PreparingIllustration },
  ready_for_pickup: { color: '#10B981', bgColor: '#D1FAE5', label: 'Ready for Pickup', Illustration: ReadyIllustration },
  rider_assigned: { color: '#6366F1', bgColor: '#E0E7FF', label: 'Rider Assigned', Illustration: ConfirmedIllustration },
  picked_up: { color: '#14B8A6', bgColor: '#CCFBF1', label: 'Picked Up', Illustration: ReadyIllustration },
  in_transit: { color: '#0EA5E9', bgColor: '#E0F2FE', label: 'In Transit', Illustration: ReadyIllustration },
  delivered: { color: '#22C55E', bgColor: '#DCFCE7', label: 'Delivered', Illustration: DeliveredIllustration },
  cancelled: { color: '#EF4444', bgColor: '#FEE2E2', label: 'Cancelled', Illustration: CancelledIllustration },
};

export default function FarmerOrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  // Subscribe to real-time order updates
  const { subscribeToOrder, unsubscribeFromOrder, isConnected } = useFarmerSocket();
  
  useEffect(() => {
    if (isConnected && orderId) {
      subscribeToOrder(orderId);
      return () => unsubscribeFromOrder(orderId);
    }
  }, [isConnected, orderId, subscribeToOrder, unsubscribeFromOrder]);

  const { data: order, isLoading, error } = useQuery<any>({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
  });

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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order #{order.orderNumber || orderId.slice(-6)}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <statusConfig.Illustration width={22} height={22} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
              {order.createdAt ? formatDate(order.createdAt) : 'N/A'}
            </Text>
          </View>

          {/* Action Buttons */}
          {nextStatus && order.status !== 'cancelled' && order.status !== 'delivered' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
              onPress={() => handleUpdateStatus(nextStatus)}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    Mark as {STATUS_CONFIG[nextStatus].label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {order.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleUpdateStatus('cancelled')}
              disabled={updateStatusMutation.isPending}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
              <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Info */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Information</Text>
          <View style={styles.infoRow}>
            <CustomerIllustration width={22} height={22} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>{order.buyer?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <PhoneIllustration width={22} height={22} color="#2196F3" />
            <Text style={[styles.infoText, { color: colors.text }]}>{order.buyer?.phone || 'N/A'}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
          <View style={styles.infoRow}>
            <LocationIllustration width={22} height={22} color="#EF5350" />
            <Text style={[styles.infoText, { color: colors.text, flex: 1 }]}>
              {order.deliveryAddress?.address || 'N/A'}
            </Text>
          </View>
          {order.deliveryAddress?.city && (
            <View style={styles.infoRow}>
              <BuildingIllustration width={22} height={22} color="#5C6BC0" />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {order.deliveryAddress.city}, {order.deliveryAddress.state}
              </Text>
            </View>
          )}
          {order.deliveryAddress?.instructions && (
            <View style={styles.infoRow}>
              <NotesIllustration width={22} height={22} color="#FF9800" />
              <Text style={[styles.infoText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                "{order.deliveryAddress.instructions}"
              </Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Items ({order.itemCount || order.items?.length || 0})</Text>
          {order.items?.map((item: any, index: number) => (
            <View key={index} style={[styles.itemRow, index > 0 && styles.itemRowBorder, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]}>
              <View style={styles.itemImageContainer}>
                {getProductIllustration(item.title || item.name, 40)}
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{item.title || item.name}</Text>
                <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
                  {item.quantity} {item.unit || 'units'} × {formatCurrency(item.price)}
                </Text>
              </View>
              <Text style={[styles.itemSubtotal, { color: colors.text }]}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>
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
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: COLORS.primary }]}>{formatCurrency(order.total)}</Text>
          </View>
          <View style={styles.paymentStatusRow}>
            <Ionicons 
              name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'time-outline'} 
              size={18} 
              color={order.paymentStatus === 'paid' ? COLORS.success : COLORS.warning} 
            />
            <Text style={[styles.paymentStatusText, { color: order.paymentStatus === 'paid' ? COLORS.success : COLORS.warning }]}>
              {order.paymentStatus === 'paid' ? 'Payment Received' : 'Payment Pending'}
            </Text>
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
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
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  itemRowBorder: {
    borderTopWidth: 1,
  },
  itemImageContainer: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  itemDetails: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  itemSubtotal: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  totalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  paymentStatusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
