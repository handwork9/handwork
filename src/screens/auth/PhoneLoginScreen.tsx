import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { triggerHaptic, triggerSuccessHaptic, triggerErrorHaptic } from '../../utils/haptics';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

const { width } = Dimensions.get('window');

export default function PhoneLoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    let cleaned = text.replace(/\D/g, '');
    
    // If user enters full number starting with 234, remove the country code
    if (cleaned.startsWith('234') && cleaned.length > 10) {
      cleaned = '0' + cleaned.slice(3);
    }
    
    // Limit to 11 digits (Nigerian format: 0XXX XXX XXXX)
    const limited = cleaned.slice(0, 11);
    
    // Format: 0XXX XXX XXXX
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
    
    // Convert to international format (+234XXXXXXXXXX)
    if (cleaned.startsWith('0')) {
      // User entered: 08012345678 → +2348012345678
      return '+234' + cleaned.slice(1);
    } else if (cleaned.startsWith('234')) {
      // User entered: 2348012345678 → +2348012345678
      return '+' + cleaned;
    } else if (cleaned.length === 10) {
      // User entered: 8012345678 (without leading 0) → +2348012345678
      return '+234' + cleaned;
    }
    
    // Fallback: assume Nigerian number
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
      // Navigate to OTP screen with phone login mode
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="phone-outline" size={40} color="#16A34A" />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>Login with Phone</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Enter your phone number and we'll send you a verification code
            </Text>

            {/* Phone Input */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Phone Number
              </Text>
              <View style={[
                styles.phoneInputContainer,
                { 
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                }
              ]}>
                <View style={styles.countryCode}>
                  <Text style={styles.flag}>🇳🇬</Text>
                  <Text style={[styles.countryCodeText, { color: colors.text }]}>+234</Text>
                </View>
                <View style={[styles.dividerVertical, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                <TextInput
                  style={[styles.phoneInput, { color: colors.text }]}
                  placeholder="0812 345 6789"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={14}
                  autoFocus
                />
              </View>
            </View>

            {/* Request OTP Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!phone || phone.replace(/\D/g, '').length < 10) && styles.submitButtonDisabled,
              ]}
              onPress={handleRequestOTP}
              activeOpacity={0.8}
              disabled={isLoading || phone.replace(/\D/g, '').length < 10}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Sending...' : 'Get Verification Code'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoSection}>
              <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
              <Text style={[styles.infoText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                We'll send you a 6-digit code via SMS to verify your number
              </Text>
            </View>

            {/* Back to Email Login */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backToEmail}
            >
              <MaterialCommunityIcons name="email-outline" size={18} color="#16A34A" />
              <Text style={styles.backToEmailText}>Login with Email instead</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  inputSection: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 12,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  dividerVertical: {
    width: 1,
    height: 24,
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONTS.medium,
    letterSpacing: 1,
  },
  submitButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  backToEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  backToEmailText: {
    color: '#16A34A',
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
});
