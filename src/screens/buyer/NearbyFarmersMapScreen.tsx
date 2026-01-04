import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { MAP_CONFIG, API_CONFIG } from '../../constants/config';
import { useTheme } from '../../context/ThemeContext';
import { BuyerStackParamList, Product } from '../../types';
import { productService } from '../../services/productService';
import { getProductIllustration } from '../../assets/illustrations/products';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;

// Check if native Mapbox is available
let Mapbox: any = null;
let Camera: any = null;
let MapView: any = null;
let PointAnnotation: any = null;
let isNativeMapAvailable = false;

try {
  const rnmapbox = require('@rnmapbox/maps');
  Mapbox = rnmapbox.default;
  Camera = rnmapbox.Camera;
  MapView = rnmapbox.MapView;
  PointAnnotation = rnmapbox.PointAnnotation;
  Mapbox.setAccessToken(MAP_CONFIG.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYnVsbGlvbjkiLCJhIjoiY21qZm1rNmM3MG5iZDNlczZ3Y3ZyODgzdCJ9.IGVGBctIjRag8D3Crma1ow');
  isNativeMapAvailable = true;
} catch (e) {
  isNativeMapAvailable = false;
}

interface FarmerMarker {
  id: string;
  name: string;
  avatar?: string;
  location: string;
  lat: number;
  lng: number;
  rating: number;
  productCount: number;
  isVerified: boolean;
  products: Product[];
}

export default function NearbyFarmersMapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const cameraRef = useRef<any>(null);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerMarker | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);

  // Get user's location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        // Default to Lagos, Nigeria
        setUserLocation({ lat: 6.5244, lng: 3.3792 });
        return;
      }
      
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        setUserLocation({ lat: 6.5244, lng: 3.3792 });
      }
    })();
  }, []);

  // Fetch products with location data
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['nearby-products', userLocation?.lat, userLocation?.lng, radiusKm],
    queryFn: async () => {
      if (!userLocation) return [];
      const response = await productService.getProducts({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: radiusKm,
        limit: 100,
      });
      return response?.products || [];
    },
    enabled: !!userLocation,
  });

  // Group products by farmer to create markers
  const farmerMarkers: FarmerMarker[] = React.useMemo(() => {
    const farmersMap = new Map<string, FarmerMarker>();
    
    const getLocationString = (loc: any): string => {
      if (!loc) return '';
      if (typeof loc === 'string') return loc;
      if (typeof loc === 'object') {
        return loc.city || loc.state || loc.address || '';
      }
      return '';
    };
    
    products.forEach((product: Product) => {
      if (!product.pickupLat || !product.pickupLng) return;
      
      const farmerId = product.farmerId;
      if (!farmersMap.has(farmerId)) {
        farmersMap.set(farmerId, {
          id: farmerId,
          name: product.farmerName || 'Unknown Farmer',
          avatar: product.farmerAvatar,
          location: getLocationString(product.farmerLocation) || getLocationString(product.pickupAddress) || '',
          lat: product.pickupLat,
          lng: product.pickupLng,
          rating: product.farmerRating || 0,
          productCount: 0,
          isVerified: product.isVerifiedSeller || false,
          products: [],
        });
      }
      
      const farmer = farmersMap.get(farmerId)!;
      farmer.productCount++;
      farmer.products.push(product);
    });
    
    return Array.from(farmersMap.values());
  }, [products]);

  const handleMarkerPress = useCallback((farmer: FarmerMarker) => {
    setSelectedFarmer(farmer);
    setShowFarmerModal(true);
  }, []);

  const handleViewProfile = () => {
    if (selectedFarmer) {
      setShowFarmerModal(false);
      navigation.navigate('FarmerProfile', { farmerId: selectedFarmer.id });
    }
  };

  const handleViewProduct = (product: Product) => {
    setShowFarmerModal(false);
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Generate WebView HTML for map
  const generateMapHTML = () => {
    const center = userLocation || { lat: 6.5244, lng: 3.3792 };
    const markersJSON = JSON.stringify(farmerMarkers);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          #map { width: 100%; height: 100vh; }
          .marker {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #4CAF50;
            border: 3px solid #FFFFFF;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .marker:hover { transform: scale(1.1); }
          .marker.verified { background: #FF9800; }
          .marker-icon { font-size: 18px; }
          .marker-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #2196F3;
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 5px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
          }
          .user-marker {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #2196F3;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 0 8px rgba(33, 150, 243, 0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          mapboxgl.accessToken = '${MAP_CONFIG.MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYnVsbGlvbjkiLCJhIjoiY21qZm1rNmM3MG5iZDNlczZ3Y3ZyODgzdCJ9.IGVGBctIjRag8D3Crma1ow'}';
          
          const map = new mapboxgl.Map({
            container: 'map',
            style: '${isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}',
            center: [${center.lng}, ${center.lat}],
            zoom: 12
          });

          // Add user location marker
          const userEl = document.createElement('div');
          userEl.className = 'user-marker';
          new mapboxgl.Marker(userEl)
            .setLngLat([${center.lng}, ${center.lat}])
            .addTo(map);

          // Add farmer markers
          const farmers = ${markersJSON};
          farmers.forEach(farmer => {
            const el = document.createElement('div');
            el.className = 'marker' + (farmer.isVerified ? ' verified' : '');
            el.innerHTML = '<span class="marker-icon">🌾</span>';
            if (farmer.productCount > 1) {
              el.innerHTML += '<span class="marker-badge">' + farmer.productCount + '</span>';
            }
            
            el.addEventListener('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                farmer: farmer
              }));
            });
            
            new mapboxgl.Marker(el)
              .setLngLat([farmer.lng, farmer.lat])
              .addTo(map);
          });

          // Fit bounds to show all markers
          if (farmers.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend([${center.lng}, ${center.lat}]);
            farmers.forEach(f => bounds.extend([f.lng, f.lat]));
            map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick' && data.farmer) {
        setSelectedFarmer(data.farmer);
        setShowFarmerModal(true);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  // Render native map if available
  const renderNativeMap = () => {
    if (!userLocation) return null;
    
    return (
      <MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={[userLocation.lng, userLocation.lat]}
          zoomLevel={12}
        />
        
        {/* User location marker */}
        <PointAnnotation
          id="user-location"
          coordinate={[userLocation.lng, userLocation.lat]}
        >
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner} />
          </View>
        </PointAnnotation>
        
        {/* Farmer markers */}
        {farmerMarkers.map((farmer) => (
          <PointAnnotation
            key={farmer.id}
            id={`farmer-${farmer.id}`}
            coordinate={[farmer.lng, farmer.lat]}
            onSelected={() => handleMarkerPress(farmer)}
          >
            <TouchableOpacity
              style={[
                styles.farmerMarker,
                farmer.isVerified && styles.farmerMarkerVerified,
              ]}
              onPress={() => handleMarkerPress(farmer)}
            >
              <Text style={styles.markerEmoji}>🌾</Text>
              {farmer.productCount > 1 && (
                <View style={styles.markerBadge}>
                  <Text style={styles.markerBadgeText}>{farmer.productCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </PointAnnotation>
        ))}
      </MapView>
    );
  };

  // Render WebView map fallback
  const renderWebViewMap = () => (
    <WebView
      source={{ html: generateMapHTML() }}
      style={StyleSheet.absoluteFillObject}
      onMessage={handleWebViewMessage}
      scrollEnabled={false}
      javaScriptEnabled={true}
    />
  );

  // Farmer detail modal
  const renderFarmerModal = () => (
    <Modal
      visible={showFarmerModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFarmerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {/* Handle */}
          <View style={styles.modalHandle} />
          
          {selectedFarmer && (
            <>
              {/* Farmer Header */}
              <View style={styles.farmerHeader}>
                {selectedFarmer.avatar ? (
                  <Image
                    source={{ uri: selectedFarmer.avatar.startsWith('http') ? selectedFarmer.avatar : `${API_CONFIG.BASE_URL}${selectedFarmer.avatar}` }}
                    style={styles.farmerAvatar}
                  />
                ) : (
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.farmerAvatarPlaceholder}
                  >
                    <Text style={styles.farmerInitials}>
                      {selectedFarmer.name.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                
                <View style={styles.farmerInfo}>
                  <View style={styles.farmerNameRow}>
                    <Text style={[styles.farmerName, { color: colors.text }]} numberOfLines={1}>
                      {selectedFarmer.name}
                    </Text>
                    {selectedFarmer.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.farmerLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                    <Ionicons name="location-outline" size={12} /> {typeof selectedFarmer.location === 'object' && selectedFarmer.location 
                      ? (selectedFarmer.location as any).city || (selectedFarmer.location as any).state || (selectedFarmer.location as any).address || ''
                      : selectedFarmer.location || ''}
                  </Text>
                  <View style={styles.farmerStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#FFC107" />
                      <Text style={[styles.statText, { color: colors.text }]}>
                        {selectedFarmer.rating.toFixed(1)}
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.statText, { color: colors.text }]}>
                        {selectedFarmer.productCount} products
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Products Preview */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Products</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.productsScroll}
                contentContainerStyle={styles.productsContent}
              >
                {selectedFarmer.products.slice(0, 5).map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.productCard, { backgroundColor: isDark ? colors.background : '#F5F5F5' }]}
                    onPress={() => handleViewProduct(product)}
                  >
                    {product.images?.[0] ? (
                      <Image
                        source={{ uri: product.images[0].startsWith('http') ? product.images[0] : `${API_CONFIG.BASE_URL}${product.images[0]}` }}
                        style={styles.productImage}
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        {getProductIllustration(product.title || product.name || '', 40)}
                      </View>
                    )}
                    <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                      {product.title || product.name}
                    </Text>
                    <Text style={[styles.productPrice, { color: COLORS.primary }]}>
                      {formatCurrency(product.price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, { borderColor: COLORS.primary }]}
                  onPress={() => setShowFarmerModal(false)}
                >
                  <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleViewProfile}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="person-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>View Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.headerTitle, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Ionicons name="leaf" size={20} color={COLORS.primary} />
          <Text style={[styles.headerTitleText, { color: colors.text }]}>Nearby Farmers</Text>
          {farmerMarkers.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{farmerMarkers.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {isLoading || !userLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {!userLocation ? 'Getting your location...' : 'Finding nearby farmers...'}
            </Text>
          </View>
        ) : (
          isNativeMapAvailable ? renderNativeMap() : renderWebViewMap()
        )}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: COLORS.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Farmer</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: COLORS.secondary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Verified</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarkerUser]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>You</Text>
        </View>
      </View>

      {/* Empty State */}
      {!isLoading && userLocation && farmerMarkers.length === 0 && (
        <View style={[styles.emptyOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>
          <Ionicons name="leaf-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Farmers Nearby</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            We couldn't find any farmers within {radiusKm}km of your location.
          </Text>
        </View>
      )}

      {/* Farmer Modal */}
      {renderFarmerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 22,
    gap: SPACING.xs,
    ...SHADOWS.medium,
  },
  headerTitleText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  mapContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  farmerMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  farmerMarkerVerified: {
    backgroundColor: COLORS.secondary,
  },
  markerEmoji: {
    fontSize: 20,
  },
  markerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2196F3',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  markerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: SPACING.md,
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    ...SHADOWS.medium,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  legendMarkerUser: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  legendText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
    maxHeight: height * 0.6,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  farmerHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  farmerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  farmerAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerInitials: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  farmerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  farmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farmerName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  farmerLocation: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  farmerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#DDD',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  productsScroll: {
    marginBottom: SPACING.lg,
  },
  productsContent: {
    gap: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  productCard: {
    width: 100,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  productImage: {
    width: '100%',
    height: 70,
    borderRadius: BORDER_RADIUS.sm,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 70,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  secondaryButton: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {},
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
});
