import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { walletService } from '../../services/walletService';

interface RecentRecipient {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function TransferScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedRecipient, setVerifiedRecipient] = useState<RecentRecipient | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([
    { id: '1', name: 'John Doe', phone: '08012345678' },
    { id: '2', name: 'Jane Smith', phone: '08098765432' },
    { id: '3', name: 'Mike Johnson', phone: '07011223344' },
  ]);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  useEffect(() => {
    if (recipient.length === 11) {
      verifyRecipient();
    } else {
      setVerifiedRecipient(null);
    }
  }, [recipient]);

  const loadWalletBalance = async () => {
    try {
      const balance = await walletService.getBalance();
      setWalletBalance(balance.available);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const verifyRecipient = async () => {
    setIsVerifying(true);
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Check if it's a known recipient
    const known = recentRecipients.find((r) => r.phone === recipient);
    if (known) {
      setVerifiedRecipient(known);
    } else {
      // Simulate finding a new user
      setVerifiedRecipient({
        id: 'new',
        name: 'New User',
        phone: recipient,
      });
    }
    setIsVerifying(false);
  };

  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const transferFee = 0; // Free transfers within the app
  const totalAmount = numericAmount + transferFee;

  const handleQuickAmount = (value: number) => {
    setAmount(value.toLocaleString());
  };

  const handleTransfer = () => {
    if (!verifiedRecipient) {
      Alert.alert('Error', 'Please enter a valid recipient phone number');
      return;
    }

    if (numericAmount < 100) {
      Alert.alert('Error', 'Minimum transfer amount is ₦100');
      return;
    }

    if (numericAmount > walletBalance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds for this transfer');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmTransfer = async () => {
    setIsLoading(true);
    setShowConfirmModal(false);

    try {
      // Call actual transfer API - backend debits wallet before confirming
      const result = await walletService.transfer({
        amount: numericAmount,
        recipientPhone: verifiedRecipient!.phone,
      });
      
      if (result.status === 'completed') {
        Alert.alert(
          'Transfer Successful',
          `₦${numericAmount.toLocaleString()} has been sent to ${verifiedRecipient?.name}\n\nReference: ${result.reference}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Transfer Pending', 'Your transfer is being processed. You will be notified once completed.');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Transfer Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectRecipient = (r: RecentRecipient) => {
    setRecipient(r.phone);
    setVerifiedRecipient(r);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transfer</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
            <View style={styles.balanceCentered}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Balance</Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>₦{walletBalance.toLocaleString()}</Text>
            </View>
          </View>

          {/* Recipient Input */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECIPIENT</Text>
          <View style={[styles.insetGroupedContainer, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="person" size={20} color="#43A047" />
              </View>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                value={recipient}
                onChangeText={(text) => setRecipient(text.replace(/[^0-9]/g, '').slice(0, 11))}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {isVerifying && <ActivityIndicator size="small" color="#43A047" />}
              {verifiedRecipient && !isVerifying && (
                <Ionicons name="checkmark-circle" size={22} color="#43A047" />
              )}
            </View>
            {verifiedRecipient && (
              <>
                <View style={[styles.separator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                <View style={styles.verifiedRow}>
                  <View style={styles.verifiedAvatar}>
                    <Text style={styles.verifiedAvatarText}>
                      {verifiedRecipient.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.verifiedName, { color: colors.text }]}>{verifiedRecipient.name}</Text>
                </View>
              </>
            )}
          </View>

          {/* Recent Recipients */}
          {recentRecipients.length > 0 && !verifiedRecipient && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT</Text>
              <View style={[styles.insetGroupedContainer, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
                {recentRecipients.map((r, index) => (
                  <React.Fragment key={r.id}>
                    <TouchableOpacity style={styles.recipientRow} onPress={() => selectRecipient(r)}>
                      <View style={styles.recipientAvatar}>
                        <Text style={styles.recipientAvatarText}>{r.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.recipientInfo}>
                        <Text style={[styles.recipientName, { color: colors.text }]}>{r.name}</Text>
                        <Text style={[styles.recipientPhone, { color: colors.textSecondary }]}>{r.phone}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {index < recentRecipients.length - 1 && (
                      <View style={[styles.separator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </>
          )}

          {/* Amount Input */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AMOUNT</Text>
          <View style={[styles.insetGroupedContainer, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>₦</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, '');
                  setAmount(numeric ? parseInt(numeric, 10).toLocaleString() : '');
                }}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Quick Amounts */}
          <View style={[styles.insetGroupedContainer, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
            <View style={styles.quickAmountsContainer}>
              {QUICK_AMOUNTS.map((value) => {
                const isSelected = numericAmount === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickAmountButton,
                      {
                        backgroundColor: isSelected ? colors.primary : (isDark ? colors.background : '#F8F8F8'),
                        borderColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => handleQuickAmount(value)}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      ₦{value.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Note (Optional) */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTE (OPTIONAL)</Text>
          <View style={[styles.insetGroupedContainer, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
            <TextInput
              style={[styles.noteInput, { color: colors.text }]}
              placeholder="Add a note..."
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Transfer Info */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUMMARY</Text>
          <View style={[styles.insetGroupedContainer, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Transfer Amount</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>₦{numericAmount.toLocaleString()}</Text>
            </View>
            <View style={[styles.separator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Fee</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>Free</Text>
            </View>
            <View style={[styles.separator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabelBold, { color: colors.text }]}>Total</Text>
              <Text style={[styles.summaryValueBold, { color: colors.text }]}>₦{totalAmount.toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Transfer Button */}
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.transferButton,
              (!verifiedRecipient || numericAmount < 100) && styles.transferButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={!verifiedRecipient || numericAmount < 100 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.transferButtonText}>Transfer ₦{numericAmount.toLocaleString()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalCancelLink}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Transfer</Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Recipient Info */}
            <View style={[styles.modalRecipientCard, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
              <View style={styles.modalRecipientAvatar}>
                <Text style={styles.modalRecipientAvatarText}>
                  {verifiedRecipient?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.modalRecipientName, { color: colors.text }]}>{verifiedRecipient?.name}</Text>
              <Text style={[styles.modalRecipientPhone, { color: colors.textSecondary }]}>{verifiedRecipient?.phone}</Text>
            </View>

            {/* Amount Display */}
            <View style={styles.modalAmountContainer}>
              <Text style={[styles.modalAmountLabel, { color: colors.textSecondary }]}>Amount</Text>
              <Text style={[styles.modalAmount, { color: colors.text }]}>₦{numericAmount.toLocaleString()}</Text>
            </View>

            {/* Transfer Details */}
            <View style={[styles.modalDetailsCard, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
              <View style={styles.modalDetailRow}>
                <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>Transfer Fee</Text>
                <Text style={[styles.modalDetailValue, { color: '#10B981' }]}>Free</Text>
              </View>
              <View style={[styles.modalDetailSeparator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
              <View style={styles.modalDetailRow}>
                <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>Total Debit</Text>
                <Text style={[styles.modalDetailValue, { color: colors.text }]}>₦{numericAmount.toLocaleString()}</Text>
              </View>
              {note && (
                <>
                  <View style={[styles.modalDetailSeparator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                  <View style={styles.modalDetailRow}>
                    <Text style={[styles.modalDetailLabel, { color: colors.textSecondary }]}>Note</Text>
                    <Text style={[styles.modalDetailValue, { color: colors.text }]} numberOfLines={1}>{note}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => {
                setShowConfirmModal(false);
                setShowPinModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmText}>Continue</Text>
            </TouchableOpacity>

            {/* Security Note */}
            <View style={styles.modalSecurityNote}>
              <Ionicons name="shield-checkmark" size={14} color={colors.textSecondary} />
              <Text style={[styles.modalSecurityText, { color: colors.textSecondary }]}>
                Transfers are instant and secure
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.pinModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowPinModal(false);
                setPin(['', '', '', '']);
                setPinError('');
              }}>
                <Text style={styles.modalCancelLink}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Enter PIN</Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Lock Icon */}
            <View style={styles.pinIconContainer}>
              <Ionicons name="lock-closed" size={32} color="#43A047" />
            </View>

            {/* PIN Description */}
            <Text style={[styles.pinDescription, { color: colors.textSecondary }]}>
              Enter your 4-digit PIN to confirm this transfer
            </Text>

            {/* Amount Preview */}
            <Text style={[styles.pinAmount, { color: colors.text }]}>₦{numericAmount.toLocaleString()}</Text>
            <Text style={[styles.pinRecipient, { color: colors.textSecondary }]}>to {verifiedRecipient?.name}</Text>

            {/* PIN Input Dots */}
            <View style={styles.pinDotsContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    {
                      backgroundColor: pin[index]
                        ? '#43A047'
                        : isDark ? colors.background : '#E5E7EB',
                      borderColor: pinError ? '#EF4444' : 'transparent',
                    },
                  ]}
                />
              ))}
            </View>

            {/* Error Message */}
            {pinError ? (
              <Text style={styles.pinErrorText}>{pinError}</Text>
            ) : null}

            {/* PIN Keypad */}
            <View style={styles.pinKeypad}>
              {[[1, 2, 3], [4, 5, 6], [7, 8, 9], ['', 0, 'delete']].map((row, rowIndex) => (
                <View key={rowIndex} style={styles.pinKeypadRow}>
                  {row.map((key, keyIndex) => (
                    <TouchableOpacity
                      key={keyIndex}
                      style={[
                        styles.pinKey,
                        key === '' && styles.pinKeyEmpty,
                        { backgroundColor: key !== '' && key !== 'delete' ? (isDark ? colors.background : '#F2F2F7') : 'transparent' },
                      ]}
                      onPress={() => {
                        if (key === 'delete') {
                          const newPin = [...pin];
                          const lastFilledIndex = newPin.findLastIndex(p => p !== '');
                          if (lastFilledIndex >= 0) {
                            newPin[lastFilledIndex] = '';
                            setPin(newPin);
                            setPinError('');
                          }
                        } else if (key !== '') {
                          const newPin = [...pin];
                          const firstEmptyIndex = newPin.findIndex(p => p === '');
                          if (firstEmptyIndex >= 0) {
                            newPin[firstEmptyIndex] = String(key);
                            setPin(newPin);
                            setPinError('');

                            // Check if PIN is complete
                            if (firstEmptyIndex === 3) {
                              const enteredPin = newPin.join('');
                              // Validate PIN (for demo, using 1234)
                              if (enteredPin === '1234') {
                                setShowPinModal(false);
                                setPin(['', '', '', '']);
                                confirmTransfer();
                              } else {
                                setPinError('Incorrect PIN. Please try again.');
                                setTimeout(() => setPin(['', '', '', '']), 500);
                              }
                            }
                          }
                        }
                      }}
                      disabled={key === ''}
                      activeOpacity={0.7}
                    >
                      {key === 'delete' ? (
                        <Ionicons name="backspace-outline" size={24} color={colors.text} />
                      ) : key !== '' ? (
                        <Text style={[styles.pinKeyText, { color: colors.text }]}>{key}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            {/* Forgot PIN */}
            <TouchableOpacity 
              style={styles.forgotPinButton}
              onPress={() => {
                setShowPinModal(false);
                setPin(['', '', '', '']);
                setPinError('');
                (navigation as any).navigate('Security', { showChangePin: true });
              }}
            >
              <Text style={styles.forgotPinText}>Forgot PIN?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  balanceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  balanceCentered: {
    alignItems: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(67, 160, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  insetGroupedContainer: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(67, 160, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  verifiedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#43A047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  verifiedName: {
    fontSize: 16,
    fontWeight: '600',
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43A047',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '600',
  },
  recipientPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  quickAmountButton: {
    width: '31%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteInput: {
    fontSize: 16,
    padding: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValueBold: {
    fontSize: 18,
    fontWeight: '700',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  transferButton: {
    backgroundColor: '#43A047',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  transferButtonDisabled: {
    backgroundColor: '#C8E6C9',
  },
  transferButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
    marginBottom: 20,
  },
  modalCancelLink: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalRecipientCard: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalRecipientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#43A047',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalRecipientAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  modalRecipientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalRecipientPhone: {
    fontSize: 14,
  },
  modalAmountContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAmountLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  modalAmount: {
    fontSize: 36,
    fontWeight: '800',
  },
  modalDetailsCard: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalDetailLabel: {
    fontSize: 15,
  },
  modalDetailValue: {
    fontSize: 15,
    fontWeight: '500',
    maxWidth: '50%',
  },
  modalDetailSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  modalConfirmButton: {
    backgroundColor: '#43A047',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalConfirmText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  modalSecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalSecurityText: {
    fontSize: 13,
  },
  // PIN Modal Styles
  pinModalContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  pinIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(67, 160, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  pinDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  pinAmount: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  pinRecipient: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  pinErrorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  pinKeypad: {
    gap: 12,
    marginTop: 16,
  },
  pinKeypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  pinKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyEmpty: {
    backgroundColor: 'transparent',
  },
  pinKeyText: {
    fontSize: 28,
    fontWeight: '500',
  },
  forgotPinButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
  forgotPinText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
});
