import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import { orderService } from '../../services/orderService';

type RouteParams = {
  DeliveryReceipt: {
    deliveryId: string;
    amount?: number;
    date?: string;
  };
};

interface DeliveryDetails {
  id: string;
  orderId: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  farmer: {
    name: string;
    phone?: string;
  };
  buyer: {
    name: string;
    phone?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  earnings: number;
  deliveryFee: number;
  tip?: number;
  distance?: number;
  duration?: number;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export default function DeliveryReceiptScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'DeliveryReceipt'>>();
  const { colors, isDark } = useTheme();
  const { deliveryId, amount, date } = route.params;

  const { data: delivery, isLoading, error } = useQuery({
    queryKey: ['delivery-details', deliveryId],
    queryFn: async (): Promise<DeliveryDetails> => {
      try {
        const result = await orderService.getOrderById(deliveryId);
        const order: any = (result as any)?.data || result;
        
        // Map order to delivery details format
        return {
          id: order.id,
          orderId: order.id?.slice(0, 8)?.toUpperCase() || deliveryId.slice(0, 8).toUpperCase(),
          status: order.status || 'DELIVERED',
          pickupAddress: order.pickupPoint?.address || order.pickupAddress || 'Farm Location',
          deliveryAddress: order.deliveryAddress?.address || order.deliveryLocation || 'Buyer Location',
          farmer: {
            name: order.farmer?.name || order.items?.[0]?.farmerName || 'Farmer',
            phone: order.farmer?.phone,
          },
          buyer: {
            name: order.buyer?.name || 'Customer',
            phone: order.buyer?.phone,
          },
          items: order.items?.map((item: any) => ({
            name: item.title || item.name || 'Product',
            quantity: item.quantity || 1,
            price: item.price,
          })) || [],
          earnings: Number(order.deliveryFee) || amount || 0,
          deliveryFee: Number(order.deliveryFee) || amount || 0,
          tip: Number(order.tip) || 0,
          distance: order.distance || 0,
          duration: order.deliveryDuration || 30,
          pickedUpAt: order.pickedUpAt,
          deliveredAt: order.deliveredAt || order.actualDeliveryTime,
          createdAt: order.createdAt || date || new Date().toISOString(),
        };
      } catch (err) {
        // Return fallback data if API fails
        return {
          id: deliveryId,
          orderId: deliveryId.slice(0, 8).toUpperCase(),
          status: 'DELIVERED',
          pickupAddress: 'Farm Location',
          deliveryAddress: 'Buyer Location',
          farmer: { name: 'Farmer' },
          buyer: { name: 'Customer' },
          items: [],
          earnings: amount || 0,
          deliveryFee: amount || 0,
          distance: 0,
          duration: 30,
          createdAt: date || new Date().toISOString(),
        };
      }
    },
  });

  const handleShare = async () => {
    if (!delivery) return;
    
    try {
      const message = `
🧾 Delivery Receipt

Order ID: #${delivery.orderId}
Date: ${formatDate(delivery.createdAt)}
${delivery.deliveredAt ? `Delivered: ${formatTime(delivery.deliveredAt)}` : ''}

From: ${delivery.pickupAddress}
To: ${delivery.deliveryAddress}

Earnings: ${formatCurrency(delivery.earnings)}
${delivery.tip ? `Tip: ${formatCurrency(delivery.tip)}` : ''}

Total: ${formatCurrency(delivery.earnings + (delivery.tip || 0))}

Delivered with Handwork 🚚
      `.trim();

      await Share.share({
        message,
        title: `Delivery Receipt #${delivery.orderId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const totalEarnings = (delivery?.earnings || 0) + (delivery?.tip || 0);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDark ? colors.card : COLORS.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Delivery Receipt</Text>
        <TouchableOpacity 
          style={[styles.shareButton, { backgroundColor: isDark ? colors.card : COLORS.surface }]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Badge */}
        <View style={styles.successBadge}>
          <LinearGradient
            colors={[COLORS.success, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.successGradient}
          >
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={32} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>Delivery Completed!</Text>
            <Text style={styles.successSubtitle}>
              {delivery?.deliveredAt ? formatTime(delivery.deliveredAt) : 'Successfully delivered'}
            </Text>
          </LinearGradient>
        </View>

        {/* Order Info Card */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <View style={styles.cardHeader}>
            <View style={styles.orderIdContainer}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.orderId, { color: colors.text }]}>#{delivery?.orderId}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Completed</Text>
            </View>
          </View>
          
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {delivery ? formatDate(delivery.createdAt) : ''}
            </Text>
          </View>
        </View>

        {/* Route Card */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Route Details</Text>
          
          <View style={styles.routeContainer}>
            {/* Pickup */}
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
              <View style={styles.routeInfo}>
                <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>Pickup</Text>
                <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={2}>
                  {delivery?.pickupAddress}
                </Text>
                <Text style={[styles.routePerson, { color: colors.textSecondary }]}>
                  <Ionicons name="person-outline" size={12} color={colors.textSecondary} /> {delivery?.farmer.name}
                </Text>
              </View>
            </View>
            
            {/* Route Line */}
            <View style={styles.routeLine}>
              <View style={[styles.routeLineDashed, { borderColor: isDark ? colors.border : COLORS.border }]} />
              {delivery?.distance ? (
                <View style={[styles.distanceBadge, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
                  <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                    {delivery.distance.toFixed(1)} km
                  </Text>
                </View>
              ) : null}
            </View>
            
            {/* Delivery */}
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.routeInfo}>
                <Text style={[styles.routeLabel, { color: colors.textSecondary }]}>Delivery</Text>
                <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={2}>
                  {delivery?.deliveryAddress}
                </Text>
                <Text style={[styles.routePerson, { color: colors.textSecondary }]}>
                  <Ionicons name="person-outline" size={12} color={colors.textSecondary} /> {delivery?.buyer.name}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Card */}
        {delivery?.items && delivery.items.length > 0 && (
          <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Items Delivered</Text>
            {delivery.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={[styles.itemIcon, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
                  <Ionicons name="cube-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                    Qty: {item.quantity}
                  </Text>
                </View>
                {item.price && (
                  <Text style={[styles.itemPrice, { color: colors.text }]}>
                    {formatCurrency(item.price)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Delivery Stats */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {delivery?.duration ? formatDuration(delivery.duration) : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.success}15` }]}>
                <Ionicons name="navigate-outline" size={20} color={COLORS.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {delivery?.distance ? `${delivery.distance.toFixed(1)} km` : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.warning}15` }]}>
                <Ionicons name="star-outline" size={20} color={COLORS.warning} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>5.0</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Earnings Card */}
        <View style={[styles.card, styles.earningsCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Earnings Breakdown</Text>
          
          <View style={styles.earningsRow}>
            <Text style={[styles.earningsLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
            <Text style={[styles.earningsValue, { color: colors.text }]}>
              {formatCurrency(delivery?.deliveryFee || 0)}
            </Text>
          </View>
          
          {delivery?.tip ? (
            <View style={styles.earningsRow}>
              <Text style={[styles.earningsLabel, { color: colors.textSecondary }]}>Tip</Text>
              <Text style={[styles.earningsValue, { color: COLORS.success }]}>
                +{formatCurrency(delivery.tip)}
              </Text>
            </View>
          ) : null}
          
          <View style={[styles.divider, { backgroundColor: isDark ? colors.border : COLORS.border }]} />
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Earned</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalEarnings)}</Text>
          </View>
        </View>

        {/* Timeline Card */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : COLORS.surface, marginBottom: insets.bottom + SPACING.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Timeline</Text>
          
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: COLORS.success }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>Order Accepted</Text>
                <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                  {delivery ? formatTime(delivery.createdAt) : '--'}
                </Text>
              </View>
            </View>
            
            {delivery?.pickedUpAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: COLORS.warning }]} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, { color: colors.text }]}>Picked Up</Text>
                  <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                    {formatTime(delivery.pickedUpAt)}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>Delivered</Text>
                <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                  {delivery?.deliveredAt ? formatTime(delivery.deliveredAt) : '--'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  successBadge: {
    marginBottom: SPACING.md,
  },
  successGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  successTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  orderId: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  statusBadge: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  routeContainer: {
    paddingLeft: SPACING.xs,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: SPACING.sm,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  routePerson: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  routeLine: {
    marginLeft: 5,
    paddingLeft: SPACING.sm + 6,
    paddingVertical: SPACING.sm,
    alignItems: 'flex-start',
  },
  routeLineDashed: {
    position: 'absolute',
    left: 5,
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  distanceBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  distanceText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  itemQuantity: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  itemPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  earningsCard: {
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  earningsLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  earningsValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: COLORS.success,
  },
  timeline: {
    paddingLeft: SPACING.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: SPACING.sm,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  timelineTime: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
});
