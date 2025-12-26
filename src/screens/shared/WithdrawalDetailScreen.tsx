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
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { Withdrawal, WithdrawalStatus } from '../../services/withdrawalService';
import { WithdrawHeroIllustration } from '../../assets/illustrations/stats';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<WithdrawalStatus, { 
  label: string; 
  color: string; 
  bgColor: string; 
  icon: string;
  gradientColors: [string, string];
  description: string;
}> = {
  pending: {
    label: 'Pending',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'time-outline',
    gradientColors: ['#F59E0B', '#D97706'],
    description: 'Your withdrawal request is awaiting processing',
  },
  processing: {
    label: 'Processing',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'sync-outline',
    gradientColors: ['#3B82F6', '#2563EB'],
    description: 'Your withdrawal is being processed',
  },
  completed: {
    label: 'Completed',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'checkmark-circle-outline',
    gradientColors: ['#10B981', '#059669'],
    description: 'Your withdrawal has been successfully processed',
  },
  failed: {
    label: 'Failed',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'close-circle-outline',
    gradientColors: ['#EF4444', '#DC2626'],
    description: 'Your withdrawal could not be processed',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: 'ban-outline',
    gradientColors: ['#6B7280', '#4B5563'],
    description: 'This withdrawal request was cancelled',
  },
};

export default function WithdrawalDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const { withdrawal } = route.params as { withdrawal: Withdrawal };
  const statusConfig = STATUS_CONFIG[withdrawal.status];

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Withdrawal Receipt\n\n` +
          `Amount: ₦${(withdrawal.amount ?? 0).toLocaleString()}\n` +
          `Bank: ${withdrawal.bankAccount.bankName}\n` +
          `Account: ****${withdrawal.bankAccount.accountNumber.slice(-4)}\n` +
          `Status: ${statusConfig.label}\n` +
          `Reference: ${withdrawal.reference}\n` +
          `Date: ${formatShortDate(withdrawal.createdAt)}\n\n` +
          `- Handwork Wallet`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleDownloadReceipt = () => {
    Alert.alert(
      'Receipt Downloaded',
      'Your withdrawal receipt has been saved to your device.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleRetry = () => {
    if (withdrawal.status === 'failed') {
      Alert.alert(
        'Retry Withdrawal',
        `Would you like to retry this withdrawal of ₦${(withdrawal.amount ?? 0).toLocaleString()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            style: 'default', 
            onPress: () => {
              // Navigate to withdraw screen with pre-filled data
              (navigation as any).navigate('Withdraw', {
                prefillAmount: withdrawal.amount,
                prefillBankAccountId: withdrawal.bankAccountId,
              });
            }
          },
        ]
      );
    } else {
      Alert.alert(
        'Cannot Retry',
        'Only failed withdrawals can be retried.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Issue',
      'Would you like to report a problem with this withdrawal?',
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

  const handleContactSupport = () => {
    (navigation as any).navigate('LiveChat', {
      subject: `Withdrawal Issue - ${withdrawal.reference}`,
      message: `I need help with my withdrawal:\nReference: ${withdrawal.reference}\nAmount: ₦${withdrawal.amount?.toLocaleString()}\nStatus: ${statusConfig.label}`,
    });
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
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityLabel="Share withdrawal details"
        >
          <Ionicons name="share-outline" size={22} color={statusConfig.color} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 16, paddingBottom: insets.bottom + 40 },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Page Title Section */}
        <View style={styles.pageTitleSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Withdrawal Details</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>View your withdrawal information</Text>
        </View>

        {/* Amount Card with Gradient */}
        <View style={[styles.amountCard, dynamicStyles.card]}>
          <LinearGradient
            colors={statusConfig.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.amountCardHeader}
          >
            {/* Decorative circles */}
            <View style={[styles.decorCircle, { top: -30, right: -30, opacity: 0.1 }]} />
            <View style={[styles.decorCircle, { bottom: -20, left: 40, opacity: 0.08, width: 60, height: 60 }]} />
            
            <View style={styles.amountHeaderContent}>
              <View style={styles.illustrationContainer}>
                <WithdrawHeroIllustration width={70} height={70} />
              </View>
              <View style={styles.amountTextContainer}>
                <Text style={styles.amountLabel}>Withdrawal Amount</Text>
                <Text style={styles.amountValue}>₦{(withdrawal.amount ?? 0).toLocaleString()}</Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* Status Section */}
          <View style={styles.statusSection}>
            <View style={[styles.statusIconWrapper, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon as any} size={24} color={statusConfig.color} />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              <Text style={[styles.statusDescription, dynamicStyles.textSecondary]}>{statusConfig.description}</Text>
            </View>
          </View>
        </View>

        {/* Bank Account Section */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>DESTINATION ACCOUNT</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.bankRow}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bankIconGradient}
            >
              <MaterialCommunityIcons name="bank" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.bankInfo}>
              <Text style={[styles.bankName, dynamicStyles.text]}>{withdrawal.bankAccount.bankName}</Text>
              <View style={styles.accountRow}>
                <Ionicons name="card-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.accountNumber, dynamicStyles.textSecondary]}>
                  {withdrawal.bankAccount.accountNumber}
                </Text>
              </View>
              <Text style={[styles.accountName, dynamicStyles.textSecondary]}>
                {withdrawal.bankAccount.accountName}
              </Text>
            </View>
            {withdrawal.bankAccount.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
            )}
          </View>
        </View>

        {/* Transaction Details Section */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>TRANSACTION DETAILS</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Reference ID</Text>
            <View style={styles.detailValueWithCopy}>
              <Text style={[styles.detailValue, dynamicStyles.text, { flex: 0 }]} numberOfLines={1}>
                {withdrawal.reference.slice(0, 16).toUpperCase()}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={async () => {
                  await Clipboard.setStringAsync(withdrawal.reference);
                  Alert.alert('Copied', 'Reference ID copied to clipboard');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={18} color={statusConfig.color} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.08)' }]} />
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Date Requested</Text>
            <Text style={[styles.detailValue, dynamicStyles.text]}>{formatShortDate(withdrawal.createdAt)}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.08)' }]} />
          
          {withdrawal.processedAt && (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Date Processed</Text>
                <Text style={[styles.detailValue, dynamicStyles.text]}>{formatShortDate(withdrawal.processedAt)}</Text>
              </View>
              <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.08)' }]} />
            </>
          )}
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Status</Text>
            <View style={[styles.statusBadgeSmall, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.color + '40' }]}>
              <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>
        </View>

        {/* Amount Summary Section */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>AMOUNT BREAKDOWN</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Withdrawal Amount</Text>
            <Text style={[styles.summaryValue, dynamicStyles.text]}>₦{(withdrawal.amount ?? 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.08)' }]} />
          
          <View style={styles.summaryRow}>
            <View style={styles.feeRow}>
              <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Processing Fee</Text>
              {withdrawal.fee === 0 && (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              )}
            </View>
            <Text style={[styles.summaryValue, withdrawal.fee === 0 ? styles.freeText : dynamicStyles.text]}>
              {withdrawal.fee === 0 ? '₦0' : `₦${withdrawal.fee.toLocaleString()}`}
            </Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.08)' }]} />
          
          <View style={[styles.totalRow, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }]}>
            <View style={styles.totalLeft}>
              <Ionicons name="wallet-outline" size={20} color="#059669" />
              <Text style={[styles.totalLabel, { color: colors.text }]}>Amount Received</Text>
            </View>
            <Text style={styles.totalValue}>₦{(withdrawal.netAmount ?? 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Failure Reason (if failed) */}
        {withdrawal.status === 'failed' && withdrawal.failureReason && (
          <>
            <View style={styles.sectionSubHeader}>
              <Text style={[styles.sectionSubHeaderTitle, { color: '#EF4444' }]}>FAILURE REASON</Text>
            </View>
            <View style={[styles.failureCard, { borderColor: '#FECACA' }]}>
              <View style={styles.failureIconContainer}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
              </View>
              <Text style={styles.failureText}>{withdrawal.failureReason}</Text>
            </View>
          </>
        )}

        {/* Timeline Section */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>TIMELINE</Text>
        </View>
        <View style={[styles.card, dynamicStyles.card]}>
          <View style={styles.timelineContainer}>
            {/* Requested */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <View style={styles.timelineLine} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, dynamicStyles.text]}>Withdrawal Requested</Text>
                <Text style={[styles.timelineDate, dynamicStyles.textSecondary]}>{formatDate(withdrawal.createdAt)}</Text>
              </View>
            </View>
            
            {/* Processing */}
            <View style={styles.timelineItem}>
              <View style={[
                styles.timelineDot, 
                { backgroundColor: ['processing', 'completed'].includes(withdrawal.status) ? '#10B981' : isDark ? '#4B5563' : '#D1D5DB' }
              ]}>
                {['processing', 'completed'].includes(withdrawal.status) ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <View style={styles.timelineDotInner} />
                )}
              </View>
              <View style={styles.timelineLine} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, dynamicStyles.text]}>Being Processed</Text>
                <Text style={[styles.timelineDate, dynamicStyles.textSecondary]}>
                  {withdrawal.status === 'pending' ? 'Pending' : 'Processed'}
                </Text>
              </View>
            </View>
            
            {/* Completed/Failed */}
            <View style={[styles.timelineItem, { paddingBottom: 0 }]}>
              <View style={[
                styles.timelineDot, 
                { 
                  backgroundColor: withdrawal.status === 'completed' 
                    ? '#10B981' 
                    : withdrawal.status === 'failed' 
                      ? '#EF4444' 
                      : isDark ? '#4B5563' : '#D1D5DB' 
                }
              ]}>
                {withdrawal.status === 'completed' ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : withdrawal.status === 'failed' ? (
                  <Ionicons name="close" size={12} color="#FFFFFF" />
                ) : (
                  <View style={styles.timelineDotInner} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, dynamicStyles.text]}>
                  {withdrawal.status === 'failed' ? 'Failed' : 'Completed'}
                </Text>
                <Text style={[styles.timelineDate, dynamicStyles.textSecondary]}>
                  {withdrawal.processedAt ? formatDate(withdrawal.processedAt) : 'Pending'}
                </Text>
              </View>
            </View>
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

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleRetry}
              disabled={withdrawal.status !== 'failed'}
            >
              <View style={[
                styles.actionIcon, 
                { backgroundColor: withdrawal.status === 'failed' ? '#DCFCE7' : '#F3F4F6' }
              ]}>
                <MaterialCommunityIcons 
                  name="refresh" 
                  size={24} 
                  color={withdrawal.status === 'failed' ? '#16A34A' : '#9CA3AF'} 
                />
              </View>
              <Text style={[
                styles.actionText, 
                withdrawal.status === 'failed' ? dynamicStyles.text : { color: '#9CA3AF' }
              ]}>Retry</Text>
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
        <TouchableOpacity 
          style={[styles.supportNote, dynamicStyles.card]}
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={statusConfig.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.supportIconContainer}
          >
            <MaterialCommunityIcons name="headset" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.supportTextContainer}>
            <Text style={[styles.supportTitle, dynamicStyles.text]}>Need Help?</Text>
            <Text style={[styles.supportText, dynamicStyles.textSecondary]}>
              Contact our 24/7 support team for assistance with this withdrawal.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.ScrollView>
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
  shareButton: {
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
  sectionSubHeader: {
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  sectionSubHeaderTitle: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  amountCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  amountCardHeader: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
  },
  amountHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  illustrationContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountTextContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 14,
  },
  statusIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
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
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 14,
  },
  bankIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInfo: {
    flex: 1,
    gap: 3,
  },
  bankName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountNumber: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    letterSpacing: 1,
  },
  accountName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  verifiedBadge: {
    padding: 4,
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
    flexShrink: 0,
    marginRight: SPACING.md,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailValueWithCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  copyButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  separator: {
    height: 1,
    marginLeft: SPACING.md,
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
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
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  freeText: {
    color: '#059669',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    margin: SPACING.sm,
    borderRadius: 12,
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    color: '#059669',
  },
  failureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: SPACING.md,
    borderRadius: 14,
    marginBottom: SPACING.lg,
    gap: 12,
    borderWidth: 1,
  },
  failureIconContainer: {
    padding: 4,
  },
  failureText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: '#DC2626',
    lineHeight: 20,
  },
  timelineContainer: {
    padding: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: SPACING.lg,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    zIndex: 1,
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: 0,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
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
    alignItems: 'center',
    borderRadius: 16,
    padding: SPACING.md,
    gap: 14,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 2,
  },
  supportText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
});
