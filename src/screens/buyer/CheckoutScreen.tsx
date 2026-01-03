import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Image,
  Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BuyerStackParamList, DeliveryType, DeliveryMethod, DeliverySpeed, DeliveryTimeSlot, PickupLocationOption } from '../../types';
import { Button, TextInput } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useAppSelector, useAppDispatch } from '../../store';
import { clearCart } from '../../store/slices/cartSlice';
import { selectDefaultAddress, selectAddresses, Address } from '../../store/slices/addressSlice';
import { selectPaymentMethods, selectDefaultPaymentMethod, PaymentMethod as SavedPaymentMethod } from '../../store/slices/paymentSlice';
import { orderService } from '../../services/orderService';
import { walletService, WalletBalance } from '../../services/walletService';
import { paymentService } from '../../services/paymentService';
import { 
  calculateDeliveryPrice, 
  formatDeliveryFee, 
  getAmountForFreeDelivery,
  qualifiesForFreeDelivery,
} from '../../services/deliveryPricingService';
import { useTheme } from '../../context/ThemeContext';
import CouponInput from '../../components/cart/CouponInput';
import { Coupon, CouponValidationResult } from '../../services/couponService';
import DeliveryOptions from '../../components/checkout/DeliveryOptions';
import deliverySchedulingService, { DeliverySlot } from '../../services/deliverySchedulingService';

type Props = NativeStackScreenProps<BuyerStackParamList, 'Checkout'>;

// Enhanced section component with collapsible functionality
interface SectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  badge?: string;
  required?: boolean;
  error?: boolean;
  colors: any;
  isDark: boolean;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon,
  iconColor,
  iconBgColor,
  children,
  collapsible = false,
  defaultExpanded = true,
  badge,
  required,
  error,
  colors,
  isDark,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const animatedHeight = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggleExpand = () => {
    if (!collapsible) return;
    Animated.timing(animatedHeight, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  return (
    <View style={[
      styles.sectionContainer,
      { backgroundColor: isDark ? colors.card : '#FFFFFF' },
      error && styles.sectionError,
    ]}>
      <TouchableOpacity
        activeOpacity={collapsible ? 0.7 : 1}
        onPress={toggleExpand}
        style={styles.sectionHeader}
      >
        <View style={[
          styles.sectionIconContainer,
          { backgroundColor: error ? '#FEE2E2' : (iconBgColor || (isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF')) },
        ]}>
          <Ionicons name={icon} size={18} color={error ? '#EF4444' : (iconColor || colors.primary)} />
        </View>
        <View style={styles.sectionTitleContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[
              styles.sectionTitle,
              { color: error ? '#EF4444' : colors.text },
            ]}>
              {title}
            </Text>
            {required && <Text style={styles.requiredStar}> *</Text>}
          </View>
          {badge && (
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>{badge}</Text>
            </View>
          )}
        </View>
        {collapsible && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        )}
      </TouchableOpacity>
      {(!collapsible || expanded) && (
        <View style={styles.sectionContent}>{children}</View>
      )}
    </View>
  );
};

// Progress indicator for checkout steps
const CheckoutProgress: React.FC<{ currentStep: number; colors: any }> = ({ currentStep, colors }) => {
  const steps = [
    { label: 'Address', icon: 'location' as const },
    { label: 'Delivery', icon: 'bicycle' as const },
    { label: 'Payment', icon: 'card' as const },
    { label: 'Confirm', icon: 'checkmark-circle' as const },
  ];

  return (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isComplete = index < currentStep;
        return (
          <React.Fragment key={step.label}>
            <View style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                isActive && { backgroundColor: colors.primary },
                !isActive && { backgroundColor: colors.border },
              ]}>
                {isComplete ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Ionicons name={step.icon} size={12} color={isActive ? '#FFFFFF' : colors.textSecondary} />
                )}
              </View>
              <Text style={[
                styles.progressLabel,
                { color: isActive ? colors.primary : colors.textSecondary },
              ]}>{step.label}</Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                { backgroundColor: index < currentStep ? colors.primary : colors.border },
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// Order item preview card
const OrderItemPreview: React.FC<{ items: any[]; colors: any; isDark: boolean }> = ({ items, colors, isDark }) => {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const displayItems = items.slice(0, 3);
  const moreCount = items.length - 3;

  return (
    <View style={[styles.orderPreview, { backgroundColor: isDark ? colors.surface : '#F8F9FA' }]}>
      <View style={styles.orderPreviewImages}>
        {displayItems.map((item, index) => (
          <View
            key={item.productId}
            style={[
              styles.orderPreviewImageWrapper,
              { marginLeft: index > 0 ? -10 : 0, zIndex: displayItems.length - index },
            ]}
          >
            {item.product?.images?.[0] ? (
              <Image
                source={{ uri: item.product.images[0] }}
                style={styles.orderPreviewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.orderPreviewImagePlaceholder, { backgroundColor: colors.border }]}>
                <Ionicons name="leaf" size={16} color={colors.textSecondary} />
              </View>
            )}
            {item.quantity > 1 && (
              <View style={[styles.orderPreviewQty, { backgroundColor: colors.primary }]}>
                <Text style={styles.orderPreviewQtyText}>{item.quantity}</Text>
              </View>
            )}
          </View>
        ))}
        {moreCount > 0 && (
          <View style={[styles.orderPreviewMore, { backgroundColor: colors.border }]}>
            <Text style={[styles.orderPreviewMoreText, { color: colors.text }]}>+{moreCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.orderPreviewText, { color: colors.textSecondary }]}>
        {totalItems} {totalItems === 1 ? 'item' : 'items'} in your order
      </Text>
    </View>
  );
};

const DELIVERY_OPTIONS: { type: DeliveryType; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    type: 'ASAP',
    label: 'ASAP',
    description: 'Get it in 30-60 min',
    icon: 'car-sport',
  },
  {
    type: 'SCHEDULED',
    label: 'Scheduled',
    description: 'Pick a time slot',
    icon: 'calendar',
  },
];

type PaymentMethod = 'card' | 'wallet' | 'payForMe';

export default function CheckoutScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { items, total } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);
  const defaultAddress = useAppSelector(selectDefaultAddress);
  const allAddresses = useAppSelector(selectAddresses);
  const savedPaymentMethods = useAppSelector(selectPaymentMethods);
  const defaultSavedCard = useAppSelector(selectDefaultPaymentMethod);
  const savedCards = savedPaymentMethods.filter(m => m.type === 'card');
  const { colors, isDark } = useTheme();
  
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('ASAP');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(defaultAddress || null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [riderNote, setRiderNote] = useState('');
  const [farmerMessage, setFarmerMessage] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Enhanced delivery options state
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home_delivery');
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed>('standard');
  const [enhancedTimeSlot, setEnhancedTimeSlot] = useState<DeliveryTimeSlot | null>(null);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupLocationOption | null>(null);
  const [deliverySpeedPremium, setDeliverySpeedPremium] = useState(0);
  const [pickupPointDiscount, setPickupPointDiscount] = useState(0);
  
  // Send as Gift state
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftRecipientPhone, setGiftRecipientPhone] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  
  // Paystack payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  
  // Pay for Me modal state
  const [showPayForMeModal, setShowPayForMeModal] = useState(false);
  const [payForMeEmail, setPayForMeEmail] = useState('');
  
  // Ref to track if payment verification is in progress (prevents duplicate calls)
  const isVerifyingPaymentRef = useRef(false);
  // Store order data in ref as backup (state can be lost during re-renders)
  const pendingOrderDataRef = useRef<any>(null);
  const [payForMeName, setPayForMeName] = useState('');
  const [payForMePhone, setPayForMePhone] = useState('');
  const [payForMeLink, setPayForMeLink] = useState('');
  const [isGeneratingPayLink, setIsGeneratingPayLink] = useState(false);
  
  // Time slot modal state
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [payLinkGenerated, setPayLinkGenerated] = useState(false);
  
  // API-based delivery slots
  const [apiSlots, setApiSlots] = useState<Map<string, DeliverySlot[]>>(new Map());
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  
  // Pay for Me polling state
  const [payForMeStatus, setPayForMeStatus] = useState<'pending' | 'paid' | 'creating_order' | 'completed' | 'failed'>('pending');
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Address validation error state
  const [addressError, setAddressError] = useState(false);

  // Fetch wallet balance on screen focus
  useFocusEffect(
    useCallback(() => {
      const fetchWalletBalance = async () => {
        try {
          setIsLoadingWallet(true);
          const balance = await walletService.getBalance();
          setWalletBalance(balance);
        } catch (error) {
          console.error('Failed to fetch wallet balance:', error);
        } finally {
          setIsLoadingWallet(false);
        }
      };
      fetchWalletBalance();
    }, [])
  );

  // Fetch delivery slots from API when modal opens
  useEffect(() => {
    if (showTimeSlotModal && deliveryType === 'SCHEDULED') {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        try {
          const days = deliverySchedulingService.getNextDays(3);
          const state = selectedAddress?.state || user?.state;
          const city = selectedAddress?.city || user?.city;
          
          const slotsMap = await deliverySchedulingService.getSlotsForDateRange(
            days.map(d => d.date),
            state,
            city
          );
          setApiSlots(slotsMap);
          
          // Set default selected date to first day with available slots
          if (!selectedDate) {
            for (const day of days) {
              const daySlots = slotsMap.get(day.date) || [];
              if (daySlots.some(s => s.isAvailable)) {
                setSelectedDate(day.date);
                break;
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch delivery slots:', error);
        } finally {
          setIsLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [showTimeSlotModal, deliveryType, selectedAddress, user]);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate delivery distance based on buyer address and farmer pickup location
  const estimatedDistanceKm = useMemo(() => {
    // Get buyer's delivery coordinates
    const buyerLat = selectedAddress?.lat || user?.latitude;
    const buyerLng = selectedAddress?.lng || user?.longitude;
    
    if (!buyerLat || !buyerLng || items.length === 0) {
      return 5; // Default fallback
    }
    
    // Calculate average distance to all farmers in cart
    let totalDistance = 0;
    let validProducts = 0;
    
    items.forEach(item => {
      const product = item.product;
      const farmerLat = product?.pickupLat;
      const farmerLng = product?.pickupLng;
      
      if (farmerLat && farmerLng) {
        totalDistance += calculateDistance(buyerLat, buyerLng, farmerLat, farmerLng);
        validProducts++;
      }
    });
    
    if (validProducts > 0) {
      // Use the maximum distance (furthest farmer) for delivery pricing
      // This ensures the delivery fee covers the full route
      const avgDistance = totalDistance / validProducts;
      return Math.round(avgDistance * 10) / 10; // Round to 1 decimal
    }
    
    return 5; // Default fallback if no coordinates available
  }, [selectedAddress, user, items]);
  
  const deliveryPricing = useMemo(() => {
    return calculateDeliveryPrice({
      distanceKm: estimatedDistanceKm,
      orderTotal: total,
      isExpress: deliveryType === 'ASAP',
      isScheduled: deliveryType === 'SCHEDULED',
    });
  }, [estimatedDistanceKm, total, deliveryType]);

  // Generate available time slots for scheduled delivery
  const timeSlots = useMemo(() => {
    const slots: { id: string; label: string; date: string; time: string; isoDate: string }[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Generate slots for today (if before 6 PM) and next 2 days
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      
      const dateLabel = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : 
        date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      // Time windows: 9-12, 12-3, 3-6, 6-9
      const windows = [
        { start: 9, end: 12, label: '9 AM - 12 PM' },
        { start: 12, end: 15, label: '12 PM - 3 PM' },
        { start: 15, end: 18, label: '3 PM - 6 PM' },
        { start: 18, end: 21, label: '6 PM - 9 PM' },
      ];
      
      windows.forEach((window, idx) => {
        // Skip past time slots for today
        if (dayOffset === 0 && currentHour >= window.start) return;
        
        // Create ISO date for the slot start time
        const slotDate = new Date(date);
        slotDate.setHours(window.start, 0, 0, 0);
        
        slots.push({
          id: `${dayOffset}-${idx}`,
          label: `${dateLabel}, ${window.label}`,
          date: dateLabel,
          time: window.label,
          isoDate: slotDate.toISOString(),
        });
      });
    }
    
    return slots;
  }, []);

  // Calculate delivery fee with speed premium and pickup discount
  const baseDeliveryFee = appliedCoupon?.type === 'free_delivery' ? 0 : deliveryPricing.deliveryFee;
  const deliveryFee = deliveryMethod === 'pickup_point' 
    ? Math.max(0, baseDeliveryFee - pickupPointDiscount) 
    : baseDeliveryFee + deliverySpeedPremium;
  const serviceFee = Math.round(total * 0.02); // 2% service fee
  const discount = couponDiscount;
  const finalTotal = total + deliveryFee + serviceFee - discount;
  
  const hasFreeDelivery = qualifiesForFreeDelivery(total) || appliedCoupon?.type === 'free_delivery';
  const amountForFreeDelivery = getAmountForFreeDelivery(total);

  // Prepare cart items for coupon validation
  const cartItemsForCoupon = useMemo(() => {
    return items.map(item => ({
      productId: item.productId,
      price: Number(item.product.price),
      quantity: item.quantity,
      category: item.product.category?.name || item.product.category,
    }));
  }, [items]);

  // Handle coupon application
  const handleApplyCoupon = (result: CouponValidationResult) => {
    if (result.coupon) {
      setAppliedCoupon(result.coupon);
      setCouponDiscount(result.discountAmount);
      Alert.alert('Coupon Applied!', `You saved ₦${result.discountAmount.toLocaleString()}`);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (response) => {
      console.log('[Checkout] Order created successfully:', response);
      // Reset refs
      isVerifyingPaymentRef.current = false;
      pendingOrderDataRef.current = null;
      setPendingOrderData(null);
      
      if (response.success) {
        dispatch(clearCart());
        // Navigate to Order Confirmation screen with order details
        navigation.replace('OrderConfirmation', {
          orderId: response.data.id,
          orderNumber: response.data.orderNumber || response.data.id.slice(-8).toUpperCase(),
          total: finalTotal,
          itemCount: items.length,
          paymentMethod: paymentMethod,
          estimatedDelivery: deliveryType === 'SCHEDULED' ? getScheduledDeliveryTime() : 'Within 45 mins',
        });
      }
    },
    onError: (error: any) => {
      console.log('[Checkout] Order creation error:', error);
      console.log('[Checkout] Error response:', error?.response?.data);
      // Reset refs so user can retry
      isVerifyingPaymentRef.current = false;
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create order. Please try again.';
      Alert.alert(
        'Order Failed',
        Array.isArray(errorMessage) ? errorMessage.join('\n') : errorMessage
      );
    },
  });

  // Get the ISO date for the selected time slot
  const getScheduledDeliveryTime = () => {
    if (deliveryType !== 'SCHEDULED' || !selectedTimeSlot) return undefined;
    const slot = timeSlots.find(s => s.id === selectedTimeSlot);
    return slot?.isoDate;
  };

  const canAffordWithWallet = walletBalance ? walletBalance.available >= finalTotal : false;

  const handlePlaceOrder = async () => {
    // Reset error state
    setAddressError(false);
    
    if (items.length === 0) {
      Alert.alert('Cart is empty', 'Add items to your cart first');
      return;
    }

    // Validate address
    if (!selectedAddress && !user?.address) {
      setAddressError(true);
      Alert.alert(
        'No Delivery Address',
        'Please add a delivery address before placing your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Address', onPress: () => setShowAddressPicker(true) }
        ]
      );
      return;
    }

    if (deliveryType === 'SCHEDULED' && !selectedTimeSlot) {
      Alert.alert('Select Time Slot', 'Please select a delivery time slot for your scheduled order');
      return;
    }

    // Validate gift details if sending as gift
    if (isGift) {
      if (!giftRecipientName.trim()) {
        Alert.alert('Gift Recipient Required', 'Please enter the recipient\'s name');
        return;
      }
      if (!giftRecipientPhone.trim()) {
        Alert.alert('Gift Recipient Phone Required', 'Please enter the recipient\'s phone number');
        return;
      }
    }

    if (paymentMethod === 'wallet') {
      if (!canAffordWithWallet) {
        Alert.alert(
          'Insufficient Balance',
          `Your wallet balance is ₦${walletBalance?.available.toLocaleString() || 0}. You need ₦${finalTotal.toLocaleString()} to complete this order.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Top Up Wallet', 
              onPress: () => navigation.navigate('TopUp' as any) 
            },
          ]
        );
        return;
      }

      try {
        setIsProcessingPayment(true);
        
        // Backend now handles wallet deduction during order creation
        // Just create the order with paymentMethod: 'wallet'
        console.log('[Checkout] Creating order with wallet payment');

        createOrderMutation.mutate({
          deliveryAddress: deliveryMethod === 'pickup_point' && selectedPickupPoint ? {
            address: selectedPickupPoint.address,
            city: selectedPickupPoint.city,
            state: selectedPickupPoint.state,
            lat: selectedPickupPoint.latitude,
            lng: selectedPickupPoint.longitude,
          } : {
            address: selectedAddress ? `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''}` : user?.address || 'Unknown address',
            city: selectedAddress?.city || user?.city || 'Unknown city',
            state: selectedAddress?.state || user?.state || 'Unknown state',
            lat: selectedAddress?.lat || user?.latitude || 6.5244,
            lng: selectedAddress?.lng || user?.longitude || 3.3792,
          },
          discountCode: appliedCoupon?.code || undefined,
          discountAmount: couponDiscount || undefined,
          paymentMethod: 'wallet',
          deliveryType,
          deliveryMethod,
          deliverySpeed,
          selectedPickupPoint: selectedPickupPoint?.id || undefined,
          selectedTimeSlot: enhancedTimeSlot || undefined,
          deliverySpeedPremium: deliverySpeedPremium || undefined,
          pickupPointDiscount: pickupPointDiscount || undefined,
          scheduledDeliveryTime: getScheduledDeliveryTime(),
          notes: orderNotes || undefined,
          riderNote: riderNote || undefined,
          farmerMessage: farmerMessage || undefined,
          items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
          isGift: isGift || undefined,
          giftDetails: isGift ? {
            recipientName: giftRecipientName,
            recipientPhone: giftRecipientPhone,
            message: giftMessage || undefined,
          } : undefined,
        });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
        Alert.alert('Error', errorMessage);
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    // For Pay for Me, open the modal to enter recipient details
    if (paymentMethod === 'payForMe') {
      setShowPayForMeModal(true);
      return;
    }

    // For card payments, initialize Paystack payment
    try {
      setIsProcessingPayment(true);
      
      // Store order data for after payment verification
      const orderData = {
        deliveryAddress: deliveryMethod === 'pickup_point' && selectedPickupPoint ? {
          address: selectedPickupPoint.address,
          city: selectedPickupPoint.city,
          state: selectedPickupPoint.state,
          lat: selectedPickupPoint.latitude,
          lng: selectedPickupPoint.longitude,
        } : {
          address: selectedAddress ? `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''}` : user?.address || 'Unknown address',
          city: selectedAddress?.city || user?.city || 'Unknown city',
          state: selectedAddress?.state || user?.state || 'Unknown state',
          lat: selectedAddress?.lat || user?.latitude || 6.5244,
          lng: selectedAddress?.lng || user?.longitude || 3.3792,
        },
        discountCode: appliedCoupon?.code || undefined,
        discountAmount: couponDiscount || undefined,
        paymentMethod: 'card',
        deliveryType,
        deliveryMethod,
        deliverySpeed,
        selectedPickupPoint: selectedPickupPoint?.id || undefined,
        selectedTimeSlot: enhancedTimeSlot || undefined,
        deliverySpeedPremium: deliverySpeedPremium || undefined,
        pickupPointDiscount: pickupPointDiscount || undefined,
        scheduledDeliveryTime: getScheduledDeliveryTime(),
        notes: orderNotes || undefined,
        riderNote: riderNote || undefined,
        farmerMessage: farmerMessage || undefined,
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
        isGift: isGift || undefined,
        giftDetails: isGift ? {
          recipientName: giftRecipientName,
          recipientPhone: giftRecipientPhone,
          message: giftMessage || undefined,
        } : undefined,
      };
      // Store in both state and ref (ref is backup in case state is lost)
      setPendingOrderData(orderData);
      pendingOrderDataRef.current = orderData;
      
      // Initialize Paystack payment
      const result = await paymentService.initializePaystackPayment({
        amount: finalTotal,
        type: 'order_payment',
      });
      
      if (result && result.authorizationUrl) {
        setPaymentUrl(result.authorizationUrl);
        setPaymentReference(result.reference);
        setShowPaymentModal(true);
      } else {
        Alert.alert('Error', 'Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Paystack WebView navigation
  const handlePaymentWebViewNavigation = (navState: any) => {
    const { url, title } = navState;
    
    if (!url) return;
    
    console.log('[Checkout] WebView URL:', url);
    console.log('[Checkout] WebView Title:', title);
    
    // Check for success in page title (Paystack shows "Transaction Successful" or similar)
    if (title && (
      title.toLowerCase().includes('success') ||
      title.toLowerCase().includes('approved') ||
      title.toLowerCase().includes('completed')
    )) {
      console.log('[Checkout] Success detected via title, triggering verification');
      setShowPaymentModal(false);
      setPaymentUrl('');
      verifyPaymentAndCreateOrder(paymentReference);
      return;
    }
    
    // Check for success/callback URL patterns (Paystack redirects)
    if (
      url.includes('callback') || 
      url.includes('trxref=') || 
      url.includes('reference=')
    ) {
      console.log('[Checkout] Callback URL detected, triggering verification');
      setShowPaymentModal(false);
      setPaymentUrl('');
      verifyPaymentAndCreateOrder(paymentReference);
      return;
    }
    
    // Check for cancel patterns
    if (url.includes('cancel') || url.includes('close') || url.includes('failed')) {
      setShowPaymentModal(false);
      setPaymentUrl('');
      setPendingOrderData(null);
      Alert.alert('Payment Cancelled', 'You cancelled the payment.');
      return;
    }
  };

  // JavaScript to inject into WebView to detect Paystack success
  const injectedJavaScript = `
    (function() {
      // Monitor for success messages in the page
      const observer = new MutationObserver(function(mutations) {
        const bodyText = document.body.innerText || '';
        if (
          bodyText.includes('Transaction Successful') ||
          bodyText.includes('Payment Successful') ||
          bodyText.includes('Your payment was successful') ||
          bodyText.includes('Transaction successful')
        ) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', event: 'payment_complete' }));
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      
      // Also check on load
      setTimeout(function() {
        const bodyText = document.body.innerText || '';
        if (
          bodyText.includes('Transaction Successful') ||
          bodyText.includes('Payment Successful') ||
          bodyText.includes('Your payment was successful')
        ) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', event: 'payment_complete' }));
        }
      }, 1000);
    })();
    true;
  `;

  // Handle URL requests before loading (better for catching redirects)
  const handleShouldStartLoad = (request: any) => {
    const { url } = request;
    
    // Check if this is a callback/redirect URL
    if (url.includes('callback') || url.includes('trxref=') || url.includes('reference=')) {
      // Close modal and verify payment
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentUrl('');
        verifyPaymentAndCreateOrder(paymentReference);
      }, 100);
      return false; // Don't load this URL in WebView
    }
    
    return true; // Allow other URLs
  };

  // Verify payment and create order
  const verifyPaymentAndCreateOrder = async (reference: string) => {
    // Prevent duplicate calls
    if (isVerifyingPaymentRef.current) {
      console.log('[Checkout] Already verifying payment, skipping duplicate call');
      return;
    }
    
    isVerifyingPaymentRef.current = true;
    
    try {
      setIsProcessingPayment(true);
      console.log('[Checkout] Starting payment verification for reference:', reference);
      
      // Verify payment with Paystack
      const verifyResult = await paymentService.verifyPaystackPayment(reference);
      
      console.log('[Checkout] Payment verification result:', verifyResult);
      
      if (verifyResult.status === 'success') {
        // Payment successful, create order
        // Use ref as backup if state was lost
        const orderData = pendingOrderData || pendingOrderDataRef.current;
        
        if (orderData) {
          console.log('[Checkout] Creating order with data:', {
            ...orderData,
            paymentReference: reference,
          });
          createOrderMutation.mutate({
            ...orderData,
            paymentReference: reference,
          });
        } else {
          console.log('[Checkout] ERROR: No pending order data in state or ref!');
          Alert.alert('Error', 'Order data was lost. Please try again.');
          isVerifyingPaymentRef.current = false;
        }
      } else {
        console.log('[Checkout] Payment verification returned non-success status:', verifyResult.status);
        Alert.alert('Payment Failed', 'Your payment could not be verified. Please try again.');
        isVerifyingPaymentRef.current = false;
      }
    } catch (error: any) {
      console.log('[Checkout] Payment verification error:', error);
      Alert.alert('Error', error?.message || 'Failed to verify payment. Please contact support.');
      isVerifyingPaymentRef.current = false;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle close payment modal
  const handleClosePaymentModal = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: async () => {
            // Cancel payment on backend (sends cancellation email)
            if (paymentReference) {
              try {
                await paymentService.cancelPaystackPayment(paymentReference);
              } catch (error) {
                console.log('Failed to cancel payment on backend:', error);
              }
            }
            setShowPaymentModal(false);
            setPaymentUrl('');
            setPaymentReference('');
            setPendingOrderData(null);
          }
        },
      ]
    );
  };

  // Handle Generate Pay for Me Link
  const handleGeneratePayForMeLink = async () => {
    // Validate inputs
    if (!payForMeName.trim()) {
      Alert.alert('Name Required', 'Please enter the name of the person who will pay');
      return;
    }
    if (!payForMeEmail.trim()) {
      Alert.alert('Email Required', 'Please enter the email of the person who will pay');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payForMeEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setIsGeneratingPayLink(true);
      setPayForMeStatus('pending');
      
      const result = await paymentService.generatePayForMeLink({
        amount: finalTotal,
        recipientName: payForMeName.trim(),
        recipientEmail: payForMeEmail.trim(),
        recipientPhone: payForMePhone.trim() || undefined,
        description: `Payment for order - ${items.length} item${items.length > 1 ? 's' : ''} (₦${finalTotal.toLocaleString()})`,
      });

      if (result.success && result.paymentLink) {
        setPayForMeLink(result.paymentLink);
        setPaymentReference(result.reference);
        setPayLinkGenerated(true);
        // Start polling for payment status
        startPaymentPolling(result.reference);
      } else {
        Alert.alert('Error', 'Failed to generate payment link. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to generate payment link';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsGeneratingPayLink(false);
    }
  };

  // Start polling for Pay for Me payment status
  const startPaymentPolling = (reference: string) => {
    console.log('[PayForMe] Starting payment polling for reference:', reference);
    setIsPollingPayment(true);
    
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const result = await paymentService.checkPayForMeStatus(reference);
        console.log('[PayForMe] Poll result:', result);
        
        if (result.status === 'success') {
          console.log('[PayForMe] Payment successful! Creating order...');
          stopPaymentPolling();
          setPayForMeStatus('paid');
          // Payment confirmed - create order
          await createPayForMeOrder(reference);
        }
      } catch (error) {
        console.log('[PayForMe] Polling error:', error);
      }
    }, 5000);
  };

  // Stop polling
  const stopPaymentPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPollingPayment(false);
  };

  // Create order after Pay for Me payment is confirmed
  const createPayForMeOrder = async (reference: string) => {
    try {
      setPayForMeStatus('creating_order');
      console.log('[PayForMe] Creating order with reference:', reference);
      
      createOrderMutation.mutate({
        deliveryAddress: deliveryMethod === 'pickup_point' && selectedPickupPoint ? {
          address: selectedPickupPoint.address,
          city: selectedPickupPoint.city,
          state: selectedPickupPoint.state,
          lat: selectedPickupPoint.latitude,
          lng: selectedPickupPoint.longitude,
        } : {
          address: selectedAddress ? `${selectedAddress.addressLine1}${selectedAddress.addressLine2 ? ', ' + selectedAddress.addressLine2 : ''}` : user?.address || 'Unknown address',
          city: selectedAddress?.city || user?.city || 'Unknown city',
          state: selectedAddress?.state || user?.state || 'Unknown state',
          lat: selectedAddress?.lat || user?.latitude || 6.5244,
          lng: selectedAddress?.lng || user?.longitude || 3.3792,
        },
        discountCode: appliedCoupon?.code || undefined,
        discountAmount: couponDiscount || undefined,
        paymentMethod: 'card',
        paymentReference: reference,
        deliveryType,
        deliveryMethod,
        deliverySpeed,
        selectedPickupPoint: selectedPickupPoint?.id || undefined,
        selectedTimeSlot: enhancedTimeSlot || undefined,
        deliverySpeedPremium: deliverySpeedPremium || undefined,
        pickupPointDiscount: pickupPointDiscount || undefined,
        scheduledDeliveryTime: getScheduledDeliveryTime(),
        notes: orderNotes || undefined,
        riderNote: riderNote || undefined,
        farmerMessage: farmerMessage || undefined,
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
        isGift: isGift || undefined,
        giftDetails: isGift ? {
          recipientName: giftRecipientName,
          recipientPhone: giftRecipientPhone,
          message: giftMessage || undefined,
        } : undefined,
      }, {
        onSuccess: () => {
          console.log('[PayForMe] Order created successfully!');
          setPayForMeStatus('completed');
        },
        onError: (error: any) => {
          console.error('[PayForMe] Order creation failed:', error);
          setPayForMeStatus('failed');
        },
      });
    } catch (error) {
      console.error('[PayForMe] Order creation error:', error);
      setPayForMeStatus('failed');
    }
  };
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Share Pay for Me link
  const handleSharePayForMeLink = async () => {
    if (!payForMeLink) return;
    
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: `Hi ${payForMeName}! Please help me pay for my order using this link:\n\n${payForMeLink}\n\nTotal amount: ₦${finalTotal.toLocaleString()}\n\nThank you! 🙏`,
        title: 'Pay for My Order',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Copy Pay for Me link to clipboard
  const handleCopyPayForMeLink = async () => {
    if (!payForMeLink) return;
    
    try {
      const { Clipboard } = require('react-native');
      // Use expo-clipboard if available, fallback to RN Clipboard
      try {
        const ExpoClipboard = require('expo-clipboard');
        await ExpoClipboard.setStringAsync(payForMeLink);
      } catch {
        Clipboard.setString(payForMeLink);
      }
      Alert.alert('Copied!', 'Payment link copied to clipboard');
    } catch (error) {
      console.log('Copy error:', error);
    }
  };

  // Close Pay for Me modal
  const handleClosePayForMeModal = () => {
    if (payForMeStatus === 'creating_order' || payForMeStatus === 'completed') {
      // Don't allow closing while order is being created or just completed
      return;
    }
    
    if (payLinkGenerated && payForMeStatus === 'pending') {
      Alert.alert(
        'Stop Waiting for Payment?',
        'We\'re waiting for the payment. If you close, you\'ll need to generate a new link later.',
        [
          { text: 'Keep Waiting', style: 'cancel' },
          { 
            text: 'Close Anyway', 
            style: 'destructive',
            onPress: () => resetPayForMeState()
          },
        ]
      );
    } else if (payForMeStatus === 'paid') {
      Alert.alert(
        'Payment Received!',
        'The payment was successful. Please wait while we create your order.',
        [{ text: 'OK', style: 'cancel' }]
      );
    } else {
      resetPayForMeState();
    }
  };

  const resetPayForMeState = () => {
    stopPaymentPolling();
    setShowPayForMeModal(false);
    setPayForMeName('');
    setPayForMeEmail('');
    setPayForMePhone('');
    setPayForMeLink('');
    setPayLinkGenerated(false);
    setPayForMeStatus('pending');
    setPaymentReference('');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Enhanced Fixed Header with Gradient */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>Checkout</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {items.reduce((sum, i) => sum + i.quantity, 0)} items • ₦{total.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.headerSecureIcon, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.1)' }]}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Preview */}
        <OrderItemPreview items={items} colors={colors} isDark={isDark} />

        {/* Progress Indicator */}
        <CheckoutProgress 
          currentStep={
            !selectedAddress && !user?.address ? 0 : 
            deliveryMethod === 'home_delivery' && deliveryType === 'SCHEDULED' && !selectedTimeSlot ? 1 : 
            paymentMethod === 'card' ? 2 : 3
          } 
          colors={colors} 
        />

        {/* Delivery Address */}
        <Section
          title="Delivery Address"
          icon="location"
          required
          error={addressError}
          colors={colors}
          isDark={isDark}
        >
          <TouchableOpacity 
            style={styles.addressRow}
            onPress={() => {
              setAddressError(false);
              setShowAddressPicker(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.addressDetails}>
              <Text 
                style={[styles.addressLabel, { color: addressError ? '#EF4444' : colors.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedAddress 
                  ? selectedAddress.addressLine1 
                  : (user?.address || 'No address saved')}
              </Text>
              <Text 
                style={[styles.addressText, { color: addressError ? '#EF4444' : colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedAddress 
                  ? `${selectedAddress.city}, ${selectedAddress.state}` 
                  : (user?.address ? `${user?.city || ''}, ${user?.state || ''}` : 'Tap to add address')}
              </Text>
            </View>
            <View style={[styles.changeButton, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.changeText, { color: colors.primary }]}>
                {(selectedAddress || user?.address) ? 'Change' : 'Add'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
          {addressError && (
            <View style={styles.errorMessage}>
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>Please add a delivery address to continue</Text>
            </View>
          )}
        </Section>

        {/* Send as Gift Option */}
        <Section
          title="Send as Gift"
          icon="gift"
          iconColor={isGift ? '#E91E63' : undefined}
          iconBgColor={isGift ? '#FCE4EC' : undefined}
          badge={isGift ? 'Active' : undefined}
          colors={colors}
          isDark={isDark}
        >
          <TouchableOpacity
            style={styles.giftToggleRow}
            onPress={() => setIsGift(!isGift)}
            activeOpacity={0.7}
          >
            <View style={styles.giftToggleContent}>
              <Text style={[styles.giftToggleLabel, { color: colors.text }]}>Send as a Gift</Text>
              <Text style={[styles.giftToggleDesc, { color: colors.textSecondary }]}>
                {isGift ? 'Gift details below' : 'Add gift message & recipient'}
              </Text>
            </View>
            <View style={[
              styles.toggleSwitch,
              { backgroundColor: isGift ? '#E91E63' : (isDark ? 'rgba(255,255,255,0.2)' : '#E5E5EA') }
            ]}>
              <View style={[
                styles.toggleKnob,
                { transform: [{ translateX: isGift ? 18 : 2 }] }
              ]} />
            </View>
          </TouchableOpacity>
          
          {/* Gift Details - Shown when isGift is true */}
          {isGift && (
            <View style={[styles.giftDetailsContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              <View style={styles.giftInputGroup}>
                <Text style={[styles.giftInputLabel, { color: colors.text }]}>Recipient's Name *</Text>
                <View style={[styles.giftInputWrapper, { backgroundColor: isDark ? colors.surface : '#F2F2F7', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                  <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.giftInputIcon} />
                  <RNTextInput
                    placeholder="Enter recipient's name"
                    value={giftRecipientName}
                    onChangeText={setGiftRecipientName}
                    style={[styles.giftInput, { color: colors.text }]}
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : colors.textSecondary}
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                  />
                </View>
              </View>
              
              <View style={styles.giftInputGroup}>
                <Text style={[styles.giftInputLabel, { color: colors.text }]}>Recipient's Phone *</Text>
                <View style={[styles.giftInputWrapper, { backgroundColor: isDark ? colors.surface : '#F2F2F7', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                  <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={styles.giftInputIcon} />
                  <RNTextInput
                    placeholder="Enter phone number"
                    value={giftRecipientPhone}
                    onChangeText={setGiftRecipientPhone}
                    keyboardType="phone-pad"
                    style={[styles.giftInput, { color: colors.text }]}
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : colors.textSecondary}
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                  />
                </View>
              </View>
              
              <View style={styles.giftInputGroup}>
                <Text style={[styles.giftInputLabel, { color: colors.text }]}>Gift Message</Text>
                <View style={[styles.giftInputWrapper, styles.giftMessageWrapper, { backgroundColor: isDark ? colors.surface : '#F2F2F7', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} style={[styles.giftInputIcon, { marginTop: 12 }]} />
                  <RNTextInput
                    placeholder="Add a personal message (optional)"
                    value={giftMessage}
                    onChangeText={setGiftMessage}
                    multiline
                    numberOfLines={3}
                    style={[styles.giftMessageInput, { color: colors.text }]}
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : colors.textSecondary}
                    keyboardAppearance={isDark ? 'dark' : 'light'}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          )}
        </Section>

        {/* Delivery Time Section */}
        <Section
          title="Delivery Time"
          icon="time"
          colors={colors}
          isDark={isDark}
        >
          <View style={styles.deliveryOptionsRow}>
            {DELIVERY_OPTIONS.map((option) => {
              const isSelected = deliveryType === option.type;
              return (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.deliveryOption,
                    { 
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: isSelected 
                        ? colors.primary 
                        : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'),
                    },
                    isSelected && { borderWidth: 2 },
                  ]}
                  onPress={() => setDeliveryType(option.type)}
                  activeOpacity={0.7}
              >
                <View style={[
                  styles.deliveryIconContainer,
                  { backgroundColor: isSelected 
                    ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF') 
                    : (isDark ? colors.surface : '#F2F2F7') 
                  }
                ]}>
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={isSelected ? colors.primary : colors.textSecondary} 
                  />
                </View>
                <Text style={[
                  styles.deliveryLabel,
                  { color: isSelected ? colors.primary : colors.text },
                ]}>
                  {option.label}
                </Text>
                <Text style={[styles.deliveryDescription, { color: colors.textSecondary }]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>

          {/* Time Slot Picker - Only show when Scheduled is selected */}
          {deliveryType === 'SCHEDULED' && (
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.timeSlotSelector, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}
                onPress={() => setShowTimeSlotModal(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.timeSlotSelectorIcon, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.timeSlotSelectorContent}>
                  {selectedSlot && selectedDate ? (
                    <>
                      <Text style={[styles.timeSlotSelectorLabel, { color: colors.text }]}>
                        {deliverySchedulingService.getNextDays(3).find(d => d.date === selectedDate)?.label || selectedDate}
                      </Text>
                      <Text style={[styles.timeSlotSelectorValue, { color: colors.textSecondary }]}>
                        {selectedSlot.displayTime} ({selectedSlot.name})
                        {selectedSlot.additionalFee > 0 && ` +₦${selectedSlot.additionalFee}`}
                      </Text>
                    </>
                  ) : selectedTimeSlot ? (
                    <>
                      <Text style={[styles.timeSlotSelectorLabel, { color: colors.text }]}>
                        {timeSlots.find(s => s.id === selectedTimeSlot)?.date}
                      </Text>
                      <Text style={[styles.timeSlotSelectorValue, { color: colors.textSecondary }]}>
                        {timeSlots.find(s => s.id === selectedTimeSlot)?.time}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.timeSlotSelectorLabel, { color: colors.text }]}>
                        Choose delivery time
                      </Text>
                      <Text style={[styles.timeSlotSelectorValue, { color: colors.textSecondary }]}>
                        Tap to select a time slot
                      </Text>
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </Section>

        {/* Enhanced Delivery Options - Speed, Pickup Points */}
        <Section
          title="Delivery Options"
          icon="car"
          iconColor="#8E44AD"
          iconBgColor={isDark ? 'rgba(142, 68, 173, 0.15)' : '#F5EEF8'}
          badge={deliveryMethod === 'pickup_point' ? 'Save 20%' : undefined}
          colors={colors}
          isDark={isDark}
        >
          <DeliveryOptions
            baseDeliveryFee={deliveryPricing.deliveryFee}
            userLatitude={selectedAddress?.lat || user?.latitude}
            userLongitude={selectedAddress?.lng || user?.longitude}
            userCity={selectedAddress?.city || user?.city}
            userState={selectedAddress?.state || user?.state}
            initialMethod={deliveryMethod}
            initialSpeed={deliverySpeed}
            onDeliveryMethodChange={(method: DeliveryMethod) => {
              setDeliveryMethod(method);
              if (method === 'home_delivery') {
                setSelectedPickupPoint(null);
                setPickupPointDiscount(0);
              }
            }}
            onDeliverySpeedChange={(speed: DeliverySpeed, premium: number) => {
              setDeliverySpeed(speed);
              setDeliverySpeedPremium(premium);
            }}
            onTimeSlotChange={setEnhancedTimeSlot}
            onPickupPointChange={(pickup: PickupLocationOption | null, discount: number) => {
              setSelectedPickupPoint(pickup);
              setPickupPointDiscount(discount);
            }}
          />
        </Section>

        {/* Payment Method Section */}
        <Section
          title="Payment Method"
          icon="card"
          iconColor={colors.primary}
          iconBgColor={isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF'}
          colors={colors}
          isDark={isDark}
        >
          {/* Wallet Option */}
          <TouchableOpacity
            style={[
              styles.paymentListRow,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' },
            ]}
            onPress={() => setPaymentMethod('wallet')}
            activeOpacity={0.7}
          >
            <View style={[styles.paymentIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="wallet" size={18} color="#43A047" />
            </View>
            <View style={styles.paymentOptionInfo}>
              <Text style={[styles.paymentOptionLabel, { color: colors.text }]}>Wallet Balance</Text>
              {isLoadingWallet ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={[
                  styles.paymentOptionBalance,
                  { color: canAffordWithWallet ? '#43A047' : COLORS.error }
                ]}>
                  ₦{(walletBalance?.available || 0).toLocaleString()}
                  {!canAffordWithWallet && ' (Insufficient)'}
                </Text>
              )}
            </View>
            <View style={[
              styles.radioButton,
              { borderColor: paymentMethod === 'wallet' ? colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : '#C7C7CC') },
            ]}>
              {paymentMethod === 'wallet' && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>

          {/* Card Payment Option */}
          <TouchableOpacity
            style={[
              styles.paymentListRow,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' },
            ]}
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.7}
          >
            <View style={[styles.paymentIconBg, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="card" size={18} color="#1976D2" />
            </View>
            <View style={styles.paymentOptionInfo}>
              <Text style={[styles.paymentOptionLabel, { color: colors.text }]}>
                {savedCards.length > 0 ? `Card •••• ${savedCards[0]?.cardNumber?.slice(-4) || ''}` : 'Pay with Card'}
              </Text>
              <Text style={[styles.paymentOptionDesc, { color: colors.textSecondary }]}>
                {savedCards.length > 0 ? 'Secure payment' : 'Visa, Mastercard, Verve'}
              </Text>
            </View>
            <View style={[
              styles.radioButton,
              { borderColor: paymentMethod === 'card' ? colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : '#C7C7CC') },
            ]}>
              {paymentMethod === 'card' && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>

          {/* Pay for Me Option */}
          <TouchableOpacity
            style={[styles.paymentListRow, { borderBottomWidth: 0 }]}
            onPress={() => setPaymentMethod('payForMe')}
            activeOpacity={0.7}
          >
            <View style={[styles.paymentIconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="people" size={18} color="#FF6B00" />
            </View>
            <View style={styles.paymentOptionInfo}>
              <Text style={[styles.paymentOptionLabel, { color: colors.text }]}>Pay for Me</Text>
              <Text style={[styles.paymentOptionDesc, { color: colors.textSecondary }]}>Send payment link to someone</Text>
            </View>
            <View style={[
              styles.radioButton,
              { borderColor: paymentMethod === 'payForMe' ? colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : '#C7C7CC') },
            ]}>
              {paymentMethod === 'payForMe' && <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>
          
          {/* Top Up Link - Inside payment section */}
          {paymentMethod === 'wallet' && !canAffordWithWallet && (
            <TouchableOpacity 
              style={[styles.topUpLink, { marginTop: 12 }]}
              onPress={() => navigation.navigate('TopUp' as any)}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.topUpLinkText, { color: colors.primary }]}>Top up your wallet</Text>
            </TouchableOpacity>
          )}
        </Section>

        {/* Coupon Code Section */}
        <Section
          title="Coupon Code"
          icon="pricetag"
          iconColor="#FF6B00"
          iconBgColor={isDark ? 'rgba(255, 107, 0, 0.15)' : '#FFF3E0'}
          badge={appliedCoupon ? 'Applied' : undefined}
          colors={colors}
          isDark={isDark}
        >
          <CouponInput
            subtotal={total}
            deliveryFee={deliveryPricing.deliveryFee}
            cartItems={cartItemsForCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            appliedCoupon={appliedCoupon}
          />
        </Section>

        {/* Message for Farmer Section */}
        <Section
          title="Message for Farmer"
          icon="leaf"
          iconColor="#43A047"
          iconBgColor={isDark ? 'rgba(76, 175, 80, 0.15)' : '#E8F5E9'}
          collapsible
          defaultCollapsed
          colors={colors}
          isDark={isDark}
        >
          <View style={styles.farmerMessageHeader}>
            <View style={styles.farmerMessageHeaderText}>
              <Text style={[styles.farmerMessageSubtitle, { color: colors.textSecondary }]}>
                Let the farmer know your preferences
              </Text>
            </View>
          </View>
          <TextInput
            placeholder="e.g., Pick ripe ones only, no stems, extra fresh..."
            value={farmerMessage}
            onChangeText={setFarmerMessage}
            multiline
            numberOfLines={3}
            containerStyle={styles.farmerMessageInput}
            style={{ minHeight: 70, textAlignVertical: 'top', fontSize: 13 }}
          />
        </Section>

        {/* Delivery Instructions Section */}
        <Section
          title="Delivery Instructions"
          icon="document-text"
          colors={colors}
          isDark={isDark}
          collapsible
          defaultCollapsed
        >
          <TextInput
            placeholder="Gate code, leave at door, etc."
            value={orderNotes}
            onChangeText={setOrderNotes}
            containerStyle={styles.notesInput}
            style={{ minHeight: 40 }}
          />
        </Section>

        {/* Note for Rider Section */}
        <Section
          title="Note for Rider"
          icon="bicycle"
          iconColor={colors.primary}
          iconBgColor={isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF'}
          collapsible
          defaultCollapsed
          colors={colors}
          isDark={isDark}
        >
          <Text style={[styles.riderNoteHeaderText, { color: colors.textSecondary, marginBottom: 8 }]}>
            Special instructions for the delivery rider
          </Text>
          <TextInput
            placeholder="e.g., Call when you arrive, use back entrance, look for the red gate..."
            value={riderNote}
            onChangeText={setRiderNote}
            multiline
            numberOfLines={2}
            containerStyle={styles.riderNoteInput}
            style={{ minHeight: 50, textAlignVertical: 'top' }}
          />
        </Section>

        {/* Order Summary Section */}
        <Section
          title="Order Summary"
          icon="receipt"
          colors={colors}
          isDark={isDark}
        >
          <View style={[styles.summaryRow, styles.summaryRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Items ({items.reduce((sum, i) => sum + i.quantity, 0)})
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₦{total.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Delivery ({estimatedDistanceKm.toFixed(1)} km)
            </Text>
            {hasFreeDelivery ? (
              <Text style={[styles.summaryValue, { color: '#34C759', fontWeight: '600' }]}>FREE</Text>
            ) : (
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatDeliveryFee(deliveryFee)}</Text>
            )}
          </View>
          {!hasFreeDelivery && amountForFreeDelivery > 0 && (
            <TouchableOpacity 
              style={styles.freeDeliveryHint} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle" size={14} color={colors.primary} />
              <Text style={[styles.freeDeliveryHintText, { color: colors.primary }]}>
                Add ₦{amountForFreeDelivery.toLocaleString()} more for free delivery
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
          {deliveryType === 'ASAP' && deliveryPricing.breakdown.expressPremium > 0 && (
            <View style={[styles.summaryRow, styles.summaryRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Express Premium</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                +₦{deliveryPricing.breakdown.expressPremium.toLocaleString()}
              </Text>
            </View>
          )}
          {appliedCoupon && discount > 0 && (
            <View style={[styles.summaryRow, styles.summaryRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="pricetag" size={14} color="#34C759" style={{ marginRight: 4 }} />
                <Text style={[styles.summaryLabel, { color: '#34C759' }]}>
                  Coupon ({appliedCoupon.code})
                </Text>
              </View>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>-₦{discount.toLocaleString()}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryRowBorder, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service Fee (2%)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₦{serviceFee.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>₦{finalTotal.toLocaleString()}</Text>
          </View>
          <Text style={[styles.estimatedTimeText, { color: colors.textSecondary }]}>
            Estimated delivery: {deliveryPricing.estimatedTime} mins
          </Text>
        </Section>

        {/* Terms of Use Section */}
        <View style={[styles.termsSection, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            By placing this order, you agree to our{' '}
            <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>.
          </Text>
          <View style={styles.termsInfo}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.termsInfoText, { color: colors.textSecondary }]}>
              Your payment information is securely encrypted
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <Button
          title={`Place Order • ₦${finalTotal.toLocaleString()}`}
          onPress={handlePlaceOrder}
          loading={createOrderMutation.isPending || isProcessingPayment}
          disabled={paymentMethod === 'wallet' && !canAffordWithWallet}
          fullWidth
        />
      </View>

      {/* Paystack Payment WebView Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClosePaymentModal}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={[styles.paymentModalContainer, { backgroundColor: '#FFFFFF', paddingTop: insets.top }]}>
          <View style={[styles.paymentModalHeader, { backgroundColor: '#FFFFFF' }]}>
            <TouchableOpacity onPress={handleClosePaymentModal} style={styles.paymentModalCloseBtn}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={[styles.paymentModalTitle, { color: '#1F2937' }]}>Complete Payment</Text>
            <View style={styles.placeholder} />
          </View>
          
          {paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handlePaymentWebViewNavigation}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              injectedJavaScript={injectedJavaScript}
              style={styles.paymentWebView}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.webViewLoadingText, { color: colors.textSecondary }]}>
                    Loading secure payment...
                  </Text>
                </View>
              )}
              onMessage={(event) => {
                // Handle messages from injected JS or Paystack
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.status === 'success' || data.event === 'successful' || data.event === 'payment_complete') {
                    setShowPaymentModal(false);
                    setPaymentUrl('');
                    verifyPaymentAndCreateOrder(paymentReference);
                  }
                } catch (e) {
                  // Not a JSON message, ignore
                }
              }}
            />
          ) : (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </Modal>

      {/* Pay for Me Modal */}
      <Modal
        visible={showPayForMeModal}
        animationType="slide"
        transparent
        onRequestClose={handleClosePayForMeModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.payForMeModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Pay for Me</Text>
              <TouchableOpacity onPress={handleClosePayForMeModal}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {!payLinkGenerated ? (
              <ScrollView style={styles.payForMeForm} showsVerticalScrollIndicator={false}>
                <Text style={[styles.payForMeDescription, { color: colors.textSecondary }]}>
                  Enter the details of the person who will pay for your order. We'll generate a secure payment link to share with them.
                </Text>

                <View style={styles.payForMeInputGroup}>
                  <Text style={[styles.payForMeLabel, { color: colors.text }]}>Their Name *</Text>
                  <View style={[styles.payForMeInputContainer, { backgroundColor: isDark ? colors.surface : '#F2F2F7', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                    <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.payForMeInputIcon} />
                    <RNTextInput
                      placeholder="Enter their name"
                      value={payForMeName}
                      onChangeText={setPayForMeName}
                      style={[styles.payForMeInput, { color: colors.text }]}
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : colors.textSecondary}
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                    />
                  </View>
                </View>

                <View style={styles.payForMeInputGroup}>
                  <Text style={[styles.payForMeLabel, { color: colors.text }]}>Their Email *</Text>
                  <View style={[styles.payForMeInputContainer, { backgroundColor: isDark ? colors.surface : '#F2F2F7', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                    <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.payForMeInputIcon} />
                    <RNTextInput
                      placeholder="Enter their email"
                      value={payForMeEmail}
                      onChangeText={setPayForMeEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.payForMeInput, { color: colors.text }]}
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : colors.textSecondary}
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                    />
                  </View>
                </View>

                <View style={styles.payForMeInputGroup}>
                  <Text style={[styles.payForMeLabel, { color: colors.text }]}>Their Phone (Optional)</Text>
                  <View style={[styles.payForMeInputContainer, { backgroundColor: isDark ? colors.surface : '#F2F2F7', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}>
                    <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={styles.payForMeInputIcon} />
                    <RNTextInput
                      placeholder="Enter their phone number"
                      value={payForMePhone}
                      onChangeText={setPayForMePhone}
                      keyboardType="phone-pad"
                      style={[styles.payForMeInput, { color: colors.text }]}
                      placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : colors.textSecondary}
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                    />
                  </View>
                </View>

                <View style={[styles.payForMeAmountCard, { backgroundColor: isDark ? colors.surface : '#F8F9FA' }]}>
                  <Text style={[styles.payForMeAmountLabel, { color: colors.textSecondary }]}>Amount to Pay</Text>
                  <Text style={[styles.payForMeAmount, { color: colors.primary }]}>₦{finalTotal.toLocaleString()}</Text>
                </View>

                <View style={[styles.payForMeInfoCard, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.1)' : '#E5F1FF' }]}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                  <Text style={[styles.payForMeInfoText, { color: colors.primary }]}>
                    The payment link expires in 24 hours. You'll be notified when the payment is completed.
                  </Text>
                </View>

                <Button
                  title={isGeneratingPayLink ? 'Generating Link...' : 'Generate Payment Link'}
                  onPress={handleGeneratePayForMeLink}
                  loading={isGeneratingPayLink}
                  fullWidth
                  style={{ marginTop: 16 }}
                />
              </ScrollView>
            ) : (
              <View style={styles.payForMeSuccess}>
                {/* Status-based UI */}
                {payForMeStatus === 'pending' && (
                  <>
                    <View style={[styles.payForMeSuccessIcon, { backgroundColor: '#E5F1FF' }]}>
                      <Ionicons name="link-outline" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.payForMeSuccessTitle, { color: colors.text }]}>Payment Link Ready!</Text>
                    <Text style={[styles.payForMeSuccessDesc, { color: colors.textSecondary }]}>
                      Share this link with {payForMeName} to complete the payment.
                    </Text>

                    <View style={[styles.payForMeLinkBox, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}>
                      <Text style={[styles.payForMeLinkText, { color: colors.text }]} numberOfLines={2}>
                        {payForMeLink}
                      </Text>
                    </View>

                    <View style={styles.payForMeActions}>
                      <TouchableOpacity 
                        style={[styles.payForMeActionBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSharePayForMeLink}
                      >
                        <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.payForMeActionBtnText}>Share Link</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.payForMeActionBtn, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}
                        onPress={handleCopyPayForMeLink}
                      >
                        <Ionicons name="copy-outline" size={20} color={colors.text} />
                        <Text style={[styles.payForMeActionBtnText, { color: colors.text }]}>Copy</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Polling status indicator */}
                    <View style={[styles.payForMePollingCard, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.1)' : '#E5F1FF' }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.payForMePollingText, { color: colors.primary }]}>
                        Waiting for payment from {payForMeName}...
                      </Text>
                    </View>
                  </>
                )}

                {payForMeStatus === 'paid' && (
                  <>
                    <View style={[styles.payForMeSuccessIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="checkmark-circle" size={48} color="#43A047" />
                    </View>
                    <Text style={[styles.payForMeSuccessTitle, { color: colors.text }]}>Payment Received! 🎉</Text>
                    <Text style={[styles.payForMeSuccessDesc, { color: colors.textSecondary }]}>
                      {payForMeName} has paid ₦{finalTotal.toLocaleString()}. Creating your order...
                    </Text>
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                  </>
                )}

                {payForMeStatus === 'creating_order' && (
                  <>
                    <View style={[styles.payForMeSuccessIcon, { backgroundColor: '#E5F1FF' }]}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                    <Text style={[styles.payForMeSuccessTitle, { color: colors.text }]}>Creating Your Order...</Text>
                    <Text style={[styles.payForMeSuccessDesc, { color: colors.textSecondary }]}>
                      Please wait while we process your order.
                    </Text>
                  </>
                )}

                {payForMeStatus === 'completed' && (
                  <>
                    <View style={[styles.payForMeSuccessIcon, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="bag-check" size={48} color="#43A047" />
                    </View>
                    <Text style={[styles.payForMeSuccessTitle, { color: colors.text }]}>Order Placed! 🎉</Text>
                    <Text style={[styles.payForMeSuccessDesc, { color: colors.textSecondary }]}>
                      Your order has been placed successfully. Thank {payForMeName} for paying!
                    </Text>
                    <Button
                      title="View Orders"
                      onPress={() => {
                        resetPayForMeState();
                        navigation.navigate('Orders' as any);
                      }}
                      fullWidth
                      style={{ marginTop: 20 }}
                    />
                  </>
                )}

                {payForMeStatus === 'failed' && (
                  <>
                    <View style={[styles.payForMeSuccessIcon, { backgroundColor: '#FFEBEE' }]}>
                      <Ionicons name="alert-circle" size={48} color="#EF4444" />
                    </View>
                    <Text style={[styles.payForMeSuccessTitle, { color: colors.text }]}>Order Failed</Text>
                    <Text style={[styles.payForMeSuccessDesc, { color: colors.textSecondary }]}>
                      There was a problem creating your order. Please try again.
                    </Text>
                    <Button
                      title="Try Again"
                      onPress={() => {
                        setPayForMeStatus('pending');
                        if (paymentReference) {
                          createPayForMeOrder(paymentReference);
                        }
                      }}
                      fullWidth
                      style={{ marginTop: 20 }}
                    />
                    <TouchableOpacity 
                      style={[styles.payForMeDoneBtn, { marginTop: 12 }]}
                      onPress={resetPayForMeState}
                    >
                      <Text style={[styles.payForMeDoneBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Time Slot Selection Modal */}
      <Modal
        visible={showTimeSlotModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTimeSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.timeSlotModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Time Slot</Text>
              <TouchableOpacity onPress={() => setShowTimeSlotModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.timeSlotModalList} showsVerticalScrollIndicator={false}>
              <Text style={[styles.timeSlotModalDescription, { color: colors.textSecondary }]}>
                Choose your preferred delivery time. We'll do our best to deliver within the selected window.
              </Text>

              {isLoadingSlots ? (
                <View style={styles.noSlotsContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.noSlotsText, { color: colors.textSecondary, marginTop: 12 }]}>
                    Loading available slots...
                  </Text>
                </View>
              ) : apiSlots.size === 0 && timeSlots.length === 0 ? (
                <View style={styles.noSlotsContainer}>
                  <View style={[styles.noSlotsIcon, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}>
                    <Ionicons name="time-outline" size={32} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.noSlotsTitle, { color: colors.text }]}>No Slots Available</Text>
                  <Text style={[styles.noSlotsText, { color: colors.textSecondary }]}>
                    No time slots available. Please check back later.
                  </Text>
                </View>
              ) : apiSlots.size > 0 ? (
                <>
                  {/* Date selector tabs */}
                  <View style={styles.dateSelectorContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {deliverySchedulingService.getNextDays(3).map((day) => {
                        const daySlots = apiSlots.get(day.date) || [];
                        const hasAvailableSlots = daySlots.some(s => s.isAvailable);
                        const isSelectedDay = selectedDate === day.date;
                        
                        return (
                          <TouchableOpacity
                            key={day.date}
                            style={[
                              styles.dateSelectorTab,
                              { 
                                backgroundColor: isSelectedDay 
                                  ? colors.primary 
                                  : (isDark ? colors.surface : '#F2F2F7'),
                                opacity: hasAvailableSlots ? 1 : 0.5,
                              },
                            ]}
                            onPress={() => hasAvailableSlots && setSelectedDate(day.date)}
                            disabled={!hasAvailableSlots}
                          >
                            <Text style={[
                              styles.dateSelectorText,
                              { color: isSelectedDay ? '#FFFFFF' : colors.text },
                            ]}>
                              {day.label}
                            </Text>
                            {!hasAvailableSlots && (
                              <Text style={[styles.dateSelectorSubtext, { color: colors.textSecondary }]}>
                                Full
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Slots for selected date */}
                  {selectedDate && (
                    <View style={styles.timeSlotDateGroup}>
                      {(apiSlots.get(selectedDate) || []).map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id && selectedDate === selectedDate;
                        const isAvailable = slot.isAvailable;
                        
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[
                              styles.timeSlotOption,
                              { 
                                backgroundColor: isSelected 
                                  ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF') 
                                  : (isDark ? colors.surface : '#F8F9FA'),
                                borderColor: isSelected ? colors.primary : 'transparent',
                                opacity: isAvailable ? 1 : 0.5,
                              },
                            ]}
                            onPress={() => {
                              if (isAvailable) {
                                setSelectedSlot(slot);
                                setSelectedTimeSlot(slot.id);
                                setShowTimeSlotModal(false);
                              }
                            }}
                            disabled={!isAvailable}
                            activeOpacity={0.7}
                          >
                            <View style={[
                              styles.timeSlotOptionIcon,
                              { backgroundColor: isSelected 
                                ? (isDark ? 'rgba(0, 122, 255, 0.2)' : '#CCE4FF') 
                                : (isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF') 
                              }
                            ]}>
                              <Ionicons 
                                name={slot.name.includes('Express') ? 'flash-outline' : 'time-outline'}
                                size={20} 
                                color={isSelected ? colors.primary : colors.textSecondary} 
                              />
                            </View>
                            <View style={styles.timeSlotOptionTextContainer}>
                              <Text style={[
                                styles.timeSlotOptionText,
                                { color: isSelected ? colors.primary : colors.text },
                              ]}>
                                {slot.name}
                              </Text>
                              <Text style={[
                                styles.timeSlotOptionSubtext,
                                { color: isSelected ? colors.primary : colors.textSecondary },
                              ]}>
                                {slot.displayTime}
                                {slot.additionalFee > 0 && ` • +₦${slot.additionalFee.toLocaleString()}`}
                              </Text>
                            </View>
                            {!isAvailable ? (
                              <Text style={[styles.slotFullText, { color: colors.error }]}>Full</Text>
                            ) : isSelected ? (
                              <View style={[styles.timeSlotCheckmark, { backgroundColor: colors.primary }]}>
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                              </View>
                            ) : (
                              <Text style={[styles.slotCapacityText, { color: colors.success }]}>
                                {slot.availableCapacity} left
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* Fallback to local time slots */}
                  {['Today', 'Tomorrow'].map(dateGroup => {
                    const slotsForDate = timeSlots.filter(s => s.date === dateGroup);
                    if (slotsForDate.length === 0) return null;
                    
                    return (
                      <View key={dateGroup} style={styles.timeSlotDateGroup}>
                        <Text style={[styles.timeSlotDateHeader, { color: colors.text }]}>{dateGroup}</Text>
                        {slotsForDate.map((slot) => {
                          const isSelected = selectedTimeSlot === slot.id;
                          return (
                            <TouchableOpacity
                              key={slot.id}
                              style={[
                                styles.timeSlotOption,
                                { 
                                  backgroundColor: isSelected 
                                    ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF') 
                                    : (isDark ? colors.surface : '#F8F9FA'),
                                  borderColor: isSelected ? colors.primary : 'transparent',
                                },
                              ]}
                              onPress={() => {
                                setSelectedTimeSlot(slot.id);
                                setShowTimeSlotModal(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={[
                                styles.timeSlotOptionIcon,
                                { backgroundColor: isSelected 
                                  ? (isDark ? 'rgba(0, 122, 255, 0.2)' : '#CCE4FF') 
                                  : (isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF') 
                                }
                              ]}>
                                <Ionicons 
                                  name="time-outline" 
                                  size={20} 
                                  color={isSelected ? colors.primary : colors.textSecondary} 
                                />
                              </View>
                              <Text style={[
                                styles.timeSlotOptionText,
                                { color: isSelected ? colors.primary : colors.text },
                              ]}>
                                {slot.time}
                              </Text>
                              {isSelected && (
                                <View style={[styles.timeSlotCheckmark, { backgroundColor: colors.primary }]}>
                                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Address Picker Modal */}
      <Modal
        visible={showAddressPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Delivery Address</Text>
              <TouchableOpacity onPress={() => setShowAddressPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.addressList}>
              {allAddresses.length === 0 ? (
                <View style={styles.emptyAddresses}>
                  <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyAddressesText, { color: colors.textSecondary }]}>
                    No saved addresses
                  </Text>
                  <Button
                    title="Add New Address"
                    variant="outline"
                    size="medium"
                    onPress={() => {
                      setShowAddressPicker(false);
                      navigation.navigate('MyAddress' as any);
                    }}
                  />
                </View>
              ) : (
                allAddresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressOption,
                      { borderColor: selectedAddress?.id === address.id ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA') },
                      selectedAddress?.id === address.id && { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.1)' : '#E5F1FF' },
                    ]}
                    onPress={() => {
                      setSelectedAddress(address);
                      setShowAddressPicker(false);
                    }}
                  >
                    <View style={styles.addressOptionContent}>
                      <View style={styles.addressOptionHeader}>
                        <Text style={[styles.addressOptionLabel, { color: colors.text }]}>
                          {address.label || 'Address'}
                        </Text>
                        {address.isDefault && (
                          <View style={[styles.defaultBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text 
                        style={[styles.addressOptionLine1, { color: colors.text }]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {address.addressLine1}
                      </Text>
                      {address.addressLine2 && (
                        <Text 
                          style={[styles.addressOptionLine2, { color: colors.textSecondary }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {address.addressLine2}
                        </Text>
                      )}
                      <Text 
                        style={[styles.addressOptionCity, { color: colors.textSecondary }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {address.city}, {address.state}
                      </Text>
                    </View>
                    {selectedAddress?.id === address.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            
            {allAddresses.length > 0 && (
              <TouchableOpacity 
                style={[styles.addNewAddressButton, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]}
                onPress={() => {
                  setShowAddressPicker(false);
                  navigation.navigate('MyAddress' as any);
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.addNewAddressText, { color: colors.primary }]}>Add New Address</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  fixedHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSecureIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 20,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 32,
    marginTop: 16,
  },
  insetCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressDetails: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#EF4444',
  },
  deliveryOptionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  deliveryOption: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  deliveryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryLabel: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  deliveryDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  paymentOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  paymentIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionLabel: {
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  paymentOptionBalance: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  paymentOptionDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  defaultMethodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  defaultMethodBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  addCardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addCardLinkText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  topUpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  topUpLinkText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    marginBottom: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  freeDeliveryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  freeDeliveryHintText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  totalLabel: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  estimatedTimeText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingBottom: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  timeSlotsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  timeSlotCard: {
    width: 110,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  timeSlotIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSlotCardDate: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
    textAlign: 'center',
  },
  timeSlotCardTime: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSlotsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  noSlotsText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  notesInput: {
    marginBottom: 0,
  },
  // Address Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  addressList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyAddresses: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  emptyAddressesText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  addressOptionContent: {
    flex: 1,
  },
  addressOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressOptionLabel: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  addressOptionLine1: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  addressOptionLine2: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  addressOptionCity: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  addNewAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addNewAddressText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  // Paystack Payment Modal Styles
  paymentModalContainer: {
    flex: 1,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  paymentModalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModalTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  paymentWebView: {
    flex: 1,
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  webViewLoadingText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  // Gift Option Styles
  giftToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  giftIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  giftToggleContent: {
    flex: 1,
  },
  giftToggleLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  giftToggleDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  giftDetailsContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  giftInputGroup: {
    marginBottom: 16,
  },
  giftInputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  giftInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  giftMessageWrapper: {
    height: 'auto',
    minHeight: 90,
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  giftInputIcon: {
    marginRight: 10,
    width: 20,
  },
  giftInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    padding: 0,
    height: '100%',
  },
  giftMessageInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    padding: 0,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 80,
  },
  riderNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  riderNoteIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderNoteHeaderText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  riderNoteInputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  riderNoteInput: {
    marginBottom: 0,
  },
  riderNoteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  riderNoteText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  termsSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  termsText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    textAlign: 'center',
  },
  termsLink: {
    fontFamily: FONTS.medium,
  },
  termsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60, 60, 67, 0.12)',
  },
  termsInfoText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginLeft: 6,
  },
  // Payment List Row Styles
  paymentListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // Pay for Me Modal Styles
  payForMeModalContent: {
    marginHorizontal: 16,
    borderRadius: 20,
    maxHeight: '85%',
  },
  payForMeForm: {
    padding: 20,
  },
  payForMeDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: 20,
  },
  payForMeInputGroup: {
    marginBottom: 16,
  },
  payForMeLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginBottom: 8,
  },
  payForMeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  payForMeInputIcon: {
    marginRight: 10,
  },
  payForMeInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  payForMeAmountCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  payForMeAmountLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  payForMeAmount: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  payForMeInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  payForMeInfoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  payForMeSuccess: {
    padding: 24,
    alignItems: 'center',
  },
  payForMeSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  payForMeSuccessTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  payForMeSuccessDesc: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: 20,
  },
  payForMeLinkBox: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  payForMeLinkText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  payForMeActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  payForMeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  payForMeActionBtnText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  payForMeDoneBtn: {
    paddingVertical: 12,
  },
  payForMeDoneBtnText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  payForMePollingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  payForMePollingText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  // Farmer Message Styles
  farmerMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  farmerMessageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  farmerMessageHeaderText: {
    flex: 1,
  },
  farmerMessageTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  farmerMessageSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  farmerMessageInputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  farmerMessageInput: {
    marginBottom: 0,
  },
  // Time Slot Selector Styles
  timeSlotSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  timeSlotSelectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  timeSlotSelectorContent: {
    flex: 1,
  },
  timeSlotSelectorLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  timeSlotSelectorValue: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  // Time Slot Modal Styles
  timeSlotModalContent: {
    marginHorizontal: 16,
    borderRadius: 20,
    maxHeight: '80%',
  },
  timeSlotModalList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timeSlotModalDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  timeSlotDateGroup: {
    marginBottom: 20,
  },
  timeSlotDateHeader: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 12,
  },
  timeSlotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  timeSlotOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  timeSlotOptionTextContainer: {
    flex: 1,
  },
  timeSlotOptionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  timeSlotOptionSubtext: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  timeSlotCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelectorContainer: {
    marginBottom: 16,
  },
  dateSelectorTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  dateSelectorText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  dateSelectorSubtext: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  slotFullText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  slotCapacityText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  noSlotsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noSlotsTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
  },
  // Section Component Styles
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  requiredStar: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#EF4444',
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Checkout Progress Styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  progressLine: {
    height: 2,
    width: 40,
    marginHorizontal: 4,
    borderRadius: 1,
    marginBottom: 16,
  },
  // Order Item Preview Styles
  orderPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  orderPreviewImages: {
    flexDirection: 'row',
    marginRight: 12,
  },
  orderPreviewImageWrapper: {
    position: 'relative',
  },
  orderPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  orderPreviewImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  orderPreviewQty: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderPreviewQtyText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  orderPreviewMore: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  orderPreviewMoreText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  orderPreviewText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
});
