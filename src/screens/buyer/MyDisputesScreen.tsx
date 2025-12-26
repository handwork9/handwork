import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { disputeService } from '../../services/disputeService';

// Simple date formatter
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  return date.toLocaleDateString('en-US', options);
};

interface Dispute {
  id: string;
  disputeNumber: string;
  orderId: string;
  type: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    total: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  open: { label: 'Open', color: '#f59e0b', bg: '#fef3c7', icon: 'alert-circle' },
  under_review: { label: 'Under Review', color: '#3b82f6', bg: '#dbeafe', icon: 'eye' },
  awaiting_response: { label: 'Awaiting Response', color: '#8b5cf6', bg: '#ede9fe', icon: 'time' },
  resolved: { label: 'Resolved', color: '#10b981', bg: '#d1fae5', icon: 'checkmark-circle' },
  closed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6', icon: 'close-circle' },
  escalated: { label: 'Escalated', color: '#ef4444', bg: '#fee2e2', icon: 'warning' },
};

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  product_quality: { label: 'Product Quality', icon: '🥬' },
  missing_items: { label: 'Missing Items', icon: '📦' },
  wrong_items: { label: 'Wrong Items', icon: '🔄' },
  late_delivery: { label: 'Late Delivery', icon: '⏰' },
  damaged_products: { label: 'Damaged Products', icon: '💔' },
  refund_request: { label: 'Refund Request', icon: '💰' },
  overcharge: { label: 'Overcharge', icon: '💳' },
  rider_issue: { label: 'Rider Issue', icon: '🚴' },
  farmer_issue: { label: 'Farmer Issue', icon: '👨‍🌾' },
  other: { label: 'Other', icon: '❓' },
};

export default function MyDisputesScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const fetchDisputes = useCallback(async () => {
    try {
      const response = await disputeService.getMyDisputes();
      if (response.success && Array.isArray(response.data)) {
        setDisputes(response.data);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDisputes();
    }, [fetchDisputes])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDisputes();
  };

  const filteredDisputes = disputes.filter((dispute) => {
    if (filter === 'active') {
      return ['open', 'under_review', 'awaiting_response', 'escalated'].includes(dispute.status);
    }
    if (filter === 'resolved') {
      return ['resolved', 'closed'].includes(dispute.status);
    }
    return true;
  });

  const handleDisputePress = (dispute: Dispute) => {
    navigation.navigate('OrderDispute', { 
      orderId: dispute.orderId,
      disputeId: dispute.id 
    });
  };

  const renderDisputeCard = ({ item }: { item: Dispute }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => handleDisputePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.disputeNumber}>
            <Text style={[styles.disputeNumberText, { color: colors.text }]}>
              #{item.disputeNumber}
            </Text>
            <Text style={styles.typeIcon}>{typeConfig.icon}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.subject, { color: colors.text }]} numberOfLines={1}>
          {item.subject}
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>

        {item.order && (
          <View style={[styles.orderInfo, { borderTopColor: colors.border }]}>
            <Ionicons name="receipt-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.orderText, { color: colors.textSecondary }]}>
              Order: {item.order.orderNumber}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDate(item.createdAt)}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (value: 'all' | 'active' | 'resolved', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && { backgroundColor: colors.primary },
        filter !== value && { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          { color: filter === value ? '#fff' : colors.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your disputes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Disputes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', `All (${disputes.length})`)}
        {renderFilterButton('active', 'Active')}
        {renderFilterButton('resolved', 'Resolved')}
      </View>

      {/* Disputes List */}
      {filteredDisputes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Disputes Found
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {filter === 'all'
              ? "You haven't filed any disputes yet."
              : filter === 'active'
              ? 'No active disputes.'
              : 'No resolved disputes.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDisputes}
          keyExtractor={(item) => item.id}
          renderItem={renderDisputeCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  disputeNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disputeNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeIcon: {
    fontSize: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  orderText: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
