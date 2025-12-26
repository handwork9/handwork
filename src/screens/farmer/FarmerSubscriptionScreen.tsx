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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store';
import { walletService, WalletBalance } from '../../services/walletService';
import { farmerSubscriptionService, FarmerSubscriptionTier } from '../../services/farmerSubscriptionService';
import { VerifiedSellerIllustration } from '../../assets/illustrations/hero';

const { width } = Dimensions.get('window');

interface PlanFeature {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: FarmerSubscriptionTier;
  name: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  gradient: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  popular?: boolean;
  features: PlanFeature[];
  boost: number;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 0,
    quarterlyPrice: 0,
    yearlyPrice: 0,
    gradient: ['#6B7280', '#9CA3AF'],
    icon: 'leaf-outline',
    boost: 1.0,
    features: [
      { icon: 'checkmark-circle', text: 'Standard product listing', included: true },
      { icon: 'checkmark-circle', text: 'Basic customer support', included: true },
      { icon: 'close-circle', text: 'Verified seller badge', included: false },
      { icon: 'close-circle', text: 'Priority in search results', included: false },
      { icon: 'close-circle', text: 'Featured in verified section', included: false },
      { icon: 'close-circle', text: 'Lower platform commission', included: false },
    ],
  },
  {
    id: 'verified',
    name: 'Verified Seller',
    monthlyPrice: 3000,
    quarterlyPrice: 7500,
    yearlyPrice: 25000,
    gradient: ['#1DA1F2', '#0D8ECF'],
    icon: 'checkmark-circle',
    popular: true,
    boost: 1.5,
    features: [
      { icon: 'checkmark-circle', text: 'Verified seller badge on products', included: true },
      { icon: 'checkmark-circle', text: '1.5x visibility boost in search', included: true },
      { icon: 'checkmark-circle', text: 'Priority customer support', included: true },
      { icon: 'checkmark-circle', text: 'Featured in verified sellers section', included: true },
      { icon: 'checkmark-circle', text: 'Trust badge builds buyer confidence', included: true },
      { icon: 'close-circle', text: 'Lower platform commission', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium Seller',
    monthlyPrice: 7000,
    quarterlyPrice: 18000,
    yearlyPrice: 60000,
    gradient: ['#FFD700', '#FFA500'],
    icon: 'diamond',
    boost: 2.5,
    features: [
      { icon: 'checkmark-circle', text: 'Premium seller badge on products', included: true },
      { icon: 'checkmark-circle', text: '2.5x visibility boost in search', included: true },
      { icon: 'checkmark-circle', text: 'VIP 24/7 customer support', included: true },
      { icon: 'checkmark-circle', text: 'Top placement in category listings', included: true },
      { icon: 'checkmark-circle', text: 'Featured on homepage', included: true },
      { icon: 'checkmark-circle', text: 'Lower platform commission', included: true },
    ],
  },
];

const BENEFITS = [
  {
    icon: 'shield-checkmark' as const,
    title: 'Verified Badge',
    description: 'Build trust with buyers',
    color: '#1DA1F2',
  },
  {
    icon: 'trending-up' as const,
    title: 'Visibility Boost',
    description: 'Up to 2.5x more views',
    color: '#34C759',
  },
  {
    icon: 'search' as const,
    title: 'Search Priority',
    description: 'Rank higher in results',
    color: '#FF9500',
  },
  {
    icon: 'headset' as const,
    title: 'VIP Support',
    description: 'Priority assistance',
    color: '#007AFF',
  },
];

type DurationType = 'monthly' | 'quarterly' | 'yearly';

export default function FarmerSubscriptionScreen() {
  console.log('[FarmerSubscriptionScreen] Rendering...');
  
  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  
  // State hooks
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FarmerSubscriptionTier>('verified');
  const [selectedDuration, setSelectedDuration] = useState<DurationType>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const badgeRotate = useRef(new Animated.Value(0)).current;

  // Query hook
  const { data: currentSubscription, isLoading: isLoadingSubscription, error: subscriptionError } = useQuery({
    queryKey: ['farmer-subscription'],
    queryFn: async () => {
      console.log('[FarmerSubscriptionScreen] Fetching current subscription...');
      try {
        const result = await farmerSubscriptionService.getCurrentSubscription();
        console.log('[FarmerSubscriptionScreen] Subscription result:', JSON.stringify(result));
        return result;
      } catch (error: any) {
        console.error('[FarmerSubscriptionScreen] Error fetching subscription:', error?.message, error?.response?.status);
        return { hasActiveSubscription: false };
      }
    },
    retry: false,
    enabled: showFullScreen, // Only fetch when full screen is shown
  });

  // Mutation hook
  const subscribeMutation = useMutation({
    mutationFn: async (data: { tier: FarmerSubscriptionTier; duration: DurationType }) => {
      console.log('[FarmerSubscriptionScreen] Subscribing with:', data);
      try {
        const result = await farmerSubscriptionService.subscribe(data.tier, data.duration, 'wallet');
        console.log('[FarmerSubscriptionScreen] Subscribe result:', JSON.stringify(result));
        return result;
      } catch (error: any) {
        console.error('[FarmerSubscriptionScreen] Subscribe error:', error?.message, error?.response?.data);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[FarmerSubscriptionScreen] Subscribe success:', data);
      queryClient.invalidateQueries({ queryKey: ['farmer-subscription'] });
      setShowPaymentModal(false);
      Alert.alert(
        '🎉 Subscription Activated!',
        `You are now a ${selectedPlan === 'verified' ? 'Verified' : 'Premium'} Seller! Your products will now show the verified badge to buyers.`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    },
    onError: (error: any) => {
      console.error('[FarmerSubscriptionScreen] Subscribe mutation error:', error);
      Alert.alert(
        'Subscription Failed',
        error?.response?.data?.message || error?.message || 'Failed to process subscription. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Effect hooks
  useFocusEffect(
    useCallback(() => {
      if (!showFullScreen) return;
      
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
    }, [showFullScreen])
  );

  useEffect(() => {
    if (!showFullScreen) return;
    
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(badgeRotate, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [showFullScreen]);

  useEffect(() => {
    if (subscriptionError) {
      console.error('[FarmerSubscriptionScreen] Query error:', subscriptionError);
    }
  }, [subscriptionError]);

  // NOW we can have conditional returns after all hooks
  if (!showFullScreen) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={['#1DA1F2', '#0D8ECF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600' }}>Verified Seller</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
          <View style={{ backgroundColor: '#1DA1F2', width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={60} color="#FFF" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>Become a Verified Seller</Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 30 }}>
            Build trust and boost your sales with the verified badge
          </Text>
          
          <TouchableOpacity 
            style={{ backgroundColor: '#1DA1F2', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10, marginBottom: 20 }}
            onPress={() => setShowFullScreen(true)}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>View Subscription Plans</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#1DA1F2', fontSize: 14 }}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Helper functions for full screen
  const badgeRotateInterpolate = badgeRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const getPrice = (plan: SubscriptionPlan) => {
    switch (selectedDuration) {
      case 'quarterly':
        return plan.quarterlyPrice;
      case 'yearly':
        return plan.yearlyPrice;
      default:
        return plan.monthlyPrice;
    }
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (selectedDuration === 'quarterly') {
      const monthly = plan.monthlyPrice * 3;
      const savings = monthly - plan.quarterlyPrice;
      return savings > 0 ? `Save ₦${savings?.toLocaleString() || '0'}` : null;
    }
    if (selectedDuration === 'yearly') {
      const monthly = plan.monthlyPrice * 12;
      const savings = monthly - plan.yearlyPrice;
      return savings > 0 ? `Save ₦${savings?.toLocaleString() || '0'}` : null;
    }
    return null;
  };

  const getDurationLabel = () => {
    switch (selectedDuration) {
      case 'quarterly':
        return '3 months';
      case 'yearly':
        return '12 months';
      default:
        return 'month';
    }
  };

  const handleSubscribe = () => {
    if (selectedPlan === 'basic') {
      Alert.alert('Free Tier', 'Basic tier is free. Choose Verified or Premium to unlock benefits!');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    console.log('[FarmerSubscriptionScreen] handleConfirmPayment called');
    console.log('[FarmerSubscriptionScreen] selectedPlan:', selectedPlan, 'selectedDuration:', selectedDuration);
    
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
    if (!plan) {
      console.log('[FarmerSubscriptionScreen] Plan not found');
      return;
    }

    const price = getPrice(plan);
    console.log('[FarmerSubscriptionScreen] Price:', price, 'WalletBalance:', walletBalance?.available);
    
    // Check wallet balance
    if (walletBalance && walletBalance.available < price) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₦${price?.toLocaleString() || '0'} but have ₦${walletBalance?.available?.toLocaleString() || '0'}. Please top up your wallet.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up', onPress: () => { setShowPaymentModal(false); navigation.navigate('TopUp' as never); } },
        ]
      );
      return;
    }

    console.log('[FarmerSubscriptionScreen] Calling subscribeMutation.mutate');
    subscribeMutation.mutate({ tier: selectedPlan, duration: selectedDuration });
  };

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
  const currentPrice = currentPlan ? getPrice(currentPlan) : 0;
  const isCurrentlySubscribed = currentSubscription?.hasActiveSubscription;
  const currentTier = currentSubscription?.premiumTier;

  // Full screen view
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={['#1DA1F2', '#0D8ECF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerNavTitle}>Verified Seller</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroSection}>
          <View style={styles.heroCard}>
          <LinearGradient
            colors={['#1DA1F2', '#0D8ECF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCardGradient}
          >
            <Animated.View style={{ transform: [{ rotate: badgeRotateInterpolate }] }}>
              <View style={styles.verifiedBadgeLarge}>
                <VerifiedSellerIllustration size={80} />
              </View>
            </Animated.View>
            
            <Animated.Text 
              style={[
                styles.heroCardTitle,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              Become a Verified Seller
            </Animated.Text>
            <Animated.Text 
              style={[
                styles.heroCardSubtitle,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              Build trust and boost your sales with the verified badge
            </Animated.Text>

            {isCurrentlySubscribed && (
              <View style={styles.currentPlanBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                <Text style={styles.currentPlanText}>
                  Currently: {currentTier === 'verified' ? 'Verified' : 'Premium'} Seller
                </Text>
              </View>
            )}
          </LinearGradient>
          </View>
        </View>

        {/* Benefits Section */}
        <Animated.View style={[styles.benefitsSection, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Why Get Verified?</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={[styles.benefitCard, { backgroundColor: colors.card }]}>
                <View style={[styles.benefitIcon, { backgroundColor: `${benefit.color}20` }]}>
                  <Ionicons name={benefit.icon} size={24} color={benefit.color} />
                </View>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>{benefit.title}</Text>
                <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Duration Selector */}
        <View style={styles.durationSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Duration</Text>
          <View style={[styles.durationSelector, { backgroundColor: colors.card }]}>
            {(['monthly', 'quarterly', 'yearly'] as DurationType[]).map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationOption,
                  selectedDuration === duration && styles.durationOptionActive,
                ]}
                onPress={() => setSelectedDuration(duration)}
              >
                <Text style={[
                  styles.durationText,
                  { color: selectedDuration === duration ? '#FFF' : colors.text }
                ]}>
                  {duration === 'monthly' ? 'Monthly' : duration === 'quarterly' ? '3 Months' : 'Yearly'}
                </Text>
                {duration === 'yearly' && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>Best Value</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Plans Section */}
        <View style={styles.plansSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Plan</Text>
          
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const price = getPrice(plan);
            const savings = getSavings(plan);
            const isCurrentPlan = currentTier === plan.id;
            
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: colors.card, borderColor: isSelected ? plan.gradient[0] : colors.border },
                  isSelected && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                
                {isCurrentPlan && (
                  <View style={[styles.popularBadge, { backgroundColor: '#34C759' }]}>
                    <Text style={styles.popularText}>CURRENT PLAN</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <LinearGradient
                    colors={plan.gradient}
                    style={styles.planIcon}
                  >
                    <Ionicons name={plan.icon} size={24} color="#FFF" />
                  </LinearGradient>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                    <View style={styles.boostBadge}>
                      <Ionicons name="trending-up" size={12} color="#34C759" />
                      <Text style={styles.boostText}>{plan.boost}x visibility</Text>
                    </View>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>
                      ₦{price?.toLocaleString() || '0'}
                    </Text>
                    <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>
                      /{getDurationLabel()}
                    </Text>
                    {savings && (
                      <Text style={styles.savingsText}>{savings}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.planFeatures}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons 
                        name={feature.icon} 
                        size={18} 
                        color={feature.included ? '#34C759' : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.featureText,
                        { color: feature.included ? colors.text : colors.textSecondary }
                      ]}>
                        {feature.text}
                      </Text>
                    </View>
                  ))}
                </View>

                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: plan.gradient[0] }]}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* How it Works */}
        <View style={[styles.howItWorksSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#1DA1F2' }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>Choose your subscription plan</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#1DA1F2' }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>Complete payment</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#1DA1F2' }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>Get verified badge instantly</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Subscribe Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
        <View style={styles.footerContent}>
          <View>
            <Text style={[styles.footerPrice, { color: colors.text }]}>
              ₦{currentPrice?.toLocaleString() || '0'}
            </Text>
            <Text style={[styles.footerPeriod, { color: colors.textSecondary }]}>
              /{getDurationLabel()}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              selectedPlan === 'basic' && styles.subscribeButtonDisabled,
            ]}
            onPress={handleSubscribe}
            disabled={selectedPlan === 'basic'}
          >
            <LinearGradient
              colors={selectedPlan === 'basic' ? ['#6B7280', '#9CA3AF'] : ['#1DA1F2', '#0D8ECF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.subscribeText}>
                {selectedPlan === 'basic' ? 'Select a Plan' : 'Subscribe Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Complete Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Order Summary */}
              <View style={[styles.orderSummary, { backgroundColor: colors.background }]}>
                <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>
                    {currentPlan?.name} Subscription
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    ₦{currentPrice?.toLocaleString() || '0'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duration</Text>
                  <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>
                    {selectedDuration === 'monthly' ? '1 Month' : selectedDuration === 'quarterly' ? '3 Months' : '12 Months'}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                  <Text style={[styles.totalValue, { color: '#1DA1F2' }]}>
                    ₦{currentPrice?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>

              {/* Payment Methods */}
              <Text style={[styles.paymentTitle, { color: colors.text }]}>Payment Method</Text>
              
              {/* Wallet Payment */}
              <View
                style={[
                  styles.paymentOption,
                  { backgroundColor: colors.background, borderColor: '#1DA1F2' },
                ]}
              >
                <View style={styles.paymentOptionLeft}>
                  <Ionicons name="wallet" size={24} color="#1DA1F2" />
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentName, { color: colors.text }]}>Wallet</Text>
                    <Text style={[styles.paymentBalance, { color: colors.textSecondary }]}>
                      Balance: ₦{walletBalance?.available?.toLocaleString() || '0'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.radioOuter, { borderColor: '#1DA1F2' }]}>
                  <View style={styles.radioInner} />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmPayment}
              disabled={subscribeMutation.isPending}
            >
              <LinearGradient
                colors={['#1DA1F2', '#0D8ECF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                {subscribeMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerNavTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    marginBottom: SPACING.lg,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  heroCardGradient: {
    padding: 28,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  verifiedBadgeLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroCardSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: SPACING.md,
    gap: 6,
  },
  currentPlanText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: SPACING.lg,
  },
  heroSection: {
    marginBottom: 20,
  },
  benefitsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  benefitCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  durationSection: {
    marginBottom: SPACING.xl,
  },
  durationSelector: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  durationOptionActive: {
    backgroundColor: '#1DA1F2',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  saveBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  saveBadgeText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  plansSection: {
    marginBottom: SPACING.xl,
  },
  planCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  boostText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },
  planPeriod: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  savingsText: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginTop: 2,
  },
  planFeatures: {
    marginTop: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  howItWorksSection: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  stepText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  stepLine: {
    height: 2,
    backgroundColor: '#1DA1F2',
    flex: 0.5,
    marginBottom: 32,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },
  footerPeriod: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  subscribeButton: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
  },
  subscribeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
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
  modalBody: {
    marginBottom: SPACING.lg,
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
  paymentTitle: {
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
  paymentInfo: {},
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  paymentBalance: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1DA1F2',
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
