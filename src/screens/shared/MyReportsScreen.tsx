import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supportService, SupportReport } from '../../services/supportService';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7', icon: 'time-outline' },
  reviewed: { label: 'Under Review', color: '#3b82f6', bg: '#dbeafe', icon: 'eye-outline' },
  resolved: { label: 'Resolved', color: '#10b981', bg: '#d1fae5', icon: 'checkmark-circle-outline' },
  dismissed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6', icon: 'close-circle-outline' },
};

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  inappropriate_behavior: { label: 'Inappropriate Behavior', icon: '⚠️' },
  technical_problem: { label: 'Technical Problem', icon: '🔧' },
  spam: { label: 'Spam', icon: '🚫' },
  other: { label: 'Other', icon: '📋' },
};

export default function MyReportsScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const [reports, setReports] = useState<SupportReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<SupportReport | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const response = await supportService.getMyReports();
      setReports(response.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const filteredReports = reports.filter((report) => {
    if (filter === 'pending') {
      return ['pending', 'reviewed'].includes(report.status);
    }
    if (filter === 'resolved') {
      return ['resolved', 'dismissed'].includes(report.status);
    }
    return true;
  });

  const handleReportPress = (report: SupportReport) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  const renderReportCard = ({ item }: { item: SupportReport }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => handleReportPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.typeIcon}>{typeConfig.icon}</Text>
            <Text style={[styles.typeText, { color: colors.text }]}>
              {typeConfig.label}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {item.ticket && (
          <View style={[styles.ticketInfo, { borderTopColor: colors.border }]}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.ticketText, { color: colors.textSecondary }]}>
              Ticket: {item.ticket.ticketNumber}
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

  const renderFilterButton = (value: 'all' | 'pending' | 'resolved', label: string) => (
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

  const renderDetailModal = () => {
    if (!selectedReport) return null;
    const statusConfig = STATUS_CONFIG[selectedReport.status] || STATUS_CONFIG.pending;
    const typeConfig = TYPE_CONFIG[selectedReport.type] || TYPE_CONFIG.other;

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Report Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Status Badge */}
            <View style={[styles.detailStatusContainer, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon} size={24} color={statusConfig.color} />
              <Text style={[styles.detailStatusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>

            {/* Type */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Report Type</Text>
              <View style={styles.detailValueRow}>
                <Text style={styles.detailIcon}>{typeConfig.icon}</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{typeConfig.label}</Text>
              </View>
            </View>

            {/* Description */}
            {selectedReport.description && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Your Report</Text>
                <Text style={[styles.detailDescription, { color: colors.text, backgroundColor: colors.surface }]}>
                  {selectedReport.description}
                </Text>
              </View>
            )}

            {/* Related Ticket */}
            {selectedReport.ticket && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Related Ticket</Text>
                <View style={[styles.ticketCard, { backgroundColor: colors.surface }]}>
                  <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                  <View style={styles.ticketCardContent}>
                    <Text style={[styles.ticketNumber, { color: colors.text }]}>
                      {selectedReport.ticket.ticketNumber}
                    </Text>
                    <Text style={[styles.ticketSubject, { color: colors.textSecondary }]}>
                      {selectedReport.ticket.subject}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Admin Response */}
            {selectedReport.adminNotes && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Support Response</Text>
                <View style={[styles.responseCard, { backgroundColor: '#e6f4ff', borderColor: '#91d5ff' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1890ff" style={styles.responseIcon} />
                  <Text style={[styles.responseText, { color: '#1890ff' }]}>
                    {selectedReport.adminNotes}
                  </Text>
                </View>
              </View>
            )}

            {/* Reviewer Info */}
            {selectedReport.reviewer && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reviewed By</Text>
                <View style={styles.detailValueRow}>
                  <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedReport.reviewer.name}
                  </Text>
                </View>
                {selectedReport.reviewedAt && (
                  <Text style={[styles.reviewedDate, { color: colors.textSecondary }]}>
                    on {formatDate(selectedReport.reviewedAt)}
                  </Text>
                )}
              </View>
            )}

            {/* Submitted Date */}
            <View style={styles.detailSection}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Submitted</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(selectedReport.createdAt)}
              </Text>
            </View>

            {/* Pending Notice */}
            {selectedReport.status === 'pending' && (
              <View style={[styles.noticeCard, { backgroundColor: '#fffbe6', borderColor: '#ffe58f' }]}>
                <Ionicons name="information-circle-outline" size={20} color="#faad14" />
                <Text style={[styles.noticeText, { color: '#d48806' }]}>
                  Your report is being reviewed by our support team. You'll receive a notification when there's an update.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your reports...
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1a365d' : '#ebf8ff' }]}>
        <Ionicons name="information-circle" size={20} color={isDark ? '#63b3ed' : '#3182ce'} />
        <Text style={[styles.infoBannerText, { color: isDark ? '#90cdf4' : '#2b6cb0' }]}>
          Track the status of your submitted reports and view responses from our support team.
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', `All (${reports.length})`)}
        {renderFilterButton('pending', 'In Progress')}
        {renderFilterButton('resolved', 'Completed')}
      </View>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="flag-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Reports Found
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {filter === 'all'
              ? "You haven't submitted any reports yet."
              : filter === 'pending'
              ? 'No reports currently in progress.'
              : 'No completed reports.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={renderReportCard}
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

      {/* Detail Modal */}
      {renderDetailModal()}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    fontSize: 18,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
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
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  ticketText: {
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
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  detailStatusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 18,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 22,
    padding: 12,
    borderRadius: 8,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  ticketCardContent: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  ticketSubject: {
    fontSize: 13,
    marginTop: 2,
  },
  responseCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  responseIcon: {
    marginBottom: 8,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  reviewedDate: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 24,
  },
  noticeCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
