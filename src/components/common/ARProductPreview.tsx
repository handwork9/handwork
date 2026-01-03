import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

interface ARProductPreviewProps {
  visible: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    images: string[];
    price: string | number;
    unit: string;
  } | null;
}

/**
 * AR Product Preview Component
 * 
 * This provides an interactive 3D-like preview of products.
 * For full AR functionality, the app would need ARKit (iOS) or ARCore (Android)
 * integration through libraries like ViroReact or expo-ar (when available).
 * 
 * Current implementation: Interactive product viewer with rotation and zoom
 */
export default function ARProductPreview({ visible, onClose, product }: ARProductPreviewProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [scale, setScale] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalRotation, setTotalRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const lastImageIndexRef = useRef(0);
  const accumulatedDxRef = useRef(0);

  useEffect(() => {
    if (visible) {
      setScale(1);
      setCurrentImageIndex(0);
      setTotalRotation(0);
      setIsSpinning(false);
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
      spinAnim.setValue(0);
      lastImageIndexRef.current = 0;
      accumulatedDxRef.current = 0;
    }
  }, [visible]);

  // Update image based on accumulated rotation
  const updateImageFromRotation = useCallback((dx: number) => {
    if (!product?.images || product.images.length <= 1) return;
    
    accumulatedDxRef.current += dx;
    const threshold = 60; // pixels per image change
    const imageCount = product.images.length;
    
    // Calculate which image to show based on total accumulated movement
    const indexChange = Math.floor(accumulatedDxRef.current / threshold);
    let newIndex = (lastImageIndexRef.current + indexChange) % imageCount;
    if (newIndex < 0) newIndex += imageCount;
    
    if (newIndex !== currentImageIndex) {
      triggerHaptic();
      setCurrentImageIndex(newIndex);
    }
  }, [product?.images, currentImageIndex]);

  // Pan responder for rotation gesture - recreated when product changes
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        accumulatedDxRef.current = 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Apply continuous rotation
        const rotationValue = gestureState.dx * 0.5;
        rotateAnim.setValue(rotationValue);
        setTotalRotation(rotationValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Update image based on final position
        if (product?.images && product.images.length > 1) {
          const threshold = 80;
          const imageCount = product.images.length;
          const direction = gestureState.dx > 0 ? 1 : -1;
          
          if (Math.abs(gestureState.dx) > threshold) {
            let newIndex = currentImageIndex - direction;
            if (newIndex < 0) newIndex = imageCount - 1;
            if (newIndex >= imageCount) newIndex = 0;
            triggerHaptic();
            setCurrentImageIndex(newIndex);
            lastImageIndexRef.current = newIndex;
          }
        }
        
        // Animate back to center
        Animated.spring(rotateAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 7,
        }).start();
        setTotalRotation(0);
      },
    })
  ).current;

  const handleZoomIn = () => {
    triggerHaptic();
    const newScale = Math.min(scale + 0.2, 2);
    setScale(newScale);
    Animated.spring(scaleAnim, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    triggerHaptic();
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    Animated.spring(scaleAnim, {
      toValue: newScale,
      useNativeDriver: true,
    }).start();
  };

  const handleNextImage = () => {
    if (isSpinning) return;
    
    triggerHaptic();
    setIsSpinning(true);
    
    // Cycle to next image if multiple exist
    if (product?.images && product.images.length > 1) {
      const newIndex = (currentImageIndex + 1) % product.images.length;
      
      // Delay image change to middle of spin
      setTimeout(() => {
        setCurrentImageIndex(newIndex);
        lastImageIndexRef.current = newIndex;
      }, 250);
    }
    
    // Full 360° rotation animation
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      spinAnim.setValue(0);
    });
  };

  const handleARInfo = () => {
    Alert.alert(
      'AR Preview',
      'Full AR functionality requires ARKit (iOS) or ARCore (Android). This interactive viewer allows you to:\n\n• Swipe to rotate the product\n• Pinch to zoom in/out\n• View from different angles',
      [{ text: 'Got it' }]
    );
  };

  if (!visible || !product) return null;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-45deg', '0deg', '45deg'],
    extrapolate: 'clamp',
  });

  // Full 360° spin for rotate button
  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.titleContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Ionicons name="cube-outline" size={20} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>AR Preview</Text>
          </View>

          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={handleARInfo}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* AR View Area */}
        <View style={styles.arContainer} {...panResponder.panHandlers}>
          {/* Grid background for AR effect */}
          <View style={styles.gridBackground}>
            {[...Array(10)].map((_, i) => (
              <View 
                key={`h-${i}`} 
                style={[styles.gridLine, styles.horizontalLine, { top: `${i * 10}%` }]} 
              />
            ))}
            {[...Array(10)].map((_, i) => (
              <View 
                key={`v-${i}`} 
                style={[styles.gridLine, styles.verticalLine, { left: `${i * 10}%` }]} 
              />
            ))}
          </View>

          {/* Shadow */}
          <View style={styles.shadowContainer}>
            <Animated.View 
              style={[
                styles.shadow,
                {
                  transform: [
                    { scaleX: scaleAnim },
                    { scaleY: Animated.multiply(scaleAnim, 0.3) },
                  ],
                },
              ]} 
            />
          </View>

          {/* Product Image */}
          <Animated.View
            style={[
              styles.productContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { rotateY: isSpinning ? spinInterpolate : rotateInterpolate },
                ],
              },
            ]}
          >
            <Image
              source={{ uri: product.images[currentImageIndex] }}
              style={styles.productImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Gesture hint */}
          <View style={styles.gestureHint}>
            <Ionicons name="hand-left-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.gestureHintText, { color: colors.textSecondary }]}>
              Swipe to rotate
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={[styles.infoContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.productTitle, { color: colors.text }]}>{product.title}</Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            ₦{Number(product.price).toLocaleString()} / {product.unit}
          </Text>

          {/* Image indicators */}
          {product.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {product.images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    { 
                      backgroundColor: index === currentImageIndex 
                        ? colors.primary 
                        : isDark ? colors.border : '#E0E0E0'
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setCurrentImageIndex(index);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={handleZoomOut}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={28} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.rotateButton, { backgroundColor: colors.primary }]}
            onPress={handleNextImage}
            activeOpacity={0.7}
          >
            <Ionicons name="sync" size={28} color="#FFFFFF" />
            <Text style={styles.rotateText}>Rotate</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={handleZoomIn}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  arContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gridBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#888',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  shadowContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  shadow: {
    width: 200,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 100,
  },
  productContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  gestureHint: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  gestureHintText: {
    fontSize: 13,
  },
  infoContainer: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rotateButton: {
    width: 100,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  rotateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
