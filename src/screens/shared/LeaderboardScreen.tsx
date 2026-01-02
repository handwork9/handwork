import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import leaderboardService, {
  LeaderboardType,
  TimeFrame,
  LeaderboardEntry,
  LeaderboardResponse,
} from '../../services/leaderboardService';
import { formatNumber } from '../../utils/formatters';

const PRIMARY_COLOR = '#16A34A';

// Leaderboard type tabs
const LEADERBOARD_TYPES: { type: LeaderboardType; label: string; icon: string }[] = [
  { type: 'top_sellers', label: 'Sellers', icon: 'trending-up' },
  { type: 'top_rated', label: 'Rated', icon: 'star' },
  { type: 'top_revenue', label: 'Earners', icon: 'cash' },
  { type: 'badge_points', label: 'Badges', icon: 'ribbon' },
];

// Timeframe options
const TIMEFRAMES: { value: TimeFrame; label: string }[] = [
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaderboardType>('top_sellers');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('monthly');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await leaderboardService.getLeaderboard(selectedType, selectedTimeframe, 20);
      setLeaderboardData(data);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [selectedType, selectedTimeframe])
  );

  const onRefresh = () => fetchLeaderboard(true);

  const handleTypeChange = (type: LeaderboardType) => {
    setSelectedType(type);
  };

  const handleTimeframeChange = (timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
  };

  const cardBg = isDark ? colors.card : '#FFFFFF';

  const renderTopThree = () => {
    if (!leaderboardData?.leaderboard || leaderboardData.leaderboard.length < 3) return null;

    const [first, second, third] = leaderboardData.leaderboard;

    return (
      <View style={styles.podiumContainer}>
        {/* Second Place */}
        <View style={styles.podiumItem}>
          <View style={[styles.podiumAvatar, styles.podiumAvatarSecond, { borderColor: '#C0C0C0' }]}>
            {second?.avatar ? (
              <Image source={{ uri: second.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={28} color={colors.textSecondary} />
            )}
          </View>
          <Text style={styles.podiumMedal}>🥈</Text>
          <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
            {second?.name || 'Unknown'}
          </Text>
          <Text style={[styles.podiumMetric, { color: colors.textSecondary }]}>
            {formatNumber(second?.metric || 0)} {second?.metricLabel || ''}
          </Text>
          <View style={[styles.podiumStand, styles.podiumStandSecond, { backgroundColor: '#C0C0C0' }]} />
        </View>

        {/* First Place */}
        <View style={styles.podiumItem}>
          <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, { borderColor: '#FFD700' }]}>
            {first?.avatar ? (
              <Image source={{ uri: first.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={36} color={colors.textSecondary} />
            )}
          </View>
          <Text style={styles.podiumMedal}>🥇</Text>
          <Text style={[styles.podiumName, styles.podiumNameFirst, { color: colors.text }]} numberOfLines={1}>
            {first?.name || 'Unknown'}
          </Text>
          <Text style={[styles.podiumMetric, { color: colors.textSecondary }]}>
            {formatNumber(first?.metric || 0)} {first?.metricLabel || ''}
          </Text>
          <View style={[styles.podiumStand, styles.podiumStandFirst, { backgroundColor: '#FFD700' }]} />
        </View>

        {/* Third Place */}
        <View style={styles.podiumItem}>
          <View style={[styles.podiumAvatar, styles.podiumAvatarThird, { borderColor: '#CD7F32' }]}>
            {third?.avatar ? (
              <Image source={{ uri: third.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={24} color={colors.textSecondary} />
            )}
          </View>
          <Text style={styles.podiumMedal}>🥉</Text>
          <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
            {third?.name || 'Unknown'}
          </Text>
          <Text style={[styles.podiumMetric, { color: colors.textSecondary }]}>
            {formatNumber(third?.metric || 0)} {third?.metricLabel || ''}
          </Text>
          <View style={[styles.podiumStand, styles.podiumStandThird, { backgroundColor: '#CD7F32' }]} />
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = (item: LeaderboardEntry, index: number) => {
    const isTopThree = item.rank <= 3;
    
    return (
      <TouchableOpacity
        key={item.userId}
        style={[styles.leaderboardItem, { backgroundColor: cardBg }]}
        activeOpacity={0.7}
      >
        <View style={[styles.rankContainer, { backgroundColor: isTopThree ? leaderboardService.getRankColor(item.rank) + '20' : isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
          <Text style={[styles.rankText, { color: isTopThree ? leaderboardService.getRankColor(item.rank) : colors.textSecondary }]}>
            {leaderboardService.getRankMedal(item.rank)}
          </Text>
        </View>

        <View style={[styles.itemAvatar, { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#E5F1FF' }]}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImageSmall} />
          ) : (
            <Ionicons name="person" size={20} color={PRIMARY_COLOR} />
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.farmName && (
            <Text style={[styles.itemFarm, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.farmName}
            </Text>
          )}
        </View>

        <View style={styles.itemMetric}>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {formatNumber(item.metric)}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            {item.metricLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Type Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: cardBg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {LEADERBOARD_TYPES.map(({ type, label, icon }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.tab,
                selectedType === type && styles.tabActive,
                { backgroundColor: selectedType === type ? PRIMARY_COLOR : (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6') }
              ]}
              onPress={() => handleTypeChange(type)}
            >
              <Ionicons 
                name={icon as any} 
                size={16} 
                color={selectedType === type ? '#FFFFFF' : colors.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                { color: selectedType === type ? '#FFFFFF' : colors.textSecondary }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Timeframe Selector */}
      <View style={[styles.timeframeContainer, { backgroundColor: cardBg }]}>
        {TIMEFRAMES.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.timeframeButton,
              selectedTimeframe === value && styles.timeframeActive,
              { borderColor: selectedTimeframe === value ? PRIMARY_COLOR : 'transparent' }
            ]}
            onPress={() => handleTimeframeChange(value)}
          >
            <Text style={[
              styles.timeframeText,
              { color: selectedTimeframe === value ? PRIMARY_COLOR : colors.textSecondary }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading leaderboard...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="trophy-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchLeaderboard()}>
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
          {/* Top 3 Podium */}
          {renderTopThree()}

          {/* Rest of the Leaderboard */}
          <View style={styles.listContainer}>
            <Text style={[styles.listTitle, { color: colors.textSecondary }]}>
              ALL RANKINGS
            </Text>
            {leaderboardData?.leaderboard?.slice(3).map((item, index) => renderLeaderboardItem(item, index + 3))}
            
            {(!leaderboardData?.leaderboard || leaderboardData.leaderboard.length === 0) && (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No rankings yet. Be the first!
                </Text>
              </View>
            )}
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
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabActive: {},
  tabText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 2,
  },
  timeframeActive: {},
  timeframeText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
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
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  scrollContent: {
    paddingTop: 16,
  },
  // Podium Styles
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginBottom: 16,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumAvatar: {
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    overflow: 'hidden',
  },
  podiumAvatarFirst: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  podiumAvatarSecond: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  podiumAvatarThird: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  podiumMedal: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumName: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    maxWidth: 80,
  },
  podiumNameFirst: {
    fontSize: 15,
    maxWidth: 100,
  },
  podiumMetric: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  podiumStand: {
    width: '90%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 12,
  },
  podiumStandFirst: {
    height: 60,
  },
  podiumStandSecond: {
    height: 45,
  },
  podiumStandThird: {
    height: 30,
  },
  // List Styles
  listContainer: {
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImageSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  itemFarm: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  itemMetric: {
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
});
