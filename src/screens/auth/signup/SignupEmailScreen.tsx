import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TextInput as RNTextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupEmail'>;

const { width } = Dimensions.get('window');

export default function SignupEmailScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const inputRef = useRef<RNTextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Auto focus input
    setTimeout(() => inputRef.current?.focus(), 300);
    
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || email ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, email]);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleContinue = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    navigation.navigate('SignupPhone', {
      role,
      email: email.trim().toLowerCase(),
    });
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: 0,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', COLORS.primary],
    }),
    backgroundColor: isDark ? colors.background : '#F2F2F7',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '14.28%'], // Step 1 of 7
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
        <Text style={[styles.stepIndicator, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Step 1 of 7
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
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            What's your email?
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            We'll send you a verification code to confirm your account
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Animated.Text style={[labelStyle, styles.label]}>
              Email address
            </Animated.Text>
            <RNTextInput
              ref={inputRef}
              style={[
                styles.input,
                { color: colors.text },
                error && styles.inputError,
              ]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              placeholder=""
              placeholderTextColor="transparent"
            />
            {email.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setEmail('')}
              >
                <Ionicons name="close-circle" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
              </TouchableOpacity>
            )}
          </View>
          <View
            style={[
              styles.inputLine,
              { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
              isFocused && styles.inputLineFocused,
              error && styles.inputLineError,
            ]}
          />
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: COLORS.primary },
              !email && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!email}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: COLORS.primary }]}>
                Log in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  inputError: {
    color: '#EF4444',
  },
  clearButton: {
    padding: 4,
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
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.xl,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  loginText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  loginLink: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
});
