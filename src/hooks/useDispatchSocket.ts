import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { dispatchSocketService, DeliveryOffer } from '../services/dispatchSocketService';
import {
  fetchRiderProfile,
  fetchActiveDelivery,
  addDeliveryOffer,
  removeDeliveryOffer,
  setDispatchConnected,
} from '../store/slices/riderSlice';

/**
 * Hook for managing dispatch socket connection for riders
 */
export function useDispatchSocket() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { profile, dispatchConnected, pendingOffers, activeDelivery } = useAppSelector(state => state.rider);
  const [isInitialized, setIsInitialized] = useState(false);

  // Connect to dispatch socket when rider is logged in
  useEffect(() => {
    if (user?.role === 'rider' && profile?.id) {
      dispatchSocketService.connect(profile.id);
      setIsInitialized(true);

      return () => {
        dispatchSocketService.disconnect();
        setIsInitialized(false);
      };
    }
  }, [user?.role, profile?.id]);

  // Fetch rider profile on mount if user is a rider
  useEffect(() => {
    if (user?.role === 'rider' && !profile) {
      dispatch(fetchRiderProfile());
    }
  }, [user?.role, profile, dispatch]);

  // Fetch active delivery on mount
  useEffect(() => {
    if (user?.role === 'rider' && profile) {
      dispatch(fetchActiveDelivery());
    }
  }, [user?.role, profile, dispatch]);

  const acceptOffer = useCallback((orderId: string) => {
    dispatchSocketService.acceptOffer(orderId);
    // Fetch active delivery after accepting
    dispatch(fetchActiveDelivery());
  }, [dispatch]);

  const declineOffer = useCallback((orderId: string, reason?: string) => {
    dispatchSocketService.declineOffer(orderId, reason);
  }, []);

  const updateLocation = useCallback((latitude: number, longitude: number) => {
    dispatchSocketService.updateLocation(latitude, longitude);
  }, []);

  const reconnect = useCallback(() => {
    if (profile?.id) {
      dispatchSocketService.connect(profile.id);
    }
  }, [profile?.id]);

  return {
    isConnected: dispatchConnected,
    isInitialized,
    pendingOffers,
    activeDelivery,
    acceptOffer,
    declineOffer,
    updateLocation,
    reconnect,
  };
}

/**
 * Hook for subscribing to specific delivery offer events
 */
export function useDeliveryOffers(onNewOffer?: (offer: DeliveryOffer) => void) {
  const { pendingOffers } = useAppSelector(state => state.rider);
  const [lastOfferCount, setLastOfferCount] = useState(0);

  useEffect(() => {
    if (onNewOffer && pendingOffers.length > lastOfferCount) {
      // New offer added
      const newOffer = pendingOffers[0];
      if (newOffer) {
        onNewOffer(newOffer);
      }
    }
    setLastOfferCount(pendingOffers.length);
  }, [pendingOffers.length, onNewOffer, lastOfferCount]);

  return pendingOffers;
}

/**
 * Hook for managing rider availability status
 */
export function useRiderAvailability() {
  const dispatch = useAppDispatch();
  const { isOnline, isAvailable, profile } = useAppSelector(state => state.rider);

  const toggleOnline = useCallback(async (online: boolean) => {
    try {
      // Call the API to update status
      const { riderService } = await import('../services/orderService');
      await riderService.toggleAvailability(online, online ? isAvailable : false);
      
      // Refresh profile
      dispatch(fetchRiderProfile());
    } catch (error) {
      console.error('Failed to toggle online status:', error);
    }
  }, [dispatch, isAvailable]);

  const toggleAvailable = useCallback(async (available: boolean) => {
    try {
      const { riderService } = await import('../services/orderService');
      await riderService.toggleAvailability(isOnline, available);
      
      dispatch(fetchRiderProfile());
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  }, [dispatch, isOnline]);

  return {
    isOnline,
    isAvailable,
    profile,
    toggleOnline,
    toggleAvailable,
  };
}
