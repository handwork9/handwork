import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LoadingState, Button } from '../../components/common';
import { DeliveryMap } from '../../components/common/DeliveryMap';
import { useDispatchSocket } from '../../hooks/useDispatchSocket';
import { useLocation } from '../../hooks/useLocation';
import { formatCurrency } from '../../utils/formatters';
import { RiderStackParamList, OrderStatus } from '../../types';
import { riderService } from '../../services/orderService';

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
    name: string;
    phone: string;
  };
  buyer: {
    name: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
  earnings: number;
  estimatedDeliveryTime: string;
}

type DeliveryStep = 'accepted' | 'picked_up' | 'in_transit' | 'delivered';

const DELIVERY_STEPS: DeliveryStep[] = ['accepted', 'picked_up', 'in_transit', 'delivered'];

export default function ActiveDeliveryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { updateLocation, isConnected } = useDispatchSocket();
  const { location, startWatching, stopWatching } = useLocation();
  const [currentStep, setCurrentStep] = useState<DeliveryStep>('accepted');

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

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
    mutationFn: async ({ deliveryId, status }: { deliveryId: string; status: string }) => {
      const result = await riderService.updateDeliveryStatus(deliveryId, status);
      return result;
    },
    onSuccess: (_data, variables) => {
      if (variables.status === 'delivered') {
        queryClient.invalidateQueries({ queryKey: ['active-delivery'] });
        queryClient.invalidateQueries({ queryKey: ['rider-earnings'] });
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

  const openMaps = useCallback((latitude: number, longitude: number, label: string) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `maps:?daddr=${latitude},${longitude}&q=${encodeURIComponent(label)}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(label)})`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open maps');
      });
    }
  }, []);

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

    const stepMessages: Record<DeliveryStep, string> = {
      accepted: '',
      picked_up: 'Have you picked up the order from the farmer?',
      in_transit: 'Are you on your way to the buyer?',
      delivered: 'Confirm that you have delivered the order to the buyer?',
    };

    Alert.alert(
      'Update Status',
      stepMessages[nextStep],
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
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

  const getCurrentDestination = () => {
    if (!delivery) return null;
    
    if (currentStep === 'accepted') {
      return {
        label: 'Pickup Location',
        name: delivery.farmer.name,
        address: delivery.pickupAddress,
        location: delivery.pickupLocation,
        phone: delivery.farmer.phone,
      };
    }
    
    return {
      label: 'Delivery Location',
      name: delivery.buyer.name,
      address: delivery.deliveryAddress,
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
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : COLORS.background }]}>
            <Ionicons name="cube-outline" size={48} color={COLORS.gray} />
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
          <LinearGradient
            colors={isDark ? ['#1E40AF', '#3B82F6'] : [COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="navigate" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>
              {currentStep === 'accepted' ? 'Head to Pickup' : 
               currentStep === 'picked_up' ? 'Start Delivery' : 'On the Way'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {destination?.name} • {destination?.address}
            </Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatCurrency(delivery.earnings ?? 0)}</Text>
                <Text style={styles.heroStatLabel}>Earnings</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{delivery.items.length}</Text>
                <Text style={styles.heroStatLabel}>Items</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{delivery.estimatedDeliveryTime}</Text>
                <Text style={styles.heroStatLabel}>ETA</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* In-App Map */}
        <View style={styles.mapContainer}>
          <DeliveryMap
            pickupLocation={delivery.pickupLocation}
            deliveryLocation={delivery.deliveryLocation}
            riderLocation={location}
            currentStep={currentStep}
          />
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
                  contactId: 'farmer-1',
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
                  contactId: 'buyer-1',
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
  heroGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.85)',
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
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  heroStatLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  mapContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...SHADOWS.medium,
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
});
