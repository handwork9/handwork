import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector } from '../../store';
import apiClient from '../../services/apiClient';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants/theme';

interface FlashSale {
  id: string;
  title: string;
  product: {
    id: string;
    title: string;
    images: string[];
  };
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  totalQuantity: number;
  soldQuantity: number;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  views: number;
  isFeatured: boolean;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'active':
        return { bg: '#10B98120', text: '#10B981', label: 'Active' };
      case 'scheduled':
        return { bg: '#3B82F620', text: '#3B82F6', label: 'Scheduled' };
      case 'ended':
        return { bg: '#6B728020', text: '#6B7280', label: 'Ended' };
      case 'cancelled':
        return { bg: '#EF444420', text: '#EF4444', label: 'Cancelled' };
      default:
        return { bg: '#6B728020', text: '#6B7280', label: status };
    }
  };

  const style = getStatusStyle();

  return (
    <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
      <Text style={[styles.statusText, { color: style.text }]}>{style.label}</Text>
    </View>
  );
};

const FlashSaleItem = ({ 
  sale, 
  onPress, 
  onCancel 
}: { 
  sale: FlashSale; 
  onPress: () => void;
  onCancel: () => void;
}) => {
  const { colors, isDark } = useTheme();
  const timeRemaining = new Date(sale.endTime).getTime() - Date.now();
  const progress = sale.totalQuantity > 0 
    ? (sale.soldQuantity / sale.totalQuantity) * 100 
    : 0;

  const formatTimeRemaining = () => {
    if (timeRemaining <= 0) return 'Ended';
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <TouchableOpacity
      style={[styles.saleCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: sale.product?.images?.[0] || 'https://via.placeholder.com/60' }}
          style={styles.productImage}
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={1}>
            {sale.product?.title || sale.title}
          </Text>
          <StatusBadge status={sale.status} />
        </View>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceInfo}>
          <Text style={styles.salePriceLabel}>Sale Price</Text>
          <Text style={[styles.salePrice, { color: '#EF4444' }]}>
            ₦{sale.salePrice?.toLocaleString()}
          </Text>
          <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
            ₦{sale.originalPrice?.toLocaleString()}
          </Text>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{sale.discountPercent}%</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="cart-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {sale.soldQuantity}/{sale.totalQuantity} Sold
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {sale.views} Views
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {formatTimeRemaining()}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#E5E7EB' }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: progress > 80 ? '#EF4444' : '#10B981'
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {progress.toFixed(0)}% sold
        </Text>
      </View>

      {(sale.status === 'scheduled' || sale.status === 'active') && (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Cancel Sale</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function FlashSalesScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['farmerFlashSales', activeTab],
    queryFn: async () => {
      const params = activeTab !== 'all' ? `?status=${activeTab}` : '';
      const response = await apiClient.get(`/flash-sales/my${params}`);
      return (response as any).data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (saleId: string) => {
      await apiClient.delete(`/flash-sales/${saleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerFlashSales'] });
      Alert.alert('Success', 'Flash sale cancelled successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel flash sale');
    },
  });

  const handleCancel = useCallback((sale: FlashSale) => {
    Alert.alert(
      'Cancel Flash Sale',
      `Are you sure you want to cancel the flash sale for "${sale.product?.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => cancelMutation.mutate(sale.id)
        },
      ]
    );
  }, [cancelMutation]);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'ended', label: 'Ended' },
  ];

  const flashSales = data?.data || [];

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flash-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Flash Sales</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Create flash sales to boost your product sales with limited-time discounts
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateFlashSale')}
      >
        <Ionicons name="add" size={20} color="#FFF" />
        <Text style={styles.createButtonText}>Create Flash Sale</Text>
      </TouchableOpacity>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Flash Sales</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateFlashSale')}
        >
          <Ionicons name="add-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? '#EF4444' : colors.textSecondary }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={flashSales}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FlashSaleItem
            sale={item}
            onPress={() => navigation.navigate('FlashSaleDetail', { saleId: item.id })}
            onCancel={() => handleCancel(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
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
    flex: 1,
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  saleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceInfo: {
    flex: 1,
  },
  salePriceLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6B7280',
    marginBottom: 2,
  },
  salePrice: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  originalPrice: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#92400E',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
  },
});
