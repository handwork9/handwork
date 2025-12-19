import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';

// Types
export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  updatedAt: string;
  riderName?: string;
  riderPhone?: string;
  estimatedDelivery?: string;
}

export interface NewMessageNotification {
  conversationId: string;
  senderId: string;
  senderName: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

interface BuyerState {
  // Orders
  orders: Order[];
  ordersTotal: number;
  ordersLoading: boolean;
  activeOrderIds: string[]; // Orders that are in progress (pending, confirmed, etc.)
  
  // Order tracking
  trackingOrderId: string | null;
  riderLocation: { lat: number; lng: number } | null;
  estimatedDelivery: string | null;
  
  // Messages/Conversations
  unreadMessagesCount: number;
  newMessageNotifications: NewMessageNotification[];
  
  // Real-time
  isSocketConnected: boolean;
  orderStatusUpdates: OrderStatusUpdate[];
  
  // General
  isLoading: boolean;
  error: string | null;
}

const initialState: BuyerState = {
  orders: [],
  ordersTotal: 0,
  ordersLoading: false,
  activeOrderIds: [],
  
  trackingOrderId: null,
  riderLocation: null,
  estimatedDelivery: null,
  
  unreadMessagesCount: 0,
  newMessageNotifications: [],
  
  isSocketConnected: false,
  orderStatusUpdates: [],
  
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchBuyerOrders = createAsyncThunk(
  'buyer/fetchOrders',
  async (params: { page?: number; limit?: number; status?: OrderStatus } = {}, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrders({
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

export const fetchActiveOrders = createAsyncThunk(
  'buyer/fetchActiveOrders',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch orders that are in progress
      const response = await orderService.getOrders({
        page: 1,
        limit: 10,
      });
      // Filter for active orders
      const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'in_transit'];
      const activeOrders = response.orders.filter(order => activeStatuses.includes(order.status));
      return activeOrders;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active orders');
    }
  }
);

const buyerSlice = createSlice({
  name: 'buyer',
  initialState,
  reducers: {
    // Socket connection status
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.isSocketConnected = action.payload;
    },
    
    // Order status update from WebSocket
    updateOrderStatus: (state, action: PayloadAction<OrderStatusUpdate>) => {
      const { orderId, status, updatedAt, riderName, riderPhone, estimatedDelivery } = action.payload;
      
      // Update order in list
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.status = status;
        if (riderName) order.assignedRiderName = riderName;
        if (riderPhone) order.assignedRiderPhone = riderPhone;
      }
      
      // Add to status updates for UI notifications
      state.orderStatusUpdates.unshift(action.payload);
      if (state.orderStatusUpdates.length > 20) {
        state.orderStatusUpdates = state.orderStatusUpdates.slice(0, 20);
      }
      
      // Update active orders list
      const completedStatuses: OrderStatus[] = ['delivered', 'cancelled'];
      if (completedStatuses.includes(status)) {
        state.activeOrderIds = state.activeOrderIds.filter(id => id !== orderId);
      } else if (!state.activeOrderIds.includes(orderId)) {
        state.activeOrderIds.push(orderId);
      }
      
      // Update tracking info if this is the tracked order
      if (state.trackingOrderId === orderId && estimatedDelivery) {
        state.estimatedDelivery = estimatedDelivery;
      }
    },
    
    // Rider location update from WebSocket
    updateRiderLocation: (state, action: PayloadAction<{ orderId: string; lat: number; lng: number; eta?: string }>) => {
      if (state.trackingOrderId === action.payload.orderId) {
        state.riderLocation = { lat: action.payload.lat, lng: action.payload.lng };
        if (action.payload.eta) {
          state.estimatedDelivery = action.payload.eta;
        }
      }
    },
    
    // Set tracking order
    setTrackingOrder: (state, action: PayloadAction<string | null>) => {
      state.trackingOrderId = action.payload;
      if (!action.payload) {
        state.riderLocation = null;
        state.estimatedDelivery = null;
      }
    },
    
    // New message notification from WebSocket
    addMessageNotification: (state, action: PayloadAction<NewMessageNotification>) => {
      // Check if notification already exists for this conversation
      const existingIndex = state.newMessageNotifications.findIndex(
        n => n.conversationId === action.payload.conversationId
      );
      
      if (existingIndex !== -1) {
        // Update existing
        state.newMessageNotifications[existingIndex] = action.payload;
      } else {
        // Add new
        state.newMessageNotifications.unshift(action.payload);
      }
      
      // Update unread count
      state.unreadMessagesCount = state.newMessageNotifications.filter(n => n.unread).length;
    },
    
    // Mark conversation as read
    markConversationRead: (state, action: PayloadAction<string>) => {
      const notification = state.newMessageNotifications.find(
        n => n.conversationId === action.payload
      );
      if (notification) {
        notification.unread = false;
        state.unreadMessagesCount = state.newMessageNotifications.filter(n => n.unread).length;
      }
    },
    
    // Clear all message notifications
    clearMessageNotifications: (state) => {
      state.newMessageNotifications = [];
      state.unreadMessagesCount = 0;
    },
    
    // Set unread messages count
    setUnreadMessagesCount: (state, action: PayloadAction<number>) => {
      state.unreadMessagesCount = action.payload;
    },
    
    // Clear order status updates
    clearOrderStatusUpdates: (state) => {
      state.orderStatusUpdates = [];
    },
    
    // Clear specific order status update
    dismissOrderStatusUpdate: (state, action: PayloadAction<string>) => {
      state.orderStatusUpdates = state.orderStatusUpdates.filter(
        u => u.orderId !== action.payload
      );
    },
    
    // Set orders directly (from API)
    setOrders: (state, action: PayloadAction<{ orders: Order[]; total: number }>) => {
      state.orders = action.payload.orders;
      state.ordersTotal = action.payload.total;
      
      // Update active orders
      const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'in_transit'];
      state.activeOrderIds = action.payload.orders
        .filter(o => activeStatuses.includes(o.status))
        .map(o => o.id);
    },
    
    // Clear buyer state (on logout)
    clearBuyerState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchBuyerOrders.pending, (state) => {
        state.ordersLoading = true;
        state.error = null;
      })
      .addCase(fetchBuyerOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload.orders;
        state.ordersTotal = action.payload.total;
        
        // Update active orders
        const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'in_transit'];
        state.activeOrderIds = action.payload.orders
          .filter(o => activeStatuses.includes(o.status))
          .map(o => o.id);
      })
      .addCase(fetchBuyerOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch active orders
      .addCase(fetchActiveOrders.fulfilled, (state, action) => {
        state.activeOrderIds = action.payload.map(o => o.id);
        // Merge with existing orders
        action.payload.forEach(activeOrder => {
          const index = state.orders.findIndex(o => o.id === activeOrder.id);
          if (index !== -1) {
            state.orders[index] = activeOrder;
          } else {
            state.orders.unshift(activeOrder);
          }
        });
      });
  },
});

export const {
  setSocketConnected,
  updateOrderStatus,
  updateRiderLocation,
  setTrackingOrder,
  addMessageNotification,
  markConversationRead,
  clearMessageNotifications,
  setUnreadMessagesCount,
  clearOrderStatusUpdates,
  dismissOrderStatusUpdate,
  setOrders,
  clearBuyerState,
} = buyerSlice.actions;

export default buyerSlice.reducer;
