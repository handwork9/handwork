import apiClient from './apiClient';
import { offlineCacheService } from './offlineCacheService';
import { Product } from '../types';

export interface FavoritesResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FavoriteIdsResponse {
  productIds: string[];
}

export interface FavoriteStatusResponse {
  isFavorite: boolean;
  message?: string;
}

export interface MultipleFavoriteStatusResponse {
  favorites: Record<string, boolean>;
}

// Helper to extract data from wrapped response { success: true, data: {...} }
const extractData = <T>(response: any): T => {
  if (response && response.success && response.data !== undefined) {
    return response.data;
  }
  return response;
};

export const favoritesService = {
  /**
   * Get all favorite products with pagination
   * Uses offline cache when network unavailable
   */
  getFavorites: async (page = 1, limit = 20): Promise<FavoritesResponse> => {
    try {
      const response = await apiClient.get<any>('/favorites', {
        params: { page, limit },
      });
      const data = extractData<FavoritesResponse>(response);
      
      // Cache favorites for offline use
      if (page === 1) {
        await offlineCacheService.cacheFavorites(data.items);
      }
      
      return data;
    } catch (error) {
      // Try cached favorites
      const cachedFavorites = await offlineCacheService.getCachedFavorites();
      if (cachedFavorites && cachedFavorites.length > 0) {
        console.log('Using cached favorites due to network error');
        return {
          items: cachedFavorites,
          total: cachedFavorites.length,
          page: 1,
          limit: cachedFavorites.length,
          totalPages: 1,
        };
      }
      throw error;
    }
  },

  /**
   * Get all favorite product IDs (useful for checking favorites across product lists)
   */
  getFavoriteIds: async (): Promise<string[]> => {
    const response = await apiClient.get<any>('/favorites/ids');
    const data = extractData<FavoriteIdsResponse>(response);
    return data.productIds;
  },

  /**
   * Get total favorites count
   */
  getFavoritesCount: async (): Promise<number> => {
    const response = await apiClient.get<any>('/favorites/count');
    const data = extractData<{ count: number }>(response);
    return data.count;
  },

  /**
   * Check if a specific product is favorited
   */
  checkFavorite: async (productId: string): Promise<boolean> => {
    const response = await apiClient.get<any>(
      `/favorites/check/${productId}`
    );
    const data = extractData<FavoriteStatusResponse>(response);
    return data.isFavorite;
  },

  /**
   * Check favorite status for multiple products
   */
  checkMultipleFavorites: async (
    productIds: string[]
  ): Promise<Record<string, boolean>> => {
    if (productIds.length === 0) return {};
    const response = await apiClient.post<any>(
      '/favorites/check-multiple',
      { productIds }
    );
    const data = extractData<MultipleFavoriteStatusResponse>(response);
    return data.favorites;
  },

  /**
   * Add a product to favorites
   * Queues action offline if network unavailable
   */
  addFavorite: async (productId: string): Promise<void> => {
    const isOnline = offlineCacheService.getIsOnline();
    
    if (!isOnline) {
      await offlineCacheService.addPendingAction({
        type: 'ADD_FAVORITE',
        payload: { productId },
      });
      return;
    }
    
    await apiClient.post('/favorites', { productId });
  },

  /**
   * Toggle favorite status (add if not favorite, remove if favorite)
   */
  toggleFavorite: async (productId: string): Promise<FavoriteStatusResponse> => {
    const response = await apiClient.post<any>(
      `/favorites/toggle/${productId}`
    );
    return extractData<FavoriteStatusResponse>(response);
  },

  /**
   * Remove a product from favorites
   * Queues action offline if network unavailable
   */
  removeFavorite: async (productId: string): Promise<void> => {
    const isOnline = offlineCacheService.getIsOnline();
    
    if (!isOnline) {
      await offlineCacheService.addPendingAction({
        type: 'REMOVE_FAVORITE',
        payload: { productId },
      });
      return;
    }
    
    await apiClient.delete(`/favorites/${productId}`);
  },

  /**
   * Clear all favorites
   */
  clearAllFavorites: async (): Promise<void> => {
    await apiClient.delete('/favorites');
  },
};

export default favoritesService;
