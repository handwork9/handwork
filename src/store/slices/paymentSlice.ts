import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PaymentMethodType = 'card' | 'bank';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  details: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  isDefault: boolean;
  lastUsed?: string;
  // Card-specific fields
  cardNumber?: string;
  cardExpiry?: string;
  cardholderName?: string;
  cardBrand?: 'visa' | 'mastercard' | 'verve' | 'other';
  // Bank-specific fields
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

interface PaymentState {
  methods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  methods: [],
  isLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setPaymentMethods: (state, action: PayloadAction<PaymentMethod[]>) => {
      state.methods = action.payload;
      state.error = null;
    },
    addPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      // If this is the first method, make it default
      if (state.methods.length === 0) {
        action.payload.isDefault = true;
      }
      state.methods.push(action.payload);
      state.error = null;
    },
    removePaymentMethod: (state, action: PayloadAction<string>) => {
      const removedMethod = state.methods.find(m => m.id === action.payload);
      state.methods = state.methods.filter(m => m.id !== action.payload);
      // If we removed the default, set first remaining as default
      if (removedMethod?.isDefault && state.methods.length > 0) {
        state.methods[0].isDefault = true;
      }
    },
    setDefaultPaymentMethod: (state, action: PayloadAction<string>) => {
      state.methods = state.methods.map(m => ({
        ...m,
        isDefault: m.id === action.payload,
      }));
    },
    updatePaymentMethodLastUsed: (state, action: PayloadAction<string>) => {
      const method = state.methods.find(m => m.id === action.payload);
      if (method) {
        method.lastUsed = new Date().toISOString();
      }
    },
    setPaymentLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPaymentError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearPaymentMethods: (state) => {
      state.methods = [];
      state.error = null;
    },
  },
});

export const {
  setPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  updatePaymentMethodLastUsed,
  setPaymentLoading,
  setPaymentError,
  clearPaymentMethods,
} = paymentSlice.actions;

export default paymentSlice.reducer;

// Selectors
export const selectPaymentMethods = (state: { payment: PaymentState }) => state.payment.methods;
export const selectDefaultPaymentMethod = (state: { payment: PaymentState }) => 
  state.payment.methods.find(m => m.isDefault);
export const selectPaymentLoading = (state: { payment: PaymentState }) => state.payment.isLoading;
export const selectPaymentError = (state: { payment: PaymentState }) => state.payment.error;
