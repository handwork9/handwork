import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store';
import { walletService, WalletBalance } from '../../services/walletService';
import { farmerSubscriptionService } from '../../services/farmerSubscriptionService';
import { FarmerActivationIllustration } from '../../assets/illustrations/hero';

const { width } = Dimensions.get('window');

const ACTIVATION_FEE = 25000;
const ACTIVATION_FEE_DISPLAY = '₦25,000';

const BENEFITS = [
  {
    icon: 'storefront' as const,
    title: 'Your Store',
    description: 'Create your digital farm store',
    color: '#34C759',
    bgColor: '#E8F5E9',
  },
  {
    icon: 'people' as const,
    title: 'Customers',
    description: 'Reach thousands of buyers',
    color: '#FF9500',
    bgColor: '#FFF3E0',
  },
  {
    icon: 'card' as const,
    title: 'Payments',
    description: 'Get paid to your bank',
    color: '#007AFF',
    bgColor: '#E3F2FD',
  },
  {
    icon: 'bar-chart' as const,
    title: 'Analytics',
    description: 'Track your sales growth',
    color: '#AF52DE',
    bgColor: '#F3E5F5',
  },
];

const FEATURES = [
  { icon: 'checkmark-circle' as const, text: 'One-time payment - No monthly fees' },
  { icon: 'checkmark-circle' as const, text: 'Lifetime access to farmer dashboard' },
  { icon: 'checkmark-circle' as const, text: 'Unlimited product listings' },
  { icon: 'checkmark-circle' as const, text: 'Direct customer messaging' },
  { icon: 'checkmark-circle' as const, text: 'Order management system' },
  { icon: 'checkmark-circle' as const, text: 'Sales analytics & reports' },
  { icon: 'checkmark-circle' as const, text: 'Promotional tools access' },
  { icon: 'checkmark-circle' as const, text: 'Priority support for farmers' },
];

export default function FarmerActivationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);
  const { colors, isDark } = useTheme();
  
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

  const canAffordWithWallet = walletBalance ? walletBalance.available >= ACTIVATION_FEE : false;

  const handleActivate = () => {
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'wallet') {
      if (!canAffordWithWallet) {
        Alert.alert(
          'Insufficient Balance',
          `Your wallet balance is ₦${walletBalance?.available?.toLocaleString() || 0}. You need ${ACTIVATION_FEE_DISPLAY} to activate.`,
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
        
        // Call actual API to activate account - this debits wallet first on backend
        const result = await farmerSubscriptionService.activateAccount('wallet');

        if (result.success) {
          setShowPaymentModal(false);
          Alert.alert(
            'Activation Successful! 🎉',
            result.message || 'Your farmer account is now active. You can start listing products immediately.',
            [{ text: 'Start Selling', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Activation Failed', result.message || 'Something went wrong. Please try again.');
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
        Alert.alert('Error', errorMessage);
      } finally {
        setIsProcessingPayment(false);
      }
    } else {
      // Handle card payment - show message that card payment requires external confirmation
      Alert.alert(
        'Card Payment',
        'Card payment is currently being processed. You will receive a confirmation once the payment is verified.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        {/* SVG Background Decoration */}
        <View style={styles.headerSvgBackground}>
          <Svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
            <Defs>
              <SvgLinearGradient id="activationHeaderGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#34C759" stopOpacity={isDark ? 0.2 : 0.12} />
                <Stop offset="100%" stopColor="#30D158" stopOpacity={isDark ? 0.12 : 0.06} />
              </SvgLinearGradient>
              <SvgLinearGradient id="activationHeaderGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#30D158" stopOpacity={isDark ? 0.15 : 0.08} />
                <Stop offset="100%" stopColor="#34C759" stopOpacity={isDark ? 0.08 : 0.03} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx="350" cy="15" r="70" fill="url(#activationHeaderGrad1)" />
            <Circle cx="380" cy="70" r="45" fill="url(#activationHeaderGrad2)" />
            <Circle cx="30" cy="90" r="55" fill="url(#activationHeaderGrad2)" />
            <Path d="M0,80 Q100,40 200,80 T400,60" fill="none" stroke="url(#activationHeaderGrad1)" strokeWidth="35" opacity={0.3} />
          </Svg>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#E8F5E9' }]}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1C1C1E'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Animated.Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1C1C1E', opacity: titleOpacity, position: 'absolute' }]}>
            Become a Seller
          </Animated.Text>
          <Animated.View style={[styles.headerCompact, { opacity: headerOpacity }]}>
            <View style={[styles.headerLeaf, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#E8F5E9' }]}>
              <Ionicons name="storefront" size={18} color="#34C759" />
            </View>
            <Text style={[styles.headerCompactTitle, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>Become a Seller</Text>
          </Animated.View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 16 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* SVG Background */}
            <View style={styles.heroSvgBackground}>
              <Svg width="300" height="300" viewBox="0 0 300 300">
                <Defs>
                  <SvgLinearGradient id="heroGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#4CAF50" stopOpacity={0.15} />
                    <Stop offset="100%" stopColor="#2E7D32" stopOpacity={0.08} />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="heroGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#81C784" stopOpacity={0.12} />
                    <Stop offset="100%" stopColor="#4CAF50" stopOpacity={0.05} />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx="220" cy="60" r="120" fill="url(#heroGrad1)" />
                <Circle cx="280" cy="150" r="80" fill="url(#heroGrad2)" />
                <Circle cx="180" cy="20" r="50" fill="url(#heroGrad2)" />
              </Svg>
            </View>
            
            {/* Badge */}
            <View style={[styles.heroBadge, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="sparkles" size={12} color="#4CAF50" />
              <Text style={[styles.heroBadgeText, { color: '#4CAF50' }]}>BECOME A SELLER</Text>
            </View>
            
            {/* Content */}
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={[styles.heroTitle, { color: colors.text }]}>Start Your Farm Business</Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                  One-time fee, unlimited selling potential
                </Text>
                
                {/* Price */}
                <View style={styles.heroPriceContainer}>
                  <Text style={[styles.heroPrice, { color: '#4CAF50' }]}>{ACTIVATION_FEE_DISPLAY}</Text>
                  <View style={[styles.heroPriceBadge, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.heroPriceBadgeText, { color: '#4CAF50' }]}>ONE-TIME</Text>
                  </View>
                </View>
                
                {/* Stats */}
                <View style={styles.heroStats}>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={[styles.heroStatText, { color: colors.textSecondary }]}>Lifetime access</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Ionicons name="infinite" size={14} color="#4CAF50" />
                    <Text style={[styles.heroStatText, { color: colors.textSecondary }]}>Unlimited products</Text>
                  </View>
                </View>
              </View>
              
              {/* Illustration */}
              <View style={styles.heroIllustration}>
                <FarmerActivationIllustration size={110} />
              </View>
            </View>
          </View>
        </View>

        {/* Quick Benefits */}
        <Animated.View 
          style={[
            styles.quickBenefitsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>What You'll Get</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit, index) => (
              <View 
                key={index} 
                style={[
                  styles.quickBenefitCard,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF' }
                ]}
              >
                <View style={[styles.quickBenefitIcon, { backgroundColor: benefit.bgColor }]}>
                  <Ionicons name={benefit.icon} size={24} color={benefit.color} />
                </View>
                <Text style={[styles.quickBenefitTitle, { color: colors.text }]}>{benefit.title}</Text>
                <Text style={[styles.quickBenefitDesc, { color: colors.textSecondary }]}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Features Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="list" size={18} color="#4CAF50" />
            </View>
            <Text style={[styles.sectionTitleNew, { color: colors.text }]}>What's Included</Text>
          </View>
          <View style={[styles.featuresCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {FEATURES.map((feature, idx) => (
              <View key={idx}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureIconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name={feature.icon} size={16} color="#4CAF50" />
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>
                    {feature.text}
                  </Text>
                </View>
                {idx < FEATURES.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="help-circle" size={18} color="#FF9800" />
            </View>
            <Text style={[styles.sectionTitleNew, { color: colors.text }]}>Common Questions</Text>
          </View>
          <View style={[styles.faqCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>Is this a one-time payment?</Text>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                Yes! Pay once and get lifetime access to all farmer features.
              </Text>
            </View>
            <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>When can I start selling?</Text>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                Immediately after payment! Start listing products right away.
              </Text>
            </View>
            <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: colors.text }]}>How do I get paid?</Text>
              <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                Payments go to your wallet. Withdraw to your bank anytime.
              </Text>
            </View>
          </View>
        </View>

        {/* Trust Badges */}
        <View style={[styles.trustSection, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.trustBadge}>
            <View style={[styles.trustIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="shield-checkmark" size={22} color="#4CAF50" />
            </View>
            <Text style={[styles.trustText, { color: colors.text }]}>Secure</Text>
            <Text style={[styles.trustSubtext, { color: colors.textSecondary }]}>Payment</Text>
          </View>
          <View style={styles.trustBadge}>
            <View style={[styles.trustIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="lock-closed" size={22} color="#1976D2" />
            </View>
            <Text style={[styles.trustText, { color: colors.text }]}>Protected</Text>
            <Text style={[styles.trustSubtext, { color: colors.textSecondary }]}>Data</Text>
          </View>
          <View style={styles.trustBadge}>
            <View style={[styles.trustIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="headset" size={22} color="#FF9800" />
            </View>
            <Text style={[styles.trustText, { color: colors.text }]}>24/7</Text>
            <Text style={[styles.trustSubtext, { color: colors.textSecondary }]}>Support</Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Bottom Activate Bar */}
      <View style={[
        styles.bottomBar, 
        { 
          paddingBottom: insets.bottom + SPACING.md,
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)',
        }
      ]}>
        <View style={styles.selectedPlanInfo}>
          <Text style={[styles.selectedPlanLabel, { color: colors.textSecondary }]}>
            Activation Fee
          </Text>
          <Text style={[styles.selectedPlanPrice, { color: colors.text }]}>
            {ACTIVATION_FEE_DISPLAY}
            <Text style={[styles.selectedPlanPeriod, { color: colors.textSecondary }]}> one-time</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleActivate}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2E7D32', '#43A047']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeGradient}
          >
            <Ionicons name="rocket" size={18} color="#FFFFFF" />
            <Text style={styles.subscribeText}>Activate Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Complete Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Order Summary */}
            <View style={[styles.orderSummary, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]}>
              <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>ORDER SUMMARY</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.text }]}>
                  Farmer Account Activation
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {ACTIVATION_FEE_DISPLAY}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Type</Text>
                <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>
                  One-time fee
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: '#43A047' }]}>
                  {ACTIVATION_FEE_DISPLAY}
                </Text>
              </View>
            </View>

            {/* Payment Methods */}
            <Text style={[styles.paymentMethodTitle, { color: colors.text }]}>Payment Method</Text>
            
            {/* Wallet Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                { backgroundColor: isDark ? colors.background : '#F5F5F5', borderColor: paymentMethod === 'wallet' ? '#43A047' : (isDark ? colors.border : '#E0E0E0') },
              ]}
              onPress={() => setPaymentMethod('wallet')}
            >
              <View style={styles.paymentOptionLeft}>
                <Ionicons name="wallet" size={24} color="#43A047" />
                <View style={styles.paymentOptionInfo}>
                  <Text style={[styles.paymentOptionLabel, { color: colors.text }]}>Wallet</Text>
                  {isLoadingWallet ? (
                    <ActivityIndicator size="small" color={COLORS.gray} />
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
                { borderColor: paymentMethod === 'wallet' ? '#43A047' : (isDark ? colors.border : '#C7C7CC') }
              ]}>
                {paymentMethod === 'wallet' && <View style={[styles.radioInner, { backgroundColor: '#43A047' }]} />}
              </View>
            </TouchableOpacity>

            {/* Card Option */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                { backgroundColor: isDark ? colors.background : '#F5F5F5', borderColor: paymentMethod === 'card' ? '#43A047' : (isDark ? colors.border : '#E0E0E0') },
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
                { borderColor: paymentMethod === 'card' ? '#43A047' : (isDark ? colors.border : '#C7C7CC') }
              ]}>
                {paymentMethod === 'card' && <View style={[styles.radioInner, { backgroundColor: '#43A047' }]} />}
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
                <Ionicons name="add-circle-outline" size={18} color="#43A047" />
                <Text style={[styles.topUpLinkText, { color: '#43A047' }]}>Top up your wallet</Text>
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
                  ? ['#B0B0B0', '#C0C0C0'] 
                  : ['#2E7D32', '#43A047']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color={COLORS.white} />
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
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
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
  headerContent: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  headerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeaf: {
    marginRight: 8,
  },
  headerCompactTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  headerSpacer: {
    width: 40,
  },
  heroSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  heroCard: {
    borderRadius: 20,
    padding: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  heroSvgBackground: {
    position: 'absolute',
    top: -50,
    right: -50,
    opacity: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    marginBottom: SPACING.md,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 4,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  heroPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  heroPrice: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  heroPriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroPriceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  heroStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStatText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  heroIllustration: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
    marginLeft: 4,
  },
  quickBenefitsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickBenefitCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  quickBenefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickBenefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  quickBenefitDesc: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    lineHeight: 15,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.md,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: SPACING.md,
  },
  featuresCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  faqCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  faqItem: {
    padding: SPACING.md,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 6,
  },
  trustIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  trustText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  trustSubtext: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedPlanInfo: {
    flex: 1,
  },
  selectedPlanLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  selectedPlanPrice: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  selectedPlanPeriod: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.regular,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
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
