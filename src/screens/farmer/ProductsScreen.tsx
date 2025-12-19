import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
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
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { products: reduxProducts } = useAppSelector(state => state.farmer);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all');
  
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

  const products = data?.products || [];
  
  // Filtered and sorted products with search
  const filteredProducts = useMemo(() => {
    let result = products.filter((product: Product) => {
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
    const stockBadge = getStockBadge(item.stock);
    const isFirst = index === 0;
    const isLast = index === filteredProducts.length - 1;
    const isSelected = selectedProducts.includes(item.id);
    
    // Use helper to fix image URL for current host
    const imageUri = getFirstValidImageUrl(item.images);
    
    return (
      <TouchableOpacity 
        style={[
          styles.productCard,
          { backgroundColor: isDark ? colors.card : '#FFFFFF' },
          isFirst && styles.productCardFirst,
          isLast && styles.productCardLast,
          isSelected && styles.productCardSelected,
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleProductSelection(item.id);
          } else {
            navigation.navigate('EditProduct', { productId: item.id });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            setSelectedProducts([item.id]);
          }
        }}
        activeOpacity={0.6}
      >
        {/* Selection checkbox */}
        {selectionMode && (
          <TouchableOpacity
            style={styles.selectionCheckbox}
            onPress={() => toggleProductSelection(item.id)}
          >
            <View style={[
              styles.checkboxCircle,
              isSelected && styles.checkboxCircleSelected,
            ]}>
              {isSelected && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        )}
        
        {imageUri ? (
          <Image 
            source={{ uri: imageUri }} 
            style={styles.productImage}
          />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#8E8E93" />
          </View>
        )}
        <View style={[
          styles.productContent,
          !isLast && styles.productBorder,
        ]}>
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
              {item.title || item.name}
            </Text>
            <Text style={[styles.productCategory, { color: colors.textSecondary }]}>
              {item.category}
            </Text>
            <View style={styles.productMeta}>
              <Text style={styles.productPrice}>
                {formatCurrency(Number(item.price))}/{item.unit}
              </Text>
              <TouchableOpacity
                style={[styles.stockBadge, { backgroundColor: stockBadge.bgColor }]}
                onPress={() => handleQuickStockUpdate(item)}
              >
                <Text style={[styles.stockText, { color: stockBadge.color }]}>
                  {stockBadge.label}
                </Text>
                <Ionicons name="pencil" size={10} color={stockBadge.color} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.productActions}>
            {/* Duplicate button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
              onPress={() => handleDuplicateProduct(item)}
            >
              <Ionicons name="copy-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
              onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
            >
              <Ionicons name="create-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFEBEE' }]}
              onPress={(e) => {
                e.stopPropagation?.();
                handleDelete(item.id, item.title || item.name || 'Product');
              }}
            >
              <Ionicons name="trash" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
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
            <Ionicons name="add" size={22} color="#FFFFFF" />
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
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}>
              <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
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

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.sortModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.filterModalHandle} />
            <View style={styles.sortModalHeader}>
              <Text style={[styles.sortModalTitle, { color: colors.text }]}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortModal(false);
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={sortBy === option.key ? '#007AFF' : colors.textSecondary} 
                />
                <Text style={[
                  styles.sortOptionText,
                  { color: sortBy === option.key ? '#007AFF' : colors.text },
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal - Bottom Sheet */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={[styles.sortModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.filterModalHandle} />
            <View style={styles.sortModalHeader}>
              <Text style={[styles.sortModalTitle, { color: colors.text }]}>Filter Products</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {filterTabs.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  filter === option.key && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setFilter(option.key);
                  setShowFilterModal(false);
                }}
              >
                <View style={[
                  styles.filterOptionIcon,
                  { backgroundColor: filter === option.key ? '#34C75920' : isDark ? '#3A3A3C' : '#F2F2F7' }
                ]}>
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={filter === option.key ? '#34C759' : colors.textSecondary} 
                  />
                </View>
                <Text style={[
                  styles.sortOptionText,
                  { color: filter === option.key ? '#34C759' : colors.text },
                ]}>
                  {option.label}
                </Text>
                {filter === option.key && (
                  <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Quick Stock Update Modal */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStockModalVisible(false)}
        >
          <View 
            style={[styles.stockModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.stockModalTitle, { color: colors.text }]}>
              Update Stock
            </Text>
            <Text style={[styles.stockModalSubtitle, { color: colors.textSecondary }]}>
              {selectedProductForStock?.title || selectedProductForStock?.name}
            </Text>
            
            <View style={styles.stockInputContainer}>
              <TouchableOpacity
                style={[styles.stockAdjustButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                onPress={() => {
                  const current = parseInt(newStockValue, 10) || 0;
                  if (current > 0) setNewStockValue((current - 1).toString());
                }}
              >
                <Ionicons name="remove" size={24} color={colors.text} />
              </TouchableOpacity>
              
              <TextInput
                style={[styles.stockInput, { color: colors.text, borderColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}
                value={newStockValue}
                onChangeText={setNewStockValue}
                keyboardType="numeric"
                textAlign="center"
              />
              
              <TouchableOpacity
                style={[styles.stockAdjustButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                onPress={() => {
                  const current = parseInt(newStockValue, 10) || 0;
                  setNewStockValue((current + 1).toString());
                }}
              >
                <Ionicons name="add" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.quickStockButtons}>
              {[10, 25, 50, 100].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.quickStockButton, { backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7' }]}
                  onPress={() => setNewStockValue(value.toString())}
                >
                  <Text style={[styles.quickStockButtonText, { color: colors.text }]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.stockModalActions}>
              <TouchableOpacity
                style={[styles.stockModalButton, styles.stockModalCancelButton]}
                onPress={() => setStockModalVisible(false)}
              >
                <Text style={styles.stockModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stockModalButton, styles.stockModalConfirmButton]}
                onPress={confirmStockUpdate}
                disabled={updateStockMutation.isPending}
              >
                <Text style={styles.stockModalConfirmText}>
                  {updateStockMutation.isPending ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
  },
  productCardFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productCardLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  productCardSelected: {
    backgroundColor: '#E3F2FD',
  },
  selectionCheckbox: {
    paddingRight: 8,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: SPACING.md,
    marginLeft: SPACING.md,
  },
  productBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#34C759',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 12,
    marginTop: SPACING.md,
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
  // Sort Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
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
  // Stock Modal Styles
  stockModalContent: {
    margin: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  stockModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  stockModalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  stockInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  stockAdjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockInput: {
    width: 100,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  quickStockButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  quickStockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickStockButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  stockModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  stockModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  stockModalCancelButton: {
    backgroundColor: '#F2F2F7',
  },
  stockModalConfirmButton: {
    backgroundColor: '#34C759',
  },
  stockModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#8E8E93',
  },
  stockModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
