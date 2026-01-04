import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  ActivityIndicator,
  Switch,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState, Button } from '../../components/common';
import { useLocation } from '../../hooks/useLocation';
import { useDispatchSocket } from '../../hooks/useDispatchSocket';
import { useAppSelector, useAppDispatch } from '../../store';
import { updateRiderStatus, fetchRiderProfile } from '../../store/slices/riderSlice';
import { formatCurrency } from '../../utils/formatters';
import { RiderStackParamList, Order } from '../../types';
import { riderService } from '../../services/orderService';
import { calculateDeliveryPrice, DELIVERY_PRICING } from '../../services/deliveryPricingService';
import LiveSupportBanner from '../../components/common/LiveSupportBanner';

// Animated countdown timer component
const CountdownTimer = ({ seconds, onExpire }: { seconds: number; onExpire?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Start countdown animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: seconds * 1000,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start();
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [seconds]);
  
  // Pulse animation when time is low
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [timeLeft]);
  
  const isUrgent = timeLeft <= 15;
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  return (
    <View style={countdownStyles.container}>
      <View style={countdownStyles.progressBg}>
        <Animated.View 
          style={[
            countdownStyles.progressFill, 
            { 
              width: progressWidth,
              backgroundColor: isUrgent ? '#EF4444' : COLORS.primary,
            }
          ]} 
        />
      </View>
      <Animated.View style={[countdownStyles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Ionicons 
          name="timer-outline" 
          size={14} 
          color={isUrgent ? '#EF4444' : COLORS.primary} 
        />
        <Text style={[countdownStyles.timerText, isUrgent && { color: '#EF4444' }]}>
          {timeLeft}s
        </Text>
      </Animated.View>
    </View>
  );
};

const countdownStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    gap: 4,
  },
  timerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});

type NavigationProp = NativeStackNavigationProp<RiderStackParamList>;

const { width } = Dimensions.get('window');

interface DeliveryJob {
  id: string;
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: number; // in km
  estimatedTime: number; // in minutes
  earnings: number;
  items: number;
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  farmerName: string;
  buyerName: string;
  isRealTimeOffer?: boolean;
  timeoutSeconds?: number;
}

export default function AvailableJobsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { location, getDistanceFromLocation } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'earnings' | 'time'>('distance');
  const [goingOnline, setGoingOnline] = useState(false);

  // Get rider online status from Redux
  const { isOnline, profile } = useAppSelector((state) => state.rider);

  console.log('[AvailableJobsScreen] isOnline:', isOnline, 'profile?.isOnline:', profile?.isOnline);

  // Fetch rider profile on mount to get current online status
  useEffect(() => {
    console.log('[AvailableJobsScreen] Fetching rider profile...');
    dispatch(fetchRiderProfile());
  }, [dispatch]);

  // Connect to dispatch socket for real-time offers
  const { isConnected, pendingOffers, acceptOffer, declineOffer, activeDelivery } = useDispatchSocket();

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // If there's an active delivery, navigate to it
  useEffect(() => {
    if (activeDelivery) {
      navigation.navigate('ActiveDelivery');
    }
  }, [activeDelivery, navigation]);

  // Fetch available jobs via REST API as fallback
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['available-jobs', location?.latitude, location?.longitude],
    queryFn: async (): Promise<DeliveryJob[]> => {
      try {
        const result = await riderService.getAvailableJobs(location?.latitude, location?.longitude);
        console.log('[AvailableJobsScreen] Raw API result:', JSON.stringify(result, null, 2));
        
        // Handle nested response structure
        let data: any = result;
        if (data && typeof data === 'object' && 'data' in data) {
          data = data.data;
        }
        if (data && typeof data === 'object' && 'jobs' in data) {
          data = data.jobs;
        }
        
        console.log('[AvailableJobsScreen] Extracted jobs:', data?.length || 0);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.log('[AvailableJobsScreen] Error fetching jobs:', error);
        return [];
      }
    },
    enabled: !!location,
  });

  // Helper to extract address string from potentially object address
  const getAddressString = (addr: any): string => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      return addr.address || addr.city || addr.state || '';
    }
    return '';
  };

  // Combine REST API jobs with WebSocket offers, de-duplicating by ID
  const combinedJobs: DeliveryJob[] = useMemo(() => {
    const allJobs = [
      // First show pending offers from WebSocket (real-time)
      ...pendingOffers.map(offer => ({
        id: offer.orderId,
        orderId: offer.orderId,
        pickupAddress: getAddressString(offer.pickupAddress),
        deliveryAddress: getAddressString(offer.deliveryAddress),
        distance: parseFloat(offer.estimatedDistance) || 0,
        estimatedTime: offer.estimatedEta,
        earnings: offer.earnings || offer.totalAmount * 0.15, // Rider gets ~15% of total
        items: offer.items || 1,
        pickupLocation: offer.pickupLocation || { latitude: 0, longitude: 0 },
        deliveryLocation: offer.deliveryLocation || { latitude: 0, longitude: 0 },
        farmerName: offer.farmerName || 'Farmer',
        buyerName: offer.buyerName || 'Buyer',
        isRealTimeOffer: true,
        timeoutSeconds: offer.timeoutSeconds,
      })),
      // Then show REST API jobs
      ...(jobs || []).map(job => ({ 
        ...job, 
        pickupAddress: getAddressString(job.pickupAddress),
        deliveryAddress: getAddressString(job.deliveryAddress),
        isRealTimeOffer: false 
      })),
    ];
    
    // De-duplicate by id
    const seen = new Set<string>();
    return allJobs.filter(job => {
      if (!job?.id || seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
  }, [pendingOffers, jobs]);

  const handleAcceptJob = (job: DeliveryJob & { isRealTimeOffer?: boolean }) => {
    Alert.alert(
      'Accept Delivery',
      `Accept delivery from ${job.farmerName} to ${job.buyerName}?\n\nEarnings: ${formatCurrency(job.earnings ?? 0)}\nDistance: ${job.distance.toFixed(1)} km`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            if (job.isRealTimeOffer) {
              // Accept via WebSocket
              acceptOffer(job.orderId);
            } else {
              // Accept via REST API
              acceptJobMutation.mutate(job.id);
            }
          },
        },
      ]
    );
  };

  const handleDeclineJob = (job: DeliveryJob & { isRealTimeOffer?: boolean }) => {
    if (job.isRealTimeOffer) {
      declineOffer(job.orderId, 'Rider declined');
    }
  };

  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const result = await riderService.acceptJob(jobId);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['active-delivery'] });
      navigation.navigate('ActiveDelivery');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to accept job');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Sort jobs based on selected sort option
  const sortedJobs = useMemo(() => {
    const sorted = [...combinedJobs].sort((a, b) => {
      switch (sortBy) {
        case 'earnings':
          return (b.earnings || 0) - (a.earnings || 0);
        case 'time':
          return (a.estimatedTime || 0) - (b.estimatedTime || 0);
        case 'distance':
        default:
          return (a.distance || 0) - (b.distance || 0);
      }
    });
    console.log('[AvailableJobsScreen] Sorted jobs by:', sortBy, 'count:', sorted.length);
    return sorted;
  }, [combinedJobs, sortBy]);

  const sortOptions: { key: 'distance' | 'earnings' | 'time'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'distance', label: 'Nearest', icon: 'location-outline' },
    { key: 'earnings', label: 'Highest Pay', icon: 'wallet-outline' },
    { key: 'time', label: 'Quickest', icon: 'time-outline' },
  ];

  const renderJob = ({ item, index }: { item: DeliveryJob; index: number }) => {
    // Calculate earnings breakdown for display
    const pricing = calculateDeliveryPrice({ distanceKm: item.distance });
    const baseEarnings = DELIVERY_PRICING.BASE_RIDER_EARNINGS;
    const distanceBonus = pricing.riderEarnings - baseEarnings;
    
    // Calculate earnings per km ratio for badge
    const earningsPerKm = item.distance > 0 ? item.earnings / item.distance : 0;
    const isHighPaying = earningsPerKm > 150; // High-paying job threshold
    const isUrgent = item.isRealTimeOffer && (item.timeoutSeconds || 0) <= 30;
    
    return (
      <View style={[
        styles.jobCard, 
        { backgroundColor: isDark ? colors.card : COLORS.surface },
        item.isRealTimeOffer && styles.jobCardRealTime,
        isUrgent && styles.jobCardUrgent,
      ]}>
        {/* Real-time offer indicator with countdown */}
        {item.isRealTimeOffer && item.timeoutSeconds && (
          <View style={styles.realTimeIndicator}>
            <View style={styles.realTimeBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.realTimeText}>LIVE OFFER</Text>
            </View>
            <CountdownTimer 
              seconds={item.timeoutSeconds} 
              onExpire={() => handleDeclineJob(item)}
            />
          </View>
        )}
        
        {/* Header with earnings and badges */}
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <View style={[styles.earningsBadge, { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight }]}>
              <Text style={styles.earningsText}>{formatCurrency(item.earnings ?? 0)}</Text>
            </View>
            {isHighPaying && (
              <View style={styles.highPayBadge}>
                <Ionicons name="flame" size={12} color="#F97316" />
                <Text style={styles.highPayText}>High Pay</Text>
              </View>
            )}
          </View>
          <View style={styles.jobHeaderRight}>
            <Text style={[styles.itemsText, { color: colors.textSecondary }]}>{item.items} item{item.items > 1 ? 's' : ''}</Text>
            {index === 0 && !item.isRealTimeOffer && (
              <View style={styles.nearestBadge}>
                <Ionicons name="location" size={10} color="#3B82F6" />
                <Text style={styles.nearestText}>Nearest</Text>
              </View>
            )}
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={[styles.earningsBreakdown, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.background }]}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Base pay</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(baseEarnings ?? 0)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>Distance bonus ({item.distance.toFixed(1)} km)</Text>
            <Text style={styles.breakdownValue}>+{formatCurrency(distanceBonus ?? 0)}</Text>
          </View>
        </View>

        <View style={[styles.locationSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.background }]}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            </View>
            <View style={styles.locationDetails}>
              <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>PICKUP</Text>
              <Text style={[styles.locationName, { color: colors.text }]}>{item.farmerName}</Text>
              <Text style={[styles.locationAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                {typeof item.pickupAddress === 'object' && item.pickupAddress 
                  ? (item.pickupAddress as any).address || (item.pickupAddress as any).city || (item.pickupAddress as any).state || ''
                  : item.pickupAddress || ''}
              </Text>
            </View>
          </View>
          
          <View style={[styles.locationLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]} />
          
          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            </View>
            <View style={styles.locationDetails}>
              <Text style={[styles.locationLabel, { color: colors.textSecondary }]}>DELIVERY</Text>
              <Text style={[styles.locationName, { color: colors.text }]}>{item.buyerName}</Text>
              <Text style={[styles.locationAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                {typeof item.deliveryAddress === 'object' && item.deliveryAddress 
                  ? (item.deliveryAddress as any).address || (item.deliveryAddress as any).city || (item.deliveryAddress as any).state || ''
                  : item.deliveryAddress || ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced stats row */}
        <View style={[styles.jobStats, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]}>
          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{item.distance.toFixed(1)} km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.warning} />
            <Text style={[styles.statValue, { color: colors.text }]}>~{item.estimatedTime} min</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={16} color={COLORS.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>₦{Math.round(earningsPerKm)}/km</Text>
          </View>
        </View>

        <Button
          title="Accept Delivery"
          onPress={() => handleAcceptJob(item)}
          loading={acceptJobMutation.isPending}
          fullWidth
        />
      </View>
    );
  };

  if (!location) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Available Jobs</Text>
        </View>
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIconContainer, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]}>
            <Ionicons name="location-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={[styles.loadingTitle, { color: colors.text }]}>Getting your location...</Text>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            We need your location to find nearby delivery jobs
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  // Calculate total potential earnings
  const totalEarnings = sortedJobs.reduce((sum, job) => sum + job.earnings, 0);
  const avgDistance = sortedJobs.length > 0 
    ? (sortedJobs.reduce((sum, job) => sum + job.distance, 0) / sortedJobs.length).toFixed(1)
    : '0';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header - Instagram Style */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.brandButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EditProfile' as any)}
          >
            <View style={{ position: 'relative' }}>
              <Text style={[styles.brandText, { color: colors.text }]}>Handwork</Text>
              <Text style={[styles.brandText, { color: colors.text, position: 'absolute', left: 0.5, top: 0 }]}>Handwork</Text>
              <Text style={[styles.brandText, { color: colors.text, position: 'absolute', left: 1, top: 0 }]}>Handwork</Text>
              <Text style={[styles.brandText, { color: colors.text, position: 'absolute', left: 1.5, top: 0 }]}>Handwork</Text>
              <Text style={[styles.brandText, { color: colors.text, position: 'absolute', left: 0.25, top: 0.25 }]}>Handwork</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.text} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Notifications' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Jobs List */}
      <Animated.FlatList
        data={sortedJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        extraData={sortBy}
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
        ListHeaderComponent={
          <>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={styles.heroCardSvg}>
                  <Svg width="200" height="200" viewBox="0 0 200 200">
                    <Circle cx="150" cy="50" r="80" fill={isOnline ? COLORS.primary : '#6B7280'} fillOpacity={0.08} />
                    <Circle cx="180" cy="100" r="50" fill={isOnline ? COLORS.primaryDark : '#9CA3AF'} fillOpacity={0.06} />
                    <Circle cx="120" cy="30" r="30" fill={isOnline ? COLORS.primary : '#6B7280'} fillOpacity={0.05} />
                  </Svg>
                </View>
                <View style={styles.heroContent}>
                  {/* Online/Offline Toggle */}
                  <View style={[styles.onlineToggleContainer, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={styles.onlineStatusRow}>
                      <View style={[
                        styles.onlineIndicator,
                        { backgroundColor: isOnline === true ? COLORS.success : '#9CA3AF' }
                      ]} />
                      <Text style={[styles.onlineStatusText, { color: colors.text }]}>
                        {isOnline === true ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                    <Switch
                      value={isOnline === true}
                      onValueChange={async (value) => {
                        try {
                          await dispatch(updateRiderStatus({ isOnline: value })).unwrap();
                          await dispatch(fetchRiderProfile()).unwrap();
                        } catch (error) {
                          Alert.alert('Error', `Failed to go ${value ? 'online' : 'offline'}. Please try again.`);
                        }
                      }}
                      trackColor={{ false: 'rgba(0,0,0,0.1)', true: COLORS.success }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="rgba(0,0,0,0.1)"
                      style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                    />
                  </View>

                  <View style={[styles.heroIconContainer, { backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)' }]}>
                    <Ionicons name="bicycle" size={32} color={isOnline ? COLORS.primary : '#6B7280'} />
                  </View>
                  <Text style={[styles.heroTitle, { color: colors.text }]}>{isOnline ? 'Find Deliveries' : 'You\'re Offline'}</Text>
                  <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                    {isOnline ? 'Pick up jobs near you and start earning' : 'Turn on to receive delivery requests'}
                  </Text>
                  <View style={[styles.heroStatsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={styles.heroStatItem}>
                      <Text style={[styles.heroStatValue, { color: isOnline ? COLORS.primary : '#6B7280' }]}>{sortedJobs.length}</Text>
                      <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Jobs</Text>
                    </View>
                    <View style={[styles.heroStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]} />
                    <View style={styles.heroStatItem}>
                      <Text style={[styles.heroStatValue, { color: isOnline ? COLORS.primary : '#6B7280' }]}>{formatCurrency(totalEarnings ?? 0)}</Text>
                      <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Total Value</Text>
                    </View>
                    <View style={[styles.heroStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]} />
                    <View style={styles.heroStatItem}>
                      <Text style={[styles.heroStatValue, { color: isOnline ? COLORS.primary : '#6B7280' }]}>{avgDistance} km</Text>
                      <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Avg Distance</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Sort Options */}
            <View style={[styles.sortContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    { backgroundColor: isDark ? colors.card : COLORS.surface },
                    sortBy === option.key && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    console.log('[AvailableJobsScreen] Sort changed to:', option.key);
                    setSortBy(option.key);
                  }}
                  activeOpacity={0.7}
                >
                  {sortBy === option.key && (
                    <Ionicons 
                      name={option.icon} 
                      size={16} 
                      color="#FFFFFF"
                      style={{ marginRight: SPACING.xs }}
                    />
                  )}
                  <Text style={[
                    styles.sortOptionText,
                    { color: colors.textSecondary },
                    sortBy === option.key && styles.sortOptionTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Offline Alert Card */}
            {!isOnline && (
              <View style={[styles.offlineAlertCard, { backgroundColor: isDark ? '#3D2E0A' : '#FEF3C7' }]}>
                <View style={styles.offlineAlertContent}>
                  <View style={[styles.offlineAlertIconContainer, { backgroundColor: isDark ? '#D97706' : '#F59E0B' }]}>
                    <Ionicons name="wifi-outline" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.offlineAlertTextContainer}>
                    <Text style={[styles.offlineAlertTitle, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                      You're Currently Offline
                    </Text>
                    <Text style={[styles.offlineAlertMessage, { color: isDark ? '#FDE68A' : '#B45309' }]}>
                      Go online to receive delivery requests and start earning
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.goOnlineButton, { backgroundColor: COLORS.success }]}
                  onPress={async () => {
                    console.log('[AvailableJobsScreen] Go Online button pressed, current isOnline:', isOnline);
                    setGoingOnline(true);
                    try {
                      const result = await dispatch(updateRiderStatus({ isOnline: true })).unwrap();
                      console.log('[AvailableJobsScreen] updateRiderStatus result:', result);
                      // Refetch profile to sync state
                      await dispatch(fetchRiderProfile()).unwrap();
                    } catch (error) {
                      console.log('[AvailableJobsScreen] updateRiderStatus error:', error);
                      Alert.alert('Error', 'Failed to go online. Please try again.');
                    } finally {
                      setGoingOnline(false);
                    }
                  }}
                  activeOpacity={0.8}
                  disabled={goingOnline}
                >
                  {goingOnline ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="power" size={18} color="#FFFFFF" />
                      <Text style={styles.goOnlineButtonText}>Go Online</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Live Support Banner */}
            <LiveSupportBanner variant="minimal" style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 8 }} />
          </>
        }
        ListEmptyComponent={
          <View style={[
            styles.emptyState,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }
          ]}>
            {/* SVG Background */}
            <View style={styles.emptyBackground}>
              <Svg width={200} height={200}>
                <Defs>
                  <SvgLinearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#4CAF50" stopOpacity="0.15" />
                    <Stop offset="100%" stopColor="#81C784" stopOpacity="0.08" />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx="100" cy="100" r="90" fill="url(#emptyGrad)" />
                <Circle cx="100" cy="100" r="60" fill="url(#emptyGrad)" />
              </Svg>
            </View>
            <View style={[styles.emptyIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="bicycle" size={40} color="#4CAF50" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No jobs available</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Pull down to refresh or wait for new delivery requests
            </Text>
          </View>
        }
      />
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
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 38,
    fontFamily: 'Billabong',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitleContainer: {
    flex: 1,
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
    backgroundColor: 'rgba(34, 139, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  fixedHeaderSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  loadingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardSvg: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  heroContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  onlineToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineStatusText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  heroStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
  },
  header: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.small,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primary,
  },
  sortOptionIcon: {
    marginRight: SPACING.xs,
  },
  sortOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  listContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  earningsBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  earningsText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  itemsText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  earningsBreakdown: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  breakdownLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: COLORS.success,
  },
  locationSection: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 20,
    alignItems: 'center',
    paddingTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.border,
    marginLeft: 9,
    marginVertical: SPACING.xs,
  },
  locationDetails: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  locationLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  locationName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  locationAddress: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  jobStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  emptyBackground: {
    position: 'absolute',
    opacity: 0.8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  // Offline Alert Card
  offlineAlertCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  offlineAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  offlineAlertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  offlineAlertTextContainer: {
    flex: 1,
  },
  offlineAlertTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  offlineAlertMessage: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  goOnlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  goOnlineButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  // Enhanced job card styles
  jobCardRealTime: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  jobCardUrgent: {
    borderColor: '#EF4444',
  },
  realTimeIndicator: {
    marginBottom: SPACING.md,
  },
  realTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.xs,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  realTimeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  jobHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  jobHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  highPayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  highPayText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#F97316',
  },
  nearestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  nearestText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: '#3B82F6',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
  },
});
