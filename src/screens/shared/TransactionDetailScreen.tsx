import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { CreditTransactionIllustration, DebitTransactionIllustration } from '../../assets/illustrations/hero';

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

export default function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const { transaction } = route.params as { transaction: Transaction };

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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Transaction Details\n\n${transaction.title}\nAmount: ${transaction.type === 'credit' ? '+' : '-'}₦${(transaction.amount ?? 0).toLocaleString()}\nDate: ${transaction.date}\nReference: TXN-${transaction.id.padStart(8, '0')}\n\n- Handwork Wallet`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleDownloadReceipt = () => {
    Alert.alert(
      'Receipt Downloaded',
      'Your transaction receipt has been saved to your device.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleRepeat = () => {
    if (transaction.type === 'credit') {
      Alert.alert(
        'Top Up Wallet',
        `Would you like to top up ₦${(transaction.amount ?? 0).toLocaleString()} again?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up', style: 'default', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      Alert.alert(
        'Repeat Transaction',
        'This action is not available for debit transactions.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Issue',
      'Would you like to report a problem with this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive', 
          onPress: () => Alert.alert('Report Submitted', 'We\'ll review your report and get back to you within 24 hours.')
        },
      ]
    );
  };

  const isCredit = transaction.type === 'credit';
  const amountColor = isCredit ? '#16A34A' : '#EF4444';

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

      {/* Floating Share Button */}
      <TouchableOpacity
        style={[styles.floatingShareButton, { top: insets.top + 10, backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
        onPress={handleShare}
        activeOpacity={0.7}
        accessibilityLabel="Share transaction"
      >
        <Ionicons name="share-outline" size={22} color="#16A34A" />
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderTitle, dynamicStyles.text]}>Transaction Details</Text>
        </View>

        {/* Amount Card */}
        <View style={[styles.amountCard, dynamicStyles.card]}>
          <View style={styles.transactionIllustrationContainer}>
            {isCredit ? (
              <CreditTransactionIllustration size={90} />
            ) : (
              <DebitTransactionIllustration size={90} />
            )}
          </View>
          <Text style={[styles.amountLabel, dynamicStyles.textSecondary]}>
            {isCredit ? 'Money Received' : 'Money Sent'}
          </Text>
          <Text style={[styles.amountValue, { color: amountColor }]}>
            {isCredit ? '+' : '-'}₦{(transaction.amount ?? 0).toLocaleString()}.00
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7' }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Completed</Text>
          </View>
        </View>

        {/* Transaction Info Section */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>TRANSACTION INFO</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={[styles.infoIcon, { backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2' }]}>
                <MaterialCommunityIcons 
                  name={isCredit ? "cash-plus" : "cash-minus"} 
                  size={22} 
                  color={amountColor} 
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, dynamicStyles.text]}>{transaction.title}</Text>
                <Text style={[styles.infoDescription, dynamicStyles.textSecondary]}>{transaction.description}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transaction Details Section */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>DETAILS</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Reference ID</Text>
            <Text style={[styles.detailValue, dynamicStyles.text]}>TXN-{transaction.id.padStart(8, '0')}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Date & Time</Text>
            <Text style={[styles.detailValue, dynamicStyles.text]}>{transaction.date}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Type</Text>
            <View style={[styles.typeBadge, { backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={[styles.typeBadgeText, { color: amountColor }]}>
                {isCredit ? 'Credit' : 'Debit'}
              </Text>
            </View>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Status</Text>
            <View style={styles.statusBadgeSmall}>
              <View style={styles.statusDotSmall} />
              <Text style={styles.statusTextSmall}>Completed</Text>
            </View>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Payment Method</Text>
            <Text style={[styles.detailValue, dynamicStyles.text]}>Wallet</Text>
          </View>
        </View>

        {/* Amount Summary Section */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>AMOUNT SUMMARY</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Amount</Text>
            <Text style={[styles.summaryValue, dynamicStyles.text]}>₦{(transaction.amount ?? 0).toLocaleString()}.00</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Fee</Text>
            <Text style={[styles.summaryValue, dynamicStyles.text]}>₦0.00</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, dynamicStyles.text]}>Total</Text>
            <Text style={[styles.totalValue, { color: amountColor }]}>
              {isCredit ? '+' : '-'}₦{(transaction.amount ?? 0).toLocaleString()}.00
            </Text>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>QUICK ACTIONS</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadReceipt}>
              <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="download-outline" size={24} color="#9333EA" />
              </View>
              <Text style={[styles.actionText, dynamicStyles.text]}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleRepeat}>
              <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="repeat" size={24} color="#16A34A" />
              </View>
              <Text style={[styles.actionText, dynamicStyles.text]}>Repeat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="share-variant-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.actionText, dynamicStyles.text]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="flag-outline" size={24} color="#EF4444" />
              </View>
              <Text style={[styles.actionText, dynamicStyles.text]}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Note */}
        <View style={[styles.supportNote, dynamicStyles.card]}>
          <View style={[styles.supportIconContainer, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#16A34A" />
          </View>
          <Text style={[styles.supportText, dynamicStyles.textSecondary]}>
            Need help with this transaction? Contact our support team available 24/7.
          </Text>
        </View>
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
  floatingShareButton: {
    position: 'absolute',
    right: SPACING.md,
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
  scrollContent: {
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
  amountCard: {
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
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
  transactionIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  transactionIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  amountLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: SPACING.md,
    letterSpacing: -1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: '#16A34A',
  },
  card: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SPACING.md,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusTextSmall: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: '#16A34A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
  },
  actionButton: {
    alignItems: 'center',
    width: (width - 64) / 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  supportNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: SPACING.md,
    gap: 12,
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
  supportIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
});
