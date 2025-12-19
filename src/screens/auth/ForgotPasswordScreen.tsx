import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  TextInput as RNTextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

// Step 1: Email schema
const emailSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

// Step 3: New password schema
const passwordSchema = yup.object({
  newPassword: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

type EmailFormData = yup.InferType<typeof emailSchema>;
type PasswordFormData = yup.InferType<typeof passwordSchema>;

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
}

const FloatingInput: React.FC<FloatingInputProps & { isDark?: boolean; colors?: any }> = ({
  label,
  value,
  onChangeText,
  onBlur,
  icon,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  secureTextEntry = false,
  isDark = false,
  colors,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
    onBlur?.();
  };

  const labelTop = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -8],
  });

  const labelFontSize = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const labelColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? '#9CA3AF' : '#8E8E93', isFocused ? '#16A34A' : isDark ? '#9CA3AF' : '#6B7280'],
  });

  return (
    <View style={floatingStyles.container}>
      <View style={[floatingStyles.inputRow, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}>
        <View style={floatingStyles.inputWrapper}>
          {icon && (
            <MaterialCommunityIcons
              name={icon as any}
              size={22}
              color={isFocused ? '#16A34A' : isDark ? '#6B7280' : '#8E8E93'}
              style={floatingStyles.icon}
            />
          )}
          <View style={floatingStyles.inputContainer}>
            <Animated.Text
              style={[
                floatingStyles.label,
                {
                  top: labelTop,
                  fontSize: labelFontSize,
                  color: labelColor,
                  left: icon ? 0 : 0,
                  backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                  paddingHorizontal: value || isFocused ? 4 : 0,
                },
              ]}
            >
              {label}
            </Animated.Text>
            <RNTextInput
              style={[floatingStyles.input, { color: isDark ? '#F9FAFB' : '#1F2937' }]}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              secureTextEntry={secureTextEntry && !showPassword}
              placeholderTextColor="transparent"
            />
          </View>
          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={floatingStyles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={isDark ? '#6B7280' : '#8E8E93'}
              />
            </TouchableOpacity>
          )}
        </View>
        <View
          style={[
            floatingStyles.underline,
            { backgroundColor: error ? '#EF4444' : isFocused ? '#16A34A' : isDark ? '#374151' : '#E5E7EB' },
          ]}
        />
      </View>
      {error && <Text style={floatingStyles.errorText}>{error}</Text>}
    </View>
  );
};

const floatingStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 4,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    zIndex: 1,
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  underline: {
    height: 1,
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 34,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
});

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef<(RNTextInput | null)[]>([]);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: yupResolver(emailSchema),
    defaultValues: { email: '' },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle email submission
  const onSubmitEmail = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(data.email);
      if (response.success && response.data) {
        setEmail(data.email);
        setOtpId(response.data.otpId);
        setStep('otp');
        setCountdown(60);
      } else {
        Alert.alert('Error', response.message || 'Failed to send reset code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      if (digits.length === 6) {
        otpInputRefs.current[5]?.blur();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP and proceed to password step
  const verifyOtp = () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }
    setStep('password');
  };

  // Handle password reset
  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const otpCode = otp.join('');
      const response = await authService.resetPassword(otpId, otpCode, data.newPassword);
      if (response.success) {
        setStep('success');
      } else {
        Alert.alert('Error', response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      // Check if it's an invalid OTP error
      if (error.message?.toLowerCase().includes('otp') || error.message?.toLowerCase().includes('code')) {
        Alert.alert('Invalid Code', 'The verification code is incorrect or expired. Please try again.');
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
      } else {
        Alert.alert('Error', error.message || 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success && response.data) {
        setOtpId(response.data.otpId);
        setOtp(['', '', '', '', '', '']);
        setCountdown(60);
        Alert.alert('Success', 'A new verification code has been sent to your email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Step 1: Email
  const renderEmailStep = () => (
    <>
      <View style={styles.iconSection}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1A3D2B' : '#DCFCE7' }]}>
          <MaterialCommunityIcons name="lock-reset" size={44} color="#16A34A" />
        </View>
        <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Forgot password?</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          No worries! Enter your email and we'll send you a verification code to reset your password.
        </Text>
      </View>

      <View style={styles.formSection}>
        <Controller
          control={emailForm.control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <FloatingInput
              label="Email Address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              icon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailForm.formState.errors.email?.message}
              isDark={isDark}
              colors={colors}
            />
          )}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={emailForm.handleSubmit(onSubmitEmail)}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Remember your password? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Render Step 2: OTP
  const renderOtpStep = () => (
    <>
      <View style={styles.iconSection}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1A3D2B' : '#DCFCE7' }]}>
          <MaterialCommunityIcons name="email-check" size={44} color="#16A34A" />
        </View>
        <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Enter verification code</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <RNTextInput
            key={index}
            ref={(ref) => { otpInputRefs.current[index] = ref; }}
            style={[
              styles.otpInput,
              { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#F9FAFB' : '#1F2937' },
              digit && [styles.otpInputFilled, { backgroundColor: isDark ? '#1A3D2B' : '#F0FDF4' }],
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(index, value)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, otp.join('').length !== 6 && styles.submitButtonDisabled]}
        onPress={verifyOtp}
        activeOpacity={0.8}
        disabled={otp.join('').length !== 6}
      >
        <Text style={styles.submitButtonText}>Verify Code</Text>
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={[styles.resendText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Didn't receive the code? </Text>
        <TouchableOpacity onPress={resendOtp} disabled={countdown > 0 || isLoading}>
          <Text style={[styles.resendLink, countdown > 0 && styles.resendLinkDisabled]}>
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.changeEmailButton}
        onPress={() => {
          setStep('email');
          setOtp(['', '', '', '', '', '']);
        }}
      >
        <Ionicons name="arrow-back" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
        <Text style={[styles.changeEmailText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Change email address</Text>
      </TouchableOpacity>
    </>
  );

  // Render Step 3: New Password
  const renderPasswordStep = () => (
    <>
      <View style={styles.iconSection}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1A3D2B' : '#DCFCE7' }]}>
          <MaterialCommunityIcons name="lock-check" size={44} color="#16A34A" />
        </View>
        <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Create new password</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Your new password must be different from previously used passwords.
        </Text>
      </View>

      <View style={styles.formSection}>
        <Controller
          control={passwordForm.control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FloatingInput
              label="New Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              icon="lock-outline"
              secureTextEntry
              error={passwordForm.formState.errors.newPassword?.message}
              isDark={isDark}
              colors={colors}
            />
          )}
        />

        <Controller
          control={passwordForm.control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FloatingInput
              label="Confirm Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              icon="lock-check-outline"
              secureTextEntry
              error={passwordForm.formState.errors.confirmPassword?.message}
              isDark={isDark}
              colors={colors}
            />
          )}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={passwordForm.handleSubmit(onSubmitPassword)}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
    </>
  );

  // Render Success
  const renderSuccess = () => (
    <View style={styles.successContent}>
      <View style={styles.successIconContainer}>
        <View style={[styles.successIconInner, { backgroundColor: isDark ? '#1A3D2B' : '#DCFCE7' }]}>
          <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
        </View>
      </View>

      <Text style={[styles.successTitle, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Password Reset!</Text>
      <Text style={[styles.successSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
        Your password has been reset successfully. You can now log in with your new password.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.8}
      >
        <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );

  if (step === 'success') {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.successWrapper, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 }]}>
          {renderSuccess()}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
        onPress={() => {
          if (step === 'otp') {
            setStep('email');
            setOtp(['', '', '', '', '', '']);
          } else if (step === 'password') {
            setStep('otp');
          } else {
            navigation.goBack();
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={28} color={isDark ? '#F9FAFB' : '#1F2937'} />
      </TouchableOpacity>

      {/* Step indicator */}
      <View style={[styles.stepIndicator, { top: insets.top + 16 }]}>
        <View style={[styles.stepDot, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }, step !== 'email' && styles.stepDotCompleted]} />
        <View style={[styles.stepLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }, step !== 'email' && styles.stepLineActive]} />
        <View style={[styles.stepDot, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }, step === 'password' && styles.stepDotCompleted]} />
        <View style={[styles.stepLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }, step === 'password' && styles.stepLineActive]} />
        <View style={[styles.stepDot, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'email' && renderEmailStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'password' && renderPasswordStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepIndicator: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  stepDotCompleted: {
    backgroundColor: '#16A34A',
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#16A34A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: '#6B7280',
    paddingHorizontal: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  emailHighlight: {
    color: '#16A34A',
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  footerLink: {
    fontSize: 15,
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  // OTP styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
  },
  otpInputFilled: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  resendLink: {
    fontSize: 14,
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  resendLinkDisabled: {
    color: '#9CA3AF',
  },
  changeEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  changeEmailText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  // Success styles
  successWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: FONTS.bold,
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    color: '#6B7280',
    lineHeight: 22,
    paddingHorizontal: 24,
    fontFamily: FONTS.regular,
  },
  primaryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
});
