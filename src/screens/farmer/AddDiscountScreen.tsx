import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  Switch,
  Platform,
  Modal,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { FarmerStackParamList, Product } from '../../types';
import discountService, { DiscountType as ApiDiscountType } from '../../services/discountService';
import { productService } from '../../services/productService';

type RouteType = RouteProp<FarmerStackParamList, 'AddDiscount'>;

type DiscountType = 'percentage' | 'fixed';

const AddDiscountScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const routeProduct = route.params?.product;

  // Product selection state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minQuantity, setMinQuantity] = useState('1');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default 7 days from now
  const [isLimitedTime, setIsLimitedTime] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [usePromoCode, setUsePromoCode] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Fetch farmer's products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await productService.getMyProducts();
      const productList = (response as any)?.products || (response as any)?.data?.products || response || [];
      setProducts(Array.isArray(productList) ? productList : []);
      
      // If we have a route product with valid UUID, try to find it
      if (routeProduct?.id && typeof routeProduct.id === 'string' && routeProduct.id.includes('-')) {
        const found = productList.find((p: Product) => p.id === routeProduct.id);
        if (found) {
          setSelectedProduct(found);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      Alert.alert('Error', 'Failed to load your products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const calculateDiscountedPrice = (): number => {
    if (!selectedProduct) return 0;
    const price = Number(selectedProduct.price) || 0;
    const discount = parseFloat(discountValue) || 0;

    if (discountType === 'percentage') {
      return price * (1 - discount / 100);
    } else {
      return Math.max(0, price - discount);
    }
  };

  const handleApplyDiscount = async () => {
    if (!selectedProduct) {
      Alert.alert('Select Product', 'Please select a product to apply discount');
      return;
    }

    if (!discountValue || parseFloat(discountValue) <= 0) {
      Alert.alert('Invalid Discount', 'Please enter a valid discount value');
      return;
    }

    if (discountType === 'percentage' && parseFloat(discountValue) > 100) {
      Alert.alert('Invalid Discount', 'Percentage discount cannot exceed 100%');
      return;
    }

    if (isLimitedTime && endDate <= startDate) {
      Alert.alert('Invalid End Date', 'End date must be after start date');
      return;
    }

    if (usePromoCode && !promoCode.trim()) {
      Alert.alert('Missing Promo Code', 'Please enter a promo code');
      return;
    }

    setIsSubmitting(true);

    try {
      await discountService.createDiscount({
        productId: selectedProduct.id,
        discountType: discountType === 'percentage' ? ApiDiscountType.PERCENTAGE : ApiDiscountType.FIXED,
        discountValue: parseFloat(discountValue),
        originalPrice: originalPrice,
        discountedPrice: discountedPrice,
        minQuantity: parseInt(minQuantity) || 1,
        isLimitedTime: isLimitedTime,
        startDate: isLimitedTime ? startDate.toISOString() : undefined,
        endDate: isLimitedTime ? endDate.toISOString() : undefined,
        usePromoCode: usePromoCode,
        promoCode: usePromoCode ? promoCode.trim().toUpperCase() : undefined,
      });

      Alert.alert(
        'Discount Applied! 🎉',
        `Your ${discountType === 'percentage' ? discountValue + '%' : '₦' + discountValue} discount has been applied to ${selectedProduct.title}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to create discount:', error);
      const message = error.response?.data?.message || error.message || 'Failed to apply discount. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const originalPrice = Number(selectedProduct?.price) || 0;
  const discountedPrice = calculateDiscountedPrice();
  const savings = originalPrice - discountedPrice;

  // Helper function to check if image URI is valid
  const isValidImageUri = (uri: string | undefined | null): boolean => {
    if (!uri || typeof uri !== 'string') return false;
    const trimmed = uri.trim();
    return trimmed.length > 0 && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://') || trimmed.startsWith('data:image/'));
  };

  const getFirstValidImage = (images: string[] | undefined | null): string | null => {
    if (!images || !Array.isArray(images)) return null;
    const validImage = images.find(img => isValidImageUri(img));
    return validImage || null;
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const imageUri = getFirstValidImage(item.images);
    return (
    <TouchableOpacity
      style={[
        styles.productPickerItem,
        { backgroundColor: isDark ? colors.card : COLORS.surface },
        selectedProduct?.id === item.id && styles.productPickerItemSelected,
      ]}
      onPress={() => {
        setSelectedProduct(item);
        setShowProductPicker(false);
      }}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.productPickerImage} />
      ) : (
        <View style={[styles.productPickerImagePlaceholder, { backgroundColor: isDark ? colors.border : '#E0E0E0' }]}>
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.productPickerInfo}>
        <Text style={[styles.productPickerName, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.productPickerPrice, { color: colors.textSecondary }]}>
          ₦{item.price?.toLocaleString()}
        </Text>
      </View>
      {selectedProduct?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
  };

  if (isLoadingProducts) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? colors.card : '#DEDEE0' }]} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Discount</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Product Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Product</Text>
            <TouchableOpacity
              style={[styles.productSelector, { backgroundColor: isDark ? colors.card : COLORS.surface }]}
              onPress={() => setShowProductPicker(true)}
            >
              {selectedProduct ? (
                <>
                  {getFirstValidImage(selectedProduct.images) ? (
                    <Image source={{ uri: getFirstValidImage(selectedProduct.images)! }} style={styles.selectedProductImage} />
                  ) : (
                    <View style={[styles.selectedProductImagePlaceholder, { backgroundColor: isDark ? colors.border : '#E0E0E0' }]}>
                      <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.selectedProductInfo}>
                    <Text style={[styles.selectedProductName, { color: colors.text }]} numberOfLines={1}>
                      {selectedProduct.title}
                    </Text>
                    <Text style={[styles.selectedProductPrice, { color: colors.textSecondary }]}>
                      ₦{selectedProduct.price?.toLocaleString()}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.productSelectorPlaceholder, { color: colors.textSecondary }]}>
                  Tap to select a product
                </Text>
              )}
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Product Preview - only show when product is selected */}
          {selectedProduct && (
            <View style={[styles.productPreview, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
              {getFirstValidImage(selectedProduct.images) ? (
                <Image source={{ uri: getFirstValidImage(selectedProduct.images)! }} style={styles.previewImage} />
              ) : (
                <View style={[styles.previewImagePlaceholder, { backgroundColor: isDark ? colors.border : '#E0E0E0' }]}>
                  <Ionicons name="leaf" size={32} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]}>{selectedProduct.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>₦{originalPrice.toLocaleString()}</Text>
                  {discountValue && parseFloat(discountValue) > 0 && (
                    <>
                      <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
                      <Text style={styles.discountedPrice}>₦{discountedPrice.toFixed(0)}</Text>
                    </>
                  )}
                </View>
              </View>
              {discountValue && parseFloat(discountValue) > 0 && (
                <View style={[styles.savingsBadge, { backgroundColor: isDark ? `${COLORS.success}30` : COLORS.successLight }]}>
                  <Text style={styles.savingsText}>Save ₦{savings.toFixed(0)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Discount Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Discount Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeOption, { backgroundColor: isDark ? colors.card : COLORS.surface }, discountType === 'percentage' && styles.typeOptionActive]}
                onPress={() => setDiscountType('percentage')}
              >
                <Text style={[styles.percentIcon, discountType === 'percentage' && styles.percentIconActive]}>%</Text>
                <Text style={[styles.typeText, { color: colors.text }, discountType === 'percentage' && styles.typeTextActive]}>
                  Percentage
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, { backgroundColor: isDark ? colors.card : COLORS.surface }, discountType === 'fixed' && styles.typeOptionActive]}
                onPress={() => setDiscountType('fixed')}
              >
                <Text style={[styles.fixedAmountIcon, discountType === 'fixed' && styles.fixedAmountIconActive]}>₦</Text>
                <Text style={[styles.typeText, { color: colors.text }, discountType === 'fixed' && styles.typeTextActive]}>
                  Fixed Amount
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Discount Value */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Discount Value</Text>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }]}>
              <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>
                {discountType === 'percentage' ? '%' : '₦'}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={discountValue}
                onChangeText={setDiscountValue}
                placeholder={discountType === 'percentage' ? '10' : '500'}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Quick Discount Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Select</Text>
            <View style={styles.quickOptions}>
              {(discountType === 'percentage' ? ['5', '10', '15', '20', '25', '30'] : ['100', '200', '500', '1000', '1500', '2000']).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.quickOption, { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }, discountValue === value && styles.quickOptionActive]}
                  onPress={() => setDiscountValue(value)}
                >
                  <Text style={[styles.quickOptionText, { color: colors.text }, discountValue === value && styles.quickOptionTextActive]}>
                    {discountType === 'percentage' ? `${value}%` : `₦${value}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Minimum Quantity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Minimum Quantity</Text>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }]}>
              <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={minQuantity}
                onChangeText={setMinQuantity}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>units</Text>
            </View>
          </View>

          {/* Limited Time Toggle */}
          <View style={[styles.toggleSection, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.toggleInfo}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Limited Time Offer</Text>
                <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>Set start and end dates</Text>
              </View>
            </View>
            <Switch
              value={isLimitedTime}
              onValueChange={setIsLimitedTime}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.2)' : COLORS.border, true: COLORS.primaryLight }}
              thumbColor={isLimitedTime ? COLORS.primary : COLORS.gray}
            />
          </View>

          {isLimitedTime && (
            <View style={styles.dateSection}>
              <TouchableOpacity style={[styles.dateInput, { backgroundColor: isDark ? colors.card : COLORS.surface }]} onPress={() => setShowStartPicker(true)}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Start Date</Text>
                <View style={[styles.dateContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }]}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateInput, { backgroundColor: isDark ? colors.card : COLORS.surface }]} onPress={() => setShowEndPicker(true)}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>End Date</Text>
                <View style={[styles.dateContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }]}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={[styles.dateText, { color: colors.text }]}>
                    {endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Date Pickers */}
          {Platform.OS === 'ios' ? (
            <>
              <Modal visible={showStartPicker} transparent animationType="slide">
                <View style={styles.pickerModal}>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
                    <View style={[styles.pickerHeader, { borderBottomColor: isDark ? 'rgba(60, 60, 67, 0.12)' : COLORS.border }]}>
                      <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Start Date</Text>
                      <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                        <Text style={styles.pickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="inline"
                      onChange={(event: DateTimePickerEvent, date?: Date) => {
                        if (date) setStartDate(date);
                      }}
                      minimumDate={new Date()}
                      style={[styles.picker, { backgroundColor: isDark ? colors.card : COLORS.white }]}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  </View>
                </View>
              </Modal>
              <Modal visible={showEndPicker} transparent animationType="slide">
                <View style={styles.pickerModal}>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
                    <View style={[styles.pickerHeader, { borderBottomColor: isDark ? 'rgba(60, 60, 67, 0.12)' : COLORS.border }]}>
                      <Text style={[styles.pickerTitle, { color: colors.text }]}>Select End Date</Text>
                      <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                        <Text style={styles.pickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="inline"
                      onChange={(event: DateTimePickerEvent, date?: Date) => {
                        if (date) setEndDate(date);
                      }}
                      minimumDate={startDate}
                      style={[styles.picker, { backgroundColor: isDark ? colors.card : COLORS.white }]}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                  minimumDate={new Date()}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                  minimumDate={startDate}
                />
              )}
            </>
          )}

          {/* Promo Code Toggle */}
          <View style={[styles.toggleSection, { backgroundColor: isDark ? colors.card : COLORS.surface }]}>
            <View style={styles.toggleInfo}>
              <Ionicons name="ticket-outline" size={24} color={COLORS.secondary} />
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Require Promo Code</Text>
                <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>Customers must enter code</Text>
              </View>
            </View>
            <Switch
              value={usePromoCode}
              onValueChange={setUsePromoCode}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.2)' : COLORS.border, true: COLORS.secondaryLight }}
              thumbColor={usePromoCode ? COLORS.secondary : COLORS.gray}
            />
          </View>

          {usePromoCode && (
            <View style={styles.section}>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.card : COLORS.surface, borderColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }]}>
                <Ionicons name="ticket-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={promoCode}
                  onChangeText={(text) => setPromoCode(text.toUpperCase())}
                  placeholder="SUMMER20"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          )}

          {/* Preview Card */}
          {discountValue && parseFloat(discountValue) > 0 && (
            <View style={styles.previewCard}>
              <LinearGradient
                colors={[COLORS.success, '#0d9052']}
                style={styles.previewGradient}
              >
                <Text style={styles.previewTitle}>Discount Preview</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Original Price:</Text>
                  <Text style={styles.previewValue}>₦{originalPrice.toFixed(0)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Discount:</Text>
                  <Text style={styles.previewValue}>
                    -{discountType === 'percentage' ? `${discountValue}%` : `₦${discountValue}`}
                  </Text>
                </View>
                <View style={[styles.previewRow, styles.previewTotal]}>
                  <Text style={styles.previewTotalLabel}>New Price:</Text>
                  <Text style={styles.previewTotalValue}>₦{discountedPrice.toFixed(0)}</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          <View style={{ height: SPACING.xxl }} />
        </Animated.View>
      </ScrollView>

      {/* Apply Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md, backgroundColor: isDark ? colors.card : COLORS.surface, borderTopColor: isDark ? 'rgba(60, 60, 67, 0.29)' : COLORS.border }]}>
        <TouchableOpacity 
          style={[styles.applyButton, isSubmitting && styles.applyButtonDisabled]} 
          onPress={handleApplyDiscount}
          disabled={isSubmitting || !selectedProduct}
        >
          <LinearGradient
            colors={isSubmitting || !selectedProduct ? [COLORS.gray, COLORS.gray] : [COLORS.primary, COLORS.primaryDark]}
            style={styles.applyGradient}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="pricetag" size={20} color={COLORS.white} />
                <Text style={styles.applyText}>Apply Discount</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Product Picker Modal */}
      <Modal
        visible={showProductPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.productPickerModal}>
          <View style={[styles.productPickerContainer, { backgroundColor: isDark ? colors.card : COLORS.white }]}>
            <View style={styles.productPickerHeader}>
              <Text style={[styles.productPickerTitle, { color: colors.text }]}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {products.length === 0 ? (
              <View style={styles.noProductsContainer}>
                <Ionicons name="leaf-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.noProductsText, { color: colors.textSecondary }]}>
                  No products found. Add products first.
                </Text>
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item, index) => item?.id || `prod-${index}`}
                contentContainerStyle={styles.productPickerList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  productEmoji: {
    fontSize: 48,
    marginRight: SPACING.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  originalPrice: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  savingsBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  savingsText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  typeOptionActive: {
    backgroundColor: COLORS.primary,
  },
  typeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  typeTextActive: {
    color: COLORS.white,
  },
  percentIcon: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  percentIconActive: {
    color: COLORS.white,
  },
  fixedAmountIcon: {
    fontSize: 26,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    color: COLORS.primary,
  },
  fixedAmountIconActive: {
    color: COLORS.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputPrefix: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
  },
  inputSuffix: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  quickOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickOptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  quickOptionTextActive: {
    color: COLORS.white,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  toggleSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dateSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  dateTextInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  previewCard: {
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  previewGradient: {
    padding: SPACING.md,
  },
  previewTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  previewLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
  },
  previewValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  previewTotal: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  previewTotalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  previewTotalValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  bottomBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  applyButtonDisabled: {
    opacity: 0.7,
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  applyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
  },
  pickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  pickerDone: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  picker: {
    height: 340,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  productSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  productSelectorPlaceholder: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  selectedProductImage: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  selectedProductImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  selectedProductPrice: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  previewImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  productPickerContainer: {
    maxHeight: '70%',
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xl,
  },
  productPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productPickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  productPickerList: {
    padding: SPACING.md,
  },
  productPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  productPickerItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  productPickerImage: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
  },
  productPickerImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPickerInfo: {
    flex: 1,
  },
  productPickerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  productPickerPrice: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  noProductsContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noProductsText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
});

export default AddDiscountScreen;
