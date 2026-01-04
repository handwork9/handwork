import apiClient from './apiClient';

export interface BundleItem {
  productId: string;
  productTitle: string;
  productImage?: string;
  quantity: number;
  unit: string;
  originalPrice: number;
}

export interface Bundle {
  id: string;
  title: string;
  description: string;
  items: BundleItem[];
  originalTotal: number;
  bundlePrice: number;
  discountPercentage: number;
  images: string[];
  stock: number;
  salesCount?: number;
  farmerName: string;
  farmerId: string;
  pickupState?: string;
  pickupCity?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface CreateBundleDto {
  title: string;
  description: string;
  items: {
    productId: string;
    quantity: number;
    originalPrice: number;
  }[];
  bundlePrice: number;
  images?: string[];
  stock: number;
  pickupState?: string;
  pickupCity?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateBundleDto extends Partial<CreateBundleDto> {}

class BundleService {
  /**
   * Get active bundles (for buyers)
   */
  async getActiveBundles(params?: {
    state?: string;
    city?: string;
    limit?: number;
  }): Promise<Bundle[]> {
    const response = await apiClient.get<{ success: boolean; data: Bundle[] } | Bundle[]>('/bundles', { params });
    const data = response as any;
    return data?.data || data || [];
  }

  /**
   * Get bundle by ID
   */
  async getBundleById(bundleId: string): Promise<Bundle> {
    const response = await apiClient.get<{ success: boolean; data: Bundle } | Bundle>(`/bundles/${bundleId}`);
    const data = response as any;
    return data?.data || data;
  }

  /**
   * Get farmer's own bundles
   */
  async getMyBundles(): Promise<Bundle[]> {
    const response = await apiClient.get<{ success: boolean; data: Bundle[] } | Bundle[]>('/bundles/farmer/my-bundles');
    const data = response as any;
    return data?.data || data || [];
  }

  /**
   * Create a new bundle (farmers only)
   */
  async createBundle(dto: CreateBundleDto): Promise<Bundle> {
    const response = await apiClient.post<{ success: boolean; data: Bundle } | Bundle>('/bundles', dto);
    const data = response as any;
    return data?.data || data;
  }

  /**
   * Update a bundle (farmers only)
   */
  async updateBundle(bundleId: string, dto: UpdateBundleDto): Promise<Bundle> {
    const response = await apiClient.put<{ success: boolean; data: Bundle } | Bundle>(`/bundles/${bundleId}`, dto);
    const data = response as any;
    return data?.data || data;
  }

  /**
   * Delete a bundle (farmers only)
   */
  async deleteBundle(bundleId: string): Promise<void> {
    await apiClient.delete(`/bundles/${bundleId}`);
  }

  /**
   * Calculate bundle savings
   */
  calculateSavings(bundle: Bundle): {
    savings: number;
    savingsPercentage: number;
  } {
    const savings = bundle.originalTotal - bundle.bundlePrice;
    const savingsPercentage = Math.round((savings / bundle.originalTotal) * 100);
    return { savings, savingsPercentage };
  }

  /**
   * Check if bundle is available
   */
  isBundleAvailable(bundle: Bundle): boolean {
    if (bundle.stock <= 0) return false;
    
    const now = new Date();
    if (bundle.startDate && new Date(bundle.startDate) > now) return false;
    if (bundle.endDate && new Date(bundle.endDate) < now) return false;
    
    return true;
  }

  /**
   * Get bundle time remaining (if limited time)
   */
  getTimeRemaining(bundle: Bundle): {
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  } | null {
    if (!bundle.endDate) return null;

    const now = new Date().getTime();
    const end = new Date(bundle.endDate).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      expired: false,
    };
  }
}

export const bundleService = new BundleService();
export default bundleService;
