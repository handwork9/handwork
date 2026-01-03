import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/apiClient';
import { FONTS, SPACING } from '../../constants/theme';
import { LoadingSpinner } from '../../components/common';

const { width } = Dimensions.get('window');

interface FlashSaleDetail {
  id: string;
  title: string;
  product: {
    id: string;
    title: string;
    images: string[];
    price: number;
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
  createdAt: string;
}

type RouteParams = {
  FarmerFlashSaleDetail: { saleId: string };
};

export default function FarmerFlashSaleDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'FarmerFlashSaleDetail'>>();
  const queryClient = useQueryClient();
  
  const { saleId } = route.params;
  
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const { data: flashSale, isLoading, refetch } = useQuery({
    queryKey: ['farmerFlashSale', saleId],
    queryFn: async () => {
      const response = await apiClient.get(`/flash-sales/${saleId}`);
      return (response as any).data as FlashSaleDetail;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch(`/flash-sales/${saleId}/cancel`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Flash sale cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['farmerFlashSale', saleId] });
      queryClient.invalidateQueries({ queryKey: ['farmerFlashSales'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to cancel flash sale');
    },
  });

  const endEarlyMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch(`/flash-sales/${saleId}/end`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Flash sale ended successfully');
      queryClient.invalidateQueries({ queryKey: ['farmerFlashSale', saleId] });
      queryClient.invalidateQueries({ queryKey: ['farmerFlashSales'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to end flash sale');
    },
  });

  // Countdown timer
  useEffect(() => {
    if (!flashSale) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(flashSale.endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [flashSale]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Flash Sale',
      'Are you sure you want to cancel this flash sale? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    );
  };

  const handleEndEarly = () => {
    Alert.alert(
      'End Flash Sale Early',
      'Are you sure you want to end this flash sale now? Buyers will no longer be able to purchase at the sale price.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, End Now', onPress: () => endEarlyMutation.mutate() },
      ]
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: '#10B981', bg: '#10B98120', label: 'Active', icon: 'flash' };
      case 'scheduled':
        return { color: '#3B82F6', bg: '#3B82F620', label: 'Scheduled', icon: 'time' };
      case 'ended':
        return { color: '#6B7280', bg: '#6B728020', label: 'Ended', icon: 'checkmark-circle' };
      case 'cancelled':
        return { color: '#EF4444', bg: '#EF444420', label: 'Cancelled', icon: 'close-circle' };
      default:
        return { color: '#6B7280', bg: '#6B728020', label: status, icon: 'help-circle' };
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Flash Sale Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  if (!flashSale) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Flash Sale Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Flash sale not found</Text>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(flashSale.status);
  const progress = flashSale.totalQuantity > 0 
    ? (flashSale.soldQuantity / flashSale.totalQuantity) * 100 
    : 0;
  const revenue = flashSale.soldQuantity * flashSale.salePrice;
  const remaining = flashSale.totalQuantity - flashSale.soldQuantity;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Flash Sale Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon as any} size={20} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          {flashSale.status === 'active' && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>
                {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s left
              </Text>
            </View>
          )}
        </View>

        {/* Product Card */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF', marginHorizontal: SPACING.md }]}>
          <View style={styles.productRow}>
            <Image
              source={{ uri: flashSale.product?.images?.[0] || 'https://via.placeholder.com/80' }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
                {flashSale.product?.title || flashSale.title}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.salePrice}>₦{flashSale.salePrice?.toLocaleString()}</Text>
                <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                  ₦{flashSale.originalPrice?.toLocaleString()}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{flashSale.discountPercent}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { marginHorizontal: SPACING.md }]}>
          <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Ionicons name="eye-outline" size={24} color="#3B82F6" />
            <Text style={[styles.statValue, { color: colors.text }]}>{flashSale.views || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Views</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Ionicons name="cart-outline" size={24} color="#10B981" />
            <Text style={[styles.statValue, { color: colors.text }]}>{flashSale.soldQuantity}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sold</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Ionicons name="cube-outline" size={24} color="#F59E0B" />
            <Text style={[styles.statValue, { color: colors.text }]}>{remaining}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Left</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Ionicons name="cash-outline" size={24} color="#8B5CF6" />
            <Text style={[styles.statValue, { color: colors.text }]}>₦{revenue.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Revenue</Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF', marginHorizontal: SPACING.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sales Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={progress > 80 ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                {flashSale.soldQuantity} of {flashSale.totalQuantity} sold
              </Text>
              <Text style={[styles.progressPercent, { color: progress > 80 ? '#EF4444' : '#10B981' }]}>
                {progress.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Sale Details */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFF', marginHorizontal: SPACING.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sale Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Start Time</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(flashSale.startTime).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>End Time</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(flashSale.endTime).toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Featured</Text>
            <View style={styles.featuredBadge}>
              <Ionicons 
                name={flashSale.isFeatured ? 'star' : 'star-outline'} 
                size={16} 
                color={flashSale.isFeatured ? '#F59E0B' : colors.textSecondary} 
              />
              <Text style={[styles.featuredText, { color: flashSale.isFeatured ? '#F59E0B' : colors.textSecondary }]}>
                {flashSale.isFeatured ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(flashSale.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {(flashSale.status === 'active' || flashSale.status === 'scheduled') && (
          <View style={[styles.actionsCard, { marginHorizontal: SPACING.md }]}>
            {flashSale.status === 'active' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.endButton]}
                onPress={handleEndEarly}
              >
                <Ionicons name="stop-circle-outline" size={20} color="#F59E0B" />
                <Text style={[styles.actionButtonText, { color: '#F59E0B' }]}>End Sale Early</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel Sale</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View/Edit Product Button */}
        <TouchableOpacity
          style={[styles.viewProductButton, { backgroundColor: isDark ? colors.card : '#FFF', marginHorizontal: SPACING.md }]}
          onPress={() => navigation.navigate('EditProduct', { productId: flashSale.product?.id })}
        >
          <Ionicons name="create-outline" size={20} color={colors.text} />
          <Text style={[styles.viewProductText, { color: colors.text }]}>Edit Product</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: SPACING.md,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  countdownBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#10B981',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salePrice: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#EF4444',
  },
  originalPrice: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#92400E',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 32 - 36) / 4,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 12,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  progressPercent: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  actionsCard: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  endButton: {
    backgroundColor: '#FEF3C720',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  cancelButton: {
    backgroundColor: '#FEE2E220',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  viewProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  viewProductText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
});
