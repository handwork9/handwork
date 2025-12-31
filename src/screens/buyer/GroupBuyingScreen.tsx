import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import groupBuyingService, {
  GroupBuy,
  GroupBuyTier,
} from '../../services/groupBuyingService';

type TabType = 'explore' | 'my' | 'organize';

export default function GroupBuyingScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch discount tiers
  const { data: tiers = [] } = useQuery<GroupBuyTier[]>({
    queryKey: ['groupBuyTiers'],
    queryFn: groupBuyingService.getTiers,
  });

  // Fetch all active group buys
  const {
    data: exploreData,
    isLoading: isLoadingExplore,
    refetch: refetchExplore,
  } = useQuery({
    queryKey: ['groupBuys', 'explore'],
    queryFn: () => groupBuyingService.getAll({ status: 'active' }),
    enabled: activeTab === 'explore',
  });

  // Fetch my group buys
  const {
    data: myData,
    isLoading: isLoadingMy,
    refetch: refetchMy,
  } = useQuery({
    queryKey: ['groupBuys', 'my'],
    queryFn: groupBuyingService.getMyGroupBuys,
    enabled: activeTab === 'my' || activeTab === 'organize',
  });

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: (id: string) => groupBuyingService.join(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupBuys'] });
      Alert.alert('Success', 'You have joined the group buy!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join');
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: (id: string) => groupBuyingService.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupBuys'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to leave');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => groupBuyingService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupBuys'] });
      Alert.alert('Success', 'Group buy cancelled and refunds processed');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel');
    },
  });

  const handleRefresh = useCallback(() => {
    if (activeTab === 'explore') {
      refetchExplore();
    } else {
      refetchMy();
    }
  }, [activeTab, refetchExplore, refetchMy]);

  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh])
  );

  const handleShare = async (groupBuy: GroupBuy) => {
    try {
      await Share.share({
        message: `Join my group buy for "${groupBuy.title}" and get up to ${groupBuy.currentDiscount}% off! Use code: ${groupBuy.shareCode}\n\nCurrent price: ${groupBuyingService.formatPrice(groupBuy.currentPrice)} (was ${groupBuyingService.formatPrice(groupBuy.originalPrice)})`,
        title: `Group Buy: ${groupBuy.title}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleJoin = (groupBuy: GroupBuy) => {
    Alert.alert(
      'Join Group Buy',
      `Join "${groupBuy.title}" at ${groupBuyingService.formatPrice(groupBuy.currentPrice)}?\n\nThe price may decrease as more people join!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => joinMutation.mutate(groupBuy.id),
        },
      ]
    );
  };

  const handleLeave = (groupBuy: GroupBuy) => {
    Alert.alert(
      'Leave Group Buy',
      'Are you sure you want to leave this group buy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => leaveMutation.mutate(groupBuy.id),
        },
      ]
    );
  };

  const handleCancel = (groupBuy: GroupBuy) => {
    Alert.alert(
      'Cancel Group Buy',
      'Are you sure you want to cancel this group buy? All participants will be refunded.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(groupBuy.id),
        },
      ]
    );
  };

  const renderGroupBuyCard = ({ item: groupBuy }: { item: GroupBuy }) => {
    const timeRemaining = groupBuyingService.formatTimeRemaining(groupBuy.deadline);
    const progress = groupBuyingService.getProgress(
      groupBuy.currentParticipants,
      groupBuy.minParticipants
    );
    const isJoined = myData?.joined.some((g) => g.id === groupBuy.id);
    const isOrganizer = myData?.organized.some((g) => g.id === groupBuy.id);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('GroupBuyDetail', { groupBuyId: groupBuy.id })}
        activeOpacity={0.9}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: groupBuy.product?.images?.[0] || groupBuy.product?.image || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {groupBuy.currentDiscount > 0 && (
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.discountBadge}
            >
              <Text style={styles.discountText}>
                {groupBuyingService.formatDiscount(groupBuy.currentDiscount)}
              </Text>
            </LinearGradient>
          )}
          <View style={[styles.timeBadge, { backgroundColor: colors.surface }]}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {timeRemaining}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
            {groupBuy.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.currentPrice, { color: COLORS.primary }]}>
              {groupBuyingService.formatPrice(groupBuy.currentPrice)}
            </Text>
            {groupBuy.currentDiscount > 0 && (
              <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                {groupBuyingService.formatPrice(groupBuy.originalPrice)}
              </Text>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: COLORS.primary },
                ]}
              />
            </View>
            <View style={styles.participantsRow}>
              <Ionicons name="people" size={14} color={colors.textSecondary} />
              <Text style={[styles.participantsText, { color: colors.textSecondary }]}>
                {groupBuy.currentParticipants}/{groupBuy.minParticipants} needed
              </Text>
            </View>
          </View>

          {/* Next tier info */}
          {groupBuy.nextTier && (
            <View style={[styles.nextTierBadge, { backgroundColor: colors.surface }]}>
              <Ionicons name="trending-up" size={12} color="#10B981" />
              <Text style={[styles.nextTierText, { color: colors.text }]}>
                {groupBuy.nextTier.participantsNeeded} more for {groupBuy.nextTier.discount}% off
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {isOrganizer ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleShare(groupBuy)}
                >
                  <Ionicons name="share-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={() => navigation.navigate('GroupBuyDetail', { groupBuyId: groupBuy.id })}
                >
                  <Text style={styles.primaryBtnText}>Manage</Text>
                </TouchableOpacity>
              </>
            ) : isJoined ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleLeave(groupBuy)}
                >
                  <Text style={[styles.leaveBtnText, { color: '#EF4444' }]}>Leave</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={() => navigation.navigate('GroupBuyDetail', { groupBuyId: groupBuy.id })}
                >
                  <Text style={styles.primaryBtnText}>View</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleShare(groupBuy)}
                >
                  <Ionicons name="share-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={() => handleJoin(groupBuy)}
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Join Now</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTierInfo = () => (
    <View style={[styles.tierSection, { backgroundColor: colors.card }]}>
      <Text style={[styles.tierTitle, { color: colors.text }]}>
        How Group Buying Works
      </Text>
      <Text style={[styles.tierSubtitle, { color: colors.textSecondary }]}>
        More buyers = bigger discounts!
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tierScroll}>
        {tiers.map((tier, index) => (
          <View
            key={index}
            style={[styles.tierCard, { backgroundColor: colors.surface }]}
          >
            <Ionicons
              name="people"
              size={20}
              color={COLORS.primary}
              style={styles.tierIcon}
            />
            <Text style={[styles.tierParticipants, { color: colors.text }]}>
              {tier.minParticipants}+ buyers
            </Text>
            <Text style={[styles.tierDiscount, { color: '#10B981' }]}>
              {tier.discount}% OFF
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderExploreTab = () => {
    if (isLoadingExplore) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    const groupBuys = exploreData?.groupBuys || [];
    const filteredGroupBuys = searchQuery
      ? groupBuys.filter(
          (g) =>
            g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : groupBuys;

    return (
      <FlatList
        data={filteredGroupBuys}
        renderItem={renderGroupBuyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {renderTierInfo()}
            <View style={styles.searchContainer}>
              <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search group buys..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Active Group Buys
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Be the first to start one!
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
      />
    );
  };

  const renderMyTab = () => {
    if (isLoadingMy) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    const joinedGroupBuys = myData?.joined || [];

    return (
      <FlatList
        data={joinedGroupBuys}
        renderItem={renderGroupBuyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Group Buys Joined
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Join a group buy to save money!
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
      />
    );
  };

  const renderOrganizeTab = () => {
    if (isLoadingMy) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    const organizedGroupBuys = myData?.organized || [];

    return (
      <FlatList
        data={organizedGroupBuys}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('GroupBuyDetail', { groupBuyId: item.id })}
            activeOpacity={0.9}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.product?.images?.[0] || item.product?.image || 'https://via.placeholder.com/150' }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: groupBuyingService.getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
                  <Text style={[styles.statText, { color: colors.text }]}>
                    {item.currentParticipants}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="trending-down" size={14} color="#10B981" />
                  <Text style={[styles.statText, { color: '#10B981' }]}>
                    {item.currentDiscount}% off
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleShare(item)}
                >
                  <Ionicons name="share-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                {item.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleCancel(item)}
                  >
                    <Text style={{ color: '#EF4444', fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.createCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('CreateGroupBuy')}
          >
            <LinearGradient
              colors={[COLORS.primary, '#34D399']}
              style={styles.createIcon}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.createContent}>
              <Text style={[styles.createTitle, { color: colors.text }]}>
                Start a Group Buy
              </Text>
              <Text style={[styles.createSubtitle, { color: colors.textSecondary }]}>
                Organize a group buy and invite friends
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Group Buys Organized
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start one and invite friends!
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + SPACING.sm, backgroundColor: colors.surface },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Group Buying</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {(['explore', 'my', 'organize'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? COLORS.primary : colors.textSecondary },
              ]}
            >
              {tab === 'explore' ? 'Explore' : tab === 'my' ? 'Joined' : 'Organize'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'explore' && renderExploreTab()}
      {activeTab === 'my' && renderMyTab()}
      {activeTab === 'organize' && renderOrganizeTab()}
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
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  listContent: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierSection: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  tierTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  tierSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  tierScroll: {
    marginTop: SPACING.xs,
  },
  tierCard: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
    minWidth: 90,
  },
  tierIcon: {
    marginBottom: 4,
  },
  tierParticipants: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  tierDiscount: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  discountText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
  },
  timeBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  currentPrice: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  originalPrice: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textDecorationLine: 'line-through',
    marginLeft: SPACING.sm,
  },
  progressSection: {
    marginBottom: SPACING.sm,
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
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  participantsText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  nextTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  nextTierText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  actionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    minWidth: 100,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  leaveBtnText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  createTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  createSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
});
