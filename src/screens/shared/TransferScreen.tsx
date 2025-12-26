import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { walletService } from '../../services/walletService';
import apiClient from '../../services/apiClient';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { triggerHaptic } from '../../utils/haptics';
import { formatCurrency, formatCurrencyFull } from '../../utils/formatters';

interface RecentRecipient {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastTransfer?: string;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export default function TransferScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedRecipient, setVerifiedRecipient] = useState<RecentRecipient | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    
    loadRecentRecipients();
  }, []);

  // Refresh balance whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWalletBalance();
    }, [])
  );

  useEffect(() => {
    if (recipient.length === 11) {
      verifyRecipient();
    } else {
      setVerifiedRecipient(null);
    }
  }, [recipient]);

  const loadRecentRecipients = async () => {
    try {
      const response = await apiClient.get<{ id: string; name: string; phone: string; avatar?: string; lastTransfer: string }[]>('/wallet/recent-recipients');
      const recipients = (response as any)?.data || response;
      if (Array.isArray(recipients)) {
        setRecentRecipients(recipients);
      }
    } catch (error) {
      console.error('Error loading recent recipients:', error);
      // Keep the list empty if there's an error
    }
  };

  const loadWalletBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const balance = await walletService.getBalance();
      const availableBalance = (balance as any)?.available ?? (balance as any)?.balance ?? 0;
      setWalletBalance(typeof availableBalance === 'string' ? parseFloat(availableBalance) : availableBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const verifyRecipient = async () => {
    setIsVerifying(true);
    triggerHaptic('light');
    
    try {
      // Call API to look up user by phone
      const response = await apiClient.post<{ success: boolean; data: { found: boolean; user: { id: string; name: string; phone: string; avatar?: string } | null } }>('/users/lookup/phone', {
        phone: recipient,
      });
      
      console.log('Phone lookup response:', JSON.stringify(response, null, 2));
      
      // Backend wraps response in { success, data }
      const result = (response as any).data || response;
      
      console.log('Extracted result:', JSON.stringify(result, null, 2));
      
      if (result.found && result.user) {
        console.log('Setting verified recipient:', result.user.name);
        setVerifiedRecipient({
          id: result.user.id,
          name: result.user.name,
          phone: result.user.phone,
          avatar: result.user.avatar,
        });
        triggerHaptic('success');
      } else {
        setVerifiedRecipient(null);
        Alert.alert('User Not Found', 'No Handwork user found with this phone number. Please check and try again.');
        triggerHaptic('error');
      }
    } catch (error: any) {
      console.error('Error verifying recipient:', error);
      setVerifiedRecipient(null);
      Alert.alert('Error', 'Could not verify recipient. Please try again.');
      triggerHaptic('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const transferFee = 0; // Free transfers within the app
  const totalAmount = numericAmount + transferFee;

  const handleQuickAmount = (value: number) => {
    triggerHaptic('light');
    setAmount(value.toLocaleString());
  };

  const handleTransfer = () => {
    triggerHaptic('medium');
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

  const confirmTransfer = async (enteredPin?: string) => {
    setIsLoading(true);
    setShowPinModal(false);

    try {
      // Call actual transfer API - backend debits wallet before confirming
      // Backend validates PIN if user has PIN enabled
      const result = await walletService.transfer({
        amount: numericAmount,
        recipientPhone: verifiedRecipient!.phone,
        pin: enteredPin,
      });
      
      // Backend returns the transaction if successful (no status field, success = no error)
      // Show success modal with animation
      setTransferReference(result.reference || `TRF_${Date.now()}`);
      setShowSuccessModal(true);
      Animated.spring(successScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
      triggerHaptic('success');
      
      // Refresh wallet balance and recent recipients
      loadWalletBalance();
      loadRecentRecipients();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Transfer Failed', errorMessage);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const selectRecipient = (r: RecentRecipient) => {
    triggerHaptic('light');
    setRecipient(r.phone);
    setVerifiedRecipient(r);
  };

  const filteredRecipients = recentRecipients.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const index = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={() => {
            triggerHaptic('light');
            navigation.goBack();
          }}
        >
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
          {/* Hero Balance Card */}
          <Animated.View
            style={[
              styles.heroCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={isDark ? ['#1B5E20', '#2E7D32'] : ['#43A047', '#66BB6A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIconContainer}>
                  <MaterialCommunityIcons name="wallet-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroLabel}>Available Balance</Text>
                  {isLoadingBalance ? (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginTop: 4 }} />
                  ) : (
                    <Text style={styles.heroAmount}>{formatCurrencyFull(walletBalance)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.heroDecoration}>
                <View style={[styles.heroCircle, styles.heroCircle1]} />
                <View style={[styles.heroCircle, styles.heroCircle2]} />
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Amount Input Section */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ENTER AMOUNT</Text>
            <View style={[styles.amountCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.currencySymbol, { color: colors.primary }]}>₦</Text>
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
              
              {/* Quick Amount Chips */}
              <View style={styles.quickAmountsContainer}>
                {QUICK_AMOUNTS.map((value) => {
                  const isSelected = numericAmount === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.quickAmountChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                            ? 'rgba(255,255,255,0.1)'
                            : '#F5F5F5',
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
                        {value >= 1000 ? `₦${value / 1000}k` : `₦${value}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          {/* Recipient Section */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SEND TO</Text>
          <View style={[styles.recipientCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Phone Input */}
            <View style={[styles.phoneInputContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5' }]}>
              <View style={[styles.phoneInputIcon, { backgroundColor: isDark ? 'rgba(67,160,71,0.2)' : '#E8F5E9' }]}>
                <Ionicons name="call" size={20} color="#43A047" />
              </View>
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                value={recipient}
                onChangeText={(text) => setRecipient(text.replace(/[^0-9]/g, '').slice(0, 11))}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {isVerifying && <ActivityIndicator size="small" color="#43A047" />}
              {verifiedRecipient && !isVerifying && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Verified Recipient Display */}
            {verifiedRecipient && (
              <View style={styles.verifiedRecipientContainer}>
                <View style={[styles.recipientAvatar, { backgroundColor: getAvatarColor(verifiedRecipient.name) }]}>
                  <Text style={styles.recipientAvatarText}>{getInitials(verifiedRecipient.name)}</Text>
                </View>
                <View style={styles.recipientDetails}>
                  <Text style={[styles.recipientName, { color: colors.text }]}>{verifiedRecipient.name}</Text>
                  <Text style={[styles.recipientPhone, { color: colors.textSecondary }]}>
                    Handwork User • {verifiedRecipient.phone}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.clearRecipientButton}
                  onPress={() => {
                    setRecipient('');
                    setVerifiedRecipient(null);
                  }}
                >
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recent Recipients */}
          {!verifiedRecipient && recentRecipients.length > 0 && (
            <>
              <View style={styles.recentHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>RECENT</Text>
              </View>
              <View style={[styles.recentCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                {/* Search Input */}
                <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F5F5F5' }]}>
                  <Ionicons name="search" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search contacts..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {filteredRecipients.map((r, index) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.recentRecipientItem,
                      index < filteredRecipients.length - 1 && styles.recentRecipientItemBorder,
                    ]}
                    onPress={() => selectRecipient(r)}
                  >
                    <View style={[styles.recipientAvatar, { backgroundColor: getAvatarColor(r.name) }]}>
                      <Text style={styles.recipientAvatarText}>{getInitials(r.name)}</Text>
                    </View>
                    <View style={styles.recipientDetails}>
                      <Text style={[styles.recipientName, { color: colors.text }]}>{r.name}</Text>
                      <Text style={[styles.recipientMeta, { color: colors.textSecondary }]}>
                        {r.phone} • {r.lastTransfer}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Note Input */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ADD NOTE (OPTIONAL)</Text>
          <View style={[styles.noteCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <TextInput
              style={[styles.noteInput, { color: colors.text }]}
              placeholder="What's this for?"
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Summary Card */}
          {numericAmount > 0 && verifiedRecipient && (
            <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Transfer Amount</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(numericAmount)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Transfer Fee</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabelBold, { color: colors.text }]}>Total</Text>
                <Text style={[styles.summaryValueBold, { color: colors.text }]}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>
          )}
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
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !verifiedRecipient || numericAmount < 100
                  ? ['#C8E6C9', '#C8E6C9']
                  : ['#43A047', '#2E7D32']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.transferButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.transferButtonText}>
                    Send {numericAmount > 0 ? formatCurrency(numericAmount) : 'Money'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={14} color={colors.textSecondary} />
            <Text style={[styles.securityNoteText, { color: colors.textSecondary }]}>
              Instant & secure transfers
            </Text>
          </View>
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
                              // Let backend verify PIN
                              setShowPinModal(false);
                              setPin(['', '', '', '']);
                              confirmTransfer(enteredPin);
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

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <Animated.View 
            style={[
              styles.successModalContent, 
              { 
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                transform: [{ scale: successScaleAnim }],
              }
            ]}
          >
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={['#43A047', '#2E7D32']}
                style={styles.successIconGradient}
              >
                <Ionicons name="checkmark" size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Success Message */}
            <Text style={[styles.successTitle, { color: colors.text }]}>Transfer Successful!</Text>
            <Text style={[styles.successAmount, { color: colors.primary }]}>
              {formatCurrency(numericAmount)}
            </Text>
            <Text style={[styles.successRecipient, { color: colors.textSecondary }]}>
              sent to {verifiedRecipient?.name}
            </Text>

            {/* Transaction Reference */}
            <View style={[styles.referenceContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
              <Text style={[styles.referenceLabel, { color: colors.textSecondary }]}>Reference</Text>
              <Text style={[styles.referenceValue, { color: colors.text }]}>{transferReference}</Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#43A047', '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successButtonGradient}
              >
                <Text style={styles.successButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newTransferButton}
              onPress={() => {
                setShowSuccessModal(false);
                setAmount('');
                setRecipient('');
                setVerifiedRecipient(null);
                setNote('');
                successScaleAnim.setValue(0);
              }}
            >
              <Text style={[styles.newTransferText, { color: colors.primary }]}>Make Another Transfer</Text>
            </TouchableOpacity>
          </Animated.View>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  transferButtonDisabled: {
    opacity: 1,
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
  // Hero Card Styles
  heroCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#43A047',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroGradient: {
    padding: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroCircle1: {
    width: 100,
    height: 100,
    right: 0,
    top: 0,
  },
  heroCircle2: {
    width: 60,
    height: 60,
    right: 60,
    top: 60,
  },
  // Header Title
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Quick Amount Chip Styles
  quickAmountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Phone Input Icon
  phoneInputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Verified Badge
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#43A047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Verified Recipient Container
  verifiedRecipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 160, 71, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(67, 160, 71, 0.2)',
  },
  // Recipient Details
  recipientDetails: {
    flex: 1,
  },
  // Clear Recipient Button
  clearRecipientButton: {
    padding: 4,
  },
  // Recent Header
  recentHeader: {
    marginBottom: 8,
  },
  // Recent Card
  recentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  // Search Input
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  // Recent Recipient Item Border
  recentRecipientItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  // Recipient Meta
  recipientMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  // Amount Card Styles
  amountCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  amountTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currencyLarge: {
    fontSize: 36,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInputLarge: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    padding: 0,
  },
  quickAmountChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAmountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  quickAmountChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Recipient Card Styles
  recipientCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recipientHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recipientTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  verifiedRecipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(67, 160, 71, 0.08)',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(67, 160, 71, 0.2)',
  },
  verifiedAvatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#43A047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  recentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  searchButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#43A047',
  },
  recentRecipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  recentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentRecipientInfo: {
    flex: 1,
  },
  recentRecipientName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentRecipientPhone: {
    fontSize: 13,
  },
  // Note Card Styles
  noteCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  // Summary Card Styles
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 8,
  },
  freeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  // Transfer Button Styles
  transferButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  securityNoteText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  successRecipient: {
    fontSize: 15,
    marginBottom: 20,
  },
  referenceContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  referenceValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  successButton: {
    width: '100%',
    marginBottom: 12,
  },
  successButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  newTransferButton: {
    paddingVertical: 12,
  },
  newTransferText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
