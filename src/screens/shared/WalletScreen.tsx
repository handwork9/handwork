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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store';
import { SPACING, FONT_SIZES, COLORS, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { WalletHeroIllustration } from '../../assets/illustrations/stats';
import { walletService } from '../../services/walletService';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { formatCurrency, formatCurrencyFull } from '../../utils/formatters';

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
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Check if user is a buyer (buyers should not withdraw, only pay bills)
  const isBuyer = user?.role === 'buyer';

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
  }), [colors, isDark]);

  const loadWalletData = async () => {
    try {
      setIsLoadingBalance(true);
      console.log('[WalletScreen] Loading wallet data (focus triggered)...');
      const walletBalance = await walletService.getBalance();
      console.log('[WalletScreen] Raw balance response:', JSON.stringify(walletBalance));
      
      // Handle different response structures: { available } or { balance }
      // Also handle decimal strings from PostgreSQL
      let availableBalance = (walletBalance as any)?.available ?? (walletBalance as any)?.balance ?? 0;
      if (typeof availableBalance === 'string') {
        availableBalance = parseFloat(availableBalance) || 0;
      }
      console.log('[WalletScreen] Parsed balance:', availableBalance);
      setBalance(availableBalance);
      
      const txHistory = await walletService.getTransactions({ page: 1, limit: 5 });
      console.log('[WalletScreen] Raw txHistory response:', JSON.stringify(txHistory));
      // Backend returns PaginatedResponseDto with 'data' property
      // After walletService extraction: { data: [...], total, page, ... }
      const transactionData = Array.isArray((txHistory as any)?.data) ? (txHistory as any).data : 
                              Array.isArray(txHistory) ? txHistory : [];
      console.log('[WalletScreen] transactionData:', JSON.stringify(transactionData));
      console.log('[WalletScreen] transactionData length:', transactionData.length);
      setTransactions(transactionData.map((tx: any) => ({
        id: tx.id || String(Math.random()),
        type: tx.type === 'credit' ? 'credit' : 'debit', // Backend uses 'credit' | 'debit' for type
        title: tx.description || tx.category || 'Transaction',
        description: tx.reference || '',
        amount: Number(tx.amount) || 0,
        date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      })));
    } catch (error) {
      console.error('[WalletScreen] Failed to load wallet data:', error);
      // Set defaults on error
      setBalance(0);
      setTransactions([]);
    } finally {
      setIsLoadingBalance(false);
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
    // Show PayBills for buyers, Withdraw for farmers/riders
    isBuyer
      ? { icon: 'receipt' as const, mcIcon: 'receipt', label: 'Pay Bills', screen: 'PayBill', color: '#FF9500' }
      : { icon: 'arrow-down-circle' as const, mcIcon: 'bank-transfer-out', label: 'Withdraw', screen: 'Withdraw', color: '#FF9500' },
    { icon: 'time' as const, mcIcon: 'history', label: 'History', screen: 'TransactionHistory', color: '#5856D6' },
  ];

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={() => {
            triggerHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 16, paddingBottom: insets.bottom + 40 },
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
        {/* Page Title Section */}
        <View style={styles.pageTitleSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t('wallet.myWallet')}</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>{t('wallet.manageBalance')}</Text>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, dynamicStyles.card]}>
          {/* SVG Background Decoration */}
          <View style={styles.balanceCardBackground}>
            <Svg width={200} height={200} style={{ position: 'absolute', top: -40, right: -40 }}>
              <Defs>
                <SvgLinearGradient id="walletHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#16A34A" stopOpacity="0.15" />
                  <Stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
                </SvgLinearGradient>
              </Defs>
              <Circle cx="100" cy="100" r="90" fill="url(#walletHeroGrad)" />
              <Circle cx="100" cy="100" r="60" fill="url(#walletHeroGrad)" />
              <Circle cx="100" cy="100" r="30" fill="url(#walletHeroGrad)" />
            </Svg>
          </View>
          <View style={styles.balanceIconContainer}>
            <WalletHeroIllustration width={32} height={32} color="#FFFFFF" />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, dynamicStyles.textSecondary]}>{t('wallet.availableBalance')}</Text>
            {isLoadingBalance && !isRefreshing ? (
              <ActivityIndicator size="small" color="#16A34A" style={{ marginTop: 8 }} />
            ) : (
              <Text style={[styles.balanceAmount, dynamicStyles.text]}>{formatCurrencyFull(balance ?? 0)}</Text>
            )}
          </View>
          {/* Transfer Button on Hero Card */}
          <TouchableOpacity
            style={styles.heroTransferButton}
            onPress={() => {
              triggerHaptic();
              (navigation as any).navigate('Transfer', { balance });
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bank-transfer" size={20} color="#FFFFFF" />
            <Text style={styles.heroTransferButtonText}>{t('wallet.transfer')}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionButton}
              onPress={() => {
                triggerHaptic();
                // Pass balance to TopUp, Withdraw, and Transfer screens
                if (action.screen === 'Withdraw' || action.screen === 'TopUp' || action.screen === 'Transfer') {
                  (navigation as any).navigate(action.screen, { balance });
                } else {
                  (navigation as any).navigate(action.screen);
                }
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
          <Text style={[styles.transactionSectionTitle, dynamicStyles.textSecondary]}>{t('wallet.recentTransactions')}</Text>
          <TouchableOpacity onPress={() => {
            triggerHaptic();
            (navigation as any).navigate('TransactionHistory');
          }}>
            <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.transactionsCard, dynamicStyles.card]}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyBackground}>
                <Svg width={160} height={160}>
                  <Defs>
                    <SvgLinearGradient id="walletEmptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.15" />
                      <Stop offset="100%" stopColor="#FFCC00" stopOpacity="0.08" />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle cx="80" cy="80" r="70" fill="url(#walletEmptyGrad)" />
                  <Circle cx="80" cy="80" r="45" fill="url(#walletEmptyGrad)" />
                </Svg>
              </View>
              <View style={[styles.emptyIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="receipt-text" size={32} color="#FF9500" />
              </View>
              <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>{t('wallet.noTransactions')}</Text>
              <Text style={[styles.emptySubtext, dynamicStyles.textSecondary]}>{t('wallet.transactionHistoryAppear')}</Text>
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
  scrollContent: {
    flexGrow: 1,
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
  balanceCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.xl,
    borderRadius: 20,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.1)',
  },
  balanceCardBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  balanceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  heroTransferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: SPACING.lg,
    gap: 10,
    zIndex: 1,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTransferButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
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
  emptyBackground: {
    position: 'absolute',
    top: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    zIndex: 1,
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
