import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { SPACING, FONT_SIZES, COLORS, FONTS } from '../../constants/theme';
import { TopUpHeroIllustration } from '../../assets/illustrations/stats';
import { walletService, TOPUP_CONFIG, WalletBalance, validateTopUpAmount } from '../../services/walletService';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatCurrencyFull } from '../../utils/formatters';

const { width } = Dimensions.get('window');

type PaymentMethod = 'card' | 'bank_transfer';

interface DvaDetails {
  hasDva: boolean;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  message: string;
}

export default function TopUpScreen({ route }: { route?: { params?: { balance?: number } } }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  // Always fetch fresh balance from API - don't use stale route params
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
  const paymentReferenceRef = useRef(''); // Ref for reliable access in callbacks
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
    fetchDvaDetails();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Refresh balance whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBalance();
    }, [])
  );

  const fetchBalance = async () => {
    try {
      setIsFetchingBalance(true);
      const walletBalance = await walletService.getBalance();
      console.log('[TopUpScreen] Raw balance response:', JSON.stringify(walletBalance));
      
      // Handle both string and number types from PostgreSQL
      let availableBalance = (walletBalance as any)?.available ?? (walletBalance as any)?.balance ?? 0;
      if (typeof availableBalance === 'string') {
        availableBalance = parseFloat(availableBalance) || 0;
      }
      
      console.log('[TopUpScreen] Parsed balance:', availableBalance);
      
      // Always use API balance
      setBalance({
        ...walletBalance,
        available: availableBalance,
      });
    } catch (error) {
      console.error('[TopUpScreen] Failed to fetch balance:', error);
      // Keep initialBalance from route params on error
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
      console.log('[TopUpScreen] Initializing top-up for amount:', amount);
      const result = await walletService.initializeTopUp(amount);
      console.log('[TopUpScreen] initializeTopUp result:', JSON.stringify(result));
      
      if (result && result.authorizationUrl) {
        // Open Paystack checkout in in-app WebView
        console.log('[TopUpScreen] Setting paymentReference to:', result.reference);
        setPaymentUrl(result.authorizationUrl);
        setPaymentReference(result.reference);
        paymentReferenceRef.current = result.reference; // Also store in ref
        setShowPaymentModal(true);
      } else {
        Alert.alert('Error', 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.log('[TopUpScreen] initializeTopUp error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle WebView navigation state changes (same pattern as CheckoutScreen)
  const handleWebViewNavigationChange = (navState: any) => {
    const { url, title, loading } = navState;
    
    if (!url) return;
    
    console.log('[TopUpScreen] WebView Navigation - URL:', url);
    console.log('[TopUpScreen] WebView Navigation - Title:', title);
    console.log('[TopUpScreen] WebView Navigation - Loading:', loading);
    console.log('[TopUpScreen] Current paymentReference:', paymentReference);
    
    // Check for success in page title (Paystack shows "Transaction Successful" or similar)
    if (title && (
      title.toLowerCase().includes('success') ||
      title.toLowerCase().includes('approved') ||
      title.toLowerCase().includes('completed')
    )) {
      console.log('[TopUpScreen] Success detected from title, verifying payment...');
      const refToVerify = paymentReferenceRef.current || paymentReference;
      console.log('[TopUpScreen] Reference to verify:', refToVerify);
      setShowPaymentModal(false);
      setPaymentUrl('');
      verifyPayment(refToVerify);
      return;
    }
    
    // Check for success/callback URL patterns (Paystack redirects)
    if (
      url.includes('callback') || 
      url.includes('trxref=') || 
      url.includes('reference=')
    ) {
      const refToVerify = paymentReferenceRef.current || paymentReference;
      console.log('[TopUpScreen] Callback URL pattern in nav change, verifying:', refToVerify);
      setShowPaymentModal(false);
      setPaymentUrl('');
      verifyPayment(refToVerify);
      return;
    }
    
    // Check for cancel/close patterns
    if (url.includes('cancel') || url.includes('close') || url.includes('failed')) {
      setShowPaymentModal(false);
      setPaymentUrl('');
      Alert.alert('Payment Cancelled', 'You cancelled the payment.');
      return;
    }
  };

  // JavaScript to inject into WebView to detect Paystack success
  const injectedJavaScript = `
    (function() {
      // Monitor for success messages in the page
      const observer = new MutationObserver(function(mutations) {
        const bodyText = document.body.innerText || '';
        if (
          bodyText.includes('Transaction Successful') ||
          bodyText.includes('Payment Successful') ||
          bodyText.includes('Your payment was successful') ||
          bodyText.includes('Transaction successful')
        ) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', event: 'payment_complete' }));
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      
      // Also check on load
      setTimeout(function() {
        const bodyText = document.body.innerText || '';
        if (
          bodyText.includes('Transaction Successful') ||
          bodyText.includes('Payment Successful') ||
          bodyText.includes('Your payment was successful')
        ) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', event: 'payment_complete' }));
        }
      }, 1000);
    })();
    true;
  `;

  // Handle URL requests before loading (better for catching redirects)
  const handleShouldStartLoad = (request: any) => {
    const { url } = request;
    const refToVerify = paymentReferenceRef.current || paymentReference;
    console.log('[TopUpScreen] handleShouldStartLoad - URL:', url);
    console.log('[TopUpScreen] handleShouldStartLoad - refToVerify:', refToVerify);
    
    // Check if this is a callback/redirect URL
    if (url.includes('callback') || url.includes('trxref=') || url.includes('reference=')) {
      console.log('[TopUpScreen] Callback URL detected, verifying payment...');
      // Close modal and verify payment
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentUrl('');
        verifyPayment(refToVerify);
      }, 100);
      return false; // Don't load this URL in WebView
    }
    
    return true; // Allow other URLs
  };

  // Handle messages from WebView (injected JavaScript)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[TopUpScreen] WebView message:', data);
      
      if (data.status === 'success' && data.event === 'payment_complete') {
        const refToVerify = paymentReferenceRef.current || paymentReference;
        console.log('[TopUpScreen] WebView message success, verifying:', refToVerify);
        setShowPaymentModal(false);
        setPaymentUrl('');
        verifyPayment(refToVerify);
      }
    } catch (error) {
      console.log('[TopUpScreen] Failed to parse WebView message:', error);
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
    console.log('[TopUpScreen] verifyPayment called with reference:', reference);
    try {
      setIsLoading(true);
      console.log('[TopUpScreen] Calling walletService.verifyTopUp...');
      const result = await walletService.verifyTopUp(reference);
      console.log('[TopUpScreen] verifyTopUp result:', JSON.stringify(result));
      
      if (result.status === 'success') {
        // Refresh balance first before showing alert
        await fetchBalance();
        
        Alert.alert(
          'Success!',
          `Your wallet has been credited with ₦${result.amount.toLocaleString()}.\n\nReference: ${result.reference}`,
          [{ text: 'OK', onPress: () => {
            // Small delay to ensure wallet screen refreshes properly
            setTimeout(() => {
              navigation.goBack();
            }, 100);
          }}]
        );
      } else {
        console.log('[TopUpScreen] Payment status not success:', result.status);
        Alert.alert('Payment Pending', 'Payment is still being processed. Please check back later.');
      }
    } catch (error: any) {
      console.log('[TopUpScreen] verifyPayment error:', error);
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
          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5' },
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 16, paddingBottom: insets.bottom + 120 },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Page Title Section */}
          <View style={styles.pageTitleSection}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Top Up Wallet</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>Add money to your wallet balance</Text>
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
                  {formatCurrencyFull(balance?.available || 0)}
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

          {/* Custom Amount */}
          <View style={styles.amountSectionHeader}>
            <Text style={[styles.amountSectionTitle, dynamicStyles.textSecondary]}>OR ENTER AMOUNT</Text>
          </View>
          <View style={[styles.inputCard, dynamicStyles.card]}>
            <View style={styles.floatingInputContainer}>
              <View style={styles.floatingInputRow}>
                <View style={styles.floatingInputContent}>
                  <Text style={[styles.currencyPrefix, dynamicStyles.text]}>₦</Text>
                  <RNTextInput
                    style={[styles.floatingInput, dynamicStyles.text]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
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
            </View>
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
        presentationStyle="fullScreen"
        onRequestClose={handleClosePaymentModal}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={[styles.paymentModalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.paymentModalHeader}>
            <TouchableOpacity
              onPress={handleClosePaymentModal}
              style={styles.paymentModalCloseButton}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={[styles.paymentModalTitle, { color: '#1F2937' }]}>
              Complete Payment
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* WebView Loading Indicator */}
          {isWebViewLoading && (
            <View style={styles.webviewLoadingContainer}>
              <ActivityIndicator size="large" color="#16A34A" />
              <Text style={[styles.webviewLoadingText, { color: '#6B7280' }]}>
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
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              onMessage={handleWebViewMessage}
              injectedJavaScript={injectedJavaScript}
              onLoadStart={() => setIsWebViewLoading(true)}
              onLoadEnd={() => setIsWebViewLoading(false)}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              renderLoading={() => (
                <View style={styles.webviewLoadingContainer}>
                  <ActivityIndicator size="large" color="#16A34A" />
                  <Text style={[styles.webviewLoadingText, { color: '#6B7280' }]}>
                    Loading payment page...
                  </Text>
                </View>
              )}
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
    justifyContent: 'space-between',
  },
  presetAmount: {
    width: '31.5%',
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
  // Amount Input Card Styles
  inputCard: {
    borderRadius: 16,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  floatingInputContainer: {
    padding: SPACING.md,
  },
  floatingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingInputContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginRight: 4,
  },
  floatingInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    paddingVertical: 8,
  },
  floatingInputIcons: {
    marginLeft: 12,
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
