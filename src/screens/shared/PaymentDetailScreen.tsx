import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  PaymentDetail: { payment: RecentBill };
};

export default function PaymentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'PaymentDetail'>>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const payment = route.params?.payment;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
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
    dividerDot: {
      backgroundColor: colors.background,
    },
    dividerLine: {
      borderColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB',
    },
    detailRowBorder: {
      borderBottomColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#F3F4F6',
    },
    secondaryButton: {
      backgroundColor: isDark ? '#3C3C3E' : '#F3E8FF',
    },
    reportButton: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
    },
    helpSection: {
      backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6',
    },
  }), [colors, isDark]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
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

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'paid': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'failed': return 'close-circle';
      default: return 'help-circle';
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Payment Receipt\n\nProvider: ${payment.provider}\nCategory: ${payment.category}\nAmount: ₦${(payment.amount ?? 0).toLocaleString()}\nAccount: ${payment.accountNumber}\nDate: ${payment.date}\nStatus: ${payment.status.toUpperCase()}\nTransaction ID: TXN${payment.id.slice(-8).toUpperCase()}`,
        title: 'Payment Receipt',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadReceipt = () => {
    Alert.alert(
      'Download Receipt',
      'Your receipt has been downloaded successfully!',
      [{ text: 'OK' }]
    );
  };

  const handleRepeatPayment = () => {
    Alert.alert(
      'Repeat Payment',
      `Do you want to make another payment of ₦${(payment.amount ?? 0).toLocaleString()} to ${payment.provider}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Proceed', onPress: () => {
          // Navigate to PayBill with pre-filled data
          navigation.goBack();
        }},
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Select the issue you want to report:',
      [
        { text: 'Payment not received', onPress: () => Alert.alert('Report Submitted', 'We will investigate and get back to you within 24 hours.') },
        { text: 'Wrong amount charged', onPress: () => Alert.alert('Report Submitted', 'We will investigate and get back to you within 24 hours.') },
        { text: 'Other issue', onPress: () => Alert.alert('Report Submitted', 'We will investigate and get back to you within 24 hours.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (!payment) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <Text style={dynamicStyles.text}>Payment not found</Text>
      </View>
    );
  }

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
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment Details</Text>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Receipt Card */}
        <Animated.View 
          style={[
            styles.receiptCard,
            dynamicStyles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          {/* Status Banner */}
          <LinearGradient
            colors={payment.status === 'paid' 
              ? ['#10B981', '#059669'] 
              : payment.status === 'pending' 
                ? ['#F59E0B', '#D97706']
                : ['#EF4444', '#DC2626']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusBanner}
          >
            <Ionicons name={getStatusIcon(payment.status)} size={24} color="#FFF" />
            <Text style={styles.statusBannerText}>
              {payment.status === 'paid' ? 'Payment Successful' : 
               payment.status === 'pending' ? 'Payment Pending' : 'Payment Failed'}
            </Text>
          </LinearGradient>

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, dynamicStyles.textSecondary]}>Amount Paid</Text>
            <Text style={[styles.amountValue, dynamicStyles.text]}>₦{(payment.amount ?? 0).toLocaleString()}</Text>
            <Text style={[styles.amountDate, dynamicStyles.textSecondary]}>{payment.date}</Text>
          </View>

          {/* Divider with dots */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerDot, dynamicStyles.dividerDot]} />
            <View style={[styles.dividerLine, dynamicStyles.dividerLine]} />
            <View style={[styles.dividerDot, dynamicStyles.dividerDot]} />
          </View>

          {/* Provider Info */}
          <View style={styles.providerSection}>
            <View style={[styles.providerIcon, { backgroundColor: getCategoryColor(payment.category) + '20' }]}>
              <Ionicons name={getCategoryIcon(payment.category)} size={28} color={getCategoryColor(payment.category)} />
            </View>
            <Text style={[styles.providerName, dynamicStyles.text]}>{payment.provider}</Text>
            <Text style={[styles.providerCategory, dynamicStyles.textSecondary]}>{payment.category}</Text>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <View style={[styles.detailRow, dynamicStyles.detailRowBorder]}>
              <View style={styles.detailLeft}>
                <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Account/Meter Number</Text>
              </View>
              <Text style={[styles.detailValue, dynamicStyles.text]}>{payment.accountNumber}</Text>
            </View>

            <View style={[styles.detailRow, dynamicStyles.detailRowBorder]}>
              <View style={styles.detailLeft}>
                <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Transaction ID</Text>
              </View>
              <Text style={[styles.detailValue, dynamicStyles.text]}>TXN{payment.id.slice(-8).toUpperCase()}</Text>
            </View>

            <View style={[styles.detailRow, dynamicStyles.detailRowBorder]}>
              <View style={styles.detailLeft}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Payment Date</Text>
              </View>
              <Text style={[styles.detailValue, dynamicStyles.text]}>{payment.date}</Text>
            </View>

            <View style={[styles.detailRow, dynamicStyles.detailRowBorder]}>
              <View style={styles.detailLeft}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Payment Time</Text>
              </View>
              <Text style={[styles.detailValue, dynamicStyles.text]}>10:45 AM</Text>
            </View>

            <View style={[styles.detailRow, dynamicStyles.detailRowBorder]}>
              <View style={styles.detailLeft}>
                <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Payment Method</Text>
              </View>
              <Text style={[styles.detailValue, dynamicStyles.text]}>Wallet</Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <View style={styles.detailLeft}>
                <Ionicons name="checkmark-done-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Status</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(payment.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadReceipt}>
            <LinearGradient
              colors={['#7C3AED', '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="download-outline" size={22} color="#FFF" />
              <Text style={styles.actionButtonText}>Download Receipt</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={[styles.secondaryButton, dynamicStyles.secondaryButton]} onPress={handleRepeatPayment}>
              <Ionicons name="refresh-outline" size={20} color="#7C3AED" />
              <Text style={styles.secondaryButtonText}>Repeat Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryButton, dynamicStyles.secondaryButton]} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color="#7C3AED" />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Report Issue */}
        <TouchableOpacity style={[styles.reportButton, dynamicStyles.reportButton]} onPress={handleReportIssue}>
          <Ionicons name="warning-outline" size={20} color="#EF4444" />
          <Text style={styles.reportButtonText}>Report an Issue</Text>
        </TouchableOpacity>

        {/* Help Section */}
        <View style={[styles.helpSection, dynamicStyles.helpSection]}>
          <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.helpText, dynamicStyles.textSecondary]}>
            Need help with this transaction? Contact our support team available 24/7.
          </Text>
        </View>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
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
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  amountDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  dividerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  providerSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  providerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  providerCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
});
