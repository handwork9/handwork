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
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// iOS-style Section Header (grouped list style)
const SectionLabel: React.FC<{ title: string; colors: any }> = ({ title, colors }) => (
  <Text style={[styles.iosGroupLabel, { color: colors.textSecondary }]}>
    {title.toUpperCase()}
  </Text>
);

// iOS-style inset grouped card
interface SectionProps {
  title?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  badge?: string;
  required?: boolean;
  error?: boolean;
  colors: any;
  isDark: boolean;
  noPadding?: boolean;
}

const Section: React.FC<SectionProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  badge,
  required,
  error,
  colors,
  isDark,
  noPadding = false,
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
    <View style={styles.iosSectionWrapper}>
      {title && (
        <TouchableOpacity
          activeOpacity={collapsible ? 0.7 : 1}
          onPress={toggleExpand}
          style={styles.iosSectionHeaderRow}
        >
          <View style={styles.iosSectionTitleRow}>
            <Text style={[
              styles.iosGroupLabel,
              { color: error ? '#EF4444' : colors.textSecondary },
            ]}>
              {title.toUpperCase()}
            </Text>
            {required && <Text style={styles.requiredStar}> *</Text>}
            {badge && (
              <View style={[styles.iosBadge, { backgroundColor: '#34C75920' }]}>
                <Text style={[styles.iosBadgeText, { color: '#34C759' }]}>{badge}</Text>
              </View>
            )}
          </View>
          {collapsible && (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
            />
          )}
        </TouchableOpacity>
      )}
      {(!collapsible || expanded) && (
        <View style={[
          styles.iosCard,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
          error && styles.iosCardError,
          noPadding && { padding: 0 },
        ]}>
          {children}
        </View>
      )}
    </View>
  );
};

// iOS-style Row component
interface RowItemProps {
  label: string;
  value?: string;
  subtitle?: string;
  valueColor?: string;
  onPress?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  isLast?: boolean;
  colors: any;
  isDark: boolean;
}

const RowItem: React.FC<RowItemProps> = ({
  label,
  value,
  subtitle,
  valueColor,
  onPress,
  leftIcon,
  leftIconColor,
  rightElement,
  showChevron = true,
  isLast = false,
  colors,
  isDark,
}) => (
  <TouchableOpacity
    style={[
      styles.iosRowItem,
      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' },
    ]}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress}
  >
    {leftIcon && (
      <Ionicons name={leftIcon} size={20} color={leftIconColor || colors.primary} style={styles.iosRowIcon} />
    )}
    <View style={styles.iosRowContent}>
      <Text style={[styles.iosRowLabel, { color: colors.text }]} numberOfLines={1}>{label}</Text>
      {subtitle && <Text style={[styles.iosRowSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>}
    </View>
    {value && <Text style={[styles.iosRowValue, { color: valueColor || colors.textSecondary }]} numberOfLines={1}>{value}</Text>}
    {rightElement}
    {showChevron && onPress && <Ionicons name="chevron-forward" size={18} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(60,60,67,0.3)'} style={{ marginLeft: 2 }} />}
  </TouchableOpacity>
);

// Compact Progress indicator
const CheckoutProgress: React.FC<{ currentStep: number; colors: any; isDark: boolean }> = ({ currentStep, colors, isDark }) => {
  const steps = ['Address', 'Delivery', 'Payment', 'Confirm'];

  return (
    <View style={styles.iosProgressContainer}>
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isComplete = index < currentStep;
        return (
          <React.Fragment key={step}>
            <View style={styles.iosProgressStep}>
              <View style={[
                styles.iosProgressDot,
                isActive && { backgroundColor: colors.primary },
                !isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E5EA' },
              ]}>
                {isComplete && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
              </View>
              <Text style={[
                styles.iosProgressLabel,
                { color: isActive ? colors.primary : colors.textSecondary },
              ]}>{step}</Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.iosProgressLine,
                { backgroundColor: index < currentStep ? colors.primary : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E5EA') },
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// Compact Order item preview
const OrderItemPreview: React.FC<{ items: any[]; colors: any; isDark: boolean; total: number }> = ({ items, colors, isDark, total }) => {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const displayItems = items.slice(0, 4);
  const moreCount = items.length - 4;

  return (
    <View style={[styles.iosOrderPreview, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
      <View style={styles.iosOrderImages}>
        {displayItems.map((item, index) => (
          <View key={item.productId} style={[styles.iosOrderImageWrap, { marginLeft: index > 0 ? -8 : 0, zIndex: 10 - index }]}>
            {item.product?.images?.[0] ? (
              <Image source={{ uri: item.product.images[0] }} style={styles.iosOrderImage} resizeMode="cover" />
            ) : (
              <View style={[styles.iosOrderImagePlaceholder, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}>
                <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
              </View>
            )}
            {item.quantity > 1 && (
              <View style={[styles.iosOrderQtyBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.iosOrderQtyText}>{item.quantity}</Text>
              </View>
            )}
          </View>
        ))}
        {moreCount > 0 && (
          <View style={[styles.iosOrderMoreBadge, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}>
            <Text style={[styles.iosOrderMoreText, { color: colors.text }]}>+{moreCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.iosOrderInfo}>
        <Text style={[styles.iosOrderCount, { color: colors.text }]}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
        <Text style={[styles.iosOrderTotal, { color: colors.primary }]}>₦{total.toLocaleString()}</Text>
      </View>
    </View>
  );
};

const DELIVERY_OPTIONS: { type: DeliveryType; label: string; description: string }[] = [
  { type: 'ASAP', label: 'Express', description: '30-60 min' },
  { type: 'SCHEDULED', label: 'Schedule', description: 'Pick time' },
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
          paymentMethod: 'wallet',
          deliveryType,
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
        paymentMethod: 'card',
        deliveryType,
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
        paymentMethod: 'card',
        paymentReference: reference,
        deliveryType,
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
      {/* iOS-style Header */}
      <View style={[styles.iosHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iosHeaderBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.iosHeaderTitle, { color: colors.text }]}>Checkout</Text>
        <View style={styles.iosHeaderBtn}>
          <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.iosScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Preview Card */}
        <OrderItemPreview items={items} colors={colors} isDark={isDark} total={total} />

        {/* Progress Indicator */}
        <CheckoutProgress 
          currentStep={
            !selectedAddress && !user?.address ? 0 : 
            deliveryMethod === 'home_delivery' && deliveryType === 'SCHEDULED' && !selectedTimeSlot ? 1 : 
            paymentMethod === 'card' ? 2 : 3
          } 
          colors={colors}
          isDark={isDark}
        />

        {/* DELIVERY SECTION */}
        <Section title="Delivery" required error={addressError} colors={colors} isDark={isDark} noPadding>
          {/* Address Row */}
          <RowItem
            label={selectedAddress?.addressLine1 || user?.address || 'Add delivery address'}
            subtitle={selectedAddress ? `${selectedAddress.city}, ${selectedAddress.state}` : (user?.city ? `${user.city}, ${user.state}` : 'Tap to select')}
            leftIcon="location-outline"
            leftIconColor={addressError ? '#EF4444' : colors.primary}
            onPress={() => { setAddressError(false); setShowAddressPicker(true); }}
            colors={colors}
            isDark={isDark}
          />
          
          {/* Delivery Time Options */}
          <View style={[styles.iosDeliveryOptions, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' }]}>
            {DELIVERY_OPTIONS.map((option) => {
              const isSelected = deliveryType === option.type;
              return (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.iosDeliveryOption,
                    isSelected && { backgroundColor: colors.primary + '15', borderColor: colors.primary },
                  ]}
                  onPress={() => setDeliveryType(option.type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.iosDeliveryLabel, { color: isSelected ? colors.primary : colors.text }]}>{option.label}</Text>
                  <Text style={[styles.iosDeliveryDesc, { color: isSelected ? colors.primary : colors.textSecondary }]}>{option.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Slot Selection */}
          {deliveryType === 'SCHEDULED' && (
            <RowItem
              label={selectedSlot?.name || 'Select time slot'}
              subtitle={selectedSlot ? selectedSlot.displayTime : 'Choose delivery window'}
              leftIcon="time-outline"
              onPress={() => setShowTimeSlotModal(true)}
              colors={colors}
              isDark={isDark}
            />
          )}

          {/* Gift Toggle */}
          <TouchableOpacity
            style={[styles.iosRowItem, { borderBottomWidth: isGift ? StyleSheet.hairlineWidth : 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' }]}
            onPress={() => setIsGift(!isGift)}
            activeOpacity={0.6}
          >
            <Ionicons name="gift-outline" size={20} color="#E91E63" style={styles.iosRowIcon} />
            <View style={styles.iosRowContent}>
              <Text style={[styles.iosRowLabel, { color: colors.text }]}>Send as Gift</Text>
            </View>
            <View style={[styles.iosToggle, { backgroundColor: isGift ? '#34C759' : (isDark ? 'rgba(255,255,255,0.2)' : '#E5E5EA') }]}>
              <View style={[styles.iosToggleKnob, { transform: [{ translateX: isGift ? 20 : 2 }] }]} />
            </View>
          </TouchableOpacity>

          {/* Gift Details */}
          {isGift && (
            <View style={styles.iosGiftDetails}>
              <View style={styles.iosInputRow}>
                <RNTextInput
                  placeholder="Recipient's name"
                  value={giftRecipientName}
                  onChangeText={setGiftRecipientName}
                  style={[styles.iosTextInput, { backgroundColor: isDark ? colors.surface : '#F2F2F7', color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.iosInputRow}>
                <RNTextInput
                  placeholder="Recipient's phone"
                  value={giftRecipientPhone}
                  onChangeText={setGiftRecipientPhone}
                  keyboardType="phone-pad"
                  style={[styles.iosTextInput, { backgroundColor: isDark ? colors.surface : '#F2F2F7', color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.iosInputRow}>
                <RNTextInput
                  placeholder="Gift message (optional)"
                  value={giftMessage}
                  onChangeText={setGiftMessage}
                  multiline
                  numberOfLines={2}
                  style={[styles.iosTextInput, styles.iosTextArea, { backgroundColor: isDark ? colors.surface : '#F2F2F7', color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          )}
        </Section>

        {/* DELIVERY OPTIONS - Speed & Pickup */}
        <Section title="Delivery Options" badge={deliveryMethod === 'pickup_point' ? '20% off' : undefined} colors={colors} isDark={isDark} noPadding>
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

        {/* PAYMENT SECTION */}
        <Section title="Payment" colors={colors} isDark={isDark} noPadding>
          {/* Wallet Option */}
          <TouchableOpacity
            style={[styles.iosRowItem, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' }]}
            onPress={() => setPaymentMethod('wallet')}
            activeOpacity={0.6}
          >
            <View style={[styles.iosPaymentIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="wallet" size={18} color="#43A047" />
            </View>
            <View style={styles.iosRowContent}>
              <Text style={[styles.iosRowLabel, { color: colors.text }]}>Wallet</Text>
              {isLoadingWallet ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Text style={[styles.iosRowSubtitle, { color: canAffordWithWallet ? '#43A047' : '#EF4444' }]}>
                  ₦{(walletBalance?.available || 0).toLocaleString()}{!canAffordWithWallet && ' (Low)'}
                </Text>
              )}
            </View>
            <View style={[styles.iosRadio, paymentMethod === 'wallet' && styles.iosRadioSelected]}>
              {paymentMethod === 'wallet' && <View style={styles.iosRadioInner} />}
            </View>
          </TouchableOpacity>

          {/* Card Option */}
          <TouchableOpacity
            style={[styles.iosRowItem, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' }]}
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.6}
          >
            <View style={[styles.iosPaymentIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="card" size={18} color="#1976D2" />
            </View>
            <View style={styles.iosRowContent}>
              <Text style={[styles.iosRowLabel, { color: colors.text }]}>
                {savedCards.length > 0 ? `Card •••• ${savedCards[0]?.cardNumber?.slice(-4) || ''}` : 'Card'}
              </Text>
              <Text style={[styles.iosRowSubtitle, { color: colors.textSecondary }]}>Visa, Mastercard, Verve</Text>
            </View>
            <View style={[styles.iosRadio, paymentMethod === 'card' && styles.iosRadioSelected]}>
              {paymentMethod === 'card' && <View style={styles.iosRadioInner} />}
            </View>
          </TouchableOpacity>

          {/* Pay for Me Option */}
          <TouchableOpacity
            style={styles.iosRowItem}
            onPress={() => setPaymentMethod('payForMe')}
            activeOpacity={0.6}
          >
            <View style={[styles.iosPaymentIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="people" size={18} color="#FF6B00" />
            </View>
            <View style={styles.iosRowContent}>
              <Text style={[styles.iosRowLabel, { color: colors.text }]}>Pay for Me</Text>
              <Text style={[styles.iosRowSubtitle, { color: colors.textSecondary }]}>Send link to someone</Text>
            </View>
            <View style={[styles.iosRadio, paymentMethod === 'payForMe' && styles.iosRadioSelected]}>
              {paymentMethod === 'payForMe' && <View style={styles.iosRadioInner} />}
            </View>
          </TouchableOpacity>

          {/* Top Up Link */}
          {paymentMethod === 'wallet' && !canAffordWithWallet && (
            <TouchableOpacity 
              style={styles.iosTopUpLink}
              onPress={() => navigation.navigate('TopUp' as any)}
            >
              <Text style={[styles.iosTopUpText, { color: colors.primary }]}>Top up wallet</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </Section>

        {/* COUPON SECTION */}
        <Section title="Coupon" badge={appliedCoupon ? 'Applied' : undefined} colors={colors} isDark={isDark}>
          <CouponInput
            subtotal={total}
            deliveryFee={deliveryPricing.deliveryFee}
            cartItems={cartItemsForCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            appliedCoupon={appliedCoupon}
          />
        </Section>

        {/* NOTES SECTION - Collapsible */}
        <Section title="Notes" collapsible defaultExpanded={false} colors={colors} isDark={isDark}>
          <View style={styles.iosNotesContainer}>
            <Text style={[styles.iosNoteLabel, { color: colors.textSecondary }]}>For Farmer</Text>
            <RNTextInput
              placeholder="e.g., Pick ripe ones only..."
              value={farmerMessage}
              onChangeText={setFarmerMessage}
              multiline
              numberOfLines={2}
              style={[styles.iosNoteInput, { backgroundColor: isDark ? colors.surface : '#F2F2F7', color: colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60,60,67,0.12)' }]}
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : colors.textSecondary}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              textAlignVertical="top"
            />
            
            <Text style={[styles.iosNoteLabel, { color: colors.textSecondary, marginTop: 16 }]}>Delivery Instructions</Text>
            <RNTextInput
              placeholder="Gate code, leave at door..."
              value={orderNotes}
              onChangeText={setOrderNotes}
              multiline
              numberOfLines={2}
              style={[styles.iosNoteInput, { backgroundColor: isDark ? colors.surface : '#F2F2F7', color: colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60,60,67,0.12)' }]}
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : colors.textSecondary}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              textAlignVertical="top"
            />
            
            <Text style={[styles.iosNoteLabel, { color: colors.textSecondary, marginTop: 16 }]}>For Rider</Text>
            <RNTextInput
              placeholder="Call when you arrive..."
              value={riderNote}
              onChangeText={setRiderNote}
              multiline
              numberOfLines={2}
              style={[styles.iosNoteInput, { backgroundColor: isDark ? colors.surface : '#F2F2F7', color: colors.text, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60,60,67,0.12)' }]}
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : colors.textSecondary}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              textAlignVertical="top"
            />
          </View>
        </Section>

        {/* ORDER SUMMARY */}
        <Section title="Summary" colors={colors} isDark={isDark} noPadding>
          <View style={styles.iosSummaryRow}>
            <Text style={[styles.iosSummaryLabel, { color: colors.textSecondary }]}>Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} items)</Text>
            <Text style={[styles.iosSummaryValue, { color: colors.text }]}>₦{total.toLocaleString()}</Text>
          </View>
          <View style={styles.iosSummaryRow}>
            <Text style={[styles.iosSummaryLabel, { color: colors.textSecondary }]}>Delivery ({estimatedDistanceKm.toFixed(1)} km)</Text>
            {hasFreeDelivery ? (
              <Text style={[styles.iosSummaryValue, { color: '#34C759' }]}>FREE</Text>
            ) : (
              <Text style={[styles.iosSummaryValue, { color: colors.text }]}>{formatDeliveryFee(deliveryFee)}</Text>
            )}
          </View>
          {!hasFreeDelivery && amountForFreeDelivery > 0 && (
            <TouchableOpacity style={styles.iosFreeDeliveryHint} onPress={() => navigation.goBack()}>
              <Text style={[styles.iosFreeDeliveryText, { color: colors.primary }]}>
                Add ₦{amountForFreeDelivery.toLocaleString()} for free delivery →
              </Text>
            </TouchableOpacity>
          )}
          {appliedCoupon && discount > 0 && (
            <View style={styles.iosSummaryRow}>
              <Text style={[styles.iosSummaryLabel, { color: '#34C759' }]}>Coupon ({appliedCoupon.code})</Text>
              <Text style={[styles.iosSummaryValue, { color: '#34C759' }]}>-₦{discount.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.iosSummaryRow}>
            <Text style={[styles.iosSummaryLabel, { color: colors.textSecondary }]}>Service Fee</Text>
            <Text style={[styles.iosSummaryValue, { color: colors.text }]}>₦{serviceFee.toLocaleString()}</Text>
          </View>
          <View style={[styles.iosSummaryRow, styles.iosTotalRow]}>
            <Text style={[styles.iosTotalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.iosTotalValue, { color: colors.primary }]}>₦{finalTotal.toLocaleString()}</Text>
          </View>
          <Text style={[styles.iosEstimatedTime, { color: colors.textSecondary }]}>
            Est. delivery: {deliveryPricing.estimatedTime} mins
          </Text>
        </Section>

        {/* Terms */}
        <View style={styles.iosTermsContainer}>
          <Text style={[styles.iosTermsText, { color: colors.textSecondary }]}>
            By ordering, you agree to our Terms & Privacy Policy
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.iosBottomBar, { paddingBottom: insets.bottom + 8, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <Button
          title={`Pay ₦${finalTotal.toLocaleString()}`}
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
        presentationStyle="pageSheet"
        onRequestClose={handleClosePaymentModal}
      >
        <View style={[styles.iosModalContainer, { backgroundColor: '#FFFFFF', paddingTop: insets.top }]}>
          <View style={styles.iosModalHeader}>
            <TouchableOpacity onPress={handleClosePaymentModal} style={styles.iosModalCloseBtn}>
              <Text style={[styles.iosModalCancelText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.iosModalTitle}>Payment</Text>
            <View style={{ width: 60 }} />
          </View>
          {paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handlePaymentWebViewNavigation}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              injectedJavaScript={injectedJavaScript}
              style={{ flex: 1 }}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              renderLoading={() => (
                <View style={styles.iosWebViewLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.iosWebViewLoadingText, { color: colors.textSecondary }]}>
                    Loading payment...
                  </Text>
                </View>
              )}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.status === 'success' || data.event === 'successful' || data.event === 'payment_complete') {
                    setShowPaymentModal(false);
                    setPaymentUrl('');
                    verifyPaymentAndCreateOrder(paymentReference);
                  }
                } catch (e) {}
              }}
            />
          ) : (
            <View style={styles.iosWebViewLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </Modal>

      {/* Pay for Me Modal */}
      <Modal
        visible={showPayForMeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClosePayForMeModal}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1, backgroundColor: isDark ? colors.background : '#F2F2F7' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.iosModalHeader, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <TouchableOpacity onPress={handleClosePayForMeModal} style={styles.iosModalCloseBtn}>
              <Text style={[styles.iosModalCancelText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.iosModalTitle, { color: colors.text }]}>Pay for Me</Text>
            <View style={{ width: 60 }} />
          </View>

          {!payLinkGenerated ? (
            <ScrollView style={styles.iosModalContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.iosModalDesc, { color: colors.textSecondary }]}>
                Enter details of the person who will pay. We'll generate a secure payment link.
              </Text>

              <View style={styles.iosInputGroup}>
                <Text style={[styles.iosInputLabel, { color: colors.textSecondary }]}>NAME</Text>
                <RNTextInput
                  placeholder="Their name"
                  value={payForMeName}
                  onChangeText={setPayForMeName}
                  style={[styles.iosModalInput, { backgroundColor: isDark ? colors.card : '#FFFFFF', color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.iosInputGroup}>
                <Text style={[styles.iosInputLabel, { color: colors.textSecondary }]}>EMAIL</Text>
                <RNTextInput
                  placeholder="Their email"
                  value={payForMeEmail}
                  onChangeText={setPayForMeEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.iosModalInput, { backgroundColor: isDark ? colors.card : '#FFFFFF', color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.iosInputGroup}>
                <Text style={[styles.iosInputLabel, { color: colors.textSecondary }]}>PHONE (OPTIONAL)</Text>
                <RNTextInput
                  placeholder="Their phone"
                  value={payForMePhone}
                  onChangeText={setPayForMePhone}
                  keyboardType="phone-pad"
                  style={[styles.iosModalInput, { backgroundColor: isDark ? colors.card : '#FFFFFF', color: colors.text }]}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.iosAmountCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <Text style={[styles.iosAmountLabel, { color: colors.textSecondary }]}>Amount</Text>
                <Text style={[styles.iosAmountValue, { color: colors.primary }]}>₦{finalTotal.toLocaleString()}</Text>
              </View>

              <View style={styles.iosModalActions}>
                <Button
                  title={isGeneratingPayLink ? 'Generating...' : 'Generate Link'}
                  onPress={handleGeneratePayForMeLink}
                  loading={isGeneratingPayLink}
                  fullWidth
                />
              </View>
            </ScrollView>
          ) : (
            <View style={styles.iosPayForMeSuccess}>
              {payForMeStatus === 'pending' && (
                <>
                  <View style={[styles.iosSuccessIcon, { backgroundColor: '#E5F1FF' }]}>
                    <Ionicons name="link" size={40} color={colors.primary} />
                  </View>
                  <Text style={[styles.iosSuccessTitle, { color: colors.text }]}>Link Ready!</Text>
                  <Text style={[styles.iosSuccessDesc, { color: colors.textSecondary }]}>
                    Share with {payForMeName}
                  </Text>
                  <View style={styles.iosPayForMeActions}>
                    <TouchableOpacity 
                      style={[styles.iosActionBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSharePayForMeLink}
                    >
                      <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.iosActionBtnText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.iosActionBtn, { backgroundColor: isDark ? colors.surface : '#F2F2F7' }]}
                      onPress={handleCopyPayForMeLink}
                    >
                      <Ionicons name="copy-outline" size={20} color={colors.text} />
                      <Text style={[styles.iosActionBtnText, { color: colors.text }]}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.iosPollingCard, { backgroundColor: isDark ? 'rgba(0,122,255,0.1)' : '#E5F1FF' }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.iosPollingText, { color: colors.primary }]}>Waiting for payment...</Text>
                  </View>
                </>
              )}
              {payForMeStatus === 'paid' && (
                <>
                  <View style={[styles.iosSuccessIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="checkmark-circle" size={40} color="#43A047" />
                  </View>
                  <Text style={[styles.iosSuccessTitle, { color: colors.text }]}>Paid! 🎉</Text>
                  <Text style={[styles.iosSuccessDesc, { color: colors.textSecondary }]}>Creating order...</Text>
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
                </>
              )}
              {payForMeStatus === 'completed' && (
                <>
                  <View style={[styles.iosSuccessIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="bag-check" size={40} color="#43A047" />
                  </View>
                  <Text style={[styles.iosSuccessTitle, { color: colors.text }]}>Order Placed!</Text>
                  <Button
                    title="View Orders"
                    onPress={() => { resetPayForMeState(); navigation.navigate('Orders' as any); }}
                    fullWidth
                    style={{ marginTop: 20 }}
                  />
                </>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Time Slot Modal */}
      <Modal
        visible={showTimeSlotModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTimeSlotModal(false)}
      >
        <View style={[styles.iosModalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <View style={[styles.iosModalHeader, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={{ width: 60 }} />
            <Text style={[styles.iosModalTitle, { color: colors.text }]}>Select Time</Text>
            <TouchableOpacity onPress={() => setShowTimeSlotModal(false)} style={styles.iosModalCloseBtn}>
              <Text style={[styles.iosModalDoneText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.iosModalContent} showsVerticalScrollIndicator={false}>
            {isLoadingSlots ? (
              <View style={styles.iosLoadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.iosLoadingText, { color: colors.textSecondary }]}>Loading slots...</Text>
              </View>
            ) : apiSlots.size > 0 ? (
              <>
                <View style={styles.iosDateTabs}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {deliverySchedulingService.getNextDays(3).map((day) => {
                      const daySlots = apiSlots.get(day.date) || [];
                      const hasSlots = daySlots.some(s => s.isAvailable);
                      const isActive = selectedDate === day.date;
                      return (
                        <TouchableOpacity
                          key={day.date}
                          style={[
                            styles.iosDateTab,
                            { backgroundColor: isActive ? colors.primary : (isDark ? colors.card : '#FFFFFF') },
                            !hasSlots && { opacity: 0.5 },
                          ]}
                          onPress={() => hasSlots && setSelectedDate(day.date)}
                          disabled={!hasSlots}
                        >
                          <Text style={[styles.iosDateTabText, { color: isActive ? '#FFFFFF' : colors.text }]}>{day.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                {selectedDate && (
                  <View style={[styles.iosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', marginTop: 16 }]}>
                    {(apiSlots.get(selectedDate) || []).map((slot, index, arr) => (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.iosRowItem,
                          index < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' },
                        ]}
                        onPress={() => {
                          if (slot.isAvailable) {
                            setSelectedSlot(slot);
                            setSelectedTimeSlot(slot.id);
                            setShowTimeSlotModal(false);
                          }
                        }}
                        disabled={!slot.isAvailable}
                        activeOpacity={0.6}
                      >
                        <View style={styles.iosRowContent}>
                          <Text style={[styles.iosRowLabel, { color: slot.isAvailable ? colors.text : colors.textSecondary }]}>{slot.name}</Text>
                          <Text style={[styles.iosRowSubtitle, { color: colors.textSecondary }]}>
                            {slot.displayTime}{slot.additionalFee > 0 && ` +₦${slot.additionalFee}`}
                          </Text>
                        </View>
                        {slot.isAvailable ? (
                          selectedSlot?.id === slot.id ? (
                            <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
                          ) : (
                            <Text style={[styles.iosSlotCapacity, { color: '#34C759' }]}>{slot.availableCapacity} left</Text>
                          )
                        ) : (
                          <Text style={[styles.iosSlotFull, { color: '#EF4444' }]}>Full</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.iosEmptyState}>
                <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.iosEmptyText, { color: colors.textSecondary }]}>No slots available</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Address Picker Modal */}
      <Modal
        visible={showAddressPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressPicker(false)}
      >
        <View style={[styles.iosModalContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <View style={[styles.iosModalHeader, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={{ width: 60 }} />
            <Text style={[styles.iosModalTitle, { color: colors.text }]}>Delivery Address</Text>
            <TouchableOpacity onPress={() => setShowAddressPicker(false)} style={styles.iosModalCloseBtn}>
              <Text style={[styles.iosModalDoneText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.iosModalContent}>
            {allAddresses.length === 0 ? (
              <View style={styles.iosEmptyState}>
                <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.iosEmptyText, { color: colors.textSecondary }]}>No saved addresses</Text>
                <Button
                  title="Add Address"
                  variant="outline"
                  onPress={() => { setShowAddressPicker(false); navigation.navigate('MyAddress' as any); }}
                />
              </View>
            ) : (
              <View style={[styles.iosCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                {allAddresses.map((address, index) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.iosRowItem,
                      index < allAddresses.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' },
                    ]}
                    onPress={() => { setSelectedAddress(address); setShowAddressPicker(false); }}
                    activeOpacity={0.6}
                  >
                    <View style={styles.iosRowContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.iosRowLabel, { color: colors.text }]}>{address.label || 'Address'}</Text>
                        {address.isDefault && (
                          <View style={[styles.iosDefaultBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.iosDefaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.iosRowSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        {address.addressLine1}, {address.city}
                      </Text>
                    </View>
                    {selectedAddress?.id === address.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {allAddresses.length > 0 && (
              <TouchableOpacity 
                style={styles.iosAddNewBtn}
                onPress={() => { setShowAddressPicker(false); navigation.navigate('MyAddress' as any); }}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.iosAddNewText, { color: colors.primary }]}>Add New Address</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // iOS Header Styles
  iosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  iosHeaderBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  iosScrollContent: {
    paddingBottom: 120,
  },
  // iOS Group Label
  iosGroupLabel: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    paddingHorizontal: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  // iOS Section Wrapper
  iosSectionWrapper: {
    marginTop: 20,
  },
  iosSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  iosSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iosBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  iosBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requiredStar: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  // iOS Card
  iosCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  iosCardError: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  // iOS Row Item
  iosRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  iosRowIcon: {
    marginRight: 12,
  },
  iosRowContent: {
    flex: 1,
  },
  iosRowLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  iosRowSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  iosRowValue: {
    fontSize: 17,
    marginRight: 4,
  },
  // iOS Delivery Options
  iosDeliveryOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  iosDeliveryOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
  },
  iosDeliveryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  iosDeliveryDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  // iOS Toggle
  iosToggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    justifyContent: 'center',
  },
  iosToggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  // iOS Gift Details
  iosGiftDetails: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iosInputRow: {
    marginBottom: 10,
  },
  iosTextInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 17,
  },
  iosTextArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  // iOS Payment Icon
  iosPaymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  // iOS Radio
  iosRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosRadioSelected: {
    borderColor: '#007AFF',
  },
  iosRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  // iOS Top Up Link
  iosTopUpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60,60,67,0.12)',
  },
  iosTopUpText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // iOS Notes
  iosNotesContainer: {
    padding: 16,
  },
  iosNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  iosNoteInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 60,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // iOS Summary
  iosSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.12)',
  },
  iosSummaryLabel: {
    fontSize: 15,
  },
  iosSummaryValue: {
    fontSize: 15,
  },
  iosTotalRow: {
    paddingVertical: 14,
    borderBottomWidth: 0,
  },
  iosTotalLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosTotalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  iosEstimatedTime: {
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 14,
  },
  iosFreeDeliveryHint: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iosFreeDeliveryText: {
    fontSize: 13,
  },
  // iOS Terms
  iosTermsContainer: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: 'center',
  },
  iosTermsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  // iOS Bottom Bar
  iosBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60,60,67,0.12)',
  },
  // iOS Order Preview
  iosOrderPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
  },
  iosOrderImages: {
    flexDirection: 'row',
    marginRight: 14,
  },
  iosOrderImageWrap: {
    position: 'relative',
  },
  iosOrderImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iosOrderImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iosOrderQtyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosOrderQtyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iosOrderMoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iosOrderMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iosOrderInfo: {
    flex: 1,
  },
  iosOrderCount: {
    fontSize: 15,
    fontWeight: '500',
  },
  iosOrderTotal: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  // iOS Progress
  iosProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iosProgressStep: {
    alignItems: 'center',
  },
  iosProgressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iosProgressLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  iosProgressLine: {
    height: 2,
    width: 32,
    marginHorizontal: 4,
    borderRadius: 1,
    marginBottom: 14,
  },
  // iOS Modal
  iosModalContainer: {
    flex: 1,
  },
  iosModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.12)',
  },
  iosModalCloseBtn: {
    minWidth: 60,
    paddingHorizontal: 8,
  },
  iosModalCancelText: {
    fontSize: 17,
  },
  iosModalDoneText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
  },
  iosModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  iosModalContent: {
    flex: 1,
    padding: 16,
  },
  iosModalDesc: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 20,
  },
  iosInputGroup: {
    marginBottom: 16,
  },
  iosInputLabel: {
    fontSize: 13,
    letterSpacing: -0.08,
    marginBottom: 6,
    paddingLeft: 4,
  },
  iosModalInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 17,
  },
  iosAmountCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  iosAmountLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  iosAmountValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  iosModalActions: {
    marginTop: 8,
  },
  iosWebViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  iosWebViewLoadingText: {
    fontSize: 15,
  },
  // iOS Pay For Me Success
  iosPayForMeSuccess: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iosSuccessTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  iosSuccessDesc: {
    fontSize: 15,
    marginBottom: 24,
  },
  iosPayForMeActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  iosActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  iosActionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iosPollingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  iosPollingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // iOS Date Tabs
  iosDateTabs: {
    marginBottom: 8,
  },
  iosDateTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  iosDateTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  iosSlotCapacity: {
    fontSize: 13,
    fontWeight: '500',
  },
  iosSlotFull: {
    fontSize: 13,
    fontWeight: '500',
  },
  // iOS Loading & Empty States
  iosLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  iosLoadingText: {
    fontSize: 15,
  },
  iosEmptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  iosEmptyText: {
    fontSize: 15,
  },
  // iOS Default Badge
  iosDefaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  iosDefaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // iOS Add New Button
  iosAddNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 12,
  },
  iosAddNewText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
