import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  TextInput,
  ScrollView,
  Share,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { LoadingState } from '../../components/common';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, FarmerStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import { useAppSelector, useAppDispatch } from '../../store';
import { useFarmerOrders, useFarmerSocket } from '../../hooks/useFarmerSocket';
import { updateOrderStatus as updateOrderStatusAction, clearOrderNotification } from '../../store/slices/farmerSlice';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;

type FilterTab = 'all' | 'pending' | 'confirmed' | 'ready' | 'completed';
type DateFilter = 'all' | 'today' | 'week' | 'month';

const DATE_FILTERS = [
  { key: 'all' as DateFilter, label: 'All Time' },
  { key: 'today' as DateFilter, label: 'Today' },
  { key: 'week' as DateFilter, label: 'This Week' },
  { key: 'month' as DateFilter, label: 'This Month' },
];

export default function FarmerOrdersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  // Use socket for real-time updates
  const { isConnected, newOrderNotifications, markAsRead } = useFarmerSocket();
  const { orders: reduxOrders, pendingCount } = useFarmerOrders();
  
  // Mark notifications as read when viewing orders
  useEffect(() => {
    if (newOrderNotifications.length > 0) {
      markAsRead();
    }
  }, [newOrderNotifications.length, markAsRead]);
  
  // Check if this is the stack screen (FarmerOrders) vs tab screen (Orders)
  const isStackScreen = route.name === 'FarmerOrders';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: () => orderService.getOrders({ page: 1, limit: 50 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-orders'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update order status');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    // Redux will also be updated via the socket
    setRefreshing(false);
  }, [refetch]);

  const handleUpdateStatus = (order: Order, newStatus: OrderStatus) => {
    const statusLabels: Record<OrderStatus, string> = {
      pending: 'Pending',
      created: 'Processing',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready_for_pickup: 'Ready for Pickup',
      rider_assigned: 'Rider Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    Alert.alert(
      'Update Order Status',
      `Change order #${order.id.slice(-6)} to "${statusLabels[newStatus]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            updateStatusMutation.mutate({ orderId: order.id, status: newStatus });
            // Also update Redux store
            dispatch(updateOrderStatusAction({ orderId: order.id, status: newStatus }));
          },
        },
      ]
    );
  };

  const orders = data?.orders || [];

  // Filter orders with search, date, and status
  const filteredOrders = useMemo(() => {
    return orders.filter((order: Order) => {
      // Status filter
      let statusMatch = true;
      switch (activeTab) {
        case 'pending':
          statusMatch = order.status === 'pending';
          break;
        case 'confirmed':
          statusMatch = order.status === 'confirmed' || order.status === 'preparing';
          break;
        case 'ready':
          statusMatch = order.status === 'ready_for_pickup';
          break;
        case 'completed':
          statusMatch = ['delivered', 'cancelled'].includes(order.status);
          break;
      }
      if (!statusMatch) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const orderNumber = (order.orderNumber || order.id || '').toLowerCase();
        const buyerName = (order.buyerName || '').toLowerCase();
        const buyerPhone = (order.buyerPhone || '').toLowerCase();
        if (!orderNumber.includes(query) && !buyerName.includes(query) && !buyerPhone.includes(query)) {
          return false;
        }
      }

      // Date filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        switch (dateFilter) {
          case 'today':
            if (orderDate < startOfDay) return false;
            break;
          case 'week':
            if (orderDate < startOfWeek) return false;
            break;
          case 'month':
            if (orderDate < startOfMonth) return false;
            break;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchQuery, dateFilter]);

  const tabs: { key: FilterTab; label: string; count: number; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'all', label: 'All', count: orders.length, icon: 'list-outline' },
    { key: 'pending', label: 'Pending', count: orders.filter((o: Order) => o.status === 'pending').length, icon: 'time-outline' },
    { key: 'confirmed', label: 'Processing', count: orders.filter((o: Order) => ['confirmed', 'preparing'].includes(o.status)).length, icon: 'restaurant-outline' },
    { key: 'ready', label: 'Ready', count: orders.filter((o: Order) => o.status === 'ready_for_pickup').length, icon: 'checkmark-circle-outline' },
    { key: 'completed', label: 'Completed', count: orders.filter((o: Order) => ['delivered', 'cancelled'].includes(o.status)).length, icon: 'checkmark-done-outline' },
  ];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return { color: '#FF9500', bg: '#FFF3E0' };
      case 'confirmed':
      case 'preparing': return { color: '#007AFF', bg: '#E3F2FD' };
      case 'ready_for_pickup': return { color: '#34C759', bg: '#E8F5E9' };
      case 'delivered': return { color: '#34C759', bg: '#E8F5E9' };
      case 'cancelled': return { color: '#FF3B30', bg: '#FFEBEE' };
      default: return { color: '#8E8E93', bg: '#F2F2F7' };
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: 'Pending',
      created: 'Processing',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready_for_pickup: 'Ready',
      rider_assigned: 'Rider Assigned',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getOrderActions = (order: Order) => {
    const actions: { label: string; status: OrderStatus; variant: 'primary' | 'secondary' }[] = [];

    switch (order.status) {
      case 'pending':
        actions.push({ label: 'Confirm Order', status: 'confirmed', variant: 'primary' });
        actions.push({ label: 'Cancel', status: 'cancelled', variant: 'secondary' });
        break;
      case 'confirmed':
        actions.push({ label: 'Start Preparing', status: 'preparing', variant: 'primary' });
        break;
      case 'preparing':
        actions.push({ label: 'Mark Ready', status: 'ready_for_pickup', variant: 'primary' });
        break;
      default:
        break;
    }

    return actions;
  };

  // Toggle order selection for bulk actions
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = (newStatus: OrderStatus) => {
    const statusLabel = getStatusLabel(newStatus);
    Alert.alert(
      'Bulk Status Update',
      `Update ${selectedOrders.length} orders to "${statusLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            for (const orderId of selectedOrders) {
              updateStatusMutation.mutate({ orderId, status: newStatus });
              dispatch(updateOrderStatusAction({ orderId, status: newStatus }));
            }
            setSelectedOrders([]);
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  // Generate packing slip HTML
  const generatePackingSlipHTML = (order: Order) => {
    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = orderDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsHTML = (order.items || []).map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title || item.productName || 'Item'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit || 'pcs'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          <input type="checkbox" style="width: 20px; height: 20px;">
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Packing Slip</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 20px; border-bottom: 2px solid #4CAF50;">
        <h1 style="margin: 0; font-size: 24px; color: #4CAF50;">PACKING SLIP</h1>
        <p style="margin: 5px 0 0 0; color: #666;">Handwork - Fresh Farm Produce</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="vertical-align: top;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666;">ORDER DETAILS</h3>
              <p style="margin: 0;"><b>Order #:</b> ${order.orderNumber || order.id?.slice(-8)}</p>
              <p style="margin: 5px 0;"><b>Date:</b> ${formattedDate}</p>
              <p style="margin: 5px 0;"><b>Time:</b> ${formattedTime}</p>
            </td>
            <td width="50%" style="vertical-align: top;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666;">DELIVER TO</h3>
              <p style="margin: 0;"><b>${order.buyerName || 'Customer'}</b></p>
              <p style="margin: 5px 0;">${order.deliveryAddress?.address || 'N/A'}</p>
              <p style="margin: 5px 0;">${order.deliveryAddress?.city || ''}${order.deliveryAddress?.city && order.deliveryAddress?.state ? ', ' : ''}${order.deliveryAddress?.state || ''}</p>
              <p style="margin: 5px 0;">${order.buyerPhone || ''}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 20px 20px 20px;">
        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #666;">ITEMS TO PACK</h3>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #eee;">
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; font-size: 12px;">ITEM</th>
            <th style="padding: 10px; text-align: center; font-size: 12px;">QTY</th>
            <th style="padding: 10px; text-align: center; font-size: 12px;">PACKED</th>
          </tr>
          ${itemsHTML}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; border-top: 1px dashed #ddd;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%">
              <p style="margin: 0; font-size: 12px; color: #666;">Packed by: _________________</p>
            </td>
            <td width="50%">
              <p style="margin: 0; font-size: 12px; color: #666; text-align: right;">Date: _________________</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  // Print packing slip
  const handlePrintPackingSlip = async (order: Order) => {
    try {
      const html = generatePackingSlipHTML(order);
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Error', 'Failed to print packing slip');
    }
  };

  // Export orders to CSV
  const handleExportOrders = async () => {
    const ordersToExport = selectedOrders.length > 0 
      ? filteredOrders.filter((o: Order) => selectedOrders.includes(o.id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      Alert.alert('No Orders', 'No orders to export');
      return;
    }

    const csvHeader = 'Order #,Date,Buyer,Items,Total,Status\n';
    const csvRows = ordersToExport.map((order: Order) => {
      const date = new Date(order.createdAt).toLocaleDateString();
      const buyer = order.buyerName || 'N/A';
      const items = (order.items || []).map(i => `${i.quantity}x ${i.title || i.productName}`).join('; ');
      const total = Number(order.total || 0).toLocaleString();
      const status = getStatusLabel(order.status);
      return `"${order.orderNumber || order.id?.slice(-8)}","${date}","${buyer}","${items}","NGN ${total}","${status}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    try {
      await Share.share({
        message: csv,
        title: 'Orders Export',
      });
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'Failed to export orders');
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || dateFilter !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    const actions = getOrderActions(item);
    const statusStyle = getStatusColor(item.status);
    const isFirst = index === 0;
    const isLast = index === filteredOrders.length - 1;
    const isSelected = selectedOrders.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.orderCard,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
          isFirst && styles.orderCardFirst,
          isLast && styles.orderCardLast,
          isSelected && { borderColor: '#34C759', borderWidth: 2 },
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleOrderSelection(item.id);
          } else {
            navigation.navigate('FarmerOrderDetail', { orderId: item.id });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            setSelectedOrders([item.id]);
          }
        }}
        activeOpacity={0.6}
      >
        {selectionMode && (
          <View style={styles.selectionCheckbox}>
            <Ionicons 
              name={isSelected ? 'checkbox' : 'square-outline'} 
              size={24} 
              color={isSelected ? '#34C759' : colors.textSecondary} 
            />
          </View>
        )}
        
        <View style={selectionMode ? styles.orderContentWithCheckbox : undefined}>
          <View style={styles.orderHeader}>
            <View style={styles.orderIdRow}>
              <Text style={[styles.orderId, { color: colors.text }]}>
                #{item.orderNumber || item.id.slice(-6)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.color }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            <View style={styles.orderHeaderRight}>
              <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                {formatDate(item.createdAt)}
              </Text>
              {!selectionMode && (
                <TouchableOpacity 
                  style={styles.printButton}
                  onPress={() => handlePrintPackingSlip(item)}
                >
                  <Ionicons name="print-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {item.buyerName && (
            <Text style={[styles.buyerName, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.buyerName}
            </Text>
          )}

          <View style={[styles.orderDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60,60,67,0.12)' }]} />

          <View style={styles.orderBody}>
            <View style={styles.orderItems}>
              <Text style={[styles.itemsCount, { color: colors.text }]}>
                {item.items.length} item{item.items.length > 1 ? 's' : ''}
              </Text>
              <Text style={[styles.itemsList, { color: colors.textSecondary }]} numberOfLines={1}>
                {(item.items || []).map((i: any) => `${i.quantity}x ${i.title || i.productName || 'Item'}`).join(', ')}
              </Text>
            </View>
            <Text style={[styles.orderTotal, { color: colors.text }]}>
              {formatCurrency(Number(item.total || 0))}
            </Text>
          </View>

          {actions.length > 0 && !selectionMode && (
            <>
              <View style={[styles.orderDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60,60,67,0.12)' }]} />
              <View style={styles.actionsRow}>
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.status}
                    style={[
                      styles.actionButton,
                      action.variant === 'primary' 
                        ? { backgroundColor: '#34C759' }
                        : { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' },
                    ]}
                    onPress={() => handleUpdateStatus(item, action.status)}
                    disabled={updateStatusMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.actionButtonText,
                      action.variant === 'secondary' && { color: colors.textSecondary },
                    ]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {!selectionMode && (
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchSortContainer}>
        <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search order #, buyer name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={activeTab !== 'all' ? '#34C759' : '#007AFF'} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            hasActiveFilters && styles.filterToggleActive,
            { backgroundColor: isDark ? colors.card : '#FFFFFF' },
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={dateFilter !== 'all' ? '#34C759' : '#007AFF'} 
          />
        </TouchableOpacity>
      </View>

      {/* Date Filters */}
      {showFilters && (
        <View style={styles.dateFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DATE_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.dateFilterPill,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF' },
                  dateFilter === filter.key && styles.dateFilterPillActive,
                ]}
                onPress={() => setDateFilter(filter.key)}
              >
                <Text style={[
                  styles.dateFilterText,
                  { color: dateFilter === filter.key ? '#FFFFFF' : colors.textSecondary },
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results Count */}
      {(hasActiveFilters || searchQuery) && (
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
        </Text>
      )}

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {orders.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>
            {orders.filter((o: Order) => o.status === 'pending').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.statValue, { color: '#007AFF' }]}>
            {orders.filter((o: Order) => ['confirmed', 'preparing'].includes(o.status)).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Processing</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>
            {orders.filter((o: Order) => o.status === 'ready_for_pickup').length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ready</Text>
        </View>
      </View>

      {/* Section Title */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {activeTab === 'all' ? 'ALL ORDERS' : activeTab.toUpperCase()}
      </Text>
    </>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        {isStackScreen && !selectionMode && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[styles.backButton, { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        {selectionMode && (
          <TouchableOpacity 
            onPress={() => {
              setSelectionMode(false);
              setSelectedOrders([]);
            }} 
            style={[styles.backButton, { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {selectionMode ? `${selectedOrders.length} Selected` : 'Orders'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {!selectionMode ? (
            <>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
                onPress={() => setSelectionMode(true)}
              >
                <Ionicons name="checkbox-outline" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
                onPress={handleExportOrders}
              >
                <Ionicons name="download-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF' }]}
              onPress={() => {
                if (selectedOrders.length === filteredOrders.length) {
                  setSelectedOrders([]);
                } else {
                  setSelectedOrders(filteredOrders.map((o: Order) => o.id));
                }
              }}
            >
              <Ionicons 
                name={selectedOrders.length === filteredOrders.length ? 'checkbox' : 'checkbox-outline'} 
                size={20} 
                color={colors.text} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bulk Actions Bar */}
      {selectionMode && selectedOrders.length > 0 && (
        <View style={[styles.bulkActionsBar, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bulkActionsContent}>
            <TouchableOpacity 
              style={[styles.bulkActionButton, { backgroundColor: '#34C759' }]}
              onPress={() => handleBulkStatusUpdate('confirmed')}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.bulkActionText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkActionButton, { backgroundColor: '#007AFF' }]}
              onPress={() => handleBulkStatusUpdate('preparing')}
            >
              <Ionicons name="restaurant" size={16} color="#FFFFFF" />
              <Text style={styles.bulkActionText}>Prepare</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkActionButton, { backgroundColor: '#FF9500' }]}
              onPress={() => handleBulkStatusUpdate('ready_for_pickup')}
            >
              <Ionicons name="bag-check" size={16} color="#FFFFFF" />
              <Text style={styles.bulkActionText}>Ready</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkActionButton, { backgroundColor: '#FF3B30' }]}
              onPress={() => handleBulkStatusUpdate('cancelled')}
            >
              <Ionicons name="close-circle" size={16} color="#FFFFFF" />
              <Text style={styles.bulkActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.bulkActionButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
              onPress={handleExportOrders}
            >
              <Ionicons name="download-outline" size={16} color={colors.text} />
              <Text style={[styles.bulkActionText, { color: colors.text }]}>Export</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + (selectionMode ? 160 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}>
              <Ionicons name="clipboard-outline" size={48} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {hasActiveFilters ? 'No matching orders' : 'No orders found'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : activeTab === 'all'
                ? "You don't have any orders yet"
                : `No ${activeTab} orders at the moment`
              }
            </Text>
          </View>
        }
      />

      {/* Filter Modal - Bottom Sheet */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.modalOption,
                  activeTab === tab.key && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setActiveTab(tab.key);
                  setShowFilterModal(false);
                }}
              >
                <View style={[
                  styles.modalOptionIcon,
                  { backgroundColor: activeTab === tab.key ? '#34C75920' : isDark ? '#3A3A3C' : '#F2F2F7' }
                ]}>
                  <Ionicons 
                    name={tab.icon} 
                    size={20} 
                    color={activeTab === tab.key ? '#34C759' : colors.textSecondary} 
                  />
                </View>
                <Text style={[
                  styles.modalOptionText,
                  { color: activeTab === tab.key ? '#34C759' : colors.text },
                ]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[
                    styles.modalBadge,
                    activeTab === tab.key && styles.modalBadgeActive,
                  ]}>
                    <Text style={[
                      styles.modalBadgeText,
                      activeTab === tab.key && styles.modalBadgeTextActive,
                    ]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
                {activeTab === tab.key && (
                  <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholder: {
    width: 36,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  searchSortContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterToggle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(60,60,67,0.1)',
  },
  filterToggleActive: {
    backgroundColor: '#34C759',
  },
  dateFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  dateFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: SPACING.xs,
  },
  dateFilterPillActive: {
    backgroundColor: '#34C759',
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
  },
  subtitleContainer: {
    paddingBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 16,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: 12,
  },
  modalOptionActive: {
    backgroundColor: '#E8F5E9',
  },
  modalOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  modalBadge: {
    backgroundColor: 'rgba(60,60,67,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  modalBadgeActive: {
    backgroundColor: '#34C75930',
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalBadgeTextActive: {
    color: '#34C759',
  },
  bulkActionsBar: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.12)',
  },
  bulkActionsContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  bulkActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectionCheckbox: {
    marginRight: SPACING.sm,
  },
  orderContentWithCheckbox: {
    flex: 1,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  orderCardFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  orderCardLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: SPACING.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  printButton: {
    padding: 4,
  },
  buyerName: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  orderId: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  orderDate: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  orderDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: SPACING.sm,
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItems: {
    flex: 1,
    marginRight: SPACING.md,
  },
  itemsCount: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  itemsList: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  chevronContainer: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    marginHorizontal: 0,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
