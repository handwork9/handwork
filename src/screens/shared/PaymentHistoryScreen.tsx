import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface RecentBill {
  id: string;
  category: string;
  provider: string;
  accountNumber: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
}

type ParamList = {
  PaymentHistory: { payments: RecentBill[] };
  PaymentDetail: { payment: RecentBill };
};

const FILTER_OPTIONS = ['All', 'Paid', 'Pending', 'Failed'];

export default function PaymentHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamList>>();
  const route = useRoute<RouteProp<ParamList, 'PaymentHistory'>>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const payments = route.params?.payments || [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showSearch, setShowSearch] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: isDark ? '#2C2C2E' : '#FFF',
    },
    text: {
      color: colors.text,
    },
    textSecondary: {
      color: colors.textSecondary,
    },
    statsCard: {
      backgroundColor: isDark ? '#2C2C2E' : '#FFF',
    },
    filterChip: {
      backgroundColor: isDark ? '#2C2C2E' : '#FFF',
      borderColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB',
    },
    statDivider: {
      backgroundColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB',
    },
    emptyIconGradient: {
      backgroundColor: isDark ? '#3C3C3E' : '#F3E8FF',
    },
  }), [colors, isDark]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    switch ((category || '').toLowerCase()) {
      case 'electricity': return 'flash';
      case 'airtime': return 'phone-portrait';
      case 'data': return 'wifi';
      case 'cable tv': return 'tv';
      case 'internet': return 'globe';
      case 'betting': return 'game-controller';
      default: return 'receipt';
    }
  };

  const getCategoryColor = (category: string) => {
    switch ((category || '').toLowerCase()) {
      case 'electricity': return '#F59E0B';
      case 'airtime': return '#10B981';
      case 'data': return '#3B82F6';
      case 'cable tv': return '#8B5CF6';
      case 'internet': return '#EC4899';
      case 'betting': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!payment) return false;
    const provider = (payment.provider || '').toLowerCase();
    const category = (payment.category || '').toLowerCase();
    const accountNumber = payment.accountNumber || '';
    const query = (searchQuery || '').toLowerCase();
    
    const matchesSearch = 
      provider.includes(query) ||
      category.includes(query) ||
      accountNumber.includes(searchQuery || '');
    
    const matchesFilter = 
      selectedFilter === 'All' || 
      (payment.status || '').toLowerCase() === (selectedFilter || '').toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  // Group payments by date
  const groupedPayments = filteredPayments.reduce((groups: { [key: string]: RecentBill[] }, payment) => {
    const date = payment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(payment);
    return groups;
  }, {});

  const totalAmount = filteredPayments.reduce((sum, payment) => 
    payment.status === 'paid' ? sum + payment.amount : sum, 0
  );

  const renderPaymentItem = (payment: RecentBill, index: number) => (
    <Animated.View
      key={payment.id}
      style={{
        opacity: fadeAnim,
        transform: [{
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20 + index * 5, 0],
          }),
        }],
      }}
    >
      <TouchableOpacity 
        style={[styles.paymentCard, dynamicStyles.card]}
        onPress={() => navigation.navigate('PaymentDetail', { payment })}
        activeOpacity={0.7}
      >
        <View style={[styles.paymentIcon, { backgroundColor: getCategoryColor(payment.category) + '20' }]}>
          <Ionicons name={getCategoryIcon(payment.category)} size={22} color={getCategoryColor(payment.category)} />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={[styles.paymentProvider, dynamicStyles.text]}>{payment.provider}</Text>
          <Text style={[styles.paymentAccount, dynamicStyles.textSecondary]}>{payment.accountNumber}</Text>
        </View>
        <View style={styles.paymentRight}>
          <Text style={[styles.paymentAmount, dynamicStyles.text]}>{formatCurrency(payment.amount ?? 0)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(payment.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={styles.chevron} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={() => {
            if (showSearch) {
              setShowSearch(false);
              setSearchQuery('');
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        {showSearch ? (
          <View style={[styles.headerSearchContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.headerSearchInput, { color: colors.text }]}
              placeholder="Search payments..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons name={showSearch ? "close" : "search"} size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Page Title */}
        <View style={styles.pageTitleSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Payment History</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>View all your bill payments</Text>
        </View>

        {/* Summary Hero Card */}
        <View style={[styles.summaryCard, dynamicStyles.card]}>
          {/* SVG Background */}
          <View style={styles.summaryCardBackground}>
            <Svg width={240} height={240} style={{ position: 'absolute', top: -60, right: -60 }}>
              <Defs>
                <SvgLinearGradient id="paymentHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#7C3AED" stopOpacity="0.12" />
                  <Stop offset="100%" stopColor="#A855F7" stopOpacity="0.04" />
                </SvgLinearGradient>
              </Defs>
              <Circle cx="120" cy="120" r="110" fill="url(#paymentHeroGrad)" />
              <Circle cx="120" cy="120" r="75" fill="url(#paymentHeroGrad)" />
              <Circle cx="120" cy="120" r="40" fill="url(#paymentHeroGrad)" />
            </Svg>
          </View>
          
          {/* Header Row */}
          <View style={styles.summaryHeaderRow}>
            <View style={styles.summaryHeaderInfo}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalAmount ?? 0)}</Text>
            </View>
            <View style={[styles.summaryIconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="receipt" size={32} color="#7C3AED" />
            </View>
          </View>
          
          {/* Stats Row */}
          <View style={[styles.summaryStatsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={styles.summaryStatBox}>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.summaryStatAmount, { color: '#7C3AED' }]}>{payments.length}</Text>
            </View>
            
            <View style={[styles.summaryStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            
            <View style={styles.summaryStatBox}>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Paid</Text>
              <Text style={[styles.summaryStatAmount, { color: '#10B981' }]}>
                {payments.filter(p => p.status === 'paid').length}
              </Text>
            </View>
            
            <View style={[styles.summaryStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            
            <View style={styles.summaryStatBox}>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Pending</Text>
              <Text style={[styles.summaryStatAmount, { color: '#F59E0B' }]}>
                {payments.filter(p => p.status === 'pending').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTER_OPTIONS.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  dynamicStyles.filterChip,
                  selectedFilter === filter && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={[
                  styles.filterText,
                  dynamicStyles.textSecondary,
                  selectedFilter === filter && styles.filterTextSelected,
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {Object.keys(groupedPayments).length > 0 ? (
          Object.entries(groupedPayments).map(([date, datePayments]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={[styles.dateHeader, dynamicStyles.textSecondary]}>{date}</Text>
              {datePayments.map((payment, index) => renderPaymentItem(payment, index))}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <View
                style={[styles.emptyIconGradient, dynamicStyles.emptyIconGradient]}
              >
                <Ionicons name="receipt-outline" size={60} color="#7C3AED" />
              </View>
            </View>
            <Text style={[styles.emptyTitle, dynamicStyles.text]}>No payments found</Text>
            <Text style={[styles.emptyDesc, dynamicStyles.textSecondary]}>
              {searchQuery || selectedFilter !== 'All' 
                ? 'Try adjusting your search or filter'
                : 'Your payment history will appear here'}
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 8 : SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitleSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    position: 'relative',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
  },
  summaryCardBackground: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  summaryHeaderInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7C3AED',
  },
  summaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 237, 0.08)',
  },
  summaryStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryStatAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterScroll: {
    paddingHorizontal: 0,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextSelected: {
    color: '#FFF',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentProvider: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentAccount: {
    fontSize: 13,
    color: '#6B7280',
  },
  paymentRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
