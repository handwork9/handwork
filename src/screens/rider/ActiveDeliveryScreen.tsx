import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Vibration,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState, Button } from '../../components/common';
import { DeliveryMap } from '../../components/common/DeliveryMap';
import { useDispatchSocket } from '../../hooks/useDispatchSocket';
import { useLocation } from '../../hooks/useLocation';
import { formatCurrency } from '../../utils/formatters';
import { openMapsWithDirections } from '../../utils/maps';
import { RiderStackParamList, OrderStatus } from '../../types';
import { riderService } from '../../services/orderService';
import uploadService from '../../services/uploadService';

type NavigationProp = NativeStackNavigationProp<RiderStackParamList>;

const { width } = Dimensions.get('window');

interface ActiveDelivery {
  id: string;
  orderId: string;
  status: 'accepted' | 'picked_up' | 'in_transit';
  pickupAddress: string;
  deliveryAddress: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  farmer: {
    id: string;
    name: string;
    phone: string;
    address?: string;
  };
  buyer: {
    id: string;
    name: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
  earnings: number;
  eta?: number; // ETA in minutes
  estimatedDeliveryTime: string;
}

type DeliveryStep = 'accepted' | 'picked_up' | 'in_transit' | 'delivered';

const DELIVERY_STEPS: DeliveryStep[] = ['accepted', 'picked_up', 'in_transit', 'delivered'];

// Step descriptions for better UX
const STEP_INFO: Record<DeliveryStep, { icon: keyof typeof Ionicons.glyphMap; label: string; action: string; color: string }> = {
  accepted: { icon: 'checkmark-circle', label: 'Order Accepted', action: 'Head to pickup location', color: '#3B82F6' },
  picked_up: { icon: 'cube', label: 'Picked Up', action: 'Confirm you have the items', color: '#8B5CF6' },
  in_transit: { icon: 'bicycle', label: 'In Transit', action: 'Delivering to customer', color: '#F59E0B' },
  delivered: { icon: 'checkmark-done-circle', label: 'Delivered', action: 'Order complete!', color: '#10B981' },
};

export default function ActiveDeliveryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { updateLocation, isConnected } = useDispatchSocket();
  const { location, startWatching, stopWatching } = useLocation();
  const [currentStep, setCurrentStep] = useState<DeliveryStep>('accepted');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const lastMapLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  
  // Memoized location for map - only updates when moved significantly (50+ meters)
  const stableMapLocation = useMemo(() => {
    if (!location) return null;
    
    const current = { latitude: location.latitude, longitude: location.longitude };
    const last = lastMapLocationRef.current;
    
    // If no previous location, use current
    if (!last) {
      lastMapLocationRef.current = current;
      return current;
    }
    
    // Calculate distance (rough approximation)
    const latDiff = Math.abs(current.latitude - last.latitude);
    const lngDiff = Math.abs(current.longitude - last.longitude);
    const distanceApprox = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // meters
    
    // Only update if moved more than 50 meters
    if (distanceApprox > 50) {
      lastMapLocationRef.current = current;
      return current;
    }
    
    return last;
  }, [location?.latitude, location?.longitude]);
  
  // Proof of delivery photo state
  const [proofPhotoUri, setProofPhotoUri] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  
  // Pulse animation for current step
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [currentStep]);
  
  // Format elapsed time
  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const { data: delivery, isLoading, refetch } = useQuery({
    queryKey: ['active-delivery'],
    queryFn: async (): Promise<ActiveDelivery | null> => {
      const result = await riderService.getActiveDelivery();
      // API response is { success: true, data: { delivery: ... } }
      return (result as any)?.data?.delivery ?? null;
    },
  });

  // Start location tracking when on active delivery
  useEffect(() => {
    if (delivery) {
      startWatching();
      setCurrentStep(delivery.status);
    }
    return () => {
      stopWatching();
    };
  }, [delivery, startWatching, stopWatching]);

  // Send location updates via WebSocket
  useEffect(() => {
    if (delivery && location && isConnected) {
      updateLocation(location.latitude, location.longitude);
    }
  }, [delivery, location, isConnected, updateLocation]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ deliveryId, status, proofOfDeliveryPhoto }: { 
      deliveryId: string; 
      status: string; 
      proofOfDeliveryPhoto?: string;
    }) => {
      const result = await riderService.updateDeliveryStatus(deliveryId, status, proofOfDeliveryPhoto);
      return result;
    },
    onSuccess: (_data, variables) => {
      if (variables.status === 'delivered') {
        queryClient.invalidateQueries({ queryKey: ['active-delivery'] });
        queryClient.invalidateQueries({ queryKey: ['rider-earnings'] });
        setProofPhotoUri(null);
        navigation.navigate('DeliveryConfirmation', { 
          deliveryId: variables.deliveryId,
          earnings: delivery?.earnings || 0,
        });
      } else {
        refetch();
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update delivery status');
    },
  });

  // Take proof of delivery photo
  const takeProofPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take proof of delivery photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setProofPhotoUri(result.assets[0].uri);
      setShowPhotoModal(true);
    }
  };

  // Upload and complete delivery with photo
  const completeDeliveryWithPhoto = async () => {
    if (!delivery || !proofPhotoUri) return;
    
    setUploadingPhoto(true);
    try {
      // Upload the photo first
      const uploadResult = await uploadService.uploadImage(proofPhotoUri, 'delivery-proof');
      const photoUrl = uploadResult?.url;
      
      // Complete the delivery with the photo URL
      updateStatusMutation.mutate({
        deliveryId: delivery.id,
        status: 'delivered',
        proofOfDeliveryPhoto: photoUrl,
      });
      setShowPhotoModal(false);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const callContact = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make call');
    });
  }, []);

  const handleNextStep = () => {
    if (!delivery) return;

    const currentIndex = DELIVERY_STEPS.indexOf(currentStep);
    const nextStep = DELIVERY_STEPS[currentIndex + 1];

    if (!nextStep) return;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // For delivery completion, require photo proof
    if (nextStep === 'delivered') {
      Alert.alert(
        'Complete Delivery',
        'Take a photo as proof of delivery before completing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Take Photo',
            style: 'default',
            onPress: takeProofPhoto,
          },
        ]
      );
      return;
    }

    const stepMessages: Record<DeliveryStep, string> = {
      accepted: '',
      picked_up: 'Have you picked up the order from the farmer?',
      in_transit: 'Are you on your way to the buyer?',
      delivered: 'Confirm that you have delivered the order to the buyer?',
    };

    Alert.alert(
      `Update to: ${STEP_INFO[nextStep].label}`,
      stepMessages[nextStep],
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCurrentStep(nextStep);
            updateStatusMutation.mutate({
              deliveryId: delivery.id,
              status: nextStep,
            });
          },
        },
      ]
    );
  };

  const getStepInfo = (step: DeliveryStep) => {
    const stepIndex = DELIVERY_STEPS.indexOf(step);
    const currentIndex = DELIVERY_STEPS.indexOf(currentStep);
    
    return {
      isCompleted: stepIndex < currentIndex,
      isCurrent: stepIndex === currentIndex,
      isPending: stepIndex > currentIndex,
    };
  };

  const getButtonLabel = () => {
    switch (currentStep) {
      case 'accepted':
        return 'Confirm Pickup';
      case 'picked_up':
        return 'Start Delivery';
      case 'in_transit':
        return 'Complete Delivery';
      default:
        return 'Continue';
    }
  };

  const getAddressString = (addr: any): string => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    if (typeof addr === 'object') {
      return addr.address || addr.city || addr.state || '';
    }
    return '';
  };

  const getCurrentDestination = () => {
    if (!delivery) return null;
    
    if (currentStep === 'accepted') {
      return {
        label: 'Pickup Location',
        name: delivery.farmer.name,
        address: getAddressString(delivery.pickupAddress),
        location: delivery.pickupLocation,
        phone: delivery.farmer.phone,
      };
    }
    
    return {
      label: 'Delivery Location',
      name: delivery.buyer.name,
      address: getAddressString(delivery.deliveryAddress),
      location: delivery.deliveryLocation,
      phone: delivery.buyer.phone,
    };
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!delivery) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Active Delivery</Text>
        </View>
        <View style={[
          styles.emptyState,
          {
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          }
        ]}>
          {/* SVG Background */}
          <View style={styles.emptyBackground}>
            <Svg width={200} height={200}>
              <Defs>
                <SvgLinearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#2196F3" stopOpacity="0.15" />
                  <Stop offset="100%" stopColor="#64B5F6" stopOpacity="0.08" />
                </SvgLinearGradient>
              </Defs>
              <Circle cx="100" cy="100" r="90" fill="url(#emptyGrad)" />
              <Circle cx="100" cy="100" r="60" fill="url(#emptyGrad)" />
            </Svg>
          </View>
          <View style={[styles.emptyIconContainer, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="cube" size={40} color="#2196F3" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Delivery</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Accept a job to start delivering
          </Text>
          <Button
            title="Find Jobs"
            onPress={() => navigation.navigate('AvailableJobs')}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  const destination = getCurrentDestination();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.headerTitleContainer}>
          <Animated.View style={[styles.headerTitleRow, { opacity: headerOpacity }]}>
            <View style={styles.headerIconBg}>
              <Ionicons name="navigate" size={18} color={COLORS.primary} />
            </View>
            <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Active Delivery</Text>
          </Animated.View>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section with Map Placeholder */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={styles.heroCardSvg}>
              <Svg width="200" height="200" viewBox="0 0 200 200">
                <Circle cx="150" cy="50" r="80" fill={COLORS.primary} fillOpacity={0.08} />
                <Circle cx="180" cy="100" r="50" fill={COLORS.primaryDark} fillOpacity={0.06} />
                <Circle cx="120" cy="30" r="30" fill={COLORS.primary} fillOpacity={0.05} />
              </Svg>
            </View>
            <View style={styles.heroContent}>
              {/* Current step indicator */}
              <View style={[styles.currentStepBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name={STEP_INFO[currentStep].icon} size={20} color={COLORS.primary} />
                </Animated.View>
                <Text style={[styles.currentStepText, { color: COLORS.primary }]}>{STEP_INFO[currentStep].label}</Text>
              </View>
              
              <View style={[styles.heroIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="navigate" size={32} color={COLORS.primary} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {currentStep === 'accepted' ? 'Head to Pickup' : 
                 currentStep === 'picked_up' ? 'Start Delivery' : 'On the Way'}
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                {destination?.name} • {destination?.address}
              </Text>
              <View style={[styles.heroStatsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={styles.heroStatItem}>
                  <Text style={[styles.heroStatValue, { color: COLORS.primary }]}>{formatCurrency(delivery.earnings ?? 0)}</Text>
                  <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Earnings</Text>
                </View>
                <View style={[styles.heroStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]} />
                <View style={styles.heroStatItem}>
                  <Text style={[styles.heroStatValue, { color: COLORS.primary }]}>{delivery.items.length}</Text>
                  <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Items</Text>
                </View>
                <View style={[styles.heroStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]} />
                <View style={styles.heroStatItem}>
                  <Text style={[styles.heroStatValue, { color: COLORS.primary }]}>{formatElapsedTime(elapsedTime)}</Text>
                  <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Time</Text>
                </View>
                <View style={[styles.heroStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]} />
                <View style={styles.heroStatItem}>
                  <Text style={[styles.heroStatValue, { color: COLORS.primary }]}>
                    {delivery.eta ? `${delivery.eta} min` : '--'}
                  </Text>
                  <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>ETA</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* In-App Map */}
        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <DeliveryMap
              pickupLocation={delivery.pickupLocation}
              deliveryLocation={delivery.deliveryLocation}
              riderLocation={stableMapLocation}
              currentStep={currentStep}
            />
          </View>
          {/* Get Directions Button - Below the map */}
          <TouchableOpacity
            style={styles.getDirectionsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Before pickup confirmation (accepted), navigate to farmer
              // After pickup (picked_up, in_transit), navigate to buyer
              const goToFarmer = currentStep === 'accepted';
              const dest = goToFarmer
                ? delivery.pickupLocation 
                : delivery.deliveryLocation;
              const label = goToFarmer
                ? `Pickup: ${delivery.farmer.name}`
                : `Deliver to: ${delivery.buyer.name}`;
              openMapsWithDirections(dest.latitude, dest.longitude, label);
            }}
          >
            <Ionicons name="navigate" size={18} color="#FFFFFF" />
            <Text style={styles.getDirectionsText}>
              {currentStep === 'accepted' ? 'Directions to Farmer' : 'Directions to Buyer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Steps */}
        <View style={[styles.stepsContainer, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          {DELIVERY_STEPS.map((step, index) => {
            const info = getStepInfo(step);
            const stepLabels: Record<DeliveryStep, string> = {
              accepted: 'Accepted',
              picked_up: 'Picked Up',
              in_transit: 'In Transit',
              delivered: 'Delivered',
            };
            
            return (
              <React.Fragment key={step}>
                <View style={styles.stepItem}>
                  <View style={[
                    styles.stepCircle,
                    { backgroundColor: isDark ? colors.background : COLORS.background, borderColor: isDark ? 'rgba(255,255,255,0.2)' : COLORS.border },
                    info.isCompleted && styles.stepCompleted,
                    info.isCurrent && [styles.stepCurrent, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }],
                  ]}>
                    {info.isCompleted ? (
                      <Ionicons name="checkmark" size={14} color={COLORS.white} />
                    ) : (
                      <Text style={[
                        styles.stepNumber,
                        { color: colors.textSecondary },
                        info.isCurrent && styles.stepNumberCurrent,
                      ]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    { color: colors.textSecondary },
                    info.isCompleted && styles.stepLabelCompleted,
                    info.isCurrent && styles.stepLabelCurrent,
                  ]}>
                    {stepLabels[step]}
                  </Text>
                </View>
                {index < DELIVERY_STEPS.length - 1 && (
                  <View style={[
                    styles.stepLine,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border },
                    info.isCompleted && styles.stepLineCompleted,
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Current Destination Card */}
        {destination && (
          <View style={[styles.destinationCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.destinationHeader}>
              <Text style={styles.destinationLabel}>{destination.label}</Text>
              <View style={[styles.earningsBadge, { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight }]}>
                <Text style={styles.earningsText}>{formatCurrency(delivery.earnings ?? 0)}</Text>
              </View>
            </View>
            
            <Text style={[styles.destinationName, { color: colors.text }]}>{destination.name}</Text>
            <Text style={[styles.destinationAddress, { color: colors.textSecondary }]}>{destination.address}</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.background }]}
                onPress={() => callContact(destination.phone)}
              >
                <Ionicons name="call-outline" size={24} color={COLORS.primary} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={[styles.itemsCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.itemsTitle, { color: colors.text }]}>Order Items</Text>
          {delivery.items.map((item, index) => (
            <View key={index} style={[styles.itemRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>x{item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Contacts */}
        <View style={[styles.contactsCard, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
          <Text style={[styles.contactsTitle, { color: colors.text }]}>Contacts</Text>
          
          <View style={[styles.contactRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.border }]}>
            <View style={[styles.contactIcon, { backgroundColor: isDark ? `${COLORS.primary}30` : COLORS.primaryLight }]}>
              <Ionicons name="leaf" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, { color: colors.text }]}>{delivery.farmer.name}</Text>
              <Text style={[styles.contactRole, { color: colors.textSecondary }]}>Farmer</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={[styles.contactActionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : COLORS.background }]}
                onPress={() => (navigation as any).navigate('DeliveryChat', {
                  contactId: delivery.farmer.id,
                  contactName: delivery.farmer.name,
                  contactPhone: delivery.farmer.phone,
                  contactRole: 'farmer',
                  orderId: delivery.orderId,
                })}
              >
                <Ionicons name="chatbubble" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactActionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : COLORS.background }]}
                onPress={() => callContact(delivery.farmer.phone)}
              >
                <Ionicons name="call" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.contactRow, { borderBottomColor: 'transparent' }]}>
            <View style={[styles.contactIcon, { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight }]}>
              <Ionicons name="cart" size={20} color={COLORS.success} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, { color: colors.text }]}>{delivery.buyer.name}</Text>
              <Text style={[styles.contactRole, { color: colors.textSecondary }]}>Buyer</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={[styles.contactActionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : COLORS.background }]}
                onPress={() => (navigation as any).navigate('DeliveryChat', {
                  contactId: delivery.buyer.id,
                  contactName: delivery.buyer.name,
                  contactPhone: delivery.buyer.phone,
                  contactRole: 'buyer',
                  orderId: delivery.orderId,
                })}
              >
                <Ionicons name="chatbubble" size={18} color={COLORS.success} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactActionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : COLORS.background }]}
                onPress={() => callContact(delivery.buyer.phone)}
              >
                <Ionicons name="call" size={18} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Next Step Button */}
        {currentStep !== 'delivered' && (
          <View style={styles.buttonContainer}>
            <Button
              title={getButtonLabel()}
              onPress={handleNextStep}
              loading={updateStatusMutation.isPending}
              fullWidth
            />
          </View>
        )}
      </Animated.ScrollView>

      {/* Proof of Delivery Photo Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.photoModalOverlay}>
          <View style={[styles.photoModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.photoModalHeader}>
              <Text style={[styles.photoModalTitle, { color: colors.text }]}>Proof of Delivery</Text>
              <TouchableOpacity 
                onPress={() => setShowPhotoModal(false)}
                style={styles.photoModalClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {proofPhotoUri && (
              <Image 
                source={{ uri: proofPhotoUri }} 
                style={styles.proofPhoto}
                resizeMode="cover"
              />
            )}
            
            <Text style={[styles.photoModalSubtitle, { color: isDark ? '#9CA3AF' : COLORS.textSecondary }]}>
              This photo will be saved as proof of delivery
            </Text>
            
            <View style={styles.photoModalButtons}>
              <TouchableOpacity
                style={[styles.photoModalBtn, styles.retakeBtn]}
                onPress={() => {
                  setShowPhotoModal(false);
                  takeProofPhoto();
                }}
              >
                <Ionicons name="camera" size={20} color={COLORS.primary} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.photoModalBtn, styles.confirmBtn]}
                onPress={completeDeliveryWithPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <Text style={styles.confirmBtnText}>Uploading...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>Confirm Delivery</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  fixedHeader: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 139, 34, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeaderTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  heroSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardSvg: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  heroContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  heroStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
  },
  currentStepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  currentStepText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 32,
  },
  mapPlaceholderSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.small,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stepCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepCurrent: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  stepCheckmark: {
    color: COLORS.white,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  stepNumber: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
  },
  stepNumberCurrent: {
    color: COLORS.primary,
  },
  stepLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  stepLabelCompleted: {
    color: COLORS.success,
  },
  stepLabelCurrent: {
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.success,
  },
  destinationCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  destinationLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  earningsBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  earningsText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  destinationName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  destinationAddress: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  itemsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  itemsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  itemQuantity: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  contactsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  contactsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  contactName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  contactRole: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  contactActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneIcon: {
    fontSize: 20,
  },
  buttonContainer: {
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  emptyBackground: {
    position: 'absolute',
    opacity: 0.8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
  mapSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  mapContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...SHADOWS.medium,
  },
  getDirectionsButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
    ...SHADOWS.small,
  },
  getDirectionsText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  openMapsButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    ...SHADOWS.small,
  },
  openMapsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Proof of Delivery Photo Modal Styles
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  photoModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  photoModalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  photoModalClose: {
    padding: SPACING.xs,
  },
  proofPhoto: {
    width: '100%',
    height: 250,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  photoModalSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  photoModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  photoModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  retakeBtn: {
    backgroundColor: 'rgba(34, 139, 34, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retakeBtnText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
