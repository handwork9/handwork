import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import rewardService, { RewardsSummary, Reward } from '../../services/rewardService';
import { formatNumber } from '../../utils/formatters';
import { PointsBadgeIllustration } from '../../assets/illustrations/hero';

const PRIMARY_COLOR = '#16A34A';

export default function RewardsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [summaryData, rewardsData] = await Promise.all([
        rewardService.getRewardsSummary(),
        rewardService.getAvailableRewards(),
      ]);

      setSummary(summaryData);
      setAvailableRewards(rewardsData || []);
    } catch (err: any) {
      console.error('Error fetching rewards data:', err);
      setError(err.message || 'Failed to load rewards');
      setAvailableRewards([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const result = await rewardService.dailyCheckIn();
      Alert.alert(
        '✅ Check-in Successful!',
        `You earned ${result.points} points!\nStreak: ${result.streak} day${result.streak > 1 ? 's' : ''}${result.bonusEarned ? '\n🎉 Bonus earned!' : ''}`,
        [{ text: 'OK', onPress: () => fetchData() }]
      );
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Check-in failed';
      Alert.alert('Check-in', message);
    } finally {
      setCheckingIn(false);
    }
  };

  const onRefresh = () => fetchData(true);

  // Fallback earn methods if API doesn't provide them
  const earnMethods = summary?.earnMethods || [
    { icon: 'cart-outline', title: 'Make Purchases', description: 'Earn 1 point per ₦100 spent' },
    { icon: 'people-outline', title: 'Refer Friends', description: 'Get 200 bonus points per referral' },
    { icon: 'star-outline', title: 'Rate Orders', description: 'Earn 10 points for each rating' },
    { icon: 'calendar-outline', title: 'Daily Check-in', description: 'Get 5 points daily' },
  ];

  const currentPoints = summary?.currentPoints || 0;
  const tier = summary?.tier || 'Bronze';
  const nextTier = summary?.nextTier;
  const pointsToNextTier = summary?.pointsToNextTier || 0;
  const tierProgress = summary?.tierProgress || 0;
  const currentStreak = summary?.currentStreak || 0;

  const cardBg = isDark ? colors.card : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Normal Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Rewards</Text>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => (navigation as any).navigate('RewardHistory')}
        >
          <Ionicons name="time-outline" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading rewards...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_COLOR} />
        }
      >
        {/* Points Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <View style={styles.heroDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
          <View style={styles.heroIllustrationContainer}>
            <PointsBadgeIllustration size={80} />
          </View>
          <Text style={[styles.pointsValue, { color: colors.text }]}>{formatNumber(currentPoints)}</Text>
          <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>Total Points</Text>
          
          <View style={styles.tierContainer}>
            <View style={[styles.tierBadge, { backgroundColor: isDark ? 'rgba(192, 192, 192, 0.15)' : '#F5F5F5' }]}>
              <Ionicons name="shield" size={14} color={rewardService.getTierColor(tier)} />
              <Text style={[styles.tierText, { color: colors.text }]}>{tier} Member</Text>
            </View>
            {currentStreak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}>
                <Ionicons name="flame" size={14} color="#EF4444" />
                <Text style={[styles.streakText, { color: colors.text }]}>{formatNumber(currentStreak)} day streak</Text>
              </View>
            )}
          </View>

          {nextTier && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{formatNumber(pointsToNextTier)} points to {nextTier}</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
              <View style={[styles.progressFill, { width: `${Math.min(tierProgress, 100)}%` }]} />
            </View>
          </View>
          )}

          {/* Daily Check-in Button */}
          <TouchableOpacity 
            style={[styles.checkinButton, checkingIn && styles.checkinButtonDisabled]}
            onPress={handleCheckIn}
            disabled={checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                <Text style={styles.checkinText}>Daily Check-in</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Available Rewards Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="gift-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Available Rewards</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {!availableRewards || availableRewards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No rewards available</Text>
            </View>
          ) : (
          availableRewards.map((reward, index) => {
            const canRedeem = currentPoints >= reward.pointsCost;
            const isLast = index === availableRewards.length - 1;
            
            return (
              <TouchableOpacity 
                key={reward.id}
                activeOpacity={0.7}
                onPress={() => (navigation as any).navigate('RewardDetail', { rewardId: reward.id, userPoints: currentPoints })}
              >
                <View style={styles.rewardRow}>
                  <View style={[styles.rewardIcon, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#ECFDF5' }]}>
                    <Ionicons name={rewardService.getRewardTypeIcon(reward.type) as any} size={20} color={PRIMARY_COLOR} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={[styles.rewardTitle, { color: colors.text }]}>{reward.name}</Text>
                    <Text style={[styles.rewardDescription, { color: colors.textSecondary }]}>{reward.description}</Text>
                    <View style={styles.pointsRequired}>
                      <Ionicons name="star" size={12} color="#FFCC00" />
                      <Text style={[styles.pointsRequiredText, { color: colors.textSecondary }]}>{reward.pointsCost} points</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.redeemButton,
                      { backgroundColor: canRedeem ? PRIMARY_COLOR : (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6') },
                    ]}
                  >
                    <Text style={[styles.redeemText, { color: canRedeem ? '#FFFFFF' : colors.textSecondary }]}>
                      {canRedeem ? 'Redeem' : 'Locked'}
                    </Text>
                  </View>
                </View>
                {!isLast && <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />}
              </TouchableOpacity>
            );
          })
          )}
        </View>

        {/* How to Earn Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>How to Earn Points</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {earnMethods.map((method, index) => {
            const isLast = index === earnMethods.length - 1;
            
            return (
              <TouchableOpacity 
                key={method.title}
                activeOpacity={0.7}
                onPress={() => (navigation as any).navigate('HowToEarn')}
              >
                <View style={styles.earnRow}>
                  <View style={[styles.earnIcon, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#EFF6FF' }]}>
                    <Ionicons name={method.icon as any} size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.earnInfo}>
                    <Text style={[styles.earnTitle, { color: colors.text }]}>{method.title}</Text>
                    <Text style={[styles.earnDescription, { color: colors.textSecondary }]}>{method.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
                {!isLast && <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: cardBg, borderColor: isDark ? 'transparent' : '#E5E7EB' }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="information-circle" size={18} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Points expire 12 months after earning. Redeem before they expire to maximize your rewards.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontFamily: FONTS.semiBold,
  },
  historyButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 204, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  pointsLabel: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  tierContainer: {
    marginTop: 16,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  progressContainer: {
    width: '100%',
    marginTop: 20,
  },
  progressHeader: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FCD34D',
    borderRadius: 3,
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
    fontFamily: FONTS.semiBold,
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
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  rewardDescription: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  pointsRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pointsRequiredText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  redeemButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  redeemText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  separator: {
    height: 1,
    marginLeft: 70,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  earnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnInfo: {
    flex: 1,
    marginLeft: 12,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  earnDescription: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  retryButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 8,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    marginTop: 20,
  },
  checkinButtonDisabled: {
    opacity: 0.7,
  },
  checkinText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
});
