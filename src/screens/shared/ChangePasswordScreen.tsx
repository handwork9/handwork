import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import { authService } from '../../services/authService';

interface PasswordRequirement {
  id: string;
  label: string;
  validator: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: '1', label: 'At least 8 characters', validator: (p) => p.length >= 8 },
  { id: '2', label: 'One uppercase letter', validator: (p) => /[A-Z]/.test(p) },
  { id: '3', label: 'One lowercase letter', validator: (p) => /[a-z]/.test(p) },
  { id: '4', label: 'One number', validator: (p) => /[0-9]/.test(p) },
  { id: '5', label: 'One special character (!@#$%^&*)', validator: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

// FloatingInput Component
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  secureTextEntry?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  error?: string;
}

const FloatingInput = ({
  label,
  value,
  onChangeText,
  onBlur,
  secureTextEntry = false,
  showPassword = false,
  onTogglePassword,
  error,
}: FloatingInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 0,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', error ? '#EF4444' : '#16A34A'],
    }),
    backgroundColor: isDark ? colors.background : '#F2F2F7',
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={floatingStyles.container}>
      <View style={floatingStyles.inputRow}>
        <View style={floatingStyles.inputContent}>
          <Animated.Text style={[labelStyle, { fontFamily: FONTS.regular }]}>
            {label}
          </Animated.Text>
          <RNTextInput
            style={[floatingStyles.input, { color: colors.text }]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            secureTextEntry={secureTextEntry && !showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {onTogglePassword && (
          <TouchableOpacity onPress={onTogglePassword} style={floatingStyles.iconContainer}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={isFocused ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={[floatingStyles.underline, isFocused && floatingStyles.underlineFocused, error && floatingStyles.underlineError]} />
      {error && <Text style={floatingStyles.errorText}>{error}</Text>}
    </View>
  );
};

const floatingStyles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  inputContent: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: FONTS.regular,
  },
  iconContainer: {
    marginLeft: 12,
    padding: 4,
  },
  underline: {
    height: 1,
    backgroundColor: 'rgba(60, 60, 67, 0.12)',
  },
  underlineFocused: {
    height: 2,
    backgroundColor: '#16A34A',
  },
  underlineError: {
    backgroundColor: '#EF4444',
    height: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    fontFamily: FONTS.regular,
  },
});

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const passwordStrength = PASSWORD_REQUIREMENTS.filter(req => req.validator(newPassword)).length;
  const strengthPercentage = (passwordStrength / PASSWORD_REQUIREMENTS.length) * 100;
  
  const getStrengthColor = () => {
    if (strengthPercentage <= 20) return '#FF3B30';
    if (strengthPercentage <= 40) return '#FF9500';
    if (strengthPercentage <= 60) return '#FFCC00';
    if (strengthPercentage <= 80) return '#34C759';
    return '#16A34A';
  };

  const getStrengthLabel = () => {
    if (strengthPercentage <= 20) return 'Very Weak';
    if (strengthPercentage <= 40) return 'Weak';
    if (strengthPercentage <= 60) return 'Fair';
    if (strengthPercentage <= 80) return 'Strong';
    return 'Very Strong';
  };

  const hasChanges = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

  const handleSubmit = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (passwordStrength < PASSWORD_REQUIREMENTS.length) {
      Alert.alert('Error', 'Please meet all password requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        Alert.alert(
          'Password Changed',
          'Your password has been successfully updated. Please use your new password for future logins.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to change password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10, backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
        onPress={() => navigation.goBack()}
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
            <Text style={[styles.pageTitle, { color: colors.text }]}>Change Password</Text>
            <Text style={styles.pageSubtitle}>Update your account password</Text>
          </View>

          {/* Current Password Section */}
          <View style={styles.section}>
            <FloatingInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              showPassword={showCurrentPassword}
              onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
            />

            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>Forgot your current password?</Text>
            </TouchableOpacity>
          </View>

          {/* New Password Section */}
          <View style={styles.section}>
            <FloatingInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              showPassword={showNewPassword}
              onTogglePassword={() => setShowNewPassword(!showNewPassword)}
            />

            {/* Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthSection}>
                <View style={styles.strengthHeader}>
                  <Text style={[styles.strengthLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Password Strength</Text>
                  <Text style={[styles.strengthValue, { color: getStrengthColor() }]}>{getStrengthLabel()}</Text>
                </View>
                <View style={[styles.strengthBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
                  <View style={[styles.strengthBarFill, { width: `${strengthPercentage}%`, backgroundColor: getStrengthColor() }]} />
                </View>
              </View>
            )}

            {/* Requirements */}
            {newPassword.length > 0 && (
              <View style={styles.requirementsList}>
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const isMet = req.validator(newPassword);
                  return (
                    <View key={req.id} style={styles.requirementItem}>
                      <Ionicons
                        name={isMet ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={isMet ? '#16A34A' : isDark ? '#6B7280' : '#9CA3AF'}
                      />
                      <Text style={[styles.requirementText, { color: isMet ? '#16A34A' : (isDark ? '#9CA3AF' : '#6B7280') }]}>
                        {req.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Confirm Password Section */}
          <View style={styles.section}>
            <FloatingInput
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              error={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
            />

            {/* Match Indicator */}
            {confirmPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword && (
              <View style={styles.matchIndicator}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                <Text style={styles.matchText}>Passwords match</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Footer Save Button */}
      <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || isSubmitting) && styles.saveButtonDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.7}
          disabled={!hasChanges || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
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
  saveButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  pageTitleSection: {
    marginBottom: 32,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    fontFamily: FONTS.semiBold,
  },
  forgotLink: {
    marginTop: -16,
    marginBottom: 8,
  },
  forgotLinkText: {
    fontSize: 14,
    color: '#16A34A',
    fontFamily: FONTS.regular,
  },
  strengthSection: {
    marginTop: -16,
    marginBottom: 16,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  strengthValue: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  strengthBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirementsList: {
    marginTop: 8,
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -16,
  },
  matchText: {
    fontSize: 14,
    color: '#16A34A',
    fontFamily: FONTS.regular,
  },
});
