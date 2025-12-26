import { apiClient } from './apiClient';
import { offlineCacheService } from './offlineCacheService';
import {
  Product,
  ProductFilters,
  ApiResponse,
  PaginatedResponse,
} from '../types';

interface ProductQueryParams extends ProductFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
}

// Helper to extract data from wrapped response { success: true, data: {...} }
const extractData = <T>(response: any): T => {
  if (response && response.success && response.data !== undefined) {
    return response.data;
  }
  return response;
};

export const productService = {
  /**
   * Get products with filters and pagination
   * Uses offline cache when network is unavailable
   */
  async getProducts(
    filters: ProductQueryParams = {}
  ): Promise<{ products: Product[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.subcategory) params.append('subcategory', filters.subcategory);
    if (filters.state) params.append('state', filters.state);
    if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
    if (filters.lat) params.append('lat', filters.lat.toString());
    if (filters.lng) params.append('lng', filters.lng.toString());
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.filter) params.append('filter', filters.filter);
    if (filters.verifiedOnly) params.append('verifiedOnly', 'true');

    try {
      const response = await apiClient.get<any>(`/products?${params.toString()}`);
      const data = extractData<{ data: Product[]; total: number }>(response);
      
      // Map backend response to expected format - filter out invalid products
      const validProducts = (data.data || []).filter((p: any) => p != null && p.id != null);
      const result = {
        products: validProducts,
        total: data.total || validProducts.length,
      };
      
      // Cache products for offline use (only cache first page without filters for simplicity)
      if (!filters.page || filters.page === 1) {
        await offlineCacheService.cacheProducts(validProducts);
      }
      
      return result;
    } catch (error) {
      // Try to return cached products if available
      const cachedProducts = await offlineCacheService.getCachedProducts();
      if (cachedProducts && cachedProducts.length > 0) {
        console.log('Using cached products due to network error');
        return {
          products: cachedProducts,
          total: cachedProducts.length,
        };
      }
      throw error;
    }
  },

  /**
   * Get farmer's own products
   */
  async getMyProducts(): Promise<{ products: Product[]; total: number }> {
    try {
      const response = await apiClient.get<any>('/products/farmer/my-products');
      const data = extractData<{ data: Product[]; total: number }>(response);
      
      // Filter out invalid products
      const validProducts = (data.data || []).filter((p: any) => p != null && p.id != null);
      const result = {
        products: validProducts,
        total: data.total || validProducts.length,
      };
      
      // Cache farmer products
      await offlineCacheService.cacheFarmerProducts(validProducts);
      
      return result;
    } catch (error) {
      // Try cached farmer products
      const cachedProducts = await offlineCacheService.getCachedFarmerProducts();
      if (cachedProducts && cachedProducts.length > 0) {
        console.log('Using cached farmer products due to network error');
        return {
          products: cachedProducts,
          total: cachedProducts.length,
        };
      }
      throw error;
    }
  },

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<any>(`/products/${id}`);
    return extractData<Product>(response);
  },

  /**
   * Get products from verified sellers
   */
  async getVerifiedSellerProducts(state?: string, limit = 20): Promise<{ products: Product[]; total: number }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get<any>(`/products/verified-sellers?${params.toString()}`);
    const data = extractData<Product[]>(response);
    
    return {
      products: Array.isArray(data) ? data : [],
      total: Array.isArray(data) ? data.length : 0,
    };
  },

  /**
   * Create a new product (Farmer only)
   */
  async createProduct(data: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.post('/products', data);
  },

  /**
   * Update a product (Farmer only)
   */
  async updateProduct(id: string, data: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.put(`/products/${id}`, data);
  },

  /**
   * Delete a product (Farmer only)
   */
  async deleteProduct(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/products/${id}`);
  },

  /**
   * Get farmer's products
   */
  async getFarmerProducts(
    farmerId: string,
    page?: number,
    pageSize?: number
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    
    return apiClient.get(`/farmers/profile/${farmerId}/products?${params.toString()}`);
  },

  /**
   * Upload product images
   */
  async uploadImages(productId: string, images: FormData): Promise<ApiResponse<{ urls: string[] }>> {
    return apiClient.upload(`/products/${productId}/images`, images);
  },

  /**
   * Get product categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    return apiClient.get('/products/categories');
  },

  /**
   * Get promoted/sponsored products
   */
  async getPromotedProducts(state?: string, limit = 10): Promise<{ products: Product[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get<any>(`/products/promoted?${params.toString()}`);
    const data = extractData<Product[]>(response);
    
    return {
      products: Array.isArray(data) ? data : [],
    };
  },

  /**
   * Get admin-curated official store products
   */
  async getAdminProducts(state?: string, limit = 10): Promise<{ products: Product[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get<any>(`/products/admin-products?${params.toString()}`);
    const data = extractData<Product[]>(response);
    
    return {
      products: Array.isArray(data) ? data : [],
    };
  },

  /**
   * Get recommended products
   */
  async getRecommendedProducts(state?: string, limit = 20): Promise<{ products: Product[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get<any>(`/products/recommended?${params.toString()}`);
    const data = extractData<Product[]>(response);
    
    return {
      products: Array.isArray(data) ? data : [],
    };
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(state?: string, limit = 10): Promise<{ products: Product[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get<any>(`/products/featured?${params.toString()}`);
    const data = extractData<Product[]>(response);
    
    return {
      products: Array.isArray(data) ? data : [],
    };
  },

  /**
   * Get sponsored products from verified/premium sellers
   * These are products from farmers who paid for subscription
   */
  async getSponsoredProducts(state?: string, limit = 12): Promise<{ products: Product[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get<any>(`/products/sponsored?${params.toString()}`);
    const data = extractData<Product[]>(response);
    
    return {
      products: Array.isArray(data) ? data : [],
    };
  },

  /**
   * Get products from premium sellers only
   */
  async getPremiumSellerProducts(state?: string, limit = 10): Promise<{ products: Product[] }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (limit) params.append('limit', limit.toString());
    
    const response = await apiClient.get<any>(`/products/premium-sellers?${params.toString()}`);
    const data = extractData<Product[]>(response);
    
    return {
      products: Array.isArray(data) ? data : [],
    };
  },

  /**
   * Track a product view for recommendation engine
   * Called when user views a product detail page
   */
  async trackProductView(productId: string): Promise<void> {
    try {
      await apiClient.post(`/recommendations/track-view/${productId}`, {});
    } catch (error) {
      // Silently fail - this is a non-critical operation
      console.debug('Failed to track product view:', error);
    }
  },

  /**
   * Get similar products based on purchase patterns
   * "Users who bought this also bought..."
   */
  async getSimilarProducts(productId: string, limit = 10): Promise<{ products: Product[] }> {
    try {
      const response = await apiClient.get<any>(`/recommendations/similar/${productId}?limit=${limit}`);
      const data = extractData<Product[]>(response);
      
      return {
        products: Array.isArray(data) ? data : [],
      };
    } catch (error) {
      console.debug('Failed to get similar products:', error);
      return { products: [] };
    }
  },
};
