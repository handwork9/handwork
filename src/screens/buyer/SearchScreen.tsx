import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from '../../hooks/useDebounce';
import { BuyerStackParamList, Product } from '../../types';
import { ProductCard, LoadingSpinner, EmptyState } from '../../components/common';
import { productService } from '../../services/productService';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../constants/theme';

type NavigationProp = NativeStackNavigationProp<BuyerStackParamList>;
type SearchRouteProp = RouteProp<BuyerStackParamList, 'Search'>;

type QuickFilterId = 'popular' | 'organic' | 'deals' | 'top_rated' | 'new';

const QUICK_FILTERS: { id: QuickFilterId; label: string; icon: 'flame' | 'leaf' | 'pricetag' | 'star' | 'time'; color: string }[] = [
  { id: 'popular', label: 'Popular', icon: 'flame', color: '#FF6B35' },
  { id: 'organic', label: 'Organic', icon: 'leaf', color: '#34C759' },
  { id: 'deals', label: 'Deals', icon: 'pricetag', color: '#AF52DE' },
  { id: 'top_rated', label: 'Top Rated', icon: 'star', color: '#FF9500' },
  { id: 'new', label: 'New', icon: 'time', color: '#FF2D55' },
];

const RECENT_SEARCHES = ['Tomatoes', 'Fresh Eggs', 'Organic Honey', 'Local Fruits'];

const POPULAR_CATEGORIES = [
  { id: 'vegetables', name: 'Vegetables', icon: 'leaf' as const, color: '#34C759' },
  { id: 'fruits', name: 'Fruits', icon: 'nutrition' as const, color: '#FF9500' },
  { id: 'dairy', name: 'Dairy', icon: 'water' as const, color: '#007AFF' },
  { id: 'meat', name: 'Meat', icon: 'flame' as const, color: '#FF3B30' },
];

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SearchRouteProp>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilterId | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(route.params?.category || null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(route.params?.subcategory || null);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(route.params?.verifiedOnly || false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (route.params?.category) {
      setCategoryFilter(route.params.category);
    }
    if (route.params?.subcategory) {
      setSubcategoryFilter(route.params.subcategory);
    }
    if (route.params?.verifiedOnly !== undefined) {
      setVerifiedOnly(route.params.verifiedOnly);
    }
  }, [route.params?.category, route.params?.subcategory, route.params?.verifiedOnly]);

  // For verified sellers, use the dedicated endpoint
  const {
    data: verifiedResults,
    isLoading: isLoadingVerified,
    isFetching: isFetchingVerified,
  } = useQuery({
    queryKey: ['verified-sellers', debouncedQuery],
    queryFn: () => productService.getVerifiedSellerProducts(undefined, 50),
    enabled: verifiedOnly,
    staleTime: 60 * 1000,
  });

  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['search', debouncedQuery, activeFilter, categoryFilter, subcategoryFilter],
    queryFn: () =>
      productService.getProducts({
        searchQuery: debouncedQuery || undefined,
        filter: activeFilter || undefined,
        category: categoryFilter || undefined,
        // Note: subcategory filtering is shown in UI badge but we filter by category only
        // since most products don't have subcategories set in the database yet
        // subcategory: subcategoryFilter || undefined,
      }),
    enabled: !verifiedOnly && (debouncedQuery.length >= 2 || !!activeFilter || !!categoryFilter || !!subcategoryFilter),
    staleTime: 60 * 1000,
  });

  // Use verified results if verifiedOnly is true, otherwise use search results
  const products = verifiedOnly 
    ? (verifiedResults?.products || []).filter(p => 
        !debouncedQuery || (p.name?.toLowerCase() || '').includes(debouncedQuery.toLowerCase())
      )
    : (searchResults?.products || []);
  
  const isLoadingProducts = verifiedOnly ? isLoadingVerified : isLoading;
  const isFetchingProducts = verifiedOnly ? isFetchingVerified : isFetching;

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  }, [navigation]);

  const handleFilterPress = (filterId: QuickFilterId) => {
    setActiveFilter(activeFilter === filterId ? null : filterId);
  };

  const clearCategoryFilter = () => {
    setCategoryFilter(null);
    setSubcategoryFilter(null);
  };

  const clearSubcategoryFilter = () => {
    setSubcategoryFilter(null);
  };

  const getCategoryDisplayName = (categoryId: string) => {
    const names: Record<string, string> = {
      vegetables: 'Vegetables',
      fruits: 'Fruits',
      grains: 'Grains',
      dairy: 'Dairy',
      eggs: 'Eggs',
      meat: 'Meat',
      poultry: 'Poultry',
      seafood: 'Seafood',
      herbs_spices: 'Herbs & Spices',
      honey: 'Honey',
      nuts: 'Nuts',
      tubers: 'Tubers',
      oils: 'Oils',
      legumes: 'Legumes',
      processed: 'Processed',
      livestock: 'Livestock',
      seeds: 'Seeds',
      beverages: 'Beverages',
      others: 'Others',
    };
    return names[categoryId] || categoryId;
  };

  const getSubcategoryDisplayName = (subcategoryId: string) => {
    // Convert kebab-case to Title Case
    return subcategoryId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryPress = (categoryId: string) => {
    setCategoryFilter(categoryId);
  };

  // For grid layouts, we use 'default' variant which adapts to container width
  // The category-specific variants have fixed widths designed for horizontal scrolling
  const getGridVariant = () => 'default' as const;

  const showResults = debouncedQuery.length >= 2 || !!activeFilter || !!categoryFilter || !!subcategoryFilter;

  const renderEmptyState = () => (
    <ScrollView 
      style={styles.emptyContent} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.emptyScrollContent}
    >
      {/* Recent Searches */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RECENT SEARCHES</Text>
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        {RECENT_SEARCHES.map((search, index) => {
          const isLast = index === RECENT_SEARCHES.length - 1;
          return (
            <TouchableOpacity 
              key={search}
              style={styles.recentRow}
              onPress={() => handleRecentSearch(search)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.recentText, { color: colors.text }]}>{search}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.textSecondary} />
              {!isLast && (
                <View 
                  style={[
                    styles.separator, 
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }
                  ]} 
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Popular Categories */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>POPULAR CATEGORIES</Text>
      <View style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        {POPULAR_CATEGORIES.map((category, index) => {
          const isLast = index === POPULAR_CATEGORIES.length - 1;
          return (
            <TouchableOpacity 
              key={category.id}
              style={styles.categoryRow}
              onPress={() => handleCategoryPress(category.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                <Ionicons name={category.icon} size={20} color={category.color} />
              </View>
              <Text style={[styles.categoryText, { color: colors.text }]}>{category.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              {!isLast && (
                <View 
                  style={[
                    styles.separator, 
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }
                  ]} 
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Suggestion */}
      <View style={[styles.suggestionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={[styles.suggestionIcon, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
          <Ionicons name="bulb-outline" size={24} color="#007AFF" />
        </View>
        <View style={styles.suggestionContent}>
          <Text style={[styles.suggestionTitle, { color: colors.text }]}>Search Tips</Text>
          <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
            Try searching for "organic vegetables" or "fresh eggs near me"
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={[styles.searchBar, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search fresh produce..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category & Subcategory Filter Badges */}
        {(categoryFilter || subcategoryFilter || verifiedOnly) && (
          <View style={styles.filterBadgeRow}>
            {verifiedOnly && (
              <View style={[styles.filterBadge, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.filterBadgeText}>Verified Sellers</Text>
                <TouchableOpacity onPress={() => setVerifiedOnly(false)}>
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            {categoryFilter && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary, marginLeft: verifiedOnly ? 8 : 0 }]}>
                <Text style={styles.filterBadgeText}>{getCategoryDisplayName(categoryFilter)}</Text>
                <TouchableOpacity onPress={clearCategoryFilter}>
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            {subcategoryFilter && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primaryLight || '#6366F1', marginLeft: 8 }]}>
                <Text style={styles.filterBadgeText}>{getSubcategoryDisplayName(subcategoryFilter)}</Text>
                <TouchableOpacity onPress={clearSubcategoryFilter}>
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {!showResults && !verifiedOnly ? (
        renderEmptyState()
      ) : isLoadingProducts || isFetchingProducts ? (
        <LoadingSpinner message={verifiedOnly ? "Loading verified sellers..." : "Searching..."} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.resultsContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            products.length > 0 ? (
              <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                {products.length} result{products.length !== 1 ? 's' : ''}
                {debouncedQuery ? ` for "${debouncedQuery}"` : ''}
                {categoryFilter ? ` in ${getCategoryDisplayName(categoryFilter)}` : ''}
                {verifiedOnly ? ' from verified sellers' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeFilter 
                  ? `No ${QUICK_FILTERS.find(f => f.id === activeFilter)?.label.toLowerCase()} products found.`
                  : `We couldn't find any products matching "${debouncedQuery}".`
                }
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.productWrapper}>
              <ProductCard
                product={item}
                onPress={handleProductPress}
                variant={getGridVariant()}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
  },
  filterBadgeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterBadgeText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  emptyContent: {
    flex: 1,
  },
  emptyScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    position: 'relative',
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    position: 'relative',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 56,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  suggestionCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  resultsContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 12,
    marginLeft: 4,
  },
  productWrapper: {
    width: '48%',
  },
  emptyResults: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});
