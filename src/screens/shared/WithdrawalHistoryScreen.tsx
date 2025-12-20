import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { withdrawalService, Withdrawal, WithdrawalStatus } from '../../services/withdrawalService';

const STATUS_CONFIG: Record<WithdrawalStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  pending: {
    label: 'Pending',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'time-outline',
  },
  processing: {
    label: 'Processing',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'sync-outline',
  },
  completed: {
    label: 'Completed',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'checkmark-circle-outline',
  },
  failed: {
    label: 'Failed',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'close-circle-outline',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: 'ban-outline',
  },
};

export default function WithdrawalHistoryScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [transactions, setTransactions] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<WithdrawalStatus | 'all'>('all');

  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: isDark ? colors.background : '#F2F2F7',
    },
    card: {
      backgroundColor: isDark ? colors.card : '#FFFFFF',
    },
    text: {
      color: colors.text,
    },
    textSecondary: {
      color: colors.textSecondary,
    },
  }), [isDark, colors]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await withdrawalService.getWithdrawals();
      setTransactions(response.withdrawals);
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
  };

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.status === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-NG', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const renderTransaction = (transaction: Withdrawal, index: number) => {
    const statusConfig = STATUS_CONFIG[transaction.status];
    const isLast = index === filteredTransactions.length - 1;

    return (
      <View key={transaction.id}>
        <View style={styles.transactionItem}>
          <View style={styles.transactionLeft}>
            <View style={styles.bankIconContainer}>
              <MaterialCommunityIcons name="bank-outline" size={22} color="#16A34A" />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={[styles.bankName, dynamicStyles.text]}>
                {transaction.bankAccount.bankName}
              </Text>
              <Text style={[styles.accountNumber, dynamicStyles.textSecondary]}>
                ****{transaction.bankAccount.accountNumber.slice(-4)}
              </Text>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text style={[styles.amount, dynamicStyles.text]}>
              ₦{(transaction.amount ?? 0).toLocaleString()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.transactionDetails, { borderTopColor: 'rgba(60, 60, 67, 0.12)' }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Reference</Text>
            <Text style={[styles.detailValue, dynamicStyles.text]}>{transaction.reference}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Fee</Text>
            <Text style={[styles.detailValue, transaction.fee === 0 ? styles.freeText : dynamicStyles.text]}>
              {transaction.fee === 0 ? 'Free' : `₦${transaction.fee}`}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Net Amount</Text>
            <Text style={styles.netAmount}>₦{(transaction.netAmount ?? 0).toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Date</Text>
            <Text style={[styles.detailValue, dynamicStyles.text]}>{formatDate(transaction.createdAt)}</Text>
          </View>
        </View>

        {transaction.status === 'failed' && transaction.failureReason && (
          <View style={styles.failureReason}>
            <Ionicons name="warning" size={14} color="#EF4444" />
            <Text style={styles.failureReasonText}>{transaction.failureReason}</Text>
          </View>
        )}

        {!isLast && <View style={styles.transactionSeparator} />}
      </View>
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

      {/* Page Title Section */}
      <View style={[styles.pageTitleSection, { marginTop: 16 }]}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Withdrawal History</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>View all your withdrawal requests</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && styles.filterTabSelected,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterTabText,
              dynamicStyles.text,
              filter === 'all' && styles.filterTabTextSelected,
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {(['pending', 'processing', 'completed', 'failed'] as WithdrawalStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                filter === status && styles.filterTabSelected,
              ]}
              onPress={() => setFilter(status)}
            >
              <Text style={[
                styles.filterTabText,
                dynamicStyles.text,
                filter === status && styles.filterTabTextSelected,
              ]}>
                {STATUS_CONFIG[status].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={[styles.loadingText, dynamicStyles.textSecondary]}>Loading history...</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, dynamicStyles.card]}>
            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.textSecondary} />
          </View>
          <Text style={[styles.emptyTitle, dynamicStyles.text]}>No Withdrawals</Text>
          <Text style={[styles.emptyDescription, dynamicStyles.textSecondary]}>
            {filter === 'all'
              ? "You haven't made any withdrawals yet"
              : `No ${STATUS_CONFIG[filter as WithdrawalStatus].label.toLowerCase()} withdrawals`
            }
          </Text>
          <TouchableOpacity
            style={styles.withdrawNowButton}
            onPress={() => (navigation as any).navigate('Withdraw')}
          >
            <Text style={styles.withdrawNowButtonText}>Withdraw Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#16A34A"
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderTitle, dynamicStyles.text]}>Withdrawal History</Text>
          </View>

          {/* Summary Stats */}
          <View style={styles.sectionSubHeader}>
            <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>SUMMARY</Text>
          </View>
          <View style={[styles.summaryCard, dynamicStyles.card]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons name="cash-check" size={22} color="#16A34A" />
                </View>
                <View>
                  <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Total Withdrawn</Text>
                  <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
                    ₦{transactions
                      .filter(t => t.status === 'completed')
                      .reduce((sum, t) => sum + t.netAmount, 0)
                      .toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#DBEAFE' }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={22} color="#3B82F6" />
                </View>
                <View>
                  <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Successful</Text>
                  <Text style={[styles.summaryValue, dynamicStyles.text]}>
                    {transactions.filter(t => t.status === 'completed').length}
                  </Text>
                </View>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="clock-outline" size={22} color="#F59E0B" />
                </View>
                <View>
                  <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Pending</Text>
                  <Text style={[styles.summaryValue, dynamicStyles.text]}>
                    {transactions.filter(t => t.status === 'pending' || t.status === 'processing').length}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Transactions */}
          <View style={styles.sectionSubHeader}>
            <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>TRANSACTIONS</Text>
          </View>
          <View style={[styles.transactionsCard, dynamicStyles.card]}>
            {filteredTransactions.map(renderTransaction)}
          </View>
        </Animated.ScrollView>
      )}
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
  pageTitleSection: {
    paddingHorizontal: 24,
    marginBottom: SPACING.md,
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
  filterContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterContent: {
    paddingVertical: 4,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  withdrawNowButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  withdrawNowButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
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
  sectionSubHeader: {
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  sectionSubHeaderTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryCard: {
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
  summaryRow: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  summaryDivider: {
    width: 1,
    marginVertical: 4,
    marginHorizontal: 8,
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    gap: 2,
  },
  bankName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  accountNumber: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  transactionDetails: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  freeText: {
    color: '#16A34A',
    fontWeight: '600',
  },
  netAmount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: '#16A34A',
  },
  failureReason: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  failureReasonText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: '#EF4444',
  },
  transactionSeparator: {
    height: 12,
    backgroundColor: 'rgba(60, 60, 67, 0.06)',
  },
});
