/**
 * Wallet Service
 * Handles wallet operations: top-up, payments, balance, transactions, and refunds
 */

import apiClient from './apiClient';

// Transaction types
export type WalletTransactionType = 
  | 'top_up'           // Adding funds to wallet
  | 'payment'          // Paying for order
  | 'refund'           // Refund from cancelled order
  | 'premium'          // Premium subscription payment
  | 'cashback'         // Cashback reward
  | 'bonus'            // Promotional bonus
  | 'transfer_in'      // Transfer received
  | 'transfer_out'     // Transfer sent
  | 'withdrawal';      // Withdrawal to bank

export type WalletTransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  fee: number;
  netAmount: number;
  status: WalletTransactionStatus;
  reference: string;
  description: string;
  metadata?: {
    orderId?: string;
    orderNumber?: string;
    premiumTier?: string;
    bankAccount?: string;
    paymentMethod?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface WalletBalance {
  available: number;      // Spendable balance
  pending: number;        // Pending refunds/top-ups
  total: number;          // Total (available + pending)
  currency: string;
}

export interface TopUpRequest {
  amount: number;
  paymentMethodId: string; // Card ID or payment method
}

export interface WalletPaymentRequest {
  amount: number;
  orderId?: string;
  description: string;
  pin?: string; // Transaction PIN if enabled
}

export interface TransferRequest {
  amount: number;
  recipientPhone: string;
  pin?: string;
}

// Top-up configuration
export const TOPUP_CONFIG = {
  minAmount: 100,          // Minimum ₦100
  maxAmount: 1000000,      // Maximum ₦1,000,000
  quickAmounts: [500, 1000, 2000, 5000, 10000, 20000],
  paymentMethods: [
    { id: 'card', name: 'Debit/Credit Card', icon: 'card', enabled: true },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: 'business', enabled: true },
    { id: 'ussd', name: 'USSD', icon: 'keypad', enabled: true },
  ],
};

// Wallet limits
export const WALLET_LIMITS = {
  dailyTransaction: 500000,   // ₦500,000 daily limit
  singleTransaction: 200000,  // ₦200,000 single transaction
  walletMaxBalance: 2000000,  // ₦2,000,000 max balance
};

/**
 * Format amount for display
 */
export function formatWalletAmount(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/**
 * Get transaction icon and color based on type
 */
export function getTransactionDisplay(type: WalletTransactionType): {
  icon: string;
  color: string;
  bgColor: string;
  label: string;
} {
  switch (type) {
    case 'top_up':
      return { icon: 'add-circle', color: '#4CAF50', bgColor: '#E8F5E9', label: 'Top-up' };
    case 'payment':
      return { icon: 'cart', color: '#FF9800', bgColor: '#FFF3E0', label: 'Payment' };
    case 'refund':
      return { icon: 'refresh-circle', color: '#2196F3', bgColor: '#E3F2FD', label: 'Refund' };
    case 'premium':
      return { icon: 'diamond', color: '#9C27B0', bgColor: '#F3E5F5', label: 'Premium' };
    case 'cashback':
      return { icon: 'gift', color: '#E91E63', bgColor: '#FCE4EC', label: 'Cashback' };
    case 'bonus':
      return { icon: 'star', color: '#FFD700', bgColor: '#FFFDE7', label: 'Bonus' };
    case 'transfer_in':
      return { icon: 'arrow-down-circle', color: '#4CAF50', bgColor: '#E8F5E9', label: 'Received' };
    case 'transfer_out':
      return { icon: 'arrow-up-circle', color: '#F44336', bgColor: '#FFEBEE', label: 'Sent' };
    case 'withdrawal':
      return { icon: 'wallet', color: '#795548', bgColor: '#EFEBE9', label: 'Withdrawal' };
    default:
      return { icon: 'help-circle', color: '#9E9E9E', bgColor: '#F5F5F5', label: 'Transaction' };
  }
}

/**
 * Check if amount is a credit (adds to balance)
 */
export function isCredit(type: WalletTransactionType): boolean {
  return ['top_up', 'refund', 'cashback', 'bonus', 'transfer_in'].includes(type);
}

/**
 * Validate top-up amount
 */
export function validateTopUpAmount(amount: number, currentBalance: number): { 
  valid: boolean; 
  error?: string;
} {
  if (amount < TOPUP_CONFIG.minAmount) {
    return { valid: false, error: `Minimum top-up is ${formatWalletAmount(TOPUP_CONFIG.minAmount)}` };
  }
  
  if (amount > TOPUP_CONFIG.maxAmount) {
    return { valid: false, error: `Maximum top-up is ${formatWalletAmount(TOPUP_CONFIG.maxAmount)}` };
  }
  
  if (currentBalance + amount > WALLET_LIMITS.walletMaxBalance) {
    return { 
      valid: false, 
      error: `Wallet balance cannot exceed ${formatWalletAmount(WALLET_LIMITS.walletMaxBalance)}` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number, balance: number): {
  valid: boolean;
  error?: string;
} {
  if (amount > balance) {
    return { valid: false, error: 'Insufficient wallet balance' };
  }
  
  if (amount > WALLET_LIMITS.singleTransaction) {
    return { 
      valid: false, 
      error: `Maximum single transaction is ${formatWalletAmount(WALLET_LIMITS.singleTransaction)}` 
    };
  }
  
  return { valid: true };
}

/**
 * Wallet Service API
 */
export const walletService = {
  /**
   * Get wallet balance
   */
  async getBalance(): Promise<WalletBalance> {
    console.log('[walletService] Fetching balance...');
    const response = await apiClient.get<{ success: boolean; data: WalletBalance }>('/wallet/balance');
    console.log('[walletService] Balance response:', JSON.stringify(response));
    
    // API returns {success: true, data: {...}}, extract the data
    const balanceData = (response as any)?.data || response;
    console.log('[walletService] Extracted balance data:', JSON.stringify(balanceData));
    
    return balanceData;
  },

  /**
   * Get transaction history
   */
  async getTransactions(params?: {
    type?: WalletTransactionType;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<WalletTransaction>> {
    const response = await apiClient.get<{ success: boolean; data: PaginatedResponse<WalletTransaction> } | PaginatedResponse<WalletTransaction>>(
      '/wallet/transactions',
      { params }
    );
    // API wraps response in { success: true, data: {...} }
    const result = (response as any)?.data || response;
    console.log('[walletService] getTransactions result:', JSON.stringify(result));
    return result;
  },

  /**
   * Top up wallet
   */
  async topUp(data: TopUpRequest): Promise<WalletTransaction> {
    const response = await apiClient.post<WalletTransaction>('/wallet/top-up', data);
    return response;
  },

  /**
   * Pay with wallet
   */
  async payWithWallet(data: WalletPaymentRequest): Promise<WalletTransaction> {
    const response = await apiClient.post<{ success: boolean; data: WalletTransaction } | WalletTransaction>('/wallet/pay', data);
    // Handle wrapped response { success: true, data: {...} }
    const result = (response as any)?.data || response;
    console.log('[walletService] payWithWallet result:', JSON.stringify(result));
    return result;
  },

  /**
   * Pay for premium subscription
   */
  async payForPremium(tier: string, amount: number): Promise<{ success: boolean; message?: string; user?: any }> {
    console.log('[walletService] payForPremium called with tier:', tier, 'amount:', amount);
    const response = await apiClient.post<any>('/wallet/pay-premium', {
      tier,
      amount,
    });
    console.log('[walletService] payForPremium response:', JSON.stringify(response));
    // Handle wrapped response { success: true, data: {...} }
    const result = (response as any)?.data || response;
    return result;
  },

  /**
   * Process refund to wallet (called by order service when order is cancelled)
   */
  async processRefund(orderId: string, orderNumber: string, amount: number): Promise<WalletTransaction> {
    const response = await apiClient.post<WalletTransaction>('/wallet/refund', {
      orderId,
      orderNumber,
      amount,
    });
    return response;
  },

  /**
   * Transfer to another user
   */
  async transfer(data: TransferRequest): Promise<WalletTransaction> {
    const response = await apiClient.post<WalletTransaction>('/wallet/transfer', data);
    return response;
  },

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(amount: number): Promise<boolean> {
    const balance = await this.getBalance();
    return balance.available >= amount;
  },

  /**
   * Get wallet stats
   */
  async getStats(): Promise<{
    totalTopUps: number;
    totalSpent: number;
    totalRefunds: number;
    totalCashback: number;
  }> {
    const response = await apiClient.get<{
      totalTopUps: number;
      totalSpent: number;
      totalRefunds: number;
      totalCashback: number;
    }>('/wallet/stats');
    return response;
  },

  // ============================================
  // PAYSTACK DVA (Bank Transfer Top-up)
  // ============================================

  /**
   * Get DVA (Dedicated Virtual Account) details for bank transfer top-up
   * Users can transfer to this account to instantly top up their wallet
   */
  async getDvaDetails(): Promise<{
    hasDva: boolean;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    message: string;
  }> {
    try {
      const response: any = await apiClient.get('/payments/dva');
      // Backend wraps response in { success, data }
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch DVA details:', error);
      return {
        hasDva: false,
        message: 'Failed to load virtual account details. Please try again.',
      };
    }
  },

  /**
   * Setup DVA for user (if not already setup)
   * This is called automatically during signup, but can be called manually if setup failed
   */
  async setupDva(): Promise<{
    success: boolean;
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    message: string;
  }> {
    try {
      const response: any = await apiClient.post('/payments/dva/setup');
      // Backend wraps response in { success, data }
      return response.data || response;
    } catch (error) {
      console.error('Failed to setup DVA:', error);
      throw error;
    }
  },

  /**
   * Initialize Paystack payment for wallet top-up (card/bank/ussd)
   */
  async initializeTopUp(amount: number, callbackUrl?: string): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    try {
      const response: any = await apiClient.post('/payments/paystack/initialize', {
        amount,
        type: 'wallet_topup',
        callbackUrl,
      });
      // Backend wraps response in { success, data }
      return response.data || response;
    } catch (error) {
      console.error('Failed to initialize top-up:', error);
      throw error;
    }
  },

  /**
   * Verify Paystack payment after redirect
   */
  async verifyTopUp(reference: string): Promise<{
    status: string;
    amount: number;
    reference: string;
    paidAt?: string;
  }> {
    try {
      const response: any = await apiClient.get(`/payments/paystack/verify/${reference}`);
      // Backend wraps response in { success, data }
      return response.data || response;
    } catch (error) {
      console.error('Failed to verify top-up:', error);
      throw error;
    }
  },
};

export default walletService;
