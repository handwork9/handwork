import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store';
import { PremiumTier } from '../../types';
import { walletService, WalletBalance } from '../../services/walletService';
import { GoPremiumIllustration } from '../../assets/illustrations/hero';

const { width } = Dimensions.get('window');

interface PlanFeature {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  included: boolean;
}

interface PremiumPlan {
  id: PremiumTier;
  name: string;
  price: string;
  period: string;
  gradient: readonly [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  popular?: boolean;
  features: PlanFeature[];
  savings?: string;
}

const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'basic',
    name: 'Premium',
    price: '₦2,500',
    period: '/month',
    gradient: ['#7B1FA2', '#AB47BC'],
    icon: 'bag-handle',
    features: [
      { icon: 'checkmark-circle', text: 'Free delivery on orders over ₦5,000', included: true },
      { icon: 'checkmark-circle', text: '5% discount on all purchases', included: true },
      { icon: 'checkmark-circle', text: 'Early access to flash sales', included: true },
      { icon: 'checkmark-circle', text: 'Priority customer support', included: true },
      { icon: 'close-circle', text: 'Exclusive member-only deals', included: false },
      { icon: 'close-circle', text: 'Free delivery on all orders', included: false },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '₦5,000',
    period: '/month',
    gradient: ['#F57C00', '#FFB74D'],
    icon: 'trophy',
    popular: true,
    savings: 'Save 20%',
    features: [
      { icon: 'checkmark-circle', text: 'Free delivery on orders over ₦3,000', included: true },
      { icon: 'checkmark-circle', text: '10% discount on all purchases', included: true },
      { icon: 'checkmark-circle', text: 'Early access to flash sales', included: true },
      { icon: 'checkmark-circle', text: 'Priority customer support', included: true },
      { icon: 'checkmark-circle', text: 'Exclusive member-only deals', included: true },
      { icon: 'close-circle', text: 'Free delivery on all orders', included: false },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '₦10,000',
    period: '/month',
    gradient: ['#1A237E', '#3949AB'],
    icon: 'diamond',
    savings: 'Best Value',
    features: [
      { icon: 'checkmark-circle', text: 'Free delivery on ALL orders', included: true },
      { icon: 'checkmark-circle', text: '15% discount on all purchases', included: true },
      { icon: 'checkmark-circle', text: 'First access to new products', included: true },
      { icon: 'checkmark-circle', text: 'VIP customer support (24/7)', included: true },
      { icon: 'checkmark-circle', text: 'Exclusive platinum-only deals', included: true },
      { icon: 'checkmark-circle', text: 'Monthly surprise rewards', included: true },
    ],
  },
];

const BENEFITS = [
  {
    icon: 'rocket' as const,
    title: 'Free Delivery',
    description: 'Get your orders delivered for free',
    color: '#34C759',
  },
  {
    icon: 'pricetag' as const,
    title: 'Discounts',
    description: 'Save up to 15% on purchases',
    color: '#FF9500',
  },
  {
    icon: 'medal' as const,
    title: 'Early Access',
    description: 'First to shop flash sales',
    color: '#FF3B30',
  },
  {
    icon: 'headset' as const,
    title: 'VIP Support',
    description: 'Priority customer support',
    color: '#007AFF',
  },
];

export default function GoPremiumScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);
  const { colors, isDark } = useTheme();
  
  const [selectedPlan, setSelectedPlan] = useState<PremiumTier>('gold');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch wallet balance on screen focus
  useFocusEffect(
    useCallback(() => {
      const fetchWalletBalance = async () => {
        try {
          setIsLoadingWallet(true);
          const balance = await walletService.getBalance();
          setWalletBalance(balance);
        } catch (error) {
          console.error('Failed to fetch wallet balance:', error);
        } finally {
          setIsLoadingWallet(false);
        }
      };
      fetchWalletBalance();
    }, [])
  );
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  const handleSubscribe = (plan: PremiumPlan) => {
    setShowPaymentModal(true);
  };

  const getPlanPrice = (plan: PremiumPlan): number => {
    return parseInt(plan.price.replace(/[₦,]/g, ''));
  };

  const selectedPlanData = PREMIUM_PLANS.find(p => p.id === selectedPlan);
  const planPrice = selectedPlanData ? getPlanPrice(selectedPlanData) : 0;
  const canAffordWithWallet = walletBalance ? walletBalance.available >= planPrice : false;

  const handleConfirmPayment = async () => {
    if (!selectedPlanData) return;

    const price = getPlanPrice(selectedPlanData);

    if (paymentMethod === 'wallet') {
      if (!canAffordWithWallet) {
        Alert.alert(
          'Insufficient Balance',
          `Your wallet balance is ₦${walletBalance?.available.toLocaleString() || 0}. You need ₦${price.toLocaleString()} to subscribe.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Top Up Wallet', 
              onPress: () => {
                setShowPaymentModal(false);
                (navigation as any).navigate('TopUp');
              }
            },
          ]
        );
        return;
      }

      try {
        setIsProcessingPayment(true);
        
        // Process wallet payment for premium subscription
        console.log('[GoPremiumScreen] Calling payForPremium with tier:', selectedPlanData.id, 'price:', price);
        const paymentResult = await walletService.payForPremium(selectedPlanData.id, price);
        console.log('[GoPremiumScreen] Payment result:', JSON.stringify(paymentResult));

        if (paymentResult.success) {
          setShowPaymentModal(false);
          Alert.alert(
            'Welcome to Premium! 🎉',
            `You've successfully subscribed to ${selectedPlanData.name}. Enjoy your benefits!`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Payment Failed', paymentResult.message || 'Failed to process payment');
        }
      } catch (error: any) {
        console.error('[GoPremiumScreen] Error:', error);
        // Extract error message from axios error response
        const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
        Alert.alert('Subscription Failed', errorMessage);
      } finally {
        setIsProcessingPayment(false);
      }
    } else {
      // Handle card payment - card payments require external verification
      Alert.alert(
        'Card Payment',
        'Card payment requires external verification. You will be redirected to complete the payment securely.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              // In production, this would redirect to Paystack or similar payment gateway
              Alert.alert(
                'Coming Soon',
                'Card payment integration is being finalized. Please use wallet payment for now.',
                [{ text: 'OK', onPress: () => setShowPaymentModal(false) }]
              );
            }
          }
        ]
      );
    }
  };

  const renderPlanCard = (plan: PremiumPlan, index: number) => {
    const isSelected = selectedPlan === plan.id;
    
    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => setSelectedPlan(plan.id)}
        activeOpacity={0.7}
        style={[
          styles.planCard,
          { 
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: isSelected ? '#16A34A' : '#E5E7EB',
          },
        ]}
      >
        {plan.popular && (
          <View style={styles.popularRibbon}>
            <Text style={styles.popularRibbonText}>MOST POPULAR</Text>
          </View>
        )}
        <View style={styles.planCardContent}>
          <LinearGradient
            colors={plan.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planIconContainer}
          >
            <Ionicons name={plan.icon} size={24} color="#FFFFFF" />
          </LinearGradient>
          
          <View style={styles.planInfo}>
            <View style={styles.planNameRow}>
              <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
              {plan.savings && (
                <View style={[styles.savingsBadge, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                  <Text style={[styles.savingsText, { color: '#16A34A' }]}>{plan.savings}</Text>
                </View>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, { color: plan.gradient[0] }]}>{plan.price}</Text>
              <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>{plan.period}</Text>
            </View>
          </View>
          
          <View style={[
            styles.radioOuter,
            { borderColor: isSelected ? '#16A34A' : '#D1D5DB' }
          ]}>
            {isSelected && (
              <View style={[styles.radioInner, { backgroundColor: '#16A34A' }]} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
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
            colors={isDark ? ['#16A34A', '#22C55E'] : ['#16A34A', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <GoPremiumIllustration size={100} />
            </View>
            <Text style={styles.heroTitle}>Unlock Premium Benefits</Text>
            <Text style={styles.heroSubtitle}>Save more on every order with exclusive perks</Text>
          </LinearGradient>
        </View>

        {/* Benefits Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WHY GO PREMIUM</Text>
          <View style={[styles.benefitsListCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {BENEFITS.map((benefit, index) => (
              <View key={index}>
                <View style={styles.benefitListItem}>
                  <View style={[styles.benefitListIcon, { backgroundColor: `${benefit.color}15` }]}>
                    <Ionicons name={benefit.icon} size={16} color={benefit.color} />
                  </View>
                  <View style={styles.benefitListContent}>
                    <Text style={[styles.benefitListTitle, { color: colors.text }]}>{benefit.title}</Text>
                    <Text style={[styles.benefitListDescription, { color: colors.textSecondary }]}>{benefit.description}</Text>
                  </View>
                </View>
                {index < BENEFITS.length - 1 && (
                  <View style={[styles.benefitListDivider, { backgroundColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB' }]} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Plans Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CHOOSE YOUR PLAN</Text>
          <View style={styles.plansContainer}>
            {PREMIUM_PLANS.map((plan, index) => renderPlanCard(plan, index))}
          </View>
        </Animated.View>

        {/* Selected Plan Features */}
        {selectedPlanData && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {selectedPlanData.name.toUpperCase()} BENEFITS
            </Text>
            <View style={[styles.featuresCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              {selectedPlanData.features.map((feature, idx) => (
                <View key={idx}>
                  <View style={styles.featureRow}>
                    <Ionicons
                      name={feature.included ? 'checkmark-circle' : 'close-circle'}
                      size={22}
                      color={feature.included ? '#16A34A' : colors.textDisabled}
                    />
                    <Text style={[
                      styles.featureText,
                      { color: feature.included ? colors.text : colors.textDisabled },
                    ]}>
                      {feature.text}
                    </Text>
                  </View>
                  {idx < selectedPlanData.features.length - 1 && (
                    <View style={[styles.featureLine, { backgroundColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB' }]} />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FREQUENTLY ASKED</Text>
          <View style={[styles.faqCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.faqItem}>
              <View style={styles.faqIconContainer}>
                <Ionicons name="help-circle-outline" size={20} color="#16A34A" />
              </View>
              <View style={styles.faqContent}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>Can I cancel anytime?</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  Yes! Cancel anytime, benefits remain until billing period ends.
                </Text>
              </View>
            </View>
            <View style={[styles.faqLine, { backgroundColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB' }]} />
            <View style={styles.faqItem}>
              <View style={styles.faqIconContainer}>
                <Ionicons name="arrow-up-circle-outline" size={20} color="#16A34A" />
              </View>
              <View style={styles.faqContent}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>How do I upgrade?</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  Upgrade anytime, price difference is prorated.
                </Text>
              </View>
            </View>
            <View style={[styles.faqLine, { backgroundColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB' }]} />
            <View style={styles.faqItem}>
              <View style={styles.faqIconContainer}>
                <Ionicons name="pricetag-outline" size={20} color="#16A34A" />
              </View>
              <View style={styles.faqContent}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>When do discounts apply?</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  Discounts are automatically applied at checkout.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.section}>
          <View style={[styles.infoCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={[styles.infoIconBg, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#16A34A" />
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your subscription is secure and you can cancel anytime. All payment information is encrypted.
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Bottom Subscribe Bar */}
      {selectedPlanData && (
        <View style={[
          styles.bottomBar, 
          { 
            paddingBottom: insets.bottom + 16,
            backgroundColor: isDark ? colors.card : '#FFFFFF',
          }
        ]}>
          <View style={styles.selectedPlanInfo}>
            <Text style={[styles.selectedPlanLabel, { color: colors.textSecondary }]}>
              {selectedPlanData.name} Plan
            </Text>
            <Text style={[styles.selectedPlanPrice, { color: colors.text }]}>
              {selectedPlanData.price}
              <Text style={[styles.selectedPlanPeriod, { color: colors.textSecondary }]}>{selectedPlanData.period}</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleSubscribe(selectedPlanData)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#16A34A', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              <Text style={styles.subscribeText}>Subscribe Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Complete Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Order Summary */}
            {selectedPlanData && (
              <View style={[styles.orderSummary, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]}>
                <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>ORDER SUMMARY</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>
                    {selectedPlanData.name} Premium Plan
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedPlanData.price}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duration</Text>
                  <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>
                    {selectedPlanData.period.replace('/', '')}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: '#16A34A' }]}>
                    {selectedPlanData.price}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment Methods */}
            <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>Payment Method</Text>
            
            {/* Wallet Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                { backgroundColor: isDark ? colors.background : '#F5F5F5', borderColor: paymentMethod === 'wallet' ? '#16A34A' : (isDark ? colors.border : '#E0E0E0') },
              ]}
              onPress={() => setPaymentMethod('wallet')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="wallet" size={24} color="#16A34A" />
                <View style={styles.paymentOptionInfo}>
                  <Text style={[styles.paymentOptionLabel, { color: colors.text }]}>Wallet</Text>
                  {isLoadingWallet ? (
                    <ActivityIndicator size="small" color="#9CA3AF" />
                  ) : (
                    <Text style={[styles.paymentOptionBalance, { color: canAffordWithWallet ? colors.textSecondary : '#EF4444' }]}>
                      Balance: ₦{(walletBalance?.available || 0).toLocaleString()}
                      {!canAffordWithWallet && ' (Insufficient)'}
                    </Text>
                  )}
                </View>
              </View>
              <View style={[
                styles.radioOuter,
                { borderColor: paymentMethod === 'wallet' ? '#16A34A' : (isDark ? colors.border : '#C7C7CC') }
              ]}>
                {paymentMethod === 'wallet' && <View style={[styles.radioInner, { backgroundColor: '#16A34A' }]} />}
              </View>
            </TouchableOpacity>

            {/* Card Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                { backgroundColor: isDark ? colors.background : '#F5F5F5', borderColor: paymentMethod === 'card' ? '#16A34A' : (isDark ? colors.border : '#E0E0E0') },
              ]}
              onPress={() => setPaymentMethod('card')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="card" size={24} color="#FF9500" />
                <View style={styles.paymentOptionInfo}>
                  <Text style={[styles.paymentOptionLabel, { color: colors.text }]}>Card Payment</Text>
                  <Text style={[styles.paymentOptionBalance, { color: colors.textSecondary }]}>
                    Visa, Mastercard, Verve
                  </Text>
                </View>
              </View>
              <View style={[
                styles.radioOuter,
                { borderColor: paymentMethod === 'card' ? '#16A34A' : (isDark ? colors.border : '#C7C7CC') }
              ]}>
                {paymentMethod === 'card' && <View style={[styles.radioInner, { backgroundColor: '#16A34A' }]} />}
              </View>
            </TouchableOpacity>

            {/* Top Up Link */}
            {paymentMethod === 'wallet' && !canAffordWithWallet && (
              <TouchableOpacity 
                style={styles.topUpLink}
                onPress={() => {
                  setShowPaymentModal(false);
                  (navigation as any).navigate('TopUp');
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#16A34A" />
                <Text style={[styles.topUpLinkText, { color: '#16A34A' }]}>Top up your wallet</Text>
              </TouchableOpacity>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmPayment}
              disabled={isProcessingPayment || (paymentMethod === 'wallet' && !canAffordWithWallet)}
            >
              <LinearGradient
                colors={(paymentMethod === 'wallet' && !canAffordWithWallet) 
                  ? ['#D1D5DB', '#E5E7EB'] 
                  : ['#16A34A', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.confirmText}>Confirm Payment</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pageTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  pageSubtitle: {
    fontSize: 15,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  quickBenefitsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  quickBenefitCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickBenefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickBenefitTitle: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: FONTS.semiBold,
  },
  benefitsListCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  benefitListIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitListContent: {
    flex: 1,
  },
  benefitListTitle: {
    fontSize: 14,
    marginBottom: 0,
    fontFamily: FONTS.semiBold,
  },
  benefitListDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  benefitListDivider: {
    height: 1,
    marginLeft: 50,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 12,
    fontFamily: FONTS.semiBold,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  popularRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    zIndex: 1,
  },
  popularRibbonText: {
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: FONTS.bold,
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  planIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
    marginLeft: 14,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  planPrice: {
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  planPeriod: {
    fontSize: 14,
    marginLeft: 2,
    fontFamily: FONTS.regular,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  featuresCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
    fontFamily: FONTS.regular,
  },
  featureLine: {
    height: 1,
    marginLeft: 50,
  },
  faqCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  faqItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  faqIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: 15,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  faqLine: {
    height: 1,
    marginLeft: 60,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedPlanInfo: {
    flex: 1,
  },
  selectedPlanLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  selectedPlanPrice: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  selectedPlanPeriod: {
    fontSize: 14,
    fontWeight: '400',
  },
  subscribeButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  subscribeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  orderSummary: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.sm,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  paymentOptionInfo: {},
  paymentOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  paymentOptionBalance: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  topUpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  topUpLinkText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  confirmButton: {
    marginTop: SPACING.md,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
  },
  confirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
});
