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
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ProductPlusIcon } from '../../assets/icons';
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
import { triggerHaptic } from '../../utils/haptics';
import {
  PendingOrdersIllustration,
  ProcessingOrdersIllustration,
  InventoryIllustration,
  LowStockIllustration,
  PeakHoursIllustration,
  EarningsCardIllustration,
  TopSellersIllustration,
  RecentOrdersIllustration,
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

// Stat Card with trend indicator - iOS Style
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
      toValue: 0.97,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  // Get SVG gradient colors based on stat type
  const getSvgColors = () => {
    switch (illustrationType) {
      case 'pending': return { primary: '#FF9500', secondary: '#FFCC00' };
      case 'processing': return { primary: '#007AFF', secondary: '#5AC8FA' };
      case 'products': return { primary: '#34C759', secondary: '#30D158' };
      case 'lowStock': return { primary: '#FF3B30', secondary: '#FF6961' };
      default: return { primary: color, secondary: color };
    }
  };

  const svgColors = getSvgColors();
  
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View 
        style={[
          styles.iosStatCard, 
          { 
            backgroundColor: isDark ? cardBg : '#FFFFFF',
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* SVG Background Pattern */}
        <View style={styles.iosStatCardSvg}>
          <Svg width="100%" height="100%" viewBox="0 0 180 150" preserveAspectRatio="xMaxYMin slice">
            <Defs>
              <SvgLinearGradient id={`statGrad-${illustrationType}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={svgColors.primary} stopOpacity={0.12} />
                <Stop offset="1" stopColor={svgColors.secondary} stopOpacity={0.05} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx="140" cy="20" r="60" fill={`url(#statGrad-${illustrationType})`} />
            <Circle cx="160" cy="100" r="40" fill={svgColors.primary} fillOpacity={0.06} />
            <Circle cx="100" cy="140" r="25" fill={svgColors.secondary} fillOpacity={0.08} />
          </Svg>
        </View>
        
        {/* Icon Container */}
        <View style={[styles.iosStatIconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        
        {/* Value */}
        <Text style={[styles.iosStatValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {formatNumber(value)}
        </Text>
        
        {/* Label */}
        <Text style={[styles.iosStatLabel, { color: textSecondary }]}>{label}</Text>
        
        {/* Trend Badge */}
        {trend !== undefined && trend !== 0 && (
          <View style={[
            styles.iosStatTrend, 
            { backgroundColor: trend > 0 ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)' }
          ]}>
            <Ionicons 
              name={trend > 0 ? 'arrow-up' : 'arrow-down'} 
              size={10} 
              color={trend > 0 ? '#34C759' : '#FF3B30'} 
            />
            <Text style={[styles.iosStatTrendText, { color: trend > 0 ? '#34C759' : '#FF3B30' }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
        
        {/* Chevron */}
        <View style={styles.iosStatChevron}>
          <Ionicons name="chevron-forward" size={14} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(60,60,67,0.3)'} />
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
  const defaultAddress = useAppSelector((state) => state.address.addresses.find(a => a.isDefault));
  const { dashboardStats, pendingOrdersCount, unreadOrdersCount } = useAppSelector((state) => state.farmer);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [verifiedBannerDismissed, setVerifiedBannerDismissed] = useState(false);
  
  // Get location text for header
  const getLocationText = () => {
    if (defaultAddress) {
      const parts = [
        defaultAddress.addressLine1,
        defaultAddress.city,
        defaultAddress.state,
      ].filter(Boolean);
      return parts.join(', ');
    }
    if (user?.businessAddress) {
      return user.businessAddress;
    }
    if (user?.city && user?.state) {
      return `${user.city}, ${user.state}`;
    }
    return user?.city || t('home.selectLocation');
  };
  
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
    { icon: 'storefront-outline', label: 'Products', value: totalProducts, color: COLORS.primary, screen: 'Products', illustrationType: 'products' },
    { icon: 'alert-circle-outline', label: 'Low Stock', value: lowStockProducts, color: COLORS.error, screen: 'Products', illustrationType: 'lowStock' },
  ];

  if (ordersLoading || productsLoading || earningsLoading) {
    return <LoadingState />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header - Address Style */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.topBar}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.locationButton}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic();
                // Navigate to edit profile where farmers can edit their business address
                navigation.navigate('EditProfile' as never);
              }}
            >
              <Ionicons name="location" size={20} color={colors.primary} />
              <View style={styles.locationTextContainer}>
                <View style={styles.locationRow}>
                  <Text 
                    style={[styles.locationText, { color: colors.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getLocationText()}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}
              onPress={() => {
                triggerHaptic();
                navigation.navigate('Notifications');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={26} color={colors.text} />
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
        contentContainerStyle={{ paddingTop: 12 }}
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

        {/* Verified Seller Banner - White Card with SVG */}
        {!user?.isPremium && !needsActivation && !verifiedBannerDismissed && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.verifiedCard, { 
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              }]}
              onPress={() => navigation.navigate('FarmerSubscription')}
              activeOpacity={0.9}
            >
              {/* Background SVG Pattern */}
              <View style={styles.verifiedCardSvgContainer}>
                <Svg width="200" height="200" viewBox="0 0 200 200">
                  <Defs>
                    <SvgLinearGradient id="verifiedBgGrad" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#0EA5E9" stopOpacity={0.12} />
                      <Stop offset="1" stopColor="#0284C7" stopOpacity={0.06} />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Main decorative circle */}
                  <Circle cx="140" cy="60" r="90" fill="url(#verifiedBgGrad)" />
                  {/* Secondary circle */}
                  <Circle cx="100" cy="140" r="50" fill="#06B6D4" fillOpacity={0.08} />
                  {/* Small accent dots */}
                  <Circle cx="60" cy="40" r="6" fill="#0EA5E9" fillOpacity={0.15} />
                  <Circle cx="160" cy="120" r="4" fill="#0284C7" fillOpacity={0.2} />
                  <Circle cx="80" cy="100" r="3" fill="#06B6D4" fillOpacity={0.18} />
                </Svg>
              </View>
              
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
                  <View style={[styles.verifiedPremiumBadge, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="star" size={10} color="#0284C7" />
                    <Text style={[styles.verifiedPremiumBadgeText, { color: '#0284C7' }]}>PREMIUM</Text>
                  </View>
                  
                  <Text style={[styles.verifiedCardTitle, { color: colors.text }]}>Become a Verified Seller</Text>
                  <Text style={[styles.verifiedCardSubtitle, { color: colors.textSecondary }]}>
                    Stand out and build customer trust
                  </Text>
                  
                  {/* Benefits */}
                  <View style={styles.verifiedBenefitsRow}>
                    <View style={[styles.verifiedBenefitItem, { backgroundColor: '#E0F2FE' }]}>
                      <Ionicons name="checkmark-circle" size={12} color="#0284C7" />
                      <Text style={[styles.verifiedBenefitText, { color: '#0284C7' }]}>Blue Badge</Text>
                    </View>
                    <View style={[styles.verifiedBenefitItem, { backgroundColor: '#DCFCE7' }]}>
                      <Ionicons name="trending-up" size={12} color="#16A34A" />
                      <Text style={[styles.verifiedBenefitText, { color: '#16A34A' }]}>Top Search</Text>
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
                  <View style={[styles.verifiedBadgeIllustration, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="shield-checkmark" size={40} color="#0284C7" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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

        {/* Revenue Goal Progress Card - iOS Style */}
        {revenueGoal > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.iosGoalCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
              onPress={() => navigation.navigate('Analytics')}
              activeOpacity={0.9}
            >
              {/* Enhanced SVG Background */}
              <View style={styles.iosGoalCardSvg}>
                <Svg width="100%" height="100%" viewBox="0 0 400 180" preserveAspectRatio="xMaxYMid slice">
                  <Defs>
                    <SvgLinearGradient id="goalGrad1" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor={goalProgress >= 100 ? '#34C759' : '#5856D6'} stopOpacity={0.15} />
                      <Stop offset="1" stopColor={goalProgress >= 100 ? '#30D158' : '#AF52DE'} stopOpacity={0.06} />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="goalGrad2" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={goalProgress >= 100 ? '#34C759' : '#5856D6'} stopOpacity={0.08} />
                      <Stop offset="1" stopColor={goalProgress >= 100 ? '#30D158' : '#BF5AF2'} stopOpacity={0.02} />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Large decorative circles */}
                  <Circle cx="360" cy="30" r="90" fill="url(#goalGrad1)" />
                  <Circle cx="320" cy="140" r="60" fill="url(#goalGrad2)" />
                  <Circle cx="380" cy="100" r="40" fill={goalProgress >= 100 ? '#34C759' : '#5856D6'} fillOpacity={0.06} />
                  {/* Curved wave path */}
                  <Path 
                    d="M0,120 Q100,90 200,110 T400,80" 
                    stroke={goalProgress >= 100 ? '#34C759' : '#5856D6'} 
                    strokeWidth="1.5" 
                    strokeOpacity={0.12}
                    fill="none"
                  />
                  <Path 
                    d="M0,140 Q150,100 300,130 T400,100" 
                    stroke={goalProgress >= 100 ? '#30D158' : '#AF52DE'} 
                    strokeWidth="1" 
                    strokeOpacity={0.08}
                    fill="none"
                  />
                </Svg>
              </View>
              
              {/* Card Header */}
              <View style={styles.iosGoalCardHeader}>
                <View style={styles.iosGoalHeaderLeft}>
                  <View>
                    <Text style={[styles.iosGoalTitle, { color: colors.text }]}>
                      {goalProgress >= 100 ? 'Goal Achieved!' : 'Revenue Goal'}
                    </Text>
                    <Text style={[styles.iosGoalSubtitle, { color: colors.textSecondary }]}>
                      Monthly Target
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.iosGoalPercentBadge, 
                  { backgroundColor: goalProgress >= 100 ? 'rgba(52, 199, 89, 0.15)' : 'rgba(88, 86, 214, 0.12)' }
                ]}>
                  <Text style={[
                    styles.iosGoalPercentText, 
                    { color: goalProgress >= 100 ? '#34C759' : '#5856D6' }
                  ]}>
                    {Math.round(goalProgress)}%
                  </Text>
                </View>
              </View>
              
              {/* Amount Display */}
              <View style={styles.iosGoalAmountRow}>
                <Text style={[styles.iosGoalCurrentAmount, { color: colors.text }]}>
                  {formatCurrency(currentRevenue)}
                </Text>
                <Text style={[styles.iosGoalOfText, { color: colors.textSecondary }]}>of</Text>
                <Text style={[styles.iosGoalTargetAmount, { color: colors.textSecondary }]}>
                  {formatCurrency(revenueGoal)}
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.iosGoalProgressWrapper}>
                <View style={[styles.iosGoalProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                  <Animated.View 
                    style={[
                      styles.iosGoalProgressFill, 
                      { 
                        width: `${Math.min(goalProgress, 100)}%`,
                        backgroundColor: goalProgress >= 100 ? '#34C759' : '#5856D6'
                      }
                    ]} 
                  />
                </View>
              </View>
              
              {/* Motivational Footer */}
              <View style={styles.iosGoalFooter}>
                <Text style={[styles.iosGoalMotivation, { color: colors.textSecondary }]}>
                  {goalProgress >= 100 
                    ? '🎉 Amazing work! You crushed your goal!' 
                    : goalProgress >= 75 
                      ? '💪 Almost there! Keep pushing!' 
                      : goalProgress >= 50 
                        ? '🚀 Halfway there! You can do it!' 
                        : '✨ Every sale counts. Stay focused!'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Balance Card - iOS Style */}
        {pendingBalance > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.iosPendingCard, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.1)' : '#F0FDF4' }]}
              onPress={() => navigation.navigate('Withdraw')}
              activeOpacity={0.9}
            >
              {/* SVG Background */}
              <View style={styles.iosPendingSvg}>
                <Svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="xMaxYMid slice">
                  <Defs>
                    <SvgLinearGradient id="pendingGrad" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#34C759" stopOpacity={0.15} />
                      <Stop offset="1" stopColor="#30D158" stopOpacity={0.05} />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle cx="350" cy="20" r="60" fill="url(#pendingGrad)" />
                  <Circle cx="380" cy="80" r="35" fill="#34C759" fillOpacity={0.08} />
                  <Circle cx="320" cy="90" r="25" fill="#30D158" fillOpacity={0.06} />
                </Svg>
              </View>
              
              <View style={styles.iosPendingContent}>
                <View style={[styles.iosPendingIcon, { backgroundColor: '#34C759' }]}>
                  <Ionicons name="wallet" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.iosPendingInfo}>
                  <Text style={[styles.iosPendingLabel, { color: isDark ? '#86EFAC' : '#166534' }]}>
                    Available for Withdrawal
                  </Text>
                  <Text style={[styles.iosPendingAmount, { color: isDark ? '#FFFFFF' : '#15803D' }]}>
                    {formatCurrency(pendingBalance)}
                  </Text>
                </View>
                <View style={[styles.iosPendingButton, { backgroundColor: '#34C759' }]}>
                  <Text style={styles.iosPendingButtonText}>Withdraw</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Earnings Summary - iOS Style */}
        <View style={styles.section}>
          <View style={[styles.iosEarningsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Enhanced SVG Background */}
            <View style={styles.iosEarningsSvg}>
              <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMin slice">
                <Defs>
                  <SvgLinearGradient id="earningsGrad1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#10B981" stopOpacity={0.12} />
                    <Stop offset="1" stopColor="#34D399" stopOpacity={0.04} />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="earningsGrad2" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#6EE7B7" stopOpacity={0.08} />
                    <Stop offset="1" stopColor="#10B981" stopOpacity={0.02} />
                  </SvgLinearGradient>
                </Defs>
                {/* Decorative circles */}
                <Circle cx="360" cy="40" r="80" fill="url(#earningsGrad1)" />
                <Circle cx="380" cy="120" r="50" fill="url(#earningsGrad2)" />
                <Circle cx="320" cy="180" r="35" fill="#34D399" fillOpacity={0.06} />
                {/* Wave patterns */}
                <Path d="M0,100 Q100,70 200,90 T400,60" stroke="#10B981" strokeWidth="1.5" strokeOpacity={0.1} fill="none" />
                <Path d="M0,130 Q150,100 300,120 T400,90" stroke="#34D399" strokeWidth="1" strokeOpacity={0.06} fill="none" />
              </Svg>
            </View>
            
            {/* Header */}
            <View style={[styles.iosEarningsHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={styles.iosEarningsHeaderLeft}>
                <View>
                  <Text style={[styles.iosEarningsTitle, { color: colors.text }]}>Earnings Summary</Text>
                  <Text style={[styles.iosEarningsSubtitle, { color: colors.textSecondary }]}>Track your income</Text>
                </View>
              </View>
            </View>
            
            {/* Main Amount */}
            <View style={styles.iosEarningsMain}>
              <Text style={[styles.iosEarningsMainLabel, { color: colors.textSecondary }]}>This Month</Text>
              <Text style={[styles.iosEarningsMainValue, { color: '#10B981' }]}>{formatCurrency(monthEarnings)}</Text>
            </View>
            
            {/* Stats Row */}
            <View style={[styles.iosEarningsStatsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
              {/* Today */}
              <View style={styles.iosEarningsStatBox}>
                <View style={[styles.iosEarningsStatIcon, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                  <Ionicons name="sunny" size={14} color="#F59E0B" />
                </View>
                <Text style={[styles.iosEarningsStatLabel, { color: colors.textSecondary }]}>Today</Text>
                <Text style={[styles.iosEarningsStatValue, { color: colors.text }]}>{formatCurrency(todayEarnings)}</Text>
              </View>
              
              {/* Separator */}
              <View style={[styles.iosEarningsStatSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
              
              {/* This Week */}
              <View style={styles.iosEarningsStatBox}>
                <View style={[styles.iosEarningsStatIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Ionicons name="calendar" size={14} color="#3B82F6" />
                </View>
                <Text style={[styles.iosEarningsStatLabel, { color: colors.textSecondary }]}>This Week</Text>
                <Text style={[styles.iosEarningsStatValue, { color: colors.text }]}>{formatCurrency(weekEarnings)}</Text>
              </View>
            </View>
            
            {/* Withdraw Button */}
            <TouchableOpacity 
              style={styles.iosEarningsWithdrawBtn}
              onPress={() => navigation.navigate('Withdraw')}
              activeOpacity={0.9}
            >
              <Text style={styles.iosEarningsWithdrawText}>Withdraw Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Peak Hours Widget - iOS Style */}
        {peakHoursData && peakHoursData.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.iosPeakCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              {/* Enhanced SVG Background */}
              <View style={styles.iosPeakSvg}>
                <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMaxYMin slice">
                  <Defs>
                    <SvgLinearGradient id="peakGrad1" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#8B5CF6" stopOpacity={0.12} />
                      <Stop offset="1" stopColor="#A78BFA" stopOpacity={0.04} />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="peakGrad2" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#C4B5FD" stopOpacity={0.08} />
                      <Stop offset="1" stopColor="#8B5CF6" stopOpacity={0.02} />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle cx="360" cy="50" r="80" fill="url(#peakGrad1)" />
                  <Circle cx="380" cy="150" r="50" fill="url(#peakGrad2)" />
                  <Circle cx="340" cy="220" r="35" fill="#8B5CF6" fillOpacity={0.05} />
                  <Path d="M0,80 Q100,50 200,70 T400,40" stroke="#8B5CF6" strokeWidth="1.5" strokeOpacity={0.08} fill="none" />
                </Svg>
              </View>
              
              {/* Header */}
              <View style={[styles.iosPeakHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={styles.iosPeakHeaderLeft}>
                  <View>
                    <Text style={[styles.iosPeakTitle, { color: colors.text }]}>Peak Selling Hours</Text>
                    <Text style={[styles.iosPeakSubtitle, { color: colors.textSecondary }]}>Maximize your sales</Text>
                  </View>
                </View>
                <View style={[styles.iosPeakInsightBadge, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="analytics" size={12} color="#8B5CF6" />
                  <Text style={styles.iosPeakInsightText}>INSIGHTS</Text>
                </View>
              </View>
              
              {/* Summary Stats */}
              <View style={[styles.iosPeakSummary, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.06)' : '#FAFAFA' }]}>
                <View style={styles.iosPeakSummaryItem}>
                  <Text style={[styles.iosPeakSummaryValue, { color: colors.text }]}>
                    {peakHoursData.reduce((sum: number, p: any) => sum + (p.orders || 0), 0)}
                  </Text>
                  <Text style={[styles.iosPeakSummaryLabel, { color: colors.textSecondary }]}>Total Orders</Text>
                </View>
                <View style={[styles.iosPeakSummarySeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
                <View style={styles.iosPeakSummaryItem}>
                  <Text style={[styles.iosPeakSummaryValue, { color: colors.text }]}>
                    {formatCurrency(peakHoursData.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0))}
                  </Text>
                  <Text style={[styles.iosPeakSummaryLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
                </View>
              </View>
              
              {/* Peak Hours List */}
              <View style={styles.iosPeakList}>
                {peakHoursData.slice(0, 3).map((peak: any, index: number) => {
                  const hour = peak.hour;
                  const period = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                  const maxRevenue = Math.max(...peakHoursData.slice(0, 3).map((p: any) => p.revenue || 0), 1);
                  const barWidth = maxRevenue > 0 ? ((peak.revenue || 0) / maxRevenue) * 100 : 0;
                  const rankColors = ['#FFB300', '#94A3B8', '#CD7F32'];
                  const rankIcons = ['trophy', 'medal', 'ribbon'] as const;
                  
                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.iosPeakListItem,
                        index < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                      ]}
                    >
                      <View style={[styles.iosPeakRank, { backgroundColor: `${rankColors[index]}18` }]}>
                        <Ionicons name={rankIcons[index]} size={14} color={rankColors[index]} />
                      </View>
                      <View style={styles.iosPeakTimeInfo}>
                        <Text style={[styles.iosPeakTime, { color: colors.text }]}>
                          {displayHour}:00 {period}
                        </Text>
                        <Text style={[styles.iosPeakOrders, { color: colors.textSecondary }]}>
                          {peak.orders || 0} orders
                        </Text>
                      </View>
                      <View style={styles.iosPeakRevenueInfo}>
                        <Text style={[styles.iosPeakRevenue, { color: colors.text }]}>
                          {formatCurrency(peak.revenue || 0)}
                        </Text>
                        <View style={[styles.iosPeakProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                          <View style={[styles.iosPeakProgressFill, { width: `${barWidth}%`, backgroundColor: rankColors[index] }]} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
              
              {/* Pro Tip Footer */}
              <View style={[styles.iosPeakFooter, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.05)' : '#F9FAFB' }]}>
                <View style={[styles.iosPeakTipIcon, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                  <Ionicons name="bulb" size={14} color="#8B5CF6" />
                </View>
                <Text style={[styles.iosPeakTipText, { color: colors.textSecondary }]}>
                  Run flash sales during peak hours to boost conversions!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Top Selling Products - iOS Style */}
        <View style={styles.section}>
          <View style={[styles.iosTopSellersCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Enhanced SVG Background */}
            <View style={styles.iosTopSellersSvg}>
              <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMaxYMin slice">
                <Defs>
                  <SvgLinearGradient id="topGrad1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#F59E0B" stopOpacity={0.12} />
                    <Stop offset="1" stopColor="#FBBF24" stopOpacity={0.04} />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="topGrad2" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FCD34D" stopOpacity={0.08} />
                    <Stop offset="1" stopColor="#F59E0B" stopOpacity={0.02} />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx="360" cy="40" r="70" fill="url(#topGrad1)" />
                <Circle cx="380" cy="130" r="45" fill="url(#topGrad2)" />
                <Circle cx="340" cy="190" r="30" fill="#F59E0B" fillOpacity={0.05} />
              </Svg>
            </View>
            
            {/* Header */}
            <View style={[styles.iosTopSellersHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={styles.iosTopSellersHeaderLeft}>
                <View>
                  <Text style={[styles.iosTopSellersTitle, { color: colors.text }]}>Best Sellers</Text>
                  <Text style={[styles.iosTopSellersSubtitle, { color: colors.textSecondary }]}>Top performing products</Text>
                </View>
              </View>
              <View style={[styles.iosTopSellersBadge, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Text style={styles.iosTopSellersBadgeText}>TOP 3</Text>
              </View>
            </View>
            
            {/* Products List */}
            <View style={styles.iosTopSellersList}>
              {topProducts.length > 0 ? (
                topProducts.slice(0, 3).map((product: any, index: number) => {
                  if (!product || !product.id) return null;
                  
                  let imageUrl: string | null = null;
                  const rawImage = product.images?.[0];
                  if (rawImage) {
                    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
                      imageUrl = rawImage;
                    } else {
                      imageUrl = `${API_CONFIG.BASE_URL.replace('/api/v1', '')}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
                    }
                  }
                  
                  const rankColors = ['#FFB300', '#94A3B8', '#CD7F32'];
                  const maxSales = Math.max(...topProducts.map((p: any) => p.sales || 0));
                  const progressWidth = maxSales > 0 ? ((product.sales || 0) / maxSales) * 100 : 0;
                  
                  return (
                    <TouchableOpacity
                      key={product.id || `product-${index}`}
                      style={[
                        styles.iosTopSellerItem,
                        index < Math.min(topProducts.length, 3) - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }
                      ]}
                      onPress={() => product.id && navigation.navigate('ProductAnalyticsDetail', { productId: product.id })}
                      activeOpacity={0.7}
                    >
                      {/* Rank */}
                      <View style={[styles.iosTopSellerRank, { backgroundColor: `${rankColors[index]}18` }]}>
                        <Text style={[styles.iosTopSellerRankText, { color: rankColors[index] }]}>{index + 1}</Text>
                      </View>
                      
                      {/* Product Image */}
                      <View style={styles.iosTopSellerImage}>
                        {imageUrl ? (
                          <Image source={{ uri: imageUrl }} style={styles.iosTopSellerImageInner} resizeMode="cover" />
                        ) : (
                          <View style={[styles.iosTopSellerImagePlaceholder, { backgroundColor: isDark ? '#3A3A3C' : '#F0F0F0' }]}>
                            <Ionicons name="leaf" size={18} color={COLORS.primary} />
                          </View>
                        )}
                      </View>
                      
                      {/* Product Info */}
                      <View style={styles.iosTopSellerInfo}>
                        <Text style={[styles.iosTopSellerName, { color: colors.text }]} numberOfLines={1}>
                          {product.title || product.name}
                        </Text>
                        <View style={styles.iosTopSellerMetrics}>
                          <Text style={[styles.iosTopSellerRevenue, { color: '#34C759' }]}>
                            {formatCurrency(product.revenue || 0)}
                          </Text>
                          <Text style={[styles.iosTopSellerSales, { color: colors.textSecondary }]}>
                            • {product.sales || 0} sold
                          </Text>
                        </View>
                        {/* Progress Bar */}
                        <View style={[styles.iosTopSellerProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                          <View style={[styles.iosTopSellerProgressFill, { width: `${progressWidth}%`, backgroundColor: rankColors[index] }]} />
                        </View>
                      </View>
                      
                      <Ionicons name="chevron-forward" size={16} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.iosTopSellersEmpty}>
                  <View style={[styles.iosTopSellersEmptyIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                    <Ionicons name="trophy-outline" size={28} color="#F59E0B" />
                  </View>
                  <Text style={[styles.iosTopSellersEmptyTitle, { color: colors.text }]}>No sales yet</Text>
                  <Text style={[styles.iosTopSellersEmptyText, { color: colors.textSecondary }]}>
                    Your best sellers will appear here
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Recent Orders - iOS Style */}
        <View style={styles.section}>
          <View style={[styles.iosRecentOrdersCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Enhanced SVG Background */}
            <View style={styles.iosRecentOrdersSvg}>
              <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMaxYMin slice">
                <Defs>
                  <SvgLinearGradient id="ordersGrad1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#3B82F6" stopOpacity={0.12} />
                    <Stop offset="1" stopColor="#60A5FA" stopOpacity={0.04} />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="ordersGrad2" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#93C5FD" stopOpacity={0.08} />
                    <Stop offset="1" stopColor="#3B82F6" stopOpacity={0.02} />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx="360" cy="40" r="70" fill="url(#ordersGrad1)" />
                <Circle cx="380" cy="130" r="45" fill="url(#ordersGrad2)" />
                <Circle cx="340" cy="190" r="30" fill="#3B82F6" fillOpacity={0.05} />
              </Svg>
            </View>
            
            {/* Header */}
            <View style={[styles.iosRecentOrdersHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={styles.iosRecentOrdersHeaderLeft}>
                <View>
                  <Text style={[styles.iosRecentOrdersTitle, { color: colors.text }]}>Recent Orders</Text>
                  <Text style={[styles.iosRecentOrdersSubtitle, { color: colors.textSecondary }]}>
                    {orders.length > 0 ? `${orders.length} pending` : 'No orders'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.iosRecentOrdersViewAll, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}
                onPress={() => navigation.navigate('FarmerOrders')}
              >
                <Text style={styles.iosRecentOrdersViewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {/* Orders List */}
            <View style={styles.iosRecentOrdersList}>
              {orders.length > 0 ? (
                orders.slice(0, 3).filter((order): order is Order => order != null && order.id != null).map((order: Order, index: number) => {
                  const statusConfig: Record<string, { color: string; bgColor: string }> = {
                    pending: { color: '#FF9500', bgColor: 'rgba(255, 149, 0, 0.12)' },
                    created: { color: '#FF9500', bgColor: 'rgba(255, 149, 0, 0.12)' },
                    confirmed: { color: '#007AFF', bgColor: 'rgba(0, 122, 255, 0.12)' },
                    preparing: { color: '#5856D6', bgColor: 'rgba(88, 86, 214, 0.12)' },
                    ready_for_pickup: { color: '#32ADE6', bgColor: 'rgba(50, 173, 230, 0.12)' },
                    rider_assigned: { color: '#AF52DE', bgColor: 'rgba(175, 82, 222, 0.12)' },
                    picked_up: { color: '#00C7BE', bgColor: 'rgba(0, 199, 190, 0.12)' },
                    in_transit: { color: '#34C759', bgColor: 'rgba(52, 199, 89, 0.12)' },
                    delivered: { color: '#34C759', bgColor: 'rgba(52, 199, 89, 0.12)' },
                    cancelled: { color: '#FF3B30', bgColor: 'rgba(255, 59, 48, 0.12)' },
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
                        styles.iosRecentOrderItem,
                        index < Math.min(orders.length, 3) - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }
                      ]}
                      onPress={() => navigation.navigate('FarmerOrderDetail', { orderId: order.id })}
                      activeOpacity={0.7}
                    >
                      {/* Order ID & Status */}
                      <View style={styles.iosRecentOrderTop}>
                        <Text style={[styles.iosRecentOrderId, { color: colors.text }]}>
                          #{order.id.slice(-6)}
                        </Text>
                        <View style={[styles.iosRecentOrderStatus, { backgroundColor: status.bgColor }]}>
                          <Text style={[styles.iosRecentOrderStatusText, { color: status.color }]}>
                            {statusLabels[order.status] || 'Pending'}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Items Summary */}
                      <Text style={[styles.iosRecentOrderItems, { color: colors.textSecondary }]} numberOfLines={1}>
                        {order.items.length} item{order.items.length > 1 ? 's' : ''} • {(order.items || []).map((item: any) => item.title || item.productName || 'Item').slice(0, 2).join(', ')}
                      </Text>
                      
                      {/* Amount & Time */}
                      <View style={styles.iosRecentOrderBottom}>
                        <Text style={[styles.iosRecentOrderAmount, { color: '#34C759' }]}>
                          ₦{Number(order.total || 0).toLocaleString()}
                        </Text>
                        <Text style={[styles.iosRecentOrderTime, { color: colors.textSecondary }]}>
                          {formatDate(order.createdAt)}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.iosRecentOrdersEmpty}>
                  <View style={[styles.iosRecentOrdersEmptyIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                    <Ionicons name="bag-handle-outline" size={28} color="#34C759" />
                  </View>
                  <Text style={[styles.iosRecentOrdersEmptyTitle, { color: colors.text }]}>No orders yet</Text>
                  <Text style={[styles.iosRecentOrdersEmptyText, { color: colors.textSecondary }]}>
                    Orders will appear here
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

        {/* Quick Actions - iOS Style List */}
        <View style={styles.section}>
          {/* Section Header */}
          <Text style={[styles.iosSectionHeader, { color: colors.textSecondary }]}>QUICK ACTIONS</Text>
          
          {/* iOS Grouped List */}
          <View style={[styles.iosGroupedCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Add Product */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('AddProduct')}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#34C759' }]}>
                <ProductPlusIcon size={20} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>Add Product</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>Create new listing</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={[styles.iosListDivider, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />
            
            {/* Orders */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('FarmerOrders')}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="bag-handle-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>Orders</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>View & manage orders</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={[styles.iosListDivider, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />
            
            {/* Withdraw */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('Withdraw')}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#FF9500' }]}>
                <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>Withdraw Funds</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>Transfer to bank</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={[styles.iosListDivider, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />
            
            {/* Products */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('FarmerProducts')}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#5856D6' }]}>
                <Ionicons name="cube-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>My Products</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>Manage inventory</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
          
          {/* Second Group */}
          <View style={[styles.iosGroupedCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', marginTop: 20 }]}>
            {/* Analytics */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('Analytics')}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#AF52DE' }]}>
                <Ionicons name="bar-chart-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>Analytics</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>Sales & performance</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={[styles.iosListDivider, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />
            
            {/* Flash Sales */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('FlashSales' as any)}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#FF3B30' }]}>
                <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>Flash Sales</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>Create limited deals</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={[styles.iosListDivider, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />
            
            {/* Reports */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('BusinessReports' as any)}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#007AFF' }]}>
                <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>Reports</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>Download statements</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
          
          {/* Third Group - Communication */}
          <View style={[styles.iosGroupedCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', marginTop: 20 }]}>
            {/* Messages */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('FarmerMessages')}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>Messages</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>Chat with buyers</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={[styles.iosListDivider, { backgroundColor: isDark ? '#38383A' : '#E5E5EA' }]} />
            
            {/* Support */}
            <TouchableOpacity
              style={styles.iosListItem}
              onPress={() => navigation.navigate('LiveChat' as any)}
              activeOpacity={0.6}
            >
              <View style={[styles.iosListIcon, { backgroundColor: '#FF2D55' }]}>
                <Ionicons name="headset-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.iosListContent}>
                <Text style={[styles.iosListTitle, { color: colors.text }]}>Support</Text>
                <Text style={[styles.iosListSubtitle, { color: colors.textSecondary }]}>Get help from team</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    maxWidth: 200,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  // iOS Stat Card Styles
  iosStatCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    paddingBottom: 14,
    minHeight: 130,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  iosStatCardSvg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 1,
  },
  iosStatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iosStatValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  iosStatLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  iosStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 3,
  },
  iosStatTrendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iosStatChevron: {
    position: 'absolute',
    top: 16,
    right: 12,
  },
  // Legacy stat card styles (kept for reference)
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
    paddingVertical: SPACING.lg,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  earningsMainAmountSvgBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 1,
  },
  earningsMainAmountContent: {
    zIndex: 1,
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
    position: 'relative',
    overflow: 'hidden',
  },
  earningsStatSvgBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
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
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    position: 'relative',
    overflow: 'hidden',
  },
  recentOrdersEmptySvgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
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
  // Best Sellers Empty State
  bestSellersEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 1.5,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  bestSellersEmptySvgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bestSellersEmptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  bestSellersEmptyText: {
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
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    gap: 8,
  },
  quickActionsGridSeparator: {
    height: 1,
    marginHorizontal: SPACING.lg,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    minHeight: 100,
    ...SHADOWS.small,
  },
  quickActionIconWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
  goalCardSvgBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    overflow: 'hidden',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    position: 'relative',
  },
  verifiedCardSvgContainer: {
    position: 'absolute',
    top: -20,
    right: -20,
    opacity: 1,
  },
  verifiedCardSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  verifiedCardDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  verifiedDecorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  verifiedDecorCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
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
  quickActionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  quickActionsSectionLeft: {
    flex: 1,
  },
  // iOS Settings-Style List Styles
  iosSectionHeader: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    letterSpacing: -0.08,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 16,
  },
  iosGroupedCard: {
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  iosListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 58,
  },
  iosListIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iosListContent: {
    flex: 1,
  },
  iosListTitle: {
    fontSize: 17,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    letterSpacing: -0.41,
  },
  iosListSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 1,
  },
  iosListDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  quickActionsSectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickActionsSectionSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  quickActionsSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 2,
  },
  quickActionsSeeAllText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  quickActionsCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  quickActionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  // ===== iOS Goal Card Styles =====
  iosGoalCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  iosGoalCardSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosGoalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iosGoalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iosGoalIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosGoalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosGoalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iosGoalPercentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  iosGoalPercentText: {
    fontSize: 15,
    fontWeight: '700',
  },
  iosGoalAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    gap: 6,
  },
  iosGoalCurrentAmount: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  iosGoalOfText: {
    fontSize: 15,
  },
  iosGoalTargetAmount: {
    fontSize: 17,
    fontWeight: '500',
  },
  iosGoalProgressWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  iosGoalProgressBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  iosGoalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  iosGoalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
  },
  iosGoalMotivation: {
    fontSize: 13,
    flex: 1,
  },
  // ===== iOS Pending Balance Styles =====
  iosPendingCard: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  iosPendingSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosPendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iosPendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPendingInfo: {
    flex: 1,
  },
  iosPendingLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  iosPendingAmount: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  iosPendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  iosPendingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // ===== iOS Earnings Card Styles =====
  iosEarningsCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  iosEarningsSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosEarningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosEarningsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iosEarningsIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosEarningsTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosEarningsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iosEarningsMain: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iosEarningsMainLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  iosEarningsMainValue: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  iosEarningsStatsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  iosEarningsStatBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  iosEarningsStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosEarningsStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  iosEarningsStatValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosEarningsStatSeparator: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  iosEarningsWithdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  iosEarningsWithdrawText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // ===== iOS Peak Hours Styles =====
  iosPeakCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  iosPeakSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosPeakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosPeakHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iosPeakIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPeakTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosPeakSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iosPeakInsightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  iosPeakInsightText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 0.5,
  },
  iosPeakSummary: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 12,
  },
  iosPeakSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  iosPeakSummarySeparator: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  iosPeakSummaryValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosPeakSummaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  iosPeakList: {
    paddingTop: 8,
  },
  iosPeakListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iosPeakRank: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPeakTimeInfo: {
    flex: 1,
  },
  iosPeakTime: {
    fontSize: 15,
    fontWeight: '600',
  },
  iosPeakOrders: {
    fontSize: 12,
    marginTop: 2,
  },
  iosPeakRevenueInfo: {
    alignItems: 'flex-end',
  },
  iosPeakRevenue: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  iosPeakProgressBg: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  iosPeakProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  iosPeakFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    gap: 10,
  },
  iosPeakTipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPeakTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // ===== iOS Top Sellers Styles =====
  iosTopSellersCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  iosTopSellersSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosTopSellersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosTopSellersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iosTopSellersIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosTopSellersTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosTopSellersSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iosTopSellersBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  iosTopSellersBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
  iosTopSellersList: {
    paddingTop: 4,
  },
  iosTopSellerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iosTopSellerRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosTopSellerRankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  iosTopSellerImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
  },
  iosTopSellerImageInner: {
    width: '100%',
    height: '100%',
  },
  iosTopSellerImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosTopSellerInfo: {
    flex: 1,
  },
  iosTopSellerName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  iosTopSellerMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iosTopSellerRevenue: {
    fontSize: 14,
    fontWeight: '600',
  },
  iosTopSellerSales: {
    fontSize: 13,
    marginLeft: 4,
  },
  iosTopSellerProgressBg: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 6,
    overflow: 'hidden',
  },
  iosTopSellerProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  iosTopSellersEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iosTopSellersEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iosTopSellersEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  iosTopSellersEmptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // ===== iOS Recent Orders Styles =====
  iosRecentOrdersCard: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  iosRecentOrdersSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iosRecentOrdersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosRecentOrdersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iosRecentOrdersIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosRecentOrdersTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosRecentOrdersSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iosRecentOrdersViewAll: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  iosRecentOrdersViewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  iosRecentOrdersList: {
    paddingTop: 4,
  },
  iosRecentOrderItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iosRecentOrderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iosRecentOrderId: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosRecentOrderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  iosRecentOrderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iosRecentOrderItems: {
    fontSize: 14,
    marginBottom: 6,
  },
  iosRecentOrderBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iosRecentOrderAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  iosRecentOrderTime: {
    fontSize: 13,
    flex: 1,
  },
  iosRecentOrdersEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iosRecentOrdersEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iosRecentOrdersEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  iosRecentOrdersEmptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
