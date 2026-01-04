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
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#4CAF50';

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

export default function BecomeFarmerInfoScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const benefits: Benefit[] = [
    {
      id: '1',
      icon: 'storefront-outline',
      iconType: 'ionicons',
      title: 'Your Own Digital Store',
      description: 'Create your personalized storefront to showcase and sell your farm produce directly to customers.',
      color: '#4CAF50',
    },
    {
      id: '2',
      icon: 'cash-outline',
      iconType: 'ionicons',
      title: 'Earn More Profit',
      description: 'Cut out the middleman and keep more of your earnings by selling directly to buyers.',
      color: '#2196F3',
    },
    {
      id: '3',
      icon: 'people-outline',
      iconType: 'ionicons',
      title: 'Reach More Customers',
      description: 'Access thousands of buyers looking for fresh, quality farm produce in your area.',
      color: '#FF9800',
    },
    {
      id: '4',
      icon: 'truck-delivery',
      iconType: 'material',
      title: 'Easy Delivery',
      description: 'Our riders pick up and deliver your products. Focus on farming, we handle logistics.',
      color: '#9C27B0',
    },
    {
      id: '5',
      icon: 'shield-checkmark-outline',
      iconType: 'ionicons',
      title: 'Secure Payments',
      description: 'Get paid directly to your wallet or bank account. Fast, secure, and reliable.',
      color: '#00BCD4',
    },
    {
      id: '6',
      icon: 'analytics-outline',
      iconType: 'ionicons',
      title: 'Track Your Business',
      description: 'Monitor sales, view analytics, and grow your farm business with insights.',
      color: '#E91E63',
    },
  ];

  const steps: Step[] = [
    {
      id: '1',
      number: 1,
      title: 'Create Your Profile',
      description: 'Sign up and tell us about your farm - location, what you grow, and your story.',
    },
    {
      id: '2',
      number: 2,
      title: 'Add Your Products',
      description: 'Upload photos, set prices, and describe your fresh produce.',
    },
    {
      id: '3',
      number: 3,
      title: 'Start Selling',
      description: 'Receive orders, prepare them for pickup, and watch your business grow!',
    },
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
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        {/* SVG Background Decoration */}
        <View style={styles.headerSvgBackground}>
          <Svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
            <Defs>
              <SvgLinearGradient id="sellerHeaderGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#34C759" stopOpacity={isDark ? 0.2 : 0.12} />
                <Stop offset="100%" stopColor="#30D158" stopOpacity={isDark ? 0.12 : 0.06} />
              </SvgLinearGradient>
              <SvgLinearGradient id="sellerHeaderGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#30D158" stopOpacity={isDark ? 0.15 : 0.08} />
                <Stop offset="100%" stopColor="#34C759" stopOpacity={isDark ? 0.08 : 0.03} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx="350" cy="15" r="70" fill="url(#sellerHeaderGrad1)" />
            <Circle cx="380" cy="70" r="45" fill="url(#sellerHeaderGrad2)" />
            <Circle cx="30" cy="90" r="55" fill="url(#sellerHeaderGrad2)" />
            <Path d="M0,80 Q100,40 200,80 T400,60" fill="none" stroke="url(#sellerHeaderGrad1)" strokeWidth="35" opacity={0.3} />
          </Svg>
        </View>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#E8F5E9' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={isDark ? '#FFFFFF' : '#1C1C1E'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>Become a Seller</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={[styles.heroSection, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={styles.heroSvg}>
              <Svg width="200" height="200" viewBox="0 0 200 200">
                <Circle cx="150" cy="50" r="80" fill="#4CAF50" fillOpacity={0.08} />
                <Circle cx="180" cy="100" r="50" fill="#66BB6A" fillOpacity={0.06} />
                <Circle cx="120" cy="30" r="30" fill="#4CAF50" fillOpacity={0.05} />
              </Svg>
            </View>
            <View style={styles.heroContent}>
              <View style={[styles.heroIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <MaterialCommunityIcons name="sprout" size={48} color={PRIMARY_COLOR} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Grow Your Farm Business</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                Join thousands of farmers already selling on our platform
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: PRIMARY_COLOR }]}>5000+</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Farmers</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? colors.border : '#E5E5E5' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: PRIMARY_COLOR }]}>₦50M+</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Earned Monthly</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? colors.border : '#E5E5E5' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: PRIMARY_COLOR }]}>100K+</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Happy Customers</Text>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Why Sell With Us?</Text>
          <View style={styles.benefitsGrid}>
            {benefits.map(renderBenefit)}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
          <View style={[styles.stepsContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {renderStep(step)}
                {index < steps.length - 1 && (
                  <View style={[styles.stepConnector, { backgroundColor: `${PRIMARY_COLOR}30` }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Testimonial */}
        <View style={[styles.testimonialCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Ionicons name="chatbubble-ellipses" size={32} color={PRIMARY_COLOR} />
          <Text style={[styles.testimonialText, { color: colors.text }]}>
            "I started selling my vegetables here 6 months ago. Now I make 3x what I used to earn at the local market!"
          </Text>
          <Text style={[styles.testimonialAuthor, { color: colors.textSecondary }]}>
            — Mama Chidi, Lagos
          </Text>
        </View>
      </ScrollView>

      {/* CTA Button */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16, backgroundColor: isDark ? colors.background : '#F5F5F5' }]}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => {
            navigation.navigate('FarmerOnboarding' as never);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerSvgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  heroContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroSection: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroSvg: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  heroContent: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginTop: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
    marginLeft: 14,
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
  stepsContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    marginLeft: 14,
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
    height: 24,
    marginLeft: 15,
    marginVertical: 8,
  },
  testimonialCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  testimonialText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  testimonialAuthor: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginTop: 12,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  ctaButton: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
