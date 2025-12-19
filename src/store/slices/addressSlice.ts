import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESSES_STORAGE_KEY = '@handwork_addresses';

export interface Address {
  id: string;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressState {
  addresses: Address[];
  loading: boolean;
  error: string | null;
}

const initialState: AddressState = {
  addresses: [],
  loading: false,
  error: null,
};

// Async thunk to load addresses from storage
export const loadAddresses = createAsyncThunk(
  'address/loadAddresses',
  async () => {
    const stored = await AsyncStorage.getItem(ADDRESSES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Address[];
    }
    return [];
  }
);

// Helper function to save addresses to storage
const saveAddressesToStorage = async (addresses: Address[]) => {
  await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses));
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setAddresses: (state, action: PayloadAction<Address[]>) => {
      state.addresses = action.payload;
      saveAddressesToStorage(action.payload);
    },
    addAddress: (state, action: PayloadAction<Address>) => {
      // If this is the first address, make it default
      if (state.addresses.length === 0) {
        action.payload.isDefault = true;
      }
      state.addresses.push(action.payload);
      saveAddressesToStorage(state.addresses);
    },
    updateAddress: (state, action: PayloadAction<Address>) => {
      const index = state.addresses.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
      saveAddressesToStorage(state.addresses);
    },
    deleteAddress: (state, action: PayloadAction<string>) => {
      const wasDefault = state.addresses.find(a => a.id === action.payload)?.isDefault;
      state.addresses = state.addresses.filter(a => a.id !== action.payload);
      // If deleted address was default, make the first one default
      if (wasDefault && state.addresses.length > 0) {
        state.addresses[0].isDefault = true;
      }
      saveAddressesToStorage(state.addresses);
    },
    setDefaultAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.map(a => ({
        ...a,
        isDefault: a.id === action.payload,
      }));
      saveAddressesToStorage(state.addresses);
    },
    clearAddresses: (state) => {
      state.addresses = [];
      saveAddressesToStorage([]);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAddresses.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload;
        state.loading = false;
      })
      .addCase(loadAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load addresses';
      });
  },
});

export const {
  setAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  clearAddresses,
} = addressSlice.actions;

// Selectors
export const selectAddresses = (state: { address: AddressState }) => state.address.addresses;
export const selectDefaultAddress = (state: { address: AddressState }) => 
  state.address.addresses.find(a => a.isDefault);

export default addressSlice.reducer;
