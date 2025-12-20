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
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';

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

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otpId, setOtpId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [emailFocused, setEmailFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const otpInputRefs = useRef<(RNTextInput | null)[]>([]);
  const emailRef = useRef<RNTextInput>(null);
  const newPasswordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);
  
  const emailAnimValue = useRef(new Animated.Value(0)).current;
  const newPasswordAnimValue = useRef(new Animated.Value(0)).current;
  const confirmPasswordAnimValue = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
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

  const emailValue = emailForm.watch('email');
  const newPasswordValue = passwordForm.watch('newPassword');
  const confirmPasswordValue = passwordForm.watch('confirmPassword');

  useEffect(() => {
    let targetProgress = 0;
    if (step === 'email') targetProgress = 0.33;
    else if (step === 'otp') targetProgress = 0.66;
    else if (step === 'password') targetProgress = 1;
    
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  useEffect(() => {
    Animated.timing(emailAnimValue, {
      toValue: emailFocused || emailValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused, emailValue]);

  useEffect(() => {
    Animated.timing(newPasswordAnimValue, {
      toValue: newPasswordFocused || newPasswordValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [newPasswordFocused, newPasswordValue]);

  useEffect(() => {
    Animated.timing(confirmPasswordAnimValue, {
      toValue: confirmPasswordFocused || confirmPasswordValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [confirmPasswordFocused, confirmPasswordValue]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const createLabelStyle = (animValue: Animated.Value) => ({
    position: 'absolute' as const,
    left: 0,
    top: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -8],
    }),
    fontSize: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', COLORS.primary],
    }),
    backgroundColor: isDark ? colors.background : '#F2F2F7',
    paddingHorizontal: 4,
    zIndex: 1,
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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

  const getStepNumber = () => {
    if (step === 'email') return 1;
    if (step === 'otp') return 2;
    if (step === 'password') return 3;
    return 3;
  };

  // Render Step 1: Email
  const renderEmailStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Forgot password?
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          No worries! Enter your email and we'll send you a verification code to reset your password.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Controller
          control={emailForm.control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={styles.inputWrapper}>
                <Animated.Text style={[createLabelStyle(emailAnimValue), styles.label]}>
                  Email Address
                </Animated.Text>
                <RNTextInput
                  ref={emailRef}
                  style={[styles.input, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => {
                    setEmailFocused(false);
                    onBlur();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder=""
                  placeholderTextColor="transparent"
                  returnKeyType="done"
                  onSubmitEditing={emailForm.handleSubmit(onSubmitEmail)}
                />
                <MaterialCommunityIcons
                  name="email-outline"
                  size={22}
                  color={emailFocused ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
                />
              </View>
              <View
                style={[
                  styles.inputLine,
                  { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  emailFocused && styles.inputLineFocused,
                  emailForm.formState.errors.email && styles.inputLineError,
                ]}
              />
              {emailForm.formState.errors.email && (
                <Text style={styles.errorText}>{emailForm.formState.errors.email.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: COLORS.primary },
          isLoading && styles.continueButtonDisabled,
        ]}
        onPress={emailForm.handleSubmit(onSubmitEmail)}
        disabled={isLoading}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </Text>
        {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Remember your password?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.footerLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Render Step 2: OTP
  const renderOtpStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Enter verification code
        </Text>
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
              { 
                backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', 
                borderColor: digit ? COLORS.primary : isDark ? '#374151' : '#E5E7EB', 
                color: colors.text 
              },
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
        style={[
          styles.continueButton,
          { backgroundColor: COLORS.primary },
          otp.join('').length !== 6 && styles.continueButtonDisabled,
        ]}
        onPress={verifyOtp}
        disabled={otp.join('').length !== 6}
      >
        <Text style={styles.continueButtonText}>Verify Code</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={[styles.resendText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Didn't receive the code?{' '}
        </Text>
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
        <Text style={[styles.changeEmailText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Change email address
        </Text>
      </TouchableOpacity>
    </>
  );

  // Render Step 3: New Password
  const renderPasswordStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Create new password
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Your new password must be different from previously used passwords.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Controller
          control={passwordForm.control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={styles.inputWrapper}>
                <Animated.Text style={[createLabelStyle(newPasswordAnimValue), styles.label]}>
                  New Password
                </Animated.Text>
                <RNTextInput
                  ref={newPasswordRef}
                  style={[styles.input, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => setNewPasswordFocused(true)}
                  onBlur={() => {
                    setNewPasswordFocused(false);
                    onBlur();
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder=""
                  placeholderTextColor="transparent"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons
                    name={showNewPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color={newPasswordFocused ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputLine,
                  { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  newPasswordFocused && styles.inputLineFocused,
                  passwordForm.formState.errors.newPassword && styles.inputLineError,
                ]}
              />
              {passwordForm.formState.errors.newPassword && (
                <Text style={styles.errorText}>{passwordForm.formState.errors.newPassword.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <View style={styles.inputContainer}>
        <Controller
          control={passwordForm.control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={styles.inputWrapper}>
                <Animated.Text style={[createLabelStyle(confirmPasswordAnimValue), styles.label]}>
                  Confirm Password
                </Animated.Text>
                <RNTextInput
                  ref={confirmPasswordRef}
                  style={[styles.input, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => {
                    setConfirmPasswordFocused(false);
                    onBlur();
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder=""
                  placeholderTextColor="transparent"
                  returnKeyType="done"
                  onSubmitEditing={passwordForm.handleSubmit(onSubmitPassword)}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color={confirmPasswordFocused ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputLine,
                  { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  confirmPasswordFocused && styles.inputLineFocused,
                  passwordForm.formState.errors.confirmPassword && styles.inputLineError,
                ]}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <Text style={styles.errorText}>{passwordForm.formState.errors.confirmPassword.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          { backgroundColor: COLORS.primary },
          isLoading && styles.continueButtonDisabled,
        ]}
        onPress={passwordForm.handleSubmit(onSubmitPassword)}
        disabled={isLoading}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Text>
        {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
      </TouchableOpacity>
    </>
  );

  // Render Success
  const renderSuccess = () => (
    <View style={styles.successContent}>
      <View style={[styles.successIconContainer, { backgroundColor: isDark ? '#1E3A2F' : '#ECFDF5' }]}>
        <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
      </View>

      <Text style={[styles.successTitle, { color: colors.text }]}>Password Reset!</Text>
      <Text style={[styles.successSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
        Your password has been reset successfully. You can now log in with your new password.
      </Text>

      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: COLORS.primary }]}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.continueButtonText}>Back to Login</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
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
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepIndicator, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Step {getStepNumber()} of 3
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
        <Animated.View
          style={[
            styles.progressBar,
            { width: progressWidth, backgroundColor: COLORS.primary },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl * 2,
  },
  titleContainer: {
    marginBottom: SPACING.xl * 2,
  },
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
  emailHighlight: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  label: {
    fontFamily: FONTS.medium,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONTS.medium,
    paddingVertical: 8,
  },
  inputLine: {
    height: 1,
  },
  inputLineFocused: {
    height: 2,
    backgroundColor: COLORS.primary,
  },
  inputLineError: {
    height: 2,
    backgroundColor: '#EF4444',
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: '#EF4444',
    marginTop: SPACING.xs,
    fontFamily: FONTS.medium,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: SPACING.xl,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  footerText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  footerLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  // OTP styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 24,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  resendText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  resendLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
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
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  // Success styles
  successWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.xl * 2,
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.regular,
  },
});
