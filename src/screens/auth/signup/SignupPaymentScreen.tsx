import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  TextInput as RNTextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { useAppDispatch } from '../../../store';
import { setAuth } from '../../../store/slices/authSlice';
import { authService } from '../../../services/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupPayment'>;

// Floating Input Component
const FloatingInput = ({
  label,
  value,
  onChangeText,
  icon,
  error,
  keyboardType = 'default',
  isDark,
  colors,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: string;
  error?: string;
  keyboardType?: 'default' | 'number-pad';
  isDark: boolean;
  colors: any;
  maxLength?: number;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 44,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', COLORS.primary],
    }),
    backgroundColor: isDark ? colors.card : '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={styles.inputWrapper}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: error ? '#EF4444' : isFocused ? COLORS.primary : (isDark ? '#374151' : '#E5E7EB'),
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={isFocused ? COLORS.primary : (isDark ? '#9CA3AF' : '#6B7280')}
          style={styles.inputIcon}
        />
        <RNTextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          maxLength={maxLength}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default function SignupPaymentScreen({ navigation, route }: Props) {
  const params = route.params;
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'skip'>('skip');
  
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === 'card') {
      const cleanedCard = cardNumber.replace(/\s/g, '');
      if (!cleanedCard) newErrors.cardNumber = 'Card number is required';
      else if (cleanedCard.length < 16) newErrors.cardNumber = 'Invalid card number';
      
      if (!expiryDate) newErrors.expiryDate = 'Expiry date is required';
      else if (expiryDate.length < 5) newErrors.expiryDate = 'Invalid expiry date';
      
      if (!cvv) newErrors.cvv = 'CVV is required';
      else if (cvv.length < 3) newErrors.cvv = 'Invalid CVV';
    }

    if (paymentMethod === 'bank') {
      if (!bankName.trim()) newErrors.bankName = 'Bank name is required';
      if (!accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
      else if (accountNumber.length < 10) newErrors.accountNumber = 'Invalid account number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      const signupData: any = {
        name: `${params.firstName} ${params.lastName}`,
        email: params.email,
        phone: params.phone,
        password: params.password,
        role: params.role,
        state: params.state,
        city: params.city,
        address: params.address,
        nationality: params.nationality,
        nationalityCode: params.nationalityCode,
      };

      // Add payment details if provided
      if (paymentMethod === 'card') {
        signupData.paymentMethod = 'card';
        signupData.cardNumber = cardNumber.replace(/\s/g, '');
        signupData.cardExpiry = expiryDate;
      } else if (paymentMethod === 'bank') {
        signupData.paymentMethod = 'bank';
        signupData.bankName = bankName.trim();
        signupData.accountNumber = accountNumber.trim();
      }

      const response = await authService.signup(signupData);

      if (response?.success && response?.data?.user) {
        dispatch(setAuth({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        }));
      } else {
        Alert.alert('Signup Failed', response?.message || 'Please try again');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error?.response?.data?.message || error?.message || 'An error occurred';
      Alert.alert('Signup Failed', Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setIsLoading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['88%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Step 8 of 8
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
        <Animated.View
          style={[styles.progressBar, { width: progressWidth, backgroundColor: COLORS.primary }]}
        />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Payment Setup 💳</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Add a payment method for faster checkout (optional)
          </Text>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.methodContainer}>
          {/* Card Option */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: paymentMethod === 'card' ? COLORS.primary : (isDark ? '#374151' : '#E5E7EB'),
                borderWidth: paymentMethod === 'card' ? 2 : 1,
              },
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={[styles.methodIconContainer, { backgroundColor: paymentMethod === 'card' ? COLORS.primary : (isDark ? '#374151' : '#F3F4F6') }]}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={24}
                color={paymentMethod === 'card' ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, { color: colors.text }]}>Credit/Debit Card</Text>
              <Text style={[styles.methodDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Visa, Mastercard, Verve
              </Text>
            </View>
            <View style={[styles.radioOuter, { borderColor: paymentMethod === 'card' ? COLORS.primary : (isDark ? '#4B5563' : '#D1D5DB') }]}>
              {paymentMethod === 'card' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
            </View>
          </TouchableOpacity>

          {/* Bank Option */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: paymentMethod === 'bank' ? COLORS.primary : (isDark ? '#374151' : '#E5E7EB'),
                borderWidth: paymentMethod === 'bank' ? 2 : 1,
              },
            ]}
            onPress={() => setPaymentMethod('bank')}
          >
            <View style={[styles.methodIconContainer, { backgroundColor: paymentMethod === 'bank' ? COLORS.primary : (isDark ? '#374151' : '#F3F4F6') }]}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={24}
                color={paymentMethod === 'bank' ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, { color: colors.text }]}>Bank Account</Text>
              <Text style={[styles.methodDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Direct bank transfer
              </Text>
            </View>
            <View style={[styles.radioOuter, { borderColor: paymentMethod === 'bank' ? COLORS.primary : (isDark ? '#4B5563' : '#D1D5DB') }]}>
              {paymentMethod === 'bank' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
            </View>
          </TouchableOpacity>

          {/* Skip Option */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: paymentMethod === 'skip' ? COLORS.primary : (isDark ? '#374151' : '#E5E7EB'),
                borderWidth: paymentMethod === 'skip' ? 2 : 1,
              },
            ]}
            onPress={() => setPaymentMethod('skip')}
          >
            <View style={[styles.methodIconContainer, { backgroundColor: paymentMethod === 'skip' ? COLORS.primary : (isDark ? '#374151' : '#F3F4F6') }]}>
              <MaterialCommunityIcons
                name="clock-fast"
                size={24}
                color={paymentMethod === 'skip' ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280')}
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, { color: colors.text }]}>Skip for Now</Text>
              <Text style={[styles.methodDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Add payment later
              </Text>
            </View>
            <View style={[styles.radioOuter, { borderColor: paymentMethod === 'skip' ? COLORS.primary : (isDark ? '#4B5563' : '#D1D5DB') }]}>
              {paymentMethod === 'skip' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Card Form */}
        {paymentMethod === 'card' && (
          <View style={[styles.formCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Card Details</Text>
            
            <FloatingInput
              label="Card Number"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              icon="credit-card-outline"
              error={errors.cardNumber}
              keyboardType="number-pad"
              isDark={isDark}
              colors={colors}
              maxLength={19}
            />
            
            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <FloatingInput
                  label="MM/YY"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiry(text))}
                  icon="calendar-outline"
                  error={errors.expiryDate}
                  keyboardType="number-pad"
                  isDark={isDark}
                  colors={colors}
                  maxLength={5}
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1 }}>
                <FloatingInput
                  label="CVV"
                  value={cvv}
                  onChangeText={(text) => setCvv(text.replace(/\D/g, '').slice(0, 4))}
                  icon="lock-outline"
                  error={errors.cvv}
                  keyboardType="number-pad"
                  isDark={isDark}
                  colors={colors}
                  maxLength={4}
                />
              </View>
            </View>
          </View>
        )}

        {/* Bank Form */}
        {paymentMethod === 'bank' && (
          <View style={[styles.formCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Bank Details</Text>
            
            <FloatingInput
              label="Bank Name"
              value={bankName}
              onChangeText={setBankName}
              icon="bank"
              error={errors.bankName}
              isDark={isDark}
              colors={colors}
            />
            
            <FloatingInput
              label="Account Number"
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
              icon="numeric"
              error={errors.accountNumber}
              keyboardType="number-pad"
              isDark={isDark}
              colors={colors}
              maxLength={10}
            />
          </View>
        )}

        {/* Security Note */}
        <View style={[styles.securityBox, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)' }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.securityText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Your payment information is encrypted and secure. We never store your full card details.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: COLORS.primary },
            isLoading && styles.createButtonDisabled,
          ]}
          onPress={handleCreateAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.createButtonText}>Create Account</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  progressContainer: {
    height: 3,
    marginHorizontal: SPACING.lg,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  content: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  titleContainer: { marginBottom: SPACING.lg },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  methodContainer: {
    gap: 12,
    marginBottom: SPACING.lg,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  methodTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  formCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  formTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputWrapper: { marginBottom: SPACING.md },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 4,
    marginLeft: 4,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: 12,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
