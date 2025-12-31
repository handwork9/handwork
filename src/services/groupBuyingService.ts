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
  firstName: string;
  lastName: string;
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

export const groupBuyingService = {
  // Get discount tiers
  async getTiers(): Promise<GroupBuyTier[]> {
    const response = await apiClient.get('/group-buying/tiers');
    return response.data.data;
  },

  // Create a new group buy
  async create(data: CreateGroupBuyData): Promise<GroupBuy> {
    const response = await apiClient.post('/group-buying', data);
    return response.data.data;
  },

  // Get all active group buys
  async getAll(params?: QueryGroupBuysParams): Promise<{ groupBuys: GroupBuy[]; total: number }> {
    const response = await apiClient.get('/group-buying', { params });
    return { groupBuys: response.data.data, total: response.data.total };
  },

  // Get my group buys
  async getMyGroupBuys(): Promise<{ organized: GroupBuy[]; joined: GroupBuy[] }> {
    const response = await apiClient.get('/group-buying/my');
    return response.data.data;
  },

  // Get group buy by ID
  async getById(id: string): Promise<GroupBuy> {
    const response = await apiClient.get(`/group-buying/${id}`);
    return response.data.data;
  },

  // Get group buy by share code
  async getByShareCode(shareCode: string): Promise<GroupBuy> {
    const response = await apiClient.get(`/group-buying/code/${shareCode}`);
    return response.data.data;
  },

  // Update group buy
  async update(id: string, data: UpdateGroupBuyData): Promise<GroupBuy> {
    const response = await apiClient.put(`/group-buying/${id}`, data);
    return response.data.data;
  },

  // Join a group buy
  async join(id: string, data?: JoinGroupBuyData): Promise<GroupBuyParticipant> {
    const response = await apiClient.post(`/group-buying/${id}/join`, data || {});
    return response.data.data;
  },

  // Leave a group buy
  async leave(id: string): Promise<void> {
    await apiClient.delete(`/group-buying/${id}/leave`);
  },

  // Pay for group buy
  async pay(id: string, paymentReference: string, amount: number): Promise<GroupBuyParticipant> {
    const response = await apiClient.post(`/group-buying/${id}/pay`, {
      paymentReference,
      amount,
    });
    return response.data.data;
  },

  // Cancel group buy (organizer only)
  async cancel(id: string): Promise<GroupBuy> {
    const response = await apiClient.delete(`/group-buying/${id}`);
    return response.data.data;
  },

  // Get participants
  async getParticipants(id: string): Promise<GroupBuyParticipant[]> {
    const response = await apiClient.get(`/group-buying/${id}/participants`);
    return response.data.data;
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
