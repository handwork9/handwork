import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BuyerStackParamList } from '../../types';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import apiClient from '../../services/apiClient';

type Props = NativeStackScreenProps<BuyerStackParamList, 'PriceDrops'>;

interface PriceDrop {
  product: {
    id: string;
    title: string;
    currentPrice: number;
    images: string[];
    farmerName: string;
  };
  priceChange: {
    oldPrice: number;
    newPrice: number;
    percentageOff: number;
    changedAt: string;
  };
}

export default function PriceDropsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [priceDrops, setPriceDrops] = useState<PriceDrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPriceDrops = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await apiClient.get('/price-alerts/drops?days=7');
      setPriceDrops((response as any).data.data || []);
    } catch (error) {
      console.error('Failed to fetch price drops:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPriceDrops();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPriceDrops(false);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderPriceDrop = ({ item }: { item: PriceDrop }) => {
    const savings = item.priceChange.oldPrice - item.priceChange.newPrice;
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.product.id })}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {item.product.images?.[0] ? (
            <Image
              source={{ uri: item.product.images[0] }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="leaf" size={32} color={colors.textSecondary} />
            </View>
          )}
          <View style={[styles.discountBadge, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.discountText}>-{Math.round(item.priceChange.percentageOff)}%</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {item.product.title}
          </Text>
          <Text style={[styles.farmer, { color: colors.textSecondary }]}>
            by {item.product.farmerName}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.newPrice, { color: colors.primary }]}>
              {formatCurrency(item.priceChange.newPrice)}
            </Text>
            <Text style={[styles.oldPrice, { color: colors.textSecondary }]}>
              {formatCurrency(item.priceChange.oldPrice)}
            </Text>
          </View>
          
          <View style={styles.savingsRow}>
            <View style={[styles.savingsBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7' }]}>
              <Ionicons name="arrow-down" size={12} color="#22C55E" />
              <Text style={styles.savingsText}>Save {formatCurrency(savings)}</Text>
            </View>
            <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
              {formatDate(item.priceChange.changedAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.surface : '#F3F4F6' }]}>
        <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Price Drops Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Add items to your favorites and we'll notify you when their prices drop!
      </Text>
      <TouchableOpacity
        style={[styles.browseCta, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('BuyerTabs')}
      >
        <Ionicons name="search" size={18} color="#FFFFFF" />
        <Text style={styles.browseCtaText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Price Drops</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {priceDrops.length} item{priceDrops.length !== 1 ? 's' : ''} on sale
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="flame" size={24} color="#EF4444" />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Finding price drops...
          </Text>
        </View>
      ) : (
        <FlatList
          data={priceDrops}
          renderItem={renderPriceDrop}
          keyExtractor={(item) => item.product.id}
          contentContainerStyle={[
            styles.list,
            priceDrops.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    lineHeight: 20,
  },
  farmer: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  newPrice: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  oldPrice: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textDecorationLine: 'line-through',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  savingsText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#22C55E',
  },
  timeAgo: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseCta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  browseCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
});
