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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
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
  type: 'general' | 'first_order' | 'referral' | 'loyalty' | 'seasonal' | 'flash';
}

const typeLabels: Record<string, string> = {
  general: 'General',
  first_order: 'First Order',
  referral: 'Referral Bonus',
  loyalty: 'Loyalty Reward',
  seasonal: 'Seasonal',
  flash: 'Flash Sale',
};

const typeColors: Record<string, string> = {
  general: '#3B82F6',
  first_order: '#10B981',
  referral: '#8B5CF6',
  loyalty: '#F59E0B',
  seasonal: '#EC4899',
  flash: '#EF4444',
};

export default function CouponsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { data: coupons, isLoading, refetch } = useQuery({
    queryKey: ['availableCoupons'],
    queryFn: async () => {
      const response = await couponService.getAvailableCoupons();
      // Handle different response formats
      if (Array.isArray(response)) return response;
      if (response && typeof response === 'object') {
        return (response as any).coupons || (response as any).data || [];
      }
      return [];
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
    const typeColor = typeColors[item.type] || typeColors.general;

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
        <View style={[styles.couponAccent, { backgroundColor: typeColor }]} />

        {/* Content */}
        <View style={styles.couponContent}>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>
              {typeLabels[item.type]}
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
              style={[styles.copyButton, { backgroundColor: typeColor }]}
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
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F5F5F5', paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  headerRight: {
    width: 32,
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
});
