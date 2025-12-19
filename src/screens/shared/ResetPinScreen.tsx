import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, SPACING } from '../../constants/theme';
import pinService from '../../services/pinService';

const SECURITY_SETTINGS_KEY = '@security_settings';

type ResetStep = 'password' | 'newPin' | 'confirmPin';

const PIN_LENGTH = 4;

export default function ResetPinScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<ResetStep>('password');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const passwordInputRef = useRef<TextInput>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const getStepTitle = () => {
    switch (step) {
      case 'password': return 'Verify Your Identity';
      case 'newPin': return 'Create New PIN';
      case 'confirmPin': return 'Confirm New PIN';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'password': return 'Enter your account password to reset your PIN';
      case 'newPin': return 'Choose a new 4-digit PIN';
      case 'confirmPin': return 'Re-enter your new PIN to confirm';
    }
  };

  const validatePin = (pin: string): { valid: boolean; error?: string } => {
    // Check for all same digits (e.g., 1111, 0000)
    if (/^(\d)\1{3}$/.test(pin)) {
      return { valid: false, error: 'PIN cannot be all same digits' };
    }
    
    // Check for sequential numbers
    const sequential = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
    if (sequential.includes(pin)) {
      return { valid: false, error: 'PIN cannot be sequential numbers' };
    }
    
    return { valid: true };
  };

  const handlePasswordSubmit = () => {
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    setError('');
    setStep('newPin');
  };

  const handlePinChange = (value: string, type: 'newPin' | 'confirmPin') => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
    setError('');

    if (type === 'newPin') {
      setNewPin(numericValue);
      if (numericValue.length === PIN_LENGTH) {
        const validation = validatePin(numericValue);
        if (!validation.valid) {
          setError(validation.error || 'Invalid PIN');
          setNewPin('');
        } else {
          setTimeout(() => setStep('confirmPin'), 300);
        }
      }
    } else {
      setConfirmPin(numericValue);
      if (numericValue.length === PIN_LENGTH) {
        if (numericValue !== newPin) {
          setError('PINs do not match. Please try again.');
          setConfirmPin('');
        } else {
          handleSubmit();
        }
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await pinService.resetPin(password, newPin);
      
      if (result.success) {
        // Enable PIN Lock after successfully resetting PIN
        try {
          const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
          const settings = stored ? JSON.parse(stored) : {};
          settings.pinLock = true;
          settings.pinSetSuccess = true;
          await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
        } catch (storageError) {
          console.error('Failed to save PIN Lock setting:', storageError);
        }
        
        Alert.alert(
          'PIN Reset Successful',
          'Your transaction PIN has been reset successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        if (result.message.toLowerCase().includes('password')) {
          setStep('password');
          setPassword('');
        }
        setError(result.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      setError('Failed to reset PIN. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'password':
        navigation.goBack();
        break;
      case 'newPin':
        setStep('password');
        setNewPin('');
        setError('');
        break;
      case 'confirmPin':
        setStep('newPin');
        setConfirmPin('');
        setError('');
        break;
    }
  };

  const renderPinDots = (pin: string) => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(PIN_LENGTH)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              {
                backgroundColor: index < pin.length ? colors.primary : 'transparent',
                borderColor: index < pin.length ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = (currentPin: string, onPinChange: (value: string) => void) => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ];

    return (
      <View style={styles.keypadContainer}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.keypadKey} />;
              }
              
              if (key === 'delete') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.keypadKey}
                    onPress={() => onPinChange(currentPin.slice(0, -1))}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="backspace-outline" size={24} color={colors.text} />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={[styles.keypadKey, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}
                  onPress={() => {
                    if (currentPin.length < PIN_LENGTH) {
                      onPinChange(currentPin + key);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.keypadKeyText, { color: colors.text }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Reset PIN</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {['password', 'newPin', 'confirmPin'].map((s, index) => (
              <View key={s} style={styles.stepDotContainer}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        step === s
                          ? colors.primary
                          : ['password', 'newPin', 'confirmPin'].indexOf(step) > index
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                />
                {index < 2 && (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor:
                          ['password', 'newPin', 'confirmPin'].indexOf(step) > index
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Title and description */}
          <View style={styles.titleContainer}>
            <Ionicons
              name={step === 'password' ? 'lock-closed' : 'keypad'}
              size={48}
              color={colors.primary}
              style={styles.icon}
            />
            <Text style={[styles.title, { color: colors.text }]}>{getStepTitle()}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {getStepDescription()}
            </Text>
          </View>

          {/* Error message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Password step */}
          {step === 'password' && (
            <View style={styles.passwordContainer}>
              <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#F9F9F9' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  { backgroundColor: password.trim() ? colors.primary : colors.border },
                ]}
                onPress={handlePasswordSubmit}
                disabled={!password.trim()}
              >
                <Text style={[styles.continueButtonText, { color: password.trim() ? '#FFFFFF' : colors.textSecondary }]}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* New PIN step */}
          {step === 'newPin' && (
            <View style={styles.pinContainer}>
              {renderPinDots(newPin)}
              {renderKeypad(newPin, (value) => handlePinChange(value, 'newPin'))}
            </View>
          )}

          {/* Confirm PIN step */}
          {step === 'confirmPin' && (
            <View style={styles.pinContainer}>
              {isSubmitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Resetting your PIN...
                  </Text>
                </View>
              ) : (
                <>
                  {renderPinDots(confirmPin)}
                  {renderKeypad(confirmPin, (value) => handlePinChange(value, 'confirmPin'))}
                </>
              )}
            </View>
          )}
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  stepDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  icon: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  passwordContainer: {
    gap: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 56,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  continueButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  pinContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: SPACING.xl,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  keypadContainer: {
    marginTop: SPACING.lg,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  keypadKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.md,
  },
  keypadKeyText: {
    fontSize: 28,
    fontFamily: FONTS.semiBold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
});
