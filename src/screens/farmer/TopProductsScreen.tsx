import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FarmerStackParamList } from '../../types';
import { getProductIllustration } from '../../assets/illustrations/products';
import { farmerAnalyticsService } from '../../services/farmerAnalyticsService';

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;

const { width } = Dimensions.get('window');

interface ProductPerformance {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
  image: string;
  category: string;
  stock: number;
  views: number;
  conversionRate: number;
}

type SortOption = 'revenue' | 'sales' | 'growth' | 'views';
type FilterOption = 'all' | 'vegetables' | 'fruits' | 'grains';

const TopProductsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [sortBy, setSortBy] = useState<SortOption>('revenue');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch all products for analytics
  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['farmer-all-products'],
    queryFn: () => farmerAnalyticsService.getTopProducts(50), // Get all products
    staleTime: 5 * 60 * 1000,
  });

  // Transform API response to ProductPerformance format
  const allProducts: ProductPerformance[] = ((productsResponse as any)?.data || productsResponse || []).map((p: any) => ({
    id: p.id,
    name: p.title || p.name,
    sales: p.sales || 0,
    revenue: p.revenue || 0,
    growth: p.growth || 0,
    image: p.images?.[0] || '',
    category: p.category || 'vegetables',
    stock: p.stock || 0,
    views: p.views || 0,
    conversionRate: p.conversionRate || 0,
  }));

  // Animations
  const listAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header scroll animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.spring(listAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const getFilteredAndSortedProducts = (): ProductPerformance[] => {
    let products = [...allProducts];

    // Filter
    if (filterBy !== 'all') {
      products = products.filter(p => p.category === filterBy);
    }

    // Sort
    switch (sortBy) {
      case 'revenue':
        products.sort((a, b) => b.revenue - a.revenue);
        break;
      case 'sales':
        products.sort((a, b) => b.sales - a.sales);
        break;
      case 'growth':
        products.sort((a, b) => b.growth - a.growth);
        break;
      case 'views':
        products.sort((a, b) => b.views - a.views);
        break;
    }

    return products;
  };

  const products = getFilteredAndSortedProducts();

  const formatCurrency = (value: number): string => {
    if (value === undefined || value === null) return '₦0';
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}K`;
    }
    return `₦${value.toLocaleString()}`;
  };

  const handleExport = async () => {
    try {
      const reportData = products.map((p, i) => 
        `${i + 1}. ${p.name}: ${p.sales} sales, ${formatCurrency(p.revenue)} revenue, ${p.growth}% growth`
      ).join('\n');

      await Share.share({
        message: `📊 Top Products Report\n\n${reportData}\n\nGenerated on ${new Date().toLocaleDateString()}`,
        title: 'Top Products Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const handleProductPress = (product: ProductPerformance) => {
    navigation.navigate('ProductAnalyticsDetail', { product });
  };

  const sortOptions = [
    { key: 'revenue', label: 'Revenue', icon: 'cash' as const },
    { key: 'sales', label: 'Units Sold', icon: 'bag-check' as const },
    { key: 'growth', label: 'Growth Rate', icon: 'trending-up' as const },
    { key: 'views', label: 'Views', icon: 'eye' as const },
  ];

  const filterOptions = [
    { key: 'all', label: 'All Products', icon: 'grid' as const },
    { key: 'vegetables', label: 'Vegetables', icon: 'leaf' as const },
    { key: 'fruits', label: 'Fruits', icon: 'nutrition' as const },
    { key: 'grains', label: 'Grains', icon: 'basket' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Animated.View style={[styles.headerTitleRow, { opacity: headerOpacity }]}>
            <View style={styles.headerIconBg}>
              <Ionicons name="trophy" size={18} color={COLORS.secondary} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Top Products</Text>
          </Animated.View>
        </View>
        <TouchableOpacity style={[styles.exportButton, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]} onPress={handleExport}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Stats Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={isDark ? ['#B45309', '#D97706'] : [COLORS.secondary, COLORS.secondaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="trophy" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Best Performers</Text>
            <Text style={styles.heroSubtitle}>Your top selling products ranked by performance</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{products.length}</Text>
                <Text style={styles.heroStatLabel}>Products</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {formatCurrency(products.reduce((sum, p) => sum + p.revenue, 0))}
                </Text>
                <Text style={styles.heroStatLabel}>Revenue</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>
                  {products.reduce((sum, p) => sum + p.sales, 0)}
                </Text>
                <Text style={styles.heroStatLabel}>Sold</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Sort & Filter */}
      <View style={styles.controlsRow}>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: isDark ? colors.card : COLORS.surface }]}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
          <Text style={styles.controlButtonText}>
            Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor: isDark ? colors.card : COLORS.surface }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={18} color={COLORS.primary} />
          <Text style={styles.controlButtonText}>
            Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products List */}
        {isLoading ? (
          <View style={[styles.loadingContainer]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={[styles.emptyContainer]}>
            <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Products Found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add products to see performance analytics</Text>
          </View>
        ) : (
          products.map((product, index) => (
          <Animated.View
            key={product.id}
            style={{
              opacity: listAnim,
              transform: [
                {
                  translateY: listAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity 
              style={[styles.productCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}
              onPress={() => handleProductPress(product)}
              activeOpacity={0.7}
            >
              <View style={styles.productRank}>
                <LinearGradient
                  colors={index < 3 ? [COLORS.secondary, COLORS.secondaryDark] : [COLORS.gray, COLORS.grayDark]}
                  style={styles.rankGradient}
                >
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.productImageContainer}>
                {getProductIllustration(product.name, 40)}
              </View>
              
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                <Text style={[styles.productCategory, { color: colors.textSecondary }]}>{product.category}</Text>
                <View style={styles.productMetrics}>
                  <View style={styles.metricItem}>
                    <Ionicons name="eye-outline" size={12} color={colors.textSecondary} />
                    <Text style={[styles.metricText, { color: colors.textSecondary }]}>{product.views}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="bag-outline" size={12} color={colors.textSecondary} />
                    <Text style={[styles.metricText, { color: colors.textSecondary }]}>{product.sales}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="cube-outline" size={12} color={colors.textSecondary} />
                    <Text style={[styles.metricText, { color: colors.textSecondary }]}>{product.stock}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.productStats}>
                <Text style={[styles.productRevenue, { color: colors.text }]}>{formatCurrency(product.revenue)}</Text>
                <View style={[styles.growthBadge, product.growth >= 0 ? { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight } : { backgroundColor: isDark ? `${COLORS.error}30` : COLORS.errorLight }]}>
                  <Ionicons
                    name={product.growth >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={product.growth >= 0 ? COLORS.success : COLORS.error}
                  />
                  <Text style={[styles.growthText, product.growth >= 0 ? styles.growthTextPositive : styles.growthTextNegative]}>
                    {Math.abs(product.growth)}%
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))
        )}
        <View style={{ height: SPACING.xxl + 20 }} />
      </Animated.ScrollView>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sort By</Text>
            </View>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.modalOption, sortBy === option.key && styles.modalOptionActive]}
                onPress={() => {
                  setSortBy(option.key as SortOption);
                  setShowSortModal(false);
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={sortBy === option.key ? COLORS.primary : colors.textSecondary} 
                  style={styles.modalOptionIcon}
                />
                <Text style={[
                  styles.modalOptionText, 
                  { color: sortBy === option.key ? COLORS.primary : colors.text }
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFilterModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter By Category</Text>
            </View>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.modalOption, filterBy === option.key && styles.modalOptionActive]}
                onPress={() => {
                  setFilterBy(option.key as FilterOption);
                  setShowFilterModal(false);
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={filterBy === option.key ? COLORS.primary : colors.textSecondary} 
                  style={styles.modalOptionIcon}
                />
                <Text style={[
                  styles.modalOptionText, 
                  { color: filterBy === option.key ? COLORS.primary : colors.text }
                ]}>
                  {option.label}
                </Text>
                {filterBy === option.key && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    marginBottom: SPACING.sm,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  statsSummary: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  controlsRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  controlButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  productRank: {
    marginRight: SPACING.sm,
  },
  rankGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  productCategory: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  productMetrics: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metricText: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  productStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productRevenue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  growthPositive: {
    backgroundColor: COLORS.successLight,
  },
  growthNegative: {
    backgroundColor: COLORS.errorLight,
  },
  growthText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginLeft: 2,
  },
  growthTextPositive: {
    color: COLORS.success,
  },
  growthTextNegative: {
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalHeader: {
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  modalOptionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  modalOptionIcon: {
    marginRight: SPACING.sm,
  },
  modalOptionText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default TopProductsScreen;
