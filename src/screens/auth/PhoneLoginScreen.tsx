import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { triggerHaptic, triggerErrorHaptic } from '../../utils/haptics';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

export default function PhoneLoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [phone, setPhone] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const phoneRef = useRef<RNTextInput>(null);
  const phoneAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => phoneRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    Animated.timing(phoneAnimValue, {
      toValue: phoneFocused || phone ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [phoneFocused, phone]);

  const formatPhoneNumber = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.startsWith('234') && cleaned.length > 10) {
      cleaned = '0' + cleaned.slice(3);
    }
    
    const limited = cleaned.slice(0, 11);
    
    if (limited.length <= 4) {
      return limited;
    } else if (limited.length <= 7) {
      return `${limited.slice(0, 4)} ${limited.slice(4)}`;
    } else {
      return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    triggerHaptic();
    setPhone(formatPhoneNumber(text));
  };

  const getCleanPhoneNumber = () => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      return '+234' + cleaned.slice(1);
    } else if (cleaned.startsWith('234')) {
      return '+' + cleaned;
    } else if (cleaned.length === 10) {
      return '+234' + cleaned;
    }
    
    return '+234' + cleaned;
  };

  const handleRequestOTP = async () => {
    const cleanedPhone = phone.replace(/\D/g, '');
    
    if (cleanedPhone.length < 10) {
      triggerErrorHaptic();
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    triggerHaptic();

    try {
      const internationalPhone = getCleanPhoneNumber();
      navigation.navigate('OTPVerification', { 
        phone: internationalPhone,
        mode: 'login',
      });
    } catch (error: any) {
      triggerErrorHaptic();
      Alert.alert('Error', error.message || 'Failed to send OTP');
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
              Login with Phone
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Enter your phone number and we'll send you a verification code
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Animated.Text style={[createLabelStyle(phoneAnimValue), styles.label]}>
                Phone Number
              </Animated.Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.flag}>🇳🇬</Text>
                  <Text style={[styles.countryCodeText, { color: colors.text }]}>+234</Text>
                </View>
                <View style={[styles.phoneDivider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                <RNTextInput
                  ref={phoneRef}
                  style={[styles.phoneInput, { color: colors.text }]}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  keyboardType="phone-pad"
                  maxLength={14}
                  placeholder=""
                  placeholderTextColor="transparent"
                />
              </View>
              <MaterialCommunityIcons
                name="phone-outline"
                size={22}
                color={phoneFocused ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
              />
            </View>
            <View
              style={[
                styles.inputLine,
                { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                phoneFocused && styles.inputLineFocused,
              ]}
            />
          </View>

          {/* Info Note */}
          <View style={[styles.infoContainer, { backgroundColor: isDark ? '#1E3A2F' : '#ECFDF5' }]}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: isDark ? '#86EFAC' : '#065F46' }]}>
              We'll send you a 6-digit code via SMS to verify your number
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: COLORS.primary },
              (phone.replace(/\D/g, '').length < 10) && styles.continueButtonDisabled,
            ]}
            onPress={handleRequestOTP}
            disabled={isLoading || phone.replace(/\D/g, '').length < 10}
          >
            <Text style={styles.continueButtonText}>
              {isLoading ? 'Sending...' : 'Get Verification Code'}
            </Text>
            {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          {/* Back to Email Login */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backToEmail}
          >
            <MaterialCommunityIcons name="email-outline" size={18} color={COLORS.primary} />
            <Text style={styles.backToEmailText}>Login with Email instead</Text>
          </TouchableOpacity>
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
  phoneInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  flag: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONTS.medium,
    letterSpacing: 1,
    paddingVertical: 8,
  },
  inputLine: {
    height: 1,
  },
  inputLineFocused: {
    height: 2,
    backgroundColor: COLORS.primary,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
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
  backToEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: SPACING.md,
  },
  backToEmailText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
});
