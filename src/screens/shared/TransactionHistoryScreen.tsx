import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { TransactionHistoryIllustration } from '../../assets/illustrations/hero';

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

export default function TransactionHistoryScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const { transactions = [] } = (route.params as { transactions: Transaction[] }) || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const renderTransactionItem = (transaction: Transaction, index: number, items: Transaction[]) => {
    const isLast = index === items.length - 1;

    return (
      <React.Fragment key={transaction.id}>
        <TouchableOpacity
          style={styles.transactionRow}
          activeOpacity={0.7}
          onPress={() => (navigation as any).navigate('TransactionDetail', { transaction })}
        >
          <View style={[styles.transactionIcon, { backgroundColor: transaction.type === 'credit' ? '#DCFCE7' : '#FEE2E2' }]}>
            <Ionicons 
              name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
              size={18} 
              color={transaction.type === 'credit' ? '#16A34A' : '#EF4444'} 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionTitle, dynamicStyles.text]}>{transaction.title}</Text>
            <Text style={[styles.transactionDesc, dynamicStyles.textSecondary]}>
              {transaction.description}
            </Text>
            <Text style={[styles.transactionTime, dynamicStyles.textSecondary]}>
              {transaction.date.includes(',') ? transaction.date.split(',')[1].trim() : transaction.date}
            </Text>
          </View>
          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                { color: transaction.type === 'credit' ? '#16A34A' : '#EF4444' },
              ]}
            >
              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount ?? 0)}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: transaction.type === 'credit' ? '#DCFCE7' : '#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.typeText,
                  { color: transaction.type === 'credit' ? '#16A34A' : '#EF4444' },
                ]}
              >
                {transaction.type === 'credit' ? 'Credit' : 'Debit'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        {!isLast && <View style={[styles.separator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />}
      </React.Fragment>
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
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
        {/* Hero Illustration */}
        <View style={styles.heroIllustrationContainer}>
          <TransactionHistoryIllustration size={100} />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderTitle, dynamicStyles.text]}>Transaction History</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, dynamicStyles.card]}>
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

        {/* Stats Summary */}
        <View style={[styles.statsCard, dynamicStyles.card]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="arrow-down-circle-outline" size={22} color="#16A34A" />
              </View>
              <View>
                <Text style={[styles.statLabel, dynamicStyles.textSecondary]}>Total Credit</Text>
                <Text style={[styles.statValue, { color: '#16A34A' }]}>{formatCurrency(totalCredit ?? 0)}</Text>
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="arrow-up-circle-outline" size={22} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.statLabel, dynamicStyles.textSecondary]}>Total Debit</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{formatCurrency(totalDebit ?? 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSectionHeader}>
          <Text style={[styles.filterSectionTitle, dynamicStyles.textSecondary]}>FILTER BY TYPE</Text>
        </View>
        <View style={[styles.filterCard, dynamicStyles.card]}>
          <View style={styles.filterTabs}>
            {FILTER_OPTIONS.map((filter) => {
              const isSelected = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterTab,
                    isSelected && styles.filterTabSelected,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      dynamicStyles.text,
                      isSelected && styles.filterTabTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Transactions List */}
        {Object.keys(groupedTransactions).length > 0 ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: SPACING.md,
  },
  heroIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
    paddingBottom: SPACING.sm,
  },
  sectionHeaderTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    gap: 10,
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
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  filterSectionHeader: {
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  filterSectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  filterCard: {
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
  filterTabs: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  filterTabSelected: {
    backgroundColor: '#16A34A',
  },
  filterTabText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    fontWeight: '600',
  },
  filterTabTextSelected: {
    color: '#FFFFFF',
  },
  dateSectionHeader: {
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  dateSectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  transactionsCard: {
    borderRadius: 16,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
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
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  transactionRight: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
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
});
