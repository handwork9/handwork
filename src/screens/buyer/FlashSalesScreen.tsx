import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { BuyerStackParamList } from '../../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import apiClient from '../../services/apiClient';

type Props = NativeStackScreenProps<BuyerStackParamList, 'FlashSales'>;

const { width } = Dimensions.get('window');

interface FlashSale {
  id: string;
  productId: string;
  title: string;
  product: {
    id: string;
    title: string;
    images: string[];
    category: string;
    unit: string;
  };
  farmer?: {
    id: string;
    name: string;
    avatar: string;
  };
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  startTime: string;
  endTime: string;
  status: string;
}

// Countdown Timer Component
const CountdownTimer = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <Animated.View style={[styles.countdownContainer, { transform: [{ scale: pulseAnim }] }]}>
      <Ionicons name="time-outline" size={12} color="#EF4444" />
      <Text style={styles.countdownText}>
        {timeLeft.hours.toString().padStart(2, '0')}:
        {timeLeft.minutes.toString().padStart(2, '0')}:
        {timeLeft.seconds.toString().padStart(2, '0')}
      </Text>
    </Animated.View>
  );
};

// Progress Bar Component
const ProgressBar = ({ sold, total }: { sold: number; total: number }) => {
  const percentage = Math.min((sold / total) * 100, 100);
  const isAlmostGone = percentage > 70;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <Animated.View style={{ width: animatedWidth, height: '100%' }}>
          <LinearGradient
            colors={isAlmostGone ? ['#EF4444', '#DC2626'] : ['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </Animated.View>
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.soldText}>{sold} sold</Text>
        {isAlmostGone && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>🔥 {total - sold} left!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default function FlashSalesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'today'>('active');

  const { data: flashSalesData, isLoading, refetch } = useQuery({
    queryKey: ['flash-sales', filter],
    queryFn: async () => {
      const endpoint = filter === 'upcoming' 
        ? '/flash-sales/upcoming' 
        : filter === 'today' 
        ? '/flash-sales/today' 
        : '/flash-sales';
      const response = await apiClient.get(endpoint);
      const responseData = (response as any)?.data;
      if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
      if (Array.isArray(responseData)) return responseData;
      return [];
    },
    staleTime: 30 * 1000,
  });

  const flashSales: FlashSale[] = flashSalesData || [];

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const renderFilterTabs = () => (
    <View style={[styles.filterContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
      {[
        { key: 'active', label: 'Live Now', icon: 'flash' },
        { key: 'today', label: "Today's Deals", icon: 'today' },
        { key: 'upcoming', label: 'Coming Soon', icon: 'time' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.filterTab,
            filter === tab.key && styles.filterTabActive,
            filter === tab.key && { backgroundColor: '#EF4444' },
          ]}
          onPress={() => setFilter(tab.key as typeof filter)}
        >
          <Ionicons
            name={tab.icon as any}
            size={16}
            color={filter === tab.key ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.filterTabText,
              { color: filter === tab.key ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFlashSaleCard = ({ item }: { item: FlashSale }) => {
    const savings = (item.originalPrice || 0) - (item.salePrice || 0);
    const soldCount = item.soldQuantity || 0;
    const totalCount = item.totalQuantity || 100;
    const discountPercent = item.discountPercent || Math.round((savings / (item.originalPrice || 1)) * 100);
    const productImage = item.product?.images?.[0] || '';
    const productTitle = item.product?.title || item.title || 'Flash Sale Product';
    const farmerName = item.farmer?.name || 'Seller';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
        onPress={() => navigation.navigate('FlashSaleDetail', { saleId: item.id })}
        activeOpacity={0.7}
      >
        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.discountGradient}
          >
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </LinearGradient>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          {productImage ? (
            <Image source={{ uri: productImage }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="flash" size={32} color={colors.textSecondary} />
            </View>
          )}
          
          {/* Countdown Timer Overlay */}
          <View style={styles.countdownOverlay}>
            <CountdownTimer endTime={item.endTime} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {productTitle}
          </Text>
          
          <Text style={[styles.farmerName, { color: colors.textSecondary }]}>
            by {farmerName}
          </Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={[styles.salePrice, { color: '#EF4444' }]}>
              {formatCurrency(item.salePrice || 0)}
            </Text>
            <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
              {formatCurrency(item.originalPrice || 0)}
            </Text>
          </View>

          {/* Savings Badge */}
          <View style={[styles.savingsBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7' }]}>
            <Ionicons name="pricetag" size={12} color="#22C55E" />
            <Text style={styles.savingsText}>Save {formatCurrency(savings)}</Text>
          </View>

          {/* Progress Bar */}
          <ProgressBar sold={soldCount} total={totalCount} />

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('FlashSaleDetail', { saleId: item.id })}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.ctaGradient}
            >
              <Ionicons name="cart" size={16} color="#FFFFFF" />
              <Text style={styles.ctaText}>Grab Deal</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.surface : '#FEE2E2' }]}>
        <Ionicons name="flash-outline" size={48} color="#EF4444" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {filter === 'upcoming' ? 'No Upcoming Sales' : filter === 'today' ? "No Today's Deals" : 'No Flash Sales'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {filter === 'upcoming'
          ? 'Check back later for upcoming flash sales!'
          : filter === 'today'
          ? "Today's flash deals haven't started yet. Check the Live Now tab!"
          : 'Flash sales are ending fast! Come back soon for new deals.'}
      </Text>
      <TouchableOpacity
        style={[styles.browseCta, { backgroundColor: '#EF4444' }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="home" size={18} color="#FFFFFF" />
        <Text style={styles.browseCtaText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.headerBanner, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
      <LinearGradient
        colors={['#EF4444', '#DC2626', '#B91C1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <View style={styles.flashBadge}>
              <Ionicons name="flash" size={20} color="#FFD700" />
              <Text style={styles.flashText}>FLASH SALE</Text>
              <View style={styles.liveDot} />
            </View>
            <Text style={styles.bannerSubtitle}>
              {flashSales.length} {filter === 'upcoming' ? 'upcoming' : 'active'} deal{flashSales.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.bannerRight}>
            <Ionicons name="flash" size={60} color="rgba(255,255,255,0.2)" />
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#EF4444' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Flash Sales</Text>
          <Text style={styles.headerSubtitle}>
            Limited time offers
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="flash" size={24} color="#FFD700" />
        </View>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Banner */}
      {!isLoading && flashSales.length > 0 && renderHeader()}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading flash sales...
          </Text>
        </View>
      ) : (
        <FlatList
          data={flashSales}
          renderItem={renderFlashSaleCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.list,
            flashSales.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#EF4444"
            />
          }
        />
      )}
    </View>
  );
}

const CARD_WIDTH = (width - 48) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterTabActive: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  headerBanner: {
    marginHorizontal: 16,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  bannerGradient: {
    padding: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flex: 1,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  flashText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  bannerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  bannerRight: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  emptyList: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  discountGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  content: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    lineHeight: 18,
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  salePrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  originalPrice: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: '#22C55E',
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  soldText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#EF4444',
  },
  ctaButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseCta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  browseCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
});
