import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';

// Types
export interface RiderProfile {
  id: string;
  userId: string;
  state: string;
  city: string;
  vehicleType: string;
  vehiclePlate: string;
  vehicleModel?: string;
  licenseNumber: string;
  isOnline: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  completedDeliveries: number;
  totalEarnings: number;
  walletBalance: number;
  currentLat?: number;
  currentLng?: number;
  subscriptionTier?: 'none' | 'silver' | 'gold' | 'platinum';
  subscriptionExpiry?: string;
}

export interface DeliveryOffer {
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDistance: string;
  estimatedEta: number;
  totalAmount: number;
  earnings: number;
  timeoutSeconds: number;
  farmerName?: string;
  buyerName?: string;
  items?: number;
  pickupLocation?: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface ActiveDelivery {
  id: string;
  orderId: string;
  status: 'accepted' | 'picked_up' | 'in_transit';
  pickupAddress: string;
  deliveryAddress: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  farmer: {
    name: string;
    phone: string;
  };
  buyer: {
    name: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
  earnings: number;
  estimatedDeliveryTime: string;
}

export interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalDeliveries: number;
  averagePerDelivery: number;
  pendingPayout: number;
  recentDeliveries: Array<{
    id: string;
    date: string;
    amount: number;
    distance: number;
    duration: number;
  }>;
  weeklyBreakdown: Array<{
    day: string;
    earnings: number;
  }>;
}

interface RiderState {
  profile: RiderProfile | null;
  isOnline: boolean;
  isAvailable: boolean;
  activeDelivery: ActiveDelivery | null;
  currentLocation: { lat: number; lng: number } | null;
  earnings: EarningsData | null;
  pendingOffers: DeliveryOffer[];
  isLoading: boolean;
  error: string | null;
  dispatchConnected: boolean;
}

const initialState: RiderState = {
  profile: null,
  isOnline: false,
  isAvailable: false,
  activeDelivery: null,
  currentLocation: null,
  earnings: null,
  pendingOffers: [],
  isLoading: false,
  error: null,
  dispatchConnected: false,
};

// Async thunks
export const fetchRiderProfile = createAsyncThunk(
  'rider/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<RiderProfile>('/riders/profile');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch rider profile');
    }
  }
);

export const fetchActiveDelivery = createAsyncThunk(
  'rider/fetchActiveDelivery',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<{ delivery: ActiveDelivery | null }>('/riders/active-delivery');
      return response.delivery;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active delivery');
    }
  }
);

export const fetchRiderEarnings = createAsyncThunk(
  'rider/fetchEarnings',
  async (period: 'today' | 'week' | 'month' | 'all' = 'week', { rejectWithValue }) => {
    try {
      const response = await apiClient.get<EarningsData>(`/riders/earnings?period=${period}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch earnings');
    }
  }
);

export const updateRiderStatus = createAsyncThunk(
  'rider/updateStatus',
  async (status: { isOnline?: boolean; isAvailable?: boolean }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch<RiderProfile>('/riders/status', status);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update status');
    }
  }
);

export const updateRiderLocation = createAsyncThunk(
  'rider/updateLocation',
  async (location: { lat: number; lng: number }, { rejectWithValue }) => {
    try {
      await apiClient.patch('/riders/location', location);
      return location;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update location');
    }
  }
);

export const acceptDeliveryOffer = createAsyncThunk(
  'rider/acceptOffer',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ assignment: any; order: any }>('/dispatch/accept', { orderId });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to accept offer');
    }
  }
);

export const declineDeliveryOffer = createAsyncThunk(
  'rider/declineOffer',
  async ({ orderId, reason }: { orderId: string; reason?: string }, { rejectWithValue }) => {
    try {
      await apiClient.post('/dispatch/decline', { orderId, reason });
      return orderId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to decline offer');
    }
  }
);

export const updateDeliveryStatus = createAsyncThunk(
  'rider/updateDeliveryStatus',
  async ({ deliveryId, status }: { deliveryId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch<ActiveDelivery>(`/riders/deliveries/${deliveryId}/status`, { status });
      return { deliveryId, status, delivery: response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update delivery status');
    }
  }
);

const riderSlice = createSlice({
  name: 'rider',
  initialState,
  reducers: {
    setDispatchConnected: (state, action: PayloadAction<boolean>) => {
      state.dispatchConnected = action.payload;
    },
    setCurrentLocation: (state, action: PayloadAction<{ lat: number; lng: number }>) => {
      state.currentLocation = action.payload;
    },
    addDeliveryOffer: (state, action: PayloadAction<DeliveryOffer>) => {
      // Add new offer to the beginning of the list
      const existingIndex = state.pendingOffers.findIndex(o => o.orderId === action.payload.orderId);
      if (existingIndex === -1) {
        state.pendingOffers.unshift(action.payload);
      }
    },
    removeDeliveryOffer: (state, action: PayloadAction<string>) => {
      state.pendingOffers = state.pendingOffers.filter(o => o.orderId !== action.payload);
    },
    clearDeliveryOffers: (state) => {
      state.pendingOffers = [];
    },
    setActiveDelivery: (state, action: PayloadAction<ActiveDelivery | null>) => {
      state.activeDelivery = action.payload;
    },
    updateActiveDeliveryStatus: (state, action: PayloadAction<'accepted' | 'picked_up' | 'in_transit'>) => {
      if (state.activeDelivery) {
        state.activeDelivery.status = action.payload;
      }
    },
    clearActiveDelivery: (state) => {
      state.activeDelivery = null;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setAvailableStatus: (state, action: PayloadAction<boolean>) => {
      state.isAvailable = action.payload;
    },
    clearRiderState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchRiderProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRiderProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.isOnline = action.payload.isOnline;
        state.isAvailable = action.payload.isAvailable;
      })
      .addCase(fetchRiderProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch active delivery
      .addCase(fetchActiveDelivery.fulfilled, (state, action) => {
        state.activeDelivery = action.payload;
      })
      // Fetch earnings
      .addCase(fetchRiderEarnings.fulfilled, (state, action) => {
        state.earnings = action.payload;
      })
      // Update status
      .addCase(updateRiderStatus.fulfilled, (state, action) => {
        if (action.payload.isOnline !== undefined) {
          state.isOnline = action.payload.isOnline;
        }
        if (action.payload.isAvailable !== undefined) {
          state.isAvailable = action.payload.isAvailable;
        }
        if (state.profile) {
          state.profile.isOnline = action.payload.isOnline;
          state.profile.isAvailable = action.payload.isAvailable;
        }
      })
      // Update location
      .addCase(updateRiderLocation.fulfilled, (state, action) => {
        state.currentLocation = action.payload;
        if (state.profile) {
          state.profile.currentLat = action.payload.lat;
          state.profile.currentLng = action.payload.lng;
        }
      })
      // Accept offer
      .addCase(acceptDeliveryOffer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(acceptDeliveryOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        // Clear pending offers and fetch active delivery
        state.pendingOffers = [];
      })
      .addCase(acceptDeliveryOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Decline offer
      .addCase(declineDeliveryOffer.fulfilled, (state, action) => {
        state.pendingOffers = state.pendingOffers.filter(o => o.orderId !== action.payload);
      })
      // Update delivery status
      .addCase(updateDeliveryStatus.fulfilled, (state, action) => {
        if (action.payload.status === 'delivered') {
          state.activeDelivery = null;
        } else if (state.activeDelivery) {
          state.activeDelivery.status = action.payload.status as 'accepted' | 'picked_up' | 'in_transit';
        }
      });
  },
});

export const {
  setDispatchConnected,
  setCurrentLocation,
  addDeliveryOffer,
  removeDeliveryOffer,
  clearDeliveryOffers,
  setActiveDelivery,
  updateActiveDeliveryStatus,
  clearActiveDelivery,
  setOnlineStatus,
  setAvailableStatus,
  clearRiderState,
} = riderSlice.actions;

export default riderSlice.reducer;
