import { useEffect, useRef, useCallback, useState } from 'react';
import { socketService } from '../services/socketService';
import { SocketEvent } from '../types';

/**
 * Hook to subscribe to order updates via WebSocket
 */
export function useOrderSubscription(
  orderId: string | undefined,
  onUpdate: (event: SocketEvent) => void
) {
  const handlerRef = useRef(onUpdate);
  handlerRef.current = onUpdate;

  useEffect(() => {
    if (!orderId) return;

    const handler = (event: SocketEvent) => {
      handlerRef.current(event);
    };

    socketService.subscribeToOrder(orderId, handler);

    return () => {
      socketService.unsubscribeFromOrder(orderId, handler);
    };
  }, [orderId]);
}

/**
 * Hook to subscribe to rider location updates
 */
export function useRiderLocationSubscription(
  riderId: string | undefined,
  onUpdate: (location: { lat: number; lng: number }) => void
) {
  const handlerRef = useRef(onUpdate);
  handlerRef.current = onUpdate;

  useEffect(() => {
    if (!riderId) return;

    const handler = (location: { lat: number; lng: number }) => {
      handlerRef.current(location);
    };

    socketService.subscribeToRiderLocation(riderId, handler);

    return () => {
      socketService.unsubscribeFromRiderLocation(riderId, handler);
    };
  }, [riderId]);
}

/**
 * Hook to manage WebSocket connection lifecycle
 */
export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Set up connection status monitoring
    const checkConnection = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 5000);

    return () => {
      clearInterval(checkConnection);
    };
  }, []);

  return { isConnected, connect, disconnect };
}

/**
 * Main socket hook for riders and general socket operations
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const checkConnection = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 5000);

    return () => {
      clearInterval(checkConnection);
    };
  }, []);

  const sendLocationUpdate = useCallback((data: {
    orderId: string;
    latitude: number;
    longitude: number;
  }) => {
    socketService.emit('rider:location_update', data);
  }, []);

  const subscribeToOrder = useCallback((orderId: string, handler: (event: SocketEvent) => void) => {
    socketService.subscribeToOrder(orderId, handler);
    return () => socketService.unsubscribeFromOrder(orderId, handler);
  }, []);

  return {
    isConnected,
    sendLocationUpdate,
    subscribeToOrder,
    connect: () => socketService.connect(),
    disconnect: () => socketService.disconnect(),
  };
}
