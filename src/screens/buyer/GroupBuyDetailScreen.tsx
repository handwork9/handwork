import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import groupBuyingService, { GroupBuy, GroupBuyParticipant } from '../../services/groupBuyingService';

export default function GroupBuyDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { groupBuyId } = route.params;
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Fetch group buy details
  const {
    data: groupBuy,
    isLoading,
    refetch,
    error,
  } = useQuery<GroupBuy>({
    queryKey: ['groupBuy', groupBuyId],
    queryFn: () => groupBuyingService.getById(groupBuyId),
  });

  // Fetch participants
  const { data: participants = [] } = useQuery<GroupBuyParticipant[]>({
    queryKey: ['groupBuyParticipants', groupBuyId],
    queryFn: () => groupBuyingService.getParticipants(groupBuyId),
  });

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: () => groupBuyingService.join(groupBuyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupBuy', groupBuyId] });
      queryClient.invalidateQueries({ queryKey: ['groupBuyParticipants', groupBuyId] });
      queryClient.invalidateQueries({ queryKey: ['groupBuys'] });
      Alert.alert('Success! 🎉', 'You have joined the group buy!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join group buy');
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: () => groupBuyingService.leave(groupBuyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupBuy', groupBuyId] });
      queryClient.invalidateQueries({ queryKey: ['groupBuyParticipants', groupBuyId] });
      queryClient.invalidateQueries({ queryKey: ['groupBuys'] });
      Alert.alert('Left Group Buy', 'You have left the group buy');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to leave group buy');
    },
  });

  // Cancel mutation (for organizer)
  const cancelMutation = useMutation({
    mutationFn: () => groupBuyingService.cancel(groupBuyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupBuys'] });
      Alert.alert('Cancelled', 'Group buy has been cancelled. Refunds will be processed.');
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel group buy');
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const isOrganizer = groupBuy?.organizer?.id === currentUser?.id;
  const isParticipant = participants.some(p => p.user?.id === currentUser?.id);
  const userParticipant = participants.find(p => p.user?.id === currentUser?.id);
  const canJoin = !isParticipant && groupBuy?.status === 'active' && 
    (!groupBuy?.maxParticipants || groupBuy.currentParticipants < groupBuy.maxParticipants);

  const handleShare = async () => {
    if (!groupBuy) return;
    try {
      await Share.share({
        title: groupBuy.title,
        message: `Join my group buy "${groupBuy.title}" and save ${groupBuy.currentDiscount}%! Use code: ${groupBuy.shareCode}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleJoin = () => {
    Alert.alert(
      'Join Group Buy',
      `You're about to join "${groupBuy?.title}". You'll get ${groupBuy?.currentDiscount}% off!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: () => joinMutation.mutate() },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Group Buy',
      'Are you sure you want to leave this group buy?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveMutation.mutate() },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Group Buy',
      'Are you sure you want to cancel this group buy? All participants will be refunded.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'success': return COLORS.primary;
      case 'failed': return COLORS.error;
      case 'cancelled': return COLORS.warning;
      default: return colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !groupBuy) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          Failed to load group buy details
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: COLORS.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {groupBuy.title}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        {/* Product Image */}
        <Image
          source={{ uri: groupBuy.product?.images?.[0] || groupBuy.product?.image || 'https://via.placeholder.com/400' }}
          style={styles.productImage}
        />

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(groupBuy.status) }]}>
          <Text style={styles.statusText}>{groupBuy.status.toUpperCase()}</Text>
        </View>

        {/* Main Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{groupBuy.title}</Text>
          
          {groupBuy.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {groupBuy.description}
            </Text>
          )}

          {/* Discount Info */}
          <LinearGradient
            colors={[COLORS.primary, '#2E7D32']}
            style={styles.discountBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.discountContent}>
              <Text style={styles.discountLabel}>Current Discount</Text>
              <Text style={styles.discountValue}>{groupBuy.currentDiscount}% OFF</Text>
            </View>
            <View style={styles.priceContent}>
              <Text style={styles.originalPrice}>
                ₦{groupBuy.originalPrice.toLocaleString()}
              </Text>
              <Text style={styles.currentPrice}>
                ₦{groupBuy.currentPrice.toLocaleString()}
              </Text>
            </View>
          </LinearGradient>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {groupBuy.currentParticipants}/{groupBuy.maxParticipants || '∞'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Participants
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {getTimeRemaining(groupBuy.deadline)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Time Left
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="cart" size={24} color={COLORS.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {groupBuy.quantityPerPerson}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Per Person
              </Text>
            </View>
          </View>
        </View>

        {/* Organizer Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Organizer</Text>
          <View style={styles.organizerRow}>
            <Image
              source={{ uri: groupBuy.organizer?.avatar || 'https://via.placeholder.com/50' }}
              style={styles.organizerAvatar}
            />
            <View style={styles.organizerInfo}>
              <Text style={[styles.organizerName, { color: colors.text }]}>
                {groupBuy.organizer?.firstName} {groupBuy.organizer?.lastName}
              </Text>
              {isOrganizer && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Deadline Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              Deadline: {formatDate(groupBuy.deadline)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              Minimum: {groupBuy.minParticipants} participants needed
            </Text>
          </View>
          {groupBuy.shareCode && (
            <View style={styles.detailRow}>
              <Ionicons name="ticket-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Share Code: {groupBuy.shareCode}
              </Text>
            </View>
          )}
        </View>

        {/* Participants Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Participants ({participants.length})
          </Text>
          {participants.length > 0 ? (
            <View style={styles.participantsList}>
              {participants.slice(0, 10).map((participant, index) => (
                <View key={participant.id} style={styles.participantRow}>
                  <Image
                    source={{ uri: participant.user?.avatar || 'https://via.placeholder.com/40' }}
                    style={styles.participantAvatar}
                  />
                  <View style={styles.participantInfo}>
                    <Text style={[styles.participantName, { color: colors.text }]}>
                      {participant.user?.firstName || 'Anonymous'}
                      {participant.isOrganizer && ' (Organizer)'}
                    </Text>
                    <Text style={[styles.participantQuantity, { color: colors.textSecondary }]}>
                      Qty: {participant.quantity}
                    </Text>
                  </View>
                  <View style={[
                    styles.participantStatus,
                    { backgroundColor: participant.status === 'paid' ? COLORS.success : COLORS.warning }
                  ]}>
                    <Text style={styles.participantStatusText}>
                      {participant.status}
                    </Text>
                  </View>
                </View>
              ))}
              {participants.length > 10 && (
                <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                  +{participants.length - 10} more participants
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No participants yet. Be the first to join!
            </Text>
          )}
        </View>

        {/* Spacer for bottom buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={[
        styles.bottomBar,
        { 
          backgroundColor: colors.card,
          paddingBottom: insets.bottom + SPACING.md,
          borderTopColor: colors.border,
        }
      ]}>
        {groupBuy.status === 'active' && (
          <>
            {canJoin && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                onPress={handleJoin}
                disabled={joinMutation.isPending}
              >
                {joinMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Join Group Buy</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isParticipant && !isOrganizer && (
              <TouchableOpacity
                style={[styles.actionButton, styles.leaveButton]}
                onPress={handleLeave}
                disabled={leaveMutation.isPending}
              >
                {leaveMutation.isPending ? (
                  <ActivityIndicator color={COLORS.error} />
                ) : (
                  <>
                    <Ionicons name="exit-outline" size={20} color={COLORS.error} />
                    <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
                      Leave
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {isOrganizer && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator color={COLORS.error} />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={20} color={COLORS.error} />
                    <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
                      Cancel Group Buy
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.shareActionButton]}
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginHorizontal: SPACING.md,
  },
  shareButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  productImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  statusBadge: {
    position: 'absolute',
    top: 210,
    right: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
  },
  card: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  discountBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  discountContent: {
    flex: 1,
  },
  discountLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  discountValue: {
    color: '#fff',
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
  },
  priceContent: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    color: '#fff',
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
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
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  organizerInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  organizerName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  youBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  youBadgeText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  participantsList: {
    gap: SPACING.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  participantInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  participantName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  participantQuantity: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  participantStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  participantStatusText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    textTransform: 'capitalize',
  },
  moreText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  leaveButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  shareActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
});
