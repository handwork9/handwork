import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZES, COLORS, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { WalletHeroIllustration } from '../../assets/illustrations/stats';
import { walletService } from '../../services/walletService';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { formatCurrency } from '../../utils/formatters';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  title: string;
  description: string;
  amount: number;
  date: string;
}

export default function WalletScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
  }), [colors, isDark]);

  const loadWalletData = async () => {
    try {
      const walletBalance = await walletService.getBalance();
      // Handle different response structures: { available } or { balance }
      const availableBalance = (walletBalance as any)?.available ?? (walletBalance as any)?.balance ?? 0;
      setBalance(availableBalance);
      
      const txHistory = await walletService.getTransactions({ page: 1, limit: 5 });
      // Backend returns PaginatedResponseDto with 'data' property
      const transactionData = Array.isArray((txHistory as any)?.data) ? (txHistory as any).data : [];
      setTransactions(transactionData.map((tx: any) => ({
        id: tx.id || String(Math.random()),
        type: tx.type === 'credit' ? 'credit' : 'debit', // Backend uses 'credit' | 'debit' for type
        title: tx.description || tx.category || 'Transaction',
        description: tx.reference || '',
        amount: Number(tx.amount) || 0,
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      })));
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      // Set defaults on error
      setBalance(0);
      setTransactions([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWalletData();
    }, [])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadWalletData();
    setIsRefreshing(false);
  };

  const quickActions = [
    { icon: 'add-circle' as const, mcIcon: 'plus-circle-outline', label: 'Top Up', screen: 'TopUp', color: '#34C759' },
    { icon: 'arrow-down-circle' as const, mcIcon: 'bank-transfer-out', label: 'Withdraw', screen: 'Withdraw', color: '#FF9500' },
    { icon: 'time' as const, mcIcon: 'history', label: 'History', screen: 'TransactionHistory', color: '#5856D6' },
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? '#2C2C2E' : 'rgba(255, 255, 255, 0.9)' }]}
        onPress={() => {
          triggerHaptic();
          navigation.goBack();
        }}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderTitle, dynamicStyles.text]}>My Wallet</Text>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, dynamicStyles.card]}>
          <View style={styles.balanceIconContainer}>
            <WalletHeroIllustration width={32} height={32} color="#FFFFFF" />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, dynamicStyles.textSecondary]}>Available Balance</Text>
            <Text style={[styles.balanceAmount, dynamicStyles.text]}>{formatCurrency(balance ?? 0)}</Text>
          </View>
          <View style={styles.balanceDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionButton}
              onPress={() => {
                triggerHaptic();
                (navigation as any).navigate(action.screen);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionCard, dynamicStyles.card]}>
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '15' }]}>
                  <MaterialCommunityIcons name={action.mcIcon as any} size={26} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, dynamicStyles.text]}>{action.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.transactionSectionHeader}>
          <Text style={[styles.transactionSectionTitle, dynamicStyles.textSecondary]}>RECENT TRANSACTIONS</Text>
          <TouchableOpacity onPress={() => {
            triggerHaptic();
            (navigation as any).navigate('TransactionHistory');
          }}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.transactionsCard, dynamicStyles.card]}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                <MaterialCommunityIcons name="receipt-text-outline" size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>No transactions yet</Text>
              <Text style={[styles.emptySubtext, dynamicStyles.textSecondary]}>Your transaction history will appear here</Text>
            </View>
          ) : (
            transactions.map((tx, index) => (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.transactionItem,
                  index < transactions.length - 1 && styles.transactionItemBorder,
                ]}
                onPress={() => {
                  triggerHaptic();
                  (navigation as any).navigate('TransactionDetail', {
                    transaction: {
                      ...tx,
                      icon: tx.type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle',
                      iconColor: tx.type === 'credit' ? '#34C759' : '#FF3B30',
                      iconBg: tx.type === 'credit' ? '#E8F9EE' : '#FFEBEA',
                    }
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.txIconBg, { backgroundColor: tx.type === 'credit' ? '#34C759' : '#FF3B30' }]}>
                  <Ionicons
                    name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txTitle, dynamicStyles.text]} numberOfLines={1}>{tx.title}</Text>
                  <Text style={[styles.txDate, dynamicStyles.textSecondary]}>{tx.date}</Text>
                </View>
                <View style={styles.txAmountContainer}>
                  <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#34C759' : '#FF3B30' }]}>
                    {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount ?? 0)}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Security Info Card */}
        <View style={[styles.infoCard, dynamicStyles.card]}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="shield-checkmark" size={20} color="#34C759" />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, dynamicStyles.text]}>Bank-Level Security</Text>
            <Text style={[styles.infoText, dynamicStyles.textSecondary]}>
              Your wallet is protected with encryption. All transactions are secure.
            </Text>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  floatingBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  sectionHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.xl,
    borderRadius: 16,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  balanceInfo: {
    zIndex: 1,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  balanceDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#16A34A',
    opacity: 0.08,
  },
  decorationCircle1: {
    width: 120,
    height: 120,
    top: 0,
    right: 0,
  },
  decorationCircle2: {
    width: 80,
    height: 80,
    top: 60,
    right: 60,
    opacity: 0.05,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
  },
  actionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  transactionSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  transactionSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  transactionsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  transactionItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  txIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  txDate: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  txAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    paddingVertical: SPACING.xl * 1.5,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: 16,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
});
