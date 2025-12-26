import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Modal,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';
import referralService, { Referral } from '../../services/referralService';
import { formatCurrency } from '../../utils/formatters';

const STATUS: Record<string, { color: string; label: string }> = {
  completed: { color: '#34C759', label: 'Completed' },
  joined: { color: '#007AFF', label: 'Joined' },
  pending: { color: '#FF9500', label: 'Pending' },
  expired: { color: '#8E8E93', label: 'Expired' },
};

export default function InviteScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [code, setCode] = useState('');
  const [totalEarned, setTotalEarned] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<Referral | null>(null);

  const bg = isDark ? colors.background : '#F2F2F7';
  const cardBg = isDark ? colors.card : '#FFFFFF';

  const loadData = useCallback(async () => {
    try {
      const [codeData, history] = await Promise.all([
        referralService.getReferralCode(),
        referralService.getHistory(),
      ]);
      
      // If no code returned, try to generate one
      if (!codeData?.code) {
        try {
          const generatedCode = await referralService.generateReferralCode();
          setCode(generatedCode?.code || '');
        } catch (genError) {
          console.error('Failed to generate referral code:', genError);
          setCode('');
        }
      } else {
        setCode(codeData.code);
      }
      
      setTotalEarned(codeData?.totalEarned ?? 0);
      // Ensure history is always an array
      setReferrals(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Failed to load referral data:', error);
      // Try to generate code on error
      try {
        const generatedCode = await referralService.generateReferralCode();
        setCode(generatedCode?.code || '');
      } catch (genError) {
        console.error('Failed to generate referral code:', genError);
        setCode('');
      }
      setTotalEarned(0);
      setReferrals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCopy = () => {
    Clipboard.setString(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({ 
        message: `Join Handwork! Use my referral code ${code} and get ₦500 off your first order. https://handwork.app/invite/${code}` 
      });
    } catch {}
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: bg }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Invite Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 16, paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16A34A" />
        }
      >
        {/* Balance Card - Wallet Style */}
        <View style={[styles.balanceCard, { backgroundColor: cardBg }]}>
          <View style={styles.balanceIconContainer}>
            <MaterialCommunityIcons name="gift-outline" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Total Earned</Text>
            <Text style={[styles.balanceAmount, { color: colors.text }]}>{formatCurrency(totalEarned)}</Text>
          </View>
          <View style={styles.balanceDecoration}>
            <View style={[styles.decorationCircle, styles.decorationCircle1]} />
            <View style={[styles.decorationCircle, styles.decorationCircle2]} />
          </View>
        </View>

        {/* Referral Code Section */}
        <View style={styles.transactionSectionHeader}>
          <Text style={[styles.transactionSectionTitle, { color: colors.textSecondary }]}>YOUR REFERRAL CODE</Text>
        </View>
        <View style={[styles.codeCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.code, { color: colors.text }]}>{code}</Text>
          <Text style={[styles.codeHint, { color: colors.textSecondary }]}>Share this code with friends</Text>
        </View>
        <View style={styles.codeButtons}>
          <TouchableOpacity style={[styles.copyBtn, { backgroundColor: cardBg }]} onPress={handleCopy} activeOpacity={0.8}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color="#5856D6" />
            <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Referrals Section */}
        <View style={styles.transactionSectionHeader}>
          <Text style={[styles.transactionSectionTitle, { color: colors.textSecondary }]}>REFERRALS</Text>
          <Text style={styles.seeAllText}>{(referrals || []).length} total</Text>
        </View>

        <View style={[styles.transactionsCard, { backgroundColor: cardBg }]}>
          {!referrals || referrals.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}>
                <MaterialCommunityIcons name="account-group-outline" size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No referrals yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Share your code to start earning</Text>
            </View>
          ) : (
            referrals.map((r, index) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.transactionItem, index < referrals.length - 1 && styles.transactionItemBorder, index < referrals.length - 1 && { borderBottomColor: isDark ? 'rgba(60, 60, 67, 0.18)' : 'rgba(60, 60, 67, 0.12)' }]}
                onPress={() => setSelected(r)}
              >
                <View style={[styles.txIconBg, { backgroundColor: STATUS[r.status]?.color + '15' || '#8E8E9315' }]}>
                  <Text style={[styles.txInitials, { color: STATUS[r.status]?.color || '#8E8E93' }]}>
                    {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txTitle, { color: colors.text }]}>{r.name}</Text>
                  <Text style={[styles.txDate, { color: colors.textSecondary }]}>{formatDate(r.invitedDate)}</Text>
                </View>
                <View style={styles.txAmountContainer}>
                  <Text style={[styles.txStatus, { color: STATUS[r.status]?.color || '#8E8E93' }]}>
                    {STATUS[r.status]?.label || r.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: cardBg }]}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={20} color="#16A34A" />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>How it works</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Share your code → Friend signs up → Both get ₦500 when they order
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Details</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {selected && (
              <>
                <View style={styles.modalProfile}>
                  <View style={[styles.modalAvatar, { backgroundColor: STATUS[selected.status]?.color + '15' || '#8E8E9315' }]}>
                    <Text style={[styles.modalAvatarText, { color: STATUS[selected.status]?.color || '#8E8E93' }]}>
                      {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <Text style={[styles.modalName, { color: colors.text }]}>{selected.name}</Text>
                  <View style={[styles.modalBadge, { backgroundColor: STATUS[selected.status]?.color + '15' || '#8E8E9315' }]}>
                    <Text style={[styles.modalBadgeText, { color: STATUS[selected.status]?.color || '#8E8E93' }]}>
                      {STATUS[selected.status]?.label || selected.status}
                    </Text>
                  </View>
                </View>
                <View style={[styles.modalDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]} />
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Invited</Text>
                  <Text style={[styles.modalValue, { color: colors.text }]}>{formatDate(selected.invitedDate)}</Text>
                </View>
                {selected.joinedDate && (
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Joined</Text>
                    <Text style={[styles.modalValue, { color: colors.text }]}>{formatDate(selected.joinedDate)}</Text>
                  </View>
                )}
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Reward</Text>
                  <Text style={[styles.modalValue, { color: selected.rewardAmount ? '#34C759' : colors.text }]}>
                    {selected.rewardAmount ? `+₦${selected.rewardAmount}` : '₦500 pending'}
                  </Text>
                </View>
                {selected.status === 'pending' && (
                  <TouchableOpacity style={styles.modalBtn} onPress={handleShare}>
                    <Text style={styles.modalBtnText}>Send Reminder</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: FONTS.semiBold,
  },
  
  // Balance Card
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceInfo: { zIndex: 1 },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: FONTS.regular,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  balanceDecoration: { position: 'absolute', top: -20, right: -20 },
  decorationCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#16A34A',
    opacity: 0.08,
  },
  decorationCircle1: { width: 120, height: 120, top: 0, right: 0 },
  decorationCircle2: { width: 80, height: 80, top: 60, right: 60, opacity: 0.05 },
  
  // Section Headers
  transactionSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  transactionSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    fontFamily: FONTS.semiBold,
  },
  
  // Code Card
  codeCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  code: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: FONTS.bold,
  },
  codeHint: {
    fontSize: 13,
    marginTop: 8,
    fontFamily: FONTS.regular,
  },
  codeButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 12,
    marginBottom: 20,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  copyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5856D6',
    fontFamily: FONTS.semiBold,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  
  // Transactions Card
  transactionsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  txIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInitials: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  txInfo: { flex: 1, marginLeft: 12 },
  txTitle: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  txDate: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  txAmountContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txStatus: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  
  // Empty State
  emptyState: { alignItems: 'center', padding: 32 },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalProfile: { alignItems: 'center', marginBottom: 20 },
  modalAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  modalAvatarText: { fontSize: 22, fontWeight: '600' },
  modalName: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  modalBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  modalBadgeText: { fontSize: 13, fontWeight: '600' },
  modalDivider: { height: 1, marginVertical: 16 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  modalLabel: { fontSize: 15 },
  modalValue: { fontSize: 15, fontWeight: '500' },
  modalBtn: { backgroundColor: '#16A34A', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
