import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#FF6B00';

interface Benefit {
  id: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  title: string;
  description: string;
  color: string;
}

interface Step {
  id: string;
  number: number;
  title: string;
  description: string;
}

export default function BecomeRiderInfoScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const benefits: Benefit[] = [
    {
      id: '1',
      icon: 'cash-outline',
      iconType: 'ionicons',
      title: 'Earn Great Money',
      description: 'Competitive pay per delivery plus keep 100% of your tips. The more you deliver, the more you earn.',
      color: '#4CAF50',
    },
    {
      id: '2',
      icon: 'time-outline',
      iconType: 'ionicons',
      title: 'Flexible Schedule',
      description: 'Work when you want. Set your own hours and be your own boss. No minimum hours required.',
      color: '#2196F3',
    },
    {
      id: '3',
      icon: 'trophy-outline',
      iconType: 'ionicons',
      title: 'Weekly Bonuses',
      description: 'Complete delivery targets to earn extra bonuses. Top performers get special rewards.',
      color: '#FF9800',
    },
    {
      id: '4',
      icon: 'bicycle',
      iconType: 'material',
      title: 'Use Your Own Vehicle',
      description: 'Deliver with your bike, motorcycle, or any vehicle you have. No special equipment needed.',
      color: '#9C27B0',
    },
    {
      id: '5',
      icon: 'shield-checkmark-outline',
      iconType: 'ionicons',
      title: 'Secure Payments',
      description: 'Get paid weekly directly to your bank. Fast, secure, and reliable payments guaranteed.',
      color: '#00BCD4',
    },
    {
      id: '6',
      icon: 'trending-up-outline',
      iconType: 'ionicons',
      title: 'Grow Your Career',
      description: 'Access premium zones, priority orders, and exclusive benefits as you level up.',
      color: '#E91E63',
    },
  ];

  const steps: Step[] = [
    {
      id: '1',
      number: 1,
      title: 'Apply Online',
      description: 'Fill out a simple application with your details and upload required documents.',
    },
    {
      id: '2',
      number: 2,
      title: 'Get Verified',
      description: 'We\'ll verify your documents and background. Usually takes 2-3 days.',
    },
    {
      id: '3',
      number: 3,
      title: 'Start Delivering',
      description: 'Once approved, go online and start accepting delivery jobs near you!',
    },
  ];

  const requirements = [
    'Valid government-issued ID',
    'Smartphone with internet access',
    'Own vehicle (bike, motorcycle, or car)',
    'Guarantor information',
    'Clean background check',
  ];

  const renderBenefit = (benefit: Benefit) => (
    <View
      key={benefit.id}
      style={[
        styles.benefitCard,
        { backgroundColor: isDark ? colors.card : '#FFFFFF' },
      ]}
    >
      <View style={[styles.benefitIconContainer, { backgroundColor: `${benefit.color}15` }]}>
        {benefit.iconType === 'material' ? (
          <MaterialCommunityIcons name={benefit.icon as any} size={28} color={benefit.color} />
        ) : (
          <Ionicons name={benefit.icon as any} size={28} color={benefit.color} />
        )}
      </View>
      <View style={styles.benefitContent}>
        <Text style={[styles.benefitTitle, { color: colors.text }]}>{benefit.title}</Text>
        <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
          {benefit.description}
        </Text>
      </View>
    </View>
  );

  const renderStep = (step: Step) => (
    <View key={step.id} style={styles.stepItem}>
      <View style={[styles.stepNumber, { backgroundColor: PRIMARY_COLOR }]}>
        <Text style={styles.stepNumberText}>{step.number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {step.description}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with SVG Background */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerBackground}>
          <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Circle cx={width * 0.8} cy={-50} r={200} fill="rgba(255,255,255,0.08)" />
            <Circle cx={-50} cy={150} r={150} fill="rgba(255,255,255,0.05)" />
            <Circle cx={width} cy={200} r={100} fill="rgba(255,255,255,0.06)" />
          </Svg>
        </View>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="motorbike" size={48} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>Become a Rider</Text>
          <Text style={styles.headerSubtitle}>
            Deliver with Handwork and earn money on your own schedule
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Why Ride With Us?
          </Text>
          {benefits.map(renderBenefit)}
        </View>

        {/* Requirements Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What You Need
          </Text>
          <View style={[styles.requirementsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {requirements.map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <View style={[styles.checkIcon, { backgroundColor: `${PRIMARY_COLOR}15` }]}>
                  <Ionicons name="checkmark" size={16} color={PRIMARY_COLOR} />
                </View>
                <Text style={[styles.requirementText, { color: colors.text }]}>{req}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How to Get Started
          </Text>
          <View style={[styles.stepsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {renderStep(step)}
                {index < steps.length - 1 && (
                  <View style={[styles.stepConnector, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Earnings Section */}
        <View style={styles.section}>
          <View style={[styles.earningsCard, { backgroundColor: `${PRIMARY_COLOR}10` }]}>
            <MaterialCommunityIcons name="cash-multiple" size={40} color={PRIMARY_COLOR} />
            <View style={styles.earningsContent}>
              <Text style={[styles.earningsTitle, { color: colors.text }]}>
                Earn up to ₦100,000+/month
              </Text>
              <Text style={[styles.earningsDescription, { color: colors.textSecondary }]}>
                Top riders earn this much. Your earnings depend on how often you deliver.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('RiderOnboarding' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Start Application</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          By applying, you agree to our Terms of Service and Rider Agreement.
        </Text>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingBottom: 30,
    overflow: 'hidden',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  headerIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  requirementsCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requirementText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  stepsCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  stepConnector: {
    width: 2,
    height: 20,
    marginLeft: 15,
    marginBottom: 8,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  earningsContent: {
    flex: 1,
    marginLeft: 16,
  },
  earningsTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  earningsDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
