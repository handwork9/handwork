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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { withdrawalService, Withdrawal, WithdrawalStatus } from '../../services/withdrawalService';
import { WithdrawHeroIllustration } from '../../assets/illustrations/stats';

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
      setTransactions(response?.withdrawals || []);
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
      setTransactions([]);
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
    const dateStr = formatDate(transaction.createdAt);
    const isToday = dateStr.includes('Today');
    
    // Get gradient colors based on status
    const getGradientColors = (): [string, string] => {
      switch (transaction.status) {
        case 'completed': return ['#10B981', '#059669'];
        case 'pending': return ['#F59E0B', '#D97706'];
        case 'processing': return ['#3B82F6', '#2563EB'];
        case 'failed': return ['#EF4444', '#DC2626'];
        case 'cancelled': return ['#6B7280', '#4B5563'];
        default: return ['#10B981', '#059669'];
      }
    };

    return (
      <TouchableOpacity 
        key={transaction.id}
        activeOpacity={0.7}
        onPress={() => (navigation as any).navigate('WithdrawalDetail', { withdrawal: transaction })}
      >
        <View style={styles.transactionItem}>
          {/* Enhanced Icon with Gradient */}
          <View style={styles.transactionIconWrapper}>
            <LinearGradient
              colors={getGradientColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.transactionIconGradient}
            >
              <MaterialCommunityIcons name="bank-transfer-out" size={22} color="#FFFFFF" />
            </LinearGradient>
            {/* Status indicator dot */}
            {(transaction.status === 'pending' || transaction.status === 'processing') && (
              <View style={[styles.statusPulse, { backgroundColor: statusConfig.color }]} />
            )}
          </View>
          
          {/* Transaction Info */}
          <View style={styles.transactionInfo}>
            <View style={styles.transactionTitleRow}>
              <Text style={[styles.bankName, dynamicStyles.text]} numberOfLines={1}>
                {transaction.bankAccount.bankName}
              </Text>
              {isToday && (
                <View style={[styles.newBadge, { backgroundColor: statusConfig.bgColor }]}>
                  <Text style={[styles.newBadgeText, { color: statusConfig.color }]}>NEW</Text>
                </View>
              )}
            </View>
            <View style={styles.accountRow}>
              <Ionicons name="card-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.accountNumber, dynamicStyles.textSecondary]}>
                ****{transaction.bankAccount.accountNumber.slice(-4)}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.dateText, dynamicStyles.textSecondary]}>
                {dateStr}
              </Text>
            </View>
          </View>
          
          {/* Amount Section */}
          <View style={styles.transactionRight}>
            <Text style={[styles.amount, { color: statusConfig.color }]}>
              ₦{(transaction.amount ?? 0).toLocaleString()}
            </Text>
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: statusConfig.bgColor,
                borderWidth: 1,
                borderColor: statusConfig.color + '40',
              }
            ]}>
              <Ionicons name={statusConfig.icon as any} size={11} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          
          {/* Chevron */}
          <View style={[styles.chevronWrapper, { backgroundColor: isDark ? '#3C3C3E' : '#F3F4F6' }]}>
            <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
          </View>
        </View>

        {/* Details Card */}
        <View style={[styles.transactionDetails, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Reference</Text>
              <Text style={[styles.detailValue, dynamicStyles.text]} numberOfLines={1}>{transaction.reference}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Fee</Text>
              <Text style={[styles.detailValue, transaction.fee === 0 ? styles.freeText : dynamicStyles.text]}>
                {transaction.fee === 0 ? 'Free' : `₦${transaction.fee}`}
              </Text>
            </View>
          </View>
          <View style={[styles.netAmountRow, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }]}>
            <View style={styles.netAmountLeft}>
              <Ionicons name="wallet-outline" size={16} color="#059669" />
              <Text style={[styles.netAmountLabel, { color: colors.textSecondary }]}>Net Amount</Text>
            </View>
            <Text style={styles.netAmount}>₦{(transaction.netAmount ?? 0).toLocaleString()}</Text>
          </View>
        </View>

        {transaction.status === 'failed' && transaction.failureReason && (
          <View style={styles.failureReason}>
            <Ionicons name="warning" size={14} color="#EF4444" />
            <Text style={styles.failureReasonText}>{transaction.failureReason}</Text>
          </View>
        )}

        {!isLast && (
          <View style={styles.transactionSeparatorWrapper}>
            <View style={[styles.transactionSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
          </View>
        )}
      </TouchableOpacity>
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
          <View style={styles.emptyIconContainer}>
            <View style={[styles.emptyIconGradient, { backgroundColor: isDark ? '#3C3C3E' : '#FFF7ED' }]}>
              {/* SVG Background */}
              <View style={styles.emptyIconBackground}>
                <Svg width={160} height={160}>
                  <Defs>
                    <SvgLinearGradient id="emptyWithdrawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.15" />
                      <Stop offset="100%" stopColor="#FF7A00" stopOpacity="0.05" />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle cx="80" cy="80" r="75" fill="url(#emptyWithdrawGrad)" />
                  <Circle cx="80" cy="80" r="55" fill="url(#emptyWithdrawGrad)" />
                  <Circle cx="80" cy="80" r="35" fill="url(#emptyWithdrawGrad)" />
                </Svg>
              </View>
              <MaterialCommunityIcons name="bank-transfer-out" size={60} color="#FF9500" />
            </View>
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
          {/* Summary Media Card */}
          <View style={[styles.summaryMediaCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* SVG Background Decoration */}
            <View style={styles.summaryCardBackground}>
              <Svg width={240} height={240} style={{ position: 'absolute', top: -60, right: -60 }}>
                <Defs>
                  <SvgLinearGradient id="withdrawSummaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.12" />
                    <Stop offset="100%" stopColor="#FF7A00" stopOpacity="0.04" />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx="120" cy="120" r="110" fill="url(#withdrawSummaryGrad)" />
                <Circle cx="120" cy="120" r="75" fill="url(#withdrawSummaryGrad)" />
                <Circle cx="120" cy="120" r="40" fill="url(#withdrawSummaryGrad)" />
              </Svg>
            </View>
            
            {/* Header Row */}
            <View style={styles.summaryHeaderRow}>
              <View style={styles.summaryHeaderInfo}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Withdrawn</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ₦{transactions
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + t.netAmount, 0)
                    .toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryIllustrationContainer}>
                <WithdrawHeroIllustration width={80} height={80} />
              </View>
            </View>
            
            {/* Stats Row */}
            <View style={[styles.summaryStatsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={styles.summaryStatBox}>
                <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Successful</Text>
                <Text style={[styles.summaryStatAmount, { color: '#10B981' }]}>
                  {transactions.filter(t => t.status === 'completed').length}
                </Text>
              </View>
              
              <View style={[styles.summaryStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
              
              <View style={styles.summaryStatBox}>
                <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Pending</Text>
                <Text style={[styles.summaryStatAmount, { color: '#F59E0B' }]}>
                  {transactions.filter(t => t.status === 'pending' || t.status === 'processing').length}
                </Text>
              </View>
              
              <View style={[styles.summaryStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
              
              <View style={styles.summaryStatBox}>
                <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.summaryStatAmount, { color: '#FF9500' }]}>
                  {transactions.length}
                </Text>
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
    marginBottom: SPACING.xl,
  },
  emptyIconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emptyIconBackground: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 160,
    height: 160,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: FONTS.semiBold,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  withdrawNowButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#FF9500',
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
  // Summary Media Card Styles
  summaryMediaCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    position: 'relative',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.1)',
  },
  summaryCardBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    zIndex: 1,
  },
  summaryHeaderInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  summaryIllustrationContainer: {
    marginLeft: SPACING.sm,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    zIndex: 1,
  },
  summaryStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  summaryStatAmount: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  summaryStatDivider: {
    width: 1,
    height: 50,
    marginHorizontal: SPACING.sm,
  },
  // Legacy styles kept for compatibility
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
    fontSize: 32,
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
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  summaryFooterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryFooterLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  summaryFooterValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
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
  statusPulse: {
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
    gap: 4,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  bankName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    flex: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountNumber: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    opacity: 0.8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  chevronWrapper: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: FONT_SIZES.md + 1,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 9,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  transactionDetails: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderTopWidth: 1,
    marginTop: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  detailItem: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  freeText: {
    color: '#059669',
    fontWeight: '600',
  },
  netAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: 10,
    marginTop: 4,
  },
  netAmountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  netAmountLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  netAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#059669',
  },
  failureReason: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  failureReasonText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: '#DC2626',
  },
  transactionSeparatorWrapper: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  transactionSeparator: {
    height: 1,
  },
});
