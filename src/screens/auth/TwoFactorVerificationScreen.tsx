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
  TextInput,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../types';
import { useAppDispatch } from '../../store';
import { setAuth } from '../../store/slices/authSlice';
import { twoFactorService } from '../../services/twoFactorService';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { triggerMediumHaptic, triggerSuccessHaptic, triggerErrorHaptic } from '../../utils/haptics';

type Props = NativeStackScreenProps<AuthStackParamList, 'TwoFactorVerification'>;

const CODE_LENGTH = 6;

export default function TwoFactorVerificationScreen({ navigation, route }: Props) {
  const { tempToken } = route.params;
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

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
    
    // Auto focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  const shakeInputs = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleCodeChange = (value: string, index: number) => {
    setError(null);
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join('');
      if (fullCode.length === CODE_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    const pastedCode = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (pastedCode.length === CODE_LENGTH) {
      const newCode = pastedCode.split('');
      setCode(newCode);
      handleVerify(pastedCode);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setIsLoading(true);
    setError(null);
    triggerMediumHaptic();

    try {
      const response = await twoFactorService.verifyLogin(tempToken, verificationCode);

      if (response.success && response.data) {
        triggerSuccessHaptic();
        dispatch(setAuth({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        }));
      } else {
        triggerErrorHaptic();
        shakeInputs();
        setError(response.message || 'Invalid verification code');
        setCode(new Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      triggerErrorHaptic();
      shakeInputs();
      setError(error.response?.data?.message || 'Verification failed. Please try again.');
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const currentCode = code.join('');
  const isCodeComplete = currentCode.length === CODE_LENGTH;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
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
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1F2937' : '#E8F5E9' }]}>
              <MaterialCommunityIcons
                name="shield-lock"
                size={48}
                color={COLORS.primary}
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              Two-Factor Authentication
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Enter the 6-digit code from your authenticator app
            </Text>

            {/* Code Input */}
            <Animated.View 
              style={[
                styles.codeContainer,
                { transform: [{ translateX: shakeAnim }] }
              ]}
            >
              {code.map((digit, index) => (
                <View key={index} style={styles.inputWrapper}>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.codeInput,
                      {
                        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                        borderColor: error
                          ? COLORS.error
                          : digit
                          ? COLORS.primary
                          : isDark
                          ? '#374151'
                          : '#E5E7EB',
                        color: colors.text,
                      },
                    ]}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    onFocus={() => setError(null)}
                  />
                </View>
              ))}
            </Animated.View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!isCodeComplete || isLoading) && styles.verifyButtonDisabled,
              ]}
              onPress={() => handleVerify(currentCode)}
              disabled={!isCodeComplete || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Login</Text>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text style={[styles.helpText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Open your authenticator app (Google Authenticator, Authy, etc.) 
                and enter the code shown for Handwork
              </Text>
            </View>

            {/* Alternative Login */}
            <TouchableOpacity
              style={styles.alternativeButton}
              onPress={handleGoBack}
            >
              <Text style={[styles.alternativeText, { color: COLORS.primary }]}>
                Use different account
              </Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    flex: 1,
    maxWidth: 50,
  },
  codeInput: {
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
  },
  verifyButton: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  alternativeButton: {
    paddingVertical: SPACING.md,
  },
  alternativeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
