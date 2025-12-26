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
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    queryFn: async () => {
      const result = await orderService.getOrders({ page: 1, limit: 50 });
      console.log('[FarmerOrdersScreen] API Response:', JSON.stringify(result, null, 2));
      return result;
    },
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

  // De-duplicate orders by id to prevent key conflicts
  const rawOrders = (data?.orders || []).filter((o: any) => o != null && o.id != null);
  const orders = useMemo(() => {
    const seen = new Set<string>();
    return rawOrders.filter((order: any) => {
      if (seen.has(order.id)) return false;
      seen.add(order.id);
      return true;
    });
  }, [rawOrders]);

  // Filter orders with search, date, and status
  const filteredOrders = useMemo(() => {
    return orders.filter((order: Order) => {
      if (!order || !order.id) return false;
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

  // Generate packing slip HTML - Enhanced Professional Design
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
    const printDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Calculate totals
    const subtotal = (order.items || []).reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const totalItems = (order.items || []).reduce((sum, item) => sum + Number(item.quantity), 0);

    const itemsHTML = (order.items || []).map((item, index) => `
      <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#fafafa'};">
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8e8e8; font-size: 14px;">
          <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 2px;">${item.title || item.productName || 'Item'}</div>
          <div style="font-size: 12px; color: #666;">${item.category || 'General'}</div>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8e8e8; text-align: center; font-weight: 600; font-size: 15px; color: #1a1a1a;">
          ${item.quantity} <span style="font-weight: 400; color: #666; font-size: 12px;">${item.unit || 'pcs'}</span>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8e8e8; text-align: right; font-weight: 600; font-size: 14px; color: #1a1a1a;">
          ₦${(Number(item.price) * Number(item.quantity)).toLocaleString()}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8e8e8; text-align: center;">
          <div style="width: 24px; height: 24px; border: 2px solid #34C759; border-radius: 6px; margin: 0 auto;"></div>
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Packing Slip - Order #${order.orderNumber || order.id?.slice(-8)}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
</head>
<body style="padding: 0; color: #1a1a1a; background: #f5f5f5;">
  <div style="max-width: 800px; margin: 0 auto; background: #ffffff; box-shadow: 0 2px 20px rgba(0,0,0,0.1);">
    
    <!-- Header with Gradient -->
    <div style="background: linear-gradient(135deg, #34C759 0%, #28a745 50%, #20803c 100%); padding: 30px; position: relative; overflow: hidden;">
      <!-- Decorative circles -->
      <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.1); border-radius: 60px;"></div>
      <div style="position: absolute; bottom: -40px; left: 100px; width: 80px; height: 80px; background: rgba(255,255,255,0.08); border-radius: 40px;"></div>
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <!-- App Logo -->
              <div style="width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-right: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden;">
                <svg width="56" height="56" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#34D399"/>
                      <stop offset="100%" style="stop-color:#059669"/>
                    </linearGradient>
                  </defs>
                  <rect width="512" height="512" rx="96" fill="url(#grad1)"/>
                  <path d="M152,140 L152,372" stroke="#FFFFFF" stroke-width="48" stroke-linecap="round" fill="none"/>
                  <path d="M360,140 L360,372" stroke="#FFFFFF" stroke-width="48" stroke-linecap="round" fill="none"/>
                  <path d="M152,256 C180,220 220,200 256,180 C292,200 332,220 360,256 C332,280 292,300 256,320 C220,300 180,280 152,256 Z" fill="#FFFFFF"/>
                  <path d="M152,256 L360,256" stroke="#059669" stroke-width="5" fill="none" stroke-linecap="round"/>
                  <path d="M200,256 Q220,230 256,200" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
                  <path d="M200,256 Q220,280 256,310" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
                  <path d="M310,256 Q290,230 256,200" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
                  <path d="M310,256 Q290,280 256,310" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>
                </svg>
              </div>
              <div>
                <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; margin-bottom: 6px;">
                  <span style="font-size: 10px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">PACKING SLIP</span>
                </div>
                <h1 style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 0 0 2px 0;">Handwork</h1>
                <p style="font-size: 13px; color: rgba(255,255,255,0.9); margin: 0;">Fresh Farm Produce • Direct to You</p>
              </div>
            </div>
          </td>
          <td style="text-align: right; vertical-align: top;">
            <div style="background: rgba(255,255,255,0.95); padding: 16px 20px; border-radius: 12px; display: inline-block; text-align: left;">
              <p style="font-size: 11px; color: #666; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</p>
              <p style="font-size: 20px; font-weight: 700; color: #34C759; margin: 0;">#${order.orderNumber || order.id?.slice(-8)}</p>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Order Info Bar -->
    <div style="background: #f8f9fa; padding: 16px 30px; border-bottom: 1px solid #e8e8e8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: 13px;">
            <span style="color: #666;">Order Date:</span>
            <span style="font-weight: 600; color: #1a1a1a; margin-left: 6px;">${formattedDate} at ${formattedTime}</span>
          </td>
          <td style="text-align: center; font-size: 13px;">
            <span style="color: #666;">Status:</span>
            <span style="font-weight: 600; color: #34C759; margin-left: 6px; text-transform: uppercase;">${order.status?.replace(/_/g, ' ') || 'Processing'}</span>
          </td>
          <td style="text-align: right; font-size: 13px;">
            <span style="color: #666;">Total Items:</span>
            <span style="font-weight: 600; color: #1a1a1a; margin-left: 6px;">${totalItems}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Customer & Delivery Info -->
    <div style="padding: 24px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" style="vertical-align: top; padding-right: 20px;">
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border-left: 4px solid #34C759;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 36px; height: 36px; background: #34C759; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                  <span style="font-size: 16px;">👤</span>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</span>
              </div>
              <p style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0;">${order.buyerName || 'Customer'}</p>
              <p style="font-size: 14px; color: #666; margin: 0 0 4px 0;">📱 ${order.buyerPhone || 'N/A'}</p>
              ${order.buyerEmail ? `<p style="font-size: 14px; color: #666; margin: 0;">✉️ ${order.buyerEmail}</p>` : ''}
            </div>
          </td>
          <td width="50%" style="vertical-align: top; padding-left: 20px;">
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border-left: 4px solid #007AFF;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <div style="width: 36px; height: 36px; background: #007AFF; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px;">
                  <span style="font-size: 16px;">📍</span>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Delivery Address</span>
              </div>
              <p style="font-size: 14px; color: #1a1a1a; margin: 0 0 4px 0; line-height: 1.5;">${order.deliveryAddress?.address || 'N/A'}</p>
              <p style="font-size: 14px; color: #666; margin: 0;">${order.deliveryAddress?.city || ''}${order.deliveryAddress?.city && order.deliveryAddress?.state ? ', ' : ''}${order.deliveryAddress?.state || ''}</p>
              ${order.deliveryAddress?.landmark ? `<p style="font-size: 13px; color: #888; margin: 8px 0 0 0; font-style: italic;">📌 Landmark: ${order.deliveryAddress.landmark}</p>` : ''}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <div style="padding: 0 30px 24px 30px;">
      <div style="background: #f8f9fa; border-radius: 12px; overflow: hidden; border: 1px solid #e8e8e8;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 16px 20px;">
          <span style="font-size: 13px; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">📦 Items to Pack</span>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr style="background: #f0f0f0;">
            <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e8e8e8;">Product</th>
            <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e8e8e8;">Qty</th>
            <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e8e8e8;">Price</th>
            <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e8e8e8; width: 60px;">✓</th>
          </tr>
          ${itemsHTML}
        </table>
        
        <!-- Totals -->
        <div style="background: #f8f9fa; padding: 16px 20px; border-top: 2px solid #e8e8e8;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align: right; padding: 4px 0;">
                <span style="font-size: 14px; color: #666;">Subtotal:</span>
                <span style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-left: 20px; min-width: 100px; display: inline-block;">₦${subtotal.toLocaleString()}</span>
              </td>
            </tr>
            ${order.deliveryFee ? `
            <tr>
              <td style="text-align: right; padding: 4px 0;">
                <span style="font-size: 14px; color: #666;">Delivery Fee:</span>
                <span style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-left: 20px; min-width: 100px; display: inline-block;">₦${Number(order.deliveryFee).toLocaleString()}</span>
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="text-align: right; padding: 8px 0 0 0; border-top: 1px dashed #ccc; margin-top: 8px;">
                <span style="font-size: 16px; font-weight: 700; color: #1a1a1a;">Total:</span>
                <span style="font-size: 20px; font-weight: 700; color: #34C759; margin-left: 20px; min-width: 100px; display: inline-block;">₦${Number(order.total || subtotal).toLocaleString()}</span>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <!-- Special Instructions -->
    ${order.notes ? `
    <div style="padding: 0 30px 24px 30px;">
      <div style="background: #FFF9E6; border-radius: 12px; padding: 16px 20px; border-left: 4px solid #FF9500;">
        <p style="font-size: 12px; font-weight: 600; color: #996600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">📝 Special Instructions</p>
        <p style="font-size: 14px; color: #664400; margin: 0; line-height: 1.5;">${order.notes}</p>
      </div>
    </div>
    ` : ''}

    <!-- Signature Section -->
    <div style="padding: 0 30px 30px 30px;">
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; border: 1px dashed #ccc;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" style="padding-right: 20px;">
              <p style="font-size: 12px; color: #666; margin: 0 0 8px 0; font-weight: 600;">Packed by:</p>
              <div style="border-bottom: 1px solid #999; height: 30px; margin-bottom: 4px;"></div>
              <p style="font-size: 11px; color: #999; margin: 0;">Name & Signature</p>
            </td>
            <td width="25%" style="padding: 0 10px;">
              <p style="font-size: 12px; color: #666; margin: 0 0 8px 0; font-weight: 600;">Date:</p>
              <div style="border-bottom: 1px solid #999; height: 30px; margin-bottom: 4px;"></div>
              <p style="font-size: 11px; color: #999; margin: 0;">DD/MM/YYYY</p>
            </td>
            <td width="25%" style="padding-left: 10px;">
              <p style="font-size: 12px; color: #666; margin: 0 0 8px 0; font-weight: 600;">Time:</p>
              <div style="border-bottom: 1px solid #999; height: 30px; margin-bottom: 4px;"></div>
              <p style="font-size: 11px; color: #999; margin: 0;">HH:MM</p>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #1a1a1a; padding: 24px 30px; text-align: center;">
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
        <div style="width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px; overflow: hidden;">
          <svg width="36" height="36" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#34D399"/>
                <stop offset="100%" style="stop-color:#059669"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="96" fill="url(#grad2)"/>
            <path d="M152,140 L152,372" stroke="#FFFFFF" stroke-width="48" stroke-linecap="round" fill="none"/>
            <path d="M360,140 L360,372" stroke="#FFFFFF" stroke-width="48" stroke-linecap="round" fill="none"/>
            <path d="M152,256 C180,220 220,200 256,180 C292,200 332,220 360,256 C332,280 292,300 256,320 C220,300 180,280 152,256 Z" fill="#FFFFFF"/>
            <path d="M152,256 L360,256" stroke="#059669" stroke-width="5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
        <span style="font-size: 16px; font-weight: 700; color: #ffffff;">Handwork</span>
      </div>
      <p style="font-size: 12px; color: #888; margin: 0 0 4px 0;">Thank you for choosing Handwork! 🌱</p>
      <p style="font-size: 11px; color: #666; margin: 0;">Fresh Farm Produce • Direct to You</p>
      <p style="font-size: 10px; color: #555; margin: 8px 0 0 0;">Printed on ${printDate}</p>
    </div>

  </div>
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

  // Get status gradient colors for media card
  const getStatusGradient = (status: OrderStatus): [string, string, string] => {
    switch (status) {
      case 'pending': return ['#FF9500', '#F5A623', '#FF6B00'];
      case 'confirmed':
      case 'preparing': return ['#007AFF', '#5856D6', '#4A90D9'];
      case 'ready_for_pickup': return ['#34C759', '#30D158', '#28A745'];
      case 'delivered': return ['#34C759', '#30D158', '#28A745'];
      case 'cancelled': return ['#FF3B30', '#FF453A', '#DC3545'];
      default: return ['#8E8E93', '#636366', '#8E8E93'];
    }
  };

  // Get status icon
  const getStatusIcon = (status: OrderStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'pending': return 'time';
      case 'confirmed': return 'checkmark-circle';
      case 'preparing': return 'restaurant';
      case 'ready_for_pickup': return 'bag-check';
      case 'delivered': return 'checkmark-done-circle';
      case 'cancelled': return 'close-circle';
      default: return 'ellipsis-horizontal';
    }
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    if (!item || !item.id) return null;
    
    const actions = getOrderActions(item);
    const statusStyle = getStatusColor(item.status);
    const statusGradient = getStatusGradient(item.status);
    const statusIcon = getStatusIcon(item.status);
    const isSelected = selectedOrders.includes(item.id);
    const firstItemImage = item.items?.[0]?.image || item.items?.[0]?.productImage;
    
    return (
      <TouchableOpacity
        style={[
          styles.orderMediaCard,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
          isSelected && styles.orderMediaCardSelected,
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
        activeOpacity={0.7}
      >
        {/* Status Header with Gradient */}
        <LinearGradient
          colors={statusGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orderMediaHeader}
        >
          {/* Decorative circles */}
          <View style={[styles.orderDecorCircle, { top: -15, right: -15, opacity: 0.15 }]} />
          <View style={[styles.orderDecorCircle, { bottom: -20, left: 30, width: 50, height: 50, opacity: 0.1 }]} />
          
          {/* Selection checkbox overlay */}
          {selectionMode && (
            <TouchableOpacity
              style={styles.mediaOrderCheckbox}
              onPress={() => toggleOrderSelection(item.id)}
            >
              <View style={[
                styles.mediaOrderCheckboxCircle,
                isSelected && styles.mediaOrderCheckboxSelected,
              ]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          )}
          
          <View style={styles.orderMediaHeaderContent}>
            <View style={styles.orderMediaHeaderLeft}>
              <View style={styles.orderMediaBadge}>
                <Ionicons name={statusIcon} size={12} color="#FFFFFF" />
                <Text style={styles.orderMediaBadgeText}>{(getStatusLabel(item.status) || item.status || 'Unknown').toUpperCase()}</Text>
              </View>
              <View style={styles.orderMediaOrderInfo}>
                <Text style={styles.orderMediaOrderNumber}>#{item.orderNumber || item.id.slice(-6)}</Text>
                <Text style={styles.orderMediaDate}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>
            {/* Print button in header */}
            {!selectionMode && (
              <TouchableOpacity 
                style={styles.orderMediaHeaderPrintBtn}
                onPress={() => handlePrintPackingSlip(item)}
              >
                <Ionicons name="print-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.orderMediaTotalContainer}>
              <Text style={styles.orderMediaTotalLabel}>Total</Text>
              <Text style={styles.orderMediaTotalValue}>{formatCurrency(Number(item.total || 0))}</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* Content Section */}
        <View style={styles.orderMediaContent}>
          {/* Buyer Info Row */}
          {item.buyerName && (
            <View style={styles.orderMediaBuyerRow}>
              <View style={[styles.orderMediaBuyerAvatar, { backgroundColor: isDark ? '#3A3A3C' : '#E8F5E9' }]}>
                <Ionicons name="person" size={14} color="#34C759" />
              </View>
              <View style={styles.orderMediaBuyerInfo}>
                <Text style={[styles.orderMediaBuyerName, { color: colors.text }]} numberOfLines={1}>
                  {item.buyerName}
                </Text>
                {item.buyerPhone && (
                  <Text style={[styles.orderMediaBuyerPhone, { color: colors.textSecondary }]}>
                    {item.buyerPhone}
                  </Text>
                )}
              </View>
            </View>
          )}
          
          {/* Items Preview */}
          <View style={[styles.orderMediaItemsSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FA' }]}>
            <View style={styles.orderMediaItemsHeader}>
              <Ionicons name="cube-outline" size={16} color={statusStyle.color} />
              <Text style={[styles.orderMediaItemsCount, { color: colors.text }]}>
                {item.items.length} item{item.items.length > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.orderMediaItemsList}>
              {item.items.slice(0, 3).map((orderItem: any, idx: number) => (
                <View key={idx} style={styles.orderMediaItemRow}>
                  <View style={[styles.orderMediaItemDot, { backgroundColor: statusStyle.color }]} />
                  <Text style={[styles.orderMediaItemText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {orderItem.quantity}× {orderItem.title || orderItem.productName || 'Item'}
                  </Text>
                </View>
              ))}
              {item.items.length > 3 && (
                <Text style={[styles.orderMediaMoreItems, { color: colors.textSecondary }]}>
                  +{item.items.length - 3} more items
                </Text>
              )}
            </View>
          </View>
          
          {/* Action Buttons */}
          {actions.length > 0 && !selectionMode && (
            <View style={styles.orderMediaActions}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.status}
                  style={[
                    styles.orderMediaActionBtn,
                    action.variant === 'primary' 
                      ? { backgroundColor: '#34C759' }
                      : { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' },
                  ]}
                  onPress={() => handleUpdateStatus(item, action.status)}
                  disabled={updateStatusMutation.isPending}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={action.variant === 'primary' ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color={action.variant === 'primary' ? '#FFFFFF' : '#FF3B30'} 
                  />
                  <Text style={[
                    styles.orderMediaActionText,
                    action.variant === 'primary' 
                      ? { color: '#FFFFFF' }
                      : { color: colors.text },
                  ]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* View Details Arrow */}
          {!selectionMode && (
            <View style={styles.orderMediaViewDetails}>
              <Text style={[styles.orderMediaViewDetailsText, { color: '#007AFF' }]}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </View>
          )}
        </View>
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
        keyExtractor={(item, index) => item?.id || `order-${index}`}
        renderItem={renderOrder}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.ordersGrid,
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
  // Orders Grid Layout
  ordersGrid: {
    paddingHorizontal: SPACING.md,
  },
  ordersRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  // Enhanced Media Card Styles for Orders
  orderMediaCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: SPACING.md,
  },
  orderMediaCardSelected: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  orderMediaHeader: {
    padding: SPACING.sm,
    paddingTop: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  orderDecorCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  mediaOrderCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  mediaOrderCheckboxCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaOrderCheckboxSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  orderMediaHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMediaHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  orderMediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  orderMediaBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  orderMediaOrderInfo: {
    flex: 1,
  },
  orderMediaOrderNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  orderMediaDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  orderMediaHeaderPrintBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderMediaTotalContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  orderMediaTotalLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  orderMediaTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  orderMediaContent: {
    padding: SPACING.sm,
  },
  orderMediaBuyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderMediaBuyerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  orderMediaBuyerInfo: {
    flex: 1,
  },
  orderMediaBuyerName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  orderMediaBuyerPhone: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  orderMediaPrintBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderMediaItemsSection: {
    borderRadius: 10,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  orderMediaItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  orderMediaItemsCount: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  orderMediaItemsList: {
    gap: 4,
  },
  orderMediaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderMediaItemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  orderMediaItemText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  orderMediaMoreItems: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    fontStyle: 'italic',
    marginTop: 2,
  },
  orderMediaActions: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  orderMediaActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  orderMediaActionText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  orderMediaViewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60,60,67,0.1)',
  },
  orderMediaViewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
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
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxCircleSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  orderContentWithCheckbox: {
    flex: 1,
  },
  orderContentFull: {
    flex: 1,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    marginBottom: StyleSheet.hairlineWidth,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  orderCardFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  orderCardLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: SPACING.lg,
  },
  orderCardSelected: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
  },
  orderIdTextContainer: {
    flex: 1,
  },
  orderIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 0,
  },
  printRow: {
    marginBottom: SPACING.xs,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  printButtonText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: '#007AFF',
  },
  buyerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  buyerAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerName: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  orderId: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  orderDivider: {
    height: 1,
    marginVertical: SPACING.sm,
    borderRadius: 0.5,
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderItemsContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  orderItems: {
    flex: 1,
    marginRight: SPACING.md,
  },
  itemsCount: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  itemsList: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  orderTotalContainer: {
    alignItems: 'flex-end',
  },
  orderTotalLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonPrimary: {
    backgroundColor: '#34C759',
  },
  actionButtonSecondary: {
    backgroundColor: '#F2F2F7',
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
    marginTop: -9,
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
