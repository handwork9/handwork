import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Animated,
  Clipboard,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZES, COLORS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { twoFactorService, TwoFactorSetupResponse } from '../../services/twoFactorService';
import { triggerMediumHaptic, triggerSuccessHaptic, triggerErrorHaptic } from '../../utils/haptics';

type RouteParams = {
  TwoFactorSetup: {
    mode: 'enable' | 'disable';
  };
};

const CODE_LENGTH = 6;

export default function TwoFactorSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'TwoFactorSetup'>>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const mode = route.params?.mode || 'enable';
  
  const [step, setStep] = useState<'loading' | 'setup' | 'verify'>('loading');
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (mode === 'enable') {
      generateSecret();
    } else {
      setStep('verify');
    }
  }, [mode]);

  const generateSecret = async () => {
    try {
      const response = await twoFactorService.generateSecret();
      if (response.success && response.data) {
        setSetupData(response.data);
        setStep('setup');
      } else {
        Alert.alert('Error', response.message || 'Failed to generate 2FA secret');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate 2FA secret');
      navigation.goBack();
    }
  };

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
    
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

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

  const handleVerify = async (verificationCode: string) => {
    setIsVerifying(true);
    setError(null);
    triggerMediumHaptic();

    try {
      const response = mode === 'enable'
        ? await twoFactorService.enable(verificationCode)
        : await twoFactorService.disable(verificationCode);

      if (response.success) {
        triggerSuccessHaptic();
        Alert.alert(
          'Success',
          mode === 'enable'
            ? 'Two-factor authentication has been enabled'
            : 'Two-factor authentication has been disabled',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
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
      setError(error.response?.data?.message || 'Verification failed');
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecretToClipboard = () => {
    if (setupData?.secret) {
      Clipboard.setString(setupData.secret);
      setCopiedSecret(true);
      triggerSuccessHaptic();
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const proceedToVerify = () => {
    setStep('verify');
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const currentCode = code.join('');
  const isCodeComplete = currentCode.length === CODE_LENGTH;

  if (step === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {mode === 'enable' ? 'Enable 2FA' : 'Disable 2FA'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Generating secure key...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {mode === 'enable' ? 'Enable 2FA' : 'Disable 2FA'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {step === 'setup' && setupData && (
            <>
              {/* QR Code Section */}
              <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <View style={styles.iconHeader}>
                  <MaterialCommunityIcons name="shield-check" size={32} color={COLORS.primary} />
                </View>
                
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Scan QR Code
                </Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code
                </Text>

                {/* QR Code Image */}
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: setupData.qrCodeDataUrl }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Manual Entry Section */}
              <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Or Enter Manually
                </Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  If you can't scan the QR code, enter this key in your authenticator app
                </Text>

                <TouchableOpacity
                  style={[styles.secretContainer, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
                  onPress={copySecretToClipboard}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secretText, { color: colors.text }]}>
                    {setupData.secret}
                  </Text>
                  <View style={styles.copyIcon}>
                    <Ionicons
                      name={copiedSecret ? 'checkmark' : 'copy-outline'}
                      size={20}
                      color={copiedSecret ? COLORS.primary : colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
                {copiedSecret && (
                  <Text style={styles.copiedText}>Copied to clipboard!</Text>
                )}
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueButton}
                onPress={proceedToVerify}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}

          {step === 'verify' && (
            <>
              {/* Verify Section */}
              <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <View style={styles.iconHeader}>
                  <MaterialCommunityIcons 
                    name={mode === 'enable' ? 'shield-lock' : 'shield-off'} 
                    size={32} 
                    color={mode === 'enable' ? COLORS.primary : COLORS.error} 
                  />
                </View>
                
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {mode === 'enable' ? 'Verify Setup' : 'Confirm Disable'}
                </Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  {mode === 'enable'
                    ? 'Enter the 6-digit code from your authenticator app to complete setup'
                    : 'Enter your authenticator code to disable two-factor authentication'}
                </Text>

                {/* Code Input */}
                <Animated.View 
                  style={[
                    styles.codeContainer,
                    { transform: [{ translateX: shakeAnim }] }
                  ]}
                >
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={[
                        styles.codeInput,
                        {
                          backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
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
                    />
                  ))}
                </Animated.View>

                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  mode === 'disable' && styles.disableButton,
                  (!isCodeComplete || isVerifying) && styles.buttonDisabled,
                ]}
                onPress={() => handleVerify(currentCode)}
                disabled={!isCodeComplete || isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {mode === 'enable' ? 'Enable 2FA' : 'Disable 2FA'}
                  </Text>
                )}
              </TouchableOpacity>

              {mode === 'enable' && (
                <TouchableOpacity
                  style={styles.backToSetupButton}
                  onPress={() => setStep('setup')}
                >
                  <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                  <Text style={[styles.backToSetupText, { color: COLORS.primary }]}>
                    Back to QR Code
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  card: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  secretText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
  },
  copyIcon: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  copiedText: {
    color: COLORS.primary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  codeInput: {
    width: 48,
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
    justifyContent: 'center',
    gap: SPACING.xs,
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
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disableButton: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backToSetupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backToSetupText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
