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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

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
      {/* Header with Gradient */}
      <Animated.View style={{ opacity: headerAnim }}>
        <LinearGradient
          colors={['#7C3AED', '#9333EA', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => {
                if (showSearch) {
                  setShowSearch(false);
                  setSearchQuery('');
                } else {
                  navigation.goBack();
                }
              }} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            {showSearch ? (
              <View style={styles.headerSearchContainer}>
                <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
                <TextInput
                  style={styles.headerSearchInput}
                  placeholder="Search payments..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.headerTitle}>Payment History</Text>
            )}
            
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name={showSearch ? "close" : "search"} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Stats Card */}
          <View style={[styles.statsCard, dynamicStyles.statsCard]}>
            <View style={styles.statItem}>
              <View>
                <Text style={[styles.statNumber, dynamicStyles.text]}>{payments.length}</Text>
                <Text style={[styles.statLabel, dynamicStyles.textSecondary]}>Total Payments</Text>
              </View>
            </View>
            <View style={[styles.statDivider, dynamicStyles.statDivider]} />
            <View style={styles.statItem}>
              <View>
                <Text style={[styles.statNumber, dynamicStyles.text]}>{formatCurrency(totalAmount ?? 0)}</Text>
                <Text style={[styles.statLabel, dynamicStyles.textSecondary]}>Total Spent</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingBottom: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    gap: 8,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    paddingVertical: 0,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '400',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
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
    marginTop: -20,
    marginBottom: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
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
