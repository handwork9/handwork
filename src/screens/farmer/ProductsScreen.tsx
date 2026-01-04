import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
  Share,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { ProductPlusIcon } from '../../assets/icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import { LoadingState, Button } from '../../components/common';
import { productService } from '../../services/productService';
import { Product, FarmerStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, getFirstValidImageUrl } from '../../utils/formatters';
import { useAppDispatch, useAppSelector } from '../../store';
import { setProducts, removeProduct as removeProductFromState } from '../../store/slices/farmerSlice';

type NavigationProp = NativeStackNavigationProp<FarmerStackParamList>;

// Sort options
const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First', icon: 'time-outline' as const },
  { key: 'oldest', label: 'Oldest First', icon: 'time-outline' as const },
  { key: 'name_asc', label: 'Name (A-Z)', icon: 'text-outline' as const },
  { key: 'name_desc', label: 'Name (Z-A)', icon: 'text-outline' as const },
  { key: 'price_low', label: 'Price: Low to High', icon: 'trending-up-outline' as const },
  { key: 'price_high', label: 'Price: High to Low', icon: 'trending-down-outline' as const },
  { key: 'stock_low', label: 'Stock: Low to High', icon: 'warning-outline' as const },
  { key: 'stock_high', label: 'Stock: High to Low', icon: 'checkmark-circle-outline' as const },
] as const;

type SortOption = typeof SORT_OPTIONS[number]['key'];

export default function ProductsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { products: reduxProducts } = useAppSelector(state => state.farmer);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all');
  
  // Check if this is the stack screen (FarmerProducts) vs tab screen (Products)
  const isStackScreen = route.name === 'FarmerProducts';
  
  // Search and Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Quick Stock Update state
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [newStockValue, setNewStockValue] = useState('');
  
  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => productService.getMyProducts(),
  });
  
  // Refetch products when screen gains focus (e.g., after adding/editing)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  
  // Sync products to Redux state
  useEffect(() => {
    if (data?.products) {
      dispatch(setProducts({ products: data.products, total: data.total || data.products.length }));
    }
  }, [data, dispatch]);

  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      // Also update Redux state
      dispatch(removeProductFromState(productId));
    },
  });

  // Stock update mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ productId, stock }: { productId: string; stock: number }) =>
      productService.updateProduct(productId, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      setStockModalVisible(false);
      setSelectedProductForStock(null);
      setNewStockValue('');
      Alert.alert('Success', 'Stock updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update stock');
    },
  });

  // Bulk availability toggle mutation
  const bulkToggleAvailabilityMutation = useMutation({
    mutationFn: async ({ productIds, isAvailable }: { productIds: string[]; isAvailable: boolean }) => {
      await Promise.all(
        productIds.map(id => productService.updateProduct(id, { isAvailable }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      setSelectedProducts([]);
      setSelectionMode(false);
      Alert.alert('Success', 'Products updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update products');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDelete = (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(productId),
        },
      ]
    );
  };

  const products = (data?.products || []).filter((p: any) => p != null && p.id != null);
  
  // Filtered and sorted products with search
  const filteredProducts = useMemo(() => {
    let result = products.filter((product: Product) => {
      if (!product || !product.id) return false;
      // Status filter
      let statusMatch = true;
      switch (filter) {
        case 'active':
          statusMatch = product.isAvailable && product.stock > 0;
          break;
        case 'low_stock':
          statusMatch = product.stock > 0 && product.stock < 10;
          break;
        case 'out_of_stock':
          statusMatch = product.stock === 0;
          break;
        default:
          statusMatch = true;
      }
      
      // Search filter
      let searchMatch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const productName = (product.title || product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        searchMatch = productName.includes(query) || category.includes(query);
      }
      
      return statusMatch && searchMatch;
    });
    
    // Sort products
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'name_asc':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'name_desc':
          return (b.title || b.name || '').localeCompare(a.title || a.name || '');
        case 'price_low':
          return Number(a.price) - Number(b.price);
        case 'price_high':
          return Number(b.price) - Number(a.price);
        case 'stock_low':
          return a.stock - b.stock;
        case 'stock_high':
          return b.stock - a.stock;
        default:
          return 0;
      }
    });
    
    return result;
  }, [products, filter, searchQuery, sortBy]);

  const filterTabs = [
    { key: 'all', label: 'All', icon: 'grid-outline' as const },
    { key: 'active', label: 'Active', icon: 'checkmark-circle-outline' as const },
    { key: 'low_stock', label: 'Low Stock', icon: 'alert-circle-outline' as const },
    { key: 'out_of_stock', label: 'Out', icon: 'close-circle-outline' as const },
  ] as const;

  const stats = [
    { 
      label: 'Total', 
      value: products.length, 
      color: colors.text,
      icon: 'cube' as const,
      iconColor: '#007AFF',
      iconBg: '#E3F2FD',
    },
    { 
      label: 'Active', 
      value: products.filter((p: Product) => p.isAvailable && p.stock > 0).length,
      color: '#34C759',
      icon: 'checkmark-circle' as const,
      iconColor: '#34C759',
      iconBg: '#E8F5E9',
    },
    { 
      label: 'Low Stock', 
      value: products.filter((p: Product) => p.stock > 0 && p.stock < 10).length,
      color: '#FF9500',
      icon: 'alert-circle' as const,
      iconColor: '#FF9500',
      iconBg: '#FFF3E0',
    },
    { 
      label: 'Out', 
      value: products.filter((p: Product) => p.stock === 0).length,
      color: '#FF3B30',
      icon: 'close-circle' as const,
      iconColor: '#FF3B30',
      iconBg: '#FFEBEE',
    },
  ];

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return { label: 'Out of Stock', color: '#FF3B30', bgColor: '#FFEBEE' };
    }
    if (stock < 10) {
      return { label: `${stock} left`, color: '#FF9500', bgColor: '#FFF3E0' };
    }
    return { label: `${stock} in stock`, color: '#34C759', bgColor: '#E8F5E9' };
  };

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle quick stock update
  const handleQuickStockUpdate = (product: Product) => {
    setSelectedProductForStock(product);
    setNewStockValue(product.stock.toString());
    setStockModalVisible(true);
  };

  // Confirm stock update
  const confirmStockUpdate = () => {
    if (!selectedProductForStock) return;
    
    const newStock = parseInt(newStockValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      Alert.alert('Invalid Stock', 'Please enter a valid stock number');
      return;
    }
    
    updateStockMutation.mutate({
      productId: selectedProductForStock.id,
      stock: newStock,
    });
  };

  // Handle duplicate product
  const handleDuplicateProduct = (product: Product) => {
    Alert.alert(
      'Duplicate Product',
      `Create a copy of "${product.title || product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => {
            // Navigate to AddProduct with pre-filled data
            navigation.navigate('AddProduct', {
              duplicateFrom: {
                title: `${product.title || product.name} (Copy)`,
                description: product.description,
                price: product.price,
                unit: product.unit,
                stock: product.stock,
                category: product.category,
                images: product.images,
              },
            } as any);
          },
        },
      ]
    );
  };

  // Handle bulk actions
  const handleBulkToggleAvailability = (isAvailable: boolean) => {
    const action = isAvailable ? 'available' : 'unavailable';
    Alert.alert(
      'Bulk Update',
      `Mark ${selectedProducts.length} product(s) as ${action}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => bulkToggleAvailabilityMutation.mutate({ productIds: selectedProducts, isAvailable }),
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Products',
      `Are you sure you want to delete ${selectedProducts.length} product(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedProducts.map(id => deleteMutation.mutateAsync(id)));
              setSelectedProducts([]);
              setSelectionMode(false);
              Alert.alert('Success', 'Products deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some products');
            }
          },
        },
      ]
    );
  };

  // Export products to CSV
  const handleExportProducts = async () => {
    const productsToExport = selectionMode && selectedProducts.length > 0
      ? filteredProducts.filter((p: Product) => selectedProducts.includes(p.id))
      : filteredProducts;
    
    const headers = ['Name', 'Category', 'Price', 'Unit', 'Stock', 'Status', 'Created'];
    const rows = productsToExport.map((p: Product) => [
      p.title || p.name,
      p.category,
      p.price,
      p.unit,
      p.stock,
      p.isAvailable && p.stock > 0 ? 'Active' : p.stock === 0 ? 'Out of Stock' : 'Inactive',
      new Date(p.createdAt || '').toLocaleDateString(),
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    try {
      await Share.share({
        message: csvContent,
        title: 'Products Export',
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Clear search and filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || filter !== 'all' || sortBy !== 'newest';

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    if (!item || !item.id) return null;
    
    const stockBadge = getStockBadge(item.stock);
    const isFirst = index === 0;
    const isLast = index === filteredProducts.length - 1;
    const isSelected = selectedProducts.includes(item.id);
    
    // Get all valid image URLs for the carousel
    const allImages = item.images?.filter((img: string) => img && typeof img === 'string') || [];
    const imageUri = getFirstValidImageUrl(item.images);
    const hasMultipleImages = allImages.length > 1;
    
    return (
      <TouchableOpacity 
        style={[
          styles.productListRow,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
          isFirst && styles.productListRowFirst,
          isLast && styles.productListRowLast,
          isSelected && styles.productListRowSelected,
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleProductSelection(item.id);
          } else {
            navigation.navigate('ProductDetail', { productId: item.id });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            setSelectedProducts([item.id]);
          }
        }}
        activeOpacity={0.7}
      >
        {/* Selection Checkbox */}
        {selectionMode && (
          <TouchableOpacity
            style={styles.listRowCheckbox}
            onPress={() => toggleProductSelection(item.id)}
          >
            <View style={[
              styles.listRowCheckboxCircle,
              isSelected && styles.listRowCheckboxSelected,
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {/* Thumbnail */}
        <View style={styles.listRowThumbnailContainer}>
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.listRowThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.listRowThumbnail, styles.listRowThumbnailPlaceholder]}>
              <Ionicons name="leaf" size={24} color="#34C759" />
            </View>
          )}
          {/* Image count badge */}
          {hasMultipleImages && (
            <View style={styles.listRowImageCount}>
              <Text style={styles.listRowImageCountText}>{allImages.length}</Text>
            </View>
          )}
        </View>
        
        {/* Content */}
        <View style={styles.listRowContent}>
          <View style={styles.listRowTop}>
            <View style={styles.listRowTitleRow}>
              <Text style={[styles.listRowTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title || item.name}
              </Text>
              {item.featured && (
                <View style={styles.listRowFeaturedBadge}>
                  <Ionicons name="star" size={10} color="#FFA000" />
                </View>
              )}
            </View>
            <Text style={[styles.listRowPrice, { color: colors.text }]}>
              {formatCurrency(Number(item.price))}
              <Text style={styles.listRowPriceUnit}>/{item.unit}</Text>
            </Text>
          </View>
          
          <View style={styles.listRowBottom}>
            <View style={styles.listRowMeta}>
              <View style={[styles.listRowCategoryBadge, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#E8F5E9' }]}>
                <Text style={styles.listRowCategoryText}>{item.category}</Text>
              </View>
              <View style={[styles.listRowStockBadge, { backgroundColor: stockBadge.bgColor }]}>
                <View style={[styles.listRowStockDot, { backgroundColor: stockBadge.color }]} />
                <Text style={[styles.listRowStockText, { color: stockBadge.color }]}>
                  {item.stock}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.listRowActions}>
          <TouchableOpacity
            style={[styles.listRowActionBtn, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.12)' : '#EEF6FF' }]}
            onPress={() => handleQuickStockUpdate(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="cube-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.listRowActionBtn, { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.12)' : '#FFF1F0' }]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleDelete(item.id, item.title || item.name || 'Product');
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        
        {/* Chevron for navigation hint */}
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={colors.textSecondary} 
          style={styles.listRowChevron}
        />
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {/* Search and Sort Bar */}
      <View style={styles.searchSortContainer}>
        <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color={filter !== 'all' ? '#34C759' : '#007AFF'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your product inventory
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={stat.label}
            style={[
              styles.statCard,
              { backgroundColor: isDark ? colors.card : '#FFFFFF' },
            ]}
            onPress={() => {
              if (stat.label === 'Active') setFilter('active');
              else if (stat.label === 'Low Stock') setFilter('low_stock');
              else if (stat.label === 'Out') setFilter('out_of_stock');
              else setFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Title with count */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {filter === 'all' ? 'ALL PRODUCTS' : filter.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </Text>
      </View>
    </>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.headerContent}>
          {isStackScreen && navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My Products
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Selection mode toggle */}
          <TouchableOpacity
            style={[styles.headerButton, selectionMode && styles.headerButtonActive]}
            onPress={() => {
              setSelectionMode(!selectionMode);
              setSelectedProducts([]);
            }}
          >
            <Ionicons 
              name={selectionMode ? "checkmark-done" : "checkbox-outline"} 
              size={20} 
              color={selectionMode ? "#FFFFFF" : "#007AFF"} 
            />
          </TouchableOpacity>
          {/* Export button */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleExportProducts}
          >
            <Ionicons name="download-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProduct')}
            activeOpacity={0.7}
          >
            <ProductPlusIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bulk Actions Bar */}
      {selectionMode && selectedProducts.length > 0 && (
        <View style={[styles.bulkActionsBar, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <Text style={[styles.bulkActionsText, { color: colors.text }]}>
            {selectedProducts.length} selected
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bulkActionsScroll}>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: '#E8F5E9' }]}
              onPress={() => handleBulkToggleAvailability(true)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={[styles.bulkActionText, { color: '#34C759' }]}>Available</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: '#FFF3E0' }]}
              onPress={() => handleBulkToggleAvailability(false)}
            >
              <Ionicons name="close-circle" size={16} color="#FF9500" />
              <Text style={[styles.bulkActionText, { color: '#FF9500' }]}>Unavailable</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: '#E3F2FD' }]}
              onPress={handleExportProducts}
            >
              <Ionicons name="download" size={16} color="#007AFF" />
              <Text style={[styles.bulkActionText, { color: '#007AFF' }]}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: '#FFEBEE' }]}
              onPress={handleBulkDelete}
            >
              <Ionicons name="trash" size={16} color="#FF3B30" />
              <Text style={[styles.bulkActionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => item?.id || `product-${index}`}
        renderItem={renderProduct}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.productsGrid,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
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
                    <Stop offset="0%" stopColor="#4CAF50" stopOpacity="0.15" />
                    <Stop offset="100%" stopColor="#81C784" stopOpacity="0.08" />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx="100" cy="100" r="90" fill="url(#emptyGrad)" />
                <Circle cx="100" cy="100" r="60" fill="url(#emptyGrad)" />
              </Svg>
            </View>
            <View style={[styles.emptyIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="cube" size={40} color="#4CAF50" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No products found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery 
                ? `No products matching "${searchQuery}"`
                : filter === 'all' 
                  ? "Start by adding your first product"
                  : `No ${filter.replace('_', ' ')} products`
              }
            </Text>
            {filter === 'all' && !searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddProduct')}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add Product</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Sort Modal - Enhanced iOS Style */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowSortModal(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Handle Bar */}
            <View style={styles.modalHandleBar} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Sort Products</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowSortModal(false)}
              >
                <View style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Options */}
            <View style={styles.modalOptionsContainer}>
              {SORT_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.modalOption,
                    sortBy === option.key && styles.modalOptionActive,
                    { backgroundColor: sortBy === option.key ? (isDark ? 'rgba(0, 122, 255, 0.15)' : '#E3F2FD') : 'transparent' },
                    index < SORT_OPTIONS.length - 1 && styles.modalOptionBorder,
                  ]}
                  onPress={() => {
                    setSortBy(option.key);
                    setShowSortModal(false);
                  }}
                >
                  <View style={[
                    styles.modalOptionIcon,
                    { backgroundColor: sortBy === option.key ? '#007AFF' : (isDark ? '#3A3A3C' : '#F2F2F7') }
                  ]}>
                    <Ionicons 
                      name={option.icon} 
                      size={18} 
                      color={sortBy === option.key ? '#FFFFFF' : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.modalOptionContent}>
                    <Text style={[
                      styles.modalOptionText,
                      { color: sortBy === option.key ? '#007AFF' : colors.text },
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {sortBy === option.key && (
                    <View style={styles.modalCheckCircle}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal - Enhanced iOS Style */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Handle Bar */}
            <View style={styles.modalHandleBar} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Products</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowFilterModal(false)}
              >
                <View style={[styles.modalCloseCircle, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Options */}
            <View style={styles.modalOptionsContainer}>
              {filterTabs.map((option, index) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.modalOption,
                    filter === option.key && styles.modalOptionActive,
                    { backgroundColor: filter === option.key ? (isDark ? 'rgba(52, 199, 89, 0.15)' : '#E8F5E9') : 'transparent' },
                    index < filterTabs.length - 1 && styles.modalOptionBorder,
                  ]}
                  onPress={() => {
                    setFilter(option.key);
                    setShowFilterModal(false);
                  }}
                >
                  <View style={[
                    styles.modalOptionIcon,
                    { backgroundColor: filter === option.key ? '#34C759' : (isDark ? '#3A3A3C' : '#F2F2F7') }
                  ]}>
                    <Ionicons 
                      name={option.icon} 
                      size={18} 
                      color={filter === option.key ? '#FFFFFF' : colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.modalOptionContent}>
                    <Text style={[
                      styles.modalOptionText,
                      { color: filter === option.key ? '#34C759' : colors.text },
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {filter === option.key && (
                    <View style={[styles.modalCheckCircle, { backgroundColor: '#34C759' }]}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Stock Update Modal - Bottom Sheet Style */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.stockModalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setStockModalVisible(false)}
          />
          <View 
            style={[styles.stockModalSheet, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
          >
            {/* Handle Bar */}
            <View style={styles.stockModalHandleBar} />
            
            {/* Header */}
            <View style={styles.stockModalHeader}>
              <View style={styles.stockModalHeaderLeft} />
              <View style={styles.stockModalHeaderCenter}>
                <View style={styles.stockModalIconCircle}>
                  <Ionicons name="cube" size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.stockModalTitle, { color: colors.text }]}>
                  Update Stock
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.stockModalCloseButton}
                onPress={() => setStockModalVisible(false)}
              >
                <View style={[styles.stockModalCloseCircle, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}>
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Product Name */}
            <View style={[styles.stockProductNameContainer, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#E8F5E9' }]}>
              <Ionicons name="leaf" size={16} color="#34C759" />
              <Text style={[styles.stockProductName, { color: colors.text }]} numberOfLines={1}>
                {selectedProductForStock?.title || selectedProductForStock?.name}
              </Text>
            </View>
            
            {/* Stock Input Section */}
            <View style={styles.stockInputSection}>
              <View style={styles.stockInputContainer}>
                <TouchableOpacity
                  style={[styles.stockAdjustButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                  onPress={() => {
                    const current = parseInt(newStockValue, 10) || 0;
                    if (current > 0) setNewStockValue((current - 1).toString());
                  }}
                >
                  <Ionicons name="remove" size={24} color="#FF3B30" />
                </TouchableOpacity>
                
                <View style={[styles.stockInputWrapper, { borderColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                  <TextInput
                    style={[styles.stockInput, { color: colors.text }]}
                    value={newStockValue}
                    onChangeText={setNewStockValue}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  <Text style={[styles.stockInputUnit, { color: colors.textSecondary }]}>units</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.stockAdjustButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                  onPress={() => {
                    const current = parseInt(newStockValue, 10) || 0;
                    setNewStockValue((current + 1).toString());
                  }}
                >
                  <Ionicons name="add" size={24} color="#34C759" />
                </TouchableOpacity>
              </View>
              
              {/* Quick Presets */}
              <Text style={[styles.quickPresetsLabel, { color: colors.textSecondary }]}>Quick presets</Text>
              <View style={styles.quickStockButtons}>
                {[10, 25, 50, 100].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickStockButton, 
                      { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' },
                      newStockValue === value.toString() && styles.quickStockButtonActive
                    ]}
                    onPress={() => setNewStockValue(value.toString())}
                  >
                    <Text style={[
                      styles.quickStockButtonText, 
                      { color: newStockValue === value.toString() ? '#FFFFFF' : colors.text }
                    ]}>{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Actions */}
            <View style={styles.stockModalActions}>
              <TouchableOpacity
                style={[styles.stockModalButton, styles.stockModalCancelButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                onPress={() => setStockModalVisible(false)}
              >
                <Text style={[styles.stockModalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stockModalButton, styles.stockModalConfirmButton]}
                onPress={confirmStockUpdate}
                disabled={updateStockMutation.isPending}
              >
                {updateStockMutation.isPending ? (
                  <Text style={styles.stockModalConfirmText}>Updating...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.stockModalConfirmText}>Update Stock</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonActive: {
    backgroundColor: '#007AFF',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  // Products Grid Layout
  productsGrid: {
    paddingHorizontal: SPACING.sm,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  searchSortContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: FONTS.regular,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 16,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  // Products Grid Layout
  productsGrid: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: 100,
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  // Compact List Row Styles
  productListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    marginHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  productListRowFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginTop: 4,
  },
  productListRowLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  productListRowSelected: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  listRowCheckbox: {
    marginRight: 8,
  },
  listRowCheckboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listRowCheckboxSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  listRowThumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  listRowThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  listRowThumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listRowImageCount: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  listRowImageCountText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  listRowContent: {
    flex: 1,
    marginRight: 8,
  },
  listRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listRowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  listRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  listRowFeaturedBadge: {
    marginLeft: 6,
    padding: 2,
  },
  listRowPrice: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  listRowPriceUnit: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    color: '#8E8E93',
  },
  listRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listRowCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listRowCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#34C759',
  },
  listRowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  listRowStockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  listRowStockText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  listRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
  },
  listRowActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listRowChevron: {
    opacity: 0.4,
  },
  // Enhanced Media Card Styles - Full Width List (Legacy)
  productMediaCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: SPACING.md,
  },
  productMediaCardSelected: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  productMediaImageSection: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  productMediaImage: {
    width: '100%',
    height: '100%',
  },
  productMediaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productMediaGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  mediaSelectionCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  mediaCheckboxCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaCheckboxCircleSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  mediaFeaturedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaFeaturedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  mediaFeaturedText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  mediaStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  mediaStockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mediaStockText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  mediaImageCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mediaImageCountText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  mediaPriceOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(52, 199, 89, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  mediaPriceText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  mediaPriceUnit: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  productMediaContent: {
    padding: SPACING.sm,
  },
  productMediaHeader: {
    marginBottom: 6,
  },
  productMediaName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    lineHeight: 18,
  },
  productMediaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mediaCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  mediaCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#34C759',
  },
  productMediaActions: {
    flexDirection: 'row',
    gap: 6,
  },
  mediaActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  mediaActionButtonMore: {
    flex: 0,
    width: 36,
  },
  mediaActionText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  // Legacy styles for compatibility
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productCardFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  productCardLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  productCardSelected: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  selectionCheckbox: {
    paddingRight: 8,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxCircleSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  stockIndicatorDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  productContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: SPACING.md,
    marginLeft: SPACING.md,
  },
  productBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.1)',
  },
  productInfo: {
    flex: 1,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  featuredBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    color: '#34C759',
  },
  productUnit: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  productCategory: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#34C759',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  productActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDuplicate: {
    backgroundColor: '#E3F2FD',
  },
  actionButtonEdit: {
    backgroundColor: '#E8F5E9',
  },
  actionButtonDelete: {
    backgroundColor: '#FFEBEE',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  bulkActionsText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginRight: 12,
  },
  bulkActionsScroll: {
    flexGrow: 0,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 4,
  },
  bulkActionText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  emptyBackground: {
    position: 'absolute',
    opacity: 0.8,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHandleBar: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  modalHeaderLeft: {
    width: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    alignItems: 'flex-end',
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionsContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalOptionActive: {
    // Background set dynamically
  },
  modalOptionBorder: {
    // No border needed with new design
  },
  modalOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  modalCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stock Modal Bottom Sheet Styles
  stockModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  stockModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  stockModalHandleBar: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  stockModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  stockModalHeaderLeft: {
    width: 36,
  },
  stockModalHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stockModalCloseButton: {
    padding: 4,
  },
  stockModalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockProductNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  stockProductName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  stockModalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  stockInputSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  stockInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: SPACING.md,
  },
  stockAdjustButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockInputWrapper: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  stockInput: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    minWidth: 80,
  },
  stockInputUnit: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: -4,
  },
  quickPresetsLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickStockButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  quickStockButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  quickStockButtonActive: {
    backgroundColor: '#34C759',
  },
  quickStockButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  stockModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  stockModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 6,
  },
  stockModalCancelButton: {
    // Background set dynamically
  },
  stockModalConfirmButton: {
    backgroundColor: '#34C759',
  },
  stockModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  stockModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  // Legacy styles kept for compatibility
  sortModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  filterModalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(60, 60, 67, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  filterOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: '#E3F2FD',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
});
