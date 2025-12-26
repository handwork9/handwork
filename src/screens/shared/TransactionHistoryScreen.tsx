import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StatusBar,
  Animated,
  Platform,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { TransactionHistoryIllustration } from '../../assets/illustrations/hero';
import walletService, { WalletTransaction } from '../../services/walletService';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  title: string;
  description: string;
  amount: number;
  date: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}

const FILTER_OPTIONS = ['All', 'Credit', 'Debit'];

// Helper to format transaction date
const formatTransactionDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (diffDays === 0) {
    return `Today, ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName}, ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    return `${dateStr}, ${timeStr}`;
  }
};

// Helper to map API transaction to display format
const mapTransaction = (tx: any): Transaction => {
  // Backend uses type: 'credit' | 'debit' directly
  const isCredit = tx.type === 'credit';
  
  // Use category for title if available, otherwise use type
  const categoryLabels: Record<string, string> = {
    'order_earnings': 'Order Earnings',
    'delivery_earnings': 'Delivery Earnings',
    'commission_deduction': 'Commission',
    'withdrawal': 'Withdrawal',
    'refund': 'Refund',
    'bonus': 'Bonus',
    'penalty': 'Penalty',
    'wallet_topup': 'Wallet Top-up',
    'transfer': 'Transfer',
    'subscription': 'Subscription',
    'promotion': 'Promotion',
    'purchase': 'Purchase',
    'bill_payment': 'Bill Payment',
    // Legacy types from frontend service
    'top_up': 'Wallet Top-up',
    'payment': 'Payment',
    'cashback': 'Cashback',
    'transfer_in': 'Transfer Received',
    'transfer_out': 'Transfer Sent',
    'premium': 'Premium Subscription',
  };
  
  const title = categoryLabels[tx.category] || categoryLabels[tx.type] || (isCredit ? 'Credit' : 'Debit');
  
  return {
    id: tx.id,
    type: isCredit ? 'credit' : 'debit',
    title,
    description: tx.description || tx.reference || '',
    amount: parseFloat(tx.amount) || 0,
    date: formatTransactionDate(tx.createdAt),
    icon: isCredit ? 'arrow-down' : 'arrow-up',
    iconColor: isCredit ? '#16A34A' : '#EF4444',
    iconBg: isCredit ? '#DCFCE7' : '#FEE2E2',
  };
};

export default function TransactionHistoryScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Route params can optionally pass transactions
  const routeTransactions = (route.params as { transactions?: Transaction[] })?.transactions;

  const [transactions, setTransactions] = useState<Transaction[]>(routeTransactions || []);
  const [isLoading, setIsLoading] = useState(!routeTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await walletService.getTransactions({ limit: 100 });
      console.log('[TransactionHistoryScreen] API response:', JSON.stringify(response));
      
      // Handle both { data: [...] } and direct array responses
      const txList = Array.isArray(response) ? response : (response?.data || []);
      
      const mapped = txList.map(mapTransaction);
      console.log('[TransactionHistoryScreen] Mapped transactions:', mapped.length);
      setTransactions(mapped);
    } catch (error) {
      console.error('[TransactionHistoryScreen] Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount if no route params
  useEffect(() => {
    if (!routeTransactions) {
      fetchTransactions();
    }
  }, [routeTransactions, fetchTransactions]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (!routeTransactions) {
        fetchTransactions();
      }
    }, [routeTransactions, fetchTransactions])
  );

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
  }), [colors, isDark]);

  // Calculate totals
  const totalCredit = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const totalDebit = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (transaction.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === 'All' ||
      (selectedFilter === 'Credit' && transaction.type === 'credit') ||
      (selectedFilter === 'Debit' && transaction.type === 'debit');

    return matchesSearch && matchesFilter;
  });

  // Group by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const dateStr = transaction.date || '';
    const dateKey = dateStr.includes('Today')
      ? 'Today'
      : dateStr.includes('Yesterday')
      ? 'Yesterday'
      : dateStr.split(',')[0] || 'Other';

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
  };

  const renderTransactionItem = (transaction: Transaction, index: number, items: Transaction[]) => {
    const isLast = index === items.length - 1;
    const isCredit = transaction.type === 'credit';
    
    // Get category icon based on title
    const getCategoryIcon = () => {
      const title = transaction.title.toLowerCase();
      if (title.includes('earnings') || title.includes('order')) return 'bag-check';
      if (title.includes('delivery')) return 'bicycle';
      if (title.includes('withdrawal')) return 'wallet';
      if (title.includes('top-up') || title.includes('topup')) return 'add-circle';
      if (title.includes('commission')) return 'calculator';
      if (title.includes('refund')) return 'refresh-circle';
      if (title.includes('bonus') || title.includes('cashback')) return 'gift';
      if (title.includes('transfer')) return 'swap-horizontal';
      if (title.includes('subscription') || title.includes('premium')) return 'star';
      if (title.includes('purchase') || title.includes('payment')) return 'cart';
      return isCredit ? 'arrow-down-circle' : 'arrow-up-circle';
    };

    return (
      <React.Fragment key={transaction.id}>
        <TouchableOpacity
          style={styles.transactionRow}
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('TransactionDetail', { transaction })}
        >
          {/* Enhanced Icon with Gradient Background */}
          <View style={styles.transactionIconWrapper}>
            <LinearGradient
              colors={isCredit ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.transactionIconGradient}
            >
              <Ionicons name={getCategoryIcon() as any} size={20} color="#FFFFFF" />
            </LinearGradient>
            {/* Pulse indicator for recent transactions */}
            {transaction.date.includes('Today') && (
              <View style={[styles.transactionPulse, { backgroundColor: isCredit ? '#10B981' : '#EF4444' }]} />
            )}
          </View>
          
          {/* Transaction Info */}
          <View style={styles.transactionInfo}>
            <View style={styles.transactionTitleRow}>
              <Text style={[styles.transactionTitle, dynamicStyles.text]} numberOfLines={1}>
                {transaction.title}
              </Text>
              {transaction.date.includes('Today') && (
                <View style={[styles.newBadge, { backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2' }]}>
                  <Text style={[styles.newBadgeText, { color: isCredit ? '#059669' : '#DC2626' }]}>NEW</Text>
                </View>
              )}
            </View>
            <Text style={[styles.transactionDesc, dynamicStyles.textSecondary]} numberOfLines={1}>
              {transaction.description || 'No description'}
            </Text>
            <View style={styles.transactionMetaRow}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.transactionTime, dynamicStyles.textSecondary]}>
                {transaction.date.includes(',') ? transaction.date.split(',')[1].trim() : transaction.date}
              </Text>
            </View>
          </View>
          
          {/* Amount Section */}
          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                { color: isCredit ? '#059669' : '#DC2626' },
              ]}
            >
              {isCredit ? '+' : '-'}{formatCurrency(transaction.amount ?? 0)}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { 
                  backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2',
                  borderWidth: 1,
                  borderColor: isCredit ? '#A7F3D0' : '#FECACA',
                },
              ]}
            >
              <Ionicons 
                name={isCredit ? 'trending-up' : 'trending-down'} 
                size={10} 
                color={isCredit ? '#059669' : '#DC2626'} 
              />
              <Text
                style={[
                  styles.typeText,
                  { color: isCredit ? '#059669' : '#DC2626' },
                ]}
              >
                {isCredit ? 'Credit' : 'Debit'}
              </Text>
            </View>
          </View>
          
          {/* Chevron */}
          <View style={[styles.chevronWrapper, { backgroundColor: isDark ? '#3C3C3E' : '#F3F4F6' }]}>
            <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        {!isLast && (
          <View style={styles.separatorWrapper}>
            <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
          </View>
        )}
      </React.Fragment>
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: 16, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#16A34A" />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Title Section */}
        <View style={styles.pageTitleSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Transaction History</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>View all your wallet transactions</Text>
        </View>
        
        {/* Summary Media Card */}
        <View style={[styles.summaryMediaCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {/* Gradient Header with Illustration */}
          <LinearGradient
            colors={['#059669', '#10B981', '#34D399']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryMediaHeader}
          >
            {/* Decorative circles */}
            <View style={[styles.summaryDecorCircle, { top: -20, right: -20, opacity: 0.1 }]} />
            <View style={[styles.summaryDecorCircle, { bottom: -30, left: 60, opacity: 0.08, width: 80, height: 80 }]} />
            
            <View style={styles.summaryHeaderContent}>
              <View style={styles.summaryHeaderLeft}>
                <Text style={styles.summaryHeaderLabel}>Transaction Summary</Text>
                <Text style={styles.summaryHeaderValue}>{transactions.length}</Text>
                <View style={styles.summaryHeaderBadge}>
                  <Ionicons name="receipt-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.summaryHeaderBadgeText}>Total Transactions</Text>
                </View>
              </View>
              <View style={styles.summaryIllustrationContainer}>
                <TransactionHistoryIllustration size={85} />
              </View>
            </View>
          </LinearGradient>
          
          {/* Stats Grid */}
          <View style={styles.summaryStatsGrid}>
            {/* Total Income */}
            <View style={[styles.summaryStatItem, { borderRightWidth: 1, borderRightColor: isDark ? '#3D3D3D' : '#F0F0F0' }]}>
              <View style={[styles.summaryStatIconBg, { backgroundColor: '#ECFDF5' }]}>
                <View style={[styles.summaryStatIconInner, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="trending-up" size={16} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryStatValue, { color: '#10B981' }]}>+{formatCurrency(totalCredit)}</Text>
            </View>
            
            {/* Total Expenses */}
            <View style={styles.summaryStatItem}>
              <View style={[styles.summaryStatIconBg, { backgroundColor: '#FEF2F2' }]}>
                <View style={[styles.summaryStatIconInner, { backgroundColor: '#EF4444' }]}>
                  <Ionicons name="trending-down" size={16} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.summaryStatValue, { color: '#EF4444' }]}>-{formatCurrency(totalDebit)}</Text>
            </View>
          </View>
          
          {/* Net Balance Footer */}
          <View style={[styles.summaryNetBalanceFooter, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }]}>
            <View style={styles.summaryNetBalanceContent}>
              <Ionicons name="wallet-outline" size={18} color="#059669" />
              <Text style={[styles.summaryNetBalanceLabel, { color: colors.textSecondary }]}>Net Balance</Text>
            </View>
            <Text style={[styles.summaryNetBalanceValue, { color: totalCredit - totalDebit >= 0 ? '#059669' : '#EF4444' }]}>
              {totalCredit - totalDebit >= 0 ? '+' : ''}{formatCurrency(totalCredit - totalDebit)}
            </Text>
          </View>
        </View>

        {/* Search Bar with Filter Button */}
        <View style={styles.searchFilterRow}>
          <View style={[styles.searchContainer, dynamicStyles.card, { flex: 1 }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, dynamicStyles.text]}
              placeholder="Search transactions..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <View style={[styles.clearButton, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                  <Ionicons name="close" size={14} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              dynamicStyles.card,
              selectedFilter !== 'All' && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={selectedFilter !== 'All' ? '#FFFFFF' : colors.text} 
            />
            {selectedFilter !== 'All' && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Active Filter Chip */}
        {selectedFilter !== 'All' && (
          <View style={styles.activeFilterContainer}>
            <View style={[styles.activeFilterChip, { backgroundColor: selectedFilter === 'Credit' ? '#DCFCE7' : '#FEE2E2' }]}>
              <Ionicons 
                name={selectedFilter === 'Credit' ? 'arrow-down-circle' : 'arrow-up-circle'} 
                size={16} 
                color={selectedFilter === 'Credit' ? '#16A34A' : '#EF4444'} 
              />
              <Text style={[styles.activeFilterText, { color: selectedFilter === 'Credit' ? '#16A34A' : '#EF4444' }]}>
                {selectedFilter} Only
              </Text>
              <TouchableOpacity onPress={() => setSelectedFilter('All')} style={styles.clearFilterBtn}>
                <Ionicons name="close-circle" size={18} color={selectedFilter === 'Credit' ? '#16A34A' : '#EF4444'} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Transactions List */}
        {isLoading ? (
          <View style={[styles.emptyCard, dynamicStyles.card]}>
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#16A34A" />
              <Text style={[styles.emptyTitle, dynamicStyles.text, { marginTop: SPACING.md }]}>Loading Transactions...</Text>
            </View>
          </View>
        ) : Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, items]) => (
            <View key={date}>
              <View style={styles.dateSectionHeader}>
                <Text style={[styles.dateSectionTitle, dynamicStyles.textSecondary]}>
                  {date.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.transactionsCard, dynamicStyles.card]}>
                {items.map((transaction, index) => renderTransactionItem(transaction, index, items))}
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, dynamicStyles.card]}>
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                <MaterialCommunityIcons name="receipt-text-outline" size={40} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, dynamicStyles.text]}>No Transactions Found</Text>
              <Text style={[styles.emptyDescription, dynamicStyles.textSecondary]}>
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Your transaction history will appear here'}
              </Text>
            </View>
          </View>
        )}
      </Animated.ScrollView>
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowFilterModal(false)}
        >
          <Pressable style={[styles.modalContent, dynamicStyles.card]} onPress={(e) => e.stopPropagation()}>
            {/* Modal Handle */}
            <View style={styles.modalHandle} />
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, dynamicStyles.text]}>Filter by Type</Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setShowFilterModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Filter Options */}
            <View style={styles.modalOptions}>
              {FILTER_OPTIONS.map((filter) => {
                const isSelected = selectedFilter === filter;
                const getFilterIcon = () => {
                  switch (filter) {
                    case 'Credit': return 'arrow-down-circle';
                    case 'Debit': return 'arrow-up-circle';
                    default: return 'swap-horizontal-outline';
                  }
                };
                const getFilterColor = () => {
                  if (!isSelected) return colors.textSecondary;
                  switch (filter) {
                    case 'Credit': return '#16A34A';
                    case 'Debit': return '#EF4444';
                    default: return '#16A34A';
                  }
                };
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.modalOption,
                      { backgroundColor: isDark ? '#3C3C3E' : '#F9FAFB' },
                      isSelected && {
                        backgroundColor: filter === 'Credit' ? '#DCFCE7' : filter === 'Debit' ? '#FEE2E2' : '#DCFCE7',
                        borderColor: getFilterColor(),
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => {
                      setSelectedFilter(filter);
                      setShowFilterModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.modalOptionIcon, 
                      { backgroundColor: isSelected ? getFilterColor() + '20' : isDark ? '#4A4A4C' : '#E5E7EB' }
                    ]}>
                      <Ionicons 
                        name={getFilterIcon() as any} 
                        size={24} 
                        color={getFilterColor()} 
                      />
                    </View>
                    <View style={styles.modalOptionContent}>
                      <Text style={[
                        styles.modalOptionTitle, 
                        dynamicStyles.text,
                        isSelected && { color: getFilterColor(), fontWeight: '700' }
                      ]}>
                        {filter === 'All' ? 'All Transactions' : `${filter} Only`}
                      </Text>
                      <Text style={[styles.modalOptionDesc, dynamicStyles.textSecondary]}>
                        {filter === 'All' 
                          ? 'Show all credit and debit transactions'
                          : filter === 'Credit'
                          ? 'Show only incoming transactions'
                          : 'Show only outgoing transactions'
                        }
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.modalCheckmark, { backgroundColor: getFilterColor() }]}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {/* Reset Button */}
            {selectedFilter !== 'All' && (
              <TouchableOpacity
                style={[styles.resetFilterBtn, { borderColor: isDark ? '#4A4A4C' : '#E5E7EB' }]}
                onPress={() => {
                  setSelectedFilter('All');
                  setShowFilterModal(false);
                }}
              >
                <Ionicons name="refresh" size={18} color={colors.textSecondary} />
                <Text style={[styles.resetFilterText, dynamicStyles.textSecondary]}>Reset Filter</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  pageTitleSection: {
    marginBottom: SPACING.xl,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  // Summary Media Card Styles
  summaryMediaCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryMediaHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  summaryDecorCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
  summaryHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryHeaderLeft: {
    flex: 1,
  },
  summaryHeaderLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  summaryHeaderValue: {
    fontSize: 42,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  summaryHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  summaryHeaderBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  summaryIllustrationContainer: {
    marginLeft: SPACING.md,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  summaryStatIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  summaryStatIconInner: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  summaryNetBalanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  summaryNetBalanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryNetBalanceLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  summaryNetBalanceValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  heroCard: {
    marginBottom: SPACING.lg,
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  heroCardGradient: {
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  heroDecorCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroDecorCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroDecorCircle3: {
    position: 'absolute',
    top: 40,
    left: 30,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.75)',
  },
  heroIllustration: {
    marginLeft: SPACING.md,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatIconWrapper: {
    marginBottom: 8,
  },
  heroStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FONTS.medium,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroStatValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: SPACING.md,
  },
  heroNetBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  heroNetLabel: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.semiBold,
  },
  heroNetValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroFooterText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.medium,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: '#16A34A',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeFilterContainer: {
    marginBottom: SPACING.lg,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  activeFilterText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  clearFilterBtn: {
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    paddingVertical: 14,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    borderRadius: 16,
    marginBottom: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: SPACING.md,
  },
  dateSectionHeader: {
    marginBottom: SPACING.sm + 2,
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateSectionTitle: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  transactionsCard: {
    borderRadius: 20,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.md,
    gap: 14,
  },
  transactionIconWrapper: {
    position: 'relative',
  },
  transactionIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionPulse: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  transactionInfo: {
    flex: 1,
    gap: 3,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    flex: 1,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 8,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transactionDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    opacity: 0.8,
  },
  transactionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  transactionTime: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.md + 1,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 9,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chevronWrapper: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorWrapper: {
    paddingLeft: 76,
    paddingRight: SPACING.md,
  },
  separator: {
    height: 1,
  },
  emptyCard: {
    borderRadius: 16,
    marginBottom: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyContainer: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptions: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 16,
    gap: 14,
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalOptionDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  modalCheckmark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resetFilterText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});
