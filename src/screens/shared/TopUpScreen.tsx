import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Clipboard,
  Linking,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { SPACING, FONT_SIZES, COLORS, FONTS } from '../../constants/theme';
import { TopUpHeroIllustration } from '../../assets/illustrations/stats';
import { walletService, TOPUP_CONFIG, WalletBalance, validateTopUpAmount } from '../../services/walletService';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';

const { width } = Dimensions.get('window');

type PaymentMethod = 'card' | 'bank_transfer';

interface DvaDetails {
  hasDva: boolean;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  message: string;
}

export default function TopUpScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [dvaDetails, setDvaDetails] = useState<DvaDetails | null>(null);
  const [isLoadingDva, setIsLoadingDva] = useState(false);
  
  // WebView payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const customAmountAnimValue = useRef(new Animated.Value(0)).current;
  const [customAmountFocused, setCustomAmountFocused] = useState(false);

  // Animate label on focus/value change
  useEffect(() => {
    Animated.timing(customAmountAnimValue, {
      toValue: customAmountFocused || customAmount ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [customAmountFocused, customAmount]);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
  }), [colors, isDark]);

  useEffect(() => {
    fetchBalance();
    fetchDvaDetails();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchBalance = async () => {
    try {
      setIsFetchingBalance(true);
      const walletBalance = await walletService.getBalance();
      setBalance(walletBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsFetchingBalance(false);
    }
  };

  const fetchDvaDetails = async () => {
    try {
      setIsLoadingDva(true);
      const dva = await walletService.getDvaDetails();
      setDvaDetails(dva);
    } catch (error) {
      console.error('Failed to fetch DVA details:', error);
    } finally {
      setIsLoadingDva(false);
    }
  };

  const getTopUpAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseInt(customAmount);
    return 0;
  };

  const handleTopUp = async () => {
    const amount = getTopUpAmount();
    const currentBalance = balance?.available || 0;
    
    const validation = validateTopUpAmount(amount, currentBalance);
    if (!validation.valid) {
      Alert.alert('Invalid Amount', validation.error || 'Invalid amount');
      return;
    }

    if (paymentMethod === 'bank_transfer') {
      // Show bank transfer instructions
      showBankTransferInstructions();
      return;
    }

    // Card payment via Paystack
    try {
      setIsLoading(true);
      const result = await walletService.initializeTopUp(amount);
      
      if (result && result.authorizationUrl) {
        // Open Paystack checkout in in-app WebView
        setPaymentUrl(result.authorizationUrl);
        setPaymentReference(result.reference);
        setShowPaymentModal(true);
      } else {
        Alert.alert('Error', 'Failed to initialize payment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle WebView navigation state changes
  const handleWebViewNavigationChange = (navState: any) => {
    const { url } = navState;
    
    // Check for success/callback URL patterns
    if (url.includes('callback') || url.includes('success') || url.includes('trxref=') || url.includes('reference=')) {
      // Payment completed, close modal and verify
      setShowPaymentModal(false);
      setPaymentUrl('');
      verifyPayment(paymentReference);
    }
    
    // Check for cancel/close patterns
    if (url.includes('cancel') || url.includes('close')) {
      setShowPaymentModal(false);
      setPaymentUrl('');
      Alert.alert('Payment Cancelled', 'You cancelled the payment.');
    }
  };

  const handleClosePaymentModal = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => {
            setShowPaymentModal(false);
            setPaymentUrl('');
          }
        },
      ]
    );
  };

  const verifyPayment = async (reference: string) => {
    try {
      setIsLoading(true);
      const result = await walletService.verifyTopUp(reference);
      
      if (result.status === 'success') {
        Alert.alert(
          'Success!',
          `Your wallet has been credited with ₦${result.amount.toLocaleString()}.\n\nReference: ${result.reference}`,
          [{ text: 'OK', onPress: () => {
            fetchBalance(); // Refresh balance
            navigation.goBack();
          }}]
        );
      } else {
        Alert.alert('Payment Pending', 'Payment is still being processed. Please check back later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not verify payment. Please check your transaction history.');
    } finally {
      setIsLoading(false);
    }
  };

  const showBankTransferInstructions = () => {
    if (!dvaDetails?.hasDva) {
      Alert.alert(
        'Account Not Ready',
        dvaDetails?.message || 'Your virtual account is not yet set up. Please try card payment or contact support.',
      );
      return;
    }

    Alert.alert(
      'Bank Transfer Details',
      `Transfer any amount to this account:\n\nBank: ${dvaDetails.bankName}\nAccount: ${dvaDetails.accountNumber}\nName: ${dvaDetails.accountName}\n\nYour wallet will be credited automatically within minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Copy Account', 
          onPress: () => {
            Clipboard.setString(dvaDetails.accountNumber || '');
            Alert.alert('Copied', 'Account number copied to clipboard');
          },
        },
      ]
    );
  };

  const copyAccountNumber = () => {
    if (dvaDetails?.accountNumber) {
      Clipboard.setString(dvaDetails.accountNumber);
      Alert.alert('Copied!', 'Account number copied to clipboard');
    }
  };

  const renderPresetAmount = (amount: number) => {
    const isSelected = selectedAmount === amount;
    return (
      <TouchableOpacity
        key={amount}
        style={[
          styles.presetAmount,
          dynamicStyles.card,
          isSelected && styles.presetAmountSelected,
        ]}
        onPress={() => {
          setSelectedAmount(amount);
          setCustomAmount('');
        }}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.presetAmountText, 
          dynamicStyles.text,
          isSelected && styles.presetAmountTextSelected,
        ]}>
          ₦{amount.toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? '#2C2C2E' : 'rgba(255, 255, 255, 0.9)' }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 120 },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderTitle, dynamicStyles.text]}>Top Up Wallet</Text>
          </View>

          {/* Current Balance Card */}
          <View style={[styles.balanceCard, dynamicStyles.card]}>
            <View style={styles.balanceIconContainer}>
              <TopUpHeroIllustration width={32} height={32} color="#FFFFFF" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceLabel, dynamicStyles.textSecondary]}>Current Balance</Text>
              {isFetchingBalance ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.balanceAmount, dynamicStyles.text]}>
                  {formatCurrency(balance?.available || 0)}
                </Text>
              )}
            </View>
            <View style={styles.balanceDecoration}>
              <View style={[styles.decorationCircle, styles.decorationCircle1]} />
              <View style={[styles.decorationCircle, styles.decorationCircle2]} />
            </View>
          </View>

          {/* Amount Section */}
          <View style={styles.amountSectionHeader}>
            <Text style={[styles.amountSectionTitle, dynamicStyles.textSecondary]}>SELECT AMOUNT</Text>
          </View>
          <View style={[styles.presetCard, dynamicStyles.card]}>
            <View style={styles.presetGrid}>
              {TOPUP_CONFIG.quickAmounts.map(renderPresetAmount)}
            </View>
          </View>

          {/* Custom Amount - Floating Label Style */}
          <View style={styles.floatingInputContainer}>
            <View style={styles.floatingInputRow}>
              <View style={styles.floatingInputContent}>
                <Animated.Text style={[{
                  position: 'absolute',
                  left: 0,
                  top: customAmountAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, -8],
                  }),
                  fontSize: customAmountAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 12],
                  }),
                  color: customAmountAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isDark ? '#9CA3AF' : '#6B7280', '#16A34A'],
                  }),
                  backgroundColor: isDark ? colors.background : '#F2F2F7',
                  paddingHorizontal: 4,
                  zIndex: 1,
                  fontFamily: FONTS.regular,
                }]}>
                  Or enter custom amount
                </Animated.Text>
                <RNTextInput
                  style={[styles.floatingInput, dynamicStyles.text]}
                  placeholderTextColor="transparent"
                  keyboardType="numeric"
                  value={customAmount}
                  onFocus={() => setCustomAmountFocused(true)}
                  onBlur={() => setCustomAmountFocused(false)}
                  onChangeText={(text) => {
                    setCustomAmount(text.replace(/[^0-9]/g, ''));
                    setSelectedAmount(null);
                  }}
                />
              </View>
              <View style={styles.floatingInputIcons}>
                <MaterialCommunityIcons
                  name="cash-plus"
                  size={22}
                  color={customAmountFocused ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
                />
              </View>
            </View>
            <View style={[styles.floatingInputLine, (customAmountFocused || customAmount) && styles.floatingInputLineFocused]} />
          </View>
          <Text style={[styles.amountHint, dynamicStyles.textSecondary]}>
            Min: ₦{TOPUP_CONFIG.minAmount.toLocaleString()} • Max: ₦{TOPUP_CONFIG.maxAmount.toLocaleString()}
          </Text>

          {/* Payment Method */}
          <View style={styles.amountSectionHeader}>
            <Text style={[styles.amountSectionTitle, dynamicStyles.textSecondary]}>PAYMENT METHOD</Text>
          </View>
          
          {/* Card Payment Option */}
          <TouchableOpacity 
            style={[styles.paymentMethodCard, dynamicStyles.card, paymentMethod === 'card' && styles.paymentMethodSelected]}
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentMethodRow}>
              <View style={[styles.paymentIconBg, { backgroundColor: '#007AFF' }]}>
                <MaterialCommunityIcons name="credit-card-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodTitle, dynamicStyles.text]}>Card Payment</Text>
                <Text style={[styles.paymentMethodDesc, dynamicStyles.textSecondary]}>
                  Pay with debit/credit card via Paystack
                </Text>
              </View>
              {paymentMethod === 'card' && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Bank Transfer Option */}
          <TouchableOpacity 
            style={[styles.paymentMethodCard, dynamicStyles.card, { marginTop: 8 }, paymentMethod === 'bank_transfer' && styles.paymentMethodSelected]}
            onPress={() => setPaymentMethod('bank_transfer')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentMethodRow}>
              <View style={[styles.paymentIconBg, { backgroundColor: '#34C759' }]}>
                <MaterialCommunityIcons name="bank-transfer" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodTitle, dynamicStyles.text]}>Bank Transfer</Text>
                <Text style={[styles.paymentMethodDesc, dynamicStyles.textSecondary]}>
                  Transfer to your dedicated account
                </Text>
              </View>
              {paymentMethod === 'bank_transfer' && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* DVA Details Card (shown when bank transfer selected) */}
          {paymentMethod === 'bank_transfer' && (
            <View style={[styles.dvaCard, dynamicStyles.card]}>
              {isLoadingDva ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : dvaDetails?.hasDva ? (
                <>
                  <Text style={[styles.dvaTitle, dynamicStyles.text]}>Your Virtual Account</Text>
                  <Text style={[styles.dvaSubtitle, dynamicStyles.textSecondary]}>
                    Transfer any amount to this account to top up instantly
                  </Text>
                  <View style={styles.dvaDetailsRow}>
                    <Text style={[styles.dvaLabel, dynamicStyles.textSecondary]}>Bank</Text>
                    <Text style={[styles.dvaValue, dynamicStyles.text]}>{dvaDetails.bankName}</Text>
                  </View>
                  <View style={styles.dvaDetailsRow}>
                    <Text style={[styles.dvaLabel, dynamicStyles.textSecondary]}>Account Number</Text>
                    <View style={styles.dvaAccountRow}>
                      <Text style={[styles.dvaAccountNumber, dynamicStyles.text]}>{dvaDetails.accountNumber}</Text>
                      <TouchableOpacity onPress={copyAccountNumber} style={styles.copyButton}>
                        <Ionicons name="copy-outline" size={18} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.dvaDetailsRow}>
                    <Text style={[styles.dvaLabel, dynamicStyles.textSecondary]}>Account Name</Text>
                    <Text style={[styles.dvaValue, dynamicStyles.text]}>{dvaDetails.accountName}</Text>
                  </View>
                  <View style={styles.dvaNote}>
                    <Ionicons name="information-circle" size={16} color="#FF9500" />
                    <Text style={[styles.dvaNoteText, dynamicStyles.textSecondary]}>
                      Wallet is credited automatically within 5 minutes
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.dvaNotSetupContainer}>
                  <Ionicons name="alert-circle-outline" size={32} color="#FF9500" />
                  <Text style={[styles.dvaNotSetupText, dynamicStyles.textSecondary]}>
                    {dvaDetails?.message || 'Virtual account not yet set up'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.setupDvaButton}
                    onPress={async () => {
                      try {
                        setIsLoadingDva(true);
                        await walletService.setupDva();
                        await fetchDvaDetails();
                      } catch (error) {
                        Alert.alert('Error', 'Failed to setup virtual account');
                      } finally {
                        setIsLoadingDva(false);
                      }
                    }}
                  >
                    <Text style={styles.setupDvaButtonText}>Setup Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Summary */}
          {getTopUpAmount() > 0 && (
            <>
              <View style={styles.amountSectionHeader}>
                <Text style={[styles.amountSectionTitle, dynamicStyles.textSecondary]}>SUMMARY</Text>
              </View>
              <View style={[styles.summaryCard, dynamicStyles.card]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Top-up Amount</Text>
                  <Text style={[styles.summaryValue, dynamicStyles.text]}>₦{getTopUpAmount().toLocaleString()}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>Transaction Fee</Text>
                  <Text style={[styles.summaryValue, { color: '#16A34A' }]}>Free</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryTotalLabel, dynamicStyles.text]}>Total</Text>
                  <Text style={styles.summaryTotalValue}>₦{getTopUpAmount().toLocaleString()}</Text>
                </View>
              </View>
            </>
          )}

          {/* Info Card */}
          <View style={[styles.infoCard, dynamicStyles.card]}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, dynamicStyles.text]}>Secure Payment</Text>
              <Text style={[styles.infoText, dynamicStyles.textSecondary]}>
                Your payment is secured with bank-level encryption. We never store your card details.
              </Text>
            </View>
          </View>
        </Animated.ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              getTopUpAmount() === 0 && styles.buttonDisabled,
            ]}
            onPress={handleTopUp}
            disabled={isLoading || getTopUpAmount() === 0}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Proceed to Pay</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Paystack Payment WebView Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        onRequestClose={handleClosePaymentModal}
      >
        <View style={[styles.paymentModalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.paymentModalHeader}>
            <TouchableOpacity
              onPress={handleClosePaymentModal}
              style={styles.paymentModalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.paymentModalTitle, { color: colors.text }]}>
              Complete Payment
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* WebView Loading Indicator */}
          {isWebViewLoading && (
            <View style={styles.webviewLoadingContainer}>
              <ActivityIndicator size="large" color="#16A34A" />
              <Text style={[styles.webviewLoadingText, { color: colors.textSecondary }]}>
                Loading payment page...
              </Text>
            </View>
          )}

          {/* Paystack WebView */}
          {paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
              style={[styles.paymentWebView, isWebViewLoading && { opacity: 0 }]}
              onNavigationStateChange={handleWebViewNavigationChange}
              onLoadStart={() => setIsWebViewLoading(true)}
              onLoadEnd={() => setIsWebViewLoading(false)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
            />
          ) : null}
        </View>
      </Modal>
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
  amountSectionHeader: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  amountSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  presetCard: {
    borderRadius: 16,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  presetAmount: {
    width: '31%',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetAmountSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  presetAmountText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  presetAmountTextSelected: {
    color: '#16A34A',
  },
  // Floating Label Input Styles
  floatingInputContainer: {
    marginBottom: 28,
  },
  floatingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  floatingInputContent: {
    flex: 1,
    position: 'relative',
  },
  floatingInput: {
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: FONTS.regular,
  },
  floatingInputIcons: {
    marginLeft: 12,
  },
  floatingInputLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  floatingInputLineFocused: {
    height: 2,
    backgroundColor: '#16A34A',
  },
  amountHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  paymentMethodCard: {
    borderRadius: 16,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  paymentIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  paymentMethodDesc: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SPACING.md,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16A34A',
    fontFamily: FONTS.bold,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: 16,
    marginTop: SPACING.md,
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
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: SPACING.md,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  paymentMethodSelected: {
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  dvaCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginTop: 8,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dvaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  dvaSubtitle: {
    fontSize: 13,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  dvaDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  dvaLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  dvaValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  dvaAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dvaAccountNumber: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  copyButton: {
    padding: 4,
  },
  dvaNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: '#FFF8E6',
    padding: SPACING.sm,
    borderRadius: 8,
    gap: 8,
  },
  dvaNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  dvaNotSetupContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  dvaNotSetupText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  setupDvaButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  setupDvaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Payment Modal Styles
  paymentModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  paymentModalCloseButton: {
    padding: SPACING.xs,
  },
  paymentModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  paymentWebView: {
    flex: 1,
  },
  webviewLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  webviewLoadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
});
