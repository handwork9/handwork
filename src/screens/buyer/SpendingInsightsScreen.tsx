import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Line, G, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState } from '../../components/common';
import { useAppSelector } from '../../store';
import { BuyerStackParamList } from '../../types';
import apiClient from '../../services/apiClient';

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.md * 2 - 32;
const CHART_HEIGHT = 180;

type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

interface SpendingData {
  label: string;
  amount: number;
  orders: number;
}

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface FavoriteFarmer {
  id: string;
  name: string;
  avatar?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
}

interface SavingsSummary {
  coupons: number;
  bulkDiscounts: number;
  premiumSavings: number;
  referralCredits: number;
  total: number;
}

interface SpendingInsights {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  spendingTrend: number;
  spendingData: SpendingData[];
  categoryBreakdown: CategorySpending[];
  favoriteFarmers: FavoriteFarmer[];
  savings: SavingsSummary;
  monthlyBudget?: number;
  budgetUsed?: number;
}

const CATEGORY_COLORS: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  'Vegetables': { color: '#10B981', icon: 'leaf' },
  'Fruits': { color: '#F59E0B', icon: 'nutrition' },
  'Grains & Cereals': { color: '#8B5CF6', icon: 'grid' },
  'Dairy & Eggs': { color: '#3B82F6', icon: 'egg' },
  'Meat & Poultry': { color: '#EF4444', icon: 'restaurant' },
  'Fish & Seafood': { color: '#06B6D4', icon: 'fish' },
  'Herbs & Spices': { color: '#84CC16', icon: 'flower' },
  'Beverages': { color: '#EC4899', icon: 'cafe' },
  'Processed Foods': { color: '#F97316', icon: 'fast-food' },
  'Other': { color: '#6B7280', icon: 'ellipsis-horizontal' },
};

// Fetch spending insights from backend
const fetchSpendingInsights = async (period: TimePeriod): Promise<SpendingInsights> => {
  const response = await apiClient.get<any>(`/orders/spending-insights?period=${period}`);
  return response.data || response;
};

export default function SpendingInsightsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const user = useAppSelector(state => state.auth.user);
  
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Fetch spending insights
  const { data: insights, isLoading, refetch, isRefetching } = useQuery<SpendingInsights>({
    queryKey: ['spending-insights', timePeriod],
    queryFn: () => fetchSpendingInsights(timePeriod),
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`;
    }
    return `₦${amount.toLocaleString()}`;
  };

  // Render spending chart
  const renderSpendingChart = () => {
    if (!insights?.spendingData || insights.spendingData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
            No spending data available
          </Text>
        </View>
      );
    }

    const data = insights.spendingData;
    const maxValue = Math.max(...data.map(d => d.amount), 1);
    const barWidth = Math.max((CHART_WIDTH - Math.max(data.length - 1, 0) * 8) / Math.max(data.length, 1), 20);

    return (
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="1" stopColor={colors.primary} stopOpacity="0.6" />
            </SvgLinearGradient>
          </Defs>
          
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <Line
              key={i}
              x1={0}
              y1={CHART_HEIGHT - (CHART_HEIGHT - 30) * ratio}
              x2={CHART_WIDTH}
              y2={CHART_HEIGHT - (CHART_HEIGHT - 30) * ratio}
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}
          
          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = Math.max((item.amount / maxValue) * (CHART_HEIGHT - 30), 4);
            const x = index * (barWidth + 8);
            const y = CHART_HEIGHT - barHeight;
            const isSelected = selectedBarIndex === index;
            
            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={isSelected ? colors.primary : 'url(#barGradient)'}
                  opacity={isSelected ? 1 : 0.8}
                  onPress={() => setSelectedBarIndex(isSelected ? null : index)}
                />
                {isSelected && (
                  <>
                    <Rect
                      x={x - 5}
                      y={y - 35}
                      width={barWidth + 10}
                      height={28}
                      rx={6}
                      fill={isDark ? '#333' : '#FFF'}
                    />
                    <Circle
                      cx={x + barWidth / 2}
                      cy={y - 8}
                      r={4}
                      fill={isDark ? '#333' : '#FFF'}
                    />
                  </>
                )}
              </G>
            );
          })}
        </Svg>
        
        {/* X-axis labels */}
        <View style={styles.chartLabels}>
          {data.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.chartLabel,
                { 
                  color: selectedBarIndex === index ? colors.primary : colors.textSecondary,
                  width: barWidth,
                  fontWeight: selectedBarIndex === index ? '600' : '400',
                },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          ))}
        </View>
        
        {/* Selected bar tooltip */}
        {selectedBarIndex !== null && insights.spendingData[selectedBarIndex] && (
          <View style={[styles.tooltip, { backgroundColor: isDark ? '#333' : '#FFF' }]}>
            <Text style={[styles.tooltipAmount, { color: colors.text }]}>
              {formatCurrency(insights.spendingData[selectedBarIndex].amount)}
            </Text>
            <Text style={[styles.tooltipOrders, { color: colors.textSecondary }]}>
              {insights.spendingData[selectedBarIndex].orders} orders
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render category breakdown
  const renderCategoryBreakdown = () => {
    if (!insights?.categoryBreakdown || insights.categoryBreakdown.length === 0) {
      return null;
    }

    const totalHeight = 8;
    let currentOffset = 0;

    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Category Breakdown</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Progress bar */}
        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
          {insights.categoryBreakdown.map((cat, index) => {
            const widthValue = `${cat.percentage}%` as `${number}%`;
            const leftValue = `${currentOffset}%` as `${number}%`;
            currentOffset += cat.percentage;
            
            return (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  {
                    width: widthValue,
                    left: leftValue,
                    backgroundColor: cat.color,
                    borderTopLeftRadius: index === 0 ? 4 : 0,
                    borderBottomLeftRadius: index === 0 ? 4 : 0,
                    borderTopRightRadius: index === insights.categoryBreakdown.length - 1 ? 4 : 0,
                    borderBottomRightRadius: index === insights.categoryBreakdown.length - 1 ? 4 : 0,
                  },
                ]}
              />
            );
          })}
        </View>
        
        {/* Category list */}
        <View style={styles.categoryList}>
          {insights.categoryBreakdown.slice(0, 5).map((cat, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
                  <Ionicons name={cat.icon} size={14} color={cat.color} />
                </View>
                <Text style={[styles.categoryName, { color: colors.text }]}>{cat.category}</Text>
              </View>
              <View style={styles.categoryRight}>
                <Text style={[styles.categoryAmount, { color: colors.text }]}>
                  {formatCurrency(cat.amount)}
                </Text>
                <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>
                  {cat.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render favorite farmers
  const renderFavoriteFarmers = () => {
    if (!insights?.favoriteFarmers || insights.favoriteFarmers.length === 0) {
      return null;
    }

    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Favorite Farmers</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {insights.favoriteFarmers.slice(0, 3).map((farmer, index) => (
          <TouchableOpacity
            key={farmer.id}
            style={[
              styles.farmerItem,
              index < insights.favoriteFarmers.length - 1 && styles.farmerItemBorder,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
            ]}
            onPress={() => navigation.navigate('FarmerProfile', { farmerId: farmer.id })}
          >
            <View style={styles.farmerLeft}>
              <View style={[styles.farmerRank, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                <Text style={styles.farmerRankText}>{index + 1}</Text>
              </View>
              {farmer.avatar ? (
                <Image source={{ uri: farmer.avatar }} style={styles.farmerAvatar} />
              ) : (
                <View style={[styles.farmerAvatar, styles.farmerAvatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
              )}
              <View style={styles.farmerInfo}>
                <Text style={[styles.farmerName, { color: colors.text }]}>{farmer.name}</Text>
                <Text style={[styles.farmerOrders, { color: colors.textSecondary }]}>
                  {farmer.totalOrders} orders
                </Text>
              </View>
            </View>
            <View style={styles.farmerRight}>
              <Text style={[styles.farmerSpent, { color: colors.primary }]}>
                {formatCompactCurrency(farmer.totalSpent)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render savings summary
  const renderSavingsSummary = () => {
    if (!insights?.savings) {
      return null;
    }

    const { coupons, bulkDiscounts, premiumSavings, referralCredits, total } = insights.savings;

    const savingsItems = [
      { label: 'Coupon Savings', amount: coupons, icon: 'pricetag' as const, color: '#10B981' },
      { label: 'Bulk Discounts', amount: bulkDiscounts, icon: 'layers' as const, color: '#3B82F6' },
      { label: 'Premium Benefits', amount: premiumSavings, icon: 'diamond' as const, color: '#8B5CF6' },
      { label: 'Referral Credits', amount: referralCredits, icon: 'people' as const, color: '#F59E0B' },
    ].filter(item => item.amount > 0);

    if (savingsItems.length === 0 && total === 0) {
      return null;
    }

    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Your Savings</Text>
          <View style={[styles.totalSavingsBadge, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="wallet" size={14} color="#10B981" />
            <Text style={[styles.totalSavingsText, { color: '#10B981' }]}>
              {formatCurrency(total)} saved
            </Text>
          </View>
        </View>
        
        <View style={styles.savingsGrid}>
          {savingsItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.savingsItem,
                { backgroundColor: `${item.color}08` },
              ]}
            >
              <View style={[styles.savingsIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={[styles.savingsAmount, { color: colors.text }]}>
                {formatCurrency(item.amount)}
              </Text>
              <Text style={[styles.savingsLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render budget tracker
  const renderBudgetTracker = () => {
    if (!insights?.monthlyBudget) {
      return null;
    }

    const used = insights.budgetUsed || 0;
    const percentage = Math.min((used / insights.monthlyBudget) * 100, 100);
    const remaining = Math.max(insights.monthlyBudget - used, 0);
    const isOverBudget = used > insights.monthlyBudget;

    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Monthly Budget</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.budgetContent}>
          <View style={styles.budgetHeader}>
            <Text style={[styles.budgetUsed, { color: isOverBudget ? '#EF4444' : colors.text }]}>
              {formatCurrency(used)}
            </Text>
            <Text style={[styles.budgetTotal, { color: colors.textSecondary }]}>
              of {formatCurrency(insights.monthlyBudget)}
            </Text>
          </View>
          
          <View style={[styles.budgetBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
            <View
              style={[
                styles.budgetProgress,
                {
                  width: `${percentage}%`,
                  backgroundColor: isOverBudget ? '#EF4444' : percentage > 80 ? '#F59E0B' : '#10B981',
                },
              ]}
            />
          </View>
          
          <Text style={[styles.budgetRemaining, { color: isOverBudget ? '#EF4444' : colors.textSecondary }]}>
            {isOverBudget ? `Over budget by ${formatCurrency(used - insights.monthlyBudget)}` : `${formatCurrency(remaining)} remaining`}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingState message="Loading your spending insights..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e'] : [colors.primary, colors.primary]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Spending Insights</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        {/* Total Spent Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(insights?.totalSpent || 0)}
            </Text>
            {insights?.spendingTrend !== undefined && (
              <View style={[
                styles.trendBadge,
                { backgroundColor: insights.spendingTrend >= 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' }
              ]}>
                <Ionicons
                  name={insights.spendingTrend >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={insights.spendingTrend >= 0 ? '#FCA5A5' : '#6EE7B7'}
                />
                <Text style={[
                  styles.trendText,
                  { color: insights.spendingTrend >= 0 ? '#FCA5A5' : '#6EE7B7' }
                ]}>
                  {Math.abs(insights.spendingTrend).toFixed(1)}% vs last {timePeriod}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{insights?.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCompactCurrency(insights?.avgOrderValue || 0)}
              </Text>
              <Text style={styles.statLabel}>Avg Order</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Time Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          {(['week', 'month', 'quarter', 'year'] as TimePeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                timePeriod === period && { backgroundColor: colors.primary },
              ]}
              onPress={() => setTimePeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: timePeriod === period ? '#FFF' : colors.textSecondary },
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Spending Chart */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: isDark ? colors.card : '#FFF', opacity: fadeAnim },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Spending Trend</Text>
            <TouchableOpacity>
              <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {renderSpendingChart()}
        </Animated.View>
        
        {/* Category Breakdown */}
        {renderCategoryBreakdown()}
        
        {/* Budget Tracker */}
        {renderBudgetTracker()}
        
        {/* Savings Summary */}
        {renderSavingsSummary()}
        
        {/* Favorite Farmers */}
        {renderFavoriteFarmers()}
        
        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: SPACING.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  summaryMain: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  trendText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: SPACING.md,
  },
  content: {
    flex: 1,
    marginTop: -SPACING.md,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  periodText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  chartContainer: {
    position: 'relative',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: 8,
  },
  chartLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: SPACING.sm,
  },
  tooltip: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
  },
  tooltipAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  tooltipOrders: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.md,
  },
  progressSegment: {
    position: 'absolute',
    height: '100%',
  },
  categoryList: {
    gap: SPACING.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  categoryPercent: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    minWidth: 32,
    textAlign: 'right',
  },
  farmerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  farmerItemBorder: {
    borderBottomWidth: 1,
  },
  farmerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  farmerRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: FONTS.bold,
  },
  farmerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  farmerAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerInfo: {
    gap: 2,
  },
  farmerName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  farmerOrders: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  farmerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  farmerSpent: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  totalSavingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  totalSavingsText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  savingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  savingsItem: {
    width: (width - SPACING.md * 2 - SPACING.md * 2 - SPACING.sm) / 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  savingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  savingsAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  savingsLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  budgetContent: {
    gap: SPACING.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  budgetUsed: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  budgetTotal: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  budgetBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 5,
  },
  budgetRemaining: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
});
