import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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

// Performance badge component
const PerformanceBadge = ({ type, value, rating, label }: { type?: 'rating' | 'completion'; value?: number; rating?: number; label?: string }) => {
  // Support both old props (rating, label) and new props (type, value)
  const displayValue = value ?? rating ?? 0;
  const displayType = type || (label ? 'rating' : 'rating');
  
  const getColor = () => {
    if (displayType === 'rating') {
      if (displayValue >= 4.5) return '#10B981';
      if (displayValue >= 4.0) return '#F59E0B';
      return '#EF4444';
    } else {
      // completion rate
      if (displayValue >= 95) return '#10B981';
      if (displayValue >= 85) return '#F59E0B';
      return '#EF4444';
    }
  };
  
  const formatValue = () => {
    if (displayType === 'completion') {
      return `${Math.round(displayValue)}%`;
    }
    return displayValue.toFixed(1);
  };
  
  return (
    <View style={[performanceStyles.badge, { backgroundColor: `${getColor()}15` }]}>
      <Ionicons name={displayType === 'rating' ? 'star' : 'checkmark-circle'} size={14} color={getColor()} />
      <Text style={[performanceStyles.rating, { color: getColor() }]}>{formatValue()}</Text>
      {label && <Text style={performanceStyles.label}>{label}</Text>}
    </View>
  );
};

const performanceStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  rating: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
});

// Daily goal progress component
const DailyGoalCard = ({ current, target, isDark, colors }: { current: number; target: number; isDark: boolean; colors: any }) => {
  const progress = Math.min((current / target) * 100, 100);
  const isCompleted = current >= target;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  
  return (
    <View style={[goalStyles.container, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
      <View style={goalStyles.header}>
        <View style={goalStyles.titleRow}>
          <Ionicons name="flag" size={20} color={isCompleted ? '#10B981' : COLORS.primary} />
          <Text style={[goalStyles.title, { color: colors.text }]}>Daily Goal</Text>
        </View>
        {isCompleted && (
          <View style={goalStyles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={goalStyles.completedText}>Completed!</Text>
          </View>
        )}
      </View>
      
      <View style={goalStyles.progressSection}>
        <View style={goalStyles.amountsRow}>
          <Text style={[goalStyles.currentAmount, { color: colors.text }]}>{formatCurrency(current)}</Text>
          <Text style={[goalStyles.targetAmount, { color: colors.textSecondary }]}>/ {formatCurrency(target)}</Text>
        </View>
        
        <View style={goalStyles.progressBarBg}>
          <Animated.View 
            style={[
              goalStyles.progressBarFill, 
              { 
                width: animatedWidth,
                backgroundColor: isCompleted ? '#10B981' : COLORS.primary,
              }
            ]} 
          />
        </View>
        
        <Text style={[goalStyles.progressText, { color: colors.textSecondary }]}>
          {isCompleted ? '🎉 Great job! You reached your daily goal!' : `${Math.round(progress)}% of daily goal`}
        </Text>
      </View>
    </View>
  );
};

const goalStyles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  completedText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#10B981',
  },
  progressSection: {
    gap: SPACING.xs,
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  targetAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
});

interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalDeliveries: number;
  averagePerDelivery: number;
  pendingPayout: number;
  dailyGoal?: number;
  rating?: number;
  completionRate?: number;
  streakDays?: number;
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
  const [showPerformanceSheet, setShowPerformanceSheet] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();

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

  // Mutation to update daily goal
  const updateGoalMutation = useMutation({
    mutationFn: async (newGoal: number) => {
      console.log('[EarningsScreen] Updating daily goal to:', newGoal);
      const result = await riderService.updateDailyGoal(newGoal);
      console.log('[EarningsScreen] Update result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[EarningsScreen] Update success:', data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['rider-earnings'] });
      setIsEditingGoal(false);
      setGoalInput('');
      Alert.alert('Success', 'Daily goal updated!');
    },
    onError: (error: any) => {
      console.log('[EarningsScreen] Update error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error?.message || 'Failed to update daily goal');
    },
  });

  const handleSaveGoal = () => {
    const newGoal = parseInt(goalInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(newGoal) || newGoal < 1000) {
      Alert.alert('Invalid Goal', 'Daily goal must be at least ₦1,000');
      return;
    }
    if (newGoal > 100000) {
      Alert.alert('Invalid Goal', 'Daily goal cannot exceed ₦100,000');
      return;
    }
    updateGoalMutation.mutate(newGoal);
  };

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

  // Handle error state
  if (error) {
    console.error('[EarningsScreen] Error fetching earnings:', error);
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

        {/* Performance Summary Button */}
        <TouchableOpacity 
          style={[styles.performanceSummaryButton, { backgroundColor: isDark ? colors.card : COLORS.surface }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPerformanceSheet(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.performanceSummaryLeft}>
            <View style={styles.performanceMiniStats}>
              <View style={styles.miniStatItem}>
                <Ionicons name="star" size={16} color="#10B981" />
                <Text style={[styles.miniStatValue, { color: colors.text }]}>{(earnings?.rating || 4.8).toFixed(1)}</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStatItem}>
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                <Text style={[styles.miniStatValue, { color: colors.text }]}>{earnings?.completionRate || 95}%</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStatItem}>
                <Ionicons name="flame" size={16} color="#FF9500" />
                <Text style={[styles.miniStatValue, { color: colors.text }]}>{earnings?.streakDays || 0}d</Text>
              </View>
            </View>
            <Text style={[styles.performanceSummaryLabel, { color: colors.textSecondary }]}>Tap to view performance & goals</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

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

      {/* Performance & Goals Bottom Sheet */}
      <Modal
        visible={showPerformanceSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPerformanceSheet(false)}
      >
        <Pressable 
          style={styles.sheetOverlay}
          onPress={() => setShowPerformanceSheet(false)}
        >
          <Pressable 
            style={[styles.sheetContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <View style={styles.sheetHandle}>
              <View style={[styles.handleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]} />
            </View>

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Performance & Goals</Text>
              <TouchableOpacity 
                onPress={() => setShowPerformanceSheet(false)}
                style={styles.sheetCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetContent}>
              {/* Daily Goal Section */}
              <View style={styles.sheetSection}>
                <View style={styles.sheetSectionHeader}>
                  <Ionicons name="trophy" size={20} color="#FF9500" />
                  <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>Daily Goal</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGoalInput(String(earnings?.dailyGoal || 5000));
                      setIsEditingGoal(true);
                    }}
                    style={styles.editGoalButton}
                  >
                    <Ionicons name="pencil" size={16} color={COLORS.primary} />
                    <Text style={styles.editGoalText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* Edit Goal Modal */}
                {isEditingGoal && (
                  <View style={[styles.editGoalCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FEF3C7' }]}>
                    <Text style={[styles.editGoalLabel, { color: colors.text }]}>Set your daily earning target</Text>
                    <View style={styles.editGoalInputRow}>
                      <Text style={[styles.editGoalCurrency, { color: colors.text }]}>₦</Text>
                      <TextInput
                        style={[styles.editGoalInput, { color: colors.text, borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB' }]}
                        value={goalInput}
                        onChangeText={setGoalInput}
                        keyboardType="numeric"
                        placeholder="5000"
                        placeholderTextColor={colors.textSecondary}
                        autoFocus
                      />
                    </View>
                    <Text style={[styles.editGoalHint, { color: colors.textSecondary }]}>Min: ₦1,000 • Max: ₦100,000</Text>
                    <View style={styles.editGoalActions}>
                      <TouchableOpacity 
                        onPress={() => {
                          setIsEditingGoal(false);
                          setGoalInput('');
                        }}
                        style={[styles.editGoalBtn, styles.editGoalCancelBtn]}
                      >
                        <Text style={styles.editGoalCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={handleSaveGoal}
                        style={[styles.editGoalBtn, styles.editGoalSaveBtn]}
                        disabled={updateGoalMutation.isPending}
                      >
                        {updateGoalMutation.isPending ? (
                          <Text style={styles.editGoalSaveText}>Saving...</Text>
                        ) : (
                          <Text style={styles.editGoalSaveText}>Save Goal</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={[styles.dailyGoalWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0FDF4' }]}>
                  <View style={styles.dailyGoalHeader}>
                    <View style={styles.dailyGoalTitleRow}>
                      <Ionicons name="flag" size={20} color={(earnings?.today || 0) >= (earnings?.dailyGoal || 5000) ? '#10B981' : COLORS.primary} />
                      <Text style={[styles.dailyGoalTitleText, { color: colors.text }]}>Progress</Text>
                    </View>
                    {(earnings?.today || 0) >= (earnings?.dailyGoal || 5000) && (
                      <View style={styles.dailyGoalCompletedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.dailyGoalCompletedText}>Completed!</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.dailyGoalAmounts}>
                    <Text style={[styles.dailyGoalCurrent, { color: colors.text }]}>{formatCurrency(earnings?.today || 0)}</Text>
                    <Text style={[styles.dailyGoalTarget, { color: colors.textSecondary }]}>/ {formatCurrency(earnings?.dailyGoal || 5000)}</Text>
                  </View>
                  
                  <View style={styles.dailyGoalBarBg}>
                    <View 
                      style={[
                        styles.dailyGoalBarFill, 
                        { 
                          width: `${Math.min(((earnings?.today || 0) / (earnings?.dailyGoal || 5000)) * 100, 100)}%`,
                          backgroundColor: (earnings?.today || 0) >= (earnings?.dailyGoal || 5000) ? '#10B981' : COLORS.primary,
                        }
                      ]} 
                    />
                  </View>
                  
                  <Text style={[styles.dailyGoalProgressText, { color: colors.textSecondary }]}>
                    {(earnings?.today || 0) >= (earnings?.dailyGoal || 5000) 
                      ? '🎉 Great job! You reached your daily goal!' 
                      : `${Math.round(((earnings?.today || 0) / (earnings?.dailyGoal || 5000)) * 100)}% of daily goal`}
                  </Text>
                </View>
              </View>

              {/* Performance Metrics Section */}
              <View style={styles.sheetSection}>
                <View style={styles.sheetSectionHeader}>
                  <Ionicons name="stats-chart" size={20} color="#3B82F6" />
                  <Text style={[styles.sheetSectionTitle, { color: colors.text }]}>Performance Metrics</Text>
                </View>
                
                {/* Rating Card */}
                <View style={[styles.metricCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
                  <View style={styles.metricIconContainer}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.metricIconGradient}
                    >
                      <Ionicons name="star" size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Your Rating</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{(earnings?.rating || 4.8).toFixed(1)}</Text>
                    <Text style={[styles.metricDesc, { color: colors.textSecondary }]}>
                      {(earnings?.rating || 4.8) >= 4.5 ? 'Excellent! Keep it up' : 'Room for improvement'}
                    </Text>
                  </View>
                  <View style={[styles.metricBadge, { backgroundColor: (earnings?.rating || 4.8) >= 4.5 ? '#10B98115' : '#F59E0B15' }]}>
                    <Text style={[styles.metricBadgeText, { color: (earnings?.rating || 4.8) >= 4.5 ? '#10B981' : '#F59E0B' }]}>
                      {(earnings?.rating || 4.8) >= 4.5 ? 'Top Rated' : 'Good'}
                    </Text>
                  </View>
                </View>

                {/* Completion Rate Card */}
                <View style={[styles.metricCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
                  <View style={styles.metricIconContainer}>
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.metricIconGradient}
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Completion Rate</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{earnings?.completionRate || 95}%</Text>
                    <Text style={[styles.metricDesc, { color: colors.textSecondary }]}>
                      {(earnings?.completionRate || 95) >= 95 ? 'Outstanding reliability' : 'Try to complete more orders'}
                    </Text>
                  </View>
                  <View style={[styles.metricBadge, { backgroundColor: (earnings?.completionRate || 95) >= 95 ? '#3B82F615' : '#F59E0B15' }]}>
                    <Text style={[styles.metricBadgeText, { color: (earnings?.completionRate || 95) >= 95 ? '#3B82F6' : '#F59E0B' }]}>
                      {(earnings?.completionRate || 95) >= 95 ? 'Reliable' : 'Good'}
                    </Text>
                  </View>
                </View>

                {/* Streak Card */}
                <View style={[styles.metricCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
                  <View style={styles.metricIconContainer}>
                    <LinearGradient
                      colors={['#FF9500', '#F97316']}
                      style={styles.metricIconGradient}
                    >
                      <Ionicons name="flame" size={24} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{earnings?.streakDays || 0} days</Text>
                    <Text style={[styles.metricDesc, { color: colors.textSecondary }]}>
                      {(earnings?.streakDays || 0) >= 7 ? 'Amazing consistency!' : 'Keep delivering daily'}
                    </Text>
                  </View>
                  {(earnings?.streakDays || 0) >= 3 && (
                    <View style={[styles.metricBadge, { backgroundColor: '#FF950015' }]}>
                      <Text style={[styles.metricBadgeText, { color: '#FF9500' }]}>
                        🔥 On Fire
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Tips Section */}
              <View style={[styles.sheetTipsCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
                <View style={styles.sheetTipsHeader}>
                  <Ionicons name="bulb" size={18} color="#10B981" />
                  <Text style={[styles.sheetTipsTitle, { color: '#10B981' }]}>Pro Tips</Text>
                </View>
                <Text style={[styles.sheetTipText, { color: colors.text }]}>
                  • Maintain 4.5+ rating for priority job access
                </Text>
                <Text style={[styles.sheetTipText, { color: colors.text }]}>
                  • 7+ day streaks unlock bonus rewards
                </Text>
                <Text style={[styles.sheetTipText, { color: colors.text }]}>
                  • High completion rate = more job offers
                </Text>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginBottom: SPACING.md,
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
  // Daily Goal Card Styles
  dailyGoalCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  dailyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dailyGoalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  dailyGoalProgress: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  dailyGoalBarContainer: {
    height: 12,
    borderRadius: 6,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  dailyGoalBar: {
    height: '100%',
    borderRadius: 6,
  },
  dailyGoalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyGoalAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  dailyGoalTarget: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  goalComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#34C75920',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  goalCompleteText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#34C759',
  },
  // Performance Section Styles
  performanceSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  performanceItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  performanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  performanceBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  performanceUnit: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  streakBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  streakText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FF9500',
    marginTop: 2,
  },
  // Performance Summary Button Styles
  performanceSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.small,
  },
  performanceSummaryLeft: {
    flex: 1,
  },
  performanceMiniStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  miniStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: SPACING.sm,
  },
  performanceSummaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  // Bottom Sheet Styles
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    ...SHADOWS.large,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sheetTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  sheetSection: {
    marginBottom: SPACING.lg,
  },
  sheetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sheetSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  metricIconContainer: {
    marginRight: SPACING.md,
  },
  metricIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  metricDesc: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  metricBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  metricBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  sheetTipsCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  sheetTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sheetTipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  sheetTipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  // Daily Goal Wrapper Styles (for bottom sheet)
  dailyGoalWrapper: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  dailyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dailyGoalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dailyGoalTitleText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  dailyGoalCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  dailyGoalCompletedText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#10B981',
  },
  dailyGoalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  dailyGoalCurrent: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  dailyGoalTarget: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  dailyGoalBarBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  dailyGoalBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  dailyGoalProgressText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  // Edit Goal Styles
  editGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  editGoalText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  editGoalCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  editGoalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  editGoalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  editGoalCurrency: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginRight: SPACING.xs,
  },
  editGoalInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  editGoalHint: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
  },
  editGoalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  editGoalBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  editGoalCancelBtn: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  editGoalCancelText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#6B7280',
  },
  editGoalSaveBtn: {
    backgroundColor: COLORS.primary,
  },
  editGoalSaveText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
