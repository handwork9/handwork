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
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import rewardService from '../../services/rewardService';
import { formatNumber } from '../../utils/formatters';

const PRIMARY_COLOR = '#16A34A';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  points: number;
  progress: number;
  target: number;
  isCompleted: boolean;
  type: 'daily' | 'weekly' | 'special';
  expiresAt?: string;
}

// Mock challenges - In production, these would come from the backend
const generateDailyChallenges = (streak: number): DailyChallenge[] => {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  return [
    {
      id: 'daily_checkin',
      title: 'Daily Check-in',
      description: 'Open the app and check in',
      icon: 'calendar-outline',
      iconColor: '#3B82F6',
      points: 5,
      progress: streak > 0 ? 1 : 0,
      target: 1,
      isCompleted: streak > 0,
      type: 'daily',
      expiresAt: endOfDay.toISOString(),
    },
    {
      id: 'browse_products',
      title: 'Explorer',
      description: 'View 5 different products',
      icon: 'eye-outline',
      iconColor: '#8B5CF6',
      points: 10,
      progress: Math.floor(Math.random() * 5),
      target: 5,
      isCompleted: false,
      type: 'daily',
      expiresAt: endOfDay.toISOString(),
    },
    {
      id: 'add_to_cart',
      title: 'Shopping Enthusiast',
      description: 'Add 3 items to your cart',
      icon: 'cart-outline',
      iconColor: '#F59E0B',
      points: 15,
      progress: Math.floor(Math.random() * 3),
      target: 3,
      isCompleted: false,
      type: 'daily',
      expiresAt: endOfDay.toISOString(),
    },
    {
      id: 'share_product',
      title: 'Social Butterfly',
      description: 'Share a product with friends',
      icon: 'share-social-outline',
      iconColor: '#EC4899',
      points: 10,
      progress: 0,
      target: 1,
      isCompleted: false,
      type: 'daily',
      expiresAt: endOfDay.toISOString(),
    },
    {
      id: 'add_favorite',
      title: 'Wishlist Builder',
      description: 'Add 2 products to favorites',
      icon: 'heart-outline',
      iconColor: '#EF4444',
      points: 8,
      progress: Math.floor(Math.random() * 2),
      target: 2,
      isCompleted: false,
      type: 'daily',
      expiresAt: endOfDay.toISOString(),
    },
  ];
};

const generateWeeklyChallenges = (): DailyChallenge[] => {
  const now = new Date();
  const endOfWeek = new Date(now.getTime() + (7 - now.getDay()) * 24 * 60 * 60 * 1000);
  
  return [
    {
      id: 'weekly_orders',
      title: 'Weekly Shopper',
      description: 'Complete 3 orders this week',
      icon: 'bag-check-outline',
      iconColor: '#10B981',
      points: 100,
      progress: Math.floor(Math.random() * 3),
      target: 3,
      isCompleted: false,
      type: 'weekly',
      expiresAt: endOfWeek.toISOString(),
    },
    {
      id: 'weekly_reviews',
      title: 'Feedback Champion',
      description: 'Leave 5 product reviews',
      icon: 'star-outline',
      iconColor: '#F59E0B',
      points: 50,
      progress: Math.floor(Math.random() * 5),
      target: 5,
      isCompleted: false,
      type: 'weekly',
      expiresAt: endOfWeek.toISOString(),
    },
    {
      id: 'weekly_streak',
      title: 'Consistency King',
      description: 'Maintain a 7-day check-in streak',
      icon: 'flame-outline',
      iconColor: '#EF4444',
      points: 75,
      progress: 0,
      target: 7,
      isCompleted: false,
      type: 'weekly',
      expiresAt: endOfWeek.toISOString(),
    },
  ];
};

const generateSpecialChallenges = (): DailyChallenge[] => {
  return [
    {
      id: 'first_purchase',
      title: 'First Purchase',
      description: 'Complete your first order',
      icon: 'trophy-outline',
      iconColor: '#F59E0B',
      points: 200,
      progress: 0,
      target: 1,
      isCompleted: false,
      type: 'special',
    },
    {
      id: 'complete_profile',
      title: 'Profile Master',
      description: 'Complete all profile sections',
      icon: 'person-circle-outline',
      iconColor: '#3B82F6',
      points: 150,
      progress: Math.floor(Math.random() * 4),
      target: 5,
      isCompleted: false,
      type: 'special',
    },
    {
      id: 'refer_friend',
      title: 'Bring a Friend',
      description: 'Invite a friend who makes a purchase',
      icon: 'people-outline',
      iconColor: '#8B5CF6',
      points: 200,
      progress: 0,
      target: 1,
      isCompleted: false,
      type: 'special',
    },
  ];
};

export default function DailyChallengesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'special'>('daily');
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<DailyChallenge[]>([]);
  const [specialChallenges, setSpecialChallenges] = useState<DailyChallenge[]>([]);

  const cardBg = isDark ? colors.card : '#FFFFFF';

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Get rewards summary to get streak info
      const summary = await rewardService.getRewardsSummary();
      setCurrentStreak(summary.currentStreak || 0);
      
      // Generate challenges (in production, these would come from the API)
      setDailyChallenges(generateDailyChallenges(summary.currentStreak || 0));
      setWeeklyChallenges(generateWeeklyChallenges());
      setSpecialChallenges(generateSpecialChallenges());
    } catch (err: any) {
      console.error('Error fetching challenges:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => fetchData(true);

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const getChallenges = () => {
    switch (selectedTab) {
      case 'daily':
        return dailyChallenges;
      case 'weekly':
        return weeklyChallenges;
      case 'special':
        return specialChallenges;
      default:
        return dailyChallenges;
    }
  };

  const getTotalPoints = () => {
    const challenges = getChallenges();
    return challenges.reduce((sum, c) => sum + c.points, 0);
  };

  const getEarnedPoints = () => {
    const challenges = getChallenges();
    return challenges.filter(c => c.isCompleted).reduce((sum, c) => sum + c.points, 0);
  };

  const getCompletedCount = () => {
    const challenges = getChallenges();
    return challenges.filter(c => c.isCompleted).length;
  };

  const renderChallengeCard = (challenge: DailyChallenge, index: number) => {
    const progressPercent = (challenge.progress / challenge.target) * 100;
    
    return (
      <View 
        key={challenge.id}
        style={[
          styles.challengeCard, 
          { 
            backgroundColor: cardBg,
            opacity: challenge.isCompleted ? 0.7 : 1,
          }
        ]}
      >
        {challenge.isCompleted && (
          <View style={styles.completedOverlay}>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
          </View>
        )}
        
        <View style={styles.challengeHeader}>
          <View style={[styles.challengeIcon, { backgroundColor: `${challenge.iconColor}15` }]}>
            <Ionicons name={challenge.icon as any} size={24} color={challenge.iconColor} />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeTitle, { color: colors.text }]}>
              {challenge.title}
            </Text>
            <Text style={[styles.challengeDescription, { color: colors.textSecondary }]}>
              {challenge.description}
            </Text>
          </View>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.pointsText}>{challenge.points}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {challenge.progress}/{challenge.target}
            </Text>
            {challenge.expiresAt && (
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {getTimeRemaining(challenge.expiresAt)}
              </Text>
            )}
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(progressPercent, 100)}%`,
                  backgroundColor: challenge.isCompleted ? '#10B981' : challenge.iconColor,
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Challenges</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading challenges...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_COLOR} />
          }
        >
          {/* Stats Summary */}
          <View style={[styles.statsCard, { backgroundColor: cardBg }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="flame" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{currentStreak}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {getCompletedCount()}/{getChallenges().length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {getEarnedPoints()}/{getTotalPoints()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Points</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: cardBg }]}>
            {(['daily', 'weekly', 'special'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  selectedTab === tab && styles.tabActive,
                  selectedTab === tab && { backgroundColor: `${PRIMARY_COLOR}15` },
                ]}
                onPress={() => setSelectedTab(tab)}
              >
                <Ionicons 
                  name={
                    tab === 'daily' ? 'today-outline' : 
                    tab === 'weekly' ? 'calendar-outline' : 
                    'trophy-outline'
                  } 
                  size={18} 
                  color={selectedTab === tab ? PRIMARY_COLOR : colors.textSecondary} 
                />
                <Text 
                  style={[
                    styles.tabText, 
                    { color: selectedTab === tab ? PRIMARY_COLOR : colors.textSecondary }
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Challenges List */}
          <View style={styles.challengesList}>
            {getChallenges().map((challenge, index) => renderChallengeCard(challenge, index))}
          </View>

          {/* Tip Card */}
          <View style={[styles.tipCard, { backgroundColor: cardBg, borderColor: isDark ? 'transparent' : '#E5E7EB' }]}>
            <View style={[styles.tipIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
            </View>
            <View style={styles.tipContent}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>Pro Tip</Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Complete all daily challenges to earn bonus streak points! 
                Maintain a 7-day streak for extra rewards.
              </Text>
            </View>
          </View>
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
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  statDivider: {
    width: 1,
    height: 50,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  challengesList: {
    gap: 12,
  },
  challengeCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  completedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  completedBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  challengeDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    fontFamily: FONTS.bold,
  },
  progressSection: {
    marginTop: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tipCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
});
