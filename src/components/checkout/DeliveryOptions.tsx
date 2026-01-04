import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import {
  DeliveryMethod,
  DeliverySpeed,
  DeliverySpeedOption,
  DeliveryTimeSlot,
  PickupLocationOption,
} from '../../types';
import {
  deliveryService,
  getAvailableDeliverySpeeds,
  generateTimeSlots,
  calculateDeliveryFeeWithSpeed,
  calculatePickupPointDiscount,
} from '../../services/deliveryService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DeliveryOptionsProps {
  baseDeliveryFee: number;
  userLatitude?: number;
  userLongitude?: number;
  userCity?: string;
  userState?: string;
  onDeliveryMethodChange: (method: DeliveryMethod) => void;
  onDeliverySpeedChange: (speed: DeliverySpeed, additionalFee: number) => void;
  onTimeSlotChange: (slot: DeliveryTimeSlot | null) => void;
  onPickupPointChange: (point: PickupLocationOption | null, discount: number) => void;
  initialMethod?: DeliveryMethod;
  initialSpeed?: DeliverySpeed;
}

export default function DeliveryOptions({
  baseDeliveryFee,
  userLatitude,
  userLongitude,
  userCity,
  userState,
  onDeliveryMethodChange,
  onDeliverySpeedChange,
  onTimeSlotChange,
  onPickupPointChange,
  initialMethod = 'home_delivery',
  initialSpeed = 'standard',
}: DeliveryOptionsProps) {
  const { colors, isDark } = useTheme();
  
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(initialMethod);
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed>(initialSpeed);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<DeliveryTimeSlot | null>(null);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupLocationOption | null>(null);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showPickupPointModal, setShowPickupPointModal] = useState(false);
  const [pickupPoints, setPickupPoints] = useState<PickupLocationOption[]>([]);
  const [isLoadingPickupPoints, setIsLoadingPickupPoints] = useState(false);

  const availableSpeeds = useMemo(() => getAvailableDeliverySpeeds(), []);
  const timeSlots = useMemo(() => generateTimeSlots(7), []);

  // Fetch pickup points when method changes
  useEffect(() => {
    if (deliveryMethod === 'pickup_point' && pickupPoints.length === 0) {
      loadPickupPoints();
    }
  }, [deliveryMethod]);

  const loadPickupPoints = async () => {
    setIsLoadingPickupPoints(true);
    try {
      let points: PickupLocationOption[] = [];
      
      if (userLatitude && userLongitude) {
        const result = await deliveryService.getPickupLocations({
          latitude: userLatitude,
          longitude: userLongitude,
          radiusKm: 15,
        });
        points = Array.isArray(result) ? result : [];
      } else if (userState) {
        const result = await deliveryService.getPickupLocationsByArea(userState, userCity);
        points = Array.isArray(result) ? result : [];
      }
      
      setPickupPoints(points);
    } catch (error) {
      console.error('Error loading pickup points:', error);
      setPickupPoints([]);
    } finally {
      setIsLoadingPickupPoints(false);
    }
  };

  const handleMethodChange = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    onDeliveryMethodChange(method);
    
    if (method === 'home_delivery') {
      setSelectedPickupPoint(null);
      onPickupPointChange(null, 0);
    }
  };

  const handleSpeedChange = (speed: DeliverySpeed) => {
    setDeliverySpeed(speed);
    const additionalFee = calculateDeliveryFeeWithSpeed(baseDeliveryFee, speed) - baseDeliveryFee;
    onDeliverySpeedChange(speed, additionalFee);
    
    // Reset time slot if not scheduled
    if (speed !== 'standard' && speed !== 'economy') {
      setSelectedTimeSlot(null);
      onTimeSlotChange(null);
    }
  };

  const handleTimeSlotSelect = (slot: DeliveryTimeSlot) => {
    setSelectedTimeSlot(slot);
    onTimeSlotChange(slot);
    setShowTimeSlotModal(false);
  };

  const handlePickupPointSelect = (point: PickupLocationOption) => {
    setSelectedPickupPoint(point);
    const discount = calculatePickupPointDiscount(baseDeliveryFee, point);
    onPickupPointChange(point, discount);
    setShowPickupPointModal(false);
  };

  const renderSpeedOption = (option: DeliverySpeedOption) => {
    const isSelected = deliverySpeed === option.speed;
    const additionalFee = calculateDeliveryFeeWithSpeed(baseDeliveryFee, option.speed) - baseDeliveryFee;
    
    return (
      <TouchableOpacity
        key={option.speed}
        style={[
          styles.speedOption,
          {
            backgroundColor: isSelected ? colors.primary + '15' : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            opacity: option.available ? 1 : 0.5,
          },
        ]}
        onPress={() => option.available && handleSpeedChange(option.speed)}
        disabled={!option.available}
      >
        <View style={styles.speedIconContainer}>
          <Ionicons
            name={option.icon as any}
            size={24}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={styles.speedContent}>
          <View style={styles.speedHeader}>
            <Text style={[styles.speedLabel, { color: colors.text }]}>{option.label}</Text>
            {additionalFee !== 0 && (
              <Text style={[
                styles.speedPrice,
                { color: additionalFee > 0 ? colors.error : colors.success }
              ]}>
                {additionalFee > 0 ? '+' : ''}₦{additionalFee.toLocaleString()}
              </Text>
            )}
          </View>
          <Text style={[styles.speedDescription, { color: colors.textSecondary }]}>
            {option.description}
          </Text>
          {!option.available && (
            <Text style={[styles.unavailableText, { color: colors.error }]}>
              Not available now
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Delivery Method Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Choose delivery method</Text>
        <View style={styles.methodOptions}>
          {/* Home Delivery Card */}
          <TouchableOpacity
            style={[
              styles.methodOption,
              {
                backgroundColor: deliveryMethod === 'home_delivery' 
                  ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF') 
                  : colors.card,
                borderColor: deliveryMethod === 'home_delivery' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleMethodChange('home_delivery')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.methodIconWrapper,
              { backgroundColor: deliveryMethod === 'home_delivery' 
                ? colors.primary 
                : (isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7') 
              }
            ]}>
              <Ionicons
                name="home"
                size={22}
                color={deliveryMethod === 'home_delivery' ? '#FFFFFF' : colors.textSecondary}
              />
            </View>
            <Text style={[
              styles.methodLabel,
              { color: deliveryMethod === 'home_delivery' ? colors.primary : colors.text }
            ]}>
              Home Delivery
            </Text>
            <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>
              Delivered to your door
            </Text>
            {deliveryMethod === 'home_delivery' && (
              <View style={[styles.methodCheckmark, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Pickup Point Card */}
          <TouchableOpacity
            style={[
              styles.methodOption,
              {
                backgroundColor: deliveryMethod === 'pickup_point' 
                  ? (isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9') 
                  : colors.card,
                borderColor: deliveryMethod === 'pickup_point' ? colors.success : colors.border,
              },
            ]}
            onPress={() => handleMethodChange('pickup_point')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.methodIconWrapper,
              { backgroundColor: deliveryMethod === 'pickup_point' 
                ? colors.success 
                : (isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7') 
              }
            ]}>
              <Ionicons
                name="location"
                size={22}
                color={deliveryMethod === 'pickup_point' ? '#FFFFFF' : colors.textSecondary}
              />
            </View>
            <Text style={[
              styles.methodLabel,
              { color: deliveryMethod === 'pickup_point' ? colors.success : colors.text }
            ]}>
              Pickup Point
            </Text>
            <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>
              Collect from a location
            </Text>
            <View style={[styles.saveBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.saveBadgeText}>Save 20%</Text>
            </View>
            {deliveryMethod === 'pickup_point' && (
              <View style={[styles.methodCheckmark, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Pickup Point Selection (if pickup method selected) */}
      {deliveryMethod === 'pickup_point' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Pickup Point</Text>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowPickupPointModal(true)}
          >
            {selectedPickupPoint ? (
              <View style={styles.selectedItem}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.selectedItemContent}>
                  <Text style={[styles.selectedItemTitle, { color: colors.text }]}>
                    {selectedPickupPoint.name}
                  </Text>
                  <Text style={[styles.selectedItemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {selectedPickupPoint.address}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            ) : (
              <View style={styles.placeholderItem}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.placeholderText, { color: colors.primary }]}>
                  Choose a pickup point
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Delivery Speed Selection (for home delivery) */}
      {deliveryMethod === 'home_delivery' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Speed</Text>
          <View style={styles.speedOptions}>
            {availableSpeeds.map(renderSpeedOption)}
          </View>
        </View>
      )}

      {/* Time Slot Selection (for standard/economy) */}
      {(deliverySpeed === 'standard' || deliverySpeed === 'economy' || deliverySpeed === 'next_day') && 
       deliveryMethod === 'home_delivery' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferred Time Slot</Text>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowTimeSlotModal(true)}
          >
            {selectedTimeSlot ? (
              <View style={styles.selectedItem}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={[styles.selectedItemTitle, { color: colors.text }]}>
                  {selectedTimeSlot.label}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            ) : (
              <View style={styles.placeholderItem}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.placeholderText, { color: colors.primary }]}>
                  Select a time slot (optional)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Time Slot Modal */}
      <Modal
        visible={showTimeSlotModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimeSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Time Slot</Text>
              <TouchableOpacity onPress={() => setShowTimeSlotModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotOption,
                    {
                      backgroundColor: selectedTimeSlot?.id === slot.id ? colors.primary + '15' : 'transparent',
                      borderColor: selectedTimeSlot?.id === slot.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleTimeSlotSelect(slot)}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={selectedTimeSlot?.id === slot.id ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.slotLabel, { color: colors.text }]}>{slot.label}</Text>
                  {selectedTimeSlot?.id === slot.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pickup Point Modal */}
      <Modal
        visible={showPickupPointModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPickupPointModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Pickup Point</Text>
              <TouchableOpacity onPress={() => setShowPickupPointModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {isLoadingPickupPoints ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Finding nearby pickup points...
                </Text>
              </View>
            ) : pickupPoints.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No pickup points available in your area yet.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll}>
                {pickupPoints.map((point) => (
                  <TouchableOpacity
                    key={point.id}
                    style={[
                      styles.pickupPointOption,
                      {
                        backgroundColor: selectedPickupPoint?.id === point.id ? colors.primary + '15' : 'transparent',
                        borderColor: selectedPickupPoint?.id === point.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handlePickupPointSelect(point)}
                  >
                    <View style={styles.pickupPointIcon}>
                      <Ionicons
                        name={point.type === 'locker' ? 'cube' : 'storefront'}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.pickupPointContent}>
                      <Text style={[styles.pickupPointName, { color: colors.text }]}>{point.name}</Text>
                      <Text style={[styles.pickupPointAddress, { color: colors.textSecondary }]} numberOfLines={2}>
                        {point.address}
                      </Text>
                      <View style={styles.pickupPointMeta}>
                        {point.distanceKm !== undefined && (
                          <View style={styles.metaItem}>
                            <Ionicons name="navigate" size={14} color={colors.textSecondary} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {point.distanceKm.toFixed(1)} km
                            </Text>
                          </View>
                        )}
                        {point.avgRating > 0 && (
                          <View style={styles.metaItem}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                              {point.avgRating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                        {point.hasRefrigeration && (
                          <View style={styles.metaItem}>
                            <Ionicons name="snow" size={14} color="#00BCD4" />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Cold storage</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {selectedPickupPoint?.id === point.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  methodOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  methodOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  methodIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  methodDescription: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.8,
  },
  methodCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 50,
    marginTop: 4,
  },
  saveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  speedOptions: {
    gap: 8,
  },
  speedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10,
  },
  speedIconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedContent: {
    flex: 1,
  },
  speedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  speedPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  speedDescription: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  selectButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedItemContent: {
    flex: 1,
  },
  selectedItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  placeholderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.12)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  slotLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  pickupPointOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  pickupPointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupPointContent: {
    flex: 1,
  },
  pickupPointName: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickupPointAddress: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  pickupPointMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
