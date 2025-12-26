import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { API_CONFIG } from '../constants/config';

// Cache keys
const CACHE_KEYS = {
  PRODUCTS: 'offline_products',
  CATEGORIES: 'offline_categories',
  USER_PROFILE: 'offline_user_profile',
  CART: 'offline_cart',
  FAVORITES: 'offline_favorites',
  ADDRESSES: 'offline_addresses',
  ORDERS: 'offline_orders',
  CONVERSATIONS: 'offline_conversations',
  WALLET_BALANCE: 'offline_wallet_balance',
  FARMER_PRODUCTS: 'offline_farmer_products',
  FARMER_ORDERS: 'offline_farmer_orders',
  RIDER_DELIVERIES: 'offline_rider_deliveries',
  PENDING_ACTIONS: 'offline_pending_actions',
  CACHE_TIMESTAMPS: 'offline_cache_timestamps',
};

// Cache expiry times (in milliseconds)
const CACHE_EXPIRY = {
  PRODUCTS: 30 * 60 * 1000, // 30 minutes
  CATEGORIES: 60 * 60 * 1000, // 1 hour
  USER_PROFILE: 60 * 60 * 1000, // 1 hour
  CART: 7 * 24 * 60 * 60 * 1000, // 7 days (cart should persist longer)
  FAVORITES: 24 * 60 * 60 * 1000, // 24 hours
  ADDRESSES: 7 * 24 * 60 * 60 * 1000, // 7 days
  ORDERS: 15 * 60 * 1000, // 15 minutes
  CONVERSATIONS: 5 * 60 * 1000, // 5 minutes
  WALLET_BALANCE: 5 * 60 * 1000, // 5 minutes
  FARMER_PRODUCTS: 15 * 60 * 1000, // 15 minutes
  FARMER_ORDERS: 10 * 60 * 1000, // 10 minutes
  RIDER_DELIVERIES: 5 * 60 * 1000, // 5 minutes
};

interface CacheTimestamps {
  [key: string]: number;
}

interface PendingAction {
  id: string;
  type: 'ADD_TO_CART' | 'REMOVE_FROM_CART' | 'UPDATE_CART_QUANTITY' | 'ADD_FAVORITE' | 'REMOVE_FAVORITE' | 'UPDATE_ORDER_STATUS';
  payload: any;
  timestamp: number;
}

class OfflineCacheService {
  private isOnline: boolean = true;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private appStateSubscription: any = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initNetworkListener();
  }

  // Initialize network state listener using AppState and polling
  private async initNetworkListener() {
    // Initial check
    await this.checkNetworkStatus();
    
    // Check on app state changes (foreground/background)
    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        await this.checkNetworkStatus();
      }
    });
    
    // Also poll periodically (every 10 seconds) when app is active
    this.checkInterval = setInterval(async () => {
      if (AppState.currentState === 'active') {
        await this.checkNetworkStatus();
      }
    }, 10000);
  }

  // Add a listener for connectivity changes
  addConnectivityListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get current online status
  getIsOnline(): boolean {
    return this.isOnline;
  }

  // Check network status by pinging the health endpoint
  async checkNetworkStatus(): Promise<boolean> {
    try {
      // Use a lightweight health check endpoint with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      // Notify listeners if status changed
      if (wasOnline !== this.isOnline) {
        this.listeners.forEach(listener => listener(this.isOnline));
        
        // If we just came back online, sync pending actions
        if (this.isOnline && !wasOnline) {
          this.syncPendingActions();
        }
      }
      
      return this.isOnline;
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      // Notify listeners if status changed
      if (wasOnline !== this.isOnline) {
        this.listeners.forEach(listener => listener(this.isOnline));
      }
      
      return false;
    }
  }

  // Get cache timestamps
  private async getCacheTimestamps(): Promise<CacheTimestamps> {
    try {
      const timestamps = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMPS);
      return timestamps ? JSON.parse(timestamps) : {};
    } catch (error) {
      console.error('Error getting cache timestamps:', error);
      return {};
    }
  }

  // Update cache timestamp
  private async updateCacheTimestamp(key: string): Promise<void> {
    try {
      const timestamps = await this.getCacheTimestamps();
      timestamps[key] = Date.now();
      await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMPS, JSON.stringify(timestamps));
    } catch (error) {
      console.error('Error updating cache timestamp:', error);
    }
  }

  // Check if cache is expired
  private async isCacheExpired(key: string, expiryTime: number): Promise<boolean> {
    try {
      const timestamps = await this.getCacheTimestamps();
      const cachedAt = timestamps[key];
      if (!cachedAt) return true;
      return Date.now() - cachedAt > expiryTime;
    } catch (error) {
      return true;
    }
  }

  // Generic cache setter
  async setCache<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      await this.updateCacheTimestamp(key);
    } catch (error) {
      console.error(`Error caching ${key}:`, error);
    }
  }

  // Generic cache getter
  async getCache<T>(key: string, expiryTime?: number): Promise<T | null> {
    try {
      // If expiry time provided, check if cache is expired
      if (expiryTime) {
        const expired = await this.isCacheExpired(key, expiryTime);
        if (expired && this.isOnline) {
          return null; // Return null to trigger fresh fetch
        }
      }

      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Error getting cached ${key}:`, error);
      return null;
    }
  }

  // Products
  async cacheProducts(products: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.PRODUCTS, products);
  }

  async getCachedProducts(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.PRODUCTS, this.isOnline ? CACHE_EXPIRY.PRODUCTS : undefined);
  }

  // Categories
  async cacheCategories(categories: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.CATEGORIES, categories);
  }

  async getCachedCategories(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.CATEGORIES, this.isOnline ? CACHE_EXPIRY.CATEGORIES : undefined);
  }

  // User Profile
  async cacheUserProfile(profile: any): Promise<void> {
    await this.setCache(CACHE_KEYS.USER_PROFILE, profile);
  }

  async getCachedUserProfile(): Promise<any | null> {
    return this.getCache(CACHE_KEYS.USER_PROFILE, this.isOnline ? CACHE_EXPIRY.USER_PROFILE : undefined);
  }

  // Cart
  async cacheCart(cart: any): Promise<void> {
    await this.setCache(CACHE_KEYS.CART, cart);
  }

  async getCachedCart(): Promise<any | null> {
    return this.getCache(CACHE_KEYS.CART, this.isOnline ? CACHE_EXPIRY.CART : undefined);
  }

  // Favorites
  async cacheFavorites(favorites: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.FAVORITES, favorites);
  }

  async getCachedFavorites(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.FAVORITES, this.isOnline ? CACHE_EXPIRY.FAVORITES : undefined);
  }

  // Addresses
  async cacheAddresses(addresses: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.ADDRESSES, addresses);
  }

  async getCachedAddresses(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.ADDRESSES, this.isOnline ? CACHE_EXPIRY.ADDRESSES : undefined);
  }

  // Orders
  async cacheOrders(orders: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.ORDERS, orders);
  }

  async getCachedOrders(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.ORDERS, this.isOnline ? CACHE_EXPIRY.ORDERS : undefined);
  }

  // Conversations
  async cacheConversations(conversations: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.CONVERSATIONS, conversations);
  }

  async getCachedConversations(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.CONVERSATIONS, this.isOnline ? CACHE_EXPIRY.CONVERSATIONS : undefined);
  }

  // Wallet Balance
  async cacheWalletBalance(balance: any): Promise<void> {
    await this.setCache(CACHE_KEYS.WALLET_BALANCE, balance);
  }

  async getCachedWalletBalance(): Promise<any | null> {
    return this.getCache(CACHE_KEYS.WALLET_BALANCE, this.isOnline ? CACHE_EXPIRY.WALLET_BALANCE : undefined);
  }

  // Farmer Products
  async cacheFarmerProducts(products: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.FARMER_PRODUCTS, products);
  }

  async getCachedFarmerProducts(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.FARMER_PRODUCTS, this.isOnline ? CACHE_EXPIRY.FARMER_PRODUCTS : undefined);
  }

  // Farmer Orders
  async cacheFarmerOrders(orders: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.FARMER_ORDERS, orders);
  }

  async getCachedFarmerOrders(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.FARMER_ORDERS, this.isOnline ? CACHE_EXPIRY.FARMER_ORDERS : undefined);
  }

  // Rider Deliveries
  async cacheRiderDeliveries(deliveries: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.RIDER_DELIVERIES, deliveries);
  }

  async getCachedRiderDeliveries(): Promise<any[] | null> {
    return this.getCache(CACHE_KEYS.RIDER_DELIVERIES, this.isOnline ? CACHE_EXPIRY.RIDER_DELIVERIES : undefined);
  }

  // Pending Actions (for offline-first features)
  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const pending = await this.getPendingActions();
      const newAction: PendingAction = {
        ...action,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      pending.push(newAction);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(pending));
    } catch (error) {
      console.error('Error adding pending action:', error);
    }
  }

  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const pending = await AsyncStorage.getItem(CACHE_KEYS.PENDING_ACTIONS);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }

  async removePendingAction(actionId: string): Promise<void> {
    try {
      const pending = await this.getPendingActions();
      const filtered = pending.filter(a => a.id !== actionId);
      await AsyncStorage.setItem(CACHE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing pending action:', error);
    }
  }

  async clearPendingActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.PENDING_ACTIONS);
    } catch (error) {
      console.error('Error clearing pending actions:', error);
    }
  }

  // Sync pending actions when back online
  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    const pending = await this.getPendingActions();
    let success = 0;
    let failed = 0;

    for (const action of pending) {
      try {
        // Import services dynamically to avoid circular dependencies
        switch (action.type) {
          case 'ADD_TO_CART':
            const cartService = require('./cartService').cartService;
            await cartService.addToCart(action.payload.productId, action.payload.quantity, action.payload.farmerId);
            break;
          case 'REMOVE_FROM_CART':
            const cartServiceRemove = require('./cartService').cartService;
            await cartServiceRemove.removeFromCart(action.payload.cartItemId);
            break;
          case 'UPDATE_CART_QUANTITY':
            const cartServiceUpdate = require('./cartService').cartService;
            await cartServiceUpdate.updateCartItemQuantity(action.payload.cartItemId, action.payload.quantity);
            break;
          case 'ADD_FAVORITE':
            const favoritesServiceAdd = require('./favoritesService').favoritesService;
            await favoritesServiceAdd.addFavorite(action.payload.productId);
            break;
          case 'REMOVE_FAVORITE':
            const favoritesServiceRemove = require('./favoritesService').favoritesService;
            await favoritesServiceRemove.removeFavorite(action.payload.productId);
            break;
          // Add more action types as needed
        }
        await this.removePendingAction(action.id);
        success++;
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  // Clear all caches (e.g., on logout)
  async clearAllCaches(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }

  // Clear user-specific caches (keep products/categories)
  async clearUserCaches(): Promise<void> {
    try {
      const userKeys = [
        CACHE_KEYS.USER_PROFILE,
        CACHE_KEYS.CART,
        CACHE_KEYS.FAVORITES,
        CACHE_KEYS.ADDRESSES,
        CACHE_KEYS.ORDERS,
        CACHE_KEYS.CONVERSATIONS,
        CACHE_KEYS.WALLET_BALANCE,
        CACHE_KEYS.FARMER_PRODUCTS,
        CACHE_KEYS.FARMER_ORDERS,
        CACHE_KEYS.RIDER_DELIVERIES,
        CACHE_KEYS.PENDING_ACTIONS,
      ];
      await AsyncStorage.multiRemove(userKeys);
    } catch (error) {
      console.error('Error clearing user caches:', error);
    }
  }

  // Cleanup on unmount
  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.listeners = [];
  }
}

// Singleton instance
export const offlineCacheService = new OfflineCacheService();

// Export cache keys for external use
export { CACHE_KEYS, CACHE_EXPIRY };

// Export types
export type { PendingAction, CacheTimestamps };
