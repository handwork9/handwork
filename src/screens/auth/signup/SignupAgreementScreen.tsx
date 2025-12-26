import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupAgreement'>;

interface AgreementItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  link?: string;
}

const AGREEMENTS: AgreementItem[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    description: 'I agree to the Terms of Service and understand my rights and responsibilities as a user of this platform.',
    required: true,
    link: 'https://handwork.app/terms',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'I have read and agree to the Privacy Policy, including how my data is collected, used, and shared.',
    required: true,
    link: 'https://handwork.app/privacy',
  },
  {
    id: 'marketing',
    title: 'Marketing Communications',
    description: 'I would like to receive promotional offers, news, and updates via email and push notifications.',
    required: false,
  },
  {
    id: 'age',
    title: 'Age Verification',
    description: 'I confirm that I am at least 18 years old and legally able to enter into this agreement.',
    required: true,
  },
];

export default function SignupAgreementScreen({ navigation, route }: Props) {
  const {
    role,
    email,
    phone,
    password,
    firstName,
    lastName,
    nationality,
    nationalityCode,
    state,
    city,
    address,
    latitude,
    longitude,
  } = route.params;

  const [agreements, setAgreements] = useState<Record<string, boolean>>({
    terms: false,
    privacy: false,
    marketing: false,
    age: false,
  });
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const checkAnimations = useRef<Record<string, Animated.Value>>({
    terms: new Animated.Value(0),
    privacy: new Animated.Value(0),
    marketing: new Animated.Value(0),
    age: new Animated.Value(0),
  }).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  const toggleAgreement = (id: string) => {
    const newValue = !agreements[id];
    setAgreements(prev => ({ ...prev, [id]: newValue }));
    
    Animated.spring(checkAnimations[id], {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const allRequiredAccepted = AGREEMENTS
    .filter(a => a.required)
    .every(a => agreements[a.id]);

  const handleContinue = async () => {
    if (!allRequiredAccepted) {
      Alert.alert(
        'Required Agreements',
        'Please accept all required agreements to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    const baseParams = {
      role,
      email,
      phone,
      password,
      firstName,
      lastName,
      nationality,
      nationalityCode,
      state,
      city,
      address,
      latitude,
      longitude,
    };

    // Navigate to role-specific screens
    if (role === 'rider') {
      navigation.navigate('SignupBikeDetails', baseParams);
    } else if (role === 'farmer') {
      navigation.navigate('SignupFarmDetails', baseParams);
    } else {
      // Buyers can optionally add payment or skip directly to account creation
      navigation.navigate('SignupPayment', baseParams);
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open the link');
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['85.68%', '100%'], // Step 7 of 7
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
          Step 7 of 7
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Almost there! 🎉
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Review and accept the agreements to create your account
          </Text>
        </View>

        {/* Agreement Summary */}
        <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.summaryRow}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Name</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{firstName} {lastName}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Email</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{email}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Phone</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{phone}</Text>
            </View>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Location</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]} numberOfLines={2}>{city}, {state}</Text>
            </View>
          </View>
        </View>

        {/* Agreements */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Agreements
        </Text>

        {AGREEMENTS.map((agreement) => (
          <TouchableOpacity
            key={agreement.id}
            style={[
              styles.agreementItem,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: agreements[agreement.id] ? COLORS.primary : (isDark ? '#374151' : '#E5E7EB'),
              },
            ]}
            onPress={() => toggleAgreement(agreement.id)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.checkbox,
                {
                  backgroundColor: agreements[agreement.id] ? COLORS.primary : 'transparent',
                  borderColor: agreements[agreement.id] ? COLORS.primary : (isDark ? '#6B7280' : '#9CA3AF'),
                  transform: [
                    {
                      scale: checkAnimations[agreement.id].interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.2, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {agreements[agreement.id] && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </Animated.View>
            <View style={styles.agreementContent}>
              <View style={styles.agreementHeader}>
                <Text style={[styles.agreementTitle, { color: colors.text }]}>
                  {agreement.title}
                </Text>
                {agreement.required && (
                  <Text style={styles.requiredBadge}>Required</Text>
                )}
              </View>
              <Text style={[styles.agreementDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {agreement.description}
              </Text>
              {agreement.link && (
                <TouchableOpacity
                  onPress={() => handleOpenLink(agreement.link!)}
                  style={styles.readMoreButton}
                >
                  <Text style={styles.readMoreText}>Read full document</Text>
                  <Ionicons name="open-outline" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Accept All Button */}
        <TouchableOpacity
          style={[styles.acceptAllButton, { borderColor: isDark ? '#374151' : '#E5E7EB' }]}
          onPress={() => {
            const allTrue = Object.values(agreements).every(v => v);
            const newState = Object.keys(agreements).reduce((acc, key) => {
              acc[key] = !allTrue;
              return acc;
            }, {} as Record<string, boolean>);
            setAgreements(newState);
            
            Object.keys(checkAnimations).forEach(key => {
              Animated.spring(checkAnimations[key], {
                toValue: !allTrue ? 1 : 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              }).start();
            });
          }}
        >
          <Text style={[styles.acceptAllText, { color: COLORS.primary }]}>
            {Object.values(agreements).every(v => v) ? 'Deselect All' : 'Accept All'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: COLORS.primary },
            !allRequiredAccepted && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!allRequiredAccepted}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={[styles.footerText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </Text>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  titleContainer: {
    marginBottom: SPACING.lg,
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
  summaryCard: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  agreementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  agreementContent: {
    flex: 1,
  },
  agreementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  agreementTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  requiredBadge: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  agreementDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  readMoreText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  acceptAllButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: SPACING.sm,
  },
  acceptAllText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  footerText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
  },
});
