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
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupPassword'>;

export default function SignupPasswordScreen({ navigation, route }: Props) {
  const { role, email, phone } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const passwordInputRef = useRef<RNTextInput>(null);
  const confirmInputRef = useRef<RNTextInput>(null);
  const passwordAnimValue = useRef(new Animated.Value(0)).current;
  const confirmAnimValue = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => passwordInputRef.current?.focus(), 300);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(passwordAnimValue, {
      toValue: passwordFocused || password ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused, password]);

  useEffect(() => {
    Animated.timing(confirmAnimValue, {
      toValue: confirmFocused || confirmPassword ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [confirmFocused, confirmPassword]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength += 1;
    if (pwd.length >= 8) strength += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 1;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#EF4444', '#F59E0B', '#FBBF24', '#84CC16', '#22C55E'];

  const handleContinue = () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    navigation.navigate('SignupPersonalInfo', {
      role,
      email,
      phone,
      password,
    });
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['28.56%', '42.84%'], // Step 3 of 7
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
          Step 3 of 7
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
            Create a password
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Choose a strong password to protect your account
          </Text>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Animated.Text style={[createLabelStyle(passwordAnimValue), styles.label]}>
              Password
            </Animated.Text>
            <RNTextInput
              ref={passwordInputRef}
              style={[styles.input, { color: colors.text }]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder=""
              placeholderTextColor="transparent"
              returnKeyType="next"
              onSubmitEditing={() => confirmInputRef.current?.focus()}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.inputLine,
              { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
              passwordFocused && styles.inputLineFocused,
            ]}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor: i <= passwordStrength 
                          ? strengthColors[passwordStrength - 1] 
                          : isDark ? '#374151' : '#E5E7EB',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  styles.strengthText,
                  { color: passwordStrength > 0 ? strengthColors[passwordStrength - 1] : '#9CA3AF' },
                ]}
              >
                {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Animated.Text style={[createLabelStyle(confirmAnimValue), styles.label]}>
              Confirm Password
            </Animated.Text>
            <RNTextInput
              ref={confirmInputRef}
              style={[styles.input, { color: colors.text }]}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError('');
              }}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder=""
              placeholderTextColor="transparent"
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.inputLine,
              { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
              confirmFocused && styles.inputLineFocused,
              confirmPassword && password !== confirmPassword && styles.inputLineError,
            ]}
          />
          {confirmPassword && password !== confirmPassword && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}
        </View>

        {error ? (
          <Text style={styles.mainErrorText}>{error}</Text>
        ) : null}

        {/* Password Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={[styles.requirementsTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Password requirements:
          </Text>
          <View style={styles.requirementItem}>
            <Ionicons
              name={password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={password.length >= 6 ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
            />
            <Text style={[styles.requirementText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              At least 6 characters
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons
              name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={/[A-Z]/.test(password) ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
            />
            <Text style={[styles.requirementText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              One uppercase letter
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons
              name={/[0-9]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={/[0-9]/.test(password) ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
            />
            <Text style={[styles.requirementText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              One number
            </Text>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: COLORS.primary },
              (!password || !confirmPassword || password !== confirmPassword) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!password || !confirmPassword || password !== confirmPassword}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
    marginBottom: SPACING.xl,
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
    marginBottom: SPACING.lg,
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
  eyeButton: {
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
  mainErrorText: {
    fontSize: FONT_SIZES.sm,
    color: '#EF4444',
    fontFamily: FONTS.medium,
    marginBottom: SPACING.md,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  requirementsContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderRadius: 12,
  },
  requirementsTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  requirementText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
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
});
