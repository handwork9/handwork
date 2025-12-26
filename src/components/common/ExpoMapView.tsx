import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, SHADOWS } from '../../constants/theme';
import { MAP_CONFIG } from '../../constants/config';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Check if native Mapbox is available (requires dev build)
let Mapbox: any = null;
let Camera: any = null;
let MapView: any = null;
let PointAnnotation: any = null;
let ShapeSource: any = null;
let LineLayer: any = null;
let isNativeMapAvailable = false;

try {
  const rnmapbox = require('@rnmapbox/maps');
  Mapbox = rnmapbox.default;
  Camera = rnmapbox.Camera;
  MapView = rnmapbox.MapView;
  PointAnnotation = rnmapbox.PointAnnotation;
  ShapeSource = rnmapbox.ShapeSource;
  LineLayer = rnmapbox.LineLayer;
  
  // Try to set access token - this will fail if native code isn't available
  Mapbox.setAccessToken(MAP_CONFIG.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYnVsbGlvbjkiLCJhIjoiY21qZm1rNmM3MG5iZDNlczZ3Y3ZyODgzdCJ9.IGVGBctIjRag8D3Crma1ow');
  isNativeMapAvailable = true;
} catch (e) {
  console.log('Native Mapbox not available, using WebView fallback');
  isNativeMapAvailable = false;
}

interface Location {
  latitude: number;
  longitude: number;
}

interface ExpoMapViewProps {
  pickupLocation: Location;
  deliveryLocation: Location;
  riderLocation?: Location | null;
  currentStep?: 'accepted' | 'picked_up' | 'in_transit' | 'delivered';
  pickupAddress?: string;
  deliveryAddress?: string;
  onMapReady?: () => void;
  height?: number;
  showFullscreenButton?: boolean;
}

export function ExpoMapView({
  pickupLocation,
  deliveryLocation,
  riderLocation,
  currentStep,
  pickupAddress,
  deliveryAddress,
  onMapReady,
  height = 200,
  showFullscreenButton = true,
}: ExpoMapViewProps) {
  const insets = useSafeAreaInsets();
  const [showFullscreen, setShowFullscreen] = useState(false);
  const cameraRef = useRef<any>(null);
  const fullscreenCameraRef = useRef<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const lastCoordsRef = useRef<string>('');
  const initialBoundsRef = useRef<{ ne: [number, number]; sw: [number, number] } | null>(null);
  const mapReadyRef = useRef(false);
  const webviewRef = useRef<WebView>(null);

  // Normalize location data - handles strings and numbers
  const normalizeLocation = (loc: Location | null | undefined): Location | null => {
    if (!loc) return null;
    
    let lat: number;
    let lng: number;
    
    if (typeof loc.latitude === 'string') {
      lat = parseFloat(loc.latitude);
    } else if (typeof loc.latitude === 'number') {
      lat = loc.latitude;
    } else {
      return null;
    }
    
    if (typeof loc.longitude === 'string') {
      lng = parseFloat(loc.longitude);
    } else if (typeof loc.longitude === 'number') {
      lng = loc.longitude;
    } else {
      return null;
    }
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    // If coordinates are 0, use Lagos, Nigeria as default for demo
    if (lat === 0 && lng === 0) {
      return null; // Let the component show "Location not available"
    }
    
    return { latitude: lat, longitude: lng };
  };

  // Default locations for Nigeria (Lagos) - used when actual locations are not available
  const DEFAULT_PICKUP: Location = { latitude: 6.5244, longitude: 3.3792 }; // Lagos Island
  const DEFAULT_DELIVERY: Location = { latitude: 6.4541, longitude: 3.3947 }; // Victoria Island

  // Memoize locations to prevent unnecessary re-renders
  const pickup = useMemo(() => {
    const normalized = normalizeLocation(pickupLocation);
    return normalized || DEFAULT_PICKUP;
  }, [pickupLocation?.latitude, pickupLocation?.longitude]);

  const delivery = useMemo(() => {
    const normalized = normalizeLocation(deliveryLocation);
    return normalized || DEFAULT_DELIVERY;
  }, [deliveryLocation?.latitude, deliveryLocation?.longitude]);

  const rider = useMemo(() => {
    return normalizeLocation(riderLocation);
  }, [riderLocation?.latitude, riderLocation?.longitude]);

  // Check if we have valid locations (using defaults is considered valid)
  const hasValidLocations = true; // Always show map now with defaults

  // Calculate center - memoized
  const center = useMemo((): [number, number] => {
    if (!pickup || !delivery) return [3.3792, 6.5244]; // Lagos default
    return [
      (pickup.longitude + delivery.longitude) / 2,
      (pickup.latitude + delivery.latitude) / 2,
    ];
  }, [pickup, delivery]);

  // Calculate bounds - only once on initial load
  const bounds = useMemo(() => {
    // If we already have initial bounds, don't recalculate
    if (initialBoundsRef.current) return initialBoundsRef.current;
    
    if (!pickup || !delivery) return null;
    
    const lats = [pickup.latitude, delivery.latitude];
    const lngs = [pickup.longitude, delivery.longitude];
    
    if (rider) {
      lats.push(rider.latitude);
      lngs.push(rider.latitude);
    }
    
    const padding = 0.01; // Add some padding
    const calculatedBounds = {
      ne: [Math.max(...lngs) + padding, Math.max(...lats) + padding] as [number, number],
      sw: [Math.min(...lngs) - padding, Math.min(...lats) - padding] as [number, number],
    };
    
    // Store the initial bounds to prevent re-renders
    initialBoundsRef.current = calculatedBounds;
    return calculatedBounds;
  }, [pickup, delivery, rider]);

  // Fetch route from Mapbox Directions API
  useEffect(() => {
    const fetchRoute = async () => {
      if (!pickup || !delivery) return;
      
      // Create a unique key for current coordinates
      const coordsKey = `${pickup.latitude},${pickup.longitude}-${delivery.latitude},${delivery.longitude}-${rider?.latitude || 0},${rider?.longitude || 0}`;
      
      // Skip if we already fetched for these coordinates
      if (lastCoordsRef.current === coordsKey) return;
      lastCoordsRef.current = coordsKey;
      
      try {
        const coordinates = rider 
          ? `${pickup.longitude},${pickup.latitude};${rider.longitude},${rider.latitude};${delivery.longitude},${delivery.latitude}`
          : `${pickup.longitude},${pickup.latitude};${delivery.longitude},${delivery.latitude}`;
        
        const token = MAP_CONFIG.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYnVsbGlvbjkiLCJhIjoiY21qZm1rNmM3MG5iZDNlczZ3Y3ZyODgzdCJ9.IGVGBctIjRag8D3Crma1ow';
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${token}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          setRouteCoordinates(data.routes[0].geometry.coordinates);
        } else {
          // Fallback to straight line
          const fallbackCoords: [number, number][] = [
            [pickup.longitude, pickup.latitude],
          ];
          if (rider) {
            fallbackCoords.push([rider.longitude, rider.latitude]);
          }
          fallbackCoords.push([delivery.longitude, delivery.latitude]);
          setRouteCoordinates(fallbackCoords);
        }
      } catch (error) {
        console.warn('Error fetching route:', error);
        // Fallback to straight line
        if (pickup && delivery) {
          const fallbackCoords: [number, number][] = [
            [pickup.longitude, pickup.latitude],
          ];
          if (rider) {
            fallbackCoords.push([rider.longitude, rider.latitude]);
          }
          fallbackCoords.push([delivery.longitude, delivery.latitude]);
          setRouteCoordinates(fallbackCoords);
        }
      }
    };

    fetchRoute();
  }, [pickup, delivery, rider]);

  // Route GeoJSON
  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: routeCoordinates,
    },
  };

  // Custom marker component for native maps
  const MarkerView = ({ type, emoji }: { type: 'pickup' | 'delivery' | 'rider'; emoji: string }) => {
    const bgColor = type === 'pickup' ? '#FF9800' : type === 'delivery' ? '#4CAF50' : '#2196F3';
    return (
      <View style={[styles.markerContainer, { backgroundColor: bgColor }]}>
        <Text style={styles.markerEmoji}>{emoji}</Text>
      </View>
    );
  };

  // =====================
  // WebView Fallback Map
  // =====================
  const getMapboxHtml = useMemo(() => (isFullscreen: boolean = false) => {
    const mapHeight = isFullscreen ? '100vh' : `${height}px`;
    const accessToken = MAP_CONFIG.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYnVsbGlvbjkiLCJhIjoiY21qZm1rNmM3MG5iZDNlczZ3Y3ZyODgzdCJ9.IGVGBctIjRag8D3Crma1ow';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css" rel="stylesheet" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
          #map { width: 100%; height: ${mapHeight}; }
          .marker {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            font-size: 18px;
          }
          .marker-pickup { background-color: #FF9800; }
          .marker-delivery { background-color: #4CAF50; }
          .marker-rider { background-color: #2196F3; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = '${accessToken}';
          
          const pickup = ${pickup ? JSON.stringify(pickup) : 'null'};
          const delivery = ${delivery ? JSON.stringify(delivery) : 'null'};
          const rider = ${rider ? JSON.stringify(rider) : 'null'};
          
          const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [${center[0]}, ${center[1]}],
            zoom: 12,
            attributionControl: false
          });
          
          map.on('load', () => {
            // Pickup marker
            if (pickup) {
              const pickupEl = document.createElement('div');
              pickupEl.className = 'marker marker-pickup';
              pickupEl.innerHTML = '📦';
              new mapboxgl.Marker(pickupEl)
                .setLngLat([pickup.longitude, pickup.latitude])
                .addTo(map);
            }
            
            // Delivery marker
            if (delivery) {
              const deliveryEl = document.createElement('div');
              deliveryEl.className = 'marker marker-delivery';
              deliveryEl.innerHTML = '🏠';
              new mapboxgl.Marker(deliveryEl)
                .setLngLat([delivery.longitude, delivery.latitude])
                .addTo(map);
            }
            
            // Rider marker
            if (rider) {
              const riderEl = document.createElement('div');
              riderEl.className = 'marker marker-rider';
              riderEl.innerHTML = '🚴';
              new mapboxgl.Marker(riderEl)
                .setLngLat([rider.longitude, rider.latitude])
                .addTo(map);
            }
            
            // Fit bounds
            if (pickup && delivery) {
              const coordinates = [[pickup.longitude, pickup.latitude], [delivery.longitude, delivery.latitude]];
              if (rider) coordinates.push([rider.longitude, rider.latitude]);
              
              const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
              }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
              
              map.fitBounds(bounds, { padding: 50 });
            }
            
            // Fetch and draw route
            if (pickup && delivery) {
              const coords = rider
                ? pickup.longitude + ',' + pickup.latitude + ';' + rider.longitude + ',' + rider.latitude + ';' + delivery.longitude + ',' + delivery.latitude
                : pickup.longitude + ',' + pickup.latitude + ';' + delivery.longitude + ',' + delivery.latitude;
              
              fetch('https://api.mapbox.com/directions/v5/mapbox/driving/' + coords + '?geometries=geojson&access_token=' + mapboxgl.accessToken)
                .then(response => response.json())
                .then(data => {
                  if (data.routes && data.routes[0]) {
                    map.addSource('route', {
                      type: 'geojson',
                      data: {
                        type: 'Feature',
                        properties: {},
                        geometry: data.routes[0].geometry
                      }
                    });
                    
                    map.addLayer({
                      id: 'route',
                      type: 'line',
                      source: 'route',
                      layout: { 'line-join': 'round', 'line-cap': 'round' },
                      paint: { 'line-color': '#2196F3', 'line-width': 4, 'line-dasharray': [2, 1] }
                    });
                  }
                })
                .catch(console.warn);
            }
            
            // Notify React Native that map is ready
            window.ReactNativeWebView?.postMessage('mapReady');
          });
        </script>
      </body>
      </html>
    `;
  }, [pickup, delivery, rider, center, height]);

  // Memoize HTML for webview to prevent re-renders
  const mapHtml = useMemo(() => getMapboxHtml(false), [getMapboxHtml]);
  const fullscreenMapHtml = useMemo(() => getMapboxHtml(true), [getMapboxHtml]);

  // =====================
  // WebView Map Content
  // =====================
  const WebViewMapContent = useCallback(({ isFullscreen = false }: { isFullscreen?: boolean }) => {
    return (
      <WebView
        ref={webviewRef}
        style={isFullscreen ? styles.fullscreenMap : [styles.map, { height }]}
        source={{ html: isFullscreen ? fullscreenMapHtml : mapHtml }}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'mapReady' && !isFullscreen && !mapReadyRef.current) {
            mapReadyRef.current = true;
            onMapReady?.();
          }
        }}
      />
    );
  }, [height, mapHtml, fullscreenMapHtml, onMapReady]);

  // =====================
  // Native Map Content
  // =====================
  const NativeMapContent = useCallback(({ isFullscreen = false }: { isFullscreen?: boolean }) => {
    if (!isNativeMapAvailable || !MapView) return null;
    
    // Use stored bounds or calculate once
    const cameraBounds = initialBoundsRef.current;
    
    return (
      <MapView
        style={isFullscreen ? styles.fullscreenMap : [styles.map, { height }]}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={isFullscreen}
        scaleBarEnabled={false}
        onDidFinishLoadingMap={() => {
          if (!isFullscreen && !mapReadyRef.current) {
            mapReadyRef.current = true;
            onMapReady?.();
          }
        }}
      >
        <Camera
          ref={isFullscreen ? fullscreenCameraRef : cameraRef}
          centerCoordinate={center}
          zoomLevel={12}
          animationMode="moveTo"
          animationDuration={0}
        />

        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <ShapeSource id="routeSource" shape={routeGeoJSON}>
            <LineLayer
              id="routeLayer"
              style={{
                lineColor: '#2196F3',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
                lineDasharray: [2, 1],
              }}
            />
          </ShapeSource>
        )}

        {/* Pickup Marker */}
        {pickup && (
          <PointAnnotation
            id="pickup"
            coordinate={[pickup.longitude, pickup.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <MarkerView type="pickup" emoji="📦" />
          </PointAnnotation>
        )}

        {/* Delivery Marker */}
        {delivery && (
          <PointAnnotation
            id="delivery"
            coordinate={[delivery.longitude, delivery.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <MarkerView type="delivery" emoji="🏠" />
          </PointAnnotation>
        )}

        {/* Rider Marker */}
        {rider && (
          <PointAnnotation
            id="rider"
            coordinate={[rider.longitude, rider.latitude]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <MarkerView type="rider" emoji="🚴" />
          </PointAnnotation>
        )}
      </MapView>
    );
  }, [height, center, routeCoordinates, pickup, delivery, rider, onMapReady]);

  // Choose which map to render based on native availability
  const MapContent = isNativeMapAvailable ? NativeMapContent : WebViewMapContent;

  // No valid locations fallback
  if (!hasValidLocations) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.noLocationContainer}>
          <Ionicons name="location-outline" size={40} color="#999" />
          <Text style={styles.noLocationText}>Location not available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {/* Main Map View */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => setShowFullscreen(true)}
        style={styles.mapTouchable}
      >
        <MapContent />

        {/* Expand button overlay */}
        {showFullscreenButton && (
          <View style={styles.expandOverlay}>
            <Ionicons name="expand-outline" size={14} color="#fff" />
            <Text style={styles.expandText}>Tap for fullscreen</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Fullscreen Modal */}
      <Modal
        visible={showFullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFullscreen(false)}
      >
        <View style={styles.fullscreenContainer}>
          {/* Header */}
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => setShowFullscreen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Delivery Route</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Fullscreen Map */}
          <View style={styles.fullscreenContent}>
            <MapContent isFullscreen />
          </View>

          {/* Bottom info card */}
          <View style={[styles.infoCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="storefront" size={16} color="#fff" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>PICKUP</Text>
                <Text style={styles.infoAddress} numberOfLines={2}>
                  {pickupAddress || 'Pickup Location'}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            {rider && (
              <>
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#2196F3' }]}>
                    <Ionicons name="bicycle" size={16} color="#fff" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>RIDER</Text>
                    <Text style={styles.infoAddress}>En route to delivery</Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
              </>
            )}

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="home" size={16} color="#fff" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>DELIVERY</Text>
                <Text style={styles.infoAddress} numberOfLines={2}>
                  {deliveryAddress || 'Delivery Location'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowFullscreen(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mapTouchable: {
    flex: 1,
  },
  map: {
    width: '100%',
  },
  fullscreenMap: {
    flex: 1,
    width: '100%',
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noLocationText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: FONTS.medium,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...SHADOWS.medium,
  },
  markerEmoji: {
    fontSize: 18,
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 40,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    ...SHADOWS.small,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    color: '#333',
  },
  fullscreenContent: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...SHADOWS.large,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#888',
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoAddress: {
    fontSize: 14,
    color: '#333',
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  doneButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
});

export default ExpoMapView;
