import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import rewardService, { Reward, RewardsSummary } from '../../services/rewardService';

const PRIMARY_COLOR = '#16A34A';

export default function RewardDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { rewardId, userPoints: initialUserPoints } = route.params as { rewardId: string; userPoints?: number };
  
  const [loading, setLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [userPoints, setUserPoints] = useState(initialUserPoints || 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRewardDetails();
  }, [rewardId]);

  const fetchRewardDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [rewardData, summaryData] = await Promise.all([
        rewardService.getRewardById(rewardId),
        rewardService.getRewardsSummary(),
      ]);

      if (rewardData) {
        setReward(rewardData);
      } else {
        setError('Reward not found');
      }
      setUserPoints(summaryData.currentPoints);
    } catch (err: any) {
      console.error('Error fetching reward:', err);
      setError(err.message || 'Failed to load reward details');
    } finally {
      setLoading(false);
    }
  };

  const canRedeem = reward ? userPoints >= reward.pointsCost : false;
  const pointsNeeded = reward ? reward.pointsCost - userPoints : 0;

  const handleRedeem = () => {
    if (!reward) return;
    
    if (!canRedeem) {
      Alert.alert(
        'Insufficient Points',
        `You need ${pointsNeeded} more points to redeem this reward.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem "${reward.name}" for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            setIsRedeeming(true);
            try {
              const result = await rewardService.redeemReward(reward.id);
              Alert.alert(
                '🎉 Success!',
                `You've successfully redeemed "${reward.name}"!\n\nRedemption Code: ${result.redemptionCode}\n\nYour new balance: ${result.pointsSpent !== undefined ? (userPoints - result.pointsSpent).toLocaleString() : 'Updated'} points`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (err: any) {
              const message = err.response?.data?.message || err.message || 'Redemption failed';
              Alert.alert('Error', message);
            } finally {
              setIsRedeeming(false);
            }
          },
        },
      ]
    );
  };

  const cardBg = isDark ? colors.card : '#FFFFFF';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Reward Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading reward...</Text>
        </View>
      </View>
    );
  }

  if (error || !reward) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Reward Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Reward not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchRewardDetails()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Get reward details (fallback values if not from API)
  const validFor = reward.expiresAt 
    ? `Until ${new Date(reward.expiresAt).toLocaleDateString()}`
    : '30 days after redemption';
  const terms = reward.terms || ['Standard terms and conditions apply'];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Normal Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reward Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Reward Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <View style={styles.heroDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
          <View style={[styles.heroIcon, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#ECFDF5' }]}>
            <Ionicons name={rewardService.getRewardTypeIcon(reward.type) as any} size={36} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{reward.name}</Text>
          <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>{reward.description}</Text>
          
          <View style={styles.pointsCostContainer}>
            <View style={[styles.pointsCostBadge, { backgroundColor: isDark ? 'rgba(255, 204, 0, 0.15)' : '#FEF9E7' }]}>
              <Ionicons name="trophy" size={18} color="#FFCC00" />
              <Text style={[styles.pointsCostText, { color: colors.text }]}>{reward.pointsCost.toLocaleString()} points</Text>
            </View>
          </View>

          {!canRedeem && (
            <View style={styles.needMoreContainer}>
              <Ionicons name="lock-closed" size={14} color="#F59E0B" />
              <Text style={[styles.needMoreText, { color: '#F59E0B' }]}>
                You need {pointsNeeded.toLocaleString()} more points
              </Text>
            </View>
          )}

          {reward.stock !== null && reward.stock <= 10 && (
            <View style={[styles.needMoreContainer, { marginTop: 8 }]}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={[styles.needMoreText, { color: '#EF4444' }]}>
                Only {reward.stock} left in stock!
              </Text>
            </View>
          )}
        </View>

        {/* Your Points */}
        <View style={styles.sectionHeader}>
          <Ionicons name="wallet-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Your Balance</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceLeft}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Points</Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>{userPoints.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceRight}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>After Redemption</Text>
              <Text style={[styles.balanceValue, { color: canRedeem ? PRIMARY_COLOR : colors.textSecondary }]}>
                {canRedeem ? (userPoints - reward.pointsCost).toLocaleString() : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* About This Reward */}
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>About This Reward</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.aboutText, { color: colors.text }]}>{reward.description}</Text>
          {reward.value && (
            <Text style={[styles.aboutText, { color: colors.text, marginTop: 8 }]}>
              Value: {reward.type === 'discount' || reward.type === 'cashback' 
                ? `₦${reward.value.toLocaleString()}` 
                : `${reward.value}%`}
            </Text>
          )}
        </View>

        {/* Reward Details */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Details</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Valid For</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{validFor}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reward Type</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{rewardService.getRewardTypeDisplay(reward.type)}</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Points Required</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{reward.pointsCost.toLocaleString()}</Text>
          </View>
          {reward.requiredTier && (
            <>
              <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Required Tier</Text>
                <Text style={[styles.detailValue, { color: rewardService.getTierColor(reward.requiredTier) }]}>
                  {reward.requiredTier}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Terms & Conditions */}
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
        </View>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {terms.map((term, index) => (
            <View key={index} style={styles.termRow}>
              <View style={[styles.termBullet, { backgroundColor: PRIMARY_COLOR }]} />
              <Text style={[styles.termText, { color: colors.text }]}>{term}</Text>
            </View>
          ))}
        </View>

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: cardBg, borderColor: isDark ? 'transparent' : '#E5E7EB' }]}>
          <View style={[styles.infoIconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="information-circle" size={18} color={PRIMARY_COLOR} />
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Once redeemed, rewards cannot be returned or exchanged for points.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity
          style={[
            styles.redeemButton,
            { backgroundColor: canRedeem ? PRIMARY_COLOR : (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6') },
          ]}
          onPress={handleRedeem}
          disabled={isRedeeming}
          activeOpacity={0.8}
        >
          {isRedeeming ? (
            <Text style={[styles.redeemButtonText, { color: '#FFFFFF' }]}>Redeeming...</Text>
          ) : (
            <>
              <Ionicons name={canRedeem ? 'gift' : 'lock-closed'} size={20} color={canRedeem ? '#FFFFFF' : colors.textSecondary} />
              <Text style={[styles.redeemButtonText, { color: canRedeem ? '#FFFFFF' : colors.textSecondary }]}>
                {canRedeem ? `Redeem for ${reward.pointsCost.toLocaleString()} Points` : `Need ${pointsNeeded.toLocaleString()} More Points`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  heroDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: FONTS.regular,
  },
  pointsCostContainer: {
    marginBottom: 8,
  },
  pointsCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  pointsCostText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  needMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  needMoreText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONTS.medium,
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
  balanceRow: {
    flexDirection: 'row',
    padding: 16,
  },
  balanceLeft: {
    flex: 1,
  },
  balanceRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    padding: 16,
    fontFamily: FONTS.regular,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 44,
  },
  detailLabel: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  separator: {
    height: 1,
    marginLeft: 16,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  termBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  termText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
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
