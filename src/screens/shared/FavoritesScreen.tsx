import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchFavorites,
  removeFavorite,
  clearAllFavorites,
  selectFavorites,
  selectFavoritesLoading,
} from '../../store/slices/favoritesSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { useTheme } from '../../context/ThemeContext';
import { Product } from '../../types';
import { formatCurrency, getFirstValidImageUrl } from '../../utils/formatters';

const { width } = Dimensions.get('window');

// Skeleton loading component
const SkeletonItem: React.FC = () => {
  const { colors: theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyle = {
    backgroundColor: theme.border,
  };

  return (
    <View style={[styles.skeletonCard, { backgroundColor: theme.card }]}>
      <Animated.View
        style={[styles.skeletonImage, skeletonStyle, { opacity }]}
      />
      <View style={styles.skeletonContent}>
        <Animated.View
          style={[styles.skeletonTitle, skeletonStyle, { opacity }]}
        />
        <Animated.View
          style={[styles.skeletonSubtitle, skeletonStyle, { opacity }]}
        />
        <View style={styles.skeletonRow}>
          <Animated.View
            style={[styles.skeletonPrice, skeletonStyle, { opacity }]}
          />
          <Animated.View
            style={[styles.skeletonButton, skeletonStyle, { opacity }]}
          />
        </View>
      </View>
    </View>
  );
};

const FavoritesScreen: React.FC = () => {
  const { colors: theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const favorites = useAppSelector(selectFavorites);
  const loading = useAppSelector(selectFavoritesLoading);

  const [refreshing, setRefreshing] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Load favorites on mount
  const loadFavorites = useCallback(async () => {
    try {
      await dispatch(fetchFavorites({})).unwrap();
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setHasInitiallyLoaded(true);
    }
  }, [dispatch]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchFavorites({})).unwrap();
    } catch (error) {
      console.error('Failed to refresh favorites:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Memoized calculations
  const inStockCount = useMemo(() => {
    return favorites.filter((item) => item.stock > 0).length;
  }, [favorites]);

  const totalValue = useMemo(() => {
    const total = favorites.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      console.log(`[Favorites] Item: ${item.title}, Price: ${item.price}, Type: ${typeof item.price}, Parsed: ${price}`);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    console.log(`[Favorites] Total Value: ${total}`);
    return total;
  }, [favorites]);

  // Navigate to product details
  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', { productId: product.id });
    },
    [navigation]
  );

  // Remove from favorites with optimistic update
  const handleRemoveFavorite = useCallback(
    async (productId: string) => {
      setRemovingIds((prev) => new Set(prev).add(productId));
      try {
        await dispatch(removeFavorite(productId)).unwrap();
      } catch (error) {
        console.error('Failed to remove favorite:', error);
        Alert.alert(t('common.error'), t('favorites.failedRemove'));
      } finally {
        setRemovingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }
    },
    [dispatch]
  );

  // Clear all favorites
  const handleClearAll = useCallback(() => {
    if (favorites.length === 0) return;

    Alert.alert(
      t('favorites.clearAll'),
      t('favorites.clearAllConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('favorites.clearAllButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearAllFavorites()).unwrap();
            } catch (error) {
              console.error('Failed to clear favorites:', error);
              Alert.alert(t('common.error'), t('favorites.failedClear'));
            }
          },
        },
      ]
    );
  }, [dispatch, favorites.length, t]);

  // Add all to cart
  const handleAddAllToCart = useCallback(() => {
    const inStockItems = favorites.filter((item) => item.stock > 0);
    if (inStockItems.length === 0) {
      Alert.alert(t('favorites.noItems'), t('favorites.noInStockItems'));
      return;
    }

    Alert.alert(
      t('favorites.addAllToCart'),
      t('favorites.addAllConfirm', { count: inStockItems.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('favorites.addAll'),
          onPress: async () => {
            // Add each in-stock item to cart
            inStockItems.forEach((product) => {
              dispatch(addToCart({ product, quantity: 1 }));
            });
            
            // Clear all favorites after adding to cart
            try {
              await dispatch(clearAllFavorites()).unwrap();
              Alert.alert(
                t('common.success'), 
                t('favorites.successAddedItems', { count: inStockItems.length })
              );
            } catch (error) {
              Alert.alert(
                t('common.success'), 
                t('favorites.successAddedItems', { count: inStockItems.length })
              );
            }
          },
        },
      ]
    );
  }, [favorites, t, dispatch]);

  // Go back
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Start shopping
  const handleStartShopping = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  // Render favorite item
  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const isRemoving = removingIds.has(item.id);
      const isOutOfStock = item.stock <= 0;

      return (
        <TouchableOpacity
          style={[
            styles.favoriteCard,
            { backgroundColor: theme.card },
            isRemoving && styles.removingCard,
          ]}
          onPress={() => handleProductPress(item)}
          activeOpacity={0.7}
          disabled={isRemoving}
        >
          {/* Product Image */}
          <View style={[styles.imageContainer, { backgroundColor: theme.border }]}>
            {(() => {
              const imageUrl = getFirstValidImageUrl(item.images);
              return imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
              );
            })()}
            {isOutOfStock && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>{t('favorites.outOfStock')}</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text
              style={[styles.productTitle, { color: theme.text }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {item.farmerName && (
              <Text
                style={[styles.farmerName, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {t('favorites.by')} {item.farmerName}
              </Text>
            )}
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: theme.primary }]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.unit, { color: theme.textSecondary }]}>
                /{item.unit}
              </Text>
            </View>

            {/* Stock Status */}
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.stockBadge,
                  {
                    backgroundColor: isOutOfStock
                      ? theme.error + '20'
                      : theme.success + '20',
                  },
                ]}
              >
                <View
                  style={[
                    styles.stockDot,
                    {
                      backgroundColor: isOutOfStock ? theme.error : theme.success,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.stockText,
                    { color: isOutOfStock ? theme.error : theme.success },
                  ]}
                >
                  {isOutOfStock ? t('favorites.outOfStock') : t('favorites.inStockCount', { count: item.stock })}
                </Text>
              </View>
            </View>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.error + '15' }]}
            onPress={() => handleRemoveFavorite(item.id)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Animated.View style={styles.removingIndicator}>
                <Ionicons name="hourglass-outline" size={20} color={theme.error} />
              </Animated.View>
            ) : (
              <Ionicons name="heart-dislike" size={20} color={theme.error} />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [theme, handleProductPress, handleRemoveFavorite, removingIds]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Product, index: number) => item?.id || `fav-${index}`, []);

  // List header with summary
  const renderHeader = useCallback(() => {
    if (favorites.length === 0) return null;

    return (
      <View style={styles.headerContainer}>
        {/* Total Value Card - Media Card Style */}
        <View style={[styles.totalCard, { backgroundColor: theme.card }]}>
          <View style={[styles.totalIconContainer, { backgroundColor: theme.primary }]}>
            <Ionicons name="wallet" size={28} color="#fff" />
          </View>
          <View style={styles.totalContent}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{t('favorites.totalValue')}</Text>
            <Text 
              style={[styles.totalAmount, { color: theme.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {formatCurrency(totalValue)}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Items Card */}
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="heart" size={18} color={theme.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.text }]}>{favorites.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('favorites.items')}</Text>
            </View>
          </View>

          {/* In Stock Card */}
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={18} color={theme.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.text }]}>{inStockCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('favorites.inStock')}</Text>
            </View>
          </View>

          {/* Out of Stock Card */}
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: theme.error + '15' }]}>
              <Ionicons name="close-circle" size={18} color={theme.error} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: theme.text }]}>{favorites.length - inStockCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('favorites.out')}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.priceDropsButton, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}
            onPress={() => (navigation as any).navigate('PriceDrops')}
          >
            <Ionicons name="pricetag" size={16} color="#EF4444" />
            <Text style={[styles.priceDropsButtonText, { color: '#EF4444' }]}>Price Drops</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleAddAllToCart}
            disabled={inStockCount === 0}
          >
            <Ionicons name="cart" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>{t('favorites.addAllToCart')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: theme.error }]}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={18} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    favorites.length,
    inStockCount,
    totalValue,
    theme,
    handleAddAllToCart,
    handleClearAll,
  ]);

  // Empty state
  const renderEmptyState = useCallback(() => {
    if (!hasInitiallyLoaded) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="heart-outline" size={64} color={theme.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {t('favorites.empty')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          {t('favorites.emptyDescription')}
        </Text>
        <TouchableOpacity
          style={[styles.shopButton, { backgroundColor: theme.primary }]}
          onPress={handleStartShopping}
        >
          <Ionicons name="basket-outline" size={20} color="#fff" />
          <Text style={styles.shopButtonText}>{t('favorites.startShopping')}</Text>
        </TouchableOpacity>
      </View>
    );
  }, [hasInitiallyLoaded, theme, handleStartShopping, t]);

  // Render skeleton loading
  const renderSkeletonLoading = useCallback(() => {
    return (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3, 4].map((item) => (
          <SkeletonItem key={item} />
        ))}
      </View>
    );
  }, []);

  // Determine what to show
  const showSkeleton = loading && !hasInitiallyLoaded;
  const showEmpty = !loading && hasInitiallyLoaded && favorites.length === 0;
  const showList = hasInitiallyLoaded && favorites.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('favorites.myFavorites')}</Text>
        <View style={styles.headerRight}>
          {favorites.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.countText}>{favorites.length}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {showSkeleton && renderSkeletonLoading()}

      {showEmpty && renderEmptyState()}

      {showList && (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 16,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  totalContent: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  priceDropsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  priceDropsButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  removingCard: {
    opacity: 0.6,
  },
  imageContainer: {
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  farmerName: {
    fontSize: 12,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  unit: {
    fontSize: 12,
    marginLeft: 2,
  },
  stockRow: {
    marginTop: 6,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removingIndicator: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
  },
  skeletonImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  skeletonTitle: {
    height: 16,
    borderRadius: 4,
    width: '80%',
  },
  skeletonSubtitle: {
    height: 12,
    borderRadius: 4,
    width: '50%',
    marginTop: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  skeletonPrice: {
    height: 18,
    borderRadius: 4,
    width: 80,
  },
  skeletonButton: {
    height: 28,
    borderRadius: 4,
    width: 60,
  },
});

export default FavoritesScreen;
