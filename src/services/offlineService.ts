import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

const OFFLINE_DATA_PREFIX = '@offline_';
const PENDING_ACTIONS_KEY = '@pending_offline_actions';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Types for offline actions
export interface PendingAction {
  id: string;
  type: 'add_to_cart' | 'remove_from_cart' | 'update_cart' | 'add_favorite' | 'remove_favorite' | 'create_order';
  payload: any;
  createdAt: string;
  retryCount: number;
}

// Network status listener callbacks
type NetworkStatusCallback = (isConnected: boolean) => void;

class OfflineService {
  private isOnline: boolean = true;
  private listeners: Set<NetworkStatusCallback> = new Set();
  private pendingActions: PendingAction[] = [];
  private unsubscribeNetInfo: (() => void) | null = null;
  private queryClient: QueryClient | null = null;

  async initialize(queryClient: QueryClient): Promise<void> {
    this.queryClient = queryClient;

    // Setup React Query persistence
    await this.setupQueryPersistence(queryClient);

    // Load pending actions
    await this.loadPendingActions();

    // Subscribe to network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? true;

      // Notify listeners
      this.listeners.forEach(callback => callback(this.isOnline));

      // Sync when coming back online
      if (!wasOnline && this.isOnline) {
        this.syncPendingActions();
      }
    });

    // Initial network check
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? true;
  }

  private async setupQueryPersistence(queryClient: QueryClient): Promise<void> {
    const asyncStoragePersister = createAsyncStoragePersister({
      storage: AsyncStorage,
      key: 'REACT_QUERY_OFFLINE_CACHE',
      throttleTime: 1000,
    });

    await persistQueryClient({
      queryClient,
      persister: asyncStoragePersister,
      maxAge: CACHE_TTL,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Only persist certain queries
          const queryKey = query.queryKey[0] as string;
          const persistableQueries = [
            'products',
            'categories',
            'favorites',
            'cart',
            'user-profile',
            'farmer-profile',
            'recent-orders',
          ];
          return persistableQueries.some(key => queryKey.includes(key));
        },
      },
    });
  }

  // Check if currently online
  getIsOnline(): boolean {
    return this.isOnline;
  }

  // Subscribe to network status changes
  addNetworkStatusListener(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Load pending actions from storage
  private async loadPendingActions(): Promise<void> {
    try {
      const json = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
      if (json) {
        this.pendingActions = JSON.parse(json);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }

  // Save pending actions to storage
  private async savePendingActions(): Promise<void> {
    try {
      await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  // Queue an action for later execution
  async queueAction(type: PendingAction['type'], payload: any): Promise<string> {
    const action: PendingAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.pendingActions.push(action);
    await this.savePendingActions();

    return action.id;
  }

  // Get pending actions count
  getPendingActionsCount(): number {
    return this.pendingActions.length;
  }

  // Sync pending actions when online
  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline || this.pendingActions.length === 0) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;
    const actionsToRetry: PendingAction[] = [];

    for (const action of this.pendingActions) {
      try {
        await this.executeAction(action);
        success++;
      } catch (error) {
        console.error(`Failed to execute action ${action.id}:`, error);
        
        // Retry up to 3 times
        if (action.retryCount < 3) {
          actionsToRetry.push({ ...action, retryCount: action.retryCount + 1 });
        }
        failed++;
      }
    }

    // Update pending actions with only failed ones
    this.pendingActions = actionsToRetry;
    await this.savePendingActions();

    // Invalidate relevant queries
    if (success > 0 && this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ['cart'] });
      this.queryClient.invalidateQueries({ queryKey: ['favorites'] });
      this.queryClient.invalidateQueries({ queryKey: ['orders'] });
    }

    return { success, failed };
  }

  // Execute a single pending action
  private async executeAction(action: PendingAction): Promise<void> {
    const { default: apiClient } = await import('./apiClient');

    switch (action.type) {
      case 'add_to_cart':
        await apiClient.post('/cart/items', action.payload);
        break;
      case 'remove_from_cart':
        await apiClient.delete(`/cart/items/${action.payload.itemId}`);
        break;
      case 'update_cart':
        await apiClient.patch(`/cart/items/${action.payload.itemId}`, {
          quantity: action.payload.quantity,
        });
        break;
      case 'add_favorite':
        await apiClient.post('/favorites', { productId: action.payload.productId });
        break;
      case 'remove_favorite':
        await apiClient.delete(`/favorites/${action.payload.productId}`);
        break;
      case 'create_order':
        await apiClient.post('/orders', action.payload);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Cache data for offline access
  async cacheData(key: string, data: any): Promise<void> {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`${OFFLINE_DATA_PREFIX}${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Get cached data
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const json = await AsyncStorage.getItem(`${OFFLINE_DATA_PREFIX}${key}`);
      if (!json) return null;

      const cacheEntry = JSON.parse(json);
      
      // Check if cache is still valid
      if (Date.now() - cacheEntry.timestamp > CACHE_TTL) {
        await AsyncStorage.removeItem(`${OFFLINE_DATA_PREFIX}${key}`);
        return null;
      }

      return cacheEntry.data as T;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Clear all offline cache
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith(OFFLINE_DATA_PREFIX));
      await AsyncStorage.multiRemove(offlineKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    this.listeners.clear();
  }
}

export const offlineService = new OfflineService();

// React hook for network status
import { useState, useEffect } from 'react';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(offlineService.getIsOnline());

  useEffect(() => {
    const unsubscribe = offlineService.addNetworkStatusListener(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
}

export function usePendingActionsCount(): number {
  const [count, setCount] = useState(offlineService.getPendingActionsCount());

  useEffect(() => {
    // Check periodically
    const interval = setInterval(() => {
      setCount(offlineService.getPendingActionsCount());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return count;
}

export default offlineService;
