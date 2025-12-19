import apiClient from './apiClient';
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
   */
  getFavorites: async (page = 1, limit = 20): Promise<FavoritesResponse> => {
    const response = await apiClient.get<any>('/favorites', {
      params: { page, limit },
    });
    return extractData<FavoritesResponse>(response);
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
   */
  addFavorite: async (productId: string): Promise<void> => {
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
   */
  removeFavorite: async (productId: string): Promise<void> => {
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
