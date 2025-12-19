/**
 * Withdrawal Service
 * Handles bank account management, withdrawals, and payout tracking
 */

import apiClient from './apiClient';

// Nigerian Banks List
export const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank', logo: '🏦' },
  { code: '023', name: 'Citibank Nigeria', logo: '🏦' },
  { code: '063', name: 'Diamond Bank', logo: '🏦' },
  { code: '050', name: 'Ecobank Nigeria', logo: '🏦' },
  { code: '084', name: 'Enterprise Bank', logo: '🏦' },
  { code: '070', name: 'Fidelity Bank', logo: '🏦' },
  { code: '011', name: 'First Bank of Nigeria', logo: '🏦' },
  { code: '214', name: 'First City Monument Bank', logo: '🏦' },
  { code: '058', name: 'Guaranty Trust Bank', logo: '🏦' },
  { code: '030', name: 'Heritage Bank', logo: '🏦' },
  { code: '301', name: 'Jaiz Bank', logo: '🏦' },
  { code: '082', name: 'Keystone Bank', logo: '🏦' },
  { code: '526', name: 'Parallex Bank', logo: '🏦' },
  { code: '076', name: 'Polaris Bank', logo: '🏦' },
  { code: '101', name: 'Providus Bank', logo: '🏦' },
  { code: '221', name: 'Stanbic IBTC Bank', logo: '🏦' },
  { code: '068', name: 'Standard Chartered Bank', logo: '🏦' },
  { code: '232', name: 'Sterling Bank', logo: '🏦' },
  { code: '100', name: 'Suntrust Bank', logo: '🏦' },
  { code: '032', name: 'Union Bank of Nigeria', logo: '🏦' },
  { code: '033', name: 'United Bank For Africa', logo: '🏦' },
  { code: '215', name: 'Unity Bank', logo: '🏦' },
  { code: '035', name: 'Wema Bank', logo: '🏦' },
  { code: '057', name: 'Zenith Bank', logo: '🏦' },
  { code: '303', name: 'Opay', logo: '💳' },
  { code: '304', name: 'Palmpay', logo: '💳' },
  { code: '305', name: 'Kuda Bank', logo: '💜' },
  { code: '306', name: 'Moniepoint', logo: '💳' },
];

// Withdrawal configuration
export const WITHDRAWAL_CONFIG = {
  minAmount: 500, // Minimum withdrawal ₦500
  maxAmount: 5000000, // Maximum withdrawal ₦5,000,000
  dailyLimit: 10000000, // Daily limit ₦10,000,000
  processingFee: {
    flat: 50, // Flat fee ₦50
    percentage: 0, // No percentage fee
    maxFee: 50, // Maximum fee capped at ₦50
  },
  processingTime: {
    instant: '5-10 minutes',
    standard: '24 hours',
    weekend: '48-72 hours',
  },
  instantWithdrawalThreshold: 50000, // Instant for amounts up to ₦50,000
};

export interface BankAccount {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerifyAccountRequest {
  accountNumber: string;
  bankCode: string;
}

export interface VerifyAccountResponse {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

export interface AddBankAccountRequest {
  accountNumber: string;
  bankCode: string;
  accountName: string;
  setAsDefault?: boolean;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Withdrawal {
  id: string;
  userId: string;
  bankAccountId: string;
  bankAccount: BankAccount;
  amount: number;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  reference: string;
  failureReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  bankAccountId: string;
  amount: number;
  pin?: string; // Transaction PIN if enabled
}

export interface WithdrawalSummary {
  availableBalance: number;
  pendingWithdrawals: number;
  totalWithdrawn: number;
  withdrawalCount: number;
  lastWithdrawal?: Withdrawal;
}

export interface EarningsSummary {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number; // Earnings not yet available for withdrawal
  processingWithdrawals: number;
  todayEarnings: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  lastPayout?: Withdrawal;
}

/**
 * Calculate withdrawal fee
 */
export function calculateWithdrawalFee(amount: number): number {
  const { flat, percentage, maxFee } = WITHDRAWAL_CONFIG.processingFee;
  const percentageFee = amount * percentage;
  const totalFee = flat + percentageFee;
  return Math.min(totalFee, maxFee);
}

/**
 * Get estimated processing time
 */
export function getProcessingTime(amount: number): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  // Weekend (Saturday = 6, Sunday = 0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return WITHDRAWAL_CONFIG.processingTime.weekend;
  }
  
  // After banking hours (after 4pm)
  if (hour >= 16) {
    return WITHDRAWAL_CONFIG.processingTime.standard;
  }
  
  // Instant for small amounts during banking hours
  if (amount <= WITHDRAWAL_CONFIG.instantWithdrawalThreshold) {
    return WITHDRAWAL_CONFIG.processingTime.instant;
  }
  
  return WITHDRAWAL_CONFIG.processingTime.standard;
}

/**
 * Validate withdrawal amount
 */
export function validateWithdrawalAmount(
  amount: number, 
  availableBalance: number
): { valid: boolean; error?: string } {
  if (amount < WITHDRAWAL_CONFIG.minAmount) {
    return { 
      valid: false, 
      error: `Minimum withdrawal amount is ₦${WITHDRAWAL_CONFIG.minAmount.toLocaleString()}` 
    };
  }
  
  if (amount > WITHDRAWAL_CONFIG.maxAmount) {
    return { 
      valid: false, 
      error: `Maximum withdrawal amount is ₦${WITHDRAWAL_CONFIG.maxAmount.toLocaleString()}` 
    };
  }
  
  const fee = calculateWithdrawalFee(amount);
  if (amount + fee > availableBalance) {
    return { 
      valid: false, 
      error: `Insufficient balance. You need ₦${(amount + fee).toLocaleString()} (including ₦${fee} fee)` 
    };
  }
  
  return { valid: true };
}

/**
 * Mask account number for display (show last 4 digits)
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 4) return accountNumber;
  return '••••••' + accountNumber.slice(-4);
}

/**
 * Format withdrawal status for display
 */
export function formatWithdrawalStatus(status: WithdrawalStatus): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: '#FFC107', icon: 'time-outline' };
    case 'processing':
      return { label: 'Processing', color: '#2196F3', icon: 'sync-outline' };
    case 'completed':
      return { label: 'Completed', color: '#4CAF50', icon: 'checkmark-circle-outline' };
    case 'failed':
      return { label: 'Failed', color: '#F44336', icon: 'close-circle-outline' };
    case 'cancelled':
      return { label: 'Cancelled', color: '#9E9E9E', icon: 'ban-outline' };
    default:
      return { label: status, color: '#9E9E9E', icon: 'help-circle-outline' };
  }
}

/**
 * Withdrawal Service API
 */
export const withdrawalService = {
  /**
   * Get all saved bank accounts
   */
  async getBankAccounts(): Promise<BankAccount[]> {
    const response = await apiClient.get<{ accounts: BankAccount[] }>('/bank-accounts');
    return response.accounts || [];
  },

  /**
   * Verify bank account details
   */
  async verifyAccount(data: VerifyAccountRequest): Promise<VerifyAccountResponse> {
    const response = await apiClient.post<VerifyAccountResponse>('/bank-accounts/verify', data);
    return response;
  },

  /**
   * Add a new bank account
   */
  async addBankAccount(data: AddBankAccountRequest): Promise<BankAccount> {
    const response = await apiClient.post<BankAccount>('/bank-accounts', data);
    return response;
  },

  /**
   * Delete a bank account
   */
  async deleteBankAccount(accountId: string): Promise<void> {
    await apiClient.delete(`/bank-accounts/${accountId}`);
  },

  /**
   * Set a bank account as default
   */
  async setDefaultAccount(accountId: string): Promise<void> {
    await apiClient.put(`/bank-accounts/${accountId}/set-default`);
  },

  /**
   * Get withdrawal summary
   */
  async getWithdrawalSummary(): Promise<WithdrawalSummary> {
    const response = await apiClient.get<WithdrawalSummary>('/withdrawals/summary');
    return response;
  },

  /**
   * Get earnings summary (for farmers/riders)
   */
  async getEarningsSummary(): Promise<EarningsSummary> {
    const response = await apiClient.get<{
      totalEarnings: number;
      totalWithdrawals: number;
      currentBalance: number;
      transactionCount: number;
      todayEarnings: number;
      thisWeekEarnings: number;
      thisMonthEarnings: number;
    }>('/wallet/summary');
    
    // Map backend response to frontend interface
    return {
      totalEarnings: response.totalEarnings || 0,
      availableBalance: response.currentBalance || 0,
      pendingBalance: 0, // Backend doesn't track this separately yet
      processingWithdrawals: response.totalWithdrawals || 0,
      todayEarnings: response.todayEarnings || 0,
      thisWeekEarnings: response.thisWeekEarnings || 0,
      thisMonthEarnings: response.thisMonthEarnings || 0,
    };
  },

  /**
   * Get withdrawal history
   */
  async getWithdrawals(params?: { 
    status?: WithdrawalStatus; 
    page?: number; 
    limit?: number;
  }): Promise<{ withdrawals: Withdrawal[]; total: number }> {
    const response = await apiClient.get<{ withdrawals: Withdrawal[]; total: number }>(
      '/withdrawals',
      { params }
    );
    return response;
  },

  /**
   * Request a withdrawal
   */
  async requestWithdrawal(data: WithdrawalRequest): Promise<Withdrawal> {
    const fee = calculateWithdrawalFee(data.amount);
    
    const response = await apiClient.post<Withdrawal>('/withdrawals', {
      ...data,
      fee,
    });
    return response;
  },

  /**
   * Cancel a pending withdrawal
   */
  async cancelWithdrawal(withdrawalId: string): Promise<void> {
    await apiClient.put(`/withdrawals/${withdrawalId}/cancel`);
  },
};

export default withdrawalService;
