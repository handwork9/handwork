import React, { useState, useRef, useEffect } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
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
  
  // Focus states for inputs
  const [currentFocused, setCurrentFocused] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  
  // Animated values for floating labels
  const currentLabelAnim = useRef(new Animated.Value(currentPassword ? 1 : 0)).current;
  const newLabelAnim = useRef(new Animated.Value(newPassword ? 1 : 0)).current;
  const confirmLabelAnim = useRef(new Animated.Value(confirmPassword ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(currentLabelAnim, {
      toValue: currentFocused || currentPassword ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [currentFocused, currentPassword]);

  useEffect(() => {
    Animated.timing(newLabelAnim, {
      toValue: newFocused || newPassword ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [newFocused, newPassword]);

  useEffect(() => {
    Animated.timing(confirmLabelAnim, {
      toValue: confirmFocused || confirmPassword ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [confirmFocused, confirmPassword]);

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
  const passwordsMatch = newPassword === confirmPassword;
  const showMismatchError = confirmPassword.length > 0 && !passwordsMatch;

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

  const getLabelStyle = (animValue: Animated.Value, isFocused: boolean, hasError?: boolean) => ({
    position: 'absolute' as const,
    left: 0,
    top: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    }),
    fontSize: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 14],
    }),
    color: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [isDark ? '#9CA3AF' : '#6B7280', hasError ? '#EF4444' : COLORS.primary],
    }),
    fontFamily: FONTS.medium,
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Change Password</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Update your account password for better security
            </Text>
          </View>

          {/* Current Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Animated.Text style={getLabelStyle(currentLabelAnim, currentFocused)}>
                Current Password
              </Animated.Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                onFocus={() => setCurrentFocused(true)}
                onBlur={() => setCurrentFocused(false)}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={currentFocused ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
            <View style={[
              styles.inputLine,
              currentFocused && styles.inputLineFocused,
              { backgroundColor: currentFocused ? COLORS.primary : isDark ? '#3C3C3E' : '#E5E7EB' },
            ]} />
          </View>

          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotLinkText}>Forgot your current password?</Text>
          </TouchableOpacity>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Animated.Text style={getLabelStyle(newLabelAnim, newFocused)}>
                New Password
              </Animated.Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                onFocus={() => setNewFocused(true)}
                onBlur={() => setNewFocused(false)}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={newFocused ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
            <View style={[
              styles.inputLine,
              newFocused && styles.inputLineFocused,
              { backgroundColor: newFocused ? COLORS.primary : isDark ? '#3C3C3E' : '#E5E7EB' },
            ]} />
          </View>

          {/* Strength Indicator */}
          {newPassword.length > 0 && (
            <View style={styles.strengthSection}>
              <View style={styles.strengthHeader}>
                <Text style={[styles.strengthLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Password Strength
                </Text>
                <Text style={[styles.strengthValue, { color: getStrengthColor() }]}>
                  {getStrengthLabel()}
                </Text>
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
                      color={isMet ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
                    />
                    <Text style={[styles.requirementText, { color: isMet ? COLORS.primary : (isDark ? '#9CA3AF' : '#6B7280') }]}>
                      {req.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Confirm Password Input */}
          <View style={[styles.inputContainer, { marginTop: SPACING.lg }]}>
            <View style={styles.inputWrapper}>
              <Animated.Text style={getLabelStyle(confirmLabelAnim, confirmFocused, showMismatchError)}>
                Confirm New Password
              </Animated.Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={confirmFocused ? COLORS.primary : isDark ? '#6B7280' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
            <View style={[
              styles.inputLine,
              confirmFocused && styles.inputLineFocused,
              showMismatchError && styles.inputLineError,
              { backgroundColor: showMismatchError ? '#EF4444' : confirmFocused ? COLORS.primary : isDark ? '#3C3C3E' : '#E5E7EB' },
            ]} />
            {showMismatchError && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          {/* Match Indicator */}
          {confirmPassword.length > 0 && newPassword.length > 0 && passwordsMatch && (
            <View style={styles.matchIndicator}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
              <Text style={styles.matchText}>Passwords match</Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
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
            <>
              <Text style={styles.saveButtonText}>Save Changes</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
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
    marginBottom: SPACING.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
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
  forgotLink: {
    marginBottom: SPACING.xl,
  },
  forgotLinkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  strengthSection: {
    marginBottom: SPACING.md,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  strengthValue: {
    fontSize: FONT_SIZES.sm,
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
    marginBottom: SPACING.md,
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontFamily: FONTS.regular,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
