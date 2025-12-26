import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  PaymentMethod,
} from '../../store/slices/paymentSlice';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { paymentService } from '../../services/paymentService';
import { withdrawalService } from '../../services/withdrawalService';

// FloatingInput Component
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  icon?: string;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  maxLength?: number;
}

const FloatingInput = ({
  label,
  value,
  onChangeText,
  onBlur,
  icon,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  maxLength,
}: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 0,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', error ? '#EF4444' : '#16A34A'],
    }),
    backgroundColor: isDark ? colors.background : '#F2F2F7',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={floatingStyles.floatingInputContainer}>
      <View style={[floatingStyles.inputRow, error && floatingStyles.inputRowError]}>
        <View style={floatingStyles.inputContent}>
          <Animated.Text style={[labelStyle, { fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif' }]}>{label}</Animated.Text>
          <TextInput
            style={[
              floatingStyles.floatingInput,
              { color: colors.text },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            maxLength={maxLength}
          />
        </View>
        {icon && (
          <View style={floatingStyles.inputIcons}>
            <Ionicons
              name={icon as any}
              size={20}
              color={error ? '#EF4444' : isFocused ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
            />
          </View>
        )}
      </View>
      <View style={[floatingStyles.inputLine, isFocused && floatingStyles.inputLineFocused, error && floatingStyles.inputLineError]} />
      {error && <Text style={floatingStyles.errorText}>{error}</Text>}
    </View>
  );
};

const floatingStyles = StyleSheet.create({
  floatingInputContainer: {
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  inputRowError: {},
  inputContent: {
    flex: 1,
    position: 'relative',
  },
  floatingInput: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    paddingVertical: 0,
    paddingTop: 4,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  inputLine: {
    height: 1,
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
  },
  inputLineFocused: {
    backgroundColor: '#16A34A',
    height: 2,
  },
  inputLineError: {
    backgroundColor: '#EF4444',
    height: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
});

// Remove mock data - banks will be fetched from API
interface Bank {
  name: string;
  code: string;
}

const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

const formatExpiryDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

const detectCardBrand = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^506[0-1]|^507[8-9]|^6500/.test(cleaned)) return 'verve';
  return 'card';
};

// Luhn algorithm to validate card number
const isValidCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Validate expiry date
const isValidExpiry = (expiry: string): { valid: boolean; error?: string } => {
  if (expiry.length < 4) return { valid: false };
  
  const month = parseInt(expiry.slice(0, 2), 10);
  const year = parseInt('20' + expiry.slice(2, 4), 10);
  
  if (month < 1 || month > 12) return { valid: false, error: 'Invalid month' };
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: 'Card expired' };
  }
  
  return { valid: true };
};

// Get CVV length for card brand
const getCvvLength = (brand: string): number => {
  return brand === 'amex' ? 4 : 3;
};

const getCardIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'visa':
    case 'mastercard':
    case 'verve':
      return 'card';
    case 'bank':
      return 'storefront';
    default:
      return 'card';
  }
};

const getCardColor = (type: string): string => {
  switch (type) {
    case 'visa':
      return '#1A1F71';
    case 'mastercard':
      return '#EB001B';
    case 'verve':
      return '#00425F';
    case 'bank':
      return '#FF9500';
    default:
      return '#007AFF';
  }
};

type EditField = 'cardNumber' | 'expiry' | 'cvv' | 'name' | 'bankName' | 'accountNumber' | 'accountName' | null;

export default function PaymentMethodsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const inputRef = useRef<TextInput>(null);

  const storedMethods = useSelector((state: RootState) => state.payment?.methods || []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [selectedType, setSelectedType] = useState<'card' | 'bank'>('card');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [editField, setEditField] = useState<EditField>(null);
  const [editValue, setEditValue] = useState('');

  // Banks state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [cardNumberValid, setCardNumberValid] = useState<boolean | null>(null);
  const [cardExpiryValid, setCardExpiryValid] = useState<boolean | null>(null);
  const [cardExpiryError, setCardExpiryError] = useState('');
  const [cardCvvValid, setCardCvvValid] = useState<boolean | null>(null);

  // Bank form state
  const [bankName, setBankName] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    loadBanks();
    loadSavedBankAccounts();
  }, []);

  // Load saved bank accounts from backend
  const loadSavedBankAccounts = async () => {
    try {
      const accounts = await withdrawalService.getBankAccounts();
      console.log('[PaymentMethodsScreen] Loaded bank accounts:', accounts.length);
      
      // Add bank accounts to Redux if not already there
      accounts.forEach((account) => {
        const existsInRedux = storedMethods.some(
          (m) => m.type === 'bank' && m.accountNumber === account.accountNumber
        );
        
        if (!existsInRedux) {
          const last4 = account.accountNumber.slice(-4);
          const method: PaymentMethod = {
            id: account.id,
            type: 'bank',
            label: account.bankName,
            details: `Account ending in ${last4}`,
            icon: 'storefront',
            iconColor: '#FF9500',
            iconBg: '#FF950020',
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
            isDefault: account.isDefault,
          };
          dispatch(addPaymentMethod(method));
        }
      });
    } catch (error) {
      console.error('[PaymentMethodsScreen] Error loading saved bank accounts:', error);
    }
  };

  // Auto-verify bank account when account number is 10 digits and bank is selected
  useEffect(() => {
    let isMounted = true;
    
    const verifyBankAccount = async () => {
      // Only verify when we have exactly 10 digits and a bank selected
      if (accountNumber.length === 10 && selectedBankCode) {
        console.log('Starting verification for:', accountNumber, selectedBankCode);
        setIsVerifyingAccount(true);
        setVerificationError('');
        setAccountVerified(false);
        try {
          const result = await withdrawalService.verifyAccount({
            accountNumber: accountNumber,
            bankCode: selectedBankCode,
          });
          console.log('Verification result:', result);
          if (isMounted) {
            setAccountName(result.accountName);
            setAccountVerified(true);
          }
        } catch (error: any) {
          console.error('Account verification error:', error);
          if (isMounted) {
            // Handle different error types
            let errorMessage = 'Could not verify account';
            
            if (error.response?.status === 400) {
              errorMessage = 'Account not found. Please check the account number.';
            } else if (error.response?.status === 429) {
              errorMessage = 'Too many requests. Please wait a moment.';
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            setVerificationError(errorMessage);
            setAccountName('');
          }
        } finally {
          if (isMounted) {
            setIsVerifyingAccount(false);
          }
        }
      } else if (accountNumber.length < 10) {
        // Reset states when account number is incomplete
        setAccountVerified(false);
        setVerificationError('');
        if (accountNumber.length === 0) {
          setAccountName('');
        }
      }
    };

    // Increased debounce to 800ms to avoid rate limiting
    const timeoutId = setTimeout(verifyBankAccount, 800);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [accountNumber, selectedBankCode]);

  // Real-time card validation
  useEffect(() => {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Detect card brand
    const brand = detectCardBrand(cardNumber);
    setCardBrand(brand);
    
    // Validate card number (only when length is sufficient)
    if (cleaned.length >= 13) {
      setCardNumberValid(isValidCardNumber(cardNumber));
    } else if (cleaned.length === 0) {
      setCardNumberValid(null);
    } else {
      setCardNumberValid(null);
    }
  }, [cardNumber]);

  // Real-time expiry validation
  useEffect(() => {
    if (cardExpiry.length === 4) {
      const result = isValidExpiry(cardExpiry);
      setCardExpiryValid(result.valid);
      setCardExpiryError(result.error || '');
    } else if (cardExpiry.length === 0) {
      setCardExpiryValid(null);
      setCardExpiryError('');
    } else {
      setCardExpiryValid(null);
      setCardExpiryError('');
    }
  }, [cardExpiry]);

  // Real-time CVV validation
  useEffect(() => {
    const requiredLength = getCvvLength(cardBrand);
    if (cardCvv.length === requiredLength) {
      setCardCvvValid(true);
    } else if (cardCvv.length === 0) {
      setCardCvvValid(null);
    } else if (cardCvv.length > 0 && cardCvv.length < requiredLength) {
      setCardCvvValid(null);
    }
  }, [cardCvv, cardBrand]);

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

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  const resetForm = () => {
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardholderName('');
    setCardBrand('');
    setCardNumberValid(null);
    setCardExpiryValid(null);
    setCardExpiryError('');
    setCardCvvValid(null);
    setBankName('');
    setSelectedBankCode('');
    setAccountNumber('');
    setAccountName('');
    setBankSearchQuery('');
    setIsVerifyingAccount(false);
    setAccountVerified(false);
    setVerificationError('');
  };

  const handleAddCard = () => {
    if (!cardNumber || !cardExpiry || !cardCvv || !cardholderName) {
      Alert.alert('Missing Information', 'Please fill in all card details.');
      return;
    }

    const brand = detectCardBrand(cardNumber) as 'visa' | 'mastercard' | 'verve' | 'other';
    const last4 = cardNumber.slice(-4);
    const method: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      label: `${brand.charAt(0).toUpperCase() + brand.slice(1)} •••• ${last4}`,
      details: `Expires ${cardExpiry}`,
      icon: 'card',
      iconColor: getCardColor(brand),
      iconBg: getCardColor(brand) + '20',
      cardNumber: cardNumber,
      cardExpiry: cardExpiry,
      cardholderName: cardholderName,
      cardBrand: brand,
      isDefault: storedMethods.length === 0,
    };

    dispatch(addPaymentMethod(method));
    setShowAddModal(false);
    resetForm();
  };

  const handleAddBank = async () => {
    if (!bankName || !accountNumber || !accountName || !selectedBankCode) {
      Alert.alert('Missing Information', 'Please fill in all bank details.');
      return;
    }

    try {
      // Save to backend API
      const savedAccount = await withdrawalService.addBankAccount({
        accountNumber: accountNumber,
        bankCode: selectedBankCode,
        accountName: accountName,
        setAsDefault: storedMethods.length === 0,
      });

      // Also save to Redux for payment methods
      const last4 = accountNumber.slice(-4);
      const method: PaymentMethod = {
        id: savedAccount.id || Date.now().toString(),
        type: 'bank',
        label: bankName,
        details: `Account ending in ${last4}`,
        icon: 'storefront',
        iconColor: '#FF9500',
        iconBg: '#FF950020',
        bankName: bankName,
        accountNumber: accountNumber,
        accountName: accountName,
        isDefault: storedMethods.length === 0,
      };

      dispatch(addPaymentMethod(method));
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Bank account added successfully!');
    } catch (error: any) {
      console.error('Error adding bank account:', error);
      Alert.alert('Error', error.message || 'Failed to add bank account. Please try again.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Update on backend first for bank accounts
      const method = storedMethods.find(m => m.id === id);
      if (method?.type === 'bank') {
        await withdrawalService.setDefaultAccount(id);
      }
      dispatch(setDefaultPaymentMethod(id));
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'Failed to set default payment method');
    }
  };

  const handleDelete = (id: string) => {
    const method = storedMethods.find(m => m.id === id);
    
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from backend first for bank accounts
              if (method?.type === 'bank') {
                await withdrawalService.deleteBankAccount(id);
              }
              // Then remove from Redux
              dispatch(removePaymentMethod(id));
            } catch (error) {
              console.error('Error deleting payment method:', error);
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (method: PaymentMethod) => {
    // Toggle expand/collapse - if same method is tapped, collapse it
    setSelectedMethod(prev => prev?.id === method.id ? null : method);
  };

  const renderPaymentCard = (method: PaymentMethod) => {
    const isCard = method.type === 'card';
    const iconColor = method.iconColor || getCardColor(method.cardBrand || 'card');
    const brandLabel = method.cardBrand === 'visa' ? 'Visa' : 
                       method.cardBrand === 'mastercard' ? 'Mastercard' :
                       method.cardBrand === 'verve' ? 'Verve' :
                       method.type === 'bank' ? method.bankName : 'Card';

    const renderFieldItem = (label: string, value: string | undefined) => (
      <View style={styles.fieldItem}>
        <View style={styles.fieldContent}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.fieldValue, { color: value ? colors.text : colors.textSecondary }]} numberOfLines={1}>
            {value || 'Not set'}
          </Text>
        </View>
        <View style={styles.fieldLine} />
      </View>
    );

    return (
      <View
        key={method.id}
        style={[
          styles.paymentCard,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
        ]}
      >
        {/* Header Row */}
        <TouchableOpacity
          style={styles.paymentHeaderRow}
          onPress={() => handleViewDetails(method)}
        >
          <View style={[styles.paymentIconBg, { backgroundColor: '#16A34A' }]}>
            <Ionicons name={getCardIcon(method.type)} size={18} color="#FFFFFF" />
          </View>
          <View style={styles.paymentHeaderInfo}>
            <View style={styles.labelRow}>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>
                {isCard ? brandLabel : method.bankName}
              </Text>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={[styles.paymentPreview, { color: colors.textSecondary }]}>
              {method.details || (isCard ? `•••• ${method.cardNumber?.slice(-4)}` : `Account ending in ${method.accountNumber?.slice(-4)}`)}
            </Text>
          </View>
          <Ionicons 
            name={selectedMethod?.id === method.id ? "chevron-down" : "chevron-forward"} 
            size={18} 
            color="#9CA3AF" 
          />
        </TouchableOpacity>

        {/* Details - Only show when this card is selected */}
        {selectedMethod?.id === method.id && (
          <>
            <View style={styles.fieldsContainer}>
              {isCard ? (
                <>
                  {renderFieldItem('Cardholder Name', method.cardholderName)}
                  {renderFieldItem('Expires', method.cardExpiry)}
                </>
              ) : (
                <>
                  {renderFieldItem('Account Name', method.accountName)}
                  {renderFieldItem('Account Number', `•••••• ${method.accountNumber?.slice(-4)}`)}
                </>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              {!method.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(method.id)}
                >
                  <Ionicons name="star-outline" size={18} color="#16A34A" />
                  <Text style={[styles.actionText, { color: '#16A34A' }]}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(method.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Page Title */}
      <View style={styles.pageTitleContainer}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Payment Methods</Text>
        <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
          Manage your payment options
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Security Banner */}
        <View style={[styles.securityBanner, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={[styles.securityIconBg, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
          </View>
          <View style={styles.securityInfo}>
            <Text style={[styles.securityTitle, { color: colors.text }]}>Secure Payments</Text>
            <Text style={[styles.securityDesc, { color: colors.textSecondary }]}>
              Your payment data is encrypted and protected
            </Text>
          </View>
        </View>

        {/* Saved Methods Section */}
        {storedMethods.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              SAVED METHODS ({storedMethods.length})
            </Text>
            {storedMethods.map(renderPaymentCard)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Ionicons name="card-outline" size={48} color="#16A34A" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No payment methods</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Add a payment method for faster checkout
            </Text>
          </View>
        )}

        {/* Add New Method Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ADD NEW METHOD</Text>
        <View style={[styles.addMethodsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <TouchableOpacity
            style={styles.addOption}
            onPress={() => {
              setSelectedType('card');
              setShowAddModal(true);
            }}
          >
            <View style={[styles.addIconBg, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
              <Ionicons name="card-outline" size={20} color="#16A34A" />
            </View>
            <View style={styles.addOptionContent}>
              <Text style={[styles.addOptionLabel, { color: colors.text }]}>Credit/Debit Card</Text>
              <Text style={[styles.addOptionDesc, { color: colors.textSecondary }]}>Visa, Mastercard, Verve</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.optionDivider} />
          <TouchableOpacity
            style={styles.addOption}
            onPress={() => {
              setSelectedType('bank');
              setShowAddModal(true);
            }}
          >
            <View style={[styles.addIconBg, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
              <Ionicons name="business-outline" size={20} color="#16A34A" />
            </View>
            <View style={styles.addOptionContent}>
              <Text style={[styles.addOptionLabel, { color: colors.text }]}>Bank Account</Text>
              <Text style={[styles.addOptionDesc, { color: colors.textSecondary }]}>Nigerian banks supported</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Accepted Cards */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WE ACCEPT</Text>
        <View style={[styles.logosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.logosRow}>
            <View style={[styles.logoItem, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
              <Text style={[styles.logoText, { color: '#1A1F71' }]}>VISA</Text>
            </View>
            <View style={[styles.logoItem, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
              <Text style={[styles.logoText, { color: '#EB001B' }]}>MC</Text>
            </View>
            <View style={[styles.logoItem, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
              <Text style={[styles.logoText, { color: '#00425F' }]}>Verve</Text>
            </View>
            <View style={[styles.logoItem, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
              <Ionicons name="business-outline" size={16} color="#6B7280" />
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Ionicons name="information-circle" size={20} color="#16A34A" />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your default payment method will be used at checkout unless you select another.
          </Text>
        </View>
      </ScrollView>

      {/* Add Card/Bank Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity 
              style={[styles.modalBackButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
              onPress={() => { setShowAddModal(false); resetForm(); }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={selectedType === 'card' ? handleAddCard : handleAddBank}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.modalSaveButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Modal Title */}
          <View style={styles.modalTitleContainer}>
            <Text style={[styles.modalTitleLarge, { color: colors.text }]}>
              Add {selectedType === 'card' ? 'Card' : 'Bank Account'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {selectedType === 'card' ? 'Enter your card details' : 'Enter your bank details'}
            </Text>
          </View>

          <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <View style={styles.typeSelectorContainer}>
              <TouchableOpacity
                style={[
                  styles.typeOptionCard,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF' },
                  selectedType === 'card' && styles.typeOptionCardSelected,
                ]}
                onPress={() => setSelectedType('card')}
              >
                <View style={[
                  styles.typeOptionIcon,
                  selectedType === 'card' && styles.typeOptionIconSelected,
                ]}>
                  <Ionicons name="card-outline" size={24} color={selectedType === 'card' ? '#16A34A' : '#6B7280'} />
                </View>
                <Text style={[
                  styles.typeOptionText,
                  { color: colors.text },
                  selectedType === 'card' && styles.typeOptionTextSelected,
                ]}>
                  Card
                </Text>
                {selectedType === 'card' && (
                  <View style={styles.typeCheckmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOptionCard,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF' },
                  selectedType === 'bank' && styles.typeOptionCardSelected,
                ]}
                onPress={() => setSelectedType('bank')}
              >
                <View style={[
                  styles.typeOptionIcon,
                  selectedType === 'bank' && styles.typeOptionIconSelected,
                ]}>
                  <Ionicons name="business-outline" size={24} color={selectedType === 'bank' ? '#16A34A' : '#6B7280'} />
                </View>
                <Text style={[
                  styles.typeOptionText,
                  { color: colors.text },
                  selectedType === 'bank' && styles.typeOptionTextSelected,
                ]}>
                  Bank
                </Text>
                {selectedType === 'bank' && (
                  <View style={styles.typeCheckmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {selectedType === 'card' ? (
              <>
                {/* Card Details */}
                <Text style={[styles.formSectionTitle, { color: colors.text }]}>Card Details</Text>
                
                {/* Card Number with validation */}
                <View style={{ marginBottom: 16 }}>
                  <View style={[
                    styles.floatingInputContainer,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF' }
                  ]}>
                    <View style={styles.floatingInputIcon}>
                      {cardNumberValid === true ? (
                        <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                      ) : cardNumberValid === false ? (
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      ) : (
                        <Ionicons name="card-outline" size={20} color={cardBrand ? getCardColor(cardBrand) : '#9CA3AF'} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.floatingInputLabel,
                        { color: cardNumberValid === true ? '#16A34A' : cardNumberValid === false ? '#EF4444' : colors.textSecondary }
                      ]}>
                        {cardBrand && cardBrand !== 'card' 
                          ? `${cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)} Card ${cardNumberValid === true ? '✓' : ''}` 
                          : 'Card Number'}
                      </Text>
                      <TextInput
                        style={[styles.floatingInputValue, { color: colors.text, padding: 0, margin: 0 }]}
                        value={formatCardNumber(cardNumber)}
                        onChangeText={(text) => setCardNumber(text.replace(/\s/g, ''))}
                        placeholder="0000 0000 0000 0000"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        maxLength={19}
                      />
                    </View>
                    {cardBrand && cardBrand !== 'card' && (
                      <View style={{ 
                        backgroundColor: getCardColor(cardBrand) + '20', 
                        paddingHorizontal: 8, 
                        paddingVertical: 4, 
                        borderRadius: 6 
                      }}>
                        <Text style={{ color: getCardColor(cardBrand), fontSize: 12, fontWeight: '600' }}>
                          {cardBrand.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  {cardNumberValid === false && (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 8 }}>
                      Invalid card number
                    </Text>
                  )}
                </View>
                
                <FloatingInput
                  label="Cardholder Name"
                  value={cardholderName}
                  onChangeText={(text) => setCardholderName(text.toUpperCase())}
                  icon="person-outline"
                  autoCapitalize="characters"
                />
                
                <View style={styles.rowInputs}>
                  {/* Expiry with validation */}
                  <View style={styles.halfInput}>
                    <View style={{ marginBottom: 16 }}>
                      <View style={[
                        styles.floatingInputContainer,
                        { backgroundColor: isDark ? colors.card : '#FFFFFF' }
                      ]}>
                        <View style={styles.floatingInputIcon}>
                          {cardExpiryValid === true ? (
                            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                          ) : cardExpiryValid === false ? (
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          ) : (
                            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.floatingInputLabel,
                            { color: cardExpiryValid === true ? '#16A34A' : cardExpiryValid === false ? '#EF4444' : colors.textSecondary }
                          ]}>
                            {cardExpiryValid === true ? 'Expiry ✓' : cardExpiryError || 'Expiry (MM/YY)'}
                          </Text>
                          <TextInput
                            style={[styles.floatingInputValue, { color: colors.text, padding: 0, margin: 0 }]}
                            value={formatExpiryDate(cardExpiry)}
                            onChangeText={(text) => setCardExpiry(text.replace(/[^\d]/g, ''))}
                            placeholder="MM/YY"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            maxLength={5}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {/* CVV with validation */}
                  <View style={styles.halfInput}>
                    <View style={{ marginBottom: 16 }}>
                      <View style={[
                        styles.floatingInputContainer,
                        { backgroundColor: isDark ? colors.card : '#FFFFFF' }
                      ]}>
                        <View style={styles.floatingInputIcon}>
                          {cardCvvValid === true ? (
                            <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                          ) : (
                            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.floatingInputLabel,
                            { color: cardCvvValid === true ? '#16A34A' : colors.textSecondary }
                          ]}>
                            {cardCvvValid === true ? 'CVV ✓' : 'CVV'}
                          </Text>
                          <TextInput
                            style={[styles.floatingInputValue, { color: colors.text, padding: 0, margin: 0 }]}
                            value={cardCvv}
                            onChangeText={setCardCvv}
                            placeholder="•••"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Bank Details */}
                <Text style={[styles.formSectionTitle, { color: colors.text }]}>Bank Details</Text>
                
                {/* Bank Picker Button */}
                <TouchableOpacity
                  style={[styles.bankPickerButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                  onPress={() => setShowBankPicker(true)}
                >
                  <View style={styles.bankPickerContent}>
                    <Text style={[
                      styles.bankPickerLabel,
                      { color: bankName ? '#16A34A' : colors.textSecondary }
                    ]}>
                      Bank
                    </Text>
                    <Text style={[
                      styles.bankPickerValue,
                      { color: bankName ? colors.text : colors.textSecondary }
                    ]}>
                      {bankName || 'Select bank'}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={bankName ? '#16A34A' : '#9CA3AF'} 
                  />
                </TouchableOpacity>
                
                <FloatingInput
                  label="Account Number"
                  value={accountNumber}
                  onChangeText={(text) => {
                    setAccountNumber(text);
                    if (text.length !== 10) {
                      setAccountName('');
                      setAccountVerified(false);
                    }
                  }}
                  icon="keypad-outline"
                  keyboardType="numeric"
                  maxLength={10}
                />
                
                {/* Account Name with verification status */}
                <View style={{ marginBottom: 16 }}>
                  <View style={[
                    styles.floatingInputContainer,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF' }
                  ]}>
                    <View style={styles.floatingInputIcon}>
                      {isVerifyingAccount ? (
                        <ActivityIndicator size="small" color="#16A34A" />
                      ) : accountVerified && accountName ? (
                        <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                      ) : (
                        <Ionicons name="person-outline" size={20} color={verificationError ? '#EF4444' : '#9CA3AF'} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.floatingInputLabel,
                        { color: (accountVerified && accountName) ? '#16A34A' : verificationError ? '#EF4444' : colors.textSecondary }
                      ]}>
                        {isVerifyingAccount ? 'Verifying...' : (accountVerified && accountName) ? 'Verified ✓' : 'Account Name'}
                      </Text>
                      <Text style={[
                        styles.floatingInputValue,
                        { 
                          color: accountName ? colors.text : colors.textSecondary,
                          fontSize: accountName ? 17 : 14,
                          fontWeight: accountName ? '600' : '400',
                        }
                      ]}>
                        {isVerifyingAccount 
                          ? 'Please wait...' 
                          : accountName 
                            ? accountName.toUpperCase()
                            : verificationError 
                              ? verificationError 
                              : !selectedBankCode 
                                ? 'Select a bank first' 
                                : accountNumber.length < 10 
                                  ? `Enter ${10 - accountNumber.length} more digits` 
                                  : 'Waiting...'}
                      </Text>
                    </View>
                    {verificationError && (
                      <TouchableOpacity 
                        onPress={() => {
                          // Force re-verify by toggling account number
                          const temp = accountNumber;
                          setAccountNumber('');
                          setTimeout(() => setAccountNumber(temp), 100);
                        }}
                        style={{ padding: 8 }}
                      >
                        <Ionicons name="refresh" size={20} color="#16A34A" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {verificationError && (
                    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 8 }}>
                      {verificationError}
                    </Text>
                  )}
                </View>
              </>
            )}

            {/* Security Note */}
            <View style={[styles.securityNote, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
              <Text style={[styles.securityNoteText, { color: colors.textSecondary }]}>
                Your payment information is encrypted and stored securely.
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Bank Picker Modal - Full Page (inside parent modal) */}
          <Modal
            visible={showBankPicker}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => {
              setShowBankPicker(false);
              setBankSearchQuery('');
            }}
          >
            <View style={[styles.bankModalFullPage, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
              {/* Header */}
              <View style={[styles.bankModalFullHeader, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', paddingTop: insets.top + 16 }]}>
                <TouchableOpacity
                  onPress={() => {
                    setShowBankPicker(false);
                    setBankSearchQuery('');
                  }}
                  style={[styles.bankModalBackButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.1)' }]}
                >
                  <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.bankModalFullTitle, { color: colors.text }]}>Select Bank</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Search Input */}
              <View style={[styles.bankModalFullSearchWrapper, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <View style={[styles.bankModalSearchContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                  <TextInput
                    style={[styles.bankModalSearchInput, { color: colors.text }]}
                    placeholder="Search banks..."
                    placeholderTextColor="#9CA3AF"
                    value={bankSearchQuery}
                    onChangeText={setBankSearchQuery}
                    autoCapitalize="none"
                  />
                  {bankSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setBankSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={[styles.bankModalCount, { color: colors.textSecondary, paddingTop: 16 }]}>
                {filteredBanks.length} banks available
              </Text>
              
              {/* Bank List */}
              {isLoadingBanks ? (
                <View style={styles.bankLoadingContainer}>
                  <ActivityIndicator size="large" color="#16A34A" />
                  <Text style={[styles.bankLoadingText, { color: colors.textSecondary }]}>
                    Loading banks...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredBanks}
                  keyExtractor={(item, index) => `${item.code}-${index}`}
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.bankModalListContent}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.bankModalItem,
                        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
                        bankName === item.name && styles.bankModalItemSelected,
                      ]}
                      onPress={() => {
                        setBankName(item.name);
                        setSelectedBankCode(item.code);
                        setShowBankPicker(false);
                        setBankSearchQuery('');
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={styles.bankModalItemIcon}>
                          <MaterialCommunityIcons name="bank-outline" size={20} color="#16A34A" />
                        </View>
                        <Text
                          style={[
                            styles.bankModalItemText,
                            { color: bankName === item.name ? '#16A34A' : colors.text },
                            bankName === item.name && { fontWeight: '600' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </View>
                      {bankName === item.name ? (
                        <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                      ) : (
                        <Ionicons name="chevron-forward" size={20} color={isDark ? 'rgba(255,255,255,0.3)' : '#C7C7CC'} />
                      )}
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <Text style={[styles.noResultsText, { color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 }]}>
                      No banks found
                    </Text>
                  }
                />
              )}
            </View>
          </Modal>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pageTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  pageSubtitle: {
    fontSize: 15,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  securityIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityInfo: {
    flex: 1,
    marginLeft: 14,
  },
  securityTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  securityDesc: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
    fontFamily: FONTS.semiBold,
  },
  paymentCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  paymentIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  paymentLabel: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    flexShrink: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  paymentPreview: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  fieldsContainer: {
    paddingHorizontal: 16,
  },
  fieldItem: {
    paddingVertical: 14,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  fieldLine: {
    height: 1,
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  addMethodsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
    marginLeft: 68,
  },
  addIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  addOptionLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  addOptionDesc: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  logosCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  logoItem: {
    width: 60,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  modalTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  modalTitleLarge: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  modalSubtitle: {
    fontSize: 15,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  modalScrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeOptionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeOptionCardSelected: {
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  typeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeOptionIconSelected: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  typeOptionText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  typeOptionTextSelected: {
    color: '#16A34A',
    fontWeight: '600',
  },
  typeCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  formSectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    fontFamily: FONTS.semiBold,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  bankPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bankPickerContent: {
    flex: 1,
  },
  bankPickerLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  bankPickerValue: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  bankListContainer: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bankSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  bankSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    padding: 0,
  },
  bankLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  bankLoadingText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  bankPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bankPickerItemSelected: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  bankPickerText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  // Bank Picker Modal Styles
  bankModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bankModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    paddingBottom: 34,
  },
  bankModalFullPage: {
    flex: 1,
  },
  bankModalFullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  bankModalBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(60, 60, 67, 0.1)',
  },
  bankModalFullTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    flex: 1,
  },
  bankModalFullSearchWrapper: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  bankModalDragHandle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandleBar: {
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  bankModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bankModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  bankModalCloseButton: {
    padding: 4,
  },
  bankModalCloseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankModalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  bankModalSearchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    fontFamily: FONTS.regular,
  },
  bankModalCount: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontFamily: FONTS.regular,
  },
  bankModalListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 8,
  },
  bankModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  bankModalItemSelected: {
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  bankModalItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankModalItemText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  floatingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 72,
  },
  floatingInputIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  floatingInputLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  floatingInputValue: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});