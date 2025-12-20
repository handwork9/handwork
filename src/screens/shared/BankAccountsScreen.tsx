import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { withdrawalService, WITHDRAWAL_CONFIG, BankAccount } from '../../services/withdrawalService';
import { paymentService } from '../../services/paymentService';

interface Bank {
  name: string;
  code: string;
}

export default function BankAccountsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [verifiedAccountName, setVerifiedAccountName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    loadBankAccounts();
    loadBanks();
  }, []);

  // Debounce timer ref
  const verifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (verifyTimeoutRef.current) {
      clearTimeout(verifyTimeoutRef.current);
    }

    if (accountNumber.length === 10 && selectedBank) {
      // Debounce verification by 500ms to avoid rate limiting
      verifyTimeoutRef.current = setTimeout(() => {
        verifyAccount();
      }, 500);
    } else {
      setVerifiedAccountName('');
    }

    // Cleanup on unmount
    return () => {
      if (verifyTimeoutRef.current) {
        clearTimeout(verifyTimeoutRef.current);
      }
    };
  }, [accountNumber, selectedBank]);

  const loadBankAccounts = async () => {
    try {
      setIsLoading(true);
      const accounts = await withdrawalService.getBankAccounts();
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      setIsLoadingBanks(true);
      const fetchedBanks = await paymentService.getBanks();
      setBanks(fetchedBanks);
    } catch (error) {
      console.error('Error loading banks:', error);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;

    try {
      setIsVerifying(true);
      const result = await withdrawalService.verifyAccount({
        bankCode: selectedBank.code,
        accountNumber,
      });
      setVerifiedAccountName(result.accountName);
    } catch (error) {
      setVerifiedAccountName('');
      Alert.alert('Verification Failed', 'Could not verify account. Please check the details.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddAccount = async () => {
    if (!selectedBank || !accountNumber || !verifiedAccountName) {
      Alert.alert('Error', 'Please complete account verification first');
      return;
    }

    try {
      setIsSubmitting(true);
      await withdrawalService.addBankAccount({
        bankCode: selectedBank.code,
        accountNumber,
        accountName: verifiedAccountName,
        setAsDefault: bankAccounts.length === 0,
      });

      await loadBankAccounts();

      setShowAddModal(false);
      setSelectedBank(null);
      setAccountNumber('');
      setVerifiedAccountName('');

      Alert.alert('Success', 'Bank account added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add bank account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      await withdrawalService.setDefaultAccount(accountId);
      await loadBankAccounts();
    } catch (error) {
      Alert.alert('Error', 'Failed to set default account');
    }
  };

  const handleDeleteAccount = async (account: BankAccount) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to remove ${account.bankName} - ****${account.accountNumber.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await withdrawalService.deleteBankAccount(account.id);
              await loadBankAccounts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBankAccount = (account: BankAccount, index: number) => {
    const isLast = index === bankAccounts.length - 1;

    return (
      <View key={account.id}>
        <TouchableOpacity
          style={styles.accountRow}
          onPress={() => (navigation as any).navigate('Withdraw', { bankAccountId: account.id })}
          activeOpacity={0.7}
        >
          <View style={styles.accountIconContainer}>
            <MaterialCommunityIcons name="bank-outline" size={22} color="#16A34A" />
          </View>

          <View style={styles.accountInfo}>
            <View style={styles.accountHeader}>
              <Text style={[styles.bankName, dynamicStyles.text]}>{account.bankName}</Text>
              {account.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={[styles.accountNumber, dynamicStyles.textSecondary]}>
              ****{account.accountNumber.slice(-4)}
            </Text>
            <Text style={[styles.accountName, dynamicStyles.textSecondary]}>
              {account.accountName}
            </Text>
          </View>

          {account.isVerified && (
            <MaterialCommunityIcons name="check-decagram" size={20} color="#16A34A" />
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.accountActions, { borderTopColor: 'rgba(60, 60, 67, 0.12)' }]}>
          {!account.isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(account.id)}
            >
              <MaterialCommunityIcons name="star-outline" size={16} color="#16A34A" />
              <Text style={[styles.actionButtonText, { color: '#16A34A' }]}>Set Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAccount(account)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Remove</Text>
          </TouchableOpacity>
        </View>

        {!isLast && <View style={styles.accountSeparator} />}
      </View>
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Bank Accounts</Text>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, dynamicStyles.card]}>
          <View style={styles.infoIconContainer}>
            <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#16A34A" />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, dynamicStyles.text]}>Secure Withdrawals</Text>
            <Text style={[styles.infoDescription, dynamicStyles.textSecondary]}>
              Your bank details are encrypted and secure. Withdrawals are processed within 24 hours.
            </Text>
          </View>
        </View>

        {/* Bank Accounts List */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>YOUR ACCOUNTS</Text>
        </View>
        <View style={[styles.accountsCard, dynamicStyles.card]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#16A34A" />
              <Text style={[styles.loadingText, dynamicStyles.textSecondary]}>Loading accounts...</Text>
            </View>
          ) : bankAccounts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                <MaterialCommunityIcons name="credit-card-outline" size={40} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, dynamicStyles.text]}>No Bank Accounts</Text>
              <Text style={[styles.emptyDescription, dynamicStyles.textSecondary]}>
                Add a bank account to withdraw your earnings
              </Text>
            </View>
          ) : (
            bankAccounts.map(renderBankAccount)
          )}
        </View>

        {/* Withdrawal Info */}
        <View style={styles.sectionSubHeader}>
          <Text style={[styles.sectionSubHeaderTitle, dynamicStyles.textSecondary]}>WITHDRAWAL INFO</Text>
        </View>
        <View style={[styles.withdrawalInfoCard, dynamicStyles.card]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.textSecondary]}>Minimum Withdrawal</Text>
            <Text style={[styles.infoValue, dynamicStyles.text]}>₦{WITHDRAWAL_CONFIG.minAmount.toLocaleString()}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.textSecondary]}>Maximum Withdrawal</Text>
            <Text style={[styles.infoValue, dynamicStyles.text]}>₦{WITHDRAWAL_CONFIG.maxAmount.toLocaleString()}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.textSecondary]}>Processing Fee</Text>
            <Text style={[styles.infoValue, dynamicStyles.text]}>₦{WITHDRAWAL_CONFIG.processingFee.flat}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, dynamicStyles.textSecondary]}>Processing Time</Text>
            <Text style={[styles.infoValue, dynamicStyles.text]}>{WITHDRAWAL_CONFIG.processingTime.standard}</Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Add Account Button */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Add Bank Account</Text>
        </TouchableOpacity>
      </View>

      {/* Add Account Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (showBankPicker) {
            setShowBankPicker(false);
          } else {
            setShowAddModal(false);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              if (showBankPicker) {
                setShowBankPicker(false);
              } else {
                setShowAddModal(false);
              }
            }}
          />
          <View style={[
            styles.modalContent,
            dynamicStyles.card,
            { paddingBottom: insets.bottom + 24 },
            showBankPicker && styles.modalContentExpanded,
          ]}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  if (showBankPicker) {
                    setShowBankPicker(false);
                  } else {
                    setShowAddModal(false);
                    setSelectedBank(null);
                    setAccountNumber('');
                    setVerifiedAccountName('');
                  }
                }}
              >
                <Ionicons 
                  name={showBankPicker ? 'chevron-back' : 'close'} 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, dynamicStyles.text]}>
                {showBankPicker ? 'Select Bank' : 'Add Bank Account'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {showBankPicker ? (
              <>
                <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} />
                  <RNTextInput
                    style={[styles.searchInput, dynamicStyles.text]}
                    placeholder="Search banks..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <View style={[styles.clearButton, { backgroundColor: isDark ? colors.background : '#E5E7EB' }]}>
                        <Ionicons name="close" size={14} color={colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={[styles.resultsCount, dynamicStyles.textSecondary]}>
                  {filteredBanks.length} banks found
                </Text>
                <ScrollView style={styles.bankList} showsVerticalScrollIndicator={false}>
                  {filteredBanks.map((bank, index) => (
                    <React.Fragment key={`${bank.code}-${index}`}>
                      <TouchableOpacity
                        style={styles.bankOption}
                        onPress={() => {
                          setSelectedBank(bank);
                          setShowBankPicker(false);
                          setSearchQuery('');
                        }}
                      >
                        <View style={styles.bankOptionIcon}>
                          <MaterialCommunityIcons name="bank-outline" size={20} color="#16A34A" />
                        </View>
                        <Text style={[styles.bankOptionName, dynamicStyles.text]} numberOfLines={1}>
                          {bank.name}
                        </Text>
                        {selectedBank?.code === bank.code && (
                          <MaterialCommunityIcons name="check" size={22} color="#16A34A" />
                        )}
                      </TouchableOpacity>
                      {index < filteredBanks.length - 1 && (
                        <View style={[styles.bankOptionSeparator, { backgroundColor: 'rgba(60, 60, 67, 0.12)' }]} />
                      )}
                    </React.Fragment>
                  ))}
                </ScrollView>
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Bank Selector - Floating Label Style */}
                <View style={styles.floatingInputContainer}>
                  <View style={styles.inputRow}>
                    <TouchableOpacity
                      style={styles.floatingInputContent}
                      onPress={() => setShowBankPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Animated.Text style={[
                        styles.floatingLabel,
                        { color: selectedBank ? '#16A34A' : (isDark ? '#9CA3AF' : '#6B7280') },
                        selectedBank && styles.floatingLabelActive,
                      ]}>
                        Select Bank
                      </Animated.Text>
                      {selectedBank ? (
                        <Text style={[styles.floatingInputText, dynamicStyles.text]}>{selectedBank.name}</Text>
                      ) : (
                        <Text style={[styles.floatingInputText, { color: 'transparent' }]}>Select</Text>
                      )}
                    </TouchableOpacity>
                    <View style={styles.inputIcons}>
                      <MaterialCommunityIcons
                        name="bank-outline"
                        size={22}
                        color={selectedBank ? '#16A34A' : (isDark ? '#6B7280' : '#9CA3AF')}
                      />
                    </View>
                  </View>
                  <View style={[styles.inputLine, selectedBank && styles.inputLineFocused]} />
                </View>

                {/* Account Number - Floating Label Style */}
                <View style={styles.floatingInputContainer}>
                  <View style={styles.inputRow}>
                    <View style={styles.floatingInputContent}>
                      <Animated.Text style={[
                        styles.floatingLabel,
                        { color: accountNumber ? '#16A34A' : (isDark ? '#9CA3AF' : '#6B7280') },
                        accountNumber && styles.floatingLabelActive,
                      ]}>
                        Account Number
                      </Animated.Text>
                      <RNTextInput
                        style={[styles.floatingInput, dynamicStyles.text]}
                        value={accountNumber}
                        onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, '').slice(0, 10))}
                        keyboardType="number-pad"
                        maxLength={10}
                        placeholderTextColor="transparent"
                      />
                    </View>
                    <View style={styles.inputIcons}>
                      {isVerifying ? (
                        <ActivityIndicator size="small" color="#16A34A" />
                      ) : verifiedAccountName ? (
                        <MaterialCommunityIcons name="check-circle" size={22} color="#16A34A" />
                      ) : (
                        <MaterialCommunityIcons
                          name="numeric"
                          size={22}
                          color={accountNumber ? '#16A34A' : (isDark ? '#6B7280' : '#9CA3AF')}
                        />
                      )}
                    </View>
                  </View>
                  <View style={[styles.inputLine, accountNumber && styles.inputLineFocused]} />
                </View>

                {verifiedAccountName ? (
                  <View style={styles.verifiedContainer}>
                    <MaterialCommunityIcons name="account-circle-outline" size={20} color="#16A34A" />
                    <Text style={styles.verifiedName}>{verifiedAccountName}</Text>
                  </View>
                ) : accountNumber.length === 10 && !isVerifying ? (
                  <Text style={styles.verificationError}>
                    Could not verify account. Please check the details.
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!verifiedAccountName || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleAddAccount}
                  disabled={!verifiedAccountName || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Account</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  content: {
    flex: 1,
  },
  contentContainer: {
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
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  sectionSubHeader: {
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  sectionSubHeaderTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
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
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  accountsCard: {
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
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#16A34A',
  },
  accountNumber: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  accountName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  accountActions: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    gap: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  accountSeparator: {
    height: 8,
    backgroundColor: 'rgba(60, 60, 67, 0.06)',
  },
  withdrawalInfoCard: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SPACING.md,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
  },
  addButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: '#fff',
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
    padding: SPACING.md,
    maxHeight: '70%',
  },
  modalContentExpanded: {
    maxHeight: '85%',
  },
  modalDragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(60, 60, 67, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  // Floating Label Input Styles
  floatingInputContainer: {
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  floatingInputContent: {
    flex: 1,
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    top: 16,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  floatingLabelActive: {
    top: -8,
    fontSize: 12,
  },
  floatingInputText: {
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: FONTS.regular,
  },
  floatingInput: {
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: FONTS.regular,
  },
  inputIcons: {
    marginLeft: 12,
  },
  inputLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  inputLineFocused: {
    height: 2,
    backgroundColor: '#16A34A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    paddingVertical: 14,
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsCount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  bankList: {
    flex: 1,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  bankOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankOptionName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  bankOptionSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DCFCE7',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  verifiedName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#166534',
  },
  verificationError: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: '#EF4444',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: '#BBF7D0',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  submitButtonText: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
});
