/**
 * Payment Methods Service
 * Handles CRUD operations for saved payment methods (cards and bank accounts)
 */

import apiClient from './apiClient';
import { PaymentMethod, PaymentMethodType } from '../store/slices/paymentSlice';

// Nigerian Banks for bank transfer
export const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '063', name: 'Diamond Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '084', name: 'Enterprise Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Parallex Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '999', name: 'Opay' },
  { code: '998', name: 'PalmPay' },
  { code: '997', name: 'Kuda' },
  { code: '996', name: 'Moniepoint' },
];

export interface AddCardRequest {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  setAsDefault?: boolean;
}

export interface AddBankRequest {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  setAsDefault?: boolean;
}

export interface VerifyBankResponse {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

/**
 * Detect card brand from card number
 */
export function detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'verve' | 'other' {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  // Visa: starts with 4
  if (/^4/.test(cleanNumber)) return 'visa';
  
  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'mastercard';
  
  // Verve: starts with 506, 507, 6500 (Nigerian cards)
  if (/^506|^507|^6500/.test(cleanNumber)) return 'verve';
  
  return 'other';
}

/**
 * Get card icon color based on brand
 */
export function getCardBrandColor(brand: string): { color: string; bg: string } {
  switch (brand) {
    case 'visa':
      return { color: '#1A1F71', bg: '#E8EAF6' };
    case 'mastercard':
      return { color: '#FF5F00', bg: '#FFF3E0' };
    case 'verve':
      return { color: '#003087', bg: '#E3F2FD' };
    default:
      return { color: '#666666', bg: '#F5F5F5' };
  }
}

/**
 * Mask card number for display
 */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\s/g, '');
  const last4 = clean.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Mask account number for display
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 4) return accountNumber;
  const last4 = accountNumber.slice(-4);
  return `****${last4}`;
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, '');
  const groups = clean.match(/.{1,4}/g) || [];
  return groups.join(' ').substr(0, 19);
}

/**
 * Format expiry date as MM/YY
 */
export function formatExpiryDate(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length >= 2) {
    return clean.substr(0, 2) + (clean.length > 2 ? '/' + clean.substr(2, 2) : '');
  }
  return clean;
}

class PaymentService {
  /**
   * Get all saved payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response: any = await apiClient.get('/payments/methods');
      return response.data?.methods || [];
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      // Return empty array on error - user can add methods later
      return [];
    }
  }

  /**
   * Add a new card payment method
   */
  async addCard(data: AddCardRequest): Promise<PaymentMethod> {
    try {
      // In production, this would tokenize with payment gateway (Paystack/Flutterwave)
      const response: any = await apiClient.post('/payments/methods/card', data);
      
      const brand = detectCardBrand(data.cardNumber);
      const colors = getCardBrandColor(brand);
      
      return response.data?.method || {
        id: Date.now().toString(),
        type: 'card' as PaymentMethodType,
        label: `${brand.charAt(0).toUpperCase() + brand.slice(1)} ending in ${data.cardNumber.slice(-4)}`,
        details: `Expires ${data.expiryMonth}/${data.expiryYear}`,
        icon: 'card',
        iconColor: colors.color,
        iconBg: colors.bg,
        isDefault: data.setAsDefault || false,
        cardNumber: maskCardNumber(data.cardNumber),
        cardExpiry: `${data.expiryMonth}/${data.expiryYear}`,
        cardholderName: data.cardholderName,
        cardBrand: brand,
      };
    } catch (error) {
      console.error('Failed to add card:', error);
      throw error;
    }
  }

  /**
   * Add a new bank account payment method
   */
  async addBankAccount(data: AddBankRequest): Promise<PaymentMethod> {
    try {
      const response: any = await apiClient.post('/payments/methods/bank', data);
      
      return response.data?.method || {
        id: Date.now().toString(),
        type: 'bank' as PaymentMethodType,
        label: data.bankName,
        details: `Account ending in ${data.accountNumber.slice(-4)}`,
        icon: 'storefront-outline',
        iconColor: '#FF6B00',
        iconBg: '#FFF3E0',
        isDefault: data.setAsDefault || false,
        bankName: data.bankName,
        accountNumber: maskAccountNumber(data.accountNumber),
        accountName: data.accountName,
      };
    } catch (error) {
      console.error('Failed to add bank account:', error);
      throw error;
    }
  }

  /**
   * Verify bank account (NUBAN lookup)
   */
  async verifyBankAccount(bankCode: string, accountNumber: string): Promise<VerifyBankResponse> {
    try {
      const response: any = await apiClient.post('/payments/verify-account', {
        bankCode,
        accountNumber,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to verify bank account:', error);
      throw error;
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(methodId: string): Promise<void> {
    try {
      await apiClient.delete(`/payments/methods/${methodId}`);
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      throw error;
    }
  }

  /**
   * Set a payment method as default
   */
  async setDefaultMethod(methodId: string): Promise<void> {
    try {
      await apiClient.patch(`/payments/methods/${methodId}/default`);
    } catch (error) {
      console.error('Failed to set default method:', error);
      throw error;
    }
  }

  /**
   * Create a local payment method object (for signup flow)
   */
  createLocalCardMethod(data: AddCardRequest): PaymentMethod {
    const brand = detectCardBrand(data.cardNumber);
    const colors = getCardBrandColor(brand);
    
    return {
      id: `local_${Date.now()}`,
      type: 'card',
      label: `${brand.charAt(0).toUpperCase() + brand.slice(1)} ending in ${data.cardNumber.slice(-4)}`,
      details: `Expires ${data.expiryMonth}/${data.expiryYear}`,
      icon: 'card',
      iconColor: colors.color,
      iconBg: colors.bg,
      isDefault: data.setAsDefault || false,
      cardNumber: maskCardNumber(data.cardNumber),
      cardExpiry: `${data.expiryMonth}/${data.expiryYear}`,
      cardholderName: data.cardholderName,
      cardBrand: brand,
    };
  }

  /**
   * Create a local bank account method (for signup flow)
   */
  createLocalBankMethod(data: AddBankRequest): PaymentMethod {
    return {
      id: `local_${Date.now()}`,
      type: 'bank',
      label: data.bankName,
      details: `Account ending in ${data.accountNumber.slice(-4)}`,
      icon: 'storefront-outline',
      iconColor: '#FF6B00',
      iconBg: '#FFF3E0',
      isDefault: data.setAsDefault || false,
      bankName: data.bankName,
      accountNumber: maskAccountNumber(data.accountNumber),
      accountName: data.accountName,
    };
  }

  // ============================================
  // PAYSTACK METHODS
  // ============================================

  /**
   * Get user's DVA (Dedicated Virtual Account) details for bank transfer top-up
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
      return response.data;
    } catch (error) {
      console.error('Failed to fetch DVA details:', error);
      return {
        hasDva: false,
        message: 'Failed to load virtual account details',
      };
    }
  }

  /**
   * Setup DVA for user (if not already setup)
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
      return response.data;
    } catch (error) {
      console.error('Failed to setup DVA:', error);
      throw error;
    }
  }

  /**
   * Initialize Paystack payment (card, bank, ussd)
   */
  async initializePaystackPayment(params: {
    amount: number;
    orderId?: string;
    type?: 'order_payment' | 'wallet_topup';
    callbackUrl?: string;
  }): Promise<{
    authorizationUrl: string;
    accessCode: string;
    reference: string;
  }> {
    try {
      const response: any = await apiClient.post('/payments/paystack/initialize', params);
      return response.data;
    } catch (error) {
      console.error('Failed to initialize Paystack payment:', error);
      throw error;
    }
  }

  /**
   * Verify Paystack payment status
   */
  async verifyPaystackPayment(reference: string): Promise<{
    status: string;
    amount: number;
    reference: string;
    paidAt?: string;
  }> {
    try {
      const response: any = await apiClient.get(`/payments/paystack/verify/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Failed to verify payment:', error);
      throw error;
    }
  }

  /**
   * Get list of Nigerian banks from Paystack
   */
  async getBanks(): Promise<Array<{ name: string; code: string }>> {
    try {
      const response: any = await apiClient.get('/payments/banks');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch banks:', error);
      // Return local list as fallback
      return NIGERIAN_BANKS;
    }
  }

  /**
   * Resolve bank account name
   */
  async resolveBankAccount(accountNumber: string, bankCode: string): Promise<{
    accountNumber: string;
    accountName: string;
  }> {
    try {
      const response: any = await apiClient.post('/payments/bank/resolve', {
        accountNumber,
        bankCode,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to resolve bank account:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending Paystack payment
   */
  async cancelPaystackPayment(reference: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response: any = await apiClient.post(`/payments/paystack/cancel/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Failed to cancel payment:', error);
      throw error;
    }
  }

  /**
   * Generate a "Pay for Me" payment link
   * Creates a shareable link that someone else can use to pay for an order
   */
  async generatePayForMeLink(params: {
    amount: number;
    orderId?: string;
    recipientName: string;
    recipientEmail: string;
    recipientPhone?: string;
    description?: string;
    expiresInHours?: number;
  }): Promise<{
    success: boolean;
    paymentLink: string;
    reference: string;
    expiresAt: string;
  }> {
    try {
      const response: any = await apiClient.post('/payments/paystack/pay-for-me', {
        amount: params.amount,
        orderId: params.orderId,
        customer: {
          name: params.recipientName,
          email: params.recipientEmail,
          phone: params.recipientPhone,
        },
        description: params.description || 'Pay for order',
        expiresInHours: params.expiresInHours || 24,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate Pay for Me link:', error);
      throw error;
    }
  }

  /**
   * Check status of a "Pay for Me" payment
   */
  async checkPayForMeStatus(reference: string): Promise<{
    status: 'pending' | 'paid' | 'expired' | 'cancelled';
    paidAt?: string;
    paidBy?: {
      name: string;
      email: string;
    };
  }> {
    try {
      const response: any = await apiClient.get(`/payments/paystack/pay-for-me/${reference}`);
      return response.data;
    } catch (error) {
      console.error('Failed to check Pay for Me status:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;
