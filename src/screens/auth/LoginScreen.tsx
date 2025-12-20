import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  TextInput as RNTextInput,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AuthStackParamList } from '../../types';
import { useAppDispatch } from '../../store';
import { setAuth } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../../constants/config';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type FormData = yup.InferType<typeof schema>;

export default function LoginScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const emailAnimValue = useRef(new Animated.Value(0)).current;
  const passwordAnimValue = useRef(new Animated.Value(0)).current;

  // Google Sign-In configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  useEffect(() => {
    Animated.timing(emailAnimValue, {
      toValue: emailFocused || emailValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused, emailValue]);

  useEffect(() => {
    Animated.timing(passwordAnimValue, {
      toValue: passwordFocused || passwordValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused, passwordValue]);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication?.idToken);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Google Sign-In failed. Please try again.');
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string | undefined) => {
    if (!idToken) {
      Alert.alert('Error', 'Failed to get Google ID token');
      setIsGoogleLoading(false);
      return;
    }

    try {
      const result = await authService.googleLogin(idToken);

      if (result.success && result.data) {
        dispatch(
          setAuth({
            user: result.data.user,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
          })
        );
      } else {
        Alert.alert('Error', result.message || 'Google Sign-In failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Google Sign-In failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onGoogleSignIn = () => {
    setIsGoogleLoading(true);
    promptAsync();
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        if (authService.requiresTwoFactor(response.data)) {
          navigation.navigate('TwoFactorVerification', {
            tempToken: response.data.tempToken,
          });
        } else {
          dispatch(setAuth({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          }));
        }
      } else {
        Alert.alert('Login Failed', response.message || 'Please check your credentials');
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'An error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
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
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Sign in to continue to Handwork
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
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
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
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
                      errors.email && styles.inputLineError,
                    ]}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <View style={styles.inputWrapper}>
                    <Animated.Text style={[createLabelStyle(passwordAnimValue), styles.label]}>
                      Password
                    </Animated.Text>
                    <RNTextInput
                      ref={passwordRef}
                      style={[styles.input, { color: colors.text }]}
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => {
                        setPasswordFocused(false);
                        onBlur();
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder=""
                      placeholderTextColor="transparent"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye' : 'eye-off'}
                        size={22}
                        color={passwordFocused ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
                      />
                    </TouchableOpacity>
                  </View>
                  <View
                    style={[
                      styles.inputLine,
                      { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                      passwordFocused && styles.inputLineFocused,
                      errors.password && styles.inputLineError,
                    ]}
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  )}
                </>
              )}
            />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: COLORS.primary },
              isLoading && styles.continueButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Signing in...' : 'Login'}
            </Text>
            {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
            <Text style={[styles.dividerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
          </View>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <TouchableOpacity
              style={[
                styles.socialButton, 
                { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' },
                (isGoogleLoading || !request) && styles.socialButtonDisabled
              ]}
              activeOpacity={0.7}
              onPress={onGoogleSignIn}
              disabled={isGoogleLoading || !request}
            >
              <Ionicons name="logo-google" size={22} color="#EA4335" />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                {isGoogleLoading ? 'Signing in...' : 'Google'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-apple" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Phone Login Option */}
          <TouchableOpacity
            style={[styles.phoneLoginButton, { borderColor: isDark ? '#374151' : '#E5E7EB' }]}
            onPress={() => navigation.navigate('PhoneLogin')}
            activeOpacity={0.7}
          >
            <Ionicons name="phone-portrait-outline" size={22} color={COLORS.primary} />
            <Text style={[styles.phoneLoginText, { color: colors.text }]}>
              Login with Phone OTP
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignupRole')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleContainer: {
    marginBottom: SPACING.xl * 2,
    marginTop: SPACING.xl,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  socialSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: SPACING.lg,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  phoneLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: SPACING.xl,
  },
  phoneLoginText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
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
});
