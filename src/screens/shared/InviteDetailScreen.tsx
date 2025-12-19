import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const STATUS: Record<string, { color: string; label: string; desc: string }> = {
  completed: { color: '#34C759', label: 'Completed', desc: 'Reward credited to your wallet' },
  joined: { color: '#007AFF', label: 'Joined', desc: 'Waiting for first order' },
  pending: { color: '#FF9500', label: 'Pending', desc: 'Waiting to sign up' },
};

export default function InviteDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const r = (route.params as any)?.referral || { id: '1', name: 'Adebayo Johnson', status: 'joined', date: 'Dec 5', reward: 0 };
  const status = STATUS[r.status] || STATUS.pending;

  const bg = isDark ? colors.background : '#F2F2F7';
  const cardBg = isDark ? colors.card : '#FFF';
  const sep = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleShare = async () => {
    try {
      await Share.share({ message: `Hey! Join Handwork and get ₦500 off. Download: https://handwork.app` });
    } catch {}
  };

  const steps = ['Invited', 'Signed Up', 'First Order', 'Reward'];
  const currentStep = r.status === 'completed' ? 4 : r.status === 'joined' ? 2 : 1;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Details</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={[styles.avatar, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.avatarText, { color: status.color }]}>
              {r.name.split(' ').map((n: string) => n[0]).join('')}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{r.name}</Text>
          <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{status.desc}</Text>
        </View>

        {/* Progress */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Progress</Text>
        <View style={[styles.list, { backgroundColor: cardBg }]}>
          {steps.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <View key={step}>
                <View style={styles.row}>
                  <View style={[styles.dot, done && { backgroundColor: '#34C759' }, active && { backgroundColor: status.color }]}>
                    {done && <Ionicons name="checkmark" size={12} color="#FFF" />}
                  </View>
                  <Text style={[styles.stepText, { color: done || active ? colors.text : colors.textSecondary }]}>{step}</Text>
                </View>
                {i < steps.length - 1 && <View style={[styles.line, done && { backgroundColor: '#34C759' }]} />}
              </View>
            );
          })}
        </View>

        {/* Details */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Details</Text>
        <View style={[styles.list, { backgroundColor: cardBg }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Invited</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{r.date}</Text>
          </View>
          <View style={[styles.sep, { backgroundColor: sep }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reward</Text>
            <Text style={[styles.detailValue, { color: r.reward ? '#34C759' : colors.text }]}>
              {r.reward ? `+₦${r.reward}` : '₦500 pending'}
            </Text>
          </View>
        </View>

        {r.status === 'pending' && (
          <TouchableOpacity style={styles.btn} onPress={handleShare}>
            <Text style={styles.btnText}>Send Reminder</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16 },
  card: { borderRadius: 10, padding: 24, alignItems: 'center', marginBottom: 24 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: '600' },
  name: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  desc: { fontSize: 14 },
  label: { fontSize: 13, marginBottom: 6, marginLeft: 4, textTransform: 'uppercase' },
  list: { borderRadius: 10, marginBottom: 24, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  line: { width: 2, height: 20, backgroundColor: '#E5E5E5', marginLeft: 9, marginVertical: 4 },
  stepText: { fontSize: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 15 },
  detailValue: { fontSize: 15, fontWeight: '500' },
  sep: { height: StyleSheet.hairlineWidth },
  btn: { backgroundColor: '#34C759', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
