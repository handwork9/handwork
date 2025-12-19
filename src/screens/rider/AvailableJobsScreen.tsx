import React, { useState, useCallback, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState, Button } from '../../components/common';
import { useLocation } from '../../hooks/useLocation';
import { useDispatchSocket } from '../../hooks/useDispatchSocket';
import { useAppSelector, useAppDispatch } from '../../store';
import { formatCurrency } from '../../utils/formatters';
import { RiderStackParamList, Order } from '../../types';
import { riderService } from '../../services/orderService';
import { calculateDeliveryPrice, DELIVERY_PRICING } from '../../services/deliveryPricingService';

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
        return (result as any).jobs || [];
      } catch (error) {
        console.log('No available jobs from REST API, using WebSocket offers');
        return [];
      }
    },
    enabled: !!location,
  });

  // Combine REST API jobs with WebSocket offers
  const combinedJobs: DeliveryJob[] = [
    // First show pending offers from WebSocket (real-time)
    ...pendingOffers.map(offer => ({
      id: offer.orderId,
      orderId: offer.orderId,
      pickupAddress: offer.pickupAddress,
      deliveryAddress: offer.deliveryAddress,
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
    ...(jobs || []).map(job => ({ ...job, isRealTimeOffer: false })),
  ];

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

  const sortedJobs = [...combinedJobs].sort((a, b) => {
    switch (sortBy) {
      case 'earnings':
        return b.earnings - a.earnings;
      case 'time':
        return a.estimatedTime - b.estimatedTime;
      case 'distance':
      default:
        return a.distance - b.distance;
    }
  });

  const sortOptions: { key: 'distance' | 'earnings' | 'time'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'distance', label: 'Nearest', icon: 'location-outline' },
    { key: 'earnings', label: 'Highest Pay', icon: 'wallet-outline' },
    { key: 'time', label: 'Quickest', icon: 'time-outline' },
  ];

  const renderJob = ({ item }: { item: DeliveryJob }) => {
    // Calculate earnings breakdown for display
    const pricing = calculateDeliveryPrice({ distanceKm: item.distance });
    const baseEarnings = DELIVERY_PRICING.BASE_RIDER_EARNINGS;
    const distanceBonus = pricing.riderEarnings - baseEarnings;
    
    return (
      <View style={[styles.jobCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
        <View style={styles.jobHeader}>
          <View style={[styles.earningsBadge, { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight }]}>
            <Text style={styles.earningsText}>{formatCurrency(item.earnings ?? 0)}</Text>
          </View>
          <Text style={[styles.itemsText, { color: colors.textSecondary }]}>{item.items} item{item.items > 1 ? 's' : ''}</Text>
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
                {item.pickupAddress}
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
                {item.deliveryAddress}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.jobStats, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.distance.toFixed(1)} km</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>~{item.estimatedTime} min</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>₦{Math.round(item.earnings / item.distance)}/km</Text>
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
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.headerRow}>
          <View style={{ width: 44 }} />
          <View style={styles.headerTitleContainer}>
            <Animated.View style={[styles.headerTitleRow, { opacity: headerOpacity }]}>
              <View style={styles.headerIconBg}>
                <Ionicons name="bicycle" size={18} color={COLORS.primary} />
              </View>
              <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Available Jobs</Text>
            </Animated.View>
          </View>
          <TouchableOpacity 
            style={[styles.notificationButton, { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' }]}
            onPress={() => navigation.navigate('Notifications' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Jobs List */}
      <Animated.FlatList
        data={sortedJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
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
              <LinearGradient
                colors={isDark ? ['#1E40AF', '#3B82F6'] : [COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroIconContainer}>
                  <Ionicons name="bicycle" size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.heroTitle}>Find Deliveries</Text>
                <Text style={styles.heroSubtitle}>Pick up jobs near you and start earning</Text>
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{sortedJobs.length}</Text>
                    <Text style={styles.heroStatLabel}>Jobs</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{formatCurrency(totalEarnings ?? 0)}</Text>
                    <Text style={styles.heroStatLabel}>Total Value</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStatItem}>
                    <Text style={styles.heroStatValue}>{avgDistance} km</Text>
                    <Text style={styles.heroStatLabel}>Avg Distance</Text>
                  </View>
                </View>
              </LinearGradient>
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
                  onPress={() => setSortBy(option.key)}
                >
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
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.background }]}>
              <Ionicons name="bicycle-outline" size={48} color={COLORS.gray} />
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: SPACING.xs,
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
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
});
