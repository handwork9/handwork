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
  Dimensions,
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
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '../../constants/config';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const { width } = Dimensions.get('window');

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type FormData = yup.InferType<typeof schema>;

// Floating Label Input Component
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  icon: string;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
}

const FloatingInput = ({
  label,
  value,
  onChangeText,
  onBlur,
  icon,
  rightIcon,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
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
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', '#16A34A'],
    }),
    backgroundColor: isDark ? colors.background : '#F9FAFB',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={styles.floatingInputContainer}>
      <View style={[styles.inputRow, { backgroundColor: isDark ? colors.background : '#F9FAFB' }, error && styles.inputRowError]}>
        <View style={styles.inputContent}>
          <Animated.Text style={labelStyle}>{label}</Animated.Text>
          <RNTextInput
            style={[
              styles.floatingInput,
              { color: colors.text },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur();
            }}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            placeholderTextColor="transparent"
          />
        </View>
        <View style={styles.inputIcons}>
          {rightIcon || (
            <MaterialCommunityIcons
              name={icon as any}
              size={22}
              color={isFocused ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
            />
          )}
        </View>
      </View>
      <View style={[styles.inputLine, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }, isFocused && styles.inputLineFocused, error && styles.inputLineError]} />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default function LoginScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Google Sign-In configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        // Check if 2FA is required
        if (authService.requiresTwoFactor(response.data)) {
          // Navigate to 2FA verification screen with temp token
          navigation.navigate('TwoFactorVerification', {
            tempToken: response.data.tempToken,
          });
        } else {
          // Normal login - no 2FA required
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 180, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.contentWrapper,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                Welcome back
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Sign in to continue to Handwork
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="email-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FloatingInput
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    icon="lock-outline"
                    secureTextEntry={!showPassword}
                    error={errors.password?.message}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                          name={showPassword ? 'eye' : 'eye-off'}
                          size={22}
                          color={isDark ? '#6B7280' : '#9CA3AF'}
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleSubmit(onSubmit)}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing in...' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>

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
              <Ionicons name="phone-portrait-outline" size={22} color="#16A34A" />
              <Text style={[styles.phoneLoginText, { color: colors.text }]}>
                Login with Phone OTP
              </Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  contentWrapper: {
    flex: 1,
  },
  welcomeSection: {
    marginBottom: 48,
  },
  welcomeTitle: {
    fontSize: 32,
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  formSection: {
    marginBottom: 32,
  },
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
  inputLineError: {
    backgroundColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  socialSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
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
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  phoneLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 32,
  },
  phoneLoginText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  footerLink: {
    fontSize: 15,
    color: '#16A34A',
    fontFamily: FONTS.bold,
  },
});
