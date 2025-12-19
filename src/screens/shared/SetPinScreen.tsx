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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import pinService from '../../services/pinService';

const SECURITY_SETTINGS_KEY = '@security_settings';

type PinStep = 'create' | 'confirm';

const PIN_LENGTH = 4;

type SetPinRouteParams = {
  SetPin: {
    onSuccess?: () => void;
    returnToSecurity?: boolean;
  };
};

export default function SetPinScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SetPinRouteParams, 'SetPin'>>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<PinStep>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const scrollY = useRef(new Animated.Value(0)).current;

  const getStepTitle = () => {
    switch (step) {
      case 'create': return 'Create Your PIN';
      case 'confirm': return 'Confirm Your PIN';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'create': return 'Choose a 4-digit PIN to secure your account';
      case 'confirm': return 'Re-enter your PIN to confirm';
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

  const handlePinChange = (value: string, type: PinStep) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH);
    setError('');

    switch (type) {
      case 'create':
        setNewPin(numericValue);
        if (numericValue.length === PIN_LENGTH) {
          const validation = validatePin(numericValue);
          if (!validation.valid) {
            setError(validation.error || 'Invalid PIN');
            setNewPin('');
          } else {
            setTimeout(() => setStep('confirm'), 300);
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
      const result = await pinService.setPin(newPin);
      console.log('PIN set result:', result);
      
      if (result.success) {
        // Enable PIN Lock in security settings after successfully setting PIN
        try {
          const stored = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
          const settings = stored ? JSON.parse(stored) : {};
          settings.pinLock = true;
          settings.pinSetSuccess = true; // Flag for SecurityScreen to detect
          await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
          console.log('Saved to AsyncStorage:', settings);
        } catch (storageError) {
          console.error('Failed to save PIN Lock setting:', storageError);
        }
        
        // Show success alert then navigate back
        Alert.alert(
          'PIN Created',
          'Your transaction PIN has been set successfully.',
          [{ 
            text: 'OK', 
            onPress: () => {
              console.log('Alert OK pressed, navigating back');
              navigation.goBack();
            }
          }]
        );
      } else {
        // Check if PIN is already set - if so, enable PIN Lock anyway
        if (result.message.toLowerCase().includes('already set')) {
          console.log('PIN already exists, enabling PIN Lock');
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
            'PIN Already Set',
            'Your transaction PIN is already configured. PIN Lock has been enabled.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          console.log('PIN set failed:', result.message);
          setError(result.message);
          setIsSubmitting(false);
        }
      }
    } catch (error) {
      console.error('PIN set error:', error);
      setError('Failed to set PIN. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'create') {
      navigation.goBack();
    } else {
      setStep('create');
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
    const currentValue = step === 'create' ? newPin : confirmPin;

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

  const currentValue = step === 'create' ? newPin : confirmPin;

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
            <Text style={[styles.pageTitle, { color: colors.text }]}>Set PIN</Text>
            <Text style={styles.pageSubtitle}>Create a transaction PIN for security</Text>
          </View>

          {/* Step Content */}
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7' }]}>
              <Ionicons name="keypad" size={32} color="#16A34A" />
            </View>
            
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

          {/* Keypad */}
          {renderKeypad()}

          {/* Security Info */}
          <View style={[styles.infoContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text style={[styles.infoText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
              Your PIN will be required for wallet transactions and security-sensitive actions.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={[styles.loadingText, { color: colors.text }]}>Setting PIN...</Text>
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
    marginTop: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.regular,
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
