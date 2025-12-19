import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import farmerAnalyticsService from '../../services/farmerAnalyticsService';
import { Product, Order } from '../../types';

// Types
export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  avgOrderValue: number;
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  avgRating: number;
}

export interface FarmerEarnings {
  todayEarnings: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  totalEarnings: number;
  pendingPayout: number;
}

export interface NewOrderNotification {
  orderId: string;
  orderNumber: string;
  buyerName: string;
  itemCount: number;
  total: number;
  createdAt: string;
}

interface FarmerState {
  // Products
  products: Product[];
  productsTotal: number;
  productsLoading: boolean;
  
  // Orders
  orders: Order[];
  ordersTotal: number;
  ordersLoading: boolean;
  pendingOrdersCount: number;
  
  // Dashboard
  dashboardStats: DashboardStats | null;
  earnings: FarmerEarnings | null;
  
  // Real-time
  newOrderNotifications: NewOrderNotification[];
  unreadOrdersCount: number;
  isSocketConnected: boolean;
  
  // General
  isLoading: boolean;
  error: string | null;
}

const initialState: FarmerState = {
  products: [],
  productsTotal: 0,
  productsLoading: false,
  
  orders: [],
  ordersTotal: 0,
  ordersLoading: false,
  pendingOrdersCount: 0,
  
  dashboardStats: null,
  earnings: null,
  
  newOrderNotifications: [],
  unreadOrdersCount: 0,
  isSocketConnected: false,
  
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchFarmerProducts = createAsyncThunk(
  'farmer/fetchProducts',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await productService.getMyProducts();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

export const fetchFarmerOrders = createAsyncThunk(
  'farmer/fetchOrders',
  async (params: { page?: number; limit?: number; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrders({
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status as any,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'farmer/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await farmerAnalyticsService.getDashboard();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'farmer/updateOrderStatus',
  async ({ orderId, status }: { orderId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, status as any);
      return { orderId, status, response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update order status');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'farmer/deleteProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(productId);
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete product');
    }
  }
);

const farmerSlice = createSlice({
  name: 'farmer',
  initialState,
  reducers: {
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.isSocketConnected = action.payload;
    },
    
    // New order received via WebSocket
    addNewOrderNotification: (state, action: PayloadAction<NewOrderNotification>) => {
      // Add to beginning of notifications
      state.newOrderNotifications.unshift(action.payload);
      state.unreadOrdersCount += 1;
      state.pendingOrdersCount += 1;
      
      // Keep only last 50 notifications
      if (state.newOrderNotifications.length > 50) {
        state.newOrderNotifications = state.newOrderNotifications.slice(0, 50);
      }
    },
    
    // Order status updated via WebSocket
    updateOrderInList: (state, action: PayloadAction<{ orderId: string; status: string }>) => {
      const order = state.orders.find(o => o.id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status as any;
      }
    },
    
    // Clear notification for a specific order
    clearOrderNotification: (state, action: PayloadAction<string>) => {
      state.newOrderNotifications = state.newOrderNotifications.filter(
        n => n.orderId !== action.payload
      );
      if (state.unreadOrdersCount > 0) {
        state.unreadOrdersCount -= 1;
      }
    },
    
    // Clear all notifications
    clearAllOrderNotifications: (state) => {
      state.newOrderNotifications = [];
      state.unreadOrdersCount = 0;
    },
    
    // Mark notifications as read
    markNotificationsRead: (state) => {
      state.unreadOrdersCount = 0;
    },
    
    // Set earnings data
    setEarnings: (state, action: PayloadAction<FarmerEarnings>) => {
      state.earnings = action.payload;
    },
    
    // Add new product to list
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.unshift(action.payload);
      state.productsTotal += 1;
    },
    
    // Remove product from list
    removeProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
      state.productsTotal = Math.max(0, state.productsTotal - 1);
    },
    
    // Set products (from API)
    setProducts: (state, action: PayloadAction<{ products: Product[]; total: number }>) => {
      state.products = action.payload.products;
      state.productsTotal = action.payload.total;
    },
    
    // Update product in list
    updateProductInList: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    
    // Clear farmer state (on logout)
    clearFarmerState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchFarmerProducts.pending, (state) => {
        state.productsLoading = true;
      })
      .addCase(fetchFarmerProducts.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.products = action.payload.products;
        state.productsTotal = action.payload.total;
      })
      .addCase(fetchFarmerProducts.rejected, (state, action) => {
        state.productsLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch orders
      .addCase(fetchFarmerOrders.pending, (state) => {
        state.ordersLoading = true;
      })
      .addCase(fetchFarmerOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload.orders;
        state.ordersTotal = action.payload.total;
        // Count pending orders
        state.pendingOrdersCount = action.payload.orders.filter(
          o => o.status === 'pending'
        ).length;
      })
      .addCase(fetchFarmerOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch dashboard stats
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      
      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const order = state.orders.find(o => o.id === action.payload.orderId);
        if (order) {
          const previousStatus = order.status;
          order.status = action.payload.status as any;
          
          // Update pending count
          if (previousStatus === 'pending' && action.payload.status !== 'pending') {
            state.pendingOrdersCount = Math.max(0, state.pendingOrdersCount - 1);
          }
        }
      })
      
      // Delete product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload);
        state.productsTotal = Math.max(0, state.productsTotal - 1);
      });
  },
});

export const {
  setSocketConnected,
  addNewOrderNotification,
  updateOrderInList,
  clearOrderNotification,
  clearAllOrderNotifications,
  markNotificationsRead,
  setEarnings,
  addProduct,
  removeProduct,
  setProducts,
  updateProductInList,
  clearFarmerState,
} = farmerSlice.actions;

export default farmerSlice.reducer;
