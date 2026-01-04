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
} from 'react-native';
import Svg, { Path, Circle, Line, G, Rect, Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState } from '../../components/common';
import { riderService } from '../../services/orderService';
import apiClient from '../../services/apiClient';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.md * 2 - 32;
const CHART_HEIGHT = 160;

type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

interface DeliveryStats {
  total: number;
  completed: number;
  cancelled: number;
  inProgress: number;
  completionRate: number;
}

interface EarningsData {
  label: string;
  amount: number;
  deliveries: number;
}

interface PerformanceMetrics {
  avgDeliveryTime: number; // in minutes
  avgDistance: number; // in km
  onTimeRate: number; // percentage
  customerRating: number;
  totalRatings: number;
  acceptanceRate: number;
  peakHours: string[];
}

interface RiderBadge {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  earnedAt?: string;
  progress?: number;
}

interface RiderPerformanceData {
  deliveryStats: DeliveryStats;
  earningsData: EarningsData[];
  totalEarnings: number;
  earningsTrend: number;
  performanceMetrics: PerformanceMetrics;
  badges: RiderBadge[];
  rank: number;
  totalRiders: number;
  weeklyGoal?: number;
  weeklyProgress?: number;
}

// Fetch rider performance data
const fetchRiderPerformance = async (period: TimePeriod): Promise<RiderPerformanceData> => {
  const response = await apiClient.get<any>(`/riders/performance?period=${period}`);
  return response.data || response;
};

// Performance tier calculation
const getPerformanceTier = (rating: number, completionRate: number) => {
  const score = (rating / 5) * 50 + (completionRate / 100) * 50;
  if (score >= 90) return { tier: 'Elite', color: '#FFD700', icon: 'trophy' as const };
  if (score >= 75) return { tier: 'Pro', color: '#8B5CF6', icon: 'medal' as const };
  if (score >= 60) return { tier: 'Rising Star', color: '#3B82F6', icon: 'star' as const };
  return { tier: 'Starter', color: '#10B981', icon: 'rocket' as const };
};

export default function RiderPerformanceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Fetch performance data
  const { data: performance, isLoading, refetch, isRefetching } = useQuery<RiderPerformanceData>({
    queryKey: ['rider-performance', timePeriod],
    queryFn: () => fetchRiderPerformance(timePeriod),
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (performance?.deliveryStats?.completionRate) {
      Animated.timing(progressAnim, {
        toValue: performance.deliveryStats.completionRate / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [performance]);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₦${(amount / 1000).toFixed(1)}K`;
    return `₦${amount.toLocaleString()}`;
  };

  // Circular progress component
  const CircularProgress = ({ progress, size, strokeWidth, color }: { progress: number; size: number; strokeWidth: number; color: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress * circumference);

    return (
      <Svg width={size} height={size}>
        <Circle
          stroke={isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6'}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    );
  };

  // Render earnings chart
  const renderEarningsChart = () => {
    if (!performance?.earningsData || performance.earningsData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
            No earnings data available
          </Text>
        </View>
      );
    }

    const data = performance.earningsData;
    const maxValue = Math.max(...data.map(d => d.amount), 1);
    const barWidth = Math.max((CHART_WIDTH - Math.max(data.length - 1, 0) * 8) / Math.max(data.length, 1), 20);

    return (
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#10B981" stopOpacity="1" />
              <Stop offset="1" stopColor="#10B981" stopOpacity="0.4" />
            </SvgLinearGradient>
          </Defs>
          
          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <Line
              key={i}
              x1={0}
              y1={CHART_HEIGHT - (CHART_HEIGHT - 24) * ratio}
              x2={CHART_WIDTH}
              y2={CHART_HEIGHT - (CHART_HEIGHT - 24) * ratio}
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}
          
          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = Math.max((item.amount / maxValue) * (CHART_HEIGHT - 24), 4);
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
                  fill={isSelected ? '#10B981' : 'url(#earningsGradient)'}
                  opacity={isSelected ? 1 : 0.8}
                  onPress={() => setSelectedBarIndex(isSelected ? null : index)}
                />
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
                  color: selectedBarIndex === index ? '#10B981' : colors.textSecondary,
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
        {selectedBarIndex !== null && performance.earningsData[selectedBarIndex] && (
          <View style={[styles.tooltip, { backgroundColor: isDark ? '#333' : '#FFF' }]}>
            <Text style={[styles.tooltipAmount, { color: colors.text }]}>
              {formatCurrency(performance.earningsData[selectedBarIndex].amount)}
            </Text>
            <Text style={[styles.tooltipOrders, { color: colors.textSecondary }]}>
              {performance.earningsData[selectedBarIndex].deliveries} deliveries
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render delivery stats
  const renderDeliveryStats = () => {
    if (!performance?.deliveryStats) return null;

    const { total, completed, cancelled, inProgress, completionRate } = performance.deliveryStats;

    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Stats</Text>
          <View style={[styles.completionBadge, { backgroundColor: completionRate >= 90 ? '#10B98115' : completionRate >= 70 ? '#F59E0B15' : '#EF444415' }]}>
            <Ionicons 
              name="checkmark-circle" 
              size={14} 
              color={completionRate >= 90 ? '#10B981' : completionRate >= 70 ? '#F59E0B' : '#EF4444'} 
            />
            <Text style={[
              styles.completionText, 
              { color: completionRate >= 90 ? '#10B981' : completionRate >= 70 ? '#F59E0B' : '#EF4444' }
            ]}>
              {completionRate.toFixed(0)}% completion
            </Text>
          </View>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="bicycle" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="checkmark-done" size={20} color="#10B981" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{cancelled}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cancelled</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render performance metrics
  const renderPerformanceMetrics = () => {
    if (!performance?.performanceMetrics) return null;

    const { avgDeliveryTime, avgDistance, onTimeRate, customerRating, totalRatings, acceptanceRate } = performance.performanceMetrics;
    const tier = getPerformanceTier(customerRating, performance.deliveryStats?.completionRate || 0);

    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Performance Metrics</Text>
          <View style={[styles.tierBadge, { backgroundColor: `${tier.color}15` }]}>
            <Ionicons name={tier.icon} size={14} color={tier.color} />
            <Text style={[styles.tierText, { color: tier.color }]}>{tier.tier}</Text>
          </View>
        </View>
        
        {/* Rating Spotlight */}
        <View style={styles.ratingSpotlight}>
          <View style={styles.ratingCircle}>
            <CircularProgress progress={customerRating / 5} size={100} strokeWidth={8} color="#FFD700" />
            <View style={styles.ratingCenter}>
              <View style={styles.ratingStars}>
                <Ionicons name="star" size={16} color="#FFD700" />
              </View>
              <Text style={[styles.ratingValue, { color: colors.text }]}>{customerRating.toFixed(1)}</Text>
              <Text style={[styles.ratingCount, { color: colors.textSecondary }]}>{totalRatings} ratings</Text>
            </View>
          </View>
        </View>
        
        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="timer" size={18} color="#3B82F6" />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{avgDeliveryTime} min</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg Delivery Time</Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="navigate" size={18} color="#10B981" />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{avgDistance.toFixed(1)} km</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg Distance</Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#8B5CF615' }]}>
              <Ionicons name="time" size={18} color="#8B5CF6" />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{onTimeRate.toFixed(0)}%</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>On-Time Rate</Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, { backgroundColor: '#F59E0B15' }]}>
              <Ionicons name="hand-right" size={18} color="#F59E0B" />
            </View>
            <View style={styles.metricContent}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{acceptanceRate.toFixed(0)}%</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Acceptance Rate</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render weekly goal
  const renderWeeklyGoal = () => {
    if (!performance?.weeklyGoal) return null;

    const progress = (performance.weeklyProgress || 0) / performance.weeklyGoal;
    const remaining = Math.max(performance.weeklyGoal - (performance.weeklyProgress || 0), 0);
    const isComplete = progress >= 1;

    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Goal</Text>
          {isComplete && (
            <View style={[styles.goalCompleteBadge, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.goalCompleteText}>Achieved!</Text>
            </View>
          )}
        </View>
        
        <View style={styles.goalContent}>
          <View style={styles.goalHeader}>
            <Text style={[styles.goalProgress, { color: colors.text }]}>
              {performance.weeklyProgress || 0} / {performance.weeklyGoal} deliveries
            </Text>
            <Text style={[styles.goalRemaining, { color: colors.textSecondary }]}>
              {isComplete ? 'Goal reached!' : `${remaining} more to go`}
            </Text>
          </View>
          
          <View style={[styles.goalBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
            <Animated.View
              style={[
                styles.goalBarProgress,
                {
                  width: `${Math.min(progress * 100, 100)}%`,
                  backgroundColor: isComplete ? '#10B981' : colors.primary,
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  // Render badges
  const renderBadges = () => {
    if (!performance?.badges || performance.badges.length === 0) return null;

    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Achievements</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.badgesRow}>
            {performance.badges.slice(0, 5).map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgeItem, { backgroundColor: `${badge.color}10` }]}
              >
                <View style={[styles.badgeIcon, { backgroundColor: `${badge.color}20` }]}>
                  <Ionicons name={badge.icon} size={24} color={badge.color} />
                </View>
                <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                  {badge.name}
                </Text>
                {badge.progress !== undefined && badge.progress < 100 && (
                  <View style={styles.badgeProgressBar}>
                    <View style={[styles.badgeProgressFill, { width: `${badge.progress}%`, backgroundColor: badge.color }]} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render leaderboard position
  const renderLeaderboard = () => {
    if (!performance?.rank) return null;

    return (
      <TouchableOpacity
        style={[styles.leaderboardCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}
        onPress={() => navigation.navigate('Leaderboard' as never)}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.leaderboardIcon}
        >
          <Ionicons name="trophy" size={24} color="#FFF" />
        </LinearGradient>
        <View style={styles.leaderboardContent}>
          <Text style={[styles.leaderboardTitle, { color: colors.text }]}>Leaderboard Rank</Text>
          <Text style={[styles.leaderboardRank, { color: colors.textSecondary }]}>
            #{performance.rank} of {performance.totalRiders} riders
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingState message="Loading performance data..." />;
  }

  const tier = performance?.performanceMetrics 
    ? getPerformanceTier(performance.performanceMetrics.customerRating, performance.deliveryStats?.completionRate || 0)
    : { tier: 'Starter', color: '#10B981', icon: 'rocket' as const };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: isDark ? '#000' : '#F2F2F7' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Performance</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Earnings Summary */}
        <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <View style={styles.summaryMain}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Earnings</Text>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>
              {formatCurrency(performance?.totalEarnings || 0)}
            </Text>
            {performance?.earningsTrend !== undefined && (
              <View style={[
                styles.trendBadge,
                { backgroundColor: performance.earningsTrend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }
              ]}>
                <Ionicons
                  name={performance.earningsTrend >= 0 ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={performance.earningsTrend >= 0 ? '#10B981' : '#EF4444'}
                />
                <Text style={[
                  styles.trendText,
                  { color: performance.earningsTrend >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {Math.abs(performance.earningsTrend).toFixed(1)}% vs last {timePeriod}
                </Text>
              </View>
            )}
          </View>
          
          <View style={[styles.tierCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }]}>
            <View style={[styles.tierIcon, { backgroundColor: `${tier.color}20` }]}>
              <Ionicons name={tier.icon} size={20} color={tier.color} />
            </View>
            <View>
              <Text style={[styles.tierLabel, { color: colors.textSecondary }]}>Performance Tier</Text>
              <Text style={[styles.tierValue, { color: tier.color }]}>{tier.tier}</Text>
            </View>
          </View>
        </View>
      </View>
      
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
        <View style={[styles.periodSelector, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5E5' }]}>
          {(['week', 'month', 'quarter', 'year'] as TimePeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={styles.periodButton}
              onPress={() => setTimePeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: timePeriod === period ? colors.text : colors.textSecondary },
                  timePeriod === period && styles.periodTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
              {timePeriod === period && <View style={[styles.periodIndicator, { backgroundColor: '#10B981' }]} />}
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Earnings Chart */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Earnings Trend</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Earnings' as never)}>
              <Text style={[styles.seeAll, { color: '#10B981' }]}>Details</Text>
            </TouchableOpacity>
          </View>
          {renderEarningsChart()}
        </View>
        
        {/* Delivery Stats */}
        {renderDeliveryStats()}
        
        {/* Weekly Goal */}
        {renderWeeklyGoal()}
        
        {/* Performance Metrics */}
        {renderPerformanceMetrics()}
        
        {/* Leaderboard Position */}
        {renderLeaderboard()}
        
        {/* Badges */}
        {renderBadges()}
        
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
    paddingBottom: SPACING.md,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  summaryMain: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: FONTS.bold,
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
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  tierValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFF',
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
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  periodText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  periodTextActive: {
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  periodIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 1.5,
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
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  completionText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  tierText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statBox: {
    width: (width - SPACING.md * 2 - SPACING.md * 2 - SPACING.sm) / 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  ratingSpotlight: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ratingCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ratingStars: {
    marginBottom: 2,
  },
  ratingValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  ratingCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metricItem: {
    width: (width - SPACING.md * 2 - SPACING.md * 2 - SPACING.sm) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  goalContent: {
    gap: SPACING.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgress: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  goalRemaining: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  goalBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  goalBarProgress: {
    height: '100%',
    borderRadius: 5,
  },
  goalCompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  goalCompleteText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#10B981',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badgeItem: {
    width: 90,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  badgeName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  badgeProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  leaderboardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  leaderboardContent: {
    flex: 1,
  },
  leaderboardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  leaderboardRank: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
});
