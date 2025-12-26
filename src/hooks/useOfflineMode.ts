import { useState, useEffect, useCallback } from 'react';
import { offlineCacheService } from '../services/offlineCacheService';

interface UseOfflineOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

/**
 * Hook to track network connectivity and provide offline mode utilities
 */
export const useOfflineMode = (options?: UseOfflineOptions) => {
  const [isOnline, setIsOnline] = useState(offlineCacheService.getIsOnline());
  const [hasPendingActions, setHasPendingActions] = useState(false);

  useEffect(() => {
    // Check for pending actions on mount
    const checkPendingActions = async () => {
      const pending = await offlineCacheService.getPendingActions();
      setHasPendingActions(pending.length > 0);
    };
    checkPendingActions();

    // Subscribe to connectivity changes
    const unsubscribe = offlineCacheService.addConnectivityListener((online) => {
      setIsOnline(online);
      
      if (online) {
        options?.onOnline?.();
        // Re-check pending actions after sync
        setTimeout(checkPendingActions, 2000);
      } else {
        options?.onOffline?.();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [options]);

  const syncPendingActions = useCallback(async () => {
    if (!isOnline) return { success: 0, failed: 0 };
    const result = await offlineCacheService.syncPendingActions();
    const pending = await offlineCacheService.getPendingActions();
    setHasPendingActions(pending.length > 0);
    return result;
  }, [isOnline]);

  const addPendingAction = useCallback(async (action: Parameters<typeof offlineCacheService.addPendingAction>[0]) => {
    await offlineCacheService.addPendingAction(action);
    setHasPendingActions(true);
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    hasPendingActions,
    syncPendingActions,
    addPendingAction,
    offlineCacheService,
  };
};

/**
 * Hook for fetching data with offline cache fallback
 */
export const useOfflineData = <T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  cacheFn: (data: T) => Promise<void>,
  getCacheFn: () => Promise<T | null>
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const { isOnline } = useOfflineMode();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isOnline) {
        // Try to fetch fresh data
        const freshData = await fetchFn();
        setData(freshData);
        setIsFromCache(false);
        // Cache the fresh data
        await cacheFn(freshData);
      } else {
        // Offline - try to get from cache
        const cachedData = await getCacheFn();
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);
        } else {
          throw new Error('No cached data available offline');
        }
      }
    } catch (err) {
      // If online fetch fails, try cache as fallback
      try {
        const cachedData = await getCacheFn();
        if (cachedData) {
          setData(cachedData);
          setIsFromCache(true);
        } else {
          setError(err as Error);
        }
      } catch (cacheErr) {
        setError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, fetchFn, cacheFn, getCacheFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    refetch: fetchData,
  };
};

export default useOfflineMode;
