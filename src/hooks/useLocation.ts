import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { DELIVERY_CONFIG } from '../constants/config';

interface LocationState {
  location: Location.LocationObject | null;
  error: string | null;
  loading: boolean;
}

interface SimpleLocation {
  latitude: number;
  longitude: number;
}

/**
 * Hook to get current user location (one-time)
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    loading: true,
  });
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const getLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setState({
          location: null,
          error: 'Location permission denied',
          loading: false,
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setState({
        location,
        error: null,
        loading: false,
      });
    } catch (error: any) {
      setState({
        location: null,
        error: error.message || 'Failed to get location',
        loading: false,
      });
    }
  }, []);

  const startWatching = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          error: 'Location permission denied',
        }));
        return;
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: DELIVERY_CONFIG.ETA_UPDATE_INTERVAL_MS,
          distanceInterval: 10,
        },
        (newLocation) => {
          setState({
            location: newLocation,
            error: null,
            loading: false,
          });
        }
      );
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to start location tracking',
      }));
    }
  }, []);

  const stopWatching = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const getDistanceFromLocation = useCallback((target: SimpleLocation): number | null => {
    if (!state.location) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (target.latitude - state.location.coords.latitude) * (Math.PI / 180);
    const dLon = (target.longitude - state.location.coords.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(state.location.coords.latitude * (Math.PI / 180)) *
        Math.cos(target.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [state.location]);

  // Simplified location getter
  const location = state.location ? {
    latitude: state.location.coords.latitude,
    longitude: state.location.coords.longitude,
  } : null;

  useEffect(() => {
    getLocation();
    return () => {
      stopWatching();
    };
  }, [getLocation, stopWatching]);

  return { 
    ...state, 
    location,
    refresh: getLocation,
    startWatching,
    stopWatching,
    getDistanceFromLocation,
  };
}

/**
 * Hook for continuous location tracking (for riders)
 */
export function useLocationTracking(
  enabled: boolean,
  onLocationUpdate?: (location: Location.LocationObject) => void
) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    try {
      const { status: foregroundStatus } = 
        await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setError('Foreground location permission denied');
        return;
      }

      // Request background permission for riders
      const { status: backgroundStatus } = 
        await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission denied');
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: DELIVERY_CONFIG.ETA_UPDATE_INTERVAL_MS,
          distanceInterval: 10, // 10 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          setError(null);
          onLocationUpdate?.(newLocation);
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to start location tracking');
    }
  }, [onLocationUpdate]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, startTracking, stopTracking]);

  return { location, error, startTracking, stopTracking };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance (rough approximation)
 */
export function estimateTravelTime(distanceKm: number, trafficFactor: number = 1.2): number {
  // Assuming average speed of 30 km/h in city with traffic
  const avgSpeedKmH = 30 / trafficFactor;
  const timeHours = distanceKm / avgSpeedKmH;
  return Math.ceil(timeHours * 60); // Return in minutes
}
