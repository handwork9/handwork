import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

type FilterType = 'all' | 'pending' | 'joined' | 'completed';

const REFERRALS = [
  { id: '1', name: 'Adebayo Johnson', status: 'completed', date: 'Dec 5', reward: 500 },
  { id: '2', name: 'Chinwe Okafor', status: 'completed', date: 'Dec 3', reward: 500 },
  { id: '3', name: 'Ibrahim Musa', status: 'joined', date: 'Dec 10', reward: 0 },
  { id: '4', name: 'Funke Williams', status: 'joined', date: 'Dec 9', reward: 0 },
  { id: '5', name: 'Emeka Nwosu', status: 'pending', date: 'Dec 11', reward: 0 },
];

const STATUS: Record<string, { color: string; label: string }> = {
  completed: { color: '#34C759', label: 'Completed' },
  joined: { color: '#007AFF', label: 'Joined' },
  pending: { color: '#FF9500', label: 'Pending' },
};

export default function InviteHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? REFERRALS : REFERRALS.filter(r => r.status === filter);
  const bg = isDark ? colors.background : '#F2F2F7';
  const cardBg = isDark ? colors.card : '#FFF';
  const sep = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Referral History</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {(['all', 'pending', 'joined', 'completed'] as FilterType[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, { color: isDark ? colors.textSecondary : '#666' }, filter === f && styles.chipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        <View style={[styles.list, { backgroundColor: cardBg }]}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No referrals</Text>
            </View>
          ) : (
            filtered.map((r, i) => (
              <View key={r.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => (navigation as any).navigate('InviteDetail', { referral: r })}
                >
                  <View style={[styles.avatar, { backgroundColor: STATUS[r.status].color + '20' }]}>
                    <Text style={[styles.avatarText, { color: STATUS[r.status].color }]}>
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: colors.text }]}>{r.name}</Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>{r.date}</Text>
                  </View>
                  <View style={styles.right}>
                    <Text style={[styles.status, { color: STATUS[r.status].color }]}>{STATUS[r.status].label}</Text>
                    {r.reward > 0 && <Text style={styles.reward}>+₦{r.reward}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                {i < filtered.length - 1 && <View style={[styles.sep, { backgroundColor: sep }]} />}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16 },
  filters: { marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', marginRight: 8 },
  chipActive: { backgroundColor: '#34C759' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#FFF', fontWeight: '500' },
  list: { borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: '600' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500' },
  date: { fontSize: 13, marginTop: 2 },
  right: { alignItems: 'flex-end', marginRight: 8 },
  status: { fontSize: 13, fontWeight: '500' },
  reward: { fontSize: 12, color: '#34C759', marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { marginTop: 8, fontSize: 15 },
});
