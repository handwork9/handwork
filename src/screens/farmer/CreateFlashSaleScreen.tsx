import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/apiClient';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants/theme';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  stock: number;
}

export default function CreateFlashSaleScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  
  const preSelectedProduct = route.params?.product;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(preSelectedProduct || null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Fetch farmer's products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['farmerProducts'],
    queryFn: async () => {
      const response = await apiClient.get('/products/farmer/my-products?limit=100');
      return (response as any).data;
    },
  });

  const products = productsData?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/flash-sales', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmerFlashSales'] });
      queryClient.invalidateQueries({ queryKey: ['flashSales'] });
      Alert.alert(
        'Success!', 
        'Your flash sale has been created and will go live at the scheduled time.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create flash sale');
    },
  });

  const calculatedSalePrice = useMemo(() => {
    if (!selectedProduct || !discountPercent) return 0;
    const discount = parseFloat(discountPercent) || 0;
    return selectedProduct.price * (1 - discount / 100);
  }, [selectedProduct, discountPercent]);

  const savings = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.price - calculatedSalePrice;
  }, [selectedProduct, calculatedSalePrice]);

  const handleCreateFlashSale = useCallback(() => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your flash sale');
      return;
    }

    const discount = parseFloat(discountPercent);
    if (isNaN(discount) || discount < 1 || discount > 99) {
      Alert.alert('Error', 'Discount must be between 1% and 99%');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (qty > (selectedProduct.stock || 999)) {
      Alert.alert('Error', `Quantity cannot exceed available stock (${selectedProduct.stock})`);
      return;
    }

    if (startDate < new Date()) {
      Alert.alert('Error', 'Start time must be in the future');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    createMutation.mutate({
      productId: selectedProduct.id,
      title: title.trim(),
      description: description.trim() || undefined,
      discountPercent: discount,
      totalQuantity: qty,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });
  }, [selectedProduct, title, description, discountPercent, quantity, startDate, endDate, createMutation]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderProductPicker = () => (
    <View style={[styles.pickerModal, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
      <View style={styles.pickerHeader}>
        <TouchableOpacity onPress={() => setShowProductPicker(false)}>
          <Text style={[styles.pickerCancel, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Product</Text>
        <View style={{ width: 50 }} />
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products available</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Add products to your store first</Text>
        </View>
      ) : (
        <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
          {products.map((product: Product) => (
            <TouchableOpacity
              key={product.id}
              style={[
                styles.productItem,
                { backgroundColor: isDark ? colors.background : '#F9FAFB' },
                selectedProduct?.id === product.id && styles.selectedProductItem,
              ]}
              onPress={() => {
                setSelectedProduct(product);
                setShowProductPicker(false);
              }}
            >
              <Image
                source={{ uri: product.images?.[0] || 'https://via.placeholder.com/50' }}
                style={styles.productItemImage}
              />
              <View style={styles.productItemInfo}>
                <Text style={[styles.productItemTitle, { color: colors.text }]} numberOfLines={1}>
                  {product.title}
                </Text>
                <Text style={[styles.productItemPrice, { color: colors.textSecondary }]}>
                  ₦{product.price?.toLocaleString()}
                </Text>
              </View>
              {selectedProduct?.id === product.id && (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Flash Sale</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Product Selection */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="cube-outline" size={18} /> Select Product
            </Text>
            <TouchableOpacity
              style={[styles.productSelector, { borderColor: colors.border }]}
              onPress={() => setShowProductPicker(true)}
            >
              {selectedProduct ? (
                <View style={styles.selectedProduct}>
                  <Image
                    source={{ uri: selectedProduct.images?.[0] || 'https://via.placeholder.com/60' }}
                    style={styles.selectedProductImage}
                  />
                  <View style={styles.selectedProductInfo}>
                    <Text style={[styles.selectedProductTitle, { color: colors.text }]} numberOfLines={1}>
                      {selectedProduct.title}
                    </Text>
                    <Text style={[styles.selectedProductPrice, { color: '#10B981' }]}>
                      ₦{selectedProduct.price?.toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              ) : (
                <View style={styles.placeholderRow}>
                  <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Tap to select a product
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Sale Details */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="pricetag-outline" size={18} /> Sale Details
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Sale Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#333' : '#F9FAFB', color: colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., New Year Flash Sale!"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: isDark ? '#333' : '#F9FAFB', color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description for your flash sale..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Discount % *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#333' : '#F9FAFB', color: colors.text }]}
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  placeholder="e.g., 30"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Quantity *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#333' : '#F9FAFB', color: colors.text }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="e.g., 50"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Price Preview */}
          {selectedProduct && discountPercent && (
            <View style={[styles.section, styles.previewSection]}>
              <Text style={styles.previewTitle}>Price Preview</Text>
              <View style={styles.previewRow}>
                <View>
                  <Text style={styles.previewLabel}>Original Price</Text>
                  <Text style={styles.originalPriceText}>
                    ₦{selectedProduct.price?.toLocaleString()}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                <View>
                  <Text style={styles.previewLabel}>Sale Price</Text>
                  <Text style={styles.salePriceText}>
                    ₦{calculatedSalePrice.toLocaleString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.savingsText}>
                Customers save ₦{savings.toLocaleString()} ({discountPercent}% off)
              </Text>
            </View>
          )}

          {/* Schedule */}
          <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <Ionicons name="time-outline" size={18} /> Schedule
            </Text>

            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <View style={styles.dateInfo}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Start Time</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{formatDate(startDate)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <View style={styles.dateInfo}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>End Time</Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>{formatDate(endDate)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Duration Info */}
            <View style={styles.durationInfo}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                Sale will run for {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} hours
              </Text>
            </View>
          </View>

          {/* Tips */}
          <View style={[styles.tipsSection, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="bulb-outline" size={20} color="#92400E" />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Tips for a successful flash sale:</Text>
              <Text style={styles.tipText}>• Offer at least 20% discount for best results</Text>
              <Text style={styles.tipText}>• Keep duration under 24 hours for urgency</Text>
              <Text style={styles.tipText}>• Schedule during peak shopping hours</Text>
            </View>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={[styles.footer, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!selectedProduct || !title || !discountPercent || !quantity) && styles.disabledButton
            ]}
            onPress={handleCreateFlashSale}
            disabled={!selectedProduct || !title || !discountPercent || !quantity || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Text style={styles.createButtonText}>Creating...</Text>
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#FFF" />
                <Text style={styles.createButtonText}>Create Flash Sale</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Product Picker Modal */}
        {showProductPicker && (
          <View style={styles.modalOverlay}>
            {renderProductPicker()}
          </View>
        )}

        {/* Date Pickers */}
        {showStartPicker && (
          Platform.OS === 'ios' ? (
            <View style={styles.datePickerModal}>
              <View style={[styles.datePickerContainer, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={[styles.datePickerTitle, { color: colors.text }]}>Start Time</Text>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startDate}
                  mode="datetime"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setStartDate(date);
                  }}
                  minimumDate={new Date()}
                  textColor={colors.text}
                />
              </View>
            </View>
          ) : (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="default"
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (date) setStartDate(date);
              }}
              minimumDate={new Date()}
            />
          )
        )}

        {showEndPicker && (
          Platform.OS === 'ios' ? (
            <View style={styles.datePickerModal}>
              <View style={[styles.datePickerContainer, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text style={[styles.datePickerCancel, { color: colors.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={[styles.datePickerTitle, { color: colors.text }]}>End Time</Text>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endDate}
                  mode="datetime"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setEndDate(date);
                  }}
                  minimumDate={startDate}
                  textColor={colors.text}
                />
              </View>
            </View>
          ) : (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={(event, date) => {
                setShowEndPicker(false);
                if (date) setEndDate(date);
              }}
              minimumDate={startDate}
            />
          )
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 12,
  },
  productSelector: {
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 16,
  },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  placeholderText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedProductImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  selectedProductInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedProductTitle: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  selectedProductPrice: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  previewSection: {
    backgroundColor: '#EF4444',
    padding: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  originalPriceText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
  },
  salePriceText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  savingsText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#FEF08A',
    textAlign: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  dateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  dateValue: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  durationText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  tipsSection: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#92400E',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#92400E',
    marginBottom: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#FCA5A5',
  },
  createButtonText: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  pickerCancel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    width: 50,
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  productList: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedProductItem: {
    backgroundColor: '#10B98110',
  },
  productItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productItemTitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  productItemPrice: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  datePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  datePickerCancel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  datePickerTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  datePickerDone: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#EF4444',
  },
});
