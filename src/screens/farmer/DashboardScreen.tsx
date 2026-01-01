import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState, OrderCard } from '../../components/common';
import FloatingSocialMenu from '../../components/common/FloatingSocialMenu';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { withdrawalService } from '../../services/withdrawalService';
import { chatService } from '../../services/chatService';
import { farmerAnalyticsService } from '../../services/farmerAnalyticsService';
import { Order, Product, FarmerStackParamList } from '../../types';
import { useAppSelector, useAppDispatch } from '../../store';
import { useFarmerSocket, useNewOrderNotifications } from '../../hooks/useFarmerSocket';
import { fetchDashboardStats, setEarnings } from '../../store/slices/farmerSlice';
import { API_CONFIG } from '../../constants/config';
import LiveSupportBanner from '../../components/common/LiveSupportBanner';
import {
  PendingOrdersIllustration,
  ProcessingOrdersIllustration,
  InventoryIllustration,
  LowStockIllustration,
  PeakHoursIllustration,
  EarningsCardIllustration,
  TopSellersIllustration,
  RecentOrdersIllustration,
  QuickActionsIllustration,
} from '../../assets/illustrations/stats';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;

// Animated Progress Bar Component
const AnimatedProgressBar = ({ progress, color }: { progress: number; color: string }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(progress, 100),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

// Stat Card with trend indicator
interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  trend?: number;
  onPress?: () => void;
  isDark: boolean;
  cardBg: string;
  textSecondary: string;
  illustrationType: 'pending' | 'processing' | 'products' | 'lowStock';
}

const StatCard = ({ icon, label, value, color, trend, onPress, isDark, cardBg, textSecondary, illustrationType }: StatCardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  // Get gradient colors based on the stat color
  const getGradientColors = (baseColor: string): [string, string, string] => {
    if (baseColor === COLORS.warning) return ['#FFB347', '#FF9500', '#E67E00'];
    if (baseColor === COLORS.info) return ['#5AC8FA', '#007AFF', '#0056B3'];
    if (baseColor === COLORS.primary) return ['#7ED957', COLORS.primary, '#2E7D32'];
    if (baseColor === COLORS.error) return ['#FF6B6B', '#FF3B30', '#C62828'];
    return [baseColor, baseColor, baseColor];
  };

  // Get accent color for glow/highlights
  const getAccentColor = (baseColor: string): string => {
    if (baseColor === COLORS.warning) return '#FFE0B2';
    if (baseColor === COLORS.info) return '#BBDEFB';
    if (baseColor === COLORS.primary) return '#C8E6C9';
    if (baseColor === COLORS.error) return '#FFCDD2';
    return baseColor;
  };

  // Render the appropriate illustration
  const renderIllustration = () => {
    const size = 64;
    switch (illustrationType) {
      case 'pending':
        return <PendingOrdersIllustration width={size} height={size} />;
      case 'processing':
        return <ProcessingOrdersIllustration width={size} height={size} />;
      case 'products':
        return <InventoryIllustration width={size} height={size} />;
      case 'lowStock':
        return <LowStockIllustration width={size} height={size} />;
      default:
        return <PendingOrdersIllustration width={size} height={size} />;
    }
  };

  const gradientColors = getGradientColors(color);
  const accentColor = getAccentColor(color);
  
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View 
        style={[
          styles.statCard, 
          { 
            backgroundColor: cardBg, 
            transform: [{ scale: scaleAnim }],
            borderColor: isDark ? 'transparent' : '#F0F0F0',
            borderWidth: 1,
          }
        ]}
      >
        {/* Header with Illustration */}
        <View style={[styles.statCardHeader, { backgroundColor: `${color}12` }]}>
          <View style={styles.statCardIllustrationContainer}>
            {renderIllustration()}
          </View>
        </View>
        
        {/* Content */}
        <View style={[styles.statCardContent, { backgroundColor: isDark ? cardBg : '#FFFFFF' }]}>
          <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : color }]}>
            {formatNumber(value)}
          </Text>
          <Text style={[styles.statLabel, { color: textSecondary }]}>{label}</Text>
          
          {trend !== undefined && trend !== 0 && (
            <View style={[
              styles.trendBadge, 
              { 
                backgroundColor: trend > 0 ? `${COLORS.success}15` : `${COLORS.error}15`,
                borderColor: trend > 0 ? `${COLORS.success}30` : `${COLORS.error}30`,
                borderWidth: 1,
              }
            ]}>
              <Ionicons 
                name={trend > 0 ? 'trending-up' : 'trending-down'} 
                size={12} 
                color={trend > 0 ? COLORS.success : COLORS.error} 
              />
              <Text style={[styles.trendText, { color: trend > 0 ? COLORS.success : COLORS.error }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
          
          {/* Tap indicator */}
          <View style={styles.statCardTapHint}>
            <Ionicons name="chevron-forward" size={14} color={textSecondary} />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const { dashboardStats, pendingOrdersCount, unreadOrdersCount } = useAppSelector((state) => state.farmer);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [verifiedBannerDismissed, setVerifiedBannerDismissed] = useState(false);
  
  // Storage key for verified banner dismissal
  const VERIFIED_BANNER_STORAGE_KEY = 'verified_banner_dismissed';
  
  // Initialize farmer socket for real-time updates
  const { isConnected, newOrderNotifications } = useFarmerSocket();
  
  // Check if verified banner was dismissed
  useEffect(() => {
    const checkBannerDismissed = async () => {
      try {
        const dismissedData = await AsyncStorage.getItem(VERIFIED_BANNER_STORAGE_KEY);
        if (dismissedData) {
          const { dismissed, timestamp } = JSON.parse(dismissedData);
          // Banner will reappear after 7 days of being dismissed
          const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          if (dismissed && (now - timestamp) < sevenDaysInMs) {
            setVerifiedBannerDismissed(true);
          } else {
            // Reset after 7 days
            await AsyncStorage.removeItem(VERIFIED_BANNER_STORAGE_KEY);
            setVerifiedBannerDismissed(false);
          }
        }
      } catch (error) {
        console.error('Failed to check banner dismissal:', error);
      }
    };
    checkBannerDismissed();
  }, []);
  
  // Handle dismissing the verified banner
  const handleDismissVerifiedBanner = async () => {
    try {
      await AsyncStorage.setItem(
        VERIFIED_BANNER_STORAGE_KEY,
        JSON.stringify({ dismissed: true, timestamp: Date.now() })
      );
      setVerifiedBannerDismissed(true);
    } catch (error) {
      console.error('Failed to dismiss banner:', error);
    }
  };
  
  // Fetch unread messages count
  const fetchUnreadMessagesCount = useCallback(async () => {
    try {
      const conversations = await chatService.getConversations();
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadMessagesCount(totalUnread);
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchUnreadMessagesCount();
  }, [fetchUnreadMessagesCount]);
  
  // Listen for new order notifications
  useNewOrderNotifications((notification) => {
    // Optionally show a toast or alert for new orders
    if (notification?.orderId) {
      console.log('New order received:', notification.orderId);
    }
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

  // Fetch orders - get more for accurate stats
  const { 
    data: ordersData, 
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: () => orderService.getOrders({
      page: 1,
      limit: 50, // Fetch more orders for accurate pending/processing counts
    }),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
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
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
  });

  // Fetch earnings summary
  const {
    data: earningsData,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: ['farmer-earnings'],
    queryFn: () => withdrawalService.getEarningsSummary(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
  });

  // Fetch peak hours
  const { data: peakHoursData, refetch: refetchPeakHours } = useQuery({
    queryKey: ['farmer-peak-hours'],
    queryFn: () => farmerAnalyticsService.getPeakHours(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: true,
  });

  // Fetch revenue goal
  const { data: revenueGoalData, refetch: refetchGoal } = useQuery({
    queryKey: ['farmer-revenue-goal'],
    queryFn: () => farmerAnalyticsService.getRevenueGoal(),
    staleTime: 1 * 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: true,
  });

  // Fetch top products
  const { data: topProductsData, refetch: refetchTopProducts } = useQuery({
    queryKey: ['farmer-top-products-dashboard'],
    queryFn: () => farmerAnalyticsService.getTopProducts(3),
    staleTime: 1 * 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: true,
  });

  // Fetch dashboard stats for trends
  const { data: dashboardData, refetch: refetchDashboard } = useQuery({
    queryKey: ['farmer-dashboard-stats'],
    queryFn: () => farmerAnalyticsService.getDashboard(),
    staleTime: 1 * 60 * 1000, // 1 minute cache
    refetchOnWindowFocus: true,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchOrders(), 
      refetchProducts(), 
      refetchEarnings(), 
      refetchPeakHours(),
      refetchGoal(),
      refetchTopProducts(),
      refetchDashboard(),
    ]);
    setRefreshing(false);
  }, [refetchOrders, refetchProducts, refetchEarnings, refetchPeakHours, refetchGoal, refetchTopProducts, refetchDashboard]);

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refetch all data when screen gains focus
      refetchOrders();
      refetchProducts();
      refetchEarnings();
      refetchPeakHours();
      refetchGoal();
      refetchTopProducts();
      refetchDashboard();
    }, [refetchOrders, refetchProducts, refetchEarnings, refetchPeakHours, refetchGoal, refetchTopProducts, refetchDashboard])
  );

  // De-duplicate orders and products by id to prevent key conflicts
  const rawOrders = (ordersData?.orders || []).filter((o: any) => o != null && o.id != null);
  const orders = useMemo(() => {
    const seen = new Set<string>();
    return rawOrders.filter((order: any) => {
      if (seen.has(order.id)) return false;
      seen.add(order.id);
      return true;
    });
  }, [rawOrders]);
  
  const rawProducts = (productsData?.products || []).filter((p: any) => p != null && p.id != null);
  const productsTotalCount = productsData?.total || 0; // Get total from API response
  const products = useMemo(() => {
    const seen = new Set<string>();
    return rawProducts.filter((product: any) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }, [rawProducts]);
  
  // Calculate stats - use Redux for pending count as it gets real-time updates
  // Pending orders = created or pending status (new orders needing farmer action)
  const pendingOrders = pendingOrdersCount || orders.filter((o: Order) => 
    o?.status === 'pending' || o?.status === 'created'
  ).length;
  // Processing orders = confirmed, assigned, picked_up, in_transit (orders being fulfilled)
  const processingOrders = orders.filter((o: Order) => 
    o?.status === 'confirmed' || o?.status === 'assigned' || 
    o?.status === 'picked_up' || o?.status === 'in_transit' || 
    o?.status === 'ready_for_pickup'
  ).length;
  const totalProducts = productsTotalCount || products.length; // Use API total, fallback to array length
  const lowStockProducts = products.filter((p: Product) => p?.stock < 10).length;

  // Get trend data from dashboard stats
  const ordersTrend = dashboardData?.ordersGrowth ?? 0;
  const revenueTrend = dashboardData?.revenueGrowth ?? 0;

  // Debug logging for dashboard data
  console.log('[DashboardScreen] Raw ordersData:', ordersData);
  console.log('[DashboardScreen] Orders:', orders.length, orders.map((o: Order) => ({ id: o.id, status: o.status })));
  console.log('[DashboardScreen] Products:', products.length);
  console.log('[DashboardScreen] Stats - Pending:', pendingOrders, 'Processing:', processingOrders, 'Total Products:', totalProducts, 'Low Stock:', lowStockProducts);
  console.log('[DashboardScreen] Earnings:', { todayEarnings: earningsData?.todayEarnings, weekEarnings: earningsData?.thisWeekEarnings, monthEarnings: earningsData?.thisMonthEarnings });
  console.log('[DashboardScreen] Dashboard stats:', dashboardData);

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
  const pendingBalance = earningsData?.pendingBalance ?? 0;

  // Revenue goal progress
  const revenueGoal = revenueGoalData?.goal ?? 0;
  const currentRevenue = revenueGoalData?.current ?? monthEarnings;
  const goalProgress = revenueGoal > 0 ? (currentRevenue / revenueGoal) * 100 : 0;

  // Top selling products - filter out any invalid items
  const topProducts = (topProductsData || []).filter((p: any) => p != null && p.id != null);

  const stats: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string; trend?: number; screen?: string; illustrationType: 'pending' | 'processing' | 'products' | 'lowStock' }[] = [
    { icon: 'cube-outline', label: 'Pending Orders', value: pendingOrders, color: COLORS.warning, screen: 'FarmerOrders', illustrationType: 'pending' },
    { icon: 'sync-outline', label: 'Processing', value: processingOrders, color: COLORS.info, trend: ordersTrend, screen: 'FarmerOrders', illustrationType: 'processing' },
    { icon: 'leaf-outline', label: 'Products', value: totalProducts, color: COLORS.primary, screen: 'Products', illustrationType: 'products' },
    { icon: 'alert-circle-outline', label: 'Low Stock', value: lowStockProducts, color: COLORS.error, screen: 'Products', illustrationType: 'lowStock' },
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
          <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>{t('farmer.dashboard')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
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
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Activation Banner */}
        {needsActivation && (
          <TouchableOpacity
            style={[styles.activationBanner, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={() => navigation.navigate('FarmerActivation')}
            activeOpacity={0.9}
          >
            <View style={styles.activationContent}>
              <View style={[styles.activationIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="lock-closed" size={20} color="#FF6B35" />
              </View>
              <View style={styles.activationTextContainer}>
                <Text style={[styles.activationTitle, { color: colors.text }]}>Activate Your Account</Text>
                <Text style={[styles.activationSubtitle, { color: colors.textSecondary }]}>
                  Pay ₦25,000 one-time fee to start listing
                </Text>
              </View>
              <View style={[styles.activationArrow, { backgroundColor: '#FF6B3515' }]}>
                <Ionicons name="chevron-forward" size={18} color="#FF6B35" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Verified Seller Banner - Clean Card */}
        {!user?.isPremium && !needsActivation && !verifiedBannerDismissed && (
          <View style={styles.section}>
            <View style={[styles.verifiedCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FarmerSubscription')}
                activeOpacity={0.9}
              >
                {/* Close Button */}
                <TouchableOpacity
                  style={[styles.verifiedCloseButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]}
                  onPress={handleDismissVerifiedBanner}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <View style={styles.verifiedCardContent}>
                  <View style={styles.verifiedCardLeft}>
                    {/* Premium Badge */}
                    <View style={[styles.verifiedPremiumBadge, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="star" size={10} color="#1976D2" />
                      <Text style={[styles.verifiedPremiumBadgeText, { color: '#1976D2' }]}>PREMIUM</Text>
                    </View>
                    
                    <Text style={[styles.verifiedCardTitle, { color: colors.text }]}>Become a Verified Seller</Text>
                    <Text style={[styles.verifiedCardSubtitle, { color: colors.textSecondary }]}>
                      Stand out and build customer trust
                    </Text>
                    
                    {/* Benefits */}
                    <View style={styles.verifiedBenefitsRow}>
                      <View style={[styles.verifiedBenefitItem, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="checkmark-circle" size={12} color="#1976D2" />
                        <Text style={[styles.verifiedBenefitText, { color: '#1976D2' }]}>Blue Badge</Text>
                      </View>
                      <View style={[styles.verifiedBenefitItem, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="trending-up" size={12} color="#388E3C" />
                        <Text style={[styles.verifiedBenefitText, { color: '#388E3C' }]}>Top Search</Text>
                      </View>
                    </View>
                    
                    {/* CTA Button */}
                    <View style={[styles.verifiedCtaButton, { backgroundColor: '#0284C7' }]}>
                      <Text style={[styles.verifiedCtaText, { color: '#FFFFFF' }]}>Get Verified</Text>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  
                  {/* Illustration */}
                  <View style={styles.verifiedIllustrationContainer}>
                    <View style={[styles.verifiedBadgeIllustration, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="shield-checkmark" size={36} color="#0284C7" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Live Support Banner */}
        <LiveSupportBanner variant="minimal" style={{ marginHorizontal: 16, marginTop: 12 }} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              trend={stat.trend}
              isDark={isDark}
              cardBg={isDark ? colors.card : '#FFFFFF'}
              textSecondary={colors.textSecondary}
              onPress={stat.screen ? () => navigation.navigate(stat.screen as any) : undefined}
              illustrationType={stat.illustrationType}
            />
          ))}
        </View>

        {/* Revenue Goal Progress Card - Clean Style */}
        {revenueGoal > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.goalCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
              onPress={() => navigation.navigate('Analytics')}
              activeOpacity={0.8}
            >
              <View style={[styles.goalCardHeader, { borderBottomColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
                <View style={[styles.goalIconBadge, { backgroundColor: goalProgress >= 100 ? '#E8F5E9' : '#EDE7F6' }]}>
                  <Ionicons 
                    name={goalProgress >= 100 ? 'trophy' : 'flag'} 
                    size={18} 
                    color={goalProgress >= 100 ? '#4CAF50' : '#667eea'} 
                  />
                </View>
                <View style={styles.goalCardHeaderInfo}>
                  <Text style={[styles.goalCardTitle, { color: colors.text }]}>
                    {goalProgress >= 100 ? '🎉 Goal Achieved!' : 'Monthly Revenue Goal'}
                  </Text>
                  <Text style={[styles.goalCardSubtitle, { color: colors.textSecondary }]}>
                    {formatCurrency(currentRevenue)} of {formatCurrency(revenueGoal)}
                  </Text>
                </View>
                <View style={[styles.goalPercentBadge, { backgroundColor: goalProgress >= 100 ? '#E8F5E9' : '#EDE7F6' }]}>
                  <Text style={[styles.goalPercentText, { color: goalProgress >= 100 ? '#4CAF50' : '#667eea' }]}>
                    {Math.round(goalProgress)}%
                  </Text>
                </View>
              </View>
              <View style={styles.goalProgressSection}>
                <AnimatedProgressBar 
                  progress={goalProgress} 
                  color={goalProgress >= 100 ? COLORS.success : '#667eea'} 
                />
                <Text style={[styles.goalMotivation, { color: colors.textSecondary }]}>
                  {goalProgress >= 100 
                    ? 'Amazing work! You crushed your goal this month!' 
                    : goalProgress >= 75 
                      ? 'Almost there! Keep pushing!' 
                      : goalProgress >= 50 
                        ? 'Halfway there! You can do it!' 
                        : 'Every sale counts. Stay focused!'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Balance Card */}
        {pendingBalance > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.pendingBalanceCard, { backgroundColor: isDark ? '#1A3A1A' : '#E8F5E9' }]}
              onPress={() => navigation.navigate('Withdraw')}
              activeOpacity={0.8}
            >
              <View style={styles.pendingBalanceContent}>
                <View style={[styles.pendingBalanceIconContainer, { backgroundColor: isDark ? '#2E7D32' : COLORS.success }]}>
                  <Ionicons name="wallet-outline" size={24} color={COLORS.white} />
                </View>
                <View style={styles.pendingBalanceInfo}>
                  <Text style={[styles.pendingBalanceLabel, { color: isDark ? '#A5D6A7' : '#2E7D32' }]}>
                    Available for Withdrawal
                  </Text>
                  <Text style={[styles.pendingBalanceAmount, { color: isDark ? COLORS.white : '#1B5E20' }]}>
                    {formatCurrency(pendingBalance)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.withdrawButton, { backgroundColor: COLORS.success }]}
                  onPress={() => navigation.navigate('Withdraw')}
                >
                  <Text style={styles.withdrawButtonText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Earnings Summary - Clean White Card */}
        <View style={styles.section}>
          <View style={[styles.earningsMediaCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Header with Illustration */}
            <View style={[styles.earningsCardHeader, { borderBottomColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
              <View style={styles.earningsHeaderLeft}>
                <Text style={[styles.earningsCardTitle, { color: colors.text }]}>Earnings Summary</Text>
                <Text style={[styles.earningsCardSubtitle, { color: colors.textSecondary }]}>Track your income</Text>
              </View>
              <View style={styles.earningsIllustrationContainer}>
                <EarningsCardIllustration width={70} height={70} />
              </View>
            </View>
            
            {/* Main Earnings Amount */}
            <View style={styles.earningsMainAmount}>
              <View style={[styles.earningsAmountBadge, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.earningsAmountLabel, { color: colors.textSecondary }]}>This Month</Text>
                <Text style={[styles.earningsAmountValue, { color: colors.text }]}>{formatCurrency(monthEarnings)}</Text>
              </View>
            </View>
            
            {/* Stats Grid */}
            <View style={[styles.earningsStatsGrid, { borderTopColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
              {/* Today's Earnings */}
              <View style={[styles.earningsStatItem, { borderRightWidth: 1, borderRightColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
                <View style={[styles.earningsStatIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="today" size={16} color="#F59E0B" />
                </View>
                <Text style={[styles.earningsStatLabel, { color: colors.textSecondary }]}>Today</Text>
                <Text style={[styles.earningsStatValue, { color: colors.text }]}>{formatCurrency(todayEarnings)}</Text>
              </View>
              
              {/* This Week */}
              <View style={styles.earningsStatItem}>
                <View style={[styles.earningsStatIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="calendar" size={16} color="#3B82F6" />
                </View>
                <Text style={[styles.earningsStatLabel, { color: colors.textSecondary }]}>This Week</Text>
                <Text style={[styles.earningsStatValue, { color: colors.text }]}>{formatCurrency(weekEarnings)}</Text>
              </View>
            </View>
            
            {/* Withdraw CTA */}
            <TouchableOpacity 
              style={[styles.earningsWithdrawBtn, { backgroundColor: '#10B981' }]}
              onPress={() => navigation.navigate('Withdraw')}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
              <Text style={styles.earningsWithdrawText}>Withdraw Funds</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Peak Hours Widget - Clean White Card */}
        {peakHoursData && peakHoursData.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.peakHoursEnhancedCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              {/* Header with Illustration */}
              <View style={[styles.peakHoursCardHeader, { borderBottomColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
                <View style={styles.peakHoursHeaderLeft}>
                  <View style={styles.peakHoursLabelRow}>
                    <View style={[styles.peakHoursInsightBadge, { backgroundColor: '#F3E8FF' }]}>
                      <Ionicons name="analytics" size={12} color="#8B5CF6" />
                      <Text style={styles.peakHoursInsightText}>INSIGHTS</Text>
                    </View>
                  </View>
                  <Text style={[styles.peakHoursCardTitle, { color: colors.text }]}>Peak Selling Hours</Text>
                  <Text style={[styles.peakHoursCardSubtitle, { color: colors.textSecondary }]}>Maximize your sales</Text>
                </View>
                <View style={styles.peakHoursIllustration}>
                  <PeakHoursIllustration width={70} height={70} />
                </View>
              </View>
              
              {/* Stats Summary Bar */}
              <View style={[styles.peakHoursSummaryBar, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#FAFAFA' }]}>
                <View style={styles.peakHoursSummaryItem}>
                  <Text style={[styles.peakHoursSummaryValue, { color: colors.text }]}>
                    {peakHoursData.reduce((sum: number, p: any) => sum + (p.orders || 0), 0)}
                  </Text>
                  <Text style={[styles.peakHoursSummaryLabel, { color: colors.textSecondary }]}>Total Orders</Text>
                </View>
                <View style={[styles.peakHoursSummaryDivider, { backgroundColor: isDark ? '#3D3D3D' : '#E5E5EA' }]} />
                <View style={styles.peakHoursSummaryItem}>
                  <Text style={[styles.peakHoursSummaryValue, { color: colors.text }]}>
                    {formatCurrency(peakHoursData.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0))}
                  </Text>
                  <Text style={[styles.peakHoursSummaryLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
                </View>
              </View>
              
              {/* Peak Hours List */}
              <View style={styles.peakHoursListBody}>
                {peakHoursData.slice(0, 3).map((peak: any, index: number) => {
                  const hour = peak.hour;
                  const period = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                  const maxRevenue = Math.max(...peakHoursData.slice(0, 3).map((p: any) => p.revenue || 0));
                  const barWidth = maxRevenue > 0 ? ((peak.revenue || 0) / maxRevenue) * 100 : 0;
                  const rankColors = ['#FFB300', '#94A3B8', '#CD7F32'];
                  const rankIcons = ['trophy', 'medal', 'ribbon'] as const;
                  
                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.peakHoursListItem,
                        index < 2 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#2D2D2D' : '#F0F0F0' }
                      ]}
                    >
                      {/* Rank */}
                      <View style={[styles.peakHoursRankIcon, { backgroundColor: `${rankColors[index]}20` }]}>
                        <Ionicons name={rankIcons[index]} size={16} color={rankColors[index]} />
                      </View>
                      
                      {/* Time & Orders */}
                      <View style={styles.peakHoursTimeInfo}>
                        <Text style={[styles.peakHoursTime, { color: colors.text }]}>
                          {displayHour}:00 {period}
                        </Text>
                        <Text style={[styles.peakHoursOrders, { color: colors.textSecondary }]}>
                          {peak.orders || 0} orders
                        </Text>
                      </View>
                      
                      {/* Revenue & Progress */}
                      <View style={styles.peakHoursRevenueInfo}>
                        <Text style={[styles.peakHoursRevenue, { color: colors.text }]}>
                          {formatCurrency(peak.revenue || 0)}
                        </Text>
                        <View style={[styles.peakHoursProgressBg, { backgroundColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
                          <View style={[styles.peakHoursProgressBar, { width: `${barWidth}%`, backgroundColor: rankColors[index] }]} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
              
              {/* Pro Tip Footer */}
              <View style={[styles.peakHoursFooter, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.06)' : '#F9FAFB' }]}>
                <View style={[styles.peakHoursTipIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="bulb" size={14} color="#8B5CF6" />
                </View>
                <View style={styles.peakHoursTipContent}>
                  <Text style={[styles.peakHoursTipText, { color: colors.textSecondary }]}>
                    Run flash sales during peak hours to boost conversions!
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Top Selling Products - Clean White Card */}
        {topProducts.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.topSellersCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              {/* Header */}
              <View style={[styles.topSellersCardHeader, { borderBottomColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
                <View style={styles.topSellersHeaderLeft}>
                  <View style={[styles.topSellersBadge, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="trophy" size={12} color="#FF8F00" />
                    <Text style={[styles.topSellersBadgeText, { color: '#FF8F00' }]}>TOP PERFORMERS</Text>
                  </View>
                  <Text style={[styles.topSellersCardTitle, { color: colors.text }]}>Best Sellers</Text>
                  <Text style={[styles.topSellersCardSubtitle, { color: colors.textSecondary }]}>Highest performing products</Text>
                </View>
                <View style={styles.topSellersIllustrationWrapper}>
                  <TopSellersIllustration width={65} height={65} />
                </View>
              </View>
              
              {/* Products List */}
              <View style={styles.topSellersProductsList}>
                {topProducts.slice(0, 3).map((product: any, index: number) => {
                  if (!product || !product.id) return null;
                  
                  // Handle image URL
                  let imageUrl: string | null = null;
                  const rawImage = product.images?.[0];
                  if (rawImage) {
                    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
                      imageUrl = rawImage;
                    } else {
                      imageUrl = `${API_CONFIG.BASE_URL.replace('/api/v1', '')}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
                    }
                  }
                  
                  const rankConfig = [
                    { color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.15)', icon: 'trophy', label: '1st' },
                    { color: '#C0C0C0', bgColor: 'rgba(192, 192, 192, 0.15)', icon: 'medal', label: '2nd' },
                    { color: '#CD7F32', bgColor: 'rgba(205, 127, 50, 0.15)', icon: 'ribbon', label: '3rd' },
                  ];
                  const rank = rankConfig[index];
                  
                  // Calculate progress bar width based on sales (relative to top seller)
                  const maxSales = Math.max(...topProducts.map((p: any) => p.sales || 0));
                  const progressWidth = maxSales > 0 ? ((product.sales || 0) / maxSales) * 100 : 0;
                  
                  return (
                    <TouchableOpacity
                      key={product.id || `product-${index}`}
                      style={[
                        styles.topSellerProductItem,
                        index < Math.min(topProducts.length, 3) - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }
                      ]}
                      onPress={() => product.id && navigation.navigate('ProductAnalyticsDetail', { productId: product.id })}
                      activeOpacity={0.7}
                    >
                      {/* Rank Badge */}
                      <View style={[styles.topSellerRankBadge, { backgroundColor: rank.bgColor }]}>
                        <Ionicons name={rank.icon as any} size={16} color={rank.color} />
                        <Text style={[styles.topSellerRankLabel, { color: rank.color }]}>{rank.label}</Text>
                      </View>
                      
                      {/* Product Image */}
                      <View style={styles.topSellerImageWrapper}>
                        {imageUrl ? (
                          <Image 
                            source={{ uri: imageUrl }} 
                            style={styles.topSellerProductImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.topSellerImagePlaceholder, { backgroundColor: isDark ? '#3A3A3C' : '#F0F0F0' }]}>
                            <Ionicons name="leaf" size={22} color={COLORS.primary} />
                          </View>
                        )}
                        {/* Image border glow for top seller */}
                        {index === 0 && (
                          <View style={styles.topSellerImageGlow} />
                        )}
                      </View>
                      
                      {/* Product Info */}
                      <View style={styles.topSellerProductInfo}>
                        <Text style={[styles.topSellerProductName, { color: colors.text }]} numberOfLines={1}>
                          {product.title || product.name}
                        </Text>
                        
                        {/* Sales Progress Bar */}
                        <View style={styles.topSellerProgressContainer}>
                          <View style={[styles.topSellerProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                            <LinearGradient
                              colors={[rank.color, index === 0 ? '#FFA000' : rank.color]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[styles.topSellerProgressFill, { width: `${progressWidth}%` }]}
                            />
                          </View>
                          <Text style={[styles.topSellerSalesCount, { color: colors.textSecondary }]}>
                            {product.sales || 0} units
                          </Text>
                        </View>
                        
                        {/* Revenue & Growth */}
                        <View style={styles.topSellerMetrics}>
                          <Text style={[styles.topSellerRevenue, { color: COLORS.success }]}>
                            {formatCurrency(product.revenue || 0)}
                          </Text>
                          {product.growth !== undefined && product.growth !== 0 && (
                            <View style={[
                              styles.topSellerGrowthBadge,
                              { backgroundColor: product.growth > 0 ? 'rgba(76, 175, 80, 0.12)' : 'rgba(244, 67, 54, 0.12)' }
                            ]}>
                              <Ionicons 
                                name={product.growth > 0 ? 'trending-up' : 'trending-down'} 
                                size={11} 
                                color={product.growth > 0 ? COLORS.success : COLORS.error} 
                              />
                              <Text style={[
                                styles.topSellerGrowthText,
                                { color: product.growth > 0 ? COLORS.success : COLORS.error }
                              ]}>
                                {Math.abs(product.growth)}%
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Recent Orders - Clean White Card */}
        <View style={styles.section}>
          <View style={[styles.recentOrdersCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Header */}
            <View style={[styles.recentOrdersCardHeader, { borderBottomColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
              <View style={styles.recentOrdersHeaderLeft}>
                <View style={[styles.recentOrdersBadge, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="time" size={12} color="#1976D2" />
                  <Text style={[styles.recentOrdersBadgeText, { color: '#1976D2' }]}>LATEST ACTIVITY</Text>
                </View>
                <Text style={[styles.recentOrdersCardTitle, { color: colors.text }]}>Recent Orders</Text>
                <Text style={[styles.recentOrdersCardSubtitle, { color: colors.textSecondary }]}>
                  {orders.length > 0 
                    ? `${orders.length} order${orders.length > 1 ? 's' : ''} in queue`
                    : 'No pending orders'}
                </Text>
              </View>
              <View style={styles.recentOrdersIllustrationWrapper}>
                <RecentOrdersIllustration width={65} height={65} />
              </View>
            </View>
            
            {/* Orders List */}
            <View style={styles.recentOrdersList}>
              {orders.length > 0 ? (
                orders.slice(0, 3).filter((order): order is Order => order != null && order.id != null).map((order: Order, index: number) => {
                  const statusConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
                    pending: { color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.12)', icon: 'time-outline' },
                    created: { color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.12)', icon: 'create-outline' },
                    confirmed: { color: '#2196F3', bgColor: 'rgba(33, 150, 243, 0.12)', icon: 'checkmark-circle-outline' },
                    preparing: { color: '#9C27B0', bgColor: 'rgba(156, 39, 176, 0.12)', icon: 'restaurant-outline' },
                    ready_for_pickup: { color: '#00BCD4', bgColor: 'rgba(0, 188, 212, 0.12)', icon: 'bag-check-outline' },
                    rider_assigned: { color: '#3F51B5', bgColor: 'rgba(63, 81, 181, 0.12)', icon: 'bicycle-outline' },
                    picked_up: { color: '#009688', bgColor: 'rgba(0, 150, 136, 0.12)', icon: 'car-outline' },
                    in_transit: { color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.12)', icon: 'navigate-outline' },
                    delivered: { color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.12)', icon: 'checkmark-done-outline' },
                    cancelled: { color: '#F44336', bgColor: 'rgba(244, 67, 54, 0.12)', icon: 'close-circle-outline' },
                  };
                  const status = statusConfig[order.status] || statusConfig.pending;
                  
                  const statusLabels: Record<string, string> = {
                    pending: 'Pending',
                    created: 'Processing',
                    confirmed: 'Confirmed',
                    preparing: 'Preparing',
                    ready_for_pickup: 'Ready',
                    rider_assigned: 'Rider Assigned',
                    picked_up: 'Picked Up',
                    in_transit: 'In Transit',
                    delivered: 'Delivered',
                    cancelled: 'Cancelled',
                  };
                  
                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHours < 24) return `${diffHours}h ago`;
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  };
                  
                  return (
                    <TouchableOpacity
                      key={order.id}
                      style={[
                        styles.recentOrderItem,
                        index < Math.min(orders.length, 3) - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }
                      ]}
                      onPress={() => navigation.navigate('FarmerOrderDetail', { orderId: order.id })}
                      activeOpacity={0.7}
                    >
                      {/* Status Icon */}
                      <View style={[styles.recentOrderStatusIcon, { backgroundColor: status.bgColor }]}>
                        <Ionicons name={status.icon as any} size={20} color={status.color} />
                      </View>
                      
                      {/* Order Info */}
                      <View style={styles.recentOrderInfo}>
                        <View style={styles.recentOrderTopRow}>
                          <Text style={[styles.recentOrderId, { color: colors.text }]}>
                            #{order.id.slice(-6)}
                          </Text>
                          <View style={[styles.recentOrderStatusBadge, { backgroundColor: status.bgColor }]}>
                            <Text style={[styles.recentOrderStatusText, { color: status.color }]}>
                              {statusLabels[order.status] || 'Pending'}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={[styles.recentOrderItems, { color: colors.textSecondary }]} numberOfLines={1}>
                          {order.items.length} item{order.items.length > 1 ? 's' : ''} • {(order.items || []).map((item: any) => item.title || item.productName || 'Item').slice(0, 2).join(', ')}
                          {order.items.length > 2 ? '...' : ''}
                        </Text>
                        
                        <View style={styles.recentOrderBottomRow}>
                          <Text style={[styles.recentOrderAmount, { color: COLORS.success }]}>
                            ₦{Number(order.total || 0).toLocaleString()}
                          </Text>
                          <Text style={[styles.recentOrderTime, { color: colors.textSecondary }]}>
                            {formatDate(order.createdAt)}
                          </Text>
                        </View>
                      </View>
                      
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.recentOrdersEmpty}>
                  <View style={[styles.recentOrdersEmptyIcon, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)' }]}>
                    <Ionicons name="cube-outline" size={32} color="#1E88E5" />
                  </View>
                  <Text style={[styles.recentOrdersEmptyTitle, { color: colors.text }]}>No orders yet</Text>
                  <Text style={[styles.recentOrdersEmptyText, { color: colors.textSecondary }]}>
                    When customers place orders, they'll appear here
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Low Stock Alert */}
        {lowStockProducts > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
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

        {/* Quick Actions - Clean Card Style */}
        <View style={styles.section}>
          <View style={[styles.quickActionsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Header */}
            <View style={[styles.quickActionsCardHeader, { borderBottomColor: isDark ? '#2D2D2D' : '#F0F0F0' }]}>
              <View style={styles.quickActionsHeaderLeft}>
                <View style={[styles.quickActionsBadge, { backgroundColor: '#EDE7F6' }]}>
                  <Ionicons name="flash" size={10} color="#7C3AED" />
                  <Text style={[styles.quickActionsBadgeText, { color: '#7C3AED' }]}>SHORTCUTS</Text>
                </View>
                <Text style={[styles.quickActionsCardTitle, { color: colors.text }]}>Quick Actions</Text>
                <Text style={[styles.quickActionsCardSubtitle, { color: colors.textSecondary }]}>Manage your farm with one tap</Text>
              </View>
              <View style={styles.quickActionsIllustrationWrapper}>
                <QuickActionsIllustration width={65} height={65} />
              </View>
            </View>
            
            {/* Actions Grid */}
            <View style={styles.quickActionsGrid}>
              {/* Row 1 */}
              <View style={styles.quickActionsRow}>
                {/* Add Product */}
                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('AddProduct')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconClean, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="add-circle" size={22} color="#4CAF50" />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>Add Product</Text>
                  <Text style={[styles.quickActionHint, { color: colors.textSecondary }]}>New listing</Text>
                </TouchableOpacity>
                
                {/* View Orders */}
                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('FarmerOrders')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconClean, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="clipboard" size={20} color="#1976D2" />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>Orders</Text>
                  <Text style={[styles.quickActionHint, { color: colors.textSecondary }]}>View all</Text>
                </TouchableOpacity>
                
                {/* Withdraw */}
                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('Withdraw')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconClean, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="wallet" size={20} color="#F57C00" />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>Withdraw</Text>
                  <Text style={[styles.quickActionHint, { color: colors.textSecondary }]}>Get paid</Text>
                </TouchableOpacity>
              </View>
              
              {/* Separator */}
              <View style={[styles.quickActionsGridSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
              
              {/* Row 2 */}
              <View style={styles.quickActionsRow}>
                {/* Analytics */}
                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('Analytics')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconClean, { backgroundColor: '#F3E5F5' }]}>
                    <Ionicons name="stats-chart" size={20} color="#8E24AA" />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>Analytics</Text>
                  <Text style={[styles.quickActionHint, { color: colors.textSecondary }]}>Insights</Text>
                </TouchableOpacity>
                
                {/* Products */}
                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('FarmerProducts')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconClean, { backgroundColor: '#E0F7FA' }]}>
                    <Ionicons name="leaf" size={20} color="#00ACC1" />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>Products</Text>
                  <Text style={[styles.quickActionHint, { color: colors.textSecondary }]}>Manage</Text>
                </TouchableOpacity>
                
                {/* Support */}
                <TouchableOpacity
                  style={styles.quickActionItem}
                  onPress={() => navigation.navigate('LiveChat' as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconClean, { backgroundColor: '#FCE4EC' }]}>
                    <Ionicons name="headset" size={20} color="#D81B60" />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>Support</Text>
                  <Text style={[styles.quickActionHint, { color: colors.textSecondary }]}>Get help</Text>
                </TouchableOpacity>
              </View>
            </View>
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
        {unreadMessagesCount > 0 && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Floating Social Menu */}
      <FloatingSocialMenu isFarmer={true} />
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
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  statCardHeader: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  statCardDecoCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  statCardDecoCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  statCardIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statCardSeparator: {
    height: 2,
    marginTop: -1,
  },
  statCardContent: {
    padding: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    alignItems: 'center',
    position: 'relative',
  },
  statCardAccentBar: {
    position: 'absolute',
    top: 0,
    left: SPACING.lg,
    right: SPACING.lg,
    height: 2,
    borderRadius: 1,
    opacity: 0.2,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statCardTapHint: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    opacity: 0.4,
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
  // Clean Earnings Card Styles
  earningsMediaCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  earningsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  earningsCardTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  earningsCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  earningsHeaderLeft: {
    flex: 1,
  },
  earningsIllustrationContainer: {
    marginLeft: SPACING.sm,
  },
  earningsMainAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  earningsAmountBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsAmountLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  earningsAmountValue: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  earningsStatsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: SPACING.md,
  },
  earningsStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  earningsStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  earningsStatLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  earningsStatValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '600',
  },
  earningsWithdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  earningsWithdrawText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
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
  activationBanner: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: SPACING.md,
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
    borderRadius: 12,
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
  // Enhanced Verified Seller Card Styles
  verifiedEnhancedCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  verifiedEnhancedGradient: {
    padding: SPACING.lg,
    paddingBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  verifiedCloseButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  verifiedDecorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  verifiedDecorCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  verifiedEnhancedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedEnhancedLeft: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  verifiedPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  verifiedPremiumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFD700',
    letterSpacing: 0.8,
  },
  verifiedEnhancedTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  verifiedEnhancedSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  verifiedBenefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  verifiedBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBenefitText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  verifiedCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  verifiedCtaText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#0284C7',
  },
  verifiedIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadgeIllustration: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadgeOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  verifiedBadgeInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  verifiedSparkle: {
    position: 'absolute',
  },
  // Legacy verified banner styles (kept for reference)
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
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  sparklineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sparklineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparklineTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  sparklineSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sparklineLegendContainer: {
    alignItems: 'flex-end',
    gap: 4,
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
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  sparklineSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  sparklineSummaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  sparklineSummaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  sparklineSummaryLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
  },
  sparklineSummaryDivider: {
    width: 1,
    height: 36,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingTop: SPACING.sm,
  },
  sparklineBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  sparklineBar: {
    width: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    minHeight: 4,
  },
  sparklineBarCurrent: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  sparklineBarValue: {
    fontSize: 8,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  sparklineLabel: {
    fontSize: 9,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sparklineCurrentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
    gap: 6,
  },
  sparklineCurrentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sparklineCurrentText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  // Clean Peak Hours Card styles
  peakHoursEnhancedCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  peakHoursCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  peakHoursHeaderLeft: {
    flex: 1,
  },
  peakHoursLabelRow: {
    marginBottom: 6,
  },
  peakHoursInsightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  peakHoursInsightText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 0.5,
  },
  peakHoursCardTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  peakHoursCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  peakHoursIllustration: {
    marginLeft: SPACING.sm,
  },
  peakHoursSummaryBar: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  peakHoursSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  peakHoursSummaryValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  peakHoursSummaryLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  peakHoursSummaryDivider: {
    width: 1,
    marginVertical: 4,
  },
  peakHoursListBody: {
    paddingHorizontal: SPACING.md,
  },
  peakHoursListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  peakHoursRankIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  peakHoursTimeInfo: {
    flex: 1,
  },
  peakHoursTime: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  peakHoursOrders: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  peakHoursRevenueInfo: {
    alignItems: 'flex-end',
  },
  peakHoursRevenue: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 4,
  },
  peakHoursProgressBg: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  peakHoursProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  peakHoursFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 10,
  },
  peakHoursTipIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peakHoursTipContent: {
    flex: 1,
  },
  peakHoursTipText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  // Keep old styles for backwards compatibility
  peakHourMedal: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  peakHourInfo: {
    flex: 1,
  },
  peakHourStats: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // StatCard enhanced styles
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: SPACING.xs,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Progress bar styles
  progressBarContainer: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Goal card styles
  goalCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  goalGradientHeader: {
    padding: SPACING.md,
  },
  goalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
  },
  goalPercentContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPercent: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  goalProgressSection: {
    padding: SPACING.md,
  },
  goalMotivation: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  // Pending balance styles
  pendingBalanceCard: {
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  pendingBalanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  pendingBalanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pendingBalanceInfo: {
    flex: 1,
  },
  pendingBalanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  pendingBalanceAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  withdrawButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  withdrawButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  // Enhanced Top Sellers Card Styles
  topSellersEnhancedCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  topSellersHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  topSellersHeaderDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topSellersCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  topSellersHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topSellersHeaderLeft: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  topSellersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    gap: 5,
  },
  topSellersBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  topSellersTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  topSellersSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  topSellersViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  topSellersViewAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  topSellersIllustrationWrapper: {
    position: 'relative',
  },
  topSellersProductsList: {
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  topSellerProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  topSellerRankBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  topSellerRankLabel: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginTop: 1,
  },
  topSellerImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: SPACING.md,
    position: 'relative',
    ...SHADOWS.small,
  },
  topSellerProductImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  topSellerImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  topSellerImageGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  topSellerProductInfo: {
    flex: 1,
  },
  topSellerProductName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 6,
  },
  topSellerProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  topSellerProgressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  topSellerProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  topSellerSalesCount: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    minWidth: 50,
  },
  topSellerMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topSellerRevenue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  topSellerGrowthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
  },
  topSellerGrowthText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Enhanced Recent Orders Card Styles
  recentOrdersEnhancedCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  recentOrdersHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  recentOrdersHeaderDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  recentOrdersCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  recentOrdersHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentOrdersHeaderLeft: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  recentOrdersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    gap: 5,
  },
  recentOrdersBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  recentOrdersTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recentOrdersSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  recentOrdersViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  recentOrdersViewAllText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  recentOrdersIllustrationWrapper: {
    position: 'relative',
  },
  recentOrdersList: {
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  recentOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  recentOrderStatusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  recentOrderInfo: {
    flex: 1,
  },
  recentOrderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recentOrderId: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  recentOrderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recentOrderStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  recentOrderItems: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginBottom: 6,
  },
  recentOrderBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentOrderAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  recentOrderTime: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  recentOrdersEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 1.5,
    paddingHorizontal: SPACING.lg,
  },
  recentOrdersEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  recentOrdersEmptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  recentOrdersEmptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Enhanced Quick Actions Styles
  quickActionsEnhancedCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  quickActionsHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  quickActionsHeaderDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  quickActionsCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
  },
  quickActionsHeaderContent: {
    alignItems: 'flex-start',
  },
  quickActionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: SPACING.sm,
    gap: 5,
  },
  quickActionsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  quickActionsTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionsSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  quickActionsGrid: {
    paddingVertical: SPACING.md,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  quickActionsGridSeparator: {
    height: 1,
    marginHorizontal: SPACING.lg,
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - SPACING.md * 4) / 3,
  },
  quickActionIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  quickActionHint: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  // Legacy top products styles (kept for reference)
  topProductsCard: {
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  topProductItemBorder: {
    borderBottomWidth: 1,
  },
  topProductRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  topProductRankText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  topProductImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: SPACING.sm,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    ...SHADOWS.small,
  },
  topProductImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topProductImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  topProductStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topProductSales: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  topProductDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.gray,
    marginHorizontal: 6,
  },
  topProductRevenue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  topProductGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: SPACING.sm,
    gap: 2,
  },
  topProductGrowthText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // iOS Grouped Cards Style
  iosGroupedHeader: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
    textTransform: 'uppercase',
  },
  iosGroupedCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iosGroupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  iosGroupedIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iosGroupedRowText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  iosGroupedSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58, // Aligned with text start (icon container + margin)
  },
  // Clean Card Styles for Goal Card
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  goalIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalCardHeaderInfo: {
    flex: 1,
  },
  goalCardTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalCardSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  goalPercentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: SPACING.sm,
  },
  goalPercentText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  // Clean Card Styles for Top Sellers
  topSellersCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  topSellersCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  topSellersCardTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  topSellersCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  // Clean Card Styles for Recent Orders
  recentOrdersCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  recentOrdersCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  recentOrdersCardTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  recentOrdersCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  // Clean Card Styles for Verified Banner
  verifiedCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    position: 'relative',
  },
  verifiedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  verifiedCardLeft: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  verifiedCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  verifiedCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  // Clean Activation Banner Styles
  activationArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Clean Quick Actions Card Styles
  quickActionsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  quickActionsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  quickActionsHeaderLeft: {
    flex: 1,
  },
  quickActionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 4,
  },
  quickActionsBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quickActionsIllustrationWrapper: {
    marginLeft: SPACING.sm,
  },
  quickActionsIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionsHeaderInfo: {
    flex: 1,
  },
  quickActionsCardTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickActionsCardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  quickActionIconClean: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
});
