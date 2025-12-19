import { apiClient } from './apiClient';
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
   * Get current cart from backend
   */
  async getCart(): Promise<BackendCart> {
    const response = await apiClient.get<any>('/cart');
    return extractData<BackendCart>(response);
  },

  /**
   * Add item to cart (POST /cart)
   */
  async addToCart(productId: string, quantity: number): Promise<BackendCart> {
    const response = await apiClient.post<any>('/cart', { productId, quantity });
    return extractData<BackendCart>(response);
  },

  /**
   * Update cart item quantity (PUT /cart)
   */
  async updateQuantity(productId: string, quantity: number): Promise<BackendCart> {
    const response = await apiClient.put<any>('/cart', { productId, quantity });
    return extractData<BackendCart>(response);
  },

  /**
   * Remove item from cart (DELETE /cart/:productId)
   */
  async removeFromCart(productId: string): Promise<BackendCart> {
    const response = await apiClient.delete<any>(`/cart/${productId}`);
    return extractData<BackendCart>(response);
  },

  /**
   * Clear entire cart (DELETE /cart)
   */
  async clearCart(): Promise<void> {
    await apiClient.delete('/cart');
  },
};
