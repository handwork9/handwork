import { apiClient } from './apiClient';
import { offlineCacheService } from './offlineCacheService';
import { Cart, Product } from '../types';

interface BackendCart {
  items: Array<{
    productId: string;
    quantity: number;
    title: string;
    price: number;
    unit: string;
    farmerId: string;
    farmerName: string;
    pickupLat?: number;
    pickupLng?: number;
    pickupState?: string;
  }>;
  total: number;
  itemCount: number;
}

// Helper to extract data from wrapped response
const extractData = <T>(response: any): T => {
  if (response && response.success && response.data !== undefined) {
    return response.data;
  }
  return response;
};

export const cartService = {
  /**
   * Get current cart from backend with offline fallback
   */
  async getCart(): Promise<BackendCart> {
    try {
      const response = await apiClient.get<any>('/cart');
      const cart = extractData<BackendCart>(response);
      
      // Cache cart for offline use
      await offlineCacheService.cacheCart(cart);
      
      return cart;
    } catch (error) {
      // Try cached cart if network fails
      const cachedCart = await offlineCacheService.getCachedCart();
      if (cachedCart) {
        console.log('Using cached cart due to network error');
        return cachedCart;
      }
      throw error;
    }
  },

  /**
   * Add item to cart (POST /cart)
   * Queues action offline if network unavailable
   */
  async addToCart(productId: string, quantity: number, farmerId?: string): Promise<BackendCart> {
    const isOnline = offlineCacheService.getIsOnline();
    
    if (!isOnline) {
      // Queue for later sync
      await offlineCacheService.addPendingAction({
        type: 'ADD_TO_CART',
        payload: { productId, quantity, farmerId },
      });
      
      // Update local cache optimistically
      const cachedCart = await offlineCacheService.getCachedCart();
      if (cachedCart) {
        // This is a simplified optimistic update
        return cachedCart;
      }
      throw new Error('Cannot add to cart while offline');
    }
    
    const response = await apiClient.post<any>('/cart', { productId, quantity });
    const cart = extractData<BackendCart>(response);
    
    // Update cache
    await offlineCacheService.cacheCart(cart);
    
    return cart;
  },

  /**
   * Update cart item quantity (PUT /cart)
   */
  async updateQuantity(productId: string, quantity: number): Promise<BackendCart> {
    const isOnline = offlineCacheService.getIsOnline();
    
    if (!isOnline) {
      await offlineCacheService.addPendingAction({
        type: 'UPDATE_CART_QUANTITY',
        payload: { productId, quantity },
      });
      
      const cachedCart = await offlineCacheService.getCachedCart();
      if (cachedCart) {
        return cachedCart;
      }
      throw new Error('Cannot update cart while offline');
    }
    
    const response = await apiClient.put<any>('/cart', { productId, quantity });
    const cart = extractData<BackendCart>(response);
    
    await offlineCacheService.cacheCart(cart);
    
    return cart;
  },

  /**
   * Remove item from cart (DELETE /cart/:productId)
   */
  async removeFromCart(productId: string): Promise<BackendCart> {
    const isOnline = offlineCacheService.getIsOnline();
    
    if (!isOnline) {
      await offlineCacheService.addPendingAction({
        type: 'REMOVE_FROM_CART',
        payload: { cartItemId: productId },
      });
      
      const cachedCart = await offlineCacheService.getCachedCart();
      if (cachedCart) {
        return cachedCart;
      }
      throw new Error('Cannot remove from cart while offline');
    }
    
    const response = await apiClient.delete<any>(`/cart/${productId}`);
    const cart = extractData<BackendCart>(response);
    
    await offlineCacheService.cacheCart(cart);
    
    return cart;
  },

  /**
   * Clear entire cart (DELETE /cart)
   */
  async clearCart(): Promise<void> {
    await apiClient.delete('/cart');
    
    // Clear cached cart
    await offlineCacheService.cacheCart({ items: [], total: 0, itemCount: 0 });
  },
};

