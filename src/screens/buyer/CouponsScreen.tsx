import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  ImageBackground,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { LoadingSpinner, EmptyState } from '../../components/common';
import couponService from '../../services/couponService';
import { formatCurrency } from '../../utils/formatters';
import * as Clipboard from 'expo-clipboard';
import { triggerSuccessHaptic, triggerHaptic } from '../../utils/haptics';

interface Coupon {
  id: string;
  code: string;
  name?: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usageCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  source?: 'admin' | 'referral' | 'birthday' | 'loyalty' | 'welcome' | 'flash_sale' | 'promo' | 'milestone';
}

// Map source to display labels
const sourceLabels: Record<string, string> = {
  admin: 'General',
  referral: '🎁 Referral Bonus',
  birthday: '🎂 Birthday',
  loyalty: '⭐ Loyalty Reward',
  welcome: '👋 Welcome',
  flash_sale: '⚡ Flash Sale',
  promo: '🏷️ Promo',
  milestone: '🏆 Milestone',
};

// Map source to colors
const sourceColors: Record<string, string> = {
  admin: '#3B82F6',
  referral: '#8B5CF6',
  birthday: '#EC4899',
  loyalty: '#F59E0B',
  welcome: '#10B981',
  flash_sale: '#EF4444',
  promo: '#6366F1',
  milestone: '#14B8A6',
};

// Helper to map backend response to frontend interface
const mapBackendCoupon = (coupon: any): Coupon => ({
  id: coupon.id,
  code: coupon.code,
  name: coupon.name,
  description: coupon.description,
  discountType: coupon.type === 'percentage' ? 'percentage' : 'fixed',
  discountValue: parseFloat(coupon.value) || 0,
  minimumOrderAmount: parseFloat(coupon.minOrderAmount) || 0,
  maximumDiscount: parseFloat(coupon.maxDiscountAmount) || undefined,
  usageLimit: coupon.usageLimit,
  usageLimitPerUser: coupon.usageLimitPerUser,
  usageCount: coupon.usageCount || 0,
  startDate: coupon.startDate,
  endDate: coupon.endDate,
  isActive: coupon.status === 'active',
  source: coupon.source || 'admin',
});

export default function CouponsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { data: coupons, isLoading, refetch } = useQuery({
    queryKey: ['availableCoupons'],
    queryFn: async () => {
      const response = await couponService.getAvailableCoupons();
      // Handle different response formats and map to frontend interface
      let rawCoupons: any[] = [];
      if (Array.isArray(response)) {
        rawCoupons = response;
      } else if (response && typeof response === 'object') {
        rawCoupons = (response as any).coupons || (response as any).data || [];
      }
      return rawCoupons.map(mapBackendCoupon);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    triggerSuccessHaptic();
    Alert.alert('Copied!', `Coupon code "${code}" copied to clipboard`);
  };

  const isExpired = (endDate?: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const isNotStarted = (startDate?: string) => {
    if (!startDate) return false;
    return new Date(startDate) > new Date();
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderCoupon = ({ item }: { item: Coupon }) => {
    const expired = isExpired(item.endDate);
    const notStarted = isNotStarted(item.startDate);
    const badgeColor = sourceColors[item.source || 'admin'] || sourceColors.admin;
    const isBirthday = item.source === 'birthday';

    // Special birthday coupon card
    if (isBirthday && !expired && !notStarted) {
      return (
        <TouchableOpacity
          style={styles.birthdayCard}
          onPress={() => copyCode(item.code)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EC4899', '#F472B6', '#FB7185']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.birthdayGradient}
          >
            {/* Confetti decorations */}
            <View style={styles.confettiContainer}>
              <Text style={[styles.confetti, { top: 10, left: 15 }]}>🎉</Text>
              <Text style={[styles.confetti, { top: 5, right: 20 }]}>🎂</Text>
              <Text style={[styles.confetti, { bottom: 50, left: 25 }]}>🎁</Text>
              <Text style={[styles.confetti, { bottom: 15, right: 15 }]}>🎈</Text>
              <Text style={[styles.confetti, { top: 40, right: 50 }]}>✨</Text>
              <Text style={[styles.confetti, { bottom: 80, left: 50 }]}>🎊</Text>
            </View>

            {/* Content */}
            <View style={styles.birthdayContent}>
              {/* Birthday badge */}
              <View style={styles.birthdayBadge}>
                <Text style={styles.birthdayBadgeEmoji}>🎂</Text>
                <Text style={styles.birthdayBadgeText}>BIRTHDAY SPECIAL</Text>
              </View>

              {/* Main title */}
              <Text style={styles.birthdayTitle}>Happy Birthday! 🥳</Text>

              {/* Discount */}
              <View style={styles.birthdayDiscountContainer}>
                <Text style={styles.birthdayDiscount}>
                  {item.discountType === 'percentage'
                    ? `${item.discountValue}%`
                    : formatCurrency(item.discountValue)}
                </Text>
                <Text style={styles.birthdayDiscountLabel}>OFF</Text>
              </View>

              {/* Description */}
              {item.description && (
                <Text style={styles.birthdayDescription}>{item.description}</Text>
              )}

              {/* Conditions */}
              <View style={styles.birthdayConditions}>
                {item.minimumOrderAmount && item.minimumOrderAmount > 0 && (
                  <View style={styles.birthdayConditionItem}>
                    <Ionicons name="cart-outline" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.birthdayConditionText}>
                      Min. {formatCurrency(item.minimumOrderAmount)}
                    </Text>
                  </View>
                )}
                {item.maximumDiscount && (
                  <View style={styles.birthdayConditionItem}>
                    <Ionicons name="pricetag-outline" size={14} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.birthdayConditionText}>
                      Max {formatCurrency(item.maximumDiscount)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Validity */}
              {item.endDate && (
                <View style={styles.birthdayValidityRow}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.birthdayValidityText}>
                    Valid until {formatDate(item.endDate)}
                  </Text>
                </View>
              )}

              {/* Code section */}
              <View style={styles.birthdayCodeSection}>
                <View style={styles.birthdayCodeBox}>
                  <Text style={styles.birthdayCodeLabel}>YOUR CODE</Text>
                  <Text style={styles.birthdayCodeText}>{item.code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.birthdayCopyButton}
                  onPress={() => copyCode(item.code)}
                >
                  <Ionicons name="copy" size={18} color="#EC4899" />
                  <Text style={styles.birthdayCopyText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // Regular coupon card
    return (
      <TouchableOpacity
        style={[
          styles.couponCard,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
          (expired || notStarted) && styles.couponCardDisabled,
        ]}
        onPress={() => copyCode(item.code)}
        activeOpacity={0.7}
        disabled={expired || notStarted}
      >
        {/* Left accent */}
        <View style={[styles.couponAccent, { backgroundColor: badgeColor }]} />

        {/* Content */}
        <View style={styles.couponContent}>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: badgeColor + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: badgeColor }]}>
              {sourceLabels[item.source || 'admin'] || 'General'}
            </Text>
          </View>

          {/* Discount */}
          <Text style={[styles.discountText, { color: colors.text }]}>
            {item.discountType === 'percentage'
              ? `${item.discountValue}% OFF`
              : formatCurrency(item.discountValue) + ' OFF'}
          </Text>

          {/* Description */}
          {item.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Conditions */}
          <View style={styles.conditions}>
            {item.minimumOrderAmount && item.minimumOrderAmount > 0 && (
              <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                Min order: {formatCurrency(item.minimumOrderAmount)}
              </Text>
            )}
            {item.maximumDiscount && (
              <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                Max discount: {formatCurrency(item.maximumDiscount)}
              </Text>
            )}
          </View>

          {/* Validity */}
          {(item.startDate || item.endDate) && (
            <View style={styles.validityRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                {expired
                  ? 'Expired'
                  : notStarted
                  ? `Starts ${formatDate(item.startDate)}`
                  : `Valid until ${formatDate(item.endDate)}`}
              </Text>
            </View>
          )}

          {/* Code */}
          <View style={styles.codeRow}>
            <View style={[styles.codeBox, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>{item.code}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: badgeColor }]}
              onPress={() => copyCode(item.code)}
            >
              <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status overlay */}
        {(expired || notStarted) && (
          <View style={styles.statusOverlay}>
            <Text style={styles.statusText}>{expired ? 'EXPIRED' : 'COMING SOON'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Coupons</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: '#3B82F620' }]}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoBannerText}>
          Tap any coupon to copy the code. Use it at checkout!
        </Text>
      </View>

      {/* Coupons list */}
      {coupons && coupons.length > 0 ? (
        <FlatList
          data={coupons}
          renderItem={renderCoupon}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <EmptyState
          icon={<Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />}
          title="No Coupons Available"
          description="Check back later for exclusive deals and discounts!"
        />
      )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  headerRight: {
    width: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 8,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: '#3B82F6',
    fontFamily: FONTS.medium,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  couponCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  couponCardDisabled: {
    opacity: 0.6,
  },
  couponAccent: {
    width: 6,
  },
  couponContent: {
    flex: 1,
    padding: SPACING.md,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
  },
  discountText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  conditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  validityText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBox: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    letterSpacing: 1,
    textAlign: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
  },
  // Birthday card styles
  birthdayCard: {
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  birthdayGradient: {
    padding: 20,
    minHeight: 280,
    width: '100%',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.6,
  },
  birthdayContent: {
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
  },
  birthdayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  birthdayBadgeEmoji: {
    fontSize: 16,
  },
  birthdayBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
  },
  birthdayTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: FONTS.bold,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  birthdayDiscountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  birthdayDiscount: {
    color: '#FFFFFF',
    fontSize: 48,
    fontFamily: FONTS.bold,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  birthdayDiscountLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginLeft: 6,
    opacity: 0.9,
  },
  birthdayDescription: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  birthdayConditions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  birthdayConditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  birthdayConditionText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  birthdayValidityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  birthdayValidityText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  birthdayCodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  birthdayCodeBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  birthdayCodeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  birthdayCodeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  birthdayCopyButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  birthdayCopyText: {
    color: '#EC4899',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
