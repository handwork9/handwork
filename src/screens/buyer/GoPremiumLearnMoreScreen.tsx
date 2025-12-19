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
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { BuyerStackParamList } from '../../types';
import { GoPremiumIllustration } from '../../assets/illustrations/hero';

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

const { width } = Dimensions.get('window');

const PREMIUM_TIERS = [
  {
    name: 'Premium',
    price: '₦2,500',
    period: '/month',
    gradient: ['#7B1FA2', '#AB47BC'] as const,
    icon: 'bag-handle' as const,
    delivery: 'Free on orders over ₦5,000',
    discount: '5%',
    support: 'Priority',
  },
  {
    name: 'Gold',
    price: '₦5,000',
    period: '/month',
    gradient: ['#F57C00', '#FFB74D'] as const,
    icon: 'trophy' as const,
    delivery: 'Free on orders over ₦3,000',
    discount: '10%',
    support: 'Priority+',
    popular: true,
  },
  {
    name: 'Platinum',
    price: '₦10,000',
    period: '/month',
    gradient: ['#1A237E', '#3949AB'] as const,
    icon: 'diamond' as const,
    delivery: 'Free on ALL orders',
    discount: '15%',
    support: 'VIP 24/7',
  },
];

const FEATURES = [
  {
    icon: 'rocket-outline' as const,
    title: 'Free Delivery',
    description: 'Save on every order with free delivery. Higher tiers unlock free delivery on all orders regardless of order size.',
    gradient: ['#4CAF50', '#2E7D32'] as const,
  },
  {
    icon: 'pricetag-outline' as const,
    title: 'Exclusive Discounts',
    description: 'Enjoy up to 15% off on every purchase. The more you shop, the more you save with premium membership.',
    gradient: ['#FF9800', '#F57C00'] as const,
  },
  {
    icon: 'flash-outline' as const,
    title: 'Early Access',
    description: 'Be the first to shop flash sales and new product launches. Never miss out on limited deals again.',
    gradient: ['#E91E63', '#C2185B'] as const,
  },
  {
    icon: 'headset-outline' as const,
    title: 'VIP Support',
    description: 'Skip the queue with priority customer support. Platinum members get 24/7 dedicated assistance.',
    gradient: ['#2196F3', '#1565C0'] as const,
  },
  {
    icon: 'gift-outline' as const,
    title: 'Monthly Rewards',
    description: 'Platinum members receive surprise rewards every month. Special vouchers, bonus points, and more!',
    gradient: ['#9C27B0', '#7B1FA2'] as const,
  },
  {
    icon: 'star-outline' as const,
    title: 'Member-Only Deals',
    description: 'Access exclusive deals and products available only to premium members. More value for your money.',
    gradient: ['#FF5722', '#E64A19'] as const,
  },
];

const FAQ_ITEMS = [
  {
    question: 'When does my premium membership start?',
    answer: 'Your premium membership starts immediately after successful payment and is valid for 30 days.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes! You can change your plan at any time. The new rate will be applied from your next billing cycle.',
  },
  {
    question: 'How does free delivery work?',
    answer: 'Free delivery is automatically applied at checkout when your order meets the minimum requirement for your tier.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'You can cancel anytime. Your benefits remain active until the end of your current billing period.',
  },
  {
    question: 'Are discounts applied automatically?',
    answer: 'Yes, your member discount is automatically applied to all eligible items at checkout.',
  },
];

export default function GoPremiumLearnMoreScreen() {
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

  const renderTierCard = (tier: typeof PREMIUM_TIERS[0], index: number) => (
    <Animated.View
      key={tier.name}
      style={[
        styles.tierCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={tier.gradient}
        style={styles.tierGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {tier.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        <View style={styles.tierHeader}>
          <View style={styles.tierIconContainer}>
            <Ionicons name={tier.icon} size={24} color="#FFF" />
          </View>
          <View>
            <Text style={styles.tierName}>{tier.name}</Text>
            <Text style={styles.tierPrice}>
              {tier.price}<Text style={styles.tierPeriod}>{tier.period}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.tierBenefits}>
          <View style={styles.tierBenefit}>
            <Ionicons name="bicycle-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.tierBenefitText}>{tier.delivery}</Text>
          </View>
          <View style={styles.tierBenefit}>
            <Ionicons name="pricetag-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.tierBenefitText}>{tier.discount} off all purchases</Text>
          </View>
          <View style={styles.tierBenefit}>
            <Ionicons name="headset-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.tierBenefitText}>{tier.support} support</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderFeatureCard = (feature: typeof FEATURES[0], index: number) => (
    <Animated.View
      key={feature.title}
      style={[
        styles.featureCard,
        { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={feature.gradient}
        style={styles.featureIconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={feature.icon} size={24} color="#FFF" />
      </LinearGradient>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
        <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
          {feature.description}
        </Text>
      </View>
    </Animated.View>
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
          <Text style={[styles.pageTitle, { color: colors.text }]}>Go Premium</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            Unlock exclusive benefits and savings
          </Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={isDark ? ['#F57C00', '#FFB74D'] : ['#F57C00', '#FFB74D']}
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
              <GoPremiumIllustration size={100} />
            </Animated.View>
            <Text style={styles.heroTitle}>Unlock Premium Benefits</Text>
            <Text style={styles.heroSubtitle}>Save more on every order with exclusive perks</Text>
          </LinearGradient>
        </View>

        {/* Intro Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Why Go Premium?
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Join thousands of happy members who save money and enjoy exclusive perks with our premium membership.
          </Text>
        </View>

        {/* Tier Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choose Your Plan
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tiersContainer}
            decelerationRate="fast"
            snapToInterval={width * 0.75 + 12}
          >
            {PREMIUM_TIERS.map((tier, index) => renderTierCard(tier, index))}
          </ScrollView>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Premium Benefits
          </Text>
          {FEATURES.map((feature, index) => renderFeatureCard(feature, index))}
        </View>

        {/* Comparison Table */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Compare Plans
          </Text>
          <View style={[
            styles.comparisonTable,
            { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }
          ]}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableFeatureCell}>
                <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>Feature</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableHeaderText, { color: '#7B1FA2' }]}>Premium</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableHeaderText, { color: '#F57C00' }]}>Gold</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableHeaderText, { color: '#1A237E' }]}>Platinum</Text>
              </View>
            </View>
            
            {/* Discount Row */}
            <View style={[styles.tableRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.tableFeatureCell}>
                <Text style={[styles.tableFeatureText, { color: colors.text }]}>Discount</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableCellText, { color: colors.text }]}>5%</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableCellText, { color: colors.text }]}>10%</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableCellText, { color: colors.text }]}>15%</Text>
              </View>
            </View>
            
            {/* Free Delivery Row */}
            <View style={[styles.tableRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.tableFeatureCell}>
                <Text style={[styles.tableFeatureText, { color: colors.text }]}>Free Delivery</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableCellText, { color: colors.text }]}>₦5k+</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableCellText, { color: colors.text }]}>₦3k+</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </View>
            </View>
            
            {/* Early Access Row */}
            <View style={[styles.tableRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.tableFeatureCell}>
                <Text style={[styles.tableFeatureText, { color: colors.text }]}>Early Access</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </View>
              <View style={styles.tableTierCell}>
                <Text style={[styles.tableCellText, { color: '#4CAF50', fontFamily: FONTS.semiBold }]}>First</Text>
              </View>
            </View>
            
            {/* Member Deals Row */}
            <View style={[styles.tableRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.tableFeatureCell}>
                <Text style={[styles.tableFeatureText, { color: colors.text }]}>Member Deals</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="close-circle" size={18} color="#FF3B30" />
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </View>
            </View>
            
            {/* Monthly Rewards Row */}
            <View style={[styles.tableRow, styles.lastTableRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.tableFeatureCell}>
                <Text style={[styles.tableFeatureText, { color: colors.text }]}>Monthly Rewards</Text>
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="close-circle" size={18} color="#FF3B30" />
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="close-circle" size={18} color="#FF3B30" />
              </View>
              <View style={styles.tableTierCell}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </View>
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
          onPress={() => navigation.navigate('GoPremium')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F57C00', '#FFB74D']}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="diamond" size={20} color="#FFF" />
            <Text style={styles.ctaText}>Get Premium Now</Text>
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  tiersContainer: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  tierCard: {
    width: width * 0.75,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tierGradient: {
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  tierPrice: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginTop: 2,
  },
  tierPeriod: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  tierBenefits: {
    marginTop: 20,
    gap: 10,
  },
  tierBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierBenefitText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  featureCard: {
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
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  comparisonTable: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeader: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: 14,
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  tableFeatureCell: {
    flex: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  tableTierCell: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tableHeaderText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
  },
  tableFeatureText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  tableCellText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
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
