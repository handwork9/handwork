import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState, OrderCard } from '../../components/common';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { withdrawalService } from '../../services/withdrawalService';
import { farmerAnalyticsService } from '../../services/farmerAnalyticsService';
import { Order, Product, FarmerStackParamList } from '../../types';
import { useAppSelector, useAppDispatch } from '../../store';
import { useFarmerSocket, useNewOrderNotifications } from '../../hooks/useFarmerSocket';
import { fetchDashboardStats, setEarnings } from '../../store/slices/farmerSlice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { dashboardStats, pendingOrdersCount, unreadOrdersCount } = useAppSelector((state) => state.farmer);
  
  // Initialize farmer socket for real-time updates
  const { isConnected, newOrderNotifications } = useFarmerSocket();
  
  // Listen for new order notifications
  useNewOrderNotifications((notification) => {
    // Optionally show a toast or alert for new orders
    console.log('New order received:', notification.orderId);
  });
  
  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: 'sunny' as const };
    if (hour < 17) return { text: 'Good Afternoon', icon: 'sunny' as const };
    return { text: 'Good Evening', icon: 'moon' as const };
  };
  const greeting = getGreeting();
  
  // Check if farmer needs activation
  const needsActivation = user?.role === 'farmer' && !user?.isActivated;

  // Fetch orders
  const { 
    data: ordersData, 
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: () => orderService.getOrders({
      page: 1,
      limit: 5,
    }),
  });

  // Fetch products
  const { 
    data: productsData, 
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['farmer-products'],
    queryFn: () => productService.getProducts({
      page: 1,
      limit: 10,
    }),
  });

  // Fetch earnings summary
  const {
    data: earningsData,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: ['farmer-earnings'],
    queryFn: () => withdrawalService.getEarningsSummary(),
  });

  // Fetch today's hourly sales for sparkline
  const { data: hourlySales, refetch: refetchHourlySales } = useQuery({
    queryKey: ['farmer-today-hourly'],
    queryFn: () => farmerAnalyticsService.getTodayHourlySales(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch peak hours
  const { data: peakHoursData, refetch: refetchPeakHours } = useQuery({
    queryKey: ['farmer-peak-hours'],
    queryFn: () => farmerAnalyticsService.getPeakHours(),
    staleTime: 30 * 60 * 1000, // 30 minutes cache
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchOrders(), refetchProducts(), refetchEarnings(), refetchHourlySales(), refetchPeakHours()]);
    setRefreshing(false);
  }, [refetchOrders, refetchProducts, refetchEarnings, refetchHourlySales, refetchPeakHours]);

  const orders = ordersData?.orders || [];
  const products = productsData?.products || [];
  
  // Calculate stats - use Redux for pending count as it gets real-time updates
  const pendingOrders = pendingOrdersCount || orders.filter((o: Order) => o.status === 'pending').length;
  const processingOrders = orders.filter((o: Order) => o.status === 'confirmed' || o.status === 'ready_for_pickup').length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p: Product) => p.stock < 10).length;

  // Update earnings in Redux when API data changes
  useEffect(() => {
    if (earningsData) {
      dispatch(setEarnings({
        todayEarnings: earningsData.todayEarnings ?? 0,
        thisWeekEarnings: earningsData.thisWeekEarnings ?? 0,
        thisMonthEarnings: earningsData.thisMonthEarnings ?? 0,
        totalEarnings: earningsData.totalEarnings ?? 0,
        pendingPayout: earningsData.pendingBalance ?? 0,
      }));
    }
  }, [earningsData, dispatch]);

  // Earnings from API
  const todayEarnings = earningsData?.todayEarnings ?? 0;
  const weekEarnings = earningsData?.thisWeekEarnings ?? 0;
  const monthEarnings = earningsData?.thisMonthEarnings ?? 0;

  const stats: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string }[] = [
    { icon: 'cube-outline', label: 'Pending Orders', value: pendingOrders, color: COLORS.warning },
    { icon: 'sync-outline', label: 'Processing', value: processingOrders, color: COLORS.info },
    { icon: 'leaf-outline', label: 'Products', value: totalProducts, color: COLORS.primary },
    { icon: 'alert-circle-outline', label: 'Low Stock', value: lowStockProducts, color: COLORS.error },
  ];

  if (ordersLoading || productsLoading || earningsLoading) {
    return <LoadingState />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.greetingRow}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting.text}!</Text>
          <Ionicons name={greeting.icon} size={24} color={greeting.icon === 'moon' ? '#9CA3AF' : COLORS.secondary} style={styles.greetingIcon} />
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Your Farm Dashboard</Text>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' }]}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={28} color={colors.text} />
            {unreadOrdersCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadOrdersCount > 9 ? '9+' : unreadOrdersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Activation Banner */}
        {needsActivation && (
          <TouchableOpacity
            style={styles.activationBanner}
            onPress={() => navigation.navigate('FarmerActivation')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activationGradient}
            >
              <View style={styles.activationContent}>
                <View style={styles.activationIconContainer}>
                  <Ionicons name="lock-closed" size={24} color={COLORS.white} />
                </View>
                <View style={styles.activationTextContainer}>
                  <Text style={styles.activationTitle}>Activate Your Account</Text>
                  <Text style={styles.activationSubtitle}>
                    Pay ₦25,000 one-time fee to start listing products
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Verified Seller Banner - Show if not premium */}
        {!user?.isPremium && !needsActivation && (
          <TouchableOpacity
            style={styles.verifiedBanner}
            onPress={() => navigation.navigate('FarmerSubscription')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#1DA1F2', '#0D8ECF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifiedGradient}
            >
              <View style={styles.verifiedContent}>
                <View style={styles.verifiedIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                </View>
                <View style={styles.verifiedTextContainer}>
                  <Text style={styles.verifiedTitle}>Become a Verified Seller</Text>
                  <Text style={styles.verifiedSubtitle}>
                    Get the blue badge • Boost visibility • Build trust
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Ionicons name={stat.icon} size={28} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>
                {formatNumber(stat.value)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Earnings Summary */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings</Text>
          </View>
          <View style={[styles.earningsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.earningItem}>
              <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>Today</Text>
              <Text style={styles.earningValue}>{formatCurrency(todayEarnings)}</Text>
            </View>
            <View style={[styles.earningDivider, { backgroundColor: isDark ? '#48484A' : COLORS.border }]} />
            <View style={styles.earningItem}>
              <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>This Week</Text>
              <Text style={styles.earningValue}>{formatCurrency(weekEarnings)}</Text>
            </View>
            <View style={[styles.earningDivider, { backgroundColor: isDark ? '#48484A' : COLORS.border }]} />
            <View style={styles.earningItem}>
              <Text style={[styles.earningLabel, { color: colors.textSecondary }]}>This Month</Text>
              <Text style={styles.earningValue}>{formatCurrency(monthEarnings)}</Text>
            </View>
          </View>
          
          {/* Today's Sales Sparkline */}
          {hourlySales && hourlySales.length > 0 && (
            <View style={[styles.sparklineCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <View style={styles.sparklineHeader}>
                <Text style={[styles.sparklineTitle, { color: colors.text }]}>Today's Sales Trend</Text>
                <View style={styles.sparklineLegend}>
                  <View style={styles.sparklineDot} />
                  <Text style={[styles.sparklineLegendText, { color: colors.textSecondary }]}>Hourly Revenue</Text>
                </View>
              </View>
              <View style={styles.sparklineContainer}>
                {(() => {
                  const maxVal = Math.max(...hourlySales.map((h: any) => h.revenue || 0), 1);
                  const chartHeight = 50;
                  return hourlySales.map((hourData: any, index: number) => {
                    const barHeight = Math.max(((hourData.revenue || 0) / maxVal) * chartHeight, 2);
                    const isCurrentHour = hourData.hour === new Date().getHours();
                    return (
                      <View key={index} style={styles.sparklineBarWrapper}>
                        <View
                          style={[
                            styles.sparklineBar,
                            { height: barHeight, backgroundColor: isCurrentHour ? COLORS.secondary : COLORS.primary },
                            isCurrentHour && styles.sparklineBarCurrent,
                          ]}
                        />
                        {index % 4 === 0 && (
                          <Text style={[styles.sparklineLabel, { color: colors.textSecondary }]}>
                            {hourData.hour}:00
                          </Text>
                        )}
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}
        </View>

        {/* Peak Hours Widget */}
        {peakHoursData && peakHoursData.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Peak Selling Hours</Text>
            </View>
            <View style={[styles.peakHoursCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Text style={[styles.peakHoursSubtitle, { color: colors.textSecondary }]}>
                Your busiest times for orders
              </Text>
              <View style={styles.peakHoursList}>
                {peakHoursData.slice(0, 3).map((peak: any, index: number) => {
                  const hour = peak.hour;
                  const period = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                  const medals = ['🥇', '🥈', '🥉'];
                  
                  return (
                    <View key={index} style={[styles.peakHourItem, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}>
                      <Text style={styles.peakHourMedal}>{medals[index]}</Text>
                      <View style={styles.peakHourInfo}>
                        <Text style={[styles.peakHourTime, { color: colors.text }]}>
                          {displayHour}:00 {period}
                        </Text>
                        <Text style={[styles.peakHourStats, { color: colors.textSecondary }]}>
                          {peak.orders} orders • {formatCurrency(peak.revenue)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('FarmerOrders')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {orders.length > 0 ? (
            orders.slice(0, 3).map((order: Order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => navigation.navigate('FarmerOrderDetail', { orderId: order.id })}
              />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No orders yet</Text>
            </View>
          )}
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Low Stock Alert</Text>
            </View>
            <View style={[styles.alertCard, { backgroundColor: isDark ? '#3D2E0A' : COLORS.warningLight, borderColor: COLORS.warning }]}>
              <Text style={[styles.alertText, { color: colors.text }]}>
                You have {lowStockProducts} product{lowStockProducts > 1 ? 's' : ''} running low on stock
              </Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={styles.alertButtonText}>Manage Inventory</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          </View>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
              onPress={() => navigation.navigate('Products')}
            >
              <Ionicons name="cube-outline" size={32} color={COLORS.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>My Products</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
              onPress={() => navigation.navigate('FarmerOrders')}
            >
              <Ionicons name="clipboard-outline" size={32} color={COLORS.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>All Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
              onPress={() => navigation.navigate('Analytics')}
            >
              <Ionicons name="bar-chart-outline" size={32} color={COLORS.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Messages FAB */}
      <TouchableOpacity
        style={styles.messagesFab}
        onPress={() => navigation.navigate('FarmerMessages')}
        activeOpacity={0.8}
      >
        <View style={styles.messagesFabInner}>
          <Ionicons name="chatbubbles" size={26} color="#FFFFFF" />
        </View>
        <View style={styles.fabBadge}>
          <Text style={styles.fabBadgeText}>3</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  fixedHeaderTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  greetingIcon: {
    marginLeft: SPACING.xs,
  },
  greeting: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  viewAll: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  earningsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  earningItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  earningValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  earningDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  alertCard: {
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  alertText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  alertButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  activationBanner: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  activationGradient: {
    padding: SPACING.md,
  },
  activationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  activationTextContainer: {
    flex: 1,
  },
  activationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
    marginBottom: 2,
  },
  activationSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  verifiedBanner: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  verifiedGradient: {
    padding: SPACING.md,
  },
  verifiedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  verifiedTextContainer: {
    flex: 1,
  },
  verifiedTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
    marginBottom: 2,
  },
  verifiedSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  messagesFab: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  messagesFabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  // Sparkline styles
  sparklineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  sparklineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sparklineTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  sparklineLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sparklineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  sparklineLegendText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    paddingTop: SPACING.xs,
  },
  sparklineBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  sparklineBar: {
    width: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    minHeight: 4,
  },
  sparklineBarCurrent: {
    backgroundColor: '#34C759',
  },
  sparklineLabel: {
    fontSize: 8,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  // Peak Hours styles
  peakHoursCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  peakHoursSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  peakHoursList: {
    gap: SPACING.sm,
  },
  peakHourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  peakHourMedal: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  peakHourInfo: {
    flex: 1,
  },
  peakHourTime: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  peakHourStats: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
