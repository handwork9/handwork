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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store';
import { walletService, WalletBalance } from '../../services/walletService';
import { riderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/formatters';

const { width } = Dimensions.get('window');

type SubscriptionTier = 'basic' | 'silver' | 'gold' | 'platinum';
type SubscriptionDuration = 'weekly' | 'monthly' | 'quarterly';

interface PlanFeature {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  boost: number;
  gradient: readonly [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  popular?: boolean;
  features: string[];
  pricing: {
    weekly: number;
    monthly: number;
    quarterly: number;
  };
}

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    tier: 'basic',
    name: 'Basic',
    boost: 1,
    gradient: ['#6B7280', '#9CA3AF'],
    icon: 'bicycle-outline',
    features: ['Standard order matching', 'Basic support'],
    pricing: { weekly: 0, monthly: 0, quarterly: 0 },
  },
  {
    tier: 'silver',
    name: 'Silver',
    boost: 1.5,
    gradient: ['#6B7280', '#9CA3AF'],
    icon: 'medal-outline',
    features: ['1.5x priority in order matching', 'Priority support', 'Silver badge on profile'],
    pricing: { weekly: 2000, monthly: 6000, quarterly: 15000 },
  },
  {
    tier: 'gold',
    name: 'Gold',
    boost: 2,
    gradient: ['#F57C00', '#FFB74D'],
    icon: 'trophy-outline',
    popular: true,
    features: ['2x priority in order matching', 'Priority support', 'Gold badge on profile', 'Extended delivery radius'],
    pricing: { weekly: 4000, monthly: 12000, quarterly: 30000 },
  },
  {
    tier: 'platinum',
    name: 'Platinum',
    boost: 3,
    gradient: ['#1A237E', '#3949AB'],
    icon: 'diamond-outline',
    features: ['3x priority in order matching', 'VIP support', 'Platinum badge on profile', 'Extended delivery radius', 'Featured in top riders', 'Lower commission rates'],
    pricing: { weekly: 7000, monthly: 20000, quarterly: 50000 },
  },
];

const BENEFITS = [
  {
    icon: 'flash' as const,
    title: 'Priority Jobs',
    description: 'Get matched to orders first',
    color: '#34C759',
  },
  {
    icon: 'cash' as const,
    title: 'More Earnings',
    description: 'Access to more delivery requests',
    color: '#FF9500',
  },
  {
    icon: 'medal' as const,
    title: 'Profile Badge',
    description: 'Stand out with premium badge',
    color: '#FF3B30',
  },
  {
    icon: 'headset' as const,
    title: 'VIP Support',
    description: 'Priority customer support',
    color: '#007AFF',
  },
];

export default function RiderSubscriptionScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('gold');
  const [selectedDuration, setSelectedDuration] = useState<SubscriptionDuration>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch subscription tiers from backend
  const { data: tiersData, isLoading: isLoadingTiers } = useQuery({
    queryKey: ['rider-subscription-tiers'],
    queryFn: async () => {
      try {
        const result = await riderService.getSubscriptionTiers();
        return (result as any) || DEFAULT_PLANS;
      } catch (error) {
        console.log('Using default plans');
        return DEFAULT_PLANS;
      }
    },
  });

  // Fetch current subscription
  const { data: currentSubscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['rider-current-subscription'],
    queryFn: async () => {
      try {
        const result = await riderService.getCurrentSubscription();
        return (result as any)?.subscription || null;
      } catch (error) {
        return null;
      }
    },
  });

  const plans: SubscriptionPlan[] = useMemo(() => {
    if (tiersData && Array.isArray(tiersData)) {
      return tiersData.map((tier: any) => ({
        tier: tier.tier,
        name: tier.name,
        boost: tier.boost,
        gradient: tier.tier === 'platinum' ? ['#1A237E', '#3949AB'] :
                  tier.tier === 'gold' ? ['#F57C00', '#FFB74D'] :
                  tier.tier === 'silver' ? ['#6B7280', '#9CA3AF'] :
                  ['#6B7280', '#9CA3AF'],
        icon: tier.tier === 'platinum' ? 'diamond-outline' :
              tier.tier === 'gold' ? 'trophy-outline' :
              tier.tier === 'silver' ? 'medal-outline' :
              'bicycle-outline',
        popular: tier.tier === 'gold',
        features: tier.benefits || [],
        pricing: tier.pricing || { weekly: 0, monthly: 0, quarterly: 0 },
      }));
    }
    return DEFAULT_PLANS;
  }, [tiersData]);

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

  // Subscribe mutation - use wallet payment only
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      return riderService.subscribeToPremium(selectedTier, selectedDuration, 'wallet', false);
    },
    onSuccess: (result) => {
      setShowPaymentModal(false);
      queryClient.invalidateQueries({ queryKey: ['rider-current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['rider-profile'] });
      Alert.alert(
        'Success! 🎉',
        `You are now a ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} member!`,
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to subscribe. Please try again.');
    },
  });
  
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

  const selectedPlan = useMemo(() => plans.find(p => p.tier === selectedTier), [plans, selectedTier]);
  const price = selectedPlan?.pricing[selectedDuration] || 0;
  const hasActiveSubscription = currentSubscription && currentSubscription.status === 'active';
  const currentTier = currentSubscription?.tier;

  const handleSubscribe = async () => {
    if (selectedTier === 'basic') {
      Alert.alert('Free Tier', 'Basic tier is free and doesn\'t require a subscription.');
      return;
    }

    if (hasActiveSubscription && currentTier === selectedTier) {
      Alert.alert('Already Subscribed', `You already have an active ${selectedTier} subscription.`);
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (price <= 0) {
      Alert.alert('Free Tier', 'Basic tier is free.');
      return;
    }

    // Check wallet balance
    const available = walletBalance?.available || 0;
    if (available < price) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${formatCurrency(price)} but only have ${formatCurrency(available)} available.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Fund Wallet', onPress: () => {
            setShowPaymentModal(false);
            (navigation as any).navigate('Wallet');
          }},
        ]
      );
      return;
    }

    setIsProcessingPayment(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await subscribeMutation.mutateAsync();
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getDurationLabel = (duration: SubscriptionDuration) => {
    switch (duration) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
    }
  };

  const getDurationSavings = (duration: SubscriptionDuration, plan: SubscriptionPlan) => {
    if (duration === 'weekly' || plan.pricing.weekly === 0) return null;
    const weeklyTotal = plan.pricing.weekly * (duration === 'monthly' ? 4 : 12);
    const actualPrice = plan.pricing[duration];
    const savings = weeklyTotal - actualPrice;
    if (savings > 0) {
      return `Save ${formatCurrency(savings)}`;
    }
    return null;
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedTier === plan.tier;
    const isCurrent = currentTier === plan.tier;
    const planPrice = plan.pricing[selectedDuration];

    return (
      <TouchableOpacity
        key={plan.tier}
        style={[
          styles.planCard,
          { backgroundColor: isDark ? colors.card : COLORS.surface },
          isSelected && styles.planCardSelected,
          isCurrent && styles.planCardCurrent,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedTier(plan.tier);
        }}
        activeOpacity={0.8}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>POPULAR</Text>
          </View>
        )}
        {isCurrent && (
          <View style={[styles.popularBadge, { backgroundColor: COLORS.success }]}>
            <Text style={styles.popularBadgeText}>CURRENT</Text>
          </View>
        )}

        <LinearGradient
          colors={plan.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planIconContainer}
        >
          <Ionicons name={plan.icon} size={28} color="#FFFFFF" />
        </LinearGradient>

        <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
        <Text style={[styles.planBoost, { color: colors.textSecondary }]}>
          {plan.boost}x Priority
        </Text>

        <View style={styles.planPriceContainer}>
          <Text style={[styles.planPrice, { color: colors.text }]}>
            {planPrice === 0 ? 'Free' : formatCurrency(planPrice)}
          </Text>
          {planPrice > 0 && (
            <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>
              /{selectedDuration === 'weekly' ? 'wk' : selectedDuration === 'monthly' ? 'mo' : 'qtr'}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Fixed Header */}
      <Animated.View 
        style={[
          styles.fixedHeader, 
          { 
            paddingTop: insets.top, 
            backgroundColor: isDark ? colors.background : '#F2F2F7',
            opacity: headerOpacity,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Premium Plans</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      {/* Initial Back Button (visible before scroll) */}
      <View style={[styles.initialBackButton, { top: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButtonCircle}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 200 }}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { paddingTop: insets.top + 60 }]}>
          <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            {/* SVG Background */}
            <View style={styles.heroCardSvg}>
              <Svg width="200" height="200" viewBox="0 0 200 200">
                <Circle cx="150" cy="50" r="80" fill={COLORS.primary} fillOpacity={0.08} />
                <Circle cx="180" cy="100" r="50" fill={COLORS.primary} fillOpacity={0.06} />
                <Circle cx="120" cy="30" r="30" fill="#2E7D32" fillOpacity={0.05} />
              </Svg>
            </View>

            <View style={[styles.heroIconContainer, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' }]}>
              <Ionicons name="rocket" size={48} color={COLORS.primary} />
            </View>
            <Animated.Text 
              style={[
                styles.heroTitle,
                { color: colors.text, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              Boost Your Earnings
            </Animated.Text>
            <Animated.Text 
              style={[
                styles.heroSubtitle,
                { color: colors.textSecondary, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              Get priority access to more delivery jobs
            </Animated.Text>

            {/* Current Status */}
            {hasActiveSubscription && (
              <View style={[styles.currentStatusBadge, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={[styles.currentStatusText, { color: COLORS.primary }]}>
                  Active: {currentTier?.charAt(0).toUpperCase() + currentTier?.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Benefits */}
        <Animated.View 
          style={[
            styles.benefitsContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Why Go Premium?</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={[styles.benefitCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
                <View style={[styles.benefitIcon, { backgroundColor: `${benefit.color}20` }]}>
                  <Ionicons name={benefit.icon} size={24} color={benefit.color} />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>{benefit.title}</Text>
                <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Duration Selector */}
        <View style={styles.durationSection}>
          <Text style={[styles.durationSectionTitle, { color: colors.text }]}>Choose Duration</Text>
          <View style={[styles.durationContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {([
              { key: 'weekly' as SubscriptionDuration, label: 'Weekly', sublabel: 'Billed weekly', discount: null },
              { key: 'monthly' as SubscriptionDuration, label: 'Monthly', sublabel: '4 weeks', discount: '15% OFF' },
              { key: 'quarterly' as SubscriptionDuration, label: 'Quarterly', sublabel: '12 weeks', discount: '25% OFF' },
            ]).map((item) => {
              const isActive = selectedDuration === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.durationOption,
                    { backgroundColor: isActive ? COLORS.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5') },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDuration(item.key);
                  }}
                  activeOpacity={0.8}
                >
                  {item.discount && (
                    <View style={[styles.discountBadge, { backgroundColor: isActive ? '#FFF' : '#FF6B6B' }]}>
                      <Text style={[styles.discountBadgeText, { color: isActive ? COLORS.primary : '#FFF' }]}>{item.discount}</Text>
                    </View>
                  )}
                  <Text style={[styles.durationLabel, { color: isActive ? '#FFF' : colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.durationSublabel, { color: isActive ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
                    {item.sublabel}
                  </Text>
                  {isActive && (
                    <View style={styles.durationCheckmark}>
                      <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Plan</Text>
          <View style={styles.plansGrid}>
            {plans.map(renderPlanCard)}
          </View>
        </View>

        {/* Selected Plan Features */}
        {selectedPlan && (
          <View style={[styles.featuresContainer, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              {selectedPlan.name} Benefits
            </Text>
            {selectedPlan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={selectedTier === 'basic' ? colors.textSecondary : COLORS.success} 
                />
                <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* Bottom CTA */}
      <View style={[
        styles.bottomCTA, 
        { 
          paddingBottom: insets.bottom + SPACING.md,
          backgroundColor: isDark ? colors.card : COLORS.surface,
        }
      ]}>
        <View style={styles.priceRow}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.totalPrice, { color: colors.text }]}>
            {price === 0 ? 'Free' : formatCurrency(price)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            (selectedTier === 'basic' || (hasActiveSubscription && currentTier === selectedTier)) && styles.subscribeButtonDisabled,
          ]}
          onPress={handleSubscribe}
          disabled={selectedTier === 'basic' || (hasActiveSubscription && currentTier === selectedTier)}
        >
          <LinearGradient
            colors={selectedTier === 'basic' || (hasActiveSubscription && currentTier === selectedTier) 
              ? ['#9CA3AF', '#9CA3AF'] 
              : [COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeButtonGradient}
          >
            <Text style={styles.subscribeButtonText}>
              {hasActiveSubscription && currentTier === selectedTier 
                ? 'Current Plan' 
                : selectedTier === 'basic' 
                  ? 'Free Plan' 
                  : 'Subscribe Now'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Complete Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalPlanInfo}>
              <LinearGradient
                colors={selectedPlan?.gradient || ['#6B7280', '#9CA3AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalPlanIcon}
              >
                <Ionicons name={selectedPlan?.icon || 'bicycle'} size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modalPlanDetails}>
                <Text style={[styles.modalPlanName, { color: colors.text }]}>
                  {selectedPlan?.name} Plan
                </Text>
                <Text style={[styles.modalPlanDuration, { color: colors.textSecondary }]}>
                  {getDurationLabel(selectedDuration)} Subscription
                </Text>
              </View>
              <Text style={[styles.modalPlanPrice, { color: colors.text }]}>
                {formatCurrency(price)}
              </Text>
            </View>

            <View style={styles.paymentMethodsContainer}>
              <Text style={[styles.paymentMethodsTitle, { color: colors.text }]}>
                Payment Method
              </Text>
              
              <View
                style={[
                  styles.paymentMethodOption,
                  { backgroundColor: isDark ? colors.background : '#F5F5F5' },
                  styles.paymentMethodActive,
                ]}
              >
                <Ionicons name="wallet" size={24} color={COLORS.primary} />
                <View style={styles.paymentMethodInfo}>
                  <Text style={[styles.paymentMethodName, { color: colors.text }]}>Wallet</Text>
                  <Text style={[styles.paymentMethodBalance, { color: colors.textSecondary }]}>
                    Balance: {isLoadingWallet ? '...' : formatCurrency(walletBalance?.available || 0)}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.payButton, isProcessingPayment && styles.payButtonDisabled]}
              onPress={handlePayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.payButtonText}>Pay {formatCurrency(price)}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
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
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialBackButton: {
    position: 'absolute',
    left: SPACING.md,
    zIndex: 50,
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  heroSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardSvg: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginTop: SPACING.md,
  },
  currentStatusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
  benefitsContainer: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  benefitCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  benefitTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  durationSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  durationSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  durationContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 8,
    gap: 8,
    ...SHADOWS.small,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  durationLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  durationSublabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  durationCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  plansContainer: {
    padding: SPACING.md,
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  planCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.small,
    position: 'relative',
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  planCardCurrent: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  planName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  planBoost: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  planPeriod: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginLeft: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  featuresContainer: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  featuresTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    ...SHADOWS.medium,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  totalPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  subscribeButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  modalPlanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPlanDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  modalPlanName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  modalPlanDuration: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  modalPlanPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  paymentMethodsContainer: {
    marginBottom: SPACING.lg,
  },
  paymentMethodsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  paymentMethodActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  paymentMethodName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  paymentMethodBalance: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
