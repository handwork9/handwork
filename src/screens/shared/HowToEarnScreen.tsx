import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { RewardsHeroIllustration } from '../../assets/illustrations/hero';

const PRIMARY_COLOR = '#16A34A';

interface EarnMethod {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  points: string;
  details: string;
  color: string;
}

interface BonusOpportunity {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  bonus: string;
  color: string;
}

export default function HowToEarnScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const earnMethods: EarnMethod[] = [
    {
      id: '1',
      icon: 'cart-outline',
      title: 'Make Purchases',
      description: 'Earn points every time you shop',
      points: '1 point per ₦100',
      details: 'Points are credited after successful delivery',
      color: '#3B82F6',
    },
    {
      id: '2',
      icon: 'people-outline',
      title: 'Refer Friends',
      description: 'Invite friends to join Handwork',
      points: '100 points per referral',
      details: 'Earn when your friend completes their first order',
      color: '#8B5CF6',
    },
    {
      id: '3',
      icon: 'star-outline',
      title: 'Rate Orders',
      description: 'Share your feedback on orders',
      points: '10 points per rating',
      details: 'Rate within 7 days of delivery to earn',
      color: '#F59E0B',
    },
    {
      id: '4',
      icon: 'calendar-outline',
      title: 'Daily Check-in',
      description: 'Open the app and check in daily',
      points: '5 points daily',
      details: '7-day streak bonus: Extra 50 points',
      color: '#10B981',
    },
    {
      id: '5',
      icon: 'checkmark-circle-outline',
      title: 'Complete Profile',
      description: 'Fill in all your profile details',
      points: '50 points one-time',
      details: 'Add photo, phone, address to earn',
      color: '#EC4899',
    },
    {
      id: '6',
      icon: 'share-social-outline',
      title: 'Share Products',
      description: 'Share products with friends',
      points: '5 points per share',
      details: 'Maximum 10 shares per day',
      color: '#06B6D4',
    },
  ];

  const bonusOpportunities: BonusOpportunity[] = [
    {
      id: '1',
      icon: 'flame',
      title: 'First Order Bonus',
      description: 'Complete your first purchase',
      bonus: '+200 points',
      color: '#FF9500',
    },
    {
      id: '2',
      icon: 'calendar',
      title: 'Weekly Streak',
      description: 'Order at least once every week',
      bonus: '+100 points',
      color: '#34C759',
    },
    {
      id: '3',
      icon: 'gift',
      title: 'Birthday Bonus',
      description: 'Celebrate on your special day',
      bonus: '+500 points',
      color: '#AF52DE',
    },
    {
      id: '4',
      icon: 'megaphone',
      title: 'Promotional Events',
      description: 'Participate in special campaigns',
      bonus: 'Up to 1000 points',
      color: '#007AFF',
    },
  ];

  const tiers = [
    { name: 'Bronze', points: '0 - 499', multiplier: '1x', color: '#CD7F32' },
    { name: 'Silver', points: '500 - 1,999', multiplier: '1.25x', color: '#9CA3AF' },
    { name: 'Gold', points: '2,000 - 4,999', multiplier: '1.5x', color: '#F59E0B' },
    { name: 'Platinum', points: '5,000+', multiplier: '2x', color: '#6366F1' },
  ];

  const cardBg = isDark ? colors.card : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Normal Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>How to Earn</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <View style={styles.heroDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
          <View style={styles.heroIllustrationContainer}>
            <RewardsHeroIllustration size={100} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Earn Points, Get Rewards</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Collect points on every action and redeem them for discounts, free delivery, and more!
          </Text>
        </View>

        {/* Ways to Earn Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Ways to Earn</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {earnMethods.map((method, index) => {
            const isLast = index === earnMethods.length - 1;

            return (
              <View key={method.id}>
                <View style={styles.earnRow}>
                  <View style={[styles.earnIcon, { backgroundColor: `${method.color}15` }]}>
                    <Ionicons name={method.icon} size={22} color={method.color} />
                  </View>
                  <View style={styles.earnInfo}>
                    <Text style={[styles.earnTitle, { color: colors.text }]}>{method.title}</Text>
                    <Text style={[styles.earnDescription, { color: colors.textSecondary }]}>{method.description}</Text>
                    <View style={styles.pointsBadge}>
                      <Ionicons name="star" size={12} color="#FFCC00" />
                      <Text style={[styles.pointsBadgeText, { color: PRIMARY_COLOR }]}>{method.points}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.detailsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }]}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.detailsText, { color: colors.textSecondary }]}>{method.details}</Text>
                </View>
                {!isLast && <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />}
              </View>
            );
          })}
        </View>

        {/* Bonus Opportunities Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="gift-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Bonus Opportunities</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {bonusOpportunities.map((bonus, index) => {
            const isLast = index === bonusOpportunities.length - 1;

            return (
              <View key={bonus.id}>
                <View style={styles.bonusRow}>
                  <View style={[styles.bonusIcon, { backgroundColor: `${bonus.color}15` }]}>
                    <Ionicons name={bonus.icon} size={22} color={bonus.color} />
                  </View>
                  <View style={styles.bonusInfo}>
                    <Text style={[styles.bonusTitle, { color: colors.text }]}>{bonus.title}</Text>
                    <Text style={[styles.bonusDescription, { color: colors.textSecondary }]}>{bonus.description}</Text>
                  </View>
                  <View style={[styles.bonusBadge, { backgroundColor: `${bonus.color}15` }]}>
                    <Text style={[styles.bonusBadgeText, { color: bonus.color }]}>{bonus.bonus}</Text>
                  </View>
                </View>
                {!isLast && <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />}
              </View>
            );
          })}
        </View>

        {/* Tier Multipliers Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Tier Multipliers</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.tierIntroContainer}>
            <Text style={[styles.tierIntro, { color: colors.textSecondary }]}>
              Earn points faster with higher membership tiers. Your tier is based on total points earned.
            </Text>
          </View>
          
          {tiers.map((tier, index) => {
            const isLast = index === tiers.length - 1;

            return (
              <View key={tier.name}>
                <View style={styles.tierRow}>
                  <View style={styles.tierLeft}>
                    <View style={[styles.tierIcon, { backgroundColor: `${tier.color}20` }]}>
                      <Ionicons name="shield" size={18} color={tier.color} />
                    </View>
                    <View>
                      <Text style={[styles.tierName, { color: colors.text }]}>{tier.name}</Text>
                      <Text style={[styles.tierPoints, { color: colors.textSecondary }]}>{tier.points} points</Text>
                    </View>
                  </View>
                  <View style={[styles.multiplierBadge, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#ECFDF5' }]}>
                    <Text style={styles.multiplierText}>{tier.multiplier}</Text>
                  </View>
                </View>
                {!isLast && <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />}
              </View>
            );
          })}
        </View>

        {/* Pro Tips Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Pro Tips</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#ECFDF5' }]}>
              <Ionicons name="layers" size={20} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.tipInfo}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Stack Your Earnings</Text>
              <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                Combine multiple earning methods in one session. Make a purchase, rate it, and share the product!
              </Text>
            </View>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#ECFDF5' }]}>
              <Ionicons name="flame" size={20} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.tipInfo}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Don't Break Your Streak</Text>
              <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                Check in daily and maintain weekly ordering streaks for bonus points.
              </Text>
            </View>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#ECFDF5' }]}>
              <Ionicons name="notifications" size={20} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.tipInfo}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Watch for Promotions</Text>
              <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                Enable notifications to never miss double points events and special campaigns.
              </Text>
            </View>
          </View>
        </View>

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: cardBg, borderColor: isDark ? 'transparent' : '#E5E7EB' }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="information-circle" size={18} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Points are credited within 24 hours of completing the action. Some bonuses may have specific terms and conditions.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  heroDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#FFCC00',
    opacity: 0.08,
  },
  decorationCircle1: {
    width: 120,
    height: 120,
    top: 0,
    right: 0,
  },
  decorationCircle2: {
    width: 80,
    height: 80,
    top: 60,
    right: 60,
    opacity: 0.05,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  card: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  earnIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  earnDescription: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
  },
  detailsText: {
    fontSize: 12,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  separator: {
    height: 1,
    marginLeft: 76,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bonusIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  bonusDescription: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  bonusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bonusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  tierIntroContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tierIntro: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  tierPoints: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  multiplierBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  multiplierText: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipInfo: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
});
