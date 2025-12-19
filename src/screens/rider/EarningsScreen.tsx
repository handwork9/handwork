import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState } from '../../components/common';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { riderService } from '../../services/orderService';

const { width } = Dimensions.get('window');

// Helper function to format date
const formatDeliveryDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }
};

interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalDeliveries: number;
  averagePerDelivery: number;
  pendingPayout: number;
  recentDeliveries: Array<{
    id: string;
    date: string;
    amount: number;
    distance: number;
    duration: number;
  }>;
  weeklyBreakdown: Array<{
    day: string;
    earnings: number;
  }>;
}

type TimeFilter = 'today' | 'week' | 'month' | 'all';

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [refreshing, setRefreshing] = useState(false);

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const { data: earnings, isLoading, refetch, error } = useQuery({
    queryKey: ['rider-earnings', timeFilter],
    queryFn: async (): Promise<EarningsData> => {
      const result = await riderService.getEarnings(timeFilter);
      console.log('[EarningsScreen] Raw API result:', JSON.stringify(result, null, 2));
      
      // The apiClient.get() returns response.data which is { success: true, data: {...} }
      // So we need to extract the nested data
      let data: any = result;
      
      // If wrapped in success/data structure, extract it
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        data = data.data;
      }
      
      console.log('[EarningsScreen] Extracted data:', JSON.stringify(data, null, 2));
      console.log('[EarningsScreen] weeklyBreakdown:', data?.weeklyBreakdown);
      console.log('[EarningsScreen] recentDeliveries:', data?.recentDeliveries);
      
      return data as EarningsData;
    },
  });

  // Log current earnings state
  console.log('[EarningsScreen] Current earnings:', earnings);
  console.log('[EarningsScreen] Has weeklyBreakdown:', !!earnings?.weeklyBreakdown);
  console.log('[EarningsScreen] Has recentDeliveries:', !!earnings?.recentDeliveries);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  const getMaxWeeklyEarning = () => {
    if (!earnings?.weeklyBreakdown) return 0;
    return Math.max(...earnings.weeklyBreakdown.map(d => d.earnings), 1);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const maxEarning = getMaxWeeklyEarning();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.headerTitleContainer}>
          <Animated.View style={[styles.headerTitleRow, { opacity: headerOpacity }]}>
            <View style={styles.headerIconBg}>
              <Ionicons name="stats-chart" size={18} color={COLORS.success} />
            </View>
            <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Earnings</Text>
          </Animated.View>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Hero Earnings Card */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={isDark ? ['#047857', '#10B981'] : [COLORS.success, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="stats-chart" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.heroLabel}>
              {timeFilter === 'today' ? "Today's" : 
               timeFilter === 'week' ? "This Week's" :
               timeFilter === 'month' ? "This Month's" : "Total"} Earnings
            </Text>
            <Text style={styles.heroAmount}>
              {formatCurrency((timeFilter === 'today' ? earnings?.today :
                 timeFilter === 'week' ? earnings?.thisWeek :
                 timeFilter === 'month' ? earnings?.thisMonth :
                 (earnings?.today || 0) + (earnings?.thisWeek || 0) + (earnings?.thisMonth || 0)) || 0)}
            </Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatNumber(earnings?.totalDeliveries || 0)}</Text>
                <Text style={styles.heroStatLabel}>Deliveries</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {formatCurrency(earnings?.averagePerDelivery || 0)}
                </Text>
                <Text style={styles.heroStatLabel}>Avg/Delivery</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Time Filter */}
        <View style={[styles.filterContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          {timeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                { backgroundColor: isDark ? colors.card : COLORS.surface },
                timeFilter === filter.key && styles.filterTabActive,
              ]}
              onPress={() => setTimeFilter(filter.key)}
            >
              <Text style={[
                styles.filterTabText,
                { color: colors.textSecondary },
                timeFilter === filter.key && styles.filterTabTextActive,
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Payout */}
        {earnings?.pendingPayout && (typeof earnings.pendingPayout === 'string' ? parseFloat(earnings.pendingPayout) : earnings.pendingPayout) > 0 && (
          <View style={[styles.payoutCard, { backgroundColor: isDark ? `${COLORS.success}20` : COLORS.successLight, borderColor: COLORS.success }]}>
            <View style={styles.payoutInfo}>
              <Text style={[styles.payoutLabel, { color: colors.textSecondary }]}>Pending Payout</Text>
              <Text style={styles.payoutAmount}>
                {formatCurrency(typeof earnings.pendingPayout === 'string' ? parseFloat(earnings.pendingPayout) : earnings.pendingPayout ?? 0)}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.withdrawButton}
              onPress={() => {
                const payoutAmount = typeof earnings.pendingPayout === 'string' 
                  ? parseFloat(earnings.pendingPayout) 
                  : earnings.pendingPayout;
                if (payoutAmount > 0) {
                  navigation.navigate('Withdraw', { balance: payoutAmount });
                } else {
                  Alert.alert('No Balance', 'You don\'t have any pending payout to withdraw.');
                }
              }}
            >
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly Chart */}
        {earnings?.weeklyBreakdown && (
          <View style={[styles.chartCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Weekly Overview</Text>
            <View style={styles.chart}>
              {earnings.weeklyBreakdown.map((day, index) => {
                const barHeight = day.earnings > 0 
                  ? Math.max((day.earnings / maxEarning) * 100, 10) 
                  : 8; // Minimum height for empty bars
                return (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.bar,
                          { 
                            height: `${barHeight}%`,
                            backgroundColor: day.earnings > 0 ? COLORS.primary : (isDark ? 'rgba(255,255,255,0.2)' : COLORS.border),
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{day.day.slice(0, 3)}</Text>
                    <Text style={[styles.barValue, { color: colors.textSecondary }]}>
                      {day.earnings > 0 ? `₦${(day.earnings / 1000).toFixed(1)}k` : '-'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Deliveries */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Deliveries</Text>
          {earnings?.recentDeliveries && earnings.recentDeliveries.length > 0 ? (
            earnings.recentDeliveries.map((delivery) => (
              <TouchableOpacity 
                key={delivery.id} 
                style={[styles.deliveryCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}
                onPress={() => navigation.navigate('DeliveryReceipt', { 
                  deliveryId: delivery.id,
                  amount: delivery.amount,
                  date: delivery.date,
                })}
                activeOpacity={0.7}
              >
                <View style={styles.deliveryInfo}>
                  <Text style={[styles.deliveryDate, { color: colors.text }]}>{formatDeliveryDate(delivery.date)}</Text>
                  <View style={styles.deliveryDetails}>
                    <View style={styles.deliveryDetailRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.deliveryDetail, { color: colors.textSecondary }]}>{delivery.distance.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.deliveryDetailRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.deliveryDetail, { color: colors.textSecondary }]}>{delivery.duration} min</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.deliveryRight}>
                  <Text style={styles.deliveryAmount}>
                    +{formatCurrency(delivery.amount ?? 0)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
              <Ionicons name="clipboard-outline" size={48} color={COLORS.gray} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent deliveries</Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={[styles.tipsCard, { backgroundColor: isDark ? `${COLORS.warning}20` : COLORS.primaryLight }]}>
          <View style={styles.tipsTitleRow}>
            <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
            <Text style={[styles.tipsTitle, { color: isDark ? COLORS.warning : COLORS.primary }]}>Tips to Earn More</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={[styles.tipItem, { color: colors.text }]}>• Stay online during peak hours (11am-2pm, 6pm-9pm)</Text>
            <Text style={[styles.tipItem, { color: colors.text }]}>• Complete deliveries quickly for better ratings</Text>
            <Text style={[styles.tipItem, { color: colors.text }]}>• Position yourself in high-demand areas</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  fixedHeader: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  heroSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  heroGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginVertical: SPACING.sm,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: SPACING.md,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  earningsCard: {
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    opacity: 0.9,
  },
  earningsAmount: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginVertical: SPACING.sm,
  },
  earningsStats: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  earningStat: {
    flex: 1,
    alignItems: 'center',
  },
  earningStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  earningStatLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: SPACING.md,
  },
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  payoutAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  withdrawButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  withdrawButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: SPACING.sm,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: SPACING.xs,
  },
  bar: {
    width: '100%',
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 4,
  },
  barLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  barValue: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  section: {
    padding: SPACING.md,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  deliveryDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  deliveryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryDetail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  deliveryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  deliveryAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
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
  tipsCard: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  tipsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  tipsList: {
    gap: SPACING.xs,
  },
  tipItem: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
});
