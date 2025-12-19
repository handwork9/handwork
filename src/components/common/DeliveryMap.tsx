import React, { useRef, useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only import MapView if not in Expo Go (to avoid crashes)
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_DEFAULT: any = null;

if (!isExpoGo) {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
  } catch (e) {
    console.warn('react-native-maps not available');
  }
}

// Error boundary to catch map crashes
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Map error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface Location {
  latitude: number;
  longitude: number;
}

interface DeliveryMapProps {
  pickupLocation: Location;
  deliveryLocation: Location;
  riderLocation?: Location | null;
  currentStep: 'accepted' | 'picked_up' | 'in_transit' | 'delivered';
  onMapReady?: () => void;
}

export function DeliveryMap({
  pickupLocation,
  deliveryLocation,
  riderLocation,
  currentStep,
  onMapReady,
}: DeliveryMapProps) {
  const mapRef = useRef<any>(null);

  // Convert string coordinates to numbers (backend sometimes sends strings)
  const normalizeLocation = (loc: Location | null | undefined): Location | null => {
    if (!loc) return null;
    return {
      latitude: typeof loc.latitude === 'string' ? parseFloat(loc.latitude) : loc.latitude,
      longitude: typeof loc.longitude === 'string' ? parseFloat(loc.longitude) : loc.longitude,
    };
  };

  const pickup = normalizeLocation(pickupLocation);
  const delivery = normalizeLocation(deliveryLocation);
  const rider = normalizeLocation(riderLocation);

  // Debug log
  console.log('[DeliveryMap] Normalized Locations:', {
    pickup,
    delivery,
    rider,
  });

  // Validate locations
  const isValidLocation = (loc: Location | null | undefined): loc is Location => {
    return loc != null && 
           typeof loc.latitude === 'number' && 
           typeof loc.longitude === 'number' &&
           !isNaN(loc.latitude) && 
           !isNaN(loc.longitude) &&
           loc.latitude !== 0 &&
           loc.longitude !== 0;
  };

  const validPickup = isValidLocation(pickup);
  const validDelivery = isValidLocation(delivery);
  const validRider = isValidLocation(rider);

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current && validPickup && validDelivery && pickup && delivery) {
      const coordinates = [pickup, delivery];
      if (validRider && rider) {
        coordinates.push(rider);
      }
      
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [validPickup, validDelivery, validRider, currentStep]);

  // Fallback component for Expo Go or when map is not available
  const renderFallbackMap = () => (
    <View style={[styles.container, styles.fallback]}>
      <Ionicons name="map-outline" size={48} color="#666" />
      <Text style={styles.fallbackText}>
        {isExpoGo ? 'Map requires Development Build' : 'Map not available'}
      </Text>
      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#FF9800' }]} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationCoords}>
              {validPickup && pickup
                ? `${pickup.latitude.toFixed(4)}, ${pickup.longitude.toFixed(4)}` 
                : 'Not available'}
            </Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationLabel}>Delivery</Text>
            <Text style={styles.locationCoords}>
              {validDelivery && delivery
                ? `${delivery.latitude.toFixed(4)}, ${delivery.longitude.toFixed(4)}` 
                : 'Not available'}
            </Text>
          </View>
        </View>
        {validRider && rider && (
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#2196F3' }]} />
            <View style={styles.locationDetails}>
              <Text style={styles.locationLabel}>Your Location</Text>
              <Text style={styles.locationCoords}>
                {`${rider.latitude.toFixed(4)}, ${rider.longitude.toFixed(4)}`}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // If locations are invalid, show fallback
  if (!validPickup || !validDelivery || !pickup || !delivery) {
    return renderFallbackMap();
  }

  // If running in Expo Go or MapView is not available, show fallback
  if (isExpoGo || !MapView) {
    return renderFallbackMap();
  }

  // Calculate initial region
  const getInitialRegion = () => {
    const lat = (pickup.latitude + delivery.latitude) / 2;
    const lng = (pickup.longitude + delivery.longitude) / 2;
    const latDelta = Math.abs(pickup.latitude - delivery.latitude) * 1.5 + 0.01;
    const lngDelta = Math.abs(pickup.longitude - delivery.longitude) * 1.5 + 0.01;
    
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

  return (
    <MapErrorBoundary fallback={renderFallbackMap()}>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={getInitialRegion()}
          onMapReady={onMapReady}
          showsUserLocation={false}
          showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
        mapType="standard"
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        onPress={() => {}}
        onPoiClick={() => {}}
      >
        {/* Route line */}
        <Polyline
          coordinates={[pickup, delivery]}
          strokeColor="#2196F3"
          strokeWidth={3}
          lineDashPattern={[10, 5]}
        />

        {/* Pickup marker */}
        <Marker
          coordinate={pickup}
          onCalloutPress={() => {}} 
          onPress={() => {}}
          tracksViewChanges={false}
        >
          <View style={[styles.markerContainer, { backgroundColor: '#FF9800' }]}>
            <Text style={styles.markerIcon}>P</Text>
          </View>
        </Marker>

        {/* Delivery marker */}
        <Marker
          coordinate={delivery}
          onCalloutPress={() => {}}
          onPress={() => {}}
          tracksViewChanges={false}
        >
          <View style={[styles.markerContainer, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.markerIcon}>D</Text>
          </View>
        </Marker>

        {/* Rider marker */}
        {validRider && rider && (
          <Marker
            coordinate={rider}
            onCalloutPress={() => {}}
            onPress={() => {}}
            tracksViewChanges={false}
          >
            <View style={[styles.markerContainer, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.markerIcon}>R</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Pickup</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Delivery</Text>
        </View>
        {validRider && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>You</Text>
          </View>
        )}
      </View>
      </View>
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  map: {
    flex: 1,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
  },
  locationCoords: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  legend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#333',
  },
});

export default DeliveryMap;
