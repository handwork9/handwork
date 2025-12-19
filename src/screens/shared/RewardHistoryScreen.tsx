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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import rewardService, { PointTransaction, RewardsSummary } from '../../services/rewardService';
import { formatNumber } from '../../utils/formatters';

const PRIMARY_COLOR = '#16A34A';

const FILTER_OPTIONS = ['All', 'Earned', 'Redeemed', 'Expired', 'Bonus'];

export default function RewardHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const filterType = selectedFilter === 'All' ? undefined : selectedFilter.toLowerCase() as any;
      
      const [historyData, summaryData] = await Promise.all([
        rewardService.getPointsHistory({ limit: 50, type: filterType }),
        rewardService.getRewardsSummary(),
      ]);

      setTransactions(historyData.data || []);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [selectedFilter])
  );

  const onRefresh = () => fetchData(true);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'earned':
        return { color: '#34C759', bgColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#ECFDF5', label: 'Earned' };
      case 'redeemed':
        return { color: '#3B82F6', bgColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF', label: 'Redeemed' };
      case 'expired':
        return { color: '#EF4444', bgColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', label: 'Expired' };
      case 'bonus':
        return { color: '#F59E0B', bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB', label: 'Bonus' };
      case 'adjusted':
        return { color: '#6366F1', bgColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF', label: 'Adjusted' };
      default:
        return { color: colors.textSecondary, bgColor: colors.card, label: type };
    }
  };

  // Format date for grouping
  const formatDateKey = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group items by date
  const groupedItems = transactions.reduce((groups, item) => {
    const dateKey = formatDateKey(item.createdAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as Record<string, PointTransaction[]>);

  // Calculate stats
  const totalEarned = summary?.lifetimePoints || 0;
  const totalRedeemed = summary?.redeemedPoints || 0;
  const totalExpired = transactions.filter(t => t.type === 'expired').reduce((sum, t) => sum + Math.abs(t.points), 0);

  const cardBg = isDark ? colors.card : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Normal Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reward History</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading history...</Text>
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
        {/* Stats Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <View style={styles.heroDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="trending-up" size={18} color="#34C759" />
              </View>
              <Text style={[styles.statValue, { color: '#34C759' }]}>+{formatNumber(totalEarned)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Earned</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="gift" size={18} color="#3B82F6" />
              </View>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>-{formatNumber(totalRedeemed)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Redeemed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="time" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>-{formatNumber(totalExpired)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expired</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_OPTIONS.map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  { backgroundColor: isActive ? PRIMARY_COLOR : cardBg },
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* History List */}
        {Object.keys(groupedItems).length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
              <Ionicons name="time-outline" size={40} color="#9CA3AF" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No History</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Your reward activity will appear here
            </Text>
          </View>
        ) : (
          Object.entries(groupedItems).map(([dateKey, items]) => (
            <View key={dateKey}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.sectionTitle}>{dateKey}</Text>
              </View>
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                {items.map((item, index) => {
                  const typeConfig = getTypeConfig(item.type);
                  const isLast = index === items.length - 1;
                  const displayPoints = item.type === 'earned' || item.type === 'bonus' ? item.points : -Math.abs(item.points);
                  const time = new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  
                  return (
                    <TouchableOpacity 
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() => (navigation as any).navigate('RewardTransactionDetail', {
                        transaction: {
                          id: item.id,
                          title: rewardService.getSourceDisplayName(item.source),
                          description: item.description || `${item.source} transaction`,
                          points: displayPoints,
                          type: item.type,
                          icon: rewardService.getSourceIcon(item.source),
                          date: item.createdAt,
                          referenceId: item.referenceId || `REW-${item.id.slice(0, 8).toUpperCase()}`,
                          status: item.type === 'expired' ? 'Expired' : 'Completed',
                          balanceBefore: item.balanceBefore,
                          balanceAfter: item.balanceAfter,
                        }
                      })}
                    >
                      <View style={styles.historyRow}>
                        <View style={[styles.historyIcon, { backgroundColor: typeConfig.bgColor }]}>
                          <Ionicons name={rewardService.getSourceIcon(item.source) as any} size={20} color={typeConfig.color} />
                        </View>
                        <View style={styles.historyInfo}>
                          <Text style={[styles.historyTitle, { color: colors.text }]}>{rewardService.getSourceDisplayName(item.source)}</Text>
                          <Text style={[styles.historyDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.description || item.referenceType || 'Points transaction'}
                          </Text>
                          <Text style={[styles.historyTime, { color: colors.textSecondary }]}>{time}</Text>
                        </View>
                        <View style={styles.pointsContainer}>
                          <Text style={[styles.pointsText, { color: typeConfig.color }]}>
                            {displayPoints > 0 ? '+' : ''}{formatNumber(displayPoints)}
                          </Text>
                          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
                            <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                          </View>
                        </View>
                      </View>
                      {!isLast && <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: cardBg, borderColor: isDark ? 'transparent' : '#E5E7EB' }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="information-circle" size={18} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Points expire 12 months after earning. Keep track of your points to avoid losing them.
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
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
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
    backgroundColor: PRIMARY_COLOR,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  statDivider: {
    width: 1,
    height: 50,
  },
  filterContainer: {
    paddingBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONTS.regular,
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
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  historyDescription: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  historyTime: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  typeBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  separator: {
    height: 1,
    marginLeft: 70,
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
});
