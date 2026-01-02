import apiClient from './apiClient';

export interface GroupBuyTier {
  minParticipants: number;
  discount: number;
}

export type GroupBuyStatus = 'active' | 'success' | 'failed' | 'cancelled';
export type ParticipantStatus = 'joined' | 'paid' | 'refunded' | 'cancelled';

export interface GroupBuyProduct {
  id: string;
  name?: string;
  title?: string;
  image?: string;
  images?: string[];
  category?: string;
}

export interface GroupBuyOrganizer {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar: string;
}

export interface GroupBuyParticipant {
  id: string;
  user: {
    id: string;
    firstName: string;
    avatar: string;
  };
  quantity: number;
  priceAtJoin: number;
  finalPrice?: number;
  amountPaid?: number;
  status: ParticipantStatus;
  isOrganizer: boolean;
  deliveryPreference?: 'pickup' | 'delivery';
  joinedAt: string;
}

export interface GroupBuy {
  id: string;
  title: string;
  description?: string;
  product: GroupBuyProduct;
  organizer: GroupBuyOrganizer;
  originalPrice: number;
  currentPrice: number;
  currentDiscount: number;
  minParticipants: number;
  maxParticipants?: number;
  currentParticipants: number;
  quantityPerPerson: number;
  deadline: string;
  status: GroupBuyStatus;
  isPublic: boolean;
  shareCode: string;
  deliveryOptions?: {
    pickupAvailable: boolean;
    deliveryAvailable: boolean;
    pickupLocation?: string;
    deliveryFee?: number;
  };
  participants?: GroupBuyParticipant[];
  nextTier?: {
    participantsNeeded: number;
    discount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupBuyData {
  title: string;
  description?: string;
  productId: string;
  originalPrice: number;
  minParticipants?: number;
  maxParticipants?: number;
  quantityPerPerson?: number;
  deadline: Date;
  isPublic?: boolean;
  deliveryOptions?: {
    pickupAvailable: boolean;
    deliveryAvailable: boolean;
    pickupLocation?: string;
    deliveryFee?: number;
  };
}

export interface UpdateGroupBuyData {
  title?: string;
  description?: string;
  maxParticipants?: number;
  deadline?: Date;
  isPublic?: boolean;
  deliveryOptions?: {
    pickupAvailable: boolean;
    deliveryAvailable: boolean;
    pickupLocation?: string;
    deliveryFee?: number;
  };
}

export interface JoinGroupBuyData {
  quantity?: number;
  deliveryPreference?: 'pickup' | 'delivery';
  deliveryAddress?: {
    address: string;
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface QueryGroupBuysParams {
  status?: GroupBuyStatus;
  productId?: string;
  category?: string;
  nearMe?: boolean;
  lat?: number;
  lng?: number;
  limit?: number;
  offset?: number;
}

// Helper to unwrap API response
function unwrap<T>(response: any): T {
  if (response && response.success !== undefined && response.data !== undefined) {
    return response.data;
  }
  return response;
}

export const groupBuyingService = {
  // Get discount tiers
  async getTiers(): Promise<GroupBuyTier[]> {
    const response = await apiClient.get<any>('/group-buying/tiers');
    // Response is { success: true, data: tiers[] }
    return unwrap<GroupBuyTier[]>(response);
  },

  // Create a new group buy
  async create(data: CreateGroupBuyData): Promise<GroupBuy> {
    const response = await apiClient.post<any>('/group-buying', data);
    return unwrap<GroupBuy>(response);
  },

  // Get all active group buys
  async getAll(params?: QueryGroupBuysParams): Promise<{ groupBuys: GroupBuy[]; total: number }> {
    const response = await apiClient.get<any>('/group-buying', { params });
    // Response is { success: true, data: { groupBuys: [...], total: number } }
    const unwrapped = unwrap<{ groupBuys: GroupBuy[]; total: number }>(response);
    return {
      groupBuys: Array.isArray(unwrapped?.groupBuys) ? unwrapped.groupBuys : [],
      total: unwrapped?.total ?? 0,
    };
  },

  // Get my group buys
  async getMyGroupBuys(): Promise<{ organized: GroupBuy[]; joined: GroupBuy[] }> {
    const response = await apiClient.get<any>('/group-buying/my');
    const unwrapped = unwrap<{ organized: GroupBuy[]; joined: GroupBuy[] }>(response);
    return {
      organized: Array.isArray(unwrapped?.organized) ? unwrapped.organized : [],
      joined: Array.isArray(unwrapped?.joined) ? unwrapped.joined : [],
    };
  },

  // Get group buy by ID
  async getById(id: string): Promise<GroupBuy> {
    if (!id) {
      throw new Error('Group buy ID is required');
    }
    const response = await apiClient.get<any>(`/group-buying/${id}`);
    return unwrap<GroupBuy>(response);
  },

  // Get group buy by share code
  async getByShareCode(shareCode: string): Promise<GroupBuy> {
    const response = await apiClient.get<any>(`/group-buying/code/${shareCode}`);
    return unwrap<GroupBuy>(response);
  },

  // Update group buy
  async update(id: string, data: UpdateGroupBuyData): Promise<GroupBuy> {
    const response = await apiClient.put<any>(`/group-buying/${id}`, data);
    return unwrap<GroupBuy>(response);
  },

  // Join a group buy
  async join(id: string, data?: JoinGroupBuyData): Promise<GroupBuyParticipant> {
    const response = await apiClient.post<any>(`/group-buying/${id}/join`, data || {});
    return unwrap<GroupBuyParticipant>(response);
  },

  // Leave a group buy
  async leave(id: string): Promise<void> {
    await apiClient.delete(`/group-buying/${id}/leave`);
  },

  // Pay for group buy
  async pay(id: string, paymentReference: string, amount: number): Promise<GroupBuyParticipant> {
    const response = await apiClient.post<any>(`/group-buying/${id}/pay`, {
      paymentReference,
      amount,
    });
    return unwrap<GroupBuyParticipant>(response);
  },

  // Cancel group buy (organizer only)
  async cancel(id: string): Promise<GroupBuy> {
    const response = await apiClient.delete<any>(`/group-buying/${id}`);
    return unwrap<GroupBuy>(response);
  },

  // Get participants
  async getParticipants(id: string): Promise<GroupBuyParticipant[]> {
    if (!id) {
      return [];
    }
    const response = await apiClient.get<any>(`/group-buying/${id}/participants`);
    return unwrap<GroupBuyParticipant[]>(response);
  },

  // Helper: Format price with currency
  formatPrice(price: number): string {
    return `₦${price.toLocaleString()}`;
  },

  // Helper: Format discount
  formatDiscount(discount: number): string {
    return `${discount}% OFF`;
  },

  // Helper: Get time remaining until deadline
  getTimeRemaining(deadline: string): { days: number; hours: number; minutes: number; isExpired: boolean } {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, isExpired: false };
  },

  // Helper: Format time remaining as string
  formatTimeRemaining(deadline: string): string {
    const { days, hours, minutes, isExpired } = this.getTimeRemaining(deadline);
    
    if (isExpired) return 'Ended';
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  },

  // Helper: Get progress percentage
  getProgress(current: number, min: number): number {
    return Math.min((current / min) * 100, 100);
  },

  // Helper: Get status color
  getStatusColor(status: GroupBuyStatus): string {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'success':
        return '#3B82F6';
      case 'failed':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  },
};

export default groupBuyingService;
