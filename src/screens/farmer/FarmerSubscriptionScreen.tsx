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
import Svg, { Circle } from 'react-native-svg';
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
    icon: 'person-outline',
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
      <View style={{ flex: 1, backgroundColor: isDark ? colors.background : '#F2F2F7' }}>
        {/* Header */}
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: isDark ? colors.background : '#F2F2F7' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>Verified Seller</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ marginBottom: 20 }}>
              <VerifiedSellerIllustration size={120} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>Become a Verified Seller</Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Build trust and boost your sales with the verified badge
            </Text>
          </View>

          {/* Benefits Cards */}
          <View style={{ backgroundColor: isDark ? colors.card : '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Why Get Verified?</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="shield-checkmark" size={20} color="#1DA1F2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 }}>Trust Badge</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                  Display a blue verification badge on all your products, building instant trust with buyers
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="trending-up" size={20} color="#4CAF50" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 }}>1.5x More Visibility</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                  Your products appear higher in search results and category listings, reaching more customers
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="star" size={20} color="#FF9800" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 }}>Featured Placement</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                  Get featured in the Verified Sellers section on the homepage and discovery pages
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="headset" size={20} color="#9C27B0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 }}>Priority Support</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                  Get faster responses from our support team and dedicated assistance for your business
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Card */}
          <View style={{ backgroundColor: isDark ? colors.card : '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 }}>Verified Seller Stats</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#1DA1F2' }}>45%</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>More Sales</Text>
              </View>
              <View style={{ width: 1, backgroundColor: isDark ? '#333' : '#E0E0E0' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#4CAF50' }}>2.3x</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>More Views</Text>
              </View>
              <View style={{ width: 1, backgroundColor: isDark ? '#333' : '#E0E0E0' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: '#FF9800' }}>4.8★</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>Avg Rating</Text>
              </View>
            </View>
          </View>

          {/* How It Works */}
          <View style={{ backgroundColor: isDark ? colors.card : '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 }}>How It Works</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#1DA1F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Choose Your Plan</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Select monthly, quarterly, or yearly billing</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#1DA1F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Pay From Wallet</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Subscription fee is deducted from your wallet balance</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#1DA1F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Start Selling More</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Your badge activates instantly and boosts visibility</Text>
              </View>
            </View>
          </View>

          {/* Pricing Info */}
          <View style={{ backgroundColor: isDark ? colors.card : '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Pricing</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 }}>
              Verified Seller subscription starts from just ₦3,000/month. Save up to 30% with yearly plans.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ fontSize: 12, color: '#1565C0', fontWeight: '500' }}>₦3,000/month</Text>
              </View>
              <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ fontSize: 12, color: '#2E7D32', fontWeight: '500' }}>₦7,500/quarter</Text>
              </View>
              <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '500' }}>₦25,000/year</Text>
              </View>
            </View>
          </View>
          
          {/* CTA Button */}
          <TouchableOpacity 
            style={{ backgroundColor: '#1DA1F2', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 30 }}
            onPress={() => setShowFullScreen(true)}
          >
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>View Subscription Plans</Text>
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
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerNavTitle, { color: colors.text }]}>Verified Seller</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            {/* SVG Background */}
            <View style={styles.heroCardSvg}>
              <Svg width="200" height="200" viewBox="0 0 200 200">
                <Circle cx="150" cy="50" r="80" fill="#1DA1F2" fillOpacity={0.08} />
                <Circle cx="180" cy="100" r="50" fill="#1DA1F2" fillOpacity={0.06} />
                <Circle cx="120" cy="30" r="30" fill="#0D8ECF" fillOpacity={0.05} />
              </Svg>
            </View>
            
            <View style={styles.heroCardContent}>
              <Animated.View style={{ transform: [{ rotate: badgeRotateInterpolate }] }}>
                <View style={[styles.verifiedBadgeLarge, { backgroundColor: isDark ? 'rgba(29, 161, 242, 0.15)' : '#E1F5FE' }]}>
                  <VerifiedSellerIllustration size={80} />
                </View>
              </Animated.View>
              
              <Animated.Text 
                style={[
                  styles.heroCardTitle,
                  { color: colors.text, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}
              >
                Become a Verified Seller
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.heroCardSubtitle,
                  { color: colors.textSecondary, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}
              >
                Build trust and boost your sales with the verified badge
              </Animated.Text>

              {isCurrentlySubscribed && (
                <View style={[styles.currentPlanBadge, { backgroundColor: isDark ? 'rgba(29, 161, 242, 0.15)' : '#E1F5FE' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                  <Text style={[styles.currentPlanText, { color: '#1DA1F2' }]}>
                    Currently: {currentTier === 'verified' ? 'Verified' : 'Premium'} Seller
                  </Text>
                </View>
              )}
            </View>
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
          <View style={[styles.durationSelector, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {([
              { key: 'monthly' as DurationType, label: 'Monthly', sublabel: 'Billed monthly', discount: null },
              { key: 'quarterly' as DurationType, label: 'Quarterly', sublabel: '3 months', discount: '17% OFF' },
              { key: 'yearly' as DurationType, label: 'Yearly', sublabel: '12 months', discount: '30% OFF' },
            ]).map((item) => {
              const isActive = selectedDuration === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.durationOption,
                    { backgroundColor: isActive ? '#1DA1F2' : (isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5') },
                  ]}
                  onPress={() => setSelectedDuration(item.key)}
                  activeOpacity={0.8}
                >
                  {item.discount && (
                    <View style={[styles.discountBadge, { backgroundColor: isActive ? '#FFF' : '#FF6B6B' }]}>
                      <Text style={[styles.discountBadgeText, { color: isActive ? '#1DA1F2' : '#FFF' }]}>{item.discount}</Text>
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
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    marginBottom: SPACING.lg,
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
  heroCardSvg: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  heroCardContent: {
    padding: 28,
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroCardSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: SPACING.md,
    gap: 6,
  },
  currentPlanText: {
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
    borderRadius: 16,
    padding: 8,
    gap: 8,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  durationOptionActive: {
    backgroundColor: '#1DA1F2',
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
