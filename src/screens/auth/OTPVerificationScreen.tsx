import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from '../../types';
import { Button } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic, triggerSuccessHaptic, triggerErrorHaptic } from '../../utils/haptics';
import { authService } from '../../services/authService';
import { useAppDispatch } from '../../store';
import { setAuth } from '../../store/slices/authSlice';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;

const OTP_LENGTH = 6;

export default function OTPVerificationScreen({ navigation, route }: Props) {
  const { phone, mode = 'verify' } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpId, setOtpId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingOTP, setIsRequestingOTP] = useState(mode === 'login');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const otpContainerScale = useRef(new Animated.Value(0.9)).current;
  const otpContainerOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const inputScales = useRef(Array(OTP_LENGTH).fill(0).map(() => new Animated.Value(1))).current;

  // Request OTP on mount for login mode
  useEffect(() => {
    if (mode === 'login') {
      requestOTPForLogin();
    }
  }, []);

  const requestOTPForLogin = async () => {
    setIsRequestingOTP(true);
    try {
      const response = await authService.requestLoginOTP(phone);
      if (response.success) {
        setOtpId(response.data.otpId);
        setResendCountdown(60);
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
      navigation.goBack();
    } finally {
      setIsRequestingOTP(false);
    }
  };

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(headerTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(otpContainerScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(otpContainerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);
  }, []);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const animateInputPress = (index: number) => {
    Animated.sequence([
      Animated.timing(inputScales[index], {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(inputScales[index], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleOtpChange = (value: string, index: number) => {
    triggerHaptic();
    animateInputPress(index);
    setIsError(false);
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === OTP_LENGTH - 1 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        Keyboard.dismiss();
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      triggerHaptic();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setIsError(true);
      triggerShake();
      triggerErrorHaptic();
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login' && otpId) {
        // Login mode - verify OTP and login
        const response = await authService.verifyLoginOTP(otpId, otpCode);
        if (response.success) {
          // Check if 2FA is required
          if (authService.requiresTwoFactor(response.data)) {
            navigation.replace('TwoFactorVerification', {
              tempToken: response.data.tempToken,
            });
            return;
          }
          
          // Success - login the user
          const loginData = response.data as {
            user: any;
            accessToken: string;
            refreshToken: string;
            isNewUser?: boolean;
          };
          
          // Check if this is a new user who needs to complete registration
          if (loginData.isNewUser) {
            setIsSuccess(true);
            triggerSuccessHaptic();
            Animated.spring(successScale, {
              toValue: 1,
              tension: 50,
              friction: 3,
              useNativeDriver: true,
            }).start();
            
            // Redirect to signup to complete registration
            setTimeout(() => {
              navigation.replace('Signup', { 
                phone: phone,
                fromPhoneLogin: true,
                accessToken: loginData.accessToken,
                refreshToken: loginData.refreshToken,
                userId: loginData.user?.id,
              });
            }, 1500);
            return;
          }
          
          setIsSuccess(true);
          triggerSuccessHaptic();
          Animated.spring(successScale, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }).start();
          
          // Dispatch auth state
          dispatch(setAuth({
            user: loginData.user,
            accessToken: loginData.accessToken,
            refreshToken: loginData.refreshToken,
          }));
        } else {
          setIsError(true);
          triggerShake();
          triggerErrorHaptic();
          Alert.alert('Invalid OTP', response.message || 'The code you entered is incorrect');
        }
      } else {
        // Verify mode - just verify phone number
        const response = await authService.verifyOTP(phone, otpCode);
        if (response.success && response.data.verified) {
          // Success animation
          setIsSuccess(true);
          triggerSuccessHaptic();
          Animated.spring(successScale, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }).start();
          
          setTimeout(() => {
            navigation.goBack();
          }, 1500);
        } else {
          setIsError(true);
          triggerShake();
          triggerErrorHaptic();
          Alert.alert('Invalid OTP', 'The code you entered is incorrect');
        }
      }
    } catch (error: any) {
      setIsError(true);
      triggerShake();
      triggerErrorHaptic();
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      if (!isSuccess) {
        setIsLoading(false);
      }
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    
    triggerHaptic();
    try {
      if (mode === 'login') {
        const response = await authService.requestLoginOTP(phone);
        if (response.success && response.data?.otpId) {
          setOtpId(response.data.otpId);
        }
      } else {
        await authService.sendOTP(phone);
      }
      setResendCountdown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      setIsError(false);
      inputRefs.current[0]?.focus();
      Alert.alert('OTP Sent', 'A new code has been sent to your phone');
    } catch (error: any) {
      triggerErrorHaptic();
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  const formatPhone = (phoneNumber: string) => {
    // Format phone number for display
    if (phoneNumber.length === 11) {
      return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`;
    }
    return phoneNumber;
  };

  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <LinearGradient
          colors={['#10B981', '#059669', '#047857']}
          style={styles.successContainer}
        >
          <Animated.View
            style={[
              styles.successCheckContainer,
              { transform: [{ scale: successScale }] },
            ]}
          >
            <View style={styles.successCheckCircle}>
              <Ionicons name="checkmark" size={64} color="#10B981" />
            </View>
          </Animated.View>
          <Text style={styles.successTitle}>Verified! ✨</Text>
          <Text style={styles.successSubtitle}>
            Your phone number has been verified successfully
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => {
            triggerHaptic();
            navigation.goBack();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#1E3A5F', '#0F172A'] : ['#EFF6FF', '#DBEAFE']}
            style={styles.iconContainer}
          >
            <Ionicons
              name="shield-checkmark"
              size={48}
              color={isDark ? '#60A5FA' : '#3B82F6'}
            />
          </LinearGradient>
          
          <Text style={[styles.title, { color: colors.text }]}>
            Verify your phone
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've sent a {OTP_LENGTH}-digit code to
          </Text>
          <View style={styles.phoneContainer}>
            <Ionicons
              name="call"
              size={16}
              color={COLORS.primary}
              style={styles.phoneIcon}
            />
            <Text style={styles.phone}>{formatPhone(phone)}</Text>
          </View>
        </Animated.View>

        {/* OTP Input Section */}
        <Animated.View
          style={[
            styles.otpSection,
            {
              opacity: otpContainerOpacity,
              transform: [
                { scale: otpContainerScale },
                { translateX: shakeAnim },
              ],
            },
          ]}
        >
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <Animated.View
                key={index}
                style={{ transform: [{ scale: inputScales[index] }] }}
              >
                <RNTextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    focusedIndex === index && styles.otpInputFocused,
                    digit && styles.otpInputFilled,
                    isError && styles.otpInputError,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textContentType="oneTimeCode"
                  accessibilityLabel={`OTP digit ${index + 1}`}
                  selectionColor={COLORS.primary}
                />
              </Animated.View>
            ))}
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            {otp.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  digit && styles.progressDotFilled,
                  isError && digit && styles.progressDotError,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Action Section */}
        <Animated.View style={[styles.actionSection, { opacity: buttonOpacity }]}>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleVerify()}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyButtonGradient}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={styles.loadingDot} />
                  <Text style={styles.verifyButtonText}>Verifying...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.verifyButtonText}>Verify Code</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={[styles.resendCard, { backgroundColor: colors.card }]}>
            <View style={styles.resendContent}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                Didn't receive the code?
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCountdown > 0}
              style={[
                styles.resendButton,
                resendCountdown > 0 && styles.resendButtonDisabled,
              ]}
              activeOpacity={0.7}
            >
              {resendCountdown > 0 ? (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>{resendCountdown}s</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.resendButtonGradient}
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.resendButtonText}>Resend</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons
              name="lock-closed"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.securityText, { color: colors.textSecondary }]}>
              Your code expires in 10 minutes
            </Text>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  phoneIcon: {
    marginRight: SPACING.xs,
  },
  phone: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  otpSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  otpInput: {
    width: 52,
    height: 64,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.lg,
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    ...SHADOWS.small,
  },
  otpInputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2.5,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  otpInputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotFilled: {
    backgroundColor: COLORS.primary,
  },
  progressDotError: {
    backgroundColor: '#EF4444',
  },
  actionSection: {
    flex: 1,
  },
  verifyButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  verifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 4,
    gap: SPACING.sm,
  },
  verifyButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  resendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  resendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resendText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  resendButton: {
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.round,
  },
  resendButtonDisabled: {
    opacity: 1,
  },
  resendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 4,
  },
  resendButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  countdownContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  countdownText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: '#6B7280',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  securityText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  successCheckContainer: {
    marginBottom: SPACING.xl,
  },
  successCheckCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});
