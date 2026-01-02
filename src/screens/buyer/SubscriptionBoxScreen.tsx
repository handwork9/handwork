import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import subscriptionBoxService, {
  SubscriptionBoxType,
  BoxSize,
  SubscriptionBoxStatus,
  SubscriptionBoxWithDeliveries,
  CreateSubscriptionBoxRequest,
} from '../../services/subscriptionBoxService';
import { useAppSelector } from '../../store';

// Import category illustrations
import VegetablesIllustration from '../../assets/illustrations/categories/VegetablesIllustration';
import FruitsIllustration from '../../assets/illustrations/categories/FruitsIllustration';
import GrainsIllustration from '../../assets/illustrations/categories/GrainsIllustration';
import DairyIllustration from '../../assets/illustrations/categories/DairyIllustration';
import MeatIllustration from '../../assets/illustrations/categories/MeatIllustration';
import PoultryIllustration from '../../assets/illustrations/categories/PoultryIllustration';
import SeafoodIllustration from '../../assets/illustrations/categories/SeafoodIllustration';
import HerbsSpicesIllustration from '../../assets/illustrations/categories/HerbsSpicesIllustration';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'vegetables', name: 'Vegetables', Illustration: VegetablesIllustration },
  { id: 'fruits', name: 'Fruits', Illustration: FruitsIllustration },
  { id: 'grains', name: 'Grains', Illustration: GrainsIllustration },
  { id: 'dairy', name: 'Dairy', Illustration: DairyIllustration },
  { id: 'meat', name: 'Meat', Illustration: MeatIllustration },
  { id: 'poultry', name: 'Poultry', Illustration: PoultryIllustration },
  { id: 'seafood', name: 'Seafood', Illustration: SeafoodIllustration },
  { id: 'spices', name: 'Spices', Illustration: HerbsSpicesIllustration },
];

const DAYS = [
  { id: 0, name: 'Sun' },
  { id: 1, name: 'Mon' },
  { id: 2, name: 'Tue' },
  { id: 3, name: 'Wed' },
  { id: 4, name: 'Thu' },
  { id: 5, name: 'Fri' },
  { id: 6, name: 'Sat' },
];

const TIME_SLOTS = [
  '08:00-10:00',
  '09:00-12:00',
  '12:00-15:00',
  '15:00-18:00',
  '18:00-21:00',
];

export default function SubscriptionBoxScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const user = useAppSelector(state => state.auth.user);

  // State for new subscription form
  const [selectedType, setSelectedType] = useState<SubscriptionBoxType>(SubscriptionBoxType.WEEKLY);
  const [selectedSize, setSelectedSize] = useState<BoxSize>(BoxSize.MEDIUM);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [excludedProducts, setExcludedProducts] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState(6); // Saturday
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00-12:00');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch pricing
  const { data: pricingData } = useQuery({
    queryKey: ['subscriptionBoxPricing'],
    queryFn: subscriptionBoxService.getPricing,
  });

  // Fetch user's subscription
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['mySubscriptionBox'],
    queryFn: subscriptionBoxService.getMySubscription,
  });

  // Create subscription mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSubscriptionBoxRequest) => subscriptionBoxService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySubscriptionBox'] });
      setShowCreateForm(false);
      Alert.alert('Success! 🎉', 'Your subscription box has been created. First delivery coming soon!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create subscription');
    },
  });

  // Pause subscription mutation
  const pauseMutation = useMutation({
    mutationFn: ({ id, resumeDate }: { id: string; resumeDate: string }) =>
      subscriptionBoxService.pause(id, resumeDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySubscriptionBox'] });
      Alert.alert('Paused', 'Your subscription has been paused.');
    },
  });

  // Resume subscription mutation
  const resumeMutation = useMutation({
    mutationFn: (id: string) => subscriptionBoxService.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySubscriptionBox'] });
      Alert.alert('Resumed', 'Your subscription is now active again!');
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => subscriptionBoxService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySubscriptionBox'] });
      Alert.alert('Cancelled', 'Your subscription has been cancelled.');
    },
  });

  const getPrice = () => {
    if (!pricingData) return 0;
    return pricingData.pricing[selectedSize][selectedType];
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCreateSubscription = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to create a subscription.');
      return;
    }

    const data: CreateSubscriptionBoxRequest = {
      type: selectedType,
      size: selectedSize,
      preferredCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
      excludedProducts: excludedProducts ? excludedProducts.split(',').map(s => s.trim()) : undefined,
      deliveryAddress: user.address || '123 Main Street',
      deliveryCity: user.city || 'Lagos',
      deliveryState: user.state || 'Lagos',
      preferredDeliveryDay: selectedDay,
      preferredDeliveryTime: selectedTimeSlot,
      specialInstructions: specialInstructions || undefined,
      paymentMethod: 'wallet',
      autoRenew: true,
    };

    Alert.alert(
      'Confirm Subscription',
      `Create a ${selectedSize} ${selectedType} subscription box for ${subscriptionBoxService.formatPrice(getPrice())}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => createMutation.mutate(data) },
      ]
    );
  };

  const handlePause = () => {
    if (!subscription) return;
    
    // Pause for 2 weeks by default
    const resumeDate = new Date();
    resumeDate.setDate(resumeDate.getDate() + 14);
    
    Alert.alert(
      'Pause Subscription',
      'Your subscription will be paused for 2 weeks. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          onPress: () => pauseMutation.mutate({
            id: subscription.id,
            resumeDate: resumeDate.toISOString(),
          }),
        },
      ]
    );
  };

  const handleCancel = () => {
    if (!subscription) return;
    
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? This cannot be undone.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(subscription.id),
        },
      ]
    );
  };

  const renderActiveSubscription = () => {
    if (!subscription) return null;

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Status Card */}
        <LinearGradient
          colors={['#34C759', '#30D158']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            <Ionicons name="cube" size={32} color="#FFF" />
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {subscription.status?.toUpperCase() || 'ACTIVE'}
              </Text>
            </View>
          </View>
          <Text style={styles.statusTitle}>
            {(subscription.size?.charAt(0)?.toUpperCase() || '') + (subscription.size?.slice(1) || '')} Box
          </Text>
          <Text style={styles.statusSubtitle}>
            {subscriptionBoxService.getTypeLabel(subscription.type)} delivery
          </Text>
          <View style={styles.statusInfo}>
            <View style={styles.statusInfoItem}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statusInfoText}>
                Next: {subscription.nextDeliveryDate
                  ? new Date(subscription.nextDeliveryDate).toLocaleDateString()
                  : 'TBD'}
              </Text>
            </View>
            <View style={styles.statusInfoItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statusInfoText}>
                {subscription.deliveriesCompleted} deliveries completed
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Upcoming Deliveries */}
        {subscription.upcomingDeliveries?.length > 0 && (
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Upcoming Deliveries
            </Text>
            {subscription.upcomingDeliveries.map((delivery, index) => (
              <View key={delivery.id} style={styles.deliveryItem}>
                <View style={[styles.deliveryIcon, { backgroundColor: subscriptionBoxService.getDeliveryStatusColor(delivery.status) + '20' }]}>
                  <Ionicons
                    name={delivery.status === 'scheduled' ? 'time-outline' : 'cube-outline'}
                    size={20}
                    color={subscriptionBoxService.getDeliveryStatusColor(delivery.status)}
                  />
                </View>
                <View style={styles.deliveryInfo}>
                  <Text style={[styles.deliveryDate, { color: colors.text }]}>
                    {new Date(delivery.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={[styles.deliveryDetails, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    {delivery.products.length} items • {subscriptionBoxService.formatPrice(delivery.totalValue)}
                  </Text>
                </View>
                <View style={[styles.deliveryStatusBadge, { backgroundColor: subscriptionBoxService.getDeliveryStatusColor(delivery.status) + '20' }]}>
                  <Text style={[styles.deliveryStatusText, { color: subscriptionBoxService.getDeliveryStatusColor(delivery.status) }]}>
                    {delivery.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Manage Subscription
          </Text>
          
          {subscription.status === SubscriptionBoxStatus.ACTIVE && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: '#FF9500' }]}
              onPress={handlePause}
            >
              <Ionicons name="pause-circle-outline" size={20} color="#FF9500" />
              <Text style={[styles.actionButtonText, { color: '#FF9500' }]}>
                Pause Subscription
              </Text>
            </TouchableOpacity>
          )}

          {subscription.status === SubscriptionBoxStatus.PAUSED && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: '#34C759' }]}
              onPress={() => resumeMutation.mutate(subscription.id)}
            >
              <Ionicons name="play-circle-outline" size={20} color="#34C759" />
              <Text style={[styles.actionButtonText, { color: '#34C759' }]}>
                Resume Subscription
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: '#FF3B30' }]}
            onPress={handleCancel}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
              Cancel Subscription
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderCreateForm = () => {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Hero Section */}
        <LinearGradient
          colors={[COLORS.primary, '#2E7D32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Ionicons name="cube" size={48} color="#FFF" />
          <Text style={styles.heroTitle}>Fresh Box Subscription</Text>
          <Text style={styles.heroSubtitle}>
            Get fresh farm produce delivered to your door automatically
          </Text>
        </LinearGradient>

        {/* Frequency Selection */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Delivery Frequency
          </Text>
          <View style={styles.optionsRow}>
            {Object.values(SubscriptionBoxType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionCard,
                  selectedType === type && styles.optionCardSelected,
                  { borderColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.optionLabel,
                  { color: selectedType === type ? COLORS.primary : colors.text },
                ]}>
                  {subscriptionBoxService.getTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Size Selection */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Box Size
          </Text>
          {Object.values(BoxSize).map((size) => {
            const sizeIcons: Record<string, string> = {
              small: 'cube-outline',
              medium: 'cube',
              large: 'gift-outline',
              family: 'gift',
            };
            return (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeCard,
                  selectedSize === size && styles.sizeCardSelected,
                  { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: selectedSize === size ? COLORS.primary : 'transparent' },
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <View style={[styles.sizeIconContainer, { backgroundColor: selectedSize === size ? `${COLORS.primary}15` : isDark ? '#374151' : '#E5E7EB' }]}>
                  <Ionicons 
                    name={sizeIcons[size] as any} 
                    size={28} 
                    color={selectedSize === size ? COLORS.primary : colors.textSecondary} 
                  />
                </View>
                <View style={styles.sizeInfo}>
                  <Text style={[styles.sizeName, { color: colors.text }]}>
                    {(size?.charAt(0)?.toUpperCase() || '') + (size?.slice(1) || '')}
                  </Text>
                  <Text style={[styles.sizeDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    {subscriptionBoxService.getSizeDescription(size)}
                  </Text>
                </View>
                <View style={styles.sizePriceContainer}>
                  <Text style={[styles.sizePrice, { color: COLORS.primary }]}>
                    {pricingData ? subscriptionBoxService.formatPrice(pricingData.pricing[size][selectedType]) : '...'}
                  </Text>
                  <Text style={[styles.sizePriceLabel, { color: colors.textSecondary }]}>
                    /{selectedType === SubscriptionBoxType.WEEKLY ? 'week' : selectedType === SubscriptionBoxType.BIWEEKLY ? '2 wks' : 'month'}
                  </Text>
                </View>
                {selectedSize === size && (
                  <Ionicons name="checkmark-circle" size={26} color={COLORS.primary} style={styles.sizeCheck} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Preferences */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Preferred Categories (Optional)
          </Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Select your favorite categories for personalized boxes
          </Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                    { borderColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                  onPress={() => toggleCategory(category.id)}
                >
                  <View style={[
                    styles.categoryIconContainer,
                    isSelected && { backgroundColor: `${COLORS.primary}15` },
                  ]}>
                    <category.Illustration 
                      width={32} 
                      height={32} 
                      color={isSelected ? COLORS.primary : colors.text}
                    />
                  </View>
                  <Text style={[
                    styles.categoryName,
                    { color: isSelected ? COLORS.primary : colors.text },
                  ]}>
                    {category.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.categoryCheckmark}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Delivery Day */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Preferred Delivery Day
          </Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  selectedDay === day.id && styles.dayButtonSelected,
                ]}
                onPress={() => setSelectedDay(day.id)}
              >
                <Text style={[
                  styles.dayText,
                  selectedDay === day.id && styles.dayTextSelected,
                ]}>
                  {day.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time Slot */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Delivery Time Slot
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timeSlotsRow}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlotButton,
                    selectedTimeSlot === slot && styles.timeSlotButtonSelected,
                    { borderColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                  onPress={() => setSelectedTimeSlot(slot)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    { color: selectedTimeSlot === slot ? '#FFF' : colors.text },
                  ]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Excluded Products */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Exclude Products (Optional)
          </Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', color: colors.text }]}
            placeholder="e.g., shellfish, peanuts, tomatoes"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={excludedProducts}
            onChangeText={setExcludedProducts}
          />
        </View>

        {/* Special Instructions */}
        <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Special Instructions (Optional)
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', color: colors.text }]}
            placeholder="Any special delivery instructions..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Summary & Subscribe Button */}
        <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {subscriptionBoxService.getTypeLabel(selectedType)} • {(selectedSize?.charAt(0)?.toUpperCase() || '') + (selectedSize?.slice(1) || '')} Box
            </Text>
            <Text style={[styles.summaryPrice, { color: colors.text }]}>
              {subscriptionBoxService.formatPrice(getPrice())}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.subscribeButton, createMutation.isPending && styles.subscribeButtonDisabled]}
            onPress={handleCreateSubscription}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#FFF" />
                <Text style={styles.subscribeButtonText}>Start Subscription</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.card : '#FFF' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Subscription Box
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {subscription && subscription.status !== SubscriptionBoxStatus.CANCELLED
          ? renderActiveSubscription()
          : renderCreateForm()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  heroCard: {
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  statusCard: {
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  statusTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  statusSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: SPACING.md,
  },
  statusInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: SPACING.md,
  },
  statusInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusInfoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  section: {
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionCard: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  sizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 2,
    minHeight: 100,
  },
  sizeCardSelected: {
    borderWidth: 2,
  },
  sizeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sizeInfo: {
    flex: 1,
  },
  sizeName: {
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  sizeDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  sizePriceContainer: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  sizePrice: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  sizePriceLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  sizeCheck: {
    marginLeft: SPACING.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1.5,
    width: (width - SPACING.md * 4 - SPACING.sm * 3) / 4,
    minHeight: 80,
    justifyContent: 'center',
  },
  categoryChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  categoryName: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: '#6B7280',
  },
  dayTextSelected: {
    color: '#FFF',
  },
  timeSlotsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  timeSlotButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  timeSlotButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  textInput: {
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  summaryPrice: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#FFF',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryDate: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  deliveryDetails: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  deliveryStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveryStatusText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    textTransform: 'capitalize',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: SPACING.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
});
