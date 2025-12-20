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
  StatusBar,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupPersonalInfo'>;

export default function SignupPersonalInfoScreen({ navigation, route }: Props) {
  const { role, email, phone, password } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const firstNameRef = useRef<RNTextInput>(null);
  const lastNameRef = useRef<RNTextInput>(null);
  const firstNameAnimValue = useRef(new Animated.Value(0)).current;
  const lastNameAnimValue = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => firstNameRef.current?.focus(), 300);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(firstNameAnimValue, {
      toValue: firstNameFocused || firstName ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [firstNameFocused, firstName]);

  useEffect(() => {
    Animated.timing(lastNameAnimValue, {
      toValue: lastNameFocused || lastName ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [lastNameFocused, lastName]);

  const handleContinue = () => {
    let hasError = false;

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      hasError = true;
    } else if (firstName.trim().length < 2) {
      setFirstNameError('First name must be at least 2 characters');
      hasError = true;
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      hasError = true;
    } else if (lastName.trim().length < 2) {
      setLastNameError('Last name must be at least 2 characters');
      hasError = true;
    }

    if (hasError) return;

    navigation.navigate('SignupNationality', {
      role,
      email,
      phone,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
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

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['42.84%', '57.12%'], // Step 4 of 7
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
          Step 4 of 7
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
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              What's your name?
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Enter your full name as it appears on official documents
            </Text>
          </View>

          {/* First Name Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Animated.Text style={[createLabelStyle(firstNameAnimValue), styles.label]}>
                First Name
              </Animated.Text>
              <RNTextInput
                ref={firstNameRef}
                style={[styles.input, { color: colors.text }]}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (firstNameError) setFirstNameError('');
                }}
                onFocus={() => setFirstNameFocused(true)}
                onBlur={() => setFirstNameFocused(false)}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder=""
                placeholderTextColor="transparent"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
              {firstName.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setFirstName('')}
                >
                  <Ionicons name="close-circle" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                </TouchableOpacity>
              )}
            </View>
            <View
              style={[
                styles.inputLine,
                { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                firstNameFocused && styles.inputLineFocused,
                firstNameError && styles.inputLineError,
              ]}
            />
            {firstNameError ? (
              <Text style={styles.errorText}>{firstNameError}</Text>
            ) : null}
          </View>

          {/* Last Name Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Animated.Text style={[createLabelStyle(lastNameAnimValue), styles.label]}>
                Last Name
              </Animated.Text>
              <RNTextInput
                ref={lastNameRef}
                style={[styles.input, { color: colors.text }]}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (lastNameError) setLastNameError('');
                }}
                onFocus={() => setLastNameFocused(true)}
                onBlur={() => setLastNameFocused(false)}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder=""
                placeholderTextColor="transparent"
                returnKeyType="done"
              />
              {lastName.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setLastName('')}
                >
                  <Ionicons name="close-circle" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                </TouchableOpacity>
              )}
            </View>
            <View
              style={[
                styles.inputLine,
                { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                lastNameFocused && styles.inputLineFocused,
                lastNameError && styles.inputLineError,
              ]}
            />
            {lastNameError ? (
              <Text style={styles.errorText}>{lastNameError}</Text>
            ) : null}
          </View>

          {/* Info Note */}
          <View style={[styles.infoContainer, { backgroundColor: isDark ? '#1E3A2F' : '#ECFDF5' }]}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: isDark ? '#86EFAC' : '#065F46' }]}>
              Your name will be displayed to other users and cannot be changed easily after registration.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: COLORS.primary },
              (!firstName.trim() || !lastName.trim()) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!firstName.trim() || !lastName.trim()}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
  },
  scrollContent: {
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  label: {
    fontFamily: FONTS.medium,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONTS.medium,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  inputLine: {
    height: 1,
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
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
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
});
