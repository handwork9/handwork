import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { BuyerStackParamList } from '../../types';
import { VerifiedSellerIllustration } from '../../assets/illustrations/hero';

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

const { width } = Dimensions.get('window');

const VERIFICATION_BADGES = [
  {
    icon: 'shield-checkmark' as const,
    title: 'Identity Verified',
    description: 'Government ID and business registration confirmed',
    color: '#2196F3',
  },
  {
    icon: 'location' as const,
    title: 'Farm Verified',
    description: 'Physical farm location inspected and verified',
    color: '#4CAF50',
  },
  {
    icon: 'leaf' as const,
    title: 'Quality Certified',
    description: 'Products meet our quality and freshness standards',
    color: '#8BC34A',
  },
  {
    icon: 'star' as const,
    title: 'Highly Rated',
    description: 'Maintains 4.5+ star rating from customers',
    color: '#FFC107',
  },
];

const BENEFITS = [
  {
    icon: 'checkmark-shield-outline' as const,
    title: 'Quality Guarantee',
    description: 'All products from verified sellers are backed by our quality guarantee. If you\'re not satisfied, we\'ll make it right.',
    gradient: ['#4CAF50', '#2E7D32'] as const,
  },
  {
    icon: 'refresh-outline' as const,
    title: 'Easy Returns',
    description: 'Hassle-free returns within 24 hours of delivery if products don\'t meet your expectations.',
    gradient: ['#2196F3', '#1565C0'] as const,
  },
  {
    icon: 'time-outline' as const,
    title: 'Fresh & Fast',
    description: 'Verified sellers are prioritized for faster dispatch, ensuring you get the freshest produce quickly.',
    gradient: ['#FF9800', '#F57C00'] as const,
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'Direct Communication',
    description: 'Chat directly with farmers about their products, growing methods, and availability.',
    gradient: ['#9C27B0', '#7B1FA2'] as const,
  },
  {
    icon: 'leaf-outline' as const,
    title: 'Sustainable Practices',
    description: 'Many verified sellers use organic and sustainable farming methods for healthier produce.',
    gradient: ['#009688', '#00695C'] as const,
  },
  {
    icon: 'wallet-outline' as const,
    title: 'Fair Pricing',
    description: 'Buy directly from farmers at fair prices. No middlemen means better value for you.',
    gradient: ['#E91E63', '#C2185B'] as const,
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Farmer Applies',
    description: 'Farmers submit their application with documentation and farm details.',
  },
  {
    step: 2,
    title: 'We Verify',
    description: 'Our team reviews documents, conducts farm inspections, and verifies quality standards.',
  },
  {
    step: 3,
    title: 'Badge Awarded',
    description: 'Approved farmers receive the verified badge, visible on their profile and products.',
  },
  {
    step: 4,
    title: 'Ongoing Monitoring',
    description: 'We continuously monitor ratings, reviews, and quality to maintain standards.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How do I identify verified sellers?',
    answer: 'Verified sellers have a blue checkmark badge on their profile and products. You can also filter search results to show only verified sellers.',
  },
  {
    question: 'Are non-verified sellers safe to buy from?',
    answer: 'All sellers on our platform are screened. Verified sellers have undergone additional verification for extra assurance.',
  },
  {
    question: 'What if I have an issue with a verified seller?',
    answer: 'Contact our support team. Issues with verified sellers are prioritized and resolved within 24 hours.',
  },
  {
    question: 'How often is verification renewed?',
    answer: 'Verification is reviewed annually and can be revoked if a seller falls below our standards.',
  },
  {
    question: 'Can I request a seller to become verified?',
    answer: 'You can suggest sellers for verification through our app. We\'ll reach out to them about the verification process.',
  },
];

export default function VerifiedSellersLearnMoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderBadgeCard = (badge: typeof VERIFICATION_BADGES[0], index: number) => (
    <Animated.View
      key={badge.title}
      style={[
        styles.badgeCard,
        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.badgeIconContainer, { backgroundColor: `${badge.color}15` }]}>
        <Ionicons name={badge.icon} size={24} color={badge.color} />
      </View>
      <View style={styles.badgeContent}>
        <Text style={[styles.badgeTitle, { color: colors.text }]}>{badge.title}</Text>
        <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
          {badge.description}
        </Text>
      </View>
    </Animated.View>
  );

  const renderBenefitCard = (benefit: typeof BENEFITS[0], index: number) => (
    <Animated.View
      key={benefit.title}
      style={[
        styles.benefitCard,
        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={benefit.gradient}
        style={styles.benefitIconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={benefit.icon} size={24} color="#FFF" />
      </LinearGradient>
      <View style={styles.benefitContent}>
        <Text style={[styles.benefitTitle, { color: colors.text }]}>{benefit.title}</Text>
        <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
          {benefit.description}
        </Text>
      </View>
    </Animated.View>
  );

  const renderStepCard = (step: typeof HOW_IT_WORKS[0], index: number) => (
    <View
      key={step.step}
      style={[
        styles.stepCard,
        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
      ]}
    >
      <View style={styles.stepNumberContainer}>
        <LinearGradient
          colors={['#2196F3', '#1565C0']}
          style={styles.stepNumber}
        >
          <Text style={styles.stepNumberText}>{step.step}</Text>
        </LinearGradient>
        {index < HOW_IT_WORKS.length - 1 && (
          <View style={[styles.stepLine, { backgroundColor: isDark ? '#333' : '#E5E5EA' }]} />
        )}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
        <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
          {step.description}
        </Text>
      </View>
    </View>
  );

  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  const renderFaqItem = (item: typeof FAQ_ITEMS[0], index: number) => {
    const isExpanded = expandedFaq === index;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.faqItem,
          { 
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          },
        ]}
        onPress={() => setExpandedFaq(isExpanded ? null : index)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={colors.textSecondary} 
          />
        </View>
        {isExpanded && (
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
            {item.answer}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackButton, { top: insets.top + 10 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#1F2937'} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100, paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <View style={styles.pageTitleContainer}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Verified Sellers</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            Shop with confidence from trusted farmers
          </Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={isDark ? ['#1976D2', '#42A5F5'] : ['#1976D2', '#42A5F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Animated.View 
              style={[
                styles.heroIconContainer,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <VerifiedSellerIllustration size={100} />
            </Animated.View>
            <Text style={styles.heroTitle}>Quality You Can Trust</Text>
            <Text style={styles.heroSubtitle}>Every verified seller meets our strict standards</Text>
          </LinearGradient>
        </View>

        {/* Intro Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What is Verified?
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Our Verified Seller program identifies farmers who have passed our rigorous verification process. Look for the blue checkmark badge to shop from sellers you can trust.
          </Text>
        </View>

        {/* Verification Badges */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Verification Criteria
          </Text>
          <View style={styles.badgesContainer}>
            {VERIFICATION_BADGES.map((badge, index) => renderBadgeCard(badge, index))}
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Benefits of Buying Verified
          </Text>
          {BENEFITS.map((benefit, index) => renderBenefitCard(benefit, index))}
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How Verification Works
          </Text>
          <View style={[styles.stepsContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {HOW_IT_WORKS.map((step, index) => renderStepCard(step, index))}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <View style={[styles.statsCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#2196F3' }]}>500+</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Verified Farmers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#E5E5EA' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>4.8★</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg. Rating</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? '#333' : '#E5E5EA' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF9800' }]}>98%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>
          {FAQ_ITEMS.map((item, index) => renderFaqItem(item, index))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[
        styles.bottomCta,
        { 
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          paddingBottom: insets.bottom + 16,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }
      ]}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Search', { verifiedOnly: true })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1976D2', '#42A5F5']}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="shield-checkmark" size={20} color="#FFF" />
            <Text style={styles.ctaText}>Browse Verified Sellers</Text>
          </LinearGradient>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  pageTitleContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  heroSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  badgesContainer: {
    gap: 10,
  },
  badgeCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  badgeDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  benefitCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  stepsContainer: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepCard: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  stepNumberContainer: {
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
    marginBottom: -8,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  faqItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
});
