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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import pinService from '../../services/pinService';

type PinStep = 'current' | 'new' | 'confirm';

const PIN_LENGTH = 4;

export default function ChangePinScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<PinStep>('current');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const scrollY = useRef(new Animated.Value(0)).current;

  const getStepTitle = () => {
    switch (step) {
      case 'current': return 'Enter Current PIN';
      case 'new': return 'Create New PIN';
      case 'confirm': return 'Confirm New PIN';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'current': return 'Enter your current 4-digit PIN to continue';
      case 'new': return 'Choose a new 4-digit PIN for your account';
      case 'confirm': return 'Re-enter your new PIN to confirm';
    }
  };

  const handlePinChange = async (value: string, type: PinStep) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
    setError('');

    switch (type) {
      case 'current':
        setCurrentPin(numericValue);
        if (numericValue.length === PIN_LENGTH) {
          // Verify current PIN using pinService
          const result = await pinService.verifyPin(numericValue);
          setTimeout(() => {
            if (result.success) {
              setStep('new');
            } else {
              setError(result.message || 'Incorrect PIN. Please try again.');
              setCurrentPin('');
            }
          }, 300);
        }
        break;
      case 'new':
        setNewPin(numericValue);
        if (numericValue.length === PIN_LENGTH) {
          if (numericValue === currentPin) {
            setError('New PIN must be different from current PIN');
            setNewPin('');
          } else if (/^(\d)\1{3}$/.test(numericValue)) {
            setError('PIN cannot be all same digits');
            setNewPin('');
          } else if (/^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)$/.test(numericValue)) {
            setError('PIN cannot be sequential numbers');
            setNewPin('');
          } else {
            setStep('confirm');
          }
        }
        break;
      case 'confirm':
        setConfirmPin(numericValue);
        if (numericValue.length === PIN_LENGTH) {
          if (numericValue !== newPin) {
            setError('PINs do not match. Please try again.');
            setConfirmPin('');
          } else {
            handleSubmit();
          }
        }
        break;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await pinService.changePin(currentPin, newPin);
      
      if (result.success) {
        Alert.alert(
          'PIN Changed',
          'Your PIN has been successfully updated.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to change PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'current') {
      navigation.goBack();
    } else if (step === 'new') {
      setStep('current');
      setNewPin('');
      setError('');
    } else {
      setStep('new');
      setConfirmPin('');
      setError('');
    }
  };

  const renderPinDots = (pin: string) => {
    return (
      <View style={styles.pinDotsContainer}>
        {Array.from({ length: PIN_LENGTH }).map((_, index) => {
          const isFilled = index < pin.length;
          return (
            <View
              key={index}
              style={[
                styles.pinDot,
                { backgroundColor: isDark ? '#3C3C3E' : '#E5E7EB' },
                isFilled && styles.pinDotFilled,
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderKeypad = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ];
    const currentValue = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin;

    return (
      <View style={styles.keypadContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.keypadKeyEmpty} />;
              }

              if (key === 'delete') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.keypadKey}
                    onPress={() => {
                      if (currentValue.length > 0) {
                        handlePinChange(currentValue.slice(0, -1), step);
                      }
                    }}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="backspace-outline" size={26} color={isDark ? colors.text : '#1F2937'} />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.keypadKey}
                  onPress={() => handlePinChange(currentValue + key, step)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.keypadKeyText, { color: isDark ? colors.text : '#1F2937' }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const currentValue = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70 }]}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Page Title */}
          <View style={styles.pageTitleSection}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Change PIN</Text>
            <Text style={styles.pageSubtitle}>Update your transaction PIN</Text>
          </View>

          {/* Step Content */}
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{getStepTitle()}</Text>
            <Text style={[styles.stepDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {getStepDescription()}
            </Text>

            {/* Hidden Input */}
            <TextInput
              style={styles.hiddenInput}
              keyboardType="number-pad"
              maxLength={PIN_LENGTH}
              value={currentValue}
              onChangeText={(value) => handlePinChange(value, step)}
              autoFocus
            />

            {/* PIN Dots */}
            {renderPinDots(currentValue)}

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Forgot PIN Link - always visible for debugging */}
          <TouchableOpacity 
            style={styles.forgotLink}
            onPress={() => {
              console.log('Forgot PIN tapped');
              (navigation as any).navigate('ResetPin');
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color="#16A34A" style={{ marginRight: 6 }} />
            <Text style={styles.forgotLinkText}>Forgot your PIN?</Text>
          </TouchableOpacity>

          {/* Keypad */}
          {renderKeypad()}

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={[styles.loadingText, { color: colors.text }]}>Updating PIN...</Text>
          </View>
        </View>
      )}
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
  scrollContent: {
    paddingHorizontal: 24,
  },
  pageTitleSection: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  stepContent: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 80,
  },
  stepTitle: {
    fontSize: 20,
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: FONTS.regular,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  pinDotFilled: {
    backgroundColor: '#16A34A',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontFamily: FONTS.regular,
  },
  keypadContainer: {
    gap: 12,
    marginBottom: 24,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  keypadKey: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadKeyEmpty: {
    width: 72,
    height: 72,
  },
  keypadKeyText: {
    fontSize: 28,
    fontFamily: FONTS.regular,
  },
  forgotLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginVertical: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  forgotLinkText: {
    fontSize: 16,
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    fontFamily: FONTS.semiBold,
  },
});
