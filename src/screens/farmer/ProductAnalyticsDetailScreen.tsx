import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Share,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FarmerStackParamList } from '../../types';
import { getProductIllustration } from '../../assets/illustrations/products';
import { farmerAnalyticsService } from '../../services/farmerAnalyticsService';
import { API_CONFIG } from '../../constants/config';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;
type RouteType = RouteProp<FarmerStackParamList, 'ProductAnalyticsDetail'>;

interface SalesDataPoint {
  label: string;
  value: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  title?: string;
  sales: number;
  revenue: number;
  growth: number;
  image?: string;
  images?: string[];
  category?: string;
  stock?: number;
  views?: number;
  conversionRate?: number;
}

const ProductAnalyticsDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = route.params || {} as any;
  
  // Support both product object and productId
  const productFromParams = params.product;
  const productIdFromParams = params.productId;

  // If we only have productId, fetch the product data
  const { data: fetchedProductData, isLoading: isProductLoading } = useQuery({
    queryKey: ['product-analytics', productIdFromParams],
    queryFn: () => farmerAnalyticsService.getTopProducts(50),
    enabled: !productFromParams && !!productIdFromParams,
    staleTime: 5 * 60 * 1000,
  });

  // Find the product from fetched data if needed
  const product: ProductPerformance | undefined = productFromParams || 
    (fetchedProductData as any[])?.find((p: any) => p?.id === productIdFromParams) ||
    (fetchedProductData as any)?.find?.((p: any) => p?.id === productIdFromParams);

  // Fetch product sales history - always call the hook but conditionally enable
  const productId = product?.id || productIdFromParams || '';
  const { data: salesHistoryResponse, isLoading: isSalesLoading } = useQuery({
    queryKey: ['product-sales-history', productId],
    queryFn: () => farmerAnalyticsService.getProductSalesHistory(productId, 'week'),
    staleTime: 5 * 60 * 1000,
    enabled: !!productId,
  });

  const salesHistory: SalesDataPoint[] = (salesHistoryResponse as any)?.data || salesHistoryResponse || [];

  // Animations - all hooks must be called before any conditional returns
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Get product image URL - support both image and images array
  const getImageUrl = (imageUrl?: string): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `${API_CONFIG.BASE_URL.replace('/api/v1', '')}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  // Get the first image from either 'image' or 'images' array
  const rawImage = product?.image || product?.images?.[0];
  const productImageUrl = getImageUrl(rawImage);
  
  // Get product name - support both 'name' and 'title'
  const productName = product?.name || product?.title || 'Product';

  // Header scroll animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!product?.id) return;
    
    Animated.stagger(100, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(statsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(chartAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [product?.id]);

  // Loading state while fetching product
  if (!productFromParams && isProductLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: colors.textSecondary }}>Loading product...</Text>
      </View>
    );
  }

  // Early return if product is invalid
  if (!product || !product.id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
        <Text style={{ marginTop: 10, color: colors.text, fontSize: 18 }}>Product not found</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: COLORS.primary, borderRadius: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: 'white' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatCurrency = (value: number): string => {
    if (value === undefined || value === null) return '₦0';
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}K`;
    }
    return `₦${value.toLocaleString()}`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📊 Product Analytics: ${productName}\n\n` +
          `💰 Revenue: ${formatCurrency(product.revenue)}\n` +
          `📦 Units Sold: ${product.sales}\n` +
          `📈 Growth: ${product.growth >= 0 ? '+' : ''}${product.growth}%\n` +
          `👁️ Views: ${product.views}\n` +
          `🎯 Conversion Rate: ${product.conversionRate}%\n\n` +
          `Generated on ${new Date().toLocaleDateString()}`,
        title: `${productName} Analytics`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const handleEditProduct = () => {
    navigation.navigate('EditProduct', { productId: product.id });
  };

  const handleAddDiscount = () => {
    navigation.navigate('AddDiscount', { product });
  };

  const handlePromote = () => {
    navigation.navigate('PromoteProduct', { product });
  };

  const maxSalesValue = salesHistory.length > 0 ? Math.max(...salesHistory.map(d => d.value), 1) : 1;

  const renderMiniChart = () => {
    if (isSalesLoading) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, alignItems: 'center', justifyContent: 'center', height: 180 }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (salesHistory.length === 0) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, alignItems: 'center', justifyContent: 'center', height: 180 }]}>
          <Ionicons name="bar-chart-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: SPACING.sm }]}>No sales data available</Text>
        </View>
      );
    }

    const chartWidth = width - SPACING.md * 4;
    const barWidth = chartWidth / salesHistory.length - 8;

    return (
      <View style={[styles.chartContainer, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Sales Trend</Text>
        <View style={styles.chartBars}>
          {salesHistory.map((data, index) => {
            const barHeight = (data.value / maxSalesValue) * 100;

            return (
              <View key={index} style={styles.barWrapper}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      width: barWidth,
                      transform: [
                        {
                          scaleY: chartAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.barGradient}
                  />
                </Animated.View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{data.label}</Text>
                <Text style={[styles.barValue, { color: colors.text }]}>{data.value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

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
            <View style={styles.headerImageContainer}>
              {productImageUrl ? (
                <Image source={{ uri: productImageUrl }} style={styles.headerImage} resizeMode="cover" />
              ) : (
                getProductIllustration(productName, 24)
              )}
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{productName}</Text>
          </Animated.View>
        </View>
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Product Hero */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.heroGradient}
          >
            <View style={styles.heroImageContainer}>
              {productImageUrl ? (
                <Image 
                  source={{ uri: productImageUrl }} 
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              ) : (
                getProductIllustration(productName, 72)
              )}
            </View>
            <Text style={styles.heroName}>{productName}</Text>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: product.stock > 50 ? 'rgba(16, 185, 129, 0.3)' : product.stock > 20 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.3)' }]}>
                <Ionicons 
                  name="cube" 
                  size={12} 
                  color={COLORS.white} 
                />
                <Text style={styles.heroBadgeText}>
                  {product.stock > 50 ? 'In Stock' : product.stock > 20 ? 'Low Stock' : 'Very Low'}
                </Text>
              </View>
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.heroBadgeText}>
                  {(product.conversionRate / 1.5).toFixed(1)} Rating
                </Text>
              </View>
            </View>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatCurrency(product.revenue)}</Text>
                <Text style={styles.heroStatLabel}>Revenue</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{product.sales}</Text>
                <Text style={styles.heroStatLabel}>Units Sold</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <View style={styles.heroGrowth}>
                  <Ionicons
                    name={product.growth >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={COLORS.white}
                  />
                  <Text style={styles.heroStatValue}>
                    {product.growth >= 0 ? '+' : ''}{product.growth}%
                  </Text>
                </View>
                <Text style={styles.heroStatLabel}>Growth</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Key Metrics */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: statsAnim,
              transform: [
                {
                  translateX: statsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]}>
              <Ionicons name="eye" size={24} color={COLORS.primary} />
              <Text style={[styles.metricValue, { color: colors.text }]}>{product.views?.toLocaleString() || '0'}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Views</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: isDark ? `${COLORS.secondary}30` : COLORS.secondaryLight }]}>
              <Ionicons name="analytics" size={24} color={COLORS.secondary} />
              <Text style={[styles.metricValue, { color: colors.text }]}>{product.conversionRate}%</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Conversion</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: isDark ? `${COLORS.accent}30` : COLORS.accentLight }]}>
              <Ionicons name="cube" size={24} color={COLORS.accent} />
              <Text style={[styles.metricValue, { color: colors.text }]}>{product.stock}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>In Stock</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight }]}>
              <Ionicons name="pricetag" size={24} color={COLORS.success} />
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {formatCurrency(Math.round(product.revenue / product.sales))}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg. Price</Text>
            </View>
          </View>
        </Animated.View>

        {/* Sales Chart */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: chartAnim,
              transform: [
                {
                  translateY: chartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {renderMiniChart()}
        </Animated.View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Insights</Text>
          <View style={styles.insightsList}>
            <View style={[styles.insightItem, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
              <View style={[styles.insightIcon, { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight }]}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>High Conversion Rate</Text>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                  Your conversion rate of {product.conversionRate}% is above average
                </Text>
              </View>
            </View>
            
            {product.stock < 50 && (
              <View style={[styles.insightItem, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
                <View style={[styles.insightIcon, { backgroundColor: isDark ? `${COLORS.warning}30` : COLORS.warningLight }]}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Low Stock Alert</Text>
                  <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                    Only {product.stock} units remaining. Consider restocking soon.
                  </Text>
                </View>
              </View>
            )}

            {product.growth >= 10 && (
              <View style={[styles.insightItem, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
                <View style={[styles.insightIcon, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]}>
                  <Ionicons name="trending-up" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>Strong Growth</Text>
                  <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                    This product has grown {product.growth}% - consider increasing inventory
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.insightItem, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
              <View style={[styles.insightIcon, { backgroundColor: isDark ? `${COLORS.info}30` : COLORS.infoLight }]}>
                <Ionicons name="bulb" size={20} color={COLORS.info} />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Recommendation</Text>
                <Text style={[styles.insightText, { color: colors.textSecondary }]}>
                  Peak sales day is Saturday. Consider running promotions on slow days.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryAction} onPress={handleEditProduct}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.actionGradient}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.white} />
              <Text style={styles.primaryActionText}>Edit Product</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={[styles.secondaryAction, { backgroundColor: isDark ? colors.card : COLORS.surface }]} onPress={handleAddDiscount}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>Add Discount</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryAction, { backgroundColor: isDark ? colors.card : COLORS.surface }]} onPress={handlePromote}>
              <Ionicons name="megaphone-outline" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>Promote</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: SPACING.xxl * 2 }} />
      </Animated.ScrollView>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  heroGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  heroImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...SHADOWS.medium,
  },
  heroImage: {
    width: 90,
    height: 90,
    borderRadius: 17,
  },
  headerImageContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  headerImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  heroName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  heroBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  heroStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - SPACING.md * 3) / 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  metricValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  chartTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: SPACING.md,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
    width: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  insightsList: {
    gap: SPACING.sm,
  },
  insightItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  insightText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionsSection: {
    padding: SPACING.md,
  },
  primaryAction: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  primaryActionText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  secondaryActionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
});

export default ProductAnalyticsDetailScreen;
