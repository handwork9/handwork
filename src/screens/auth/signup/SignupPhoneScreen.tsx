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
  Modal,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupPhone'>;

// Country codes with flags
const COUNTRY_CODES = [
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', maxLength: 10 },
  { code: '+1', country: 'United States', flag: '🇺🇸', maxLength: 10 },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', maxLength: 10 },
  { code: '+91', country: 'India', flag: '🇮🇳', maxLength: 10 },
  { code: '+86', country: 'China', flag: '🇨🇳', maxLength: 11 },
  { code: '+81', country: 'Japan', flag: '🇯🇵', maxLength: 10 },
  { code: '+49', country: 'Germany', flag: '🇩🇪', maxLength: 11 },
  { code: '+33', country: 'France', flag: '🇫🇷', maxLength: 9 },
  { code: '+39', country: 'Italy', flag: '🇮🇹', maxLength: 10 },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', maxLength: 11 },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', maxLength: 9 },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', maxLength: 9 },
  { code: '+233', country: 'Ghana', flag: '🇬🇭', maxLength: 9 },
  { code: '+20', country: 'Egypt', flag: '🇪🇬', maxLength: 10 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', maxLength: 9 },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', maxLength: 9 },
  { code: '+61', country: 'Australia', flag: '🇦🇺', maxLength: 9 },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿', maxLength: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', maxLength: 8 },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', maxLength: 10 },
];

const { width } = Dimensions.get('window');

export default function SignupPhoneScreen({ navigation, route }: Props) {
  const { role, email } = route.params;
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const inputRef = useRef<RNTextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || phone ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, phone]);

  const formatPhoneNumber = (value: string) => {
    // Remove non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format based on country (using Nigerian format as default)
    if (selectedCountry.code === '+234') {
      // Nigerian format: XXX XXXX XXXX
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 7) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)}`;
    }
    
    // Default format: XXX XXX XXXX
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= selectedCountry.maxLength) {
      setPhone(formatPhoneNumber(cleaned));
      if (error) setError('');
    }
  };

  const handleContinue = () => {
    const cleanedPhone = phone.replace(/\D/g, '');
    
    if (!cleanedPhone) {
      setError('Phone number is required');
      return;
    }

    if (cleanedPhone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    navigation.navigate('SignupPassword', {
      role,
      email,
      phone: `${selectedCountry.code}${cleanedPhone}`,
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
    outputRange: ['14.28%', '28.56%'], // Step 2 of 7
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
          Step 2 of 7
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
            What's your phone number?
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            We'll send you a verification code via SMS
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.phoneInputRow}>
            {/* Country Code Selector */}
            <TouchableOpacity
              style={[
                styles.countrySelector,
                { 
                  backgroundColor: isDark ? '#374151' : '#FFFFFF',
                  borderColor: isDark ? '#4B5563' : '#E5E7EB',
                },
              ]}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.flag}>{selectedCountry.flag}</Text>
              <Text style={[styles.countryCode, { color: colors.text }]}>
                {selectedCountry.code}
              </Text>
              <Ionicons name="chevron-down" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>

            {/* Phone Input */}
            <View style={styles.phoneInputWrapper}>
              <Animated.Text style={[labelStyle, styles.label]}>
                Phone number
              </Animated.Text>
              <RNTextInput
                ref={inputRef}
                style={[
                  styles.input,
                  { color: colors.text },
                  error && styles.inputError,
                ]}
                value={phone}
                onChangeText={handlePhoneChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="phone-pad"
                placeholder=""
                placeholderTextColor="transparent"
                maxLength={15}
              />
            </View>
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
              (!phone) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!phone}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Country</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COUNTRY_CODES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF' },
                  selectedCountry.code === item.code && styles.countryItemSelected,
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryPicker(false);
                }}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <View style={styles.countryInfo}>
                  <Text style={[styles.countryName, { color: colors.text }]}>
                    {item.country}
                  </Text>
                  <Text style={[styles.countryCodeText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    {item.code}
                  </Text>
                </View>
                {selectedCountry.code === item.code && (
                  <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
            )}
          />
        </View>
      </Modal>
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
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  phoneInputWrapper: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 12,
  },
  label: {
    fontFamily: FONTS.medium,
  },
  input: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    paddingVertical: 8,
  },
  inputError: {
    color: '#EF4444',
  },
  inputLine: {
    height: 1,
    marginLeft: 100, // Align with phone input
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
    marginLeft: 100,
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  modalCloseButton: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 12,
  },
  countryItemSelected: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  countryFlag: {
    fontSize: 28,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  countryCodeText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
});
