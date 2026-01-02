import apiClient from './apiClient';

// Enums matching backend
export enum SubscriptionBoxType {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum BoxSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  FAMILY = 'family',
}

export enum SubscriptionBoxStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

// Types
export interface SubscriptionBox {
  id: string;
  userId: string;
  type: SubscriptionBoxType;
  size: BoxSize;
  status: SubscriptionBoxStatus;
  price: number;
  preferredCategories?: string[];
  excludedProducts?: string[];
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  preferredDeliveryDay: number;
  preferredDeliveryTime: string;
  specialInstructions?: string;
  paymentMethod: string;
  autoRenew: boolean;
  nextDeliveryDate?: string;
  lastDeliveryDate?: string;
  startDate: string;
  endDate?: string;
  deliveriesCompleted: number;
  pausedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionBoxDelivery {
  id: string;
  subscriptionId: string;
  orderId?: string;
  products: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalValue: number;
  scheduledDate: string;
  deliveredDate?: string;
  status: 'scheduled' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  rating?: number;
  feedback?: string;
  createdAt: string;
}

export interface SubscriptionBoxWithDeliveries extends SubscriptionBox {
  upcomingDeliveries: SubscriptionBoxDelivery[];
  pastDeliveries: SubscriptionBoxDelivery[];
}

export interface BoxPricing {
  pricing: Record<BoxSize, Record<SubscriptionBoxType, number>>;
  sizes: BoxSize[];
  types: SubscriptionBoxType[];
  descriptions: Record<BoxSize, string>;
}

export interface CreateSubscriptionBoxRequest {
  type: SubscriptionBoxType;
  size: BoxSize;
  preferredCategories?: string[];
  excludedProducts?: string[];
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  preferredDeliveryDay?: number;
  preferredDeliveryTime?: string;
  specialInstructions?: string;
  paymentMethod?: string;
  autoRenew?: boolean;
}

export interface UpdateSubscriptionBoxRequest {
  type?: SubscriptionBoxType;
  size?: BoxSize;
  preferredCategories?: string[];
  excludedProducts?: string[];
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  preferredDeliveryDay?: number;
  preferredDeliveryTime?: string;
  specialInstructions?: string;
  paymentMethod?: string;
  autoRenew?: boolean;
}

// Helper to unwrap API response - handles both single and double-wrapped responses
function unwrap<T>(response: any): T {
  // Handle null/undefined
  if (response === null || response === undefined) {
    return response;
  }
  
  // First level unwrap
  if (response && response.success !== undefined && response.data !== undefined) {
    const data = response.data;
    // Check for double-wrap (old responses still in flight)
    if (data && data.success !== undefined && data.data !== undefined) {
      return data.data;
    }
    return data;
  }
  return response;
}

// Subscription Box Service
const subscriptionBoxService = {
  /**
   * Get pricing information
   */
  getPricing: async (): Promise<BoxPricing> => {
    const response = await apiClient.get<any>('/subscription-boxes/pricing');
    return unwrap<BoxPricing>(response);
  },

  /**
   * Get user's current subscription
   */
  getMySubscription: async (): Promise<SubscriptionBoxWithDeliveries | null> => {
    const response = await apiClient.get<any>('/subscription-boxes/my-subscription');
    return unwrap<SubscriptionBoxWithDeliveries | null>(response);
  },

  /**
   * Create a new subscription
   */
  create: async (data: CreateSubscriptionBoxRequest): Promise<SubscriptionBox> => {
    const response = await apiClient.post<any>('/subscription-boxes', data);
    return unwrap<SubscriptionBox>(response);
  },

  /**
   * Update subscription
   */
  update: async (id: string, data: UpdateSubscriptionBoxRequest): Promise<SubscriptionBox> => {
    const response = await apiClient.put<any>(`/subscription-boxes/${id}`, data);
    return unwrap<SubscriptionBox>(response);
  },

  /**
   * Pause subscription
   */
  pause: async (id: string, resumeDate: string): Promise<void> => {
    await apiClient.post(`/subscription-boxes/${id}/pause`, { resumeDate });
  },

  /**
   * Resume subscription
   */
  resume: async (id: string): Promise<SubscriptionBox> => {
    const response = await apiClient.post<any>(`/subscription-boxes/${id}/resume`);
    return unwrap<SubscriptionBox>(response);
  },

  /**
   * Cancel subscription
   */
  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/subscription-boxes/${id}`);
  },

  /**
   * Get delivery details
   */
  getDeliveryDetails: async (deliveryId: string): Promise<SubscriptionBoxDelivery> => {
    const response = await apiClient.get<any>(`/subscription-boxes/deliveries/${deliveryId}`);
    return unwrap<SubscriptionBoxDelivery>(response);
  },

  /**
   * Rate a delivery
   */
  rateDelivery: async (deliveryId: string, rating: number, feedback?: string): Promise<void> => {
    await apiClient.post(`/subscription-boxes/deliveries/${deliveryId}/rate`, {
      rating,
      feedback,
    });
  },

  /**
   * Format price for display
   */
  formatPrice: (price: number): string => {
    return `₦${price.toLocaleString()}`;
  },

  /**
   * Get day name from number
   */
  getDayName: (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Saturday';
  },

  /**
   * Get status color
   */
  getStatusColor: (status: SubscriptionBoxStatus): string => {
    const colors: Record<SubscriptionBoxStatus, string> = {
      [SubscriptionBoxStatus.ACTIVE]: '#34C759',
      [SubscriptionBoxStatus.PAUSED]: '#FF9500',
      [SubscriptionBoxStatus.CANCELLED]: '#FF3B30',
      [SubscriptionBoxStatus.EXPIRED]: '#8E8E93',
    };
    return colors[status] || '#8E8E93';
  },

  /**
   * Get delivery status color
   */
  getDeliveryStatusColor: (status: string): string => {
    const colors: Record<string, string> = {
      scheduled: '#007AFF',
      preparing: '#FF9500',
      shipped: '#5856D6',
      delivered: '#34C759',
      cancelled: '#FF3B30',
    };
    return colors[status] || '#8E8E93';
  },

  /**
   * Get size description
   */
  getSizeDescription: (size: BoxSize): string => {
    const descriptions: Record<BoxSize, string> = {
      [BoxSize.SMALL]: '5-7 items • Perfect for 1-2 people',
      [BoxSize.MEDIUM]: '8-12 items • Great for 2-3 people',
      [BoxSize.LARGE]: '13-18 items • Ideal for 3-4 people',
      [BoxSize.FAMILY]: '20+ items • Best for 5+ people',
    };
    return descriptions[size] || '';
  },

  /**
   * Get type label
   */
  getTypeLabel: (type: SubscriptionBoxType): string => {
    const labels: Record<SubscriptionBoxType, string> = {
      [SubscriptionBoxType.WEEKLY]: 'Weekly',
      [SubscriptionBoxType.BIWEEKLY]: 'Every 2 Weeks',
      [SubscriptionBoxType.MONTHLY]: 'Monthly',
    };
    return labels[type] || '';
  },
};

export default subscriptionBoxService;
