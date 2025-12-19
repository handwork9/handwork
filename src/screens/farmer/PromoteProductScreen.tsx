import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FarmerStackParamList } from '../../types';
import { getProductIllustration } from '../../assets/illustrations/products';
import promotionService, {
  PromotionPlanId,
  PromotionBoostType,
  TargetAudienceType,
  PromotionPlan,
} from '../../services/promotionService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const { width } = Dimensions.get('window');

type RouteType = RouteProp<FarmerStackParamList, 'PromoteProduct'>;

// Boost options with backend-compatible IDs
const BOOST_OPTIONS = [
  { id: PromotionBoostType.SEARCH, name: 'Search Boost', icon: 'search', description: 'Appear higher in search results', price: 300 },
  { id: PromotionBoostType.HOMEPAGE, name: 'Homepage Feature', icon: 'home', description: 'Featured on buyer homepage', price: 1000 },
  { id: PromotionBoostType.CATEGORY, name: 'Category Spotlight', icon: 'grid', description: 'Top of category listing', price: 500 },
  { id: PromotionBoostType.BADGE, name: 'Promoted Badge', icon: 'ribbon', description: 'Stand out with a badge', price: 200 },
];

// Target audience options with backend-compatible IDs
const AUDIENCE_OPTIONS = [
  { id: TargetAudienceType.ALL, label: 'All Buyers', icon: 'globe', multiplier: 1.0 },
  { id: TargetAudienceType.LOCAL, label: 'Local Area', icon: 'location', multiplier: 1.2 },
  { id: TargetAudienceType.PREMIUM, label: 'Premium', icon: 'diamond', multiplier: 1.5 },
  { id: TargetAudienceType.REPEAT, label: 'Repeat Buyers', icon: 'people', multiplier: 1.3 },
];

const PromoteProductScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { product } = route.params;

  // Get wallet balance from Redux
  const walletBalance = useSelector((state: RootState) => 
    parseFloat(state.auth.user?.walletBalance || '0')
  );

  // State
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PromotionPlanId | null>(null);
  const [selectedBoosts, setSelectedBoosts] = useState<PromotionBoostType[]>([]);
  const [targetAudience, setTargetAudience] = useState<TargetAudienceType>(TargetAudienceType.ALL);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Ref for plans horizontal scroll
  const plansScrollRef = useRef<ScrollView>(null);

  // Fetch promotion plans on mount
  useEffect(() => {
    fetchPlans();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const fetchedPlans = await promotionService.getPromotionPlans();
      console.log('Fetched plans:', JSON.stringify(fetchedPlans, null, 2));
      const plansArray = Array.isArray(fetchedPlans) ? fetchedPlans : [];
      console.log('Plans array length:', plansArray.length);
      setPlans(plansArray);
      // Auto-select standard plan if available
      const standardPlan = plansArray.find(p => p.id === PromotionPlanId.STANDARD);
      if (standardPlan) {
        setSelectedPlan(standardPlan.id);
      }
    } catch (error) {
      console.error('Failed to fetch promotion plans:', error);
      Alert.alert('Error', 'Failed to load promotion plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBoost = (boostId: PromotionBoostType) => {
    setSelectedBoosts(prev =>
      prev.includes(boostId)
        ? prev.filter(id => id !== boostId)
        : [...prev, boostId]
    );
  };

  const calculateTotal = (): number => {
    let total = 0;

    // Get base plan price
    const plan = (plans || []).find(p => p.id === selectedPlan);
    if (plan) {
      total += plan.basePrice;
    }

    // Add boost prices
    selectedBoosts.forEach(boostId => {
      const boost = BOOST_OPTIONS.find(b => b.id === boostId);
      if (boost) {
        total += boost.price;
      }
    });

    // Apply audience multiplier
    const audience = AUDIENCE_OPTIONS.find(a => a.id === targetAudience);
    if (audience) {
      total = Math.round(total * audience.multiplier);
    }

    return total;
  };

  const handleStartPromotion = async () => {
    if (!selectedPlan) {
      Alert.alert('Select a Plan', 'Please select a promotion plan to continue');
      return;
    }

    const total = calculateTotal();
    const plan = (plans || []).find(p => p.id === selectedPlan);

    if (!plan) {
      Alert.alert('Error', 'Invalid plan selected');
      return;
    }

    // Check wallet balance
    if (walletBalance < total) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₦\${total.toLocaleString()} but your wallet balance is ₦\${walletBalance.toLocaleString()}. Please fund your wallet first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Fund Wallet', 
            onPress: () => navigation.navigate('Wallet' as never) 
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Start Promotion?',
      `You're about to promote "\${product.name}" for ₦\${total.toLocaleString()} (\${plan.duration}). This amount will be deducted from your wallet.\n\nYour wallet balance: ₦\${walletBalance.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Pay',
          onPress: processPromotion,
        },
      ]
    );
  };

  const processPromotion = async () => {
    if (!selectedPlan) return;

    const plan = (plans || []).find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsSubmitting(true);

    try {
      const promotion = await promotionService.createPromotion({
        productId: product.id,
        planId: selectedPlan,
        durationDays: plan.durationDays,
        boosts: selectedBoosts.length > 0 ? selectedBoosts : undefined,
        targetAudience: targetAudience,
        totalCost: calculateTotal(),
      });

      Alert.alert(
        'Promotion Started! 🎉',
        `Your promotion for "\${product.name}" is now active for \${plan.duration}. You'll start seeing increased engagement soon.\n\nPromotion ends: \${new Date(promotion.endDate).toLocaleDateString()}`,
        [
          {
            text: 'View Promotions',
            onPress: () => {
              navigation.goBack();
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create promotion:', error);
      const message = error.response?.data?.message || error.message || 'Failed to start promotion. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = calculateTotal();
  const selectedPlanDetails = (plans || []).find(p => p.id === selectedPlan);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading promotion plans...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Promote Product</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Product Preview */}
          <View style={styles.productPreview}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.secondaryDark]}
              style={styles.productGradient}
            >
              <View style={styles.productImageContainer}>
                {getProductIllustration(product.name, 64)}
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.productStats}>
                <View style={styles.productStat}>
                  <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.productStatText}>{product.views || 0} views</Text>
                </View>
                <View style={styles.productStat}>
                  <Ionicons name="bag-outline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.productStatText}>{product.sales || 0} sold</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Wallet Balance Info */}
          <View style={[styles.walletInfo, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.walletRow}>
              <View style={styles.walletIconContainer}>
                <Ionicons name="pricetag" size={20} color={COLORS.success} />
              </View>
              <View style={styles.walletTextContainer}>
                <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>Wallet Balance</Text>
                <Text style={[styles.walletBalance, { color: walletBalance >= total ? COLORS.success : COLORS.error }]}>
                  ₦{walletBalance.toLocaleString()}
                </Text>
              </View>
              {walletBalance < total && (
                <TouchableOpacity 
                  style={styles.fundButton}
                  onPress={() => navigation.navigate('Wallet' as never)}
                >
                  <Text style={styles.fundButtonText}>Fund Wallet</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Promotion Plans */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose a Plan</Text>
          </View>
          {plans.length === 0 ? (
            <View style={[styles.emptyPlans, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyPlansText, { color: colors.textSecondary }]}>
                No promotion plans available. Please try again later.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchPlans}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
          <ScrollView
            ref={plansScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plansScrollContainer}
            snapToInterval={180 + SPACING.sm}
            decelerationRate="fast"
            onLayout={() => {
              const standardIndex = (plans || []).findIndex(p => p.id === PromotionPlanId.STANDARD);
              if (standardIndex !== -1 && plansScrollRef.current) {
                const cardWidth = 180;
                const scrollX = standardIndex * (cardWidth + SPACING.sm);
                plansScrollRef.current.scrollTo({ x: Math.max(0, scrollX - SPACING.md), animated: false });
              }
            }}
          >
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isPopular = plan.id === PromotionPlanId.STANDARD;
              const isPremium = plan.id === PromotionPlanId.PREMIUM;
              const planIcon = isPremium ? 'diamond' : isPopular ? 'star' : 'rocket';
              const planGradient = isPremium 
                ? [COLORS.secondary, COLORS.secondaryDark] 
                : isPopular 
                  ? [COLORS.primary, COLORS.primaryDark] 
                  : ['#6B7280', '#4B5563'];
              
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border },
                    isSelected && styles.planCardActive,
                    isPopular && styles.planCardPopular,
                    isPremium && styles.planCardPremium,
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                  activeOpacity={0.8}
                >
                  {/* Badge */}
                  {(isPopular || isPremium) && (
                    <View style={[styles.popularBadge, isPremium && styles.premiumBadge]}>
                      <Ionicons name={isPremium ? 'diamond' : 'star'} size={10} color={COLORS.white} />
                      <Text style={styles.popularText}>{isPremium ? 'Best Value' : 'Most Popular'}</Text>
                    </View>
                  )}
                  
                  {/* Plan Icon */}
                  <LinearGradient
                    colors={isSelected ? ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'] : planGradient as [string, string]}
                    style={styles.planIconContainer}
                  >
                    <Ionicons
                      name={planIcon as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={COLORS.white}
                    />
                  </LinearGradient>
                  
                  {/* Plan Name */}
                  <Text style={[styles.planName, { color: colors.text }, isSelected && styles.planNameActive]}>
                    {plan.name}
                  </Text>
                  
                  {/* Price */}
                  <View style={styles.priceContainer}>
                    <Text style={[styles.planCurrency, isSelected && styles.planCurrencyActive]}>₦</Text>
                    <Text style={[styles.planPrice, { color: colors.text }, isSelected && styles.planPriceActive]}>
                      {plan.basePrice?.toLocaleString() || '0'}
                    </Text>
                  </View>
                  
                  {/* Duration */}
                  <View style={[styles.durationBadge, isSelected && styles.durationBadgeActive]}>
                    <Ionicons name="time-outline" size={10} color={isSelected ? COLORS.white : COLORS.primary} />
                    <Text style={[styles.planDuration, isSelected && styles.planDurationActive]}>{plan.duration}</Text>
                  </View>
                  
                  {/* Divider */}
                  <View style={[styles.planDivider, { backgroundColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }, isSelected && styles.planDividerActive]} />
                  
                  {/* Features */}
                  <View style={styles.planFeatures}>
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <View key={index} style={styles.featureRow}>
                        <View style={[styles.featureCheckbox, isSelected && styles.featureCheckboxActive]}>
                          <Ionicons
                            name="checkmark"
                            size={10}
                            color={isSelected ? COLORS.primary : COLORS.white}
                          />
                        </View>
                        <Text style={[styles.featureText, { color: colors.textSecondary }, isSelected && styles.featureTextActive]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Select Indicator */}
                  <View style={[styles.selectIndicator, isSelected && styles.selectIndicatorActive]}>
                    <Text style={[styles.selectText, isSelected && styles.selectTextActive]}>
                      {isSelected ? 'Selected' : 'Select'}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          )}

          {/* Boost Add-ons */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Boost Add-ons</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Enhance your promotion</Text>
            {BOOST_OPTIONS.map((boost) => (
              <TouchableOpacity
                key={boost.id}
                style={[styles.boostCard, { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }, selectedBoosts.includes(boost.id) && styles.boostCardActive]}
                onPress={() => toggleBoost(boost.id)}
              >
                <View style={[styles.boostIcon, { backgroundColor: isDark ? `\${COLORS.primary}30` : COLORS.primaryLight }, selectedBoosts.includes(boost.id) && styles.boostIconActive]}>
                  <Ionicons
                    name={boost.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={selectedBoosts.includes(boost.id) ? COLORS.white : COLORS.primary}
                  />
                </View>
                <View style={styles.boostInfo}>
                  <Text style={[styles.boostName, { color: colors.text }]}>{boost.name}</Text>
                  <Text style={[styles.boostDescription, { color: colors.textSecondary }]}>{boost.description}</Text>
                </View>
                <View style={styles.boostPriceContainer}>
                  <Text style={[styles.boostPrice, { color: colors.text }]}>+₦{boost.price}</Text>
                  <View style={[styles.checkbox, { borderColor: isDark ? 'rgba(255,255,255,0.3)' : COLORS.border }, selectedBoosts.includes(boost.id) && styles.checkboxActive]}>
                    {selectedBoosts.includes(boost.id) && (
                      <Ionicons name="checkmark" size={14} color={COLORS.white} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Target Audience */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Target Audience</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Premium targets have higher multipliers</Text>
            <View style={styles.audienceGrid}>
              {AUDIENCE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.audienceOption, { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }, targetAudience === option.id && styles.audienceOptionActive]}
                  onPress={() => setTargetAudience(option.id)}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={targetAudience === option.id ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[styles.audienceText, { color: colors.text }, targetAudience === option.id && styles.audienceTextActive]}>
                    {option.label}
                  </Text>
                  {option.multiplier > 1 && (
                    <Text style={[styles.audienceMultiplier, targetAudience === option.id && styles.audienceMultiplierActive]}>
                      {option.multiplier}x
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cost Breakdown */}
          {selectedPlan && (
            <View style={[styles.breakdownCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
              <Text style={[styles.breakdownTitle, { color: colors.text }]}>Cost Breakdown</Text>
              
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                  {selectedPlanDetails?.name} Plan
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  ₦{selectedPlanDetails?.basePrice.toLocaleString()}
                </Text>
              </View>

              {selectedBoosts.map(boostId => {
                const boost = BOOST_OPTIONS.find(b => b.id === boostId);
                return boost ? (
                  <View key={boostId} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                      + {boost.name}
                    </Text>
                    <Text style={[styles.breakdownValue, { color: colors.text }]}>
                      ₦{boost.price.toLocaleString()}
                    </Text>
                  </View>
                ) : null;
              })}

              {targetAudience !== TargetAudienceType.ALL && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    Target Audience ({AUDIENCE_OPTIONS.find(a => a.id === targetAudience)?.label})
                  </Text>
                  <Text style={[styles.breakdownValue, { color: COLORS.warning }]}>
                    ×{AUDIENCE_OPTIONS.find(a => a.id === targetAudience)?.multiplier}
                  </Text>
                </View>
              )}

              <View style={[styles.breakdownDivider, { backgroundColor: isDark ? colors.border : COLORS.border }]} />
              
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownTotalLabel, { color: colors.text }]}>Total</Text>
                <Text style={[styles.breakdownTotalValue, { color: COLORS.primary }]}>
                  ₦{total.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Estimated Results */}
          {total > 0 && (
            <View style={[styles.estimateCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
              <Text style={[styles.estimateTitle, { color: colors.text }]}>Estimated Results</Text>
              <View style={styles.estimateGrid}>
                <View style={[styles.estimateItem, { backgroundColor: isDark ? `\${COLORS.primary}30` : COLORS.primaryLight }]}>
                  <Ionicons name="eye" size={24} color={COLORS.primary} />
                  <Text style={[styles.estimateValue, { color: colors.text }]}>
                    {Math.round((total / 10) * 2).toLocaleString()}+
                  </Text>
                  <Text style={[styles.estimateLabel, { color: colors.textSecondary }]}>Views</Text>
                </View>
                <View style={[styles.estimateItem, { backgroundColor: isDark ? `\${COLORS.secondary}30` : COLORS.secondaryLight }]}>
                  <Ionicons name="hand-left" size={24} color={COLORS.secondary} />
                  <Text style={[styles.estimateValue, { color: colors.text }]}>
                    {Math.round((total / 10) * 0.1).toLocaleString()}+
                  </Text>
                  <Text style={[styles.estimateLabel, { color: colors.textSecondary }]}>Clicks</Text>
                </View>
                <View style={[styles.estimateItem, { backgroundColor: isDark ? `\${COLORS.success}30` : COLORS.successLight }]}>
                  <Ionicons name="bag-check" size={24} color={COLORS.success} />
                  <Text style={[styles.estimateValue, { color: colors.text }]}>
                    {Math.round((total / 10) * 0.01)}-{Math.round((total / 10) * 0.02)}
                  </Text>
                  <Text style={[styles.estimateLabel, { color: colors.textSecondary }]}>Orders</Text>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: SPACING.xxl * 2 }} />
        </Animated.View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md, backgroundColor: isDark ? colors.card : COLORS.surface, borderTopColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }]}>
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>₦{total?.toLocaleString() || '0'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.startButton, (total <= 0 || isSubmitting) && styles.startButtonDisabled]}
          onPress={handleStartPromotion}
          disabled={total <= 0 || isSubmitting}
        >
          <LinearGradient
            colors={total > 0 && !isSubmitting ? [COLORS.secondary, COLORS.secondaryDark] : [COLORS.gray, COLORS.gray]}
            style={styles.startGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="megaphone" size={20} color={COLORS.white} />
                <Text style={styles.startText}>Start Promotion</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  productPreview: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  productGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  productName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  productStats: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  productStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productStatText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  walletInfo: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  walletTextContainer: {
    flex: 1,
  },
  walletLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  walletBalance: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  fundButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  fundButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  emptyPlans: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  emptyPlansText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  plansScrollContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  planCard: {
    width: 180,
    minHeight: 260,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    paddingTop: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'visible',
    ...SHADOWS.small,
  },
  planCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.large,
  },
  planCardPopular: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  planCardPremium: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...SHADOWS.small,
  },
  premiumBadge: {
    backgroundColor: COLORS.secondary,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  planName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  planNameActive: {
    color: COLORS.white,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  planCurrency: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginTop: 2,
    marginRight: 1,
  },
  planCurrencyActive: {
    color: COLORS.white,
  },
  planPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  planPriceActive: {
    color: COLORS.white,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
    gap: 2,
    marginBottom: SPACING.sm,
  },
  durationBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  planDuration: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  planDurationActive: {
    color: COLORS.white,
  },
  planDivider: {
    width: '80%',
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  planDividerActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  planFeatures: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  featureCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCheckboxActive: {
    backgroundColor: COLORS.white,
  },
  featureText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    flex: 1,
  },
  featureTextActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  selectIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
    width: '100%',
  },
  selectIndicatorActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  selectText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  selectTextActive: {
    color: COLORS.white,
  },
  boostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  boostCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  boostIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  boostIconActive: {
    backgroundColor: COLORS.primary,
  },
  boostInfo: {
    flex: 1,
  },
  boostName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  boostDescription: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  boostPriceContainer: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  boostPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  audienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  audienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  audienceOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  audienceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  audienceTextActive: {
    color: COLORS.white,
  },
  audienceMultiplier: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.warning,
  },
  audienceMultiplierActive: {
    color: COLORS.white,
  },
  breakdownCard: {
    margin: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  breakdownTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  breakdownLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  breakdownValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  breakdownDivider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  breakdownTotalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  breakdownTotalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  estimateCard: {
    margin: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  estimateTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  estimateGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  estimateItem: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  estimateValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  estimateLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  totalContainer: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  startButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  startText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
});

export default PromoteProductScreen;
