import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from '../../types';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import {
  UsersIllustration,
  OrdersIllustration,
  FarmersIllustration,
  DeliveriesIllustration,
  FastDeliveryIllustration,
  SecurePaymentIllustration,
  LiveTrackingIllustration,
  RewardsIllustration,
} from '../../assets/illustrations/stats';

type Props = NativeStackScreenProps<AuthStackParamList, 'WhatYouMissed'>;

const { width } = Dimensions.get('window');

// Stats data with illustration components
const STATS = [
  { label: 'New Users', value: '15K+', IllustrationComponent: UsersIllustration, color: '#4CAF50' },
  { label: 'Orders', value: '50K+', IllustrationComponent: OrdersIllustration, color: '#FF9800' },
  { label: 'Farmers', value: '2.5K', IllustrationComponent: FarmersIllustration, color: '#8BC34A' },
  { label: 'Deliveries', value: '45K', IllustrationComponent: DeliveriesIllustration, color: '#2196F3' },
];

// New features with illustration components
const NEW_FEATURES = [
  { IllustrationComponent: FastDeliveryIllustration, title: 'Faster Deliveries', desc: '30% quicker delivery times' },
  { IllustrationComponent: SecurePaymentIllustration, title: 'Secure Payments', desc: 'Enhanced payment protection' },
  { IllustrationComponent: LiveTrackingIllustration, title: 'Live Tracking', desc: 'Real-time order tracking' },
  { IllustrationComponent: RewardsIllustration, title: 'Rewards Program', desc: 'Earn points on every order' },
];

// Bar chart data
const MONTHLY_DATA = [
  { month: 'Jul', value: 45 },
  { month: 'Aug', value: 60 },
  { month: 'Sep', value: 55 },
  { month: 'Oct', value: 80 },
  { month: 'Nov', value: 95 },
  { month: 'Dec', value: 100 },
];

// Line chart data points
const GROWTH_DATA = [20, 35, 30, 50, 45, 70, 65, 85, 80, 95];

// Animated Bar Component
const AnimatedBar = ({ value, month, index, maxValue, isDark }: { value: number; month: string; index: number; maxValue: number; isDark?: boolean }) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const heightPercent = (value / maxValue) * 100;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: heightPercent,
      duration: 800,
      delay: index * 100,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.barContainer}>
      <View style={[styles.barWrapper, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
        <Animated.View
          style={[
            styles.bar,
            {
              height: heightAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={['#4CAF50', '#81C784']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={[styles.barLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{month}</Text>
    </View>
  );
};

// Line Chart Component
const LineChart = ({ isDark }: { isDark?: boolean }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const maxValue = Math.max(...GROWTH_DATA);
  const chartWidth = width - 80;
  const chartHeight = 120;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const points = GROWTH_DATA.map((value, index) => ({
    x: (index / (GROWTH_DATA.length - 1)) * chartWidth,
    y: chartHeight - (value / maxValue) * chartHeight,
  }));

  return (
    <Animated.View style={[styles.lineChartContainer, { opacity: fadeAnim }]}>
      <View style={styles.lineChart}>
        {/* Grid lines */}
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.gridLine, { top: (i / 3) * chartHeight, backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}
          />
        ))}
        
        {/* Data points and connecting lines */}
        {points.map((point, index) => (
          <React.Fragment key={index}>
            {/* Connecting line to next point */}
            {index < points.length - 1 && (
              <View
                style={[
                  styles.lineSegment,
                  {
                    left: point.x,
                    top: point.y,
                    width: Math.sqrt(
                      Math.pow(points[index + 1].x - point.x, 2) +
                      Math.pow(points[index + 1].y - point.y, 2)
                    ),
                    transform: [
                      {
                        rotate: `${Math.atan2(
                          points[index + 1].y - point.y,
                          points[index + 1].x - point.x
                        )}rad`,
                      },
                    ],
                  },
                ]}
              />
            )}
            {/* Data point */}
            <View
              style={[
                styles.dataPoint,
                { left: point.x - 5, top: point.y - 5 },
              ]}
            />
          </React.Fragment>
        ))}
      </View>
      <View style={styles.lineChartLabels}>
        <Text style={[styles.lineChartLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Jun</Text>
        <Text style={[styles.lineChartLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Sep</Text>
        <Text style={[styles.lineChartLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Dec</Text>
      </View>
    </Animated.View>
  );
};

// Donut Chart Component
const DonutChart = ({ isDark, cardColor }: { isDark?: boolean; cardColor?: string }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  const segments = [
    { percent: 40, color: '#4CAF50', label: 'Vegetables' },
    { percent: 30, color: '#FF9800', label: 'Fruits' },
    { percent: 20, color: '#2196F3', label: 'Grains' },
    { percent: 10, color: '#9C27B0', label: 'Others' },
  ];

  return (
    <View style={styles.donutContainer}>
      <View style={styles.donutChart}>
        <Animated.View
          style={[
            styles.donutOuter,
            {
              backgroundColor: isDark ? '#374151' : '#E5E7EB',
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {segments.map((seg, i) => {
            const rotation = segments.slice(0, i).reduce((sum, s) => sum + s.percent * 3.6, 0);
            return (
              <View
                key={i}
                style={[
                  styles.donutSegment,
                  {
                    backgroundColor: seg.color,
                    transform: [{ rotate: `${rotation}deg` }],
                  },
                ]}
              />
            );
          })}
        </Animated.View>
        <View style={[styles.donutInner, { backgroundColor: cardColor || COLORS.white }]}>
          <Text style={[styles.donutValue, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>100%</Text>
          <Text style={[styles.donutLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Growth</Text>
        </View>
      </View>
      <View style={styles.donutLegend}>
        {segments.map((seg, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={[styles.legendText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{seg.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function WhatYouMissedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;

  const maxValue = Math.max(...MONTHLY_DATA.map(d => d.value));

  // Check if we can go back
  const canGoBack = navigation.canGoBack();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        {canGoBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitle}>What You Missed</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat, index) => {
            const IllustrationComponent = stat.IllustrationComponent;
            return (
              <View key={index} style={[styles.statCard, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
                <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                  <IllustrationComponent width={40} height={40} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Monthly Orders Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Monthly Orders</Text>
            <View style={[styles.chartBadge, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9' }]}>
              <Ionicons name="trending-up" size={14} color="#4CAF50" />
              <Text style={styles.chartBadgeText}>+25%</Text>
            </View>
          </View>
          <View style={styles.barChart}>
            {MONTHLY_DATA.map((data, index) => (
              <AnimatedBar
                key={index}
                value={data.value}
                month={data.month}
                index={index}
                maxValue={maxValue}
                isDark={isDark}
              />
            ))}
          </View>
        </View>

        {/* Growth Line Chart */}
        <View style={[styles.chartCard, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>User Growth</Text>
            <View style={[styles.chartBadge, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD' }]}>
              <Ionicons name="people" size={14} color="#2196F3" />
              <Text style={[styles.chartBadgeText, { color: '#2196F3' }]}>15K+</Text>
            </View>
          </View>
          <LineChart isDark={isDark} />
        </View>

        {/* Category Distribution */}
        <View style={[styles.chartCard, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Product Categories</Text>
          </View>
          <DonutChart isDark={isDark} cardColor={isDark ? colors.card : COLORS.white} />
        </View>

        {/* New Features */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="star-shooting" size={20} color="#FF9800" />
          <Text style={styles.sectionTitle}>New Features</Text>
        </View>
        
        <View style={styles.featuresGrid}>
          {NEW_FEATURES.map((feature, index) => {
            const IllustrationComponent = feature.IllustrationComponent;
            return (
              <View key={index} style={[styles.featureCard, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
                <View style={[styles.featureIconContainer, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9' }]}>
                  <IllustrationComponent width={44} height={44} />
                </View>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{feature.desc}</Text>
              </View>
            );
          })}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <LinearGradient
            colors={['#16A34A', '#22C55E']}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>Get Started Now</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16A34A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 24,
    color: '#1F2937',
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontFamily: FONTS.semiBold,
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  chartBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#4CAF50',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 10,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 28,
    height: 100,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    fontFamily: FONTS.regular,
  },
  lineChartContainer: {
    paddingVertical: 10,
  },
  lineChart: {
    height: 120,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#2196F3',
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  lineChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  lineChartLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  donutChart: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  donutOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  donutSegment: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    left: '50%',
    transformOrigin: 'left center',
  },
  donutInner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    fontSize: 18,
    color: '#1F2937',
    fontFamily: FONTS.bold,
  },
  donutLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  donutLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  featureCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  featureTitle: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  featureDesc: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  ctaButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 18,
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
});
