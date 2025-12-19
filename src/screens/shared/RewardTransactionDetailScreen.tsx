import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

const PRIMARY_COLOR = '#16A34A';

interface Transaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  title: string;
  points: number;
  date: string;
  time?: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
  orderId?: string;
  rewardId?: string;
}

export default function RewardTransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { transaction } = route.params as { transaction: Transaction };

  const getTypeColor = () => {
    switch (transaction.type) {
      case 'earned':
        return PRIMARY_COLOR;
      case 'redeemed':
        return '#3B82F6';
      case 'expired':
        return '#EF4444';
      default:
        return colors.text;
    }
  };

  const getTypeLabel = () => {
    switch (transaction.type) {
      case 'earned':
        return 'Points Earned';
      case 'redeemed':
        return 'Points Redeemed';
      case 'expired':
        return 'Points Expired';
      default:
        return 'Transaction';
    }
  };

  const getPointsPrefix = () => {
    return transaction.type === 'earned' ? '+' : '-';
  };

  const getAdditionalDetails = () => {
    switch (transaction.type) {
      case 'earned':
        return {
          source: 'Order Completion',
          orderId: transaction.orderId || 'ORD-2024-001234',
          earnRate: '1 point per ₦100 spent',
          status: 'Credited',
        };
      case 'redeemed':
        return {
          source: 'Reward Redemption',
          rewardId: transaction.rewardId || 'RWD-2024-005678',
          rewardType: transaction.title,
          status: 'Applied',
        };
      case 'expired':
        return {
          source: 'Points Expiry',
          reason: 'Inactive account for 90 days',
          originalDate: 'Earned on Oct 15, 2024',
          status: 'Expired',
        };
      default:
        return {};
    }
  };

  const details = getAdditionalDetails();
  const typeColor = getTypeColor();
  const cardBg = isDark ? colors.card : '#FFFFFF';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Reward Transaction: ${transaction.title}\nPoints: ${getPointsPrefix()}${transaction.points}\nDate: ${transaction.date}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Normal Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Transaction Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <View style={styles.heroDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1, { backgroundColor: typeColor }]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2, { backgroundColor: typeColor }]} />
          </View>
          
          <View style={[styles.heroIcon, { backgroundColor: `${typeColor}15` }]}>
            <Ionicons name={transaction.icon} size={36} color={typeColor} />
          </View>

          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{getTypeLabel()}</Text>
          </View>

          <Text style={[styles.heroPoints, { color: typeColor }]}>
            {getPointsPrefix()}{transaction.points.toLocaleString()}
          </Text>
          <Text style={[styles.heroPointsLabel, { color: colors.textSecondary }]}>points</Text>

          <Text style={[styles.heroTitle, { color: colors.text }]}>{transaction.title}</Text>
          <Text style={[styles.heroDate, { color: colors.textSecondary }]}>
            {transaction.date}{transaction.time ? ` at ${transaction.time}` : ''}
          </Text>
        </View>

        {/* Transaction ID */}
        <View style={styles.sectionHeader}>
          <Ionicons name="receipt-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Transaction ID</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.idRow}>
            <Text style={[styles.idValue, { color: colors.text }]}>{transaction.id}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={18} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Details</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.detailValueRow}>
              <View style={[styles.statusDot, { backgroundColor: typeColor }]} />
              <Text style={[styles.detailValue, { color: colors.text }]}>{getTypeLabel()}</Text>
            </View>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Source</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{details.source || 'N/A'}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${typeColor}15` }]}>
              <Text style={[styles.statusBadgeText, { color: typeColor }]}>{details.status || 'Completed'}</Text>
            </View>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date & Time</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {transaction.date}{transaction.time ? `, ${transaction.time}` : ''}
            </Text>
          </View>
        </View>

        {/* Additional Info Based on Type */}
        {transaction.type === 'earned' && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="cart-outline" size={16} color="#6B7280" />
              <Text style={styles.sectionTitle}>Order Information</Text>
            </View>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Order ID</Text>
                <Text style={[styles.detailValue, { color: PRIMARY_COLOR }]}>{details.orderId}</Text>
              </View>
              <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Earn Rate</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{details.earnRate}</Text>
              </View>
            </View>
          </>
        )}

        {transaction.type === 'redeemed' && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="gift-outline" size={16} color="#6B7280" />
              <Text style={styles.sectionTitle}>Reward Information</Text>
            </View>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reward ID</Text>
                <Text style={[styles.detailValue, { color: PRIMARY_COLOR }]}>{details.rewardId}</Text>
              </View>
              <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reward Type</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{details.rewardType}</Text>
              </View>
            </View>
          </>
        )}

        {transaction.type === 'expired' && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.sectionTitle}>Expiry Information</Text>
            </View>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reason</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{details.reason}</Text>
              </View>
              <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Original Date</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{details.originalDate}</Text>
              </View>
            </View>
          </>
        )}

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: cardBg, borderColor: isDark ? 'transparent' : '#E5E7EB' }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="information-circle" size={18} color="#F59E0B" />
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Points expire 90 days after earning if not used. Keep your account active to retain your points.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: 100,
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
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  heroPoints: {
    fontSize: 42,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  heroPointsLabel: {
    fontSize: 16,
    marginBottom: 12,
    fontFamily: FONTS.regular,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  heroDate: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: FONTS.semiBold,
  },
  card: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  idValue: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 44,
  },
  detailLabel: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  separator: {
    height: 1,
    marginLeft: 16,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.regular,
  },
});
