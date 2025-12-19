import React, { useMemo, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuyerStackParamList, Order } from '../../types';
import { LoadingSpinner, EmptyState, Button } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { orderService } from '../../services/orderService';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import { useAppDispatch, useAppSelector } from '../../store';
import { useBuyerSocket, useOrderStatusUpdates } from '../../hooks/useBuyerSocket';
import { setOrders } from '../../store/slices/buyerSlice';

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const DATE_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'delivered':
      return { bg: '#E8F5E9', color: '#2E7D32', label: 'Delivered', icon: 'checkmark-circle' };
    case 'cancelled':
      return { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled', icon: 'close-circle' };
    case 'in_transit':
      return { bg: '#E3F2FD', color: '#1565C0', label: 'On the Way', icon: 'bicycle' };
    case 'picked_up':
      return { bg: '#FFF3E0', color: '#E65100', label: 'Picked Up', icon: 'cube' };
    case 'rider_assigned':
      return { bg: '#F3E5F5', color: '#7B1FA2', label: 'Rider Assigned', icon: 'person' };
    case 'preparing':
      return { bg: '#FFF8E1', color: '#FF8F00', label: 'Preparing', icon: 'restaurant' };
    case 'confirmed':
      return { bg: '#E5F1FF', color: '#007AFF', label: 'Confirmed', icon: 'checkmark' };
    default:
      return { bg: '#F5F5F5', color: '#757575', label: 'Processing', icon: 'time' };
  }
};

export default function OrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Initialize buyer socket for real-time updates
  const { isConnected, activeOrderIds } = useBuyerSocket();
  const { orders: reduxOrders } = useAppSelector(state => state.buyer);
  
  // Listen for order status updates to auto-refresh list
  useOrderStatusUpdates((update) => {
    console.log('Order status updated:', update.orderId, update.status);
    // Refetch to get latest data
    refetch();
  });

  const {
    data: ordersData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getUserOrders(),
    staleTime: 60 * 1000,
  });
  
  // Sync orders to Redux
  useEffect(() => {
    const ordersList = ordersData?.data?.data || [];
    if (ordersList.length > 0) {
      dispatch(setOrders({ orders: ordersList, total: ordersList.length }));
    }
  }, [ordersData, dispatch]);

  // Use Redux orders if available (they have real-time updates)
  const allOrders = reduxOrders.length > 0 ? reduxOrders : (ordersData?.data?.data || []);

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    let result = [...allOrders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((order: Order) => {
        const orderNumber = (order.orderNumber || order.id || '').toLowerCase();
        const farmerName = (order.farmerName || '').toLowerCase();
        const itemNames = (order.items || []).map(item => 
          (item.title || item.productName || '').toLowerCase()
        ).join(' ');
        
        return orderNumber.includes(query) || 
               farmerName.includes(query) || 
               itemNames.includes(query);
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter((o: Order) => !['delivered', 'cancelled'].includes(o.status));
      } else {
        result = result.filter((o: Order) => o.status === statusFilter);
      }
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      result = result.filter((order: Order) => {
        const orderDate = new Date(order.createdAt);
        switch (dateFilter) {
          case 'today':
            return orderDate >= startOfToday;
          case 'week':
            return orderDate >= startOfWeek;
          case 'month':
            return orderDate >= startOfMonth;
          default:
            return true;
        }
      });
    }

    return result;
  }, [allOrders, searchQuery, statusFilter, dateFilter]);

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderTracking', { orderId: order.id });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderOrderItem = ({ item, index }: { item: Order; index: number }) => {
    const statusConfig = getStatusConfig(item.status);
    const isLast = index === filteredOrders.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.orderItem,
          !isLast && styles.orderItemBorder,
          { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }
        ]}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.orderIconContainer, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon as any} size={20} color={statusConfig.color} />
        </View>
        <View style={styles.orderContent}>
          <View style={styles.orderHeader}>
            <Text style={[styles.orderNumber, { color: colors.text }]}>
              #{item.orderNumber || item.id?.slice(-8)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>
          <Text style={[styles.orderItems, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''} • {formatCurrency(Number(item.total || 0))}
          </Text>
          <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading orders..." />;
  }

  // Group filtered orders by status for display
  const activeOrders = filteredOrders.filter((o: Order) => 
    !['delivered', 'cancelled'].includes(o.status)
  );
  const pastOrders = filteredOrders.filter((o: Order) => 
    ['delivered', 'cancelled'].includes(o.status)
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Your Orders</Text>
          <TouchableOpacity 
            style={[styles.filterToggle, { backgroundColor: showFilters || hasActiveFilters ? colors.primary : (isDark ? colors.surface : '#F5F5F5') }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons 
              name="options-outline" 
              size={20} 
              color={showFilters || hasActiveFilters ? '#fff' : colors.text} 
            />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {(statusFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.surface : '#FFFFFF' }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search orders, products, farmers..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            {/* Status Filters */}
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {STATUS_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterPill,
                    { 
                      backgroundColor: statusFilter === filter.id 
                        ? colors.primary 
                        : (isDark ? colors.surface : '#F5F5F5'),
                    }
                  ]}
                  onPress={() => setStatusFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterPillText,
                    { color: statusFilter === filter.id ? '#fff' : colors.text }
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Date Filters */}
            <Text style={[styles.filterLabel, { color: colors.textSecondary, marginTop: 12 }]}>Time Period</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {DATE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterPill,
                    { 
                      backgroundColor: dateFilter === filter.id 
                        ? colors.primary 
                        : (isDark ? colors.surface : '#F5F5F5'),
                    }
                  ]}
                  onPress={() => setDateFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterPillText,
                    { color: dateFilter === filter.id ? '#fff' : colors.text }
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Ionicons name="close" size={16} color={colors.primary} />
                <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Results Count */}
      {hasActiveFilters && filteredOrders.length > 0 && (
        <View style={styles.resultsCountContainer}>
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      <FlatList
        data={[]}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={
          allOrders.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="cube-outline" size={64} color={colors.textSecondary} />}
              title="No orders yet"
              description="When you place an order, it will appear here."
              action={
                <Button
                  title="Start Shopping"
                  onPress={() => navigation.navigate('BuyerTabs' as any)}
                />
              }
            />
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="search-outline" size={64} color={colors.textSecondary} />}
              title="No orders found"
              description="Try adjusting your search or filters."
              action={
                <Button
                  title="Clear Filters"
                  variant="outline"
                  onPress={clearFilters}
                />
              }
            />
          ) : (
            <View>
              {/* Active Orders Section */}
              {activeOrders.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACTIVE ORDERS</Text>
                  <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                    {activeOrders.map((order: Order, index: number) => (
                      <View key={order.id}>
                        {renderOrderItem({ item: order, index })}
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Past Orders Section */}
              {pastOrders.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAST ORDERS</Text>
                  <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                    {pastOrders.map((order: Order, index: number) => (
                      <View key={order.id}>
                        {renderOrderItem({ item: order, index: index === pastOrders.length - 1 ? pastOrders.length - 1 : index })}
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fixedHeaderTitle: {
    fontSize: 34,
    fontFamily: FONTS.bold,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
  },
  filtersContainer: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  resultsCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 100,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 32,
    marginTop: 16,
  },
  insetCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  orderItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  orderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderContent: {
    flex: 1,
    marginLeft: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  orderItems: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});
