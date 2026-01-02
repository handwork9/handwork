import React, { useState, useRef, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import Svg, { Path, Circle, Line, G, Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FarmerStackParamList } from '../../types';
import apiClient from '../../services/apiClient';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.md * 2 - 32;
const CHART_HEIGHT = 200;

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;
type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
  profit: number;
}

interface CategoryPerformance {
  category: string;
  revenue: number;
  percentage: number;
  trend: number;
  color: string;
}

interface CustomerSegment {
  segment: string;
  count: number;
  revenue: number;
  avgOrderValue: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface InventoryHealth {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  turnoverRate: number;
}

interface BusinessMetric {
  label: string;
  value: string;
  change: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const FarmerBusinessReportsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [refreshing, setRefreshing] = useState(false);
  
  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch business reports data
  const { data: reportsData, isLoading, refetch } = useQuery({
    queryKey: ['farmer-business-reports', period],
    queryFn: async () => {
      const response = await apiClient.get<any>(`/farmers/business-reports?period=${period}`);
      return response.data?.data || response.data || response;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(contentAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Mock data for demo - will be replaced by API
  const mockData = {
    summary: {
      totalRevenue: 2850000,
      totalOrders: 342,
      totalProfit: 712500,
      avgOrderValue: 8333,
      profitMargin: 25,
      growthRate: 18.5,
    },
    revenueData: [
      { period: 'Week 1', revenue: 580000, orders: 68, profit: 145000 },
      { period: 'Week 2', revenue: 720000, orders: 85, profit: 180000 },
      { period: 'Week 3', revenue: 650000, orders: 78, profit: 162500 },
      { period: 'Week 4', revenue: 900000, orders: 111, profit: 225000 },
    ],
    categoryPerformance: [
      { category: 'Fresh Vegetables', revenue: 950000, percentage: 33, trend: 12, color: '#4CAF50' },
      { category: 'Fresh Fruits', revenue: 750000, percentage: 26, trend: 8, color: '#FF9800' },
      { category: 'Grains & Cereals', revenue: 580000, percentage: 20, trend: -3, color: '#795548' },
      { category: 'Dairy & Eggs', revenue: 420000, percentage: 15, trend: 15, color: '#2196F3' },
      { category: 'Other', revenue: 150000, percentage: 6, trend: 5, color: '#9C27B0' },
    ],
    customerSegments: [
      { segment: 'New Customers', count: 89, revenue: 520000, avgOrderValue: 5843, icon: 'person-add', color: '#4CAF50' },
      { segment: 'Returning', count: 156, revenue: 1250000, avgOrderValue: 8012, icon: 'refresh', color: '#2196F3' },
      { segment: 'Premium', count: 45, revenue: 680000, avgOrderValue: 15111, icon: 'star', color: '#FF9800' },
      { segment: 'Bulk Buyers', count: 52, revenue: 400000, avgOrderValue: 7692, icon: 'cube', color: '#9C27B0' },
    ] as CustomerSegment[],
    inventoryHealth: {
      totalProducts: 85,
      inStock: 62,
      lowStock: 15,
      outOfStock: 8,
      turnoverRate: 4.2,
    },
    metrics: [
      { label: 'Customer Retention', value: '78%', change: 5, icon: 'people', color: '#4CAF50' },
      { label: 'Repeat Purchase Rate', value: '45%', change: 8, icon: 'repeat', color: '#2196F3' },
      { label: 'Avg. Delivery Time', value: '2.5 hrs', change: -12, icon: 'time', color: '#FF9800' },
      { label: 'Customer Satisfaction', value: '4.7/5', change: 3, icon: 'happy', color: '#9C27B0' },
    ] as BusinessMetric[],
    topInsights: [
      { type: 'success', message: 'Fresh Vegetables category grew 12% this month' },
      { type: 'warning', message: '15 products are running low on stock' },
      { type: 'info', message: 'Premium customers generate 24% of revenue' },
      { type: 'success', message: 'Average order value increased by ₦650' },
    ],
  };

  const data = reportsData || mockData;
  const summary = data.summary || mockData.summary;
  const revenueData: RevenueData[] = data.revenueData || mockData.revenueData;
  const categoryPerformance: CategoryPerformance[] = data.categoryPerformance || mockData.categoryPerformance;
  const customerSegments: CustomerSegment[] = data.customerSegments || mockData.customerSegments;
  const inventoryHealth: InventoryHealth = data.inventoryHealth || mockData.inventoryHealth;
  const metrics: BusinessMetric[] = data.metrics || mockData.metrics;
  const topInsights = data.topInsights || mockData.topInsights;

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₦${(value / 1000).toFixed(0)}K`;
    }
    return `₦${value.toLocaleString()}`;
  };

  const formatNumber = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const handleExportReport = async () => {
    try {
      const reportText = `📊 BUSINESS REPORT\n\n` +
        `📅 Period: ${period.charAt(0).toUpperCase() + period.slice(1)}\n\n` +
        `💰 FINANCIAL SUMMARY\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `Total Revenue: ${formatCurrency(summary.totalRevenue)}\n` +
        `Total Orders: ${summary.totalOrders}\n` +
        `Total Profit: ${formatCurrency(summary.totalProfit)}\n` +
        `Profit Margin: ${summary.profitMargin}%\n` +
        `Growth Rate: ${summary.growthRate}%\n\n` +
        `📦 CATEGORY PERFORMANCE\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        categoryPerformance.map(c => 
          `${c.category}: ${formatCurrency(c.revenue)} (${c.percentage}%)`
        ).join('\n') +
        `\n\n📈 KEY METRICS\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        metrics.map(m => `${m.label}: ${m.value}`).join('\n') +
        `\n\n🔔 INSIGHTS\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        topInsights.map((i: any) => `• ${i.message}`).join('\n') +
        `\n\nGenerated on ${new Date().toLocaleString()}`;

      await Share.share({
        message: reportText,
        title: 'Business Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  // Revenue chart path
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const revenueChartPath = revenueData.map((point, index) => {
    const x = (index / (revenueData.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - (point.revenue / maxRevenue) * CHART_HEIGHT * 0.85;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Area chart fill path
  const areaPath = `${revenueChartPath} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  // Render header
  const renderHeader = () => (
    <LinearGradient
      colors={isDark ? ['#1a472a', '#0d3320'] : ['#2E7D32', '#1B5E20']}
      style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Business Reports</Text>
          <Text style={styles.headerSubtitle}>Comprehensive analytics</Text>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportReport}
        >
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Period selector */}
      <View style={styles.periodSelector}>
        {(['week', 'month', 'quarter', 'year'] as ReportPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodButton,
              period === p && styles.periodButtonActive,
            ]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[
              styles.periodButtonText,
              period === p && styles.periodButtonTextActive,
            ]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );

  // Render summary cards
  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Overview</Text>
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="cash" size={22} color="#4CAF50" />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrency(summary.totalRevenue)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
          <View style={[styles.changeBadge, { backgroundColor: summary.growthRate >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
            <Ionicons 
              name={summary.growthRate >= 0 ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={summary.growthRate >= 0 ? '#4CAF50' : '#F44336'} 
            />
            <Text style={[styles.changeText, { color: summary.growthRate >= 0 ? '#4CAF50' : '#F44336' }]}>
              {Math.abs(summary.growthRate)}%
            </Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="cube" size={22} color="#2196F3" />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {summary.totalOrders}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Orders</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="wallet" size={22} color="#FF9800" />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatCurrency(summary.totalProfit)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Net Profit</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="analytics" size={22} color="#9C27B0" />
          </View>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {summary.profitMargin}%
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Profit Margin</Text>
        </View>
      </View>
    </View>
  );

  // Render revenue trend chart
  const renderRevenueTrend = () => (
    <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Revenue Trend</Text>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Revenue</Text>
          </View>
        </View>
      </View>
      
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.chart}>
        <Defs>
          <SvgLinearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4CAF50" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#4CAF50" stopOpacity="0.05" />
          </SvgLinearGradient>
        </Defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <Line
            key={index}
            x1={0}
            y1={CHART_HEIGHT * ratio}
            x2={CHART_WIDTH}
            y2={CHART_HEIGHT * ratio}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        ))}
        
        {/* Area fill */}
        <Path d={areaPath} fill="url(#revenueGradient)" />
        
        {/* Line */}
        <Path
          d={revenueChartPath}
          fill="none"
          stroke="#4CAF50"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {revenueData.map((point, index) => {
          const x = (index / (revenueData.length - 1)) * CHART_WIDTH;
          const y = CHART_HEIGHT - (point.revenue / maxRevenue) * CHART_HEIGHT * 0.85;
          return (
            <G key={index}>
              <Circle cx={x} cy={y} r={6} fill="#fff" />
              <Circle cx={x} cy={y} r={4} fill="#4CAF50" />
            </G>
          );
        })}
      </Svg>
      
      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {revenueData.map((point, index) => (
          <Text key={index} style={[styles.xAxisLabel, { color: colors.textSecondary }]}>
            {point.period}
          </Text>
        ))}
      </View>
    </View>
  );

  // Render category breakdown
  const renderCategoryBreakdown = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Performance</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
          <Text style={styles.seeAllText}>See Details</Text>
        </TouchableOpacity>
      </View>
      
      {categoryPerformance.map((category, index) => (
        <View key={index} style={styles.categoryItem}>
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: colors.text }]}>{category.category}</Text>
              <Text style={[styles.categoryRevenue, { color: colors.textSecondary }]}>
                {formatCurrency(category.revenue)}
              </Text>
            </View>
          </View>
          <View style={styles.categoryRight}>
            <Text style={[styles.categoryPercentage, { color: colors.text }]}>{category.percentage}%</Text>
            <View style={[styles.trendBadge, { backgroundColor: category.trend >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
              <Ionicons 
                name={category.trend >= 0 ? 'arrow-up' : 'arrow-down'} 
                size={10} 
                color={category.trend >= 0 ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[styles.trendText, { color: category.trend >= 0 ? '#4CAF50' : '#F44336' }]}>
                {Math.abs(category.trend)}%
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // Render customer segments
  const renderCustomerSegments = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: SPACING.md }]}>Customer Segments</Text>
      
      <View style={styles.segmentsGrid}>
        {customerSegments.map((segment, index) => (
          <View key={index} style={[styles.segmentCard, { backgroundColor: isDark ? colors.background : '#F8F9FA' }]}>
            <View style={[styles.segmentIcon, { backgroundColor: segment.color + '20' }]}>
              <Ionicons name={segment.icon} size={20} color={segment.color} />
            </View>
            <Text style={[styles.segmentName, { color: colors.text }]}>{segment.segment}</Text>
            <Text style={[styles.segmentCount, { color: colors.textSecondary }]}>{segment.count} customers</Text>
            <Text style={[styles.segmentRevenue, { color: segment.color }]}>{formatCurrency(segment.revenue)}</Text>
            <Text style={[styles.segmentAvg, { color: colors.textSecondary }]}>
              Avg: {formatCurrency(segment.avgOrderValue)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Render inventory health
  const renderInventoryHealth = () => {
    const stockPercentage = (inventoryHealth.inStock / inventoryHealth.totalProducts) * 100;
    const lowStockPercentage = (inventoryHealth.lowStock / inventoryHealth.totalProducts) * 100;
    const outOfStockPercentage = (inventoryHealth.outOfStock / inventoryHealth.totalProducts) * 100;

    return (
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inventory Health</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FarmerTabs', { screen: 'Products' } as any)}>
            <Text style={styles.seeAllText}>Manage</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inventoryStats}>
          <View style={styles.inventoryStat}>
            <View style={[styles.inventoryIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.inventoryStatValue, { color: colors.text }]}>{inventoryHealth.inStock}</Text>
            <Text style={[styles.inventoryStatLabel, { color: colors.textSecondary }]}>In Stock</Text>
          </View>
          
          <View style={styles.inventoryStat}>
            <View style={[styles.inventoryIconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="alert-circle" size={24} color="#FF9800" />
            </View>
            <Text style={[styles.inventoryStatValue, { color: colors.text }]}>{inventoryHealth.lowStock}</Text>
            <Text style={[styles.inventoryStatLabel, { color: colors.textSecondary }]}>Low Stock</Text>
          </View>
          
          <View style={styles.inventoryStat}>
            <View style={[styles.inventoryIconBg, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="close-circle" size={24} color="#F44336" />
            </View>
            <Text style={[styles.inventoryStatValue, { color: colors.text }]}>{inventoryHealth.outOfStock}</Text>
            <Text style={[styles.inventoryStatLabel, { color: colors.textSecondary }]}>Out of Stock</Text>
          </View>
        </View>
        
        {/* Stock bar */}
        <View style={styles.stockBarContainer}>
          <View style={styles.stockBar}>
            <View style={[styles.stockBarSegment, { width: `${stockPercentage}%`, backgroundColor: '#4CAF50' }]} />
            <View style={[styles.stockBarSegment, { width: `${lowStockPercentage}%`, backgroundColor: '#FF9800' }]} />
            <View style={[styles.stockBarSegment, { width: `${outOfStockPercentage}%`, backgroundColor: '#F44336' }]} />
          </View>
        </View>
        
        <View style={styles.turnoverInfo}>
          <Ionicons name="refresh" size={18} color="#2196F3" />
          <Text style={[styles.turnoverText, { color: colors.textSecondary }]}>
            Inventory Turnover Rate: <Text style={{ color: '#2196F3', fontWeight: '600' }}>{inventoryHealth.turnoverRate}x</Text> per month
          </Text>
        </View>
      </View>
    );
  };

  // Render key metrics
  const renderKeyMetrics = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: SPACING.md }]}>Key Performance Indicators</Text>
      
      {metrics.map((metric, index) => (
        <View key={index} style={[styles.metricItem, index < metrics.length - 1 && styles.metricItemBorder, { borderBottomColor: colors.border }]}>
          <View style={styles.metricLeft}>
            <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
              <Ionicons name={metric.icon} size={18} color={metric.color} />
            </View>
            <Text style={[styles.metricLabel, { color: colors.text }]}>{metric.label}</Text>
          </View>
          <View style={styles.metricRight}>
            <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
            <View style={[styles.metricChange, { backgroundColor: metric.change >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
              <Ionicons 
                name={metric.change >= 0 ? 'arrow-up' : 'arrow-down'} 
                size={10} 
                color={metric.change >= 0 ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[styles.metricChangeText, { color: metric.change >= 0 ? '#4CAF50' : '#F44336' }]}>
                {Math.abs(metric.change)}%
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // Render insights
  const renderInsights = () => (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Insights</Text>
        <View style={[styles.aiBadge, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="sparkles" size={12} color="#4CAF50" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </View>
      
      {topInsights.map((insight: any, index: number) => {
        const getInsightStyle = () => {
          switch (insight.type) {
            case 'success': return { bg: '#E8F5E9', icon: 'checkmark-circle', color: '#4CAF50' };
            case 'warning': return { bg: '#FFF3E0', icon: 'alert-circle', color: '#FF9800' };
            case 'info': return { bg: '#E3F2FD', icon: 'information-circle', color: '#2196F3' };
            default: return { bg: '#F3E5F5', icon: 'bulb', color: '#9C27B0' };
          }
        };
        const style = getInsightStyle();
        
        return (
          <View key={index} style={[styles.insightItem, { backgroundColor: style.bg }]}>
            <Ionicons name={style.icon as any} size={20} color={style.color} />
            <Text style={[styles.insightText, { color: style.color }]}>{insight.message}</Text>
          </View>
        );
      })}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        {renderHeader()}
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading business reports...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {renderSummaryCards()}
          {renderRevenueTrend()}
          {renderCategoryBreakdown()}
          {renderCustomerSegments()}
          {renderInventoryHealth()}
          {renderKeyMetrics()}
          {renderInsights()}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    marginTop: SPACING.md,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#fff',
  },
  periodButtonText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.medium,
  },
  periodButtonTextActive: {
    color: '#2E7D32',
    fontFamily: FONTS.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  summaryContainer: {
    marginBottom: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    marginHorizontal: -SPACING.xs / 2,
  },
  summaryCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  changeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  section: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  chartCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  chartLegend: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
  },
  chart: {
    marginLeft: -4,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  categoryRevenue: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryPercentage: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  trendText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginLeft: 2,
  },
  segmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs / 2,
  },
  segmentCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  segmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  segmentName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  segmentCount: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  segmentRevenue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginTop: SPACING.xs,
  },
  segmentAvg: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  inventoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  inventoryStat: {
    alignItems: 'center',
  },
  inventoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  inventoryStatValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  inventoryStatLabel: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  stockBarContainer: {
    marginVertical: SPACING.md,
  },
  stockBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stockBarSegment: {
    height: '100%',
  },
  turnoverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnoverText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  metricItemBorder: {
    borderBottomWidth: 1,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  metricLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginRight: SPACING.sm,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  metricChangeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginLeft: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    color: '#4CAF50',
    marginLeft: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  insightText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.sm,
  },
});

export default FarmerBusinessReportsScreen;
