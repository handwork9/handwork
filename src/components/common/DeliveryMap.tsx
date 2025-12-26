import React from 'react';
import { ExpoMapView } from './ExpoMapView';

interface Location {
  latitude: number;
  longitude: number;
}

interface DeliveryMapProps {
  pickupLocation: Location;
  deliveryLocation: Location;
  riderLocation?: Location | null;
  currentStep?: 'accepted' | 'picked_up' | 'in_transit' | 'delivered';
  onMapReady?: () => void;
  pickupAddress?: string;
  deliveryAddress?: string;
}

/**
 * DeliveryMap component - wrapper around ExpoMapView for rider screens
 * Uses react-native-maps which works in both Expo Go and development builds
 */
export function DeliveryMap({
  pickupLocation,
  deliveryLocation,
  riderLocation,
  currentStep,
  onMapReady,
  pickupAddress,
  deliveryAddress,
}: DeliveryMapProps) {
  return (
    <ExpoMapView
      pickupLocation={pickupLocation}
      deliveryLocation={deliveryLocation}
      riderLocation={riderLocation}
      currentStep={currentStep}
      onMapReady={onMapReady}
      pickupAddress={pickupAddress}
      deliveryAddress={deliveryAddress}
      height={250}
      showFullscreenButton={true}
    />
  );
}

export default DeliveryMap;
