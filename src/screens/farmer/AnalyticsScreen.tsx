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
  Modal,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Line, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { API_CONFIG } from '../../constants/config';
import { useTheme } from '../../context/ThemeContext';
import { FarmerStackParamList } from '../../types';
import { farmerSubscriptionService, SubscriptionStatusResponse } from '../../services/farmerSubscriptionService';
import { farmerAnalyticsService } from '../../services/farmerAnalyticsService';
import { getProductIllustration } from '../../assets/illustrations/products';
import { useAppDispatch, useAppSelector } from '../../store';
import { useFarmerDashboard } from '../../hooks/useFarmerSocket';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.md * 2;

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;

type TimePeriod = 'week' | 'month' | 'year' | 'custom';

// Date range presets
const DATE_PRESETS = [
  { key: 'today', label: 'Today', days: 0 },
  { key: 'yesterday', label: 'Yesterday', days: 1 },
  { key: 'last7', label: 'Last 7 Days', days: 7 },
  { key: 'last30', label: 'Last 30 Days', days: 30 },
  { key: 'last90', label: 'Last 90 Days', days: 90 },
] as const;

interface SalesData {
  label: string;
  value: number;
  orders: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
  image: string;
  views: number;
  conversionRate: number;
  stock: number;
}

interface CustomerInsight {
  metric: string;
  value: string;
  change: number;
  icon: keyof typeof Ionicons.glyphMap;
}

const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  
  // Custom date range state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [dateInputStart, setDateInputStart] = useState('');
  const [dateInputEnd, setDateInputEnd] = useState('');
  // Native date picker state
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [tempDate, setTempDate] = useState(new Date());
  
  // Comparison mode state
  const [showComparison, setShowComparison] = useState(false);
  
  // Goal setting state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  
  // Use Redux for real-time dashboard updates
  const { stats: reduxDashboardStats, earnings: reduxEarnings } = useFarmerDashboard();

  // Fetch subscription status
  const { data: subscriptionStatus } = useQuery<SubscriptionStatusResponse>({
    queryKey: ['farmer-subscription-status'],
    queryFn: () => farmerSubscriptionService.getSubscriptionStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch dashboard stats (also synced to Redux via DashboardScreen)
  const { data: dashboardStats, isLoading: isDashboardLoading } = useQuery<any>({
    queryKey: ['farmer-dashboard-stats'],
    queryFn: () => farmerAnalyticsService.getDashboard(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sales data based on selected period
  const { data: salesDataResponse, isLoading: isSalesLoading } = useQuery<any>({
    queryKey: ['farmer-sales-data', timePeriod, customStartDate, customEndDate],
    queryFn: () => {
      if (timePeriod === 'custom' && customStartDate && customEndDate) {
        return farmerAnalyticsService.getSalesDataByDateRange(
          customStartDate.toISOString().split('T')[0],
          customEndDate.toISOString().split('T')[0]
        );
      }
      return farmerAnalyticsService.getSalesData(timePeriod as 'week' | 'month' | 'year');
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top products
  const { data: topProductsResponse, isLoading: isProductsLoading } = useQuery<any>({
    queryKey: ['farmer-top-products'],
    queryFn: () => farmerAnalyticsService.getTopProducts(5),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch customer insights
  const { data: customerInsightsResponse, isLoading: isCustomerLoading } = useQuery<any>({
    queryKey: ['farmer-customer-insights'],
    queryFn: () => farmerAnalyticsService.getCustomerInsights(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch revenue breakdown
  const { data: revenueBreakdownResponse, isLoading: isRevenueLoading } = useQuery<any>({
    queryKey: ['farmer-revenue-breakdown'],
    queryFn: () => farmerAnalyticsService.getRevenueBreakdown(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch comparison data
  const { data: comparisonData, isLoading: isComparisonLoading } = useQuery<any>({
    queryKey: ['farmer-comparison', timePeriod],
    queryFn: () => farmerAnalyticsService.getComparisonData(timePeriod === 'custom' ? 'week' : timePeriod),
    staleTime: 5 * 60 * 1000,
    enabled: showComparison,
  });

  // Fetch revenue goal
  const { data: revenueGoal, isLoading: isGoalLoading } = useQuery<any>({
    queryKey: ['farmer-revenue-goal'],
    queryFn: () => farmerAnalyticsService.getRevenueGoal(),
    staleTime: 5 * 60 * 1000,
  });

  // Set revenue goal mutation
  const setGoalMutation = useMutation({
    mutationFn: (goal: number) => farmerAnalyticsService.setRevenueGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-revenue-goal'] });
      setShowGoalModal(false);
      setGoalInput('');
      Alert.alert('Success', 'Revenue goal updated!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update goal');
    },
  });

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header scroll animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleExportReport = async () => {
    try {
      const reportData = salesData.map(d => 
        `${d.label}: ${formatCurrency(d.value)} (${d.orders} orders)`
      ).join('\n');

      const topProductsData = topProducts.slice(0, 5).map((p, i) => 
        `${i + 1}. ${p.name}: ${formatCurrency(p.revenue)}`
      ).join('\n');

      await Share.share({
        message: `📊 Farm Analytics Report\n\n` +
          `📅 Period: ${timePeriod === 'week' ? 'This Week' : timePeriod === 'month' ? 'This Month' : 'This Year'}\n\n` +
          `💰 Total Revenue: ${formatCurrency(totalRevenue)}\n` +
          `📦 Total Orders: ${totalOrders}\n` +
          `🛒 Avg. Order Value: ${formatCurrency(avgOrderValue)}\n\n` +
          `📈 Sales Breakdown:\n${reportData}\n\n` +
          `🏆 Top Products:\n${topProductsData}\n\n` +
          `Generated on ${new Date().toLocaleDateString()}`,
        title: 'Farm Analytics Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(headerAnim, {
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
      Animated.spring(cardsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Reset chart animation on period change
  useEffect(() => {
    chartAnim.setValue(0);
    Animated.spring(chartAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setSelectedBarIndex(null);
  }, [timePeriod]);

  // Extract data from API responses with fallbacks (service already unwraps)
  const salesData: SalesData[] = salesDataResponse || [];
  const topProducts: ProductPerformance[] = (topProductsResponse || []).map((p: any) => {
    // Build proper image URL
    const rawImage = p.images?.[0] || p.image || '';
    let imageUrl = '';
    if (rawImage) {
      if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
        imageUrl = rawImage;
      } else {
        imageUrl = `${API_CONFIG.BASE_URL.replace('/api/v1', '')}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
      }
    }
    
    return {
      id: p.id,
      name: p.title || p.name,
      sales: p.sales || 0,
      revenue: p.revenue || 0,
      growth: p.growth || 0,
      image: imageUrl,
      views: p.views || 0,
      conversionRate: p.conversionRate || 0,
      stock: p.stock || 0,
    };
  });
  const customerInsights: CustomerInsight[] = (customerInsightsResponse || []).map((c: any) => ({
    metric: c.metric,
    value: c.value,
    change: c.change || 0,
    icon: c.icon as keyof typeof Ionicons.glyphMap,
  }));
  const revenueBreakdownData = revenueBreakdownResponse || { total: 0, breakdown: [] };
  const revenueBreakdown = revenueBreakdownData.breakdown || [];
  const dashboardData = dashboardStats || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, revenueGrowth: 0 };

  const maxValue = salesData.length > 0 ? Math.max(...salesData.map(d => d.value)) : 1;
  const totalRevenue = (dashboardData as any).totalRevenue || salesData.reduce((sum, d) => sum + d.value, 0);
  const totalOrders = (dashboardData as any).totalOrders || salesData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = (dashboardData as any).avgOrderValue || (totalOrders > 0 ? totalRevenue / totalOrders : 0);
  const growth = (dashboardData as any).revenueGrowth || 0;

  const isLoading = isDashboardLoading || isSalesLoading || isProductsLoading || isCustomerLoading;

  const formatCurrency = (value: number): string => {
    if (value === undefined || value === null) return '₦0';
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}K`;
    }
    return `₦${value.toLocaleString()}`;
  };

  // Parse date string DD/MM/YYYY to Date object
  const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const date = new Date(year, month, day);
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) return null;
    return date;
  };

  // Format Date to DD/MM/YYYY string
  const formatDateToString = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Apply date preset
  const applyDatePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    if (days === 0) {
      // Today
      start.setHours(0, 0, 0, 0);
    } else if (days === 1) {
      // Yesterday
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
    } else {
      start.setDate(start.getDate() - days);
    }
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDateInputStart(formatDateToString(start));
    setDateInputEnd(formatDateToString(end));
  };

  // Apply custom date range
  const applyCustomDateRange = () => {
    const start = parseDate(dateInputStart);
    const end = parseDate(dateInputEnd);
    
    if (!start || !end) {
      Alert.alert('Invalid Date', 'Please enter dates in DD/MM/YYYY format');
      return;
    }
    
    if (start > end) {
      Alert.alert('Invalid Range', 'Start date must be before end date');
      return;
    }
    
    if (end > new Date()) {
      Alert.alert('Invalid Date', 'End date cannot be in the future');
      return;
    }
    
    setCustomStartDate(start);
    setCustomEndDate(end);
    setTimePeriod('custom');
    setShowDatePicker(false);
  };

  // Handle native date picker change
  const onNativeDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowNativePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      if (pickerMode === 'start') {
        setCustomStartDate(selectedDate);
        setDateInputStart(formatDateToString(selectedDate));
      } else {
        setCustomEndDate(selectedDate);
        setDateInputEnd(formatDateToString(selectedDate));
      }
    }
  };

  const openNativePicker = (mode: 'start' | 'end') => {
    setPickerMode(mode);
    setTempDate(mode === 'start' ? (customStartDate || new Date()) : (customEndDate || new Date()));
    setShowNativePicker(true);
  };

  // Render date picker modal
  const renderDatePickerModal = () => (
    <Modal
      visible={showDatePicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <TouchableOpacity 
        style={styles.bottomSheetOverlay} 
        activeOpacity={1} 
        onPress={() => setShowDatePicker(false)}
      >
        <TouchableOpacity activeOpacity={1} style={[styles.datePickerBottomSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {/* Handle Bar */}
          <View style={styles.bottomSheetHandle}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#555' : '#D1D1D6' }]} />
          </View>
          <Text style={[styles.datePickerTitle, { color: colors.text }]}>Select Date Range</Text>
          
          {/* Date Presets */}
          <View style={styles.datePresetsSection}>
            <Text style={[styles.datePresetsSectionTitle, { color: colors.textSecondary }]}>Quick Select</Text>
            <View style={styles.datePresets}>
              {DATE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.key}
                  style={[styles.datePresetButton, { backgroundColor: isDark ? '#3A3A3C' : '#F5F5F5' }]}
                  onPress={() => applyDatePreset(preset.days)}
                >
                  <Text style={[styles.datePresetText, { color: colors.text }]}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Custom Date Input with Native Picker */}
          <View style={styles.customDateSection}>
            <Text style={[styles.customDateSectionTitle, { color: colors.textSecondary }]}>
              Custom Range
            </Text>
            <View style={styles.dateInputRow}>
              <TouchableOpacity 
                style={styles.dateInputContainer}
                onPress={() => openNativePicker('start')}
              >
                <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>From</Text>
                <View style={[styles.dateInput, { backgroundColor: isDark ? '#3A3A3C' : '#F5F5F5', borderColor: isDark ? '#4A4A4C' : '#E5E5E5' }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={{ color: dateInputStart ? colors.text : colors.textSecondary, flex: 1 }}>
                    {dateInputStart || 'Select date'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dateInputContainer}
                onPress={() => openNativePicker('end')}
              >
                <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>To</Text>
                <View style={[styles.dateInput, { backgroundColor: isDark ? '#3A3A3C' : '#F5F5F5', borderColor: isDark ? '#4A4A4C' : '#E5E5E5' }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={{ color: dateInputEnd ? colors.text : colors.textSecondary, flex: 1 }}>
                    {dateInputEnd || 'Select date'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Native Date Picker for iOS */}
          {showNativePicker && Platform.OS === 'ios' && (
            <View style={[styles.nativePickerContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={onNativeDateChange}
                maximumDate={new Date()}
                textColor={isDark ? '#FFFFFF' : '#000000'}
                themeVariant={isDark ? 'dark' : 'light'}
              />
              <TouchableOpacity 
                style={styles.pickerDoneButton}
                onPress={() => setShowNativePicker(false)}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.datePickerButtons}>
            <TouchableOpacity
              style={[styles.cancelDateButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7', borderWidth: 1, borderColor: isDark ? '#4A4A4C' : '#E5E5E5' }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[styles.cancelDateButtonText, { color: isDark ? '#FFFFFF' : '#666666' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyDateButton}
              onPress={applyCustomDateRange}
            >
              <Text style={styles.applyDateButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Android Date Picker */}
      {showNativePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={onNativeDateChange}
          maximumDate={new Date()}
        />
      )}
    </Modal>
  );

  const renderBarChart = () => {
    if (isSalesLoading) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, alignItems: 'center', justifyContent: 'center', height: 200 }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    if (salesData.length === 0) {
      return (
        <View style={[styles.chartContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, alignItems: 'center', justifyContent: 'center', height: 200 }]}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: SPACING.sm }]}>No sales data available</Text>
        </View>
      );
    }

    const barWidth = (CHART_WIDTH - SPACING.md * 2) / salesData.length - 8;

    return (
      <View style={[styles.chartContainer, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
        <View style={styles.chartBars}>
          {salesData.map((data, index) => {
            const barHeight = (data.value / maxValue) * 150;
            const isSelected = selectedBarIndex === index;

            return (
              <TouchableOpacity
                key={index}
                style={styles.barWrapper}
                onPress={() => setSelectedBarIndex(isSelected ? null : index)}
                activeOpacity={0.7}
              >
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
                    colors={isSelected ? [COLORS.secondary, COLORS.secondaryDark] : [COLORS.primary, COLORS.primaryDark]}
                    style={[styles.barGradient, { borderRadius: BORDER_RADIUS.sm }]}
                  />
                </Animated.View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }, isSelected && styles.barLabelSelected]}>
                  {data.label}
                </Text>
                {isSelected && (
                  <View style={[styles.tooltip, { backgroundColor: colors.text }]}>
                    <Text style={styles.tooltipValue}>{formatCurrency(data.value)}</Text>
                    <Text style={styles.tooltipOrders}>{data.orders} orders</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSummaryCards = () => (
    <View style={styles.summaryGrid}>
      <View style={[styles.summaryCard, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]}>
        <Ionicons name="trending-up" size={24} color={COLORS.primary} />
        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalRevenue)}</Text>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: isDark ? `${COLORS.secondary}30` : COLORS.secondaryLight }]}>
        <Ionicons name="bag-check" size={24} color={COLORS.secondary} />
        <Text style={[styles.summaryValue, { color: colors.text }]}>{totalOrders}</Text>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Orders</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: isDark ? `${COLORS.accent}30` : COLORS.accentLight }]}>
        <Ionicons name="pricetag" size={24} color={COLORS.accent} />
        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(avgOrderValue)}</Text>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg. Order</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight }]}>
        <Ionicons name={growth >= 0 ? "arrow-up-circle" : "arrow-down-circle"} size={24} color={growth >= 0 ? COLORS.success : COLORS.error} />
        <Text style={[styles.summaryValue, { color: colors.text }]}>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</Text>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Growth</Text>
      </View>
    </View>
  );

  const renderTopProducts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TopProducts')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {isProductsLoading ? (
        <View style={[styles.productCard, { backgroundColor: isDark ? colors.card : COLORS.surface, justifyContent: 'center', alignItems: 'center', height: 80 }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : topProducts.length === 0 ? (
        <View style={[styles.productCard, { backgroundColor: isDark ? colors.card : COLORS.surface, justifyContent: 'center', alignItems: 'center', height: 80 }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No product data available</Text>
        </View>
      ) : (
        topProducts.map((product, index) => (
          <TouchableOpacity
            key={product.id}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ProductAnalyticsDetail', { product })}
          >
            <Animated.View
              style={[
                styles.productCard,
                { backgroundColor: isDark ? colors.card : COLORS.surface },
                {
                  opacity: cardsAnim,
                  transform: [
                    {
                      translateX: cardsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.productRank, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]}>
                <Text style={styles.rankNumber}>#{index + 1}</Text>
              </View>
              <View style={styles.productImageContainer}>
                {product.image ? (
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.productImage} 
                    resizeMode="cover"
                  />
                ) : (
                  getProductIllustration(product.name, 36)
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                <Text style={[styles.productSales, { color: colors.textSecondary }]}>{product.sales} sold</Text>
              </View>
              <View style={styles.productStats}>
                <Text style={[styles.productRevenue, { color: colors.text }]}>{formatCurrency(product.revenue)}</Text>
                <View style={[styles.growthBadge, product.growth >= 0 ? styles.growthPositive : styles.growthNegative]}>
                  <Ionicons
                    name={product.growth >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={product.growth >= 0 ? COLORS.success : COLORS.error}
                  />
                  <Text style={[styles.growthText, product.growth >= 0 ? styles.growthTextPositive : styles.growthTextNegative]}>
                    {Math.abs(product.growth)}%
                  </Text>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderCustomerInsights = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Insights</Text>
      {isCustomerLoading ? (
        <View style={[styles.insightsGrid, { justifyContent: 'center', alignItems: 'center', height: 100 }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : customerInsights.length === 0 ? (
        <View style={[styles.insightsGrid, { justifyContent: 'center', alignItems: 'center', height: 100 }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No customer data available</Text>
        </View>
      ) : (
        <View style={styles.insightsGrid}>
          {customerInsights.map((insight, index) => (
            <View key={index} style={[styles.insightCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
              <View style={[styles.insightIconContainer, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]}>
                <Ionicons name={insight.icon} size={20} color={COLORS.primary} />
              </View>
              <Text style={[styles.insightValue, { color: colors.text }]}>{insight.value}</Text>
              <Text style={[styles.insightMetric, { color: colors.textSecondary }]}>{insight.metric}</Text>
              <View style={[styles.insightChange, insight.change >= 0 ? styles.changePositive : styles.changeNegative]}>
                <Ionicons
                  name={insight.change >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={insight.change >= 0 ? COLORS.success : COLORS.error}
                />
                <Text style={[styles.changeText, insight.change >= 0 ? styles.changeTextPositive : styles.changeTextNegative]}>
                  {insight.change >= 0 ? '+' : ''}{insight.change}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const breakdownColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning];

  const renderRevenueBreakdown = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Breakdown</Text>
      {isRevenueLoading ? (
        <View style={[styles.breakdownCard, { backgroundColor: isDark ? colors.card : COLORS.surface, justifyContent: 'center', alignItems: 'center', height: 150 }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : revenueBreakdown.length === 0 ? (
        <View style={[styles.breakdownCard, { backgroundColor: isDark ? colors.card : COLORS.surface, justifyContent: 'center', alignItems: 'center', height: 150 }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No revenue data available</Text>
        </View>
      ) : (
        <View style={[styles.breakdownCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          {revenueBreakdown.map((item: any, index: number) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={[styles.breakdownBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]}>
                <View style={[styles.breakdownFill, { width: `${item.percentage || 0}%`, backgroundColor: breakdownColors[index % breakdownColors.length] }]} />
              </View>
              <View style={styles.breakdownInfo}>
                <View style={[styles.breakdownDot, { backgroundColor: breakdownColors[index % breakdownColors.length] }]} />
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{item.category || 'Unknown'}</Text>
                <Text style={[styles.breakdownPercent, { color: colors.text }]}>{item.percentage || 0}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Goal Progress Card
  const renderGoalProgress = () => {
    const goal = revenueGoal?.goal || 0;
    const current = totalRevenue;
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    const remaining = Math.max(goal - current, 0);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Goal</Text>
          <TouchableOpacity onPress={() => setShowGoalModal(true)}>
            <Text style={styles.seeAll}>{goal > 0 ? 'Edit' : 'Set Goal'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.goalCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          {goal > 0 ? (
            <>
              <View style={styles.goalHeader}>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalCurrentLabel, { color: colors.textSecondary }]}>Current</Text>
                  <Text style={[styles.goalCurrentValue, { color: colors.text }]}>{formatCurrency(current)}</Text>
                </View>
                <View style={[styles.goalInfo, { alignItems: 'flex-end' }]}>
                  <Text style={[styles.goalCurrentLabel, { color: colors.textSecondary }]}>Target</Text>
                  <Text style={[styles.goalTargetValue, { color: COLORS.primary }]}>{formatCurrency(goal)}</Text>
                </View>
              </View>
              
              <View style={styles.goalProgressContainer}>
                <View style={[styles.goalProgressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                  <LinearGradient
                    colors={percentage >= 100 ? ['#34C759', '#30D158'] : [COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.goalProgressFill, { width: `${percentage}%` }]}
                  />
                </View>
                <Text style={[styles.goalPercentage, { color: percentage >= 100 ? COLORS.success : COLORS.primary }]}>
                  {percentage.toFixed(0)}%
                </Text>
              </View>
              
              {percentage < 100 && (
                <Text style={[styles.goalRemaining, { color: colors.textSecondary }]}>
                  {formatCurrency(remaining)} to go
                </Text>
              )}
              {percentage >= 100 && (
                <View style={styles.goalAchieved}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.goalAchievedText}>Goal Achieved! 🎉</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noGoalContainer}>
              <Ionicons name="flag-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.noGoalText, { color: colors.textSecondary }]}>Set a monthly revenue goal to track your progress</Text>
              <TouchableOpacity
                style={styles.setGoalButton}
                onPress={() => setShowGoalModal(true)}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.setGoalButtonText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Comparison Card
  const renderComparisonCard = () => {
    if (!showComparison) return null;
    
    const comparison = comparisonData || {
      current: { revenue: totalRevenue, orders: totalOrders, avgOrder: avgOrderValue },
      previous: { revenue: 0, orders: 0, avgOrder: 0 },
      changes: { revenue: growth, orders: 0, avgOrder: 0 },
    };

    const metrics = [
      { label: 'Revenue', current: comparison.current.revenue, previous: comparison.previous.revenue, change: comparison.changes.revenue, format: formatCurrency },
      { label: 'Orders', current: comparison.current.orders, previous: comparison.previous.orders, change: comparison.changes.orders, format: (v: number) => v.toString() },
      { label: 'Avg. Order', current: comparison.current.avgOrder, previous: comparison.previous.avgOrder, change: comparison.changes.avgOrder, format: formatCurrency },
    ];

    const periodLabel = timePeriod === 'week' ? 'Week' : timePeriod === 'month' ? 'Month' : 'Year';

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>This {periodLabel} vs Last {periodLabel}</Text>
        <View style={[styles.comparisonCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          {isComparisonLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            metrics.map((metric, index) => (
              <View key={index} style={[styles.comparisonRow, index < metrics.length - 1 && styles.comparisonRowBorder]}>
                <View style={styles.comparisonMetric}>
                  <Text style={[styles.comparisonLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
                </View>
                <View style={styles.comparisonValues}>
                  <View style={styles.comparisonColumn}>
                    <Text style={[styles.comparisonPeriodLabel, { color: colors.textSecondary }]}>Current</Text>
                    <Text style={[styles.comparisonValue, { color: colors.text }]}>{metric.format(metric.current)}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} style={{ marginHorizontal: 8 }} />
                  <View style={styles.comparisonColumn}>
                    <Text style={[styles.comparisonPeriodLabel, { color: colors.textSecondary }]}>Previous</Text>
                    <Text style={[styles.comparisonValuePrevious, { color: colors.textSecondary }]}>{metric.format(metric.previous)}</Text>
                  </View>
                  <View style={[styles.comparisonChange, metric.change >= 0 ? styles.changePositive : styles.changeNegative]}>
                    <Ionicons name={metric.change >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={metric.change >= 0 ? COLORS.success : COLORS.error} />
                    <Text style={[styles.comparisonChangeText, { color: metric.change >= 0 ? COLORS.success : COLORS.error }]}>
                      {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    );
  };

  // Line Chart for Trends using SVG
  const renderLineChart = () => {
    if (salesData.length < 2) return null;

    const chartHeight = 140;
    const chartPadding = 20;
    const effectiveWidth = CHART_WIDTH - chartPadding * 2;
    const effectiveHeight = chartHeight - chartPadding * 2;
    
    const maxVal = Math.max(...salesData.map(d => d.value), 1);
    const minVal = Math.min(...salesData.map(d => d.value));
    const range = maxVal - minVal || 1;

    // Generate SVG path points
    const points = salesData.map((d, i) => ({
      x: chartPadding + (i / (salesData.length - 1)) * effectiveWidth,
      y: chartPadding + effectiveHeight - ((d.value - minVal) / range) * effectiveHeight,
    }));

    // Create SVG path string for the line
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Create path for the gradient fill area
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - chartPadding} L ${chartPadding} ${chartHeight - chartPadding} Z`;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Trend</Text>
        <View style={[styles.lineChartContainer, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Svg width={CHART_WIDTH} height={chartHeight}>
            <Defs>
              <SvgLinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                <Stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.05} />
              </SvgLinearGradient>
            </Defs>
            
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <Line
                key={i}
                x1={chartPadding}
                y1={chartPadding + effectiveHeight * (1 - ratio)}
                x2={CHART_WIDTH - chartPadding}
                y2={chartPadding + effectiveHeight * (1 - ratio)}
                stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
                strokeWidth={1}
              />
            ))}
            
            {/* Gradient area under the line */}
            <Path
              d={areaPath}
              fill="url(#areaGradient)"
            />
            
            {/* Main line */}
            <Path
              d={linePath}
              stroke={COLORS.primary}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {points.map((point, i) => (
              <G key={i}>
                {/* Outer circle (white border) */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={5}
                  fill="#FFFFFF"
                />
                {/* Inner circle (primary color) */}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
                  fill={COLORS.primary}
                />
              </G>
            ))}
          </Svg>
          
          {/* Labels */}
          <View style={styles.lineChartLabels}>
            {salesData.map((d, i) => (
              <Text key={i} style={[styles.lineChartLabel, { color: colors.textSecondary }]}>
                {d.label.slice(0, 3)}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Goal Setting Modal
  const renderGoalModal = () => (
    <Modal
      visible={showGoalModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowGoalModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowGoalModal(false)}
      >
        <View
          style={[styles.goalModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={[styles.goalModalTitle, { color: colors.text }]}>Set Monthly Goal</Text>
          <Text style={[styles.goalModalSubtitle, { color: colors.textSecondary }]}>
            Set a revenue target to track your progress
          </Text>
          
          <View style={styles.goalInputContainer}>
            <Text style={[styles.goalCurrencySymbol, { color: colors.text }]}>₦</Text>
            <TextInput
              style={[styles.goalInput, { color: colors.text, borderColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="numeric"
              placeholder="e.g. 500000"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          {/* Quick presets */}
          <View style={styles.goalPresets}>
            {[100000, 250000, 500000, 1000000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.goalPresetButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                onPress={() => setGoalInput(amount.toString())}
              >
                <Text style={[styles.goalPresetText, { color: colors.text }]}>
                  {amount >= 1000000 ? `${amount / 1000000}M` : `${amount / 1000}K`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.goalModalActions}>
            <TouchableOpacity
              style={[styles.goalModalButton, styles.goalModalCancelButton]}
              onPress={() => setShowGoalModal(false)}
            >
              <Text style={styles.goalModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.goalModalButton, styles.goalModalConfirmButton]}
              onPress={() => {
                const goalValue = parseInt(goalInput, 10);
                if (isNaN(goalValue) || goalValue <= 0) {
                  Alert.alert('Invalid Goal', 'Please enter a valid amount');
                  return;
                }
                setGoalMutation.mutate(goalValue);
              }}
              disabled={setGoalMutation.isPending}
            >
              <Text style={styles.goalModalConfirmText}>
                {setGoalMutation.isPending ? 'Saving...' : 'Set Goal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Subscription Status Card - Shows promotion visibility status
  const renderSubscriptionStatusCard = () => {
    if (!subscriptionStatus) return null;

    const { isActive, tier, daysRemaining, promotionBenefits, renewalInfo } = subscriptionStatus;
    
    // Determine colors based on status
    const isPremium = tier === 'premium';
    const isVerified = tier === 'verified';
    const statusColor = isPremium ? '#FFD700' : isVerified ? '#1DA1F2' : COLORS.textSecondary;
    const gradientColors: readonly [string, string, ...string[]] = isPremium 
      ? ['#FFFBEB', '#FEF3C7'] 
      : isVerified 
        ? ['#EFF6FF', '#DBEAFE'] 
        : [isDark ? colors.card : '#F8F8F8', isDark ? colors.card : '#F0F0F0'];

    // Determine urgency level for expiring subscriptions
    const isUrgent = renewalInfo?.isExpiringSoon && daysRemaining !== null && daysRemaining <= 3;
    const isWarning = renewalInfo?.isExpiringSoon && daysRemaining !== null && daysRemaining > 3;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Promotion Status</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FarmerSubscription' as any)}>
            <Text style={styles.seeAll}>{isActive ? 'Manage' : 'Upgrade'}</Text>
          </TouchableOpacity>
        </View>
        
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.subscriptionCard,
            isUrgent && styles.subscriptionCardUrgent,
            isWarning && styles.subscriptionCardWarning,
          ]}
        >
          {/* Status Badge */}
          <View style={styles.subscriptionHeader}>
            <View style={[styles.subscriptionBadge, { backgroundColor: statusColor }]}>
              <Ionicons 
                name={isPremium ? 'diamond' : isVerified ? 'shield-checkmark' : 'person'} 
                size={14} 
                color="#FFFFFF" 
              />
              <Text style={styles.subscriptionBadgeText}>
                {promotionBenefits?.tierBadge || 'Basic Seller'}
              </Text>
            </View>
            {isActive && daysRemaining !== null && (
              <View style={[
                styles.daysRemainingBadge,
                isUrgent && styles.daysRemainingUrgent,
                isWarning && styles.daysRemainingWarning,
              ]}>
                <Ionicons 
                  name={isUrgent ? 'warning' : 'time-outline'} 
                  size={12} 
                  color={isUrgent ? '#DC2626' : isWarning ? '#D97706' : colors.textSecondary} 
                />
                <Text style={[
                  styles.daysRemainingText,
                  isUrgent && styles.daysRemainingTextUrgent,
                  isWarning && styles.daysRemainingTextWarning,
                ]}>
                  {daysRemaining} days left
                </Text>
              </View>
            )}
          </View>

          {/* Visibility Status */}
          <View style={styles.visibilitySection}>
            <View style={styles.visibilityRow}>
              <Ionicons 
                name={promotionBenefits?.isShowingInVerifiedSection ? 'eye' : 'eye-off'} 
                size={20} 
                color={promotionBenefits?.isShowingInVerifiedSection ? COLORS.success : colors.textSecondary} 
              />
              <View style={styles.visibilityInfo}>
                <Text style={[styles.visibilityTitle, { color: colors.text }]}>
                  Verified Sellers Section
                </Text>
                <Text style={[styles.visibilityStatus, { 
                  color: promotionBenefits?.isShowingInVerifiedSection ? COLORS.success : colors.textSecondary 
                }]}>
                  {promotionBenefits?.isShowingInVerifiedSection 
                    ? '✓ Your products are visible to buyers!' 
                    : '✗ Not showing - Subscribe to get featured'}
                </Text>
              </View>
            </View>

            <View style={styles.visibilityRow}>
              <Ionicons name="trending-up" size={20} color={statusColor} />
              <View style={styles.visibilityInfo}>
                <Text style={[styles.visibilityTitle, { color: colors.text }]}>
                  Visibility Boost
                </Text>
                <Text style={[styles.visibilityStatus, { color: colors.textSecondary }]}>
                  {promotionBenefits?.visibilityBoost ?? 1}x search ranking boost
                </Text>
              </View>
            </View>
          </View>

          {/* Expiration Warning */}
          {isActive && renewalInfo?.isExpiringSoon && (
            <View style={[
              styles.expirationWarning,
              isUrgent ? styles.expirationUrgent : styles.expirationWarningBg,
            ]}>
              <Ionicons 
                name={isUrgent ? 'alert-circle' : 'information-circle'} 
                size={18} 
                color={isUrgent ? '#DC2626' : '#D97706'} 
              />
              <Text style={[
                styles.expirationText,
                isUrgent ? styles.expirationTextUrgent : styles.expirationTextWarning,
              ]}>
                {isUrgent 
                  ? `⚠️ Expires in ${daysRemaining} days! Renew now to keep your visibility.`
                  : `Your subscription expires in ${daysRemaining} days. Consider renewing soon.`
                }
              </Text>
            </View>
          )}

          {/* Not Subscribed CTA */}
          {!isActive && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('FarmerSubscription' as any)}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeButtonGradient}
              >
                <Ionicons name="rocket" size={18} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>Boost Your Visibility</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Renew Button for Expiring */}
          {isActive && renewalInfo?.isExpiringSoon && renewalInfo?.renewalPrice && (
            <TouchableOpacity 
              style={styles.renewButton}
              onPress={() => navigation.navigate('FarmerSubscription' as any)}
            >
              <Text style={styles.renewButtonText}>
                Renew Now - ₦{renewalInfo?.renewalPrice?.toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <Animated.View
        style={[
          styles.fixedHeader,
          { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' },
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
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Animated.View style={[styles.headerIconRow, { opacity: headerOpacity }]}>
            <View style={styles.headerIconBg}>
              <Ionicons name="bar-chart" size={18} color={COLORS.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
          </Animated.View>
        </View>
        <TouchableOpacity style={[styles.exportButton, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]} onPress={handleExportReport}>
          <Ionicons name="download-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={isDark ? ['#1A5F2A', '#2D8B42'] : [COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="trending-up" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Farm Performance</Text>
            <Text style={styles.heroSubtitle}>Track your sales, orders and growth</Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatCurrency(totalRevenue)}</Text>
                <Text style={styles.heroStatLabel}>Revenue</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{totalOrders}</Text>
                <Text style={styles.heroStatLabel}>Orders</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</Text>
                <Text style={styles.heroStatLabel}>Growth</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as TimePeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, { backgroundColor: isDark ? colors.card : COLORS.surface }, timePeriod === period && styles.periodButtonActive]}
              onPress={() => setTimePeriod(period)}
            >
              <Text style={[styles.periodText, { color: colors.textSecondary }, timePeriod === period && styles.periodTextActive]}>
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Custom Date Range Button */}
          <TouchableOpacity
            style={[
              styles.periodButton,
              { backgroundColor: isDark ? colors.card : COLORS.surface },
              timePeriod === 'custom' && styles.periodButtonActive,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={timePeriod === 'custom' ? '#FFFFFF' : colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.periodText, { color: colors.textSecondary }, timePeriod === 'custom' && styles.periodTextActive]}>
              {timePeriod === 'custom' && customStartDate && customEndDate
                ? `${formatDateToString(customStartDate).slice(0, 5)} - ${formatDateToString(customEndDate).slice(0, 5)}`
                : 'Custom'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comparison Toggle */}
        <View style={styles.comparisonToggleContainer}>
          <TouchableOpacity
            style={[
              styles.comparisonToggle,
              { backgroundColor: isDark ? colors.card : COLORS.surface },
              showComparison && styles.comparisonToggleActive,
            ]}
            onPress={() => setShowComparison(!showComparison)}
          >
            <Ionicons
              name="git-compare-outline"
              size={18}
              color={showComparison ? '#FFFFFF' : COLORS.primary}
            />
            <Text style={[
              styles.comparisonToggleText,
              { color: showComparison ? '#FFFFFF' : colors.text },
            ]}>
              Compare with Last Period
            </Text>
          </TouchableOpacity>
        </View>

        {/* Goal Progress */}
        {renderGoalProgress()}

        {/* Comparison Card */}
        {renderComparisonCard()}

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Subscription/Promotion Status - Shows if products are visible in verified section */}
        {renderSubscriptionStatusCard()}

        {/* Line Chart for Trends */}
        {renderLineChart()}

        {/* Sales Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sales Overview</Text>
          {renderBarChart()}
        </View>

        {/* Top Products */}
        {renderTopProducts()}

        {/* Customer Insights */}
        {renderCustomerInsights()}

        {/* Revenue Breakdown */}
        {renderRevenueBreakdown()}

        <View style={{ height: SPACING.xxl * 2 }} />
      </Animated.ScrollView>

      {/* Goal Modal */}
      {renderGoalModal()}

      {/* Date Picker Modal */}
      {renderDatePickerModal()}
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
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  heroGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.lg,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
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
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: SPACING.md,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  periodButton: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: (width - SPACING.md * 3) / 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  chartContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: SPACING.xl,
  },
  barWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  barGradient: {
    flex: 1,
    width: '100%',
  },
  barLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  barLabelSelected: {
    color: COLORS.secondary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  tooltip: {
    position: 'absolute',
    top: -50,
    backgroundColor: COLORS.textPrimary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  tooltipValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  tooltipOrders: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  rankNumber: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  productImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    overflow: 'hidden',
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
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
  productSales: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  productStats: {
    alignItems: 'flex-end',
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
    marginTop: 4,
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
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    width: (width - SPACING.md * 3) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  insightValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  insightMetric: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  insightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },
  changePositive: {
    backgroundColor: COLORS.successLight,
  },
  changeNegative: {
    backgroundColor: COLORS.errorLight,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginLeft: 2,
  },
  changeTextPositive: {
    color: COLORS.success,
  },
  changeTextNegative: {
    color: COLORS.error,
  },
  breakdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  breakdownItem: {
    marginBottom: SPACING.md,
  },
  breakdownBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.xs,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  breakdownPercent: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  // Subscription Status Card Styles
  subscriptionCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  subscriptionCardUrgent: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  subscriptionCardWarning: {
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  subscriptionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  daysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysRemainingUrgent: {
    backgroundColor: '#FEE2E2',
  },
  daysRemainingWarning: {
    backgroundColor: '#FEF3C7',
  },
  daysRemainingText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  daysRemainingTextUrgent: {
    color: '#DC2626',
  },
  daysRemainingTextWarning: {
    color: '#D97706',
  },
  visibilitySection: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  visibilityInfo: {
    flex: 1,
  },
  visibilityTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  visibilityStatus: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  expirationWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  expirationWarningBg: {
    backgroundColor: '#FEF3C7',
  },
  expirationUrgent: {
    backgroundColor: '#FEE2E2',
  },
  expirationText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  expirationTextWarning: {
    color: '#92400E',
  },
  expirationTextUrgent: {
    color: '#991B1B',
  },
  upgradeButton: {
    marginTop: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  renewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  renewButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  // Comparison Toggle Styles
  comparisonToggleContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  comparisonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
  },
  comparisonToggleActive: {
    backgroundColor: COLORS.primary,
  },
  comparisonToggleText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Goal Card Styles
  goalCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  goalInfo: {
    flex: 1,
  },
  goalCurrentLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  goalCurrentValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  goalTargetValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.sm,
  },
  goalProgressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  goalPercentage: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    minWidth: 45,
  },
  goalRemaining: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  goalAchieved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  goalAchievedText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
  },
  noGoalContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  noGoalText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  setGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.lg,
    gap: 6,
  },
  setGoalButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Comparison Card Styles
  comparisonCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  comparisonRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  comparisonMetric: {
    width: 80,
  },
  comparisonLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  comparisonValues: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  comparisonColumn: {
    alignItems: 'center',
    minWidth: 70,
  },
  comparisonPeriodLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  comparisonValuePrevious: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  comparisonChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 2,
  },
  comparisonChangeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Line Chart Styles
  lineChartContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  lineChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: SPACING.sm,
  },
  lineChartLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
  },
  // Goal Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  goalModalContent: {
    width: '100%',
    borderRadius: 16,
    padding: SPACING.lg,
  },
  goalModalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  goalModalSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  goalCurrencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginRight: 8,
  },
  goalInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  goalPresets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  goalPresetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  goalPresetText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  goalModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  goalModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  goalModalCancelButton: {
    backgroundColor: '#F2F2F7',
  },
  goalModalConfirmButton: {
    backgroundColor: COLORS.primary,
  },
  goalModalCancelText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#8E8E93',
  },
  goalModalConfirmText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  // Date Picker Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerBottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    maxHeight: '70%',
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
  },
  datePickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  datePresetsSection: {
    marginBottom: SPACING.lg,
  },
  datePresetsSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  datePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  datePresetButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#F2F2F7',
    marginBottom: SPACING.xs,
  },
  datePresetText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  customDateSection: {
    marginBottom: SPACING.lg,
  },
  customDateSectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelDateButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelDateButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#8E8E93',
  },
  applyDateButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyDateButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  nativePickerContainer: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  pickerDoneButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  pickerDoneText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});

export default AnalyticsScreen;
