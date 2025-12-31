import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { groupBuyingService, CreateGroupBuyData } from '../../services/groupBuyingService';
import { productService } from '../../services/productService';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  unit: string;
}

export default function CreateGroupBuyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(route.params?.product || null);
  const [minParticipants, setMinParticipants] = useState('3');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [quantityPerPerson, setQuantityPerPerson] = useState('1');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
  const [isPublic, setIsPublic] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateGroupBuyData) => groupBuyingService.create(data),
    onSuccess: (groupBuy) => {
      queryClient.invalidateQueries({ queryKey: ['groupBuys'] });
      queryClient.invalidateQueries({ queryKey: ['myGroupBuys'] });
      Alert.alert(
        'Success! 🎉',
        `Your group buy "${groupBuy.title}" has been created. Share it with friends!`,
        [
          {
            text: 'View Group Buy',
            onPress: () => navigation.replace('GroupBuying'),
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create group buy');
    },
  });

  // Search products
  const handleSearchProducts = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await productService.getProducts({ searchQuery: query, limit: 10 });
      setSearchResults(response.products || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle form submission
  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your group buy');
      return;
    }
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }
    if (parseInt(minParticipants) < 2) {
      Alert.alert('Error', 'Minimum participants must be at least 2');
      return;
    }

    const data: CreateGroupBuyData = {
      title: title.trim(),
      description: description.trim() || undefined,
      productId: selectedProduct.id,
      originalPrice: selectedProduct.price,
      minParticipants: parseInt(minParticipants),
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
      quantityPerPerson: parseInt(quantityPerPerson) || 1,
      deadline,
      isPublic,
    };

    createMutation.mutate(data);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Create Group Buy
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Select Product *
          </Text>
          
          {selectedProduct ? (
            <View style={[styles.selectedProduct, { backgroundColor: colors.card }]}>
              <Image
                source={{ uri: selectedProduct.images?.[0] || 'https://via.placeholder.com/80' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
                  {selectedProduct.title}
                </Text>
                <Text style={[styles.productPrice, { color: COLORS.primary }]}>
                  ₦{selectedProduct.price.toLocaleString()} / {selectedProduct.unit}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => {
                  setSelectedProduct(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
              <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search products..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearchProducts}
                />
                {isSearching && (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                )}
              </View>
              
              {searchResults.length > 0 && (
                <View style={[styles.searchResults, { borderColor: colors.border }]}>
                  {searchResults.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setSelectedProduct(product);
                        setSearchQuery('');
                        setSearchResults([]);
                        if (!title) {
                          setTitle(`Group Buy: ${product.title}`);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: product.images?.[0] || 'https://via.placeholder.com/40' }}
                        style={styles.searchResultImage}
                      />
                      <View style={styles.searchResultInfo}>
                        <Text style={[styles.searchResultTitle, { color: colors.text }]} numberOfLines={1}>
                          {product.title}
                        </Text>
                        <Text style={[styles.searchResultPrice, { color: COLORS.primary }]}>
                          ₦{product.price.toLocaleString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <View style={styles.noResults}>
                  <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                    No products found for "{searchQuery}"
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Title *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., Group Buy: Fresh Tomatoes"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Description (Optional)
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Add more details about this group buy..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Participants
          </Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Minimum *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="3"
                placeholderTextColor={colors.textSecondary}
                value={minParticipants}
                onChangeText={setMinParticipants}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Maximum</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="No limit"
                placeholderTextColor={colors.textSecondary}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Quantity per person */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quantity per Person
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="1"
            placeholderTextColor={colors.textSecondary}
            value={quantityPerPerson}
            onChangeText={setQuantityPerPerson}
            keyboardType="number-pad"
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Each participant will purchase this quantity
          </Text>
        </View>

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Deadline *
          </Text>
          <TouchableOpacity
            style={[styles.input, styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatDate(deadline)}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Group buy will end on this date
          </Text>

          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              display="default"
              minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDeadline(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Visibility */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Public Group Buy
              </Text>
              <Text style={[styles.helperText, { color: colors.textSecondary, marginTop: 4 }]}>
                {isPublic ? 'Anyone can discover and join' : 'Only people with the link can join'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.border, true: COLORS.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Discount Info */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
          <Ionicons name="information-circle" size={24} color="#10B981" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: '#10B981' }]}>
              Group Discounts
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              3+ people: 5% off{'\n'}
              5+ people: 10% off{'\n'}
              10+ people: 15% off{'\n'}
              20+ people: 20% off{'\n'}
              50+ people: 25% off
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: COLORS.primary },
            createMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="megaphone" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Group Buy</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  helperText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginTop: SPACING.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  selectProductText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  productTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  changeButton: {
    padding: SPACING.sm,
  },
  searchContainer: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
  },
  searchLoader: {
    padding: SPACING.sm,
  },
  searchResults: {
    maxHeight: 250,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#f0f0f0',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  searchResultTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  searchResultPrice: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semiBold,
  },
  noResults: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  infoTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
});
