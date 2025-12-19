import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WithdrawHeroIllustration } from '../../assets/illustrations/stats';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { walletService } from '../../services/walletService';
import { withdrawalService, BankAccount } from '../../services/withdrawalService';
import { pinService } from '../../services/pinService';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

const WITHDRAWAL_CONFIG = {
  minAmount: 500,
  maxAmount: 500000,
  freeThreshold: 5000,
  feePercentage: 1,
  maxFee: 100,
};

export default function WithdrawScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [walletBalance, setWalletBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const successAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const amountAnimValue = useRef(new Animated.Value(0)).current;
  const [amountFocused, setAmountFocused] = useState(false);

  // Animate label on focus/value change
  useEffect(() => {
    Animated.timing(amountAnimValue, {
      toValue: amountFocused || amount ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [amountFocused, amount]);

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
  }), [colors, isDark]);

  // Load data when screen comes into focus (handles returning from PaymentMethods after adding bank)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [balance, accounts] = await Promise.all([
        walletService.getBalance(),
        withdrawalService.getBankAccounts(),
      ]);
      setWalletBalance(balance.available);
      setBankAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const numericAmount = parseInt(amount.replace(/,/g, '')) || 0;

  const withdrawalFee = numericAmount <= WITHDRAWAL_CONFIG.freeThreshold
    ? 0
    : Math.min(
        Math.ceil((numericAmount * WITHDRAWAL_CONFIG.feePercentage) / 100),
        WITHDRAWAL_CONFIG.maxFee
      );

  const netAmount = numericAmount - withdrawalFee;

  const isValidAmount =
    numericAmount >= WITHDRAWAL_CONFIG.minAmount &&
    numericAmount <= WITHDRAWAL_CONFIG.maxAmount &&
    numericAmount <= walletBalance;

  const handleQuickAmount = (value: number) => {
    setAmount(value.toLocaleString());
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned) {
      setAmount(parseInt(cleaned).toLocaleString());
    } else {
      setAmount('');
    }
  };

  const handleContinue = () => {
    if (!selectedAccount) {
      Alert.alert('Select Account', 'Please select a bank account for withdrawal.');
      return;
    }
    if (!isValidAmount) {
      if (numericAmount < WITHDRAWAL_CONFIG.minAmount) {
        Alert.alert('Invalid Amount', `Minimum withdrawal is ₦${WITHDRAWAL_CONFIG.minAmount.toLocaleString()}`);
      } else if (numericAmount > WITHDRAWAL_CONFIG.maxAmount) {
        Alert.alert('Invalid Amount', `Maximum withdrawal is ₦${WITHDRAWAL_CONFIG.maxAmount.toLocaleString()}`);
      } else if (numericAmount > walletBalance) {
        Alert.alert('Insufficient Balance', 'You don\'t have enough balance for this withdrawal.');
      }
      return;
    }
    setShowPinModal(true);
  };

  const handleWithdraw = async () => {
    if (pin.length < 4) return;

    try {
      setIsSubmitting(true);

      const isPinValid = await pinService.verifyPin(pin);
      if (!isPinValid) {
        Alert.alert('Invalid PIN', 'The PIN you entered is incorrect.');
        setPin('');
        setIsSubmitting(false);
        return;
      }

      await withdrawalService.requestWithdrawal({
        amount: numericAmount,
        bankAccountId: selectedAccount!.id,
      });

      setShowPinModal(false);
      setPin('');
      setShowSuccess(true);

      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Screen
  if (showSuccess) {
    return (
      <View style={[styles.successContainer, { backgroundColor: '#16A34A' }]}>
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={[
            styles.successContent,
            {
              opacity: successAnim,
              transform: [
                {
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark" size={50} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Withdrawal Initiated</Text>
          <Text style={styles.successAmount}>₦{(netAmount ?? 0).toLocaleString()}</Text>
          <Text style={styles.successDescription}>
            Your withdrawal is being processed.{'\n'}You'll receive it within 24 hours.
          </Text>
          <View style={styles.successDetails}>
            <Text style={styles.successDetailLabel}>To:</Text>
            <Text style={styles.successDetailValue}>
              {selectedAccount?.bankName} - ****{selectedAccount?.accountNumber.slice(-4)}
            </Text>
          </View>
        </Animated.View>
        <TouchableOpacity
          style={[styles.successButton, { marginBottom: insets.bottom + 20 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.successButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      {/* History Button */}
      <TouchableOpacity
        style={[styles.floatingHistoryButton, { top: insets.top + 10 }, dynamicStyles.card]}
        onPress={() => (navigation as any).navigate('WithdrawalHistory')}
        activeOpacity={0.7}
      >
        <Ionicons name="time-outline" size={22} color={colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderTitle, dynamicStyles.text]}>Withdraw Funds</Text>
          </View>

          {/* Balance Card */}
          <View style={[styles.balanceCard, dynamicStyles.card]}>
            <View style={styles.balanceIconContainer}>
              <WithdrawHeroIllustration width={32} height={32} color="#FFFFFF" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceLabel, dynamicStyles.textSecondary]}>
                Available Balance
              </Text>
              <Text style={[styles.balanceAmount, dynamicStyles.text]}>
                ₦{(walletBalance ?? 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceDecoration}>
              <View style={[styles.decorationCircle, styles.decorationCircle1]} />
              <View style={[styles.decorationCircle, styles.decorationCircle2]} />
            </View>
          </View>

          {/* Bank Account Section */}
          <View style={styles.amountSectionHeader}>
            <Text style={[styles.amountSectionTitle, dynamicStyles.textSecondary]}>
              WITHDRAW TO
            </Text>
          </View>
          <View style={[styles.accountCard, dynamicStyles.card]}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#16A34A" />
              </View>
            ) : bankAccounts.length === 0 ? (
              <TouchableOpacity
                style={styles.addAccountRow}
                onPress={() => (navigation as any).navigate('PaymentMethods')}
              >
                <View style={styles.addAccountIconContainer}>
                  <Ionicons name="add" size={20} color="#16A34A" />
                </View>
                <Text style={styles.addAccountText}>
                  Add Bank Account
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.accountRow}
                onPress={() => setShowAccountPicker(true)}
              >
                <View style={styles.accountIconContainer}>
                  <MaterialCommunityIcons name="bank-outline" size={22} color="#16A34A" />
                </View>
                <View style={styles.accountDetails}>
                  {selectedAccount ? (
                    <>
                      <Text style={[styles.accountBankName, dynamicStyles.text]}>
                        {selectedAccount.bankName}
                      </Text>
                      <Text style={[styles.accountInfo, dynamicStyles.textSecondary]}>
                        {selectedAccount.accountName} • ****{selectedAccount.accountNumber.slice(-4)}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.selectAccountText, dynamicStyles.textSecondary]}>
                      Select bank account
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Amount Section - Floating Label Style */}
          <View style={styles.floatingInputContainer}>
            <View style={styles.floatingInputRow}>
              <View style={styles.floatingInputContent}>
                <Animated.Text style={[{
                  position: 'absolute',
                  left: 0,
                  top: amountAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, -8],
                  }),
                  fontSize: amountAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 12],
                  }),
                  color: amountAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isDark ? '#9CA3AF' : '#6B7280', '#16A34A'],
                  }),
                  backgroundColor: isDark ? colors.background : '#F2F2F7',
                  paddingHorizontal: 4,
                  zIndex: 1,
                  fontFamily: FONTS.regular,
                }]}>
                  Enter amount
                </Animated.Text>
                <RNTextInput
                  style={[styles.floatingInput, dynamicStyles.text]}
                  value={amount}
                  onChangeText={handleAmountChange}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  placeholderTextColor="transparent"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.floatingInputIcons}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={22}
                  color={amountFocused ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
                />
              </View>
            </View>
            <View style={[styles.floatingInputLine, (amountFocused || amount) && styles.floatingInputLineFocused]} />
          </View>

          {/* Quick Amounts */}
          <View style={styles.amountSectionHeader}>
            <Text style={[styles.amountSectionTitle, dynamicStyles.textSecondary]}>
              QUICK SELECT
            </Text>
          </View>
          <View style={[styles.quickAmountsCard, dynamicStyles.card]}>
            <View style={styles.quickAmountsContainer}>
              {QUICK_AMOUNTS.map((value) => {
                const isSelected = numericAmount === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickAmountButton,
                      dynamicStyles.card,
                      isSelected && styles.quickAmountButtonSelected,
                    ]}
                    onPress={() => handleQuickAmount(value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        dynamicStyles.text,
                        isSelected && styles.quickAmountTextSelected,
                      ]}
                    >
                      ₦{(value ?? 0).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Summary Section */}
          {numericAmount > 0 && (
            <>
              <View style={styles.amountSectionHeader}>
                <Text style={[styles.amountSectionTitle, dynamicStyles.textSecondary]}>
                  SUMMARY
                </Text>
              </View>
              <View style={[styles.summaryCard, dynamicStyles.card]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>
                    Amount
                  </Text>
                  <Text style={[styles.summaryValue, dynamicStyles.text]}>
                    ₦{(numericAmount ?? 0).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, dynamicStyles.textSecondary]}>
                    Fee
                  </Text>
                  <Text style={[
                    styles.summaryValue,
                    withdrawalFee === 0 && styles.freeText
                  ]}>
                    {withdrawalFee === 0 ? 'Free' : `₦${withdrawalFee}`}
                  </Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.netLabel, dynamicStyles.text]}>
                    You'll Receive
                  </Text>
                  <Text style={styles.netValue}>
                    ₦{(netAmount ?? 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Limits Info */}
          <View style={[styles.infoCard, dynamicStyles.card]}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={20} color="#5856D6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, dynamicStyles.text]}>Withdrawal Limits</Text>
              <Text style={[styles.infoText, dynamicStyles.textSecondary]}>
                Min: ₦{WITHDRAWAL_CONFIG.minAmount.toLocaleString()} • Max: ₦{WITHDRAWAL_CONFIG.maxAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.ScrollView>

        {/* Continue Button */}
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!isValidAmount || !selectedAccount) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isValidAmount || !selectedAccount}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Account Picker Modal - Full Page */}
      <Modal
        visible={showAccountPicker}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 16, 
            paddingTop: insets.top + 16, 
            paddingBottom: 16, 
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}>
            <TouchableOpacity
              onPress={() => setShowAccountPicker(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ 
              flex: 1, 
              textAlign: 'center', 
              fontSize: 18, 
              fontWeight: '600', 
              color: colors.text,
              marginRight: 40,
            }}>
              Select Account
            </Text>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            {bankAccounts.map((account, index) => (
              <React.Fragment key={account.id}>
                <TouchableOpacity
                  style={[
                    styles.accountOption,
                    selectedAccount?.id === account.id && styles.accountOptionSelected,
                    { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' },
                  ]}
                  onPress={() => {
                    setSelectedAccount(account);
                    setShowAccountPicker(false);
                  }}
                >
                  <View style={styles.accountOptionIcon}>
                    <MaterialCommunityIcons name="bank-outline" size={22} color="#16A34A" />
                  </View>
                  <View style={styles.accountOptionDetails}>
                    <Text style={[styles.accountOptionBank, dynamicStyles.text]}>
                      {account.bankName}
                    </Text>
                    <Text style={[styles.accountOptionInfo, dynamicStyles.textSecondary]}>
                      {account.accountName} • ****{account.accountNumber.slice(-4)}
                    </Text>
                  </View>
                  {selectedAccount?.id === account.id && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
                {index < bankAccounts.length - 1 && (
                  <View style={[styles.optionSeparator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                )}
              </React.Fragment>
            ))}
          </ScrollView>

          <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>
            <TouchableOpacity
              style={styles.addAccountButtonModal}
              onPress={() => {
                setShowAccountPicker(false);
                (navigation as any).navigate('PaymentMethods');
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#16A34A" />
              <Text style={styles.addAccountButtonModalText}>Add New Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPinModal(false);
          setPin('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.pinOverlay}
        >
          <View style={[
            styles.pinContent,
            dynamicStyles.card,
            { paddingBottom: insets.bottom + 24 }
          ]}>
            <View style={styles.pinHeader}>
              <TouchableOpacity onPress={() => {
                setShowPinModal(false);
                setPin('');
              }}>
                <Text style={styles.pinCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.pinTitle, dynamicStyles.text]}>Enter PIN</Text>
              <View style={{ width: 60 }} />
            </View>

            <Text style={[styles.pinDescription, dynamicStyles.textSecondary]}>
              Enter your 4-digit PIN to confirm withdrawal
            </Text>

            <View style={styles.pinInputContainer}>
              <RNTextInput
                style={[styles.pinInput, dynamicStyles.text]}
                value={pin}
                onChangeText={(text: string) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                autoFocus
                placeholder="••••"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.pinSummary, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
              <View style={styles.pinSummaryRow}>
                <Text style={[styles.pinSummaryLabel, dynamicStyles.textSecondary]}>To</Text>
                <Text style={[styles.pinSummaryValue, dynamicStyles.text]}>
                  {selectedAccount?.bankName} - ****{selectedAccount?.accountNumber.slice(-4)}
                </Text>
              </View>
              <View style={styles.pinSummaryRow}>
                <Text style={[styles.pinSummaryLabel, dynamicStyles.textSecondary]}>Amount</Text>
                <Text style={[styles.pinSummaryValue, dynamicStyles.text]}>
                  ₦{(numericAmount ?? 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.pinSummaryRow}>
                <Text style={[styles.pinSummaryLabel, dynamicStyles.textSecondary]}>Fee</Text>
                <Text style={[styles.pinSummaryValue, withdrawalFee === 0 && styles.freeText]}>
                  {withdrawalFee === 0 ? 'Free' : `₦${withdrawalFee}`}
                </Text>
              </View>
              <View style={styles.pinSummaryRow}>
                <Text style={[styles.pinSummaryLabelBold, dynamicStyles.text]}>You'll Receive</Text>
                <Text style={styles.pinSummaryValueBold}>
                  ₦{(netAmount ?? 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (pin.length < 4 || isSubmitting) && styles.buttonDisabled,
              ]}
              onPress={handleWithdraw}
              disabled={pin.length < 4 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Withdrawal</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  floatingHistoryButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
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
    backgroundColor: '#FF9500',
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
    backgroundColor: '#FF9500',
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
  accountCard: {
    borderRadius: 16,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  addAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  addAccountIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addAccountText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  accountIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  accountDetails: {
    flex: 1,
  },
  accountBankName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  accountInfo: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  selectAccountText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
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
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
  },
  floatingInputLineFocused: {
    height: 2,
    backgroundColor: '#16A34A',
  },
  quickAmountsCard: {
    borderRadius: 16,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickAmountButton: {
    width: '31%',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickAmountButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  quickAmountText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  quickAmountTextSelected: {
    color: '#16A34A',
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
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
  freeText: {
    color: '#16A34A',
    fontWeight: '600',
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  netValue: {
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
    marginTop: SPACING.sm,
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
    backgroundColor: '#EDE9FE',
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
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: SPACING.md,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    fontFamily: FONTS.semiBold,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountList: {
    paddingHorizontal: 16,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  accountOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  accountOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  accountOptionDetails: {
    flex: 1,
  },
  accountOptionBank: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  accountOptionInfo: {
    fontSize: 14,
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
  optionSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  addAccountButtonModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60, 60, 67, 0.12)',
    gap: 8,
  },
  addAccountButtonModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  pinOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  pinContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pinCancel: {
    fontSize: 17,
    color: '#16A34A',
    fontFamily: FONTS.regular,
  },
  pinTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  pinDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: FONTS.regular,
  },
  pinInputContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinInput: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 16,
    textAlign: 'center',
    width: 180,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#16A34A',
    fontFamily: FONTS.bold,
  },
  pinSummary: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  pinSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  pinSummaryLabel: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  pinSummaryValue: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  pinSummaryLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  pinSummaryValueBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
    fontFamily: FONTS.bold,
  },
  confirmButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: FONTS.bold,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  successAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    fontFamily: FONTS.bold,
  },
  successDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  successDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  successDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  successDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: FONTS.semiBold,
  },
  successButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  successButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: FONTS.bold,
  },
});
