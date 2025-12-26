import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order, OrderStatus } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  showTrackingButton?: boolean;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: COLORS.orderPending,
  created: COLORS.orderPending,
  confirmed: COLORS.orderConfirmed,
  preparing: COLORS.orderConfirmed,
  ready_for_pickup: COLORS.orderConfirmed,
  rider_assigned: COLORS.orderRiderAssigned,
  picked_up: COLORS.orderPickedUp,
  in_transit: COLORS.orderInTransit,
  delivered: COLORS.orderDelivered,
  cancelled: COLORS.orderCancelled,
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  created: 'Processing',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  rider_assigned: 'Rider Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function OrderCard({ order, onPress, showTrackingButton = true }: OrderCardProps) {
  const { colors } = useTheme();
  
  // Early return if order is invalid
  if (!order || !order.id) {
    return null;
  }
  
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.card },
    orderId: { color: colors.text },
    date: { color: colors.textSecondary },
    divider: { backgroundColor: colors.border },
    itemsLabel: { color: colors.text },
    itemsList: { color: colors.textSecondary },
    totalLabel: { color: colors.textSecondary },
    totalAmount: { color: colors.text },
    riderLabel: { color: colors.textSecondary },
    riderName: { color: colors.text },
    eta: { color: colors.textSecondary },
  }), [colors]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity
      style={[styles.container, dynamicStyles.container]}
      onPress={() => {
        triggerHaptic();
        onPress(order);
      }}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.id.slice(-6)}, status ${STATUS_LABELS[order.status]}`}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.orderId, dynamicStyles.orderId]}>Order #{order.id.slice(-6)}</Text>
          <Text style={[styles.date, dynamicStyles.date]}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[order.status]}</Text>
        </View>
      </View>

      <View style={[styles.divider, dynamicStyles.divider]} />

      <View style={styles.body}>
        <Text style={[styles.itemsLabel, dynamicStyles.itemsLabel]}>
          {order.items.length} item{order.items.length > 1 ? 's' : ''}
        </Text>
        <Text style={[styles.itemsList, dynamicStyles.itemsList]} numberOfLines={2}>
          {(order.items || []).map((item: any) => `${item.quantity}x ${item.title || item.productName || 'Item'}`).join(', ')}
        </Text>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={[styles.totalLabel, dynamicStyles.totalLabel]}>Total</Text>
          <Text style={[styles.totalAmount, dynamicStyles.totalAmount]}>₦{Number(order.total || 0).toLocaleString()}</Text>
        </View>
        {showTrackingButton && !['delivered', 'cancelled'].includes(order.status) && (
          <View style={styles.trackButton}>
            <Text style={styles.trackButtonText}>Track Order</Text>
          </View>
        )}
      </View>

      {order.assignedRiderName && !['delivered', 'cancelled'].includes(order.status) && (
        <View style={styles.riderInfo}>
          <Text style={[styles.riderLabel, dynamicStyles.riderLabel]}>Rider: </Text>
          <Text style={[styles.riderName, dynamicStyles.riderName]}>{order.assignedRiderName}</Text>
          {order.eta && (
            <Text style={[styles.eta, dynamicStyles.eta]}> • ETA: {order.eta} min</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  body: {
    marginBottom: SPACING.sm,
  },
  itemsLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  itemsList: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trackButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  trackButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  riderLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  riderName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  eta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
