import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BuyerStackParamList, BuyerTabParamList, Product } from '../../types';
import { ProductCard, LoadingSpinner, EmptyState, Button } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { productService } from '../../services/productService';
import { notificationService } from '../../services/notificationService';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchFavoriteIds } from '../../store/slices/favoritesSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { useLocation } from '../../hooks/useLocation';
import { PRODUCT_CATEGORIES } from '../../constants/config';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic, triggerSelectionHaptic, triggerSuccessHaptic } from '../../utils/haptics';
import { getFirstValidImageUrl } from '../../utils/formatters';
// Category illustrations
import VegetablesIllustration from '../../assets/illustrations/categories/VegetablesIllustration';
import FruitsIllustration from '../../assets/illustrations/categories/FruitsIllustration';
import GrainsIllustration from '../../assets/illustrations/categories/GrainsIllustration';
import DairyIllustration from '../../assets/illustrations/categories/DairyIllustration';
import EggsIllustration from '../../assets/illustrations/categories/EggsIllustration';
import MeatIllustration from '../../assets/illustrations/categories/MeatIllustration';
import PoultryIllustration from '../../assets/illustrations/categories/PoultryIllustration';
import SeafoodIllustration from '../../assets/illustrations/categories/SeafoodIllustration';
import HerbsSpicesIllustration from '../../assets/illustrations/categories/HerbsSpicesIllustration';
import HoneyIllustration from '../../assets/illustrations/categories/HoneyIllustration';
import NutsSeedsIllustration from '../../assets/illustrations/categories/NutsSeedsIllustration';
import TubersIllustration from '../../assets/illustrations/categories/TubersIllustration';
import OilsIllustration from '../../assets/illustrations/categories/OilsIllustration';
import LegumesIllustration from '../../assets/illustrations/categories/LegumesIllustration';
import LivestockIllustration from '../../assets/illustrations/categories/LivestockIllustration';
import BeveragesIllustration from '../../assets/illustrations/categories/BeveragesIllustration';
import OthersIllustration from '../../assets/illustrations/categories/OthersIllustration';
import SeeAllIllustration from '../../assets/illustrations/categories/SeeAllIllustration';
import ProcessedIllustration from '../../assets/illustrations/categories/ProcessedIllustration';
import SeedsIllustration from '../../assets/illustrations/categories/SeedsIllustration';
import { FarmerActivationIllustration, GoPremiumIllustration, VerifiedSellerIllustration, LiveSupportIllustration } from '../../assets/illustrations/hero';
import LiveSupportBanner from '../../components/common/LiveSupportBanner';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BuyerTabParamList, 'Home'>,
  NativeStackNavigationProp<BuyerStackParamList>
>;

const { width } = Dimensions.get('window');

// Category illustration mapping
const CATEGORY_ILLUSTRATIONS: { [key: string]: React.FC<{ width?: number; height?: number; color?: string }> } = {
  vegetables: VegetablesIllustration,
  fruits: FruitsIllustration,
  grains: GrainsIllustration,
  dairy: DairyIllustration,
  eggs: EggsIllustration,
  meat: MeatIllustration,
  poultry: PoultryIllustration,
  seafood: SeafoodIllustration,
  herbs: HerbsSpicesIllustration,
  herbs_spices: HerbsSpicesIllustration,
  honey: HoneyIllustration,
  nuts: NutsSeedsIllustration,
  tubers: TubersIllustration,
  oils: OilsIllustration,
  legumes: LegumesIllustration,
  processed: ProcessedIllustration,
  livestock: LivestockIllustration,
  seeds: SeedsIllustration,
  beverages: BeveragesIllustration,
  others: OthersIllustration,
  other: OthersIllustration,
  'see all': SeeAllIllustration,
};

const CATEGORY_ICONS: { [key: string]: { icon: string; iconType?: 'ionicons' | 'material'; color: string; bg: string; gradient: [string, string] } } = {
  vegetables: { icon: 'sprout', iconType: 'material', color: '#6B9B7A', bg: '#F2F7F4', gradient: ['#7BA085', '#6B9B7A'] },
  fruits: { icon: 'fruit-cherries', iconType: 'material', color: '#C9A86A', bg: '#FAF7F2', gradient: ['#D4B07A', '#C9A86A'] },
  grains: { icon: 'barley', iconType: 'material', color: '#8E9A9A', bg: '#F5F7F7', gradient: ['#9AABAB', '#8E9A9A'] },
  dairy: { icon: 'cup', iconType: 'material', color: '#6A9BC4', bg: '#F2F6FA', gradient: ['#7AABC4', '#6A9BC4'] },
  eggs: { icon: 'egg', iconType: 'material', color: '#C9B86A', bg: '#FAF8F2', gradient: ['#D4C47A', '#C9B86A'] },
  meat: { icon: 'food-steak', iconType: 'material', color: '#C4736A', bg: '#FAF5F4', gradient: ['#D4837A', '#C4736A'] },
  poultry: { icon: 'turkey', iconType: 'material', color: '#C48A9A', bg: '#FAF5F7', gradient: ['#D49AAA', '#C48A9A'] },
  seafood: { icon: 'fish', iconType: 'material', color: '#7AB4C4', bg: '#F2F8FA', gradient: ['#8AC4D4', '#7AB4C4'] },
  herbs: { icon: 'chili-mild', iconType: 'material', color: '#7A9B6B', bg: '#F4F7F2', gradient: ['#8AAB7B', '#7A9B6B'] },
  herbs_spices: { icon: 'chili-mild', iconType: 'material', color: '#6AAAB4', bg: '#F2F8F9', gradient: ['#7ABAC4', '#6AAAB4'] },
  'see all': { icon: 'apps', color: '#9A8AC4', bg: '#F7F5FA', gradient: ['#AAA0D4', '#9A8AC4'] },
  honey: { icon: 'beehive-outline', iconType: 'material', color: '#C9A86A', bg: '#FAF8F2', gradient: ['#D4B87A', '#C9A86A'] },
  nuts: { icon: 'peanut', iconType: 'material', color: '#9A7A6A', bg: '#F7F4F2', gradient: ['#AA8A7A', '#9A7A6A'] },
  tubers: { icon: 'carrot', iconType: 'material', color: '#B4906A', bg: '#F9F6F2', gradient: ['#C4A07A', '#B4906A'] },
  oils: { icon: 'oil', iconType: 'material', color: '#C4A86A', bg: '#FAF8F2', gradient: ['#D4B87A', '#C4A86A'] },
  legumes: { icon: 'seed', iconType: 'material', color: '#9A8A7A', bg: '#F7F5F4', gradient: ['#AA9A8A', '#9A8A7A'] },
  processed: { icon: 'food-variant', iconType: 'material', color: '#B4956A', bg: '#F9F6F2', gradient: ['#C4A57A', '#B4956A'] },
  livestock: { icon: 'cow', iconType: 'material', color: '#9A7A6A', bg: '#F7F4F2', gradient: ['#AA8A7A', '#9A7A6A'] },
  seeds: { icon: 'seed-outline', iconType: 'material', color: '#7A9A6B', bg: '#F4F7F2', gradient: ['#8AAA7B', '#7A9A6B'] },
  beverages: { icon: 'cup-water', iconType: 'material', color: '#A47A7A', bg: '#F9F5F5', gradient: ['#B48A8A', '#A47A7A'] },
  others: { icon: 'package-variant', iconType: 'material', color: '#9A9AA4', bg: '#F7F7F8', gradient: ['#AAAAB4', '#9A9AA4'] },
  other: { icon: 'package-variant', iconType: 'material', color: '#9A9AA4', bg: '#F7F7F8', gradient: ['#AAAAB4', '#9A9AA4'] },
};

// Promo banner data
const PROMO_BANNERS = [
  {
    id: 'farmer',
    title: 'Become a Farmer',
    subtitle: 'Start selling your produce today',
    route: 'BecomeFarmerInfo',
    illustration: FarmerActivationIllustration,
    bgLight: '#66BB6A',
    bgDark: '#388E3C',
  },
  {
    id: 'premium',
    title: 'Go Premium',
    subtitle: 'Get free delivery & exclusive deals',
    route: 'GoPremiumLearnMore',
    illustration: GoPremiumIllustration,
    bgLight: '#FFA726',
    bgDark: '#F57C00',
  },
  {
    id: 'verified',
    title: 'Shop Verified Sellers',
    subtitle: 'Quality guaranteed fresh produce',
    route: 'VerifiedSellersLearnMore',
    illustration: VerifiedSellerIllustration,
    bgLight: '#42A5F5',
    bgDark: '#1976D2',
  },
  {
    id: 'livesupport',
    title: 'Live Support',
    subtitle: 'Get instant help from our team',
    route: 'LiveChat',
    illustration: LiveSupportIllustration,
    bgLight: '#3B82F6',
    bgDark: '#1E40AF',
  },
] as const;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { itemCount } = useAppSelector((state) => state.cart);
  const defaultAddress = useAppSelector((state) => state.address.addresses.find(a => a.isDefault));
  const { location } = useLocation();
  const { colors, isDark, accessibility, getAnimationDuration } = useTheme();
  const { t } = useTranslation();
  
  // Get user's state from default address or user profile
  const userState = defaultAddress?.state || user?.state;
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [promoClaimed, setPromoClaimed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fetch favorite IDs on component mount
  useEffect(() => {
    dispatch(fetchFavoriteIds());
  }, [dispatch]);

  const getSelectedAddressText = () => {
    if (defaultAddress) {
      const parts = [
        defaultAddress.addressLine1,
        defaultAddress.addressLine2,
        defaultAddress.city,
        defaultAddress.state,
        defaultAddress.postalCode,
      ].filter(Boolean);
      return parts.join(', ');
    }
    return user?.city || t('home.selectLocation');
  };

  useEffect(() => {
    // Pulse animation for notification dot (skip if reduced motion)
    if (accessibility.reducedMotion) return;
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: getAnimationDuration(800),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: getAnimationDuration(800),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [accessibility.reducedMotion]);

  // Rotate promo banner every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };
    fetchUnreadCount();
    // Refetch on focus
    const unsubscribe = navigation.addListener('focus', fetchUnreadCount);
    return unsubscribe;
  }, [navigation]);

  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['products', selectedCategory, userState],
    queryFn: () =>
      productService.getProducts({
        category: selectedCategory?.toLowerCase() || undefined,
        state: userState,
        lat: location?.latitude,
        lng: location?.longitude,
        limit: 20,
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch products for different category sections - DISABLED FOR PERFORMANCE TESTING
  const { data: vegetablesData } = useQuery({
    queryKey: ['products', 'vegetables', userState],
    queryFn: () => productService.getProducts({ category: 'vegetables', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: fruitsData } = useQuery({
    queryKey: ['products', 'fruits', userState],
    queryFn: () => productService.getProducts({ category: 'fruits', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: grainsData } = useQuery({
    queryKey: ['products', 'grains', userState],
    queryFn: () => productService.getProducts({ category: 'grains', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: dairyData } = useQuery({
    queryKey: ['products', 'dairy', userState],
    queryFn: () => productService.getProducts({ category: 'dairy', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: meatData } = useQuery({
    queryKey: ['products', 'meat', userState],
    queryFn: () => productService.getProducts({ category: 'meat', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: seafoodData } = useQuery({
    queryKey: ['products', 'seafood', userState],
    queryFn: () => productService.getProducts({ category: 'seafood', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  // Additional category queries
  const { data: eggsData } = useQuery({
    queryKey: ['products', 'eggs', userState],
    queryFn: () => productService.getProducts({ category: 'eggs', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: poultryData } = useQuery({
    queryKey: ['products', 'poultry', userState],
    queryFn: () => productService.getProducts({ category: 'poultry', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: herbsData } = useQuery({
    queryKey: ['products', 'herbs_spices', userState],
    queryFn: () => productService.getProducts({ category: 'herbs_spices', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: honeyData } = useQuery({
    queryKey: ['products', 'honey', userState],
    queryFn: () => productService.getProducts({ category: 'honey', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: nutsData } = useQuery({
    queryKey: ['products', 'nuts', userState],
    queryFn: () => productService.getProducts({ category: 'nuts', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: tubersData } = useQuery({
    queryKey: ['products', 'tubers', userState],
    queryFn: () => productService.getProducts({ category: 'tubers', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: oilsData } = useQuery({
    queryKey: ['products', 'oils', userState],
    queryFn: () => productService.getProducts({ category: 'oils', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: legumesData } = useQuery({
    queryKey: ['products', 'legumes', userState],
    queryFn: () => productService.getProducts({ category: 'legumes', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: processedData } = useQuery({
    queryKey: ['products', 'processed', userState],
    queryFn: () => productService.getProducts({ category: 'processed', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: livestockData } = useQuery({
    queryKey: ['products', 'livestock', userState],
    queryFn: () => productService.getProducts({ category: 'livestock', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: seedsData } = useQuery({
    queryKey: ['products', 'seeds', userState],
    queryFn: () => productService.getProducts({ category: 'seeds', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: beveragesData } = useQuery({
    queryKey: ['products', 'beverages', userState],
    queryFn: () => productService.getProducts({ category: 'beverages', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: othersData } = useQuery({
    queryKey: ['products', 'others', userState],
    queryFn: () => productService.getProducts({ category: 'others', state: userState, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch promoted products - filter by state to show local promoted products
  const { data: promotedData } = useQuery({
    queryKey: ['products', 'promoted', userState],
    queryFn: () => productService.getPromotedProducts(userState, 6),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sponsored products from verified/premium sellers - filter by state
  const { data: sponsoredData } = useQuery({
    queryKey: ['products', 'sponsored', userState],
    queryFn: () => productService.getSponsoredProducts(userState, 12),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch admin-curated official store products - filter by state
  const { data: adminProductsData } = useQuery({
    queryKey: ['products', 'admin-products', userState],
    queryFn: () => productService.getAdminProducts(userState, 6),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recommended products - filter by state
  const { data: recommendedData } = useQuery({
    queryKey: ['products', 'recommended', userState],
    queryFn: () => productService.getRecommendedProducts(userState, 20),
    staleTime: 5 * 60 * 1000,
  });

  const promotedProducts = promotedData?.products || [];
  const sponsoredProducts = sponsoredData?.products || [];
  const adminProducts = adminProductsData?.products || [];
  const recommendedProducts = recommendedData?.products || [];

  const products = productsData?.products || [];

  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  }, [navigation]);

  const handleQuickView = useCallback((product: Product) => {
    triggerHaptic();
    setPreviewProduct(product);
    setPreviewModalVisible(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewModalVisible(false);
    setPreviewProduct(null);
  }, []);

  const handleClaimPromo = () => {
    triggerHaptic();
    if (promoClaimed) {
      Alert.alert(
        t('home.alreadyClaimed'),
        t('home.alreadyClaimedDesc'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } else {
      Alert.alert(
        t('home.freeDeliveryOffer'),
        t('home.freeDeliveryDesc'),
        [
          { text: t('home.notNow'), style: 'cancel' },
          { 
            text: t('home.claimNow'), 
            style: 'default',
            onPress: () => {
              triggerSuccessHaptic();
              setPromoClaimed(true);
              Alert.alert(
                t('home.congratulations'),
                t('home.freeDeliveryActivated'),
                [{ text: t('home.startShopping'), style: 'default' }]
              );
            }
          }
        ]
      );
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
      {/* Top Bar - Fixed */}
      <View style={[styles.topBar, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.locationButton}
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic();
              navigation.navigate('MyAddress' as never);
            }}
          >
            <Ionicons name="location" size={20} color={colors.primary} />
            <View style={styles.locationTextContainer}>
              <View style={styles.locationRow}>
                <Text 
                  style={[styles.locationText, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getSelectedAddressText()}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}
            onPress={() => {
              triggerHaptic();
              navigation.navigate('NearbyFarmersMap');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="map-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}
            onPress={() => {
              triggerHaptic();
              navigation.navigate('Notifications');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={28} color={colors.text} />
            {unreadCount > 0 && (
              <Animated.View style={[styles.notificationBadge, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}
            onPress={() => {
              triggerHaptic();
              navigation.navigate('Cart');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="bag-outline" size={28} color={colors.text} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAdBanner = () => {
    const promo = PROMO_BANNERS[promoIndex];
    const PromoIllustration = promo.illustration;
    const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
    const subtitleColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
    
    return (
      <TouchableOpacity
        style={[
          styles.promoBanner,
          { backgroundColor: isDark ? promo.bgDark : promo.bgLight }
        ]}
        activeOpacity={0.85}
        onPress={() => {
          triggerHaptic();
          navigation.navigate(promo.route as any);
        }}
      >
        <View style={styles.promoBannerContent}>
          <View style={styles.promoBannerText}>
            <Text style={[styles.promoBannerTitle, { color: textColor }]}>
              {promo.title}
            </Text>
            <Text style={[styles.promoBannerSubtitle, { color: subtitleColor }]}>
              {promo.subtitle}
            </Text>
            <View style={[styles.promoBannerButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}>
              <Text style={[styles.promoBannerButtonText, { color: textColor }]}>Learn More</Text>
              <Ionicons name="arrow-forward" size={14} color={textColor} />
            </View>
          </View>
          <PromoIllustration size={80} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategories = () => (
    <View style={styles.categoriesFlat}>
      <View style={styles.categoriesGrid}>
          {PRODUCT_CATEGORIES.slice(0, 8).map((category, index) => {
            const categoryLower = (category || '').toLowerCase();
            const catConfig = CATEGORY_ICONS[categoryLower] || CATEGORY_ICONS.others;
            const CategoryIllustration = CATEGORY_ILLUSTRATIONS[categoryLower];
            const isSelected = selectedCategory === category;
            // Colorful backgrounds for each category
            const categoryBg = isDark 
              ? `${catConfig.gradient[0]}25` // 25 = ~15% opacity in hex
              : `${catConfig.gradient[0]}20`; // 20 = ~12% opacity in hex
            return (
              <TouchableOpacity
                key={category}
                style={styles.categoryGridItem}
                onPress={() => {
                  triggerSelectionHaptic();
                  if (category === 'See All') {
                    navigation.navigate('Categories');
                  } else {
                    setSelectedCategory(isSelected ? null : category);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.categoryIconWrapper,
                  { 
                    backgroundColor: isSelected ? catConfig.gradient[0] : categoryBg,
                    borderWidth: isSelected ? 0 : 1,
                    borderColor: isSelected ? 'transparent' : `${catConfig.gradient[0]}30`,
                  }
                ]}>
                  {CategoryIllustration ? (
                    <CategoryIllustration 
                      width={52} 
                      height={52} 
                      color={isSelected ? '#FFFFFF' : catConfig.gradient[0]} 
                    />
                  ) : catConfig.iconType === 'material' ? (
                    <MaterialCommunityIcons 
                      name={catConfig.icon as any} 
                      size={48} 
                      color={isSelected ? '#FFFFFF' : catConfig.gradient[0]} 
                    />
                  ) : (
                    <Ionicons 
                      name={catConfig.icon as any} 
                      size={48} 
                      color={isSelected ? '#FFFFFF' : catConfig.gradient[0]} 
                    />
                  )}
                  <Text style={[
                    styles.categoryLabel,
                    { color: isSelected ? '#FFFFFF' : colors.text }
                  ]} numberOfLines={1}>{category}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
  );

  const renderPromoBanner = () => {
    if (promoDismissed) return null;
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={handleClaimPromo}
      >
        <View style={[
          styles.greetingCard,
          { 
            backgroundColor: isDark ? '#1A3A2A' : '#E8F5E9',
            borderColor: isDark ? 'rgba(76,175,80,0.3)' : '#A5D6A7',
          }
        ]}>
          {/* Dismiss Button */}
          <TouchableOpacity 
            style={styles.promoDismissBtn}
            onPress={() => {
              triggerHaptic();
              setPromoDismissed(true);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={22} color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'} />
          </TouchableOpacity>
          
          <View style={styles.greetingRow}>
            <View style={styles.greetingTextContainer}>
              <Text style={[styles.greetingText, { color: isDark ? '#A5D6A7' : '#4CAF50' }]}>
                {t('home.newUserOffer')}
              </Text>
              <Text style={[styles.userName, { color: isDark ? '#81C784' : '#2E7D32' }]}>
                {t('home.freeDelivery')} 🎁
              </Text>
            </View>
            <View style={[
              styles.promoRedeemButton,
              { backgroundColor: promoClaimed ? (isDark ? '#2E7D32' : '#4CAF50') : (isDark ? '#4CAF50' : '#2E7D32') }
            ]}>
              <Text style={styles.promoRedeemText}>
                {promoClaimed ? t('home.claimed') : t('home.redeem')}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductsHeader = () => (
    <View 
      style={[styles.recommendedSectionCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0, paddingBottom: 12 }]}
    >
      <View style={[styles.recommendedTitleRow, { paddingHorizontal: 16 }]}>
        <Ionicons name="sparkles" size={18} color="#EAB308" />
        <Text style={[styles.categorySectionTitle, { color: colors.text }]}>
          {selectedCategory || 'RECOMMENDED FOR YOU'}
        </Text>
      </View>
    </View>
  );

  const renderProductsWrapper = () => (
    <View style={[styles.recommendedProductsWrapper, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]} />
  );

  // Sponsored products section - From verified/premium sellers
  const renderSponsoredSection = () => {
    // Use sponsored products, or fallback to vegetables for testing if no sponsored data
    const displayProducts = sponsoredProducts.length > 0 ? sponsoredProducts : (vegetablesData?.products || []).slice(0, 4);
    if (!displayProducts || displayProducts.length === 0) return null;
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>Verified Sellers</Text>
          <View style={styles.sponsoredBadge}>
            <Text style={styles.sponsoredBadgeText}>Top Picks</Text>
          </View>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sponsoredScrollContent}
        >
          {displayProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="sponsored"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Promoted products section - Sponsored by farmers
  const renderPromotedSection = () => {
    if (!promotedProducts || promotedProducts.length === 0) return null;
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>Sponsored Products</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promotedScrollContent}
        >
          {promotedProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="sponsored"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Admin curated products section
  const renderAdminSection = () => {
    if (!adminProducts || adminProducts.length === 0) return null;
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>Official Store</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.adminScrollContent}
        >
          {adminProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="adminProduct"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with featured cards (horizontal scroll with large gradient cards)
  const renderFeaturedSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScrollContent}
        >
          {products.slice(0, 4).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with tall cards (vertical emphasis)
  const renderTallSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tallScrollContent}
        >
          {products.slice(0, 5).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with processed cards (package style)
  const renderProcessedSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.processedScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with seeds cards (garden/nursery style)
  const renderSeedsSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seedsScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with others cards (versatile misc style)
  const renderOthersSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.othersScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with nuts cards (crunchy earthy style)
  const renderNutsSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nutsScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with legumes cards (earthy bean style)
  const renderLegumesSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legumesScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with oils cards (golden bottle style)
  const renderOilsSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.oilsScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with seafood cards (ocean fresh style)
  const renderSeafoodSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seafoodScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with meat cards (butcher shop premium style)
  const renderMeatSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.meatScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with poultry cards (iOS-style clean media cards)
  const renderPoultrySection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.poultryScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with eggs cards (farmhouse nest style)
  const renderEggsSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eggsScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with honey cards (golden honeycomb style)
  const renderHoneySection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.honeyScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with herbs cards (botanical aromatic style)
  const renderHerbsSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.herbsScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with tubers cards (earthy purple style)
  const renderTubersSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tubersScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with livestock cards (ranch style)
  const renderLivestockSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.livestockScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with beverages cards (refreshing pink style)
  const renderBeveragesSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.beveragesScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with wide cards (horizontal list cards)
  const renderWideSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.wideCardsContainer}>
          {products.slice(0, 3).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </View>
      </View>
    );
  };

  // Category section with minimal cards (compact grid-like horizontal scroll)
  const renderMinimalSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.minimalScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="minimal"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with dairy cards (fresh, creamy glass-morphism style)
  const renderDairySection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dairyScrollContent}
        >
          {products.slice(0, 5).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with fruit cards (vibrant, juicy tropical design)
  const renderFruitSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fruitScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Category section with grain cards (warm, earthy wheat-inspired design)
  const renderGrainSection = (title: string, products: Product[], categoryId: string, accentColor: string) => {
    if (!products || products.length === 0) return null;
    
    
    return (
      <View style={styles.categorySectionFlat}>
        <View style={[styles.categorySectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#EBEBEB', borderBottomColor: isDark ? '#3D3D3D' : '#D0D0D0' }]}>
          <Text style={[styles.categorySectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Search', { category: categoryId })}
            style={styles.seeAllButton}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.grainScrollContent}
        >
          {products.slice(0, 6).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onPress={handleProductPress}
              onQuickView={handleQuickView}
              variant="dairy"
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render category sections with different styles
  const renderCategorySections = () => (
    <>
      {renderSponsoredSection()}
      {renderPromotedSection()}
      {renderAdminSection()}
      {renderFeaturedSection('Fresh Vegetables', vegetablesData?.products || [], 'vegetables', '#6B9B7A')}
      {renderFruitSection('Seasonal Fruits', fruitsData?.products || [], 'fruits', '#C9A86A')}
      {renderGrainSection('Grains & Cereals', grainsData?.products || [], 'grains', '#9A8A7A')}
      {renderDairySection('Dairy Products', dairyData?.products || [], 'dairy', '#6A9BC4')}
      {renderMeatSection('Fresh Meat', meatData?.products || [], 'meat', '#C4736A')}
      {renderSeafoodSection('Fresh Seafood', seafoodData?.products || [], 'seafood', '#7AB4C4')}
      {renderEggsSection('Farm Fresh Eggs', eggsData?.products || [], 'eggs', '#C9B86A')}
      {renderPoultrySection('Poultry', poultryData?.products || [], 'poultry', '#C48A9A')}
      {renderHerbsSection('Herbs & Spices', herbsData?.products || [], 'herbs_spices', '#7A9B6B')}
      {renderHoneySection('Pure Honey', honeyData?.products || [], 'honey', '#C9A86A')}
      {renderNutsSection('Nuts & Snacks', nutsData?.products || [], 'nuts', '#9A7A6A')}
      {renderTubersSection('Tubers & Roots', tubersData?.products || [], 'tubers', '#9A8AC4')}
      {renderOilsSection('Cooking Oils', oilsData?.products || [], 'oils', '#C4A86A')}
      {renderLegumesSection('Legumes & Beans', legumesData?.products || [], 'legumes', '#B4956A')}
      {renderProcessedSection('Processed Foods', processedData?.products || [], 'processed', '#9A7AB4')}
      {renderLivestockSection('Livestock', livestockData?.products || [], 'livestock', '#9A7A6A')}
      {renderSeedsSection('Seeds & Planting', seedsData?.products || [], 'seeds', '#7A9A6B')}
      {renderBeveragesSection('Beverages', beveragesData?.products || [], 'beverages', '#C48A9A')}
      {renderOthersSection('Other Products', othersData?.products || [], 'others', '#9A9AA4')}
    </>
  );

  // Product Preview Modal
  const renderPreviewModal = () => {
    if (!previewProduct) return null;
    
    const productImage = getFirstValidImageUrl(previewProduct.images) || 'https://placehold.co/300x300/E8F5E9/4CAF50/png';
    
    return (
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClosePreview}
      >
        <View style={styles.previewModalOverlay}>
          <TouchableOpacity 
            style={styles.previewModalBackdrop} 
            activeOpacity={1} 
            onPress={handleClosePreview}
          />
          <View style={[styles.previewModalContent, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            {/* Handle bar */}
            <View style={styles.previewModalHandle} />
            
            {/* Close button */}
            <TouchableOpacity style={styles.previewCloseBtn} onPress={handleClosePreview}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            
            {/* Product Image - Tappable to view details */}
            <TouchableOpacity 
              style={styles.previewImageContainer}
              activeOpacity={0.9}
              onPress={() => {
                handleClosePreview();
                handleProductPress(previewProduct);
              }}
            >
              <Image source={{ uri: productImage }} style={styles.previewImage} />
              {previewProduct.isVerifiedSeller && (
                <View style={styles.previewVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.previewVerifiedText}>Verified</Text>
                </View>
              )}
              {/* Tap hint overlay */}
              <View style={styles.previewImageTapHint}>
                <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            {/* Product Info */}
            <View style={styles.previewInfo}>
              <Text style={[styles.previewCategory, { color: colors.primary }]}>
                {previewProduct.category || 'Fresh Produce'}
              </Text>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                  handleClosePreview();
                  handleProductPress(previewProduct);
                }}
              >
                <Text style={[styles.previewTitle, { color: colors.text }]} numberOfLines={2}>
                  {previewProduct.title}
                </Text>
              </TouchableOpacity>
              
              {/* Farmer Row */}
              <View style={styles.previewFarmerRow}>
                <Ionicons name="storefront-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.previewFarmer, { color: colors.textSecondary }]} numberOfLines={1}>
                  {previewProduct.farmerName || 'Local Farm'}
                </Text>
                {previewProduct.isVerifiedSeller && (
                  <Ionicons name="checkmark-circle" size={14} color="#7AABC4" />
                )}
              </View>
              
              {/* Rating Row */}
              <View style={styles.previewRatingRow}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={[styles.previewRating, { color: colors.text }]}>
                  {previewProduct.rating ? Number(previewProduct.rating).toFixed(1) : '4.5'}
                </Text>
                <Text style={[styles.previewReviews, { color: colors.textSecondary }]}>
                  ({previewProduct.reviewCount || 0} reviews)
                </Text>
                <Text style={[styles.previewSales, { color: colors.textSecondary }]}>
                  • {previewProduct.salesCount || 0} sold
                </Text>
              </View>
              
              {/* Description */}
              {previewProduct.description && (
                <Text style={[styles.previewDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                  {previewProduct.description}
                </Text>
              )}
              
              {/* Price and Actions */}
              <View style={styles.previewFooter}>
                <View style={styles.previewPriceContainer}>
                  <Text style={[styles.previewPrice, { color: colors.primary }]}>
                    ₦{Number(previewProduct.price).toLocaleString()}
                  </Text>
                  <Text style={[styles.previewUnit, { color: colors.textSecondary }]}>
                    /{previewProduct.unit}
                  </Text>
                </View>
                
                <View style={styles.previewActions}>
                  <TouchableOpacity 
                    style={[styles.previewViewBtn, { borderColor: colors.primary }]}
                    onPress={() => {
                      handleClosePreview();
                      handleProductPress(previewProduct);
                    }}
                  >
                    <Text style={[styles.previewViewBtnText, { color: colors.primary }]}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.previewAddBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      triggerSuccessHaptic();
                      dispatch(addToCart({ product: previewProduct, quantity: 1 }));
                      Alert.alert('Success', `${previewProduct.title} added to cart!`);
                      handleClosePreview();
                    }}
                  >
                    <Ionicons name="cart" size={18} color="#FFFFFF" />
                    <Text style={styles.previewAddBtnText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Live Support Banner
  const renderLiveSupportBanner = () => (
    <LiveSupportBanner variant="compact" style={{ marginHorizontal: 8, marginTop: 8 }} />
  );

  const renderListHeader = () => (
    <>
      <View style={[styles.mainContentCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        {renderAdBanner()}
        {renderCategories()}
        {renderLiveSupportBanner()}
        {renderPromoBanner()}
        {renderCategorySections()}
      </View>
      {renderProductsHeader()}
    </>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {renderHeader()}
        <LoadingSpinner fullScreen={false} message={t('home.loadingProduce')} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {renderHeader()}
        <View style={styles.errorContainer}>
          <EmptyState
            title={t('common.error')}
            description={selectedCategory 
              ? t('home.couldNotLoadCategory', { category: selectedCategory })
              : t('home.couldNotLoad')
            }
            action={
              <View style={{ gap: 12 }}>
                <Button title={t('common.retry')} onPress={() => refetch()} />
                {selectedCategory && (
                  <Button 
                    title={t('home.clearFilter')} 
                    variant="outline"
                    onPress={() => setSelectedCategory(null)} 
                  />
                )}
              </View>
            }
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {renderHeader()}
      <Animated.FlatList
        data={selectedCategory ? products : recommendedProducts}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={2}
        columnWrapperStyle={[styles.productRow, { backgroundColor: isDark ? colors.card : '#FFFFFF', marginHorizontal: 8, paddingHorizontal: 8 }]}
        contentContainerStyle={[styles.listContent, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}
        style={{ backgroundColor: isDark ? '#000000' : '#F2F2F7' }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={1}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={
          (selectedCategory ? products : recommendedProducts).length > 0 ? (
            <View style={[styles.recommendedProductsFooter, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? '#3D3D3D' : '#E5E5EA' }]} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              title={t('home.noProducts')}
              description={
                selectedCategory
                  ? t('home.noCategoryProducts', { category: selectedCategory })
                  : t('home.noProductsDesc')
              }
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.productCardWrapper, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <ProductCard product={item} onPress={handleProductPress} onQuickView={handleQuickView} variant="recommended" />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      />
      {renderPreviewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  // Main content card wrapper for entire home screen content
  mainContentCard: {
    marginTop: 12,
    marginHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    paddingBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },

  // Header Styles
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationTextContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    minHeight: 20,
  },
  deliverLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: '#8E8E93',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRowAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  locationText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#000000',
    marginRight: 4,
    maxWidth: 180,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },

  // Promo Banner
  promoBanner: {
    marginTop: 12,
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  promoBannerText: {
    flex: 1,
    marginRight: 16,
  },
  promoBannerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  promoBannerSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 12,
  },
  promoBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  promoBannerButtonText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },

  // Greeting Section - Card Style (legacy)
  greetingCard: {
    marginTop: 12,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#8E8E93',
    marginBottom: 2,
  },
  userName: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: '#000000',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginLeft: 12,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#8E8E93',
  },

  // Promo card styles
  promoDismissBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 1,
    padding: 4,
  },
  promoRedeemButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  promoRedeemText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },

  // Section Styles - Subtle card style
  sectionContainer: {
    marginTop: 12,
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  // Flat section container without card styling
  sectionContainerFlat: {
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#007AFF',
    letterSpacing: 0.2,
  },

  // Categories Card - Subtle card style
  categoriesCard: {
    marginTop: 12,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
    padding: 4,
  },
  // Flat categories without card styling
  categoriesFlat: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  categoryGridItem: {
    alignItems: 'center',
    width: '25%',
    paddingVertical: 4,
  },
  categoriesScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 4,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 64,
  },
  categoryIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    marginTop: 8,
  },

  // Products Section
  recommendedSectionCard: {
    marginTop: 12,
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendedProductsWrapper: {
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendedProductsFooter: {
    marginHorizontal: 8,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  productsSectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#000000',
  },
  recommendedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Sticky header for recommended section
  stickyRecommendedHeader: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stickyHeaderTitle: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  sponsoredTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sponsoredScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sponsoredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sponsoredBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#B45309',
  },
  promotedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promotedScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  adminTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#007AFF',
  },

  // Category Sections - Subtle card style
  categorySection: {
    marginTop: 12,
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  // Flat category section without card styling
  categorySectionFlat: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0D0',
    backgroundColor: '#EBEBEB',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  categorySectionTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featuredScrollContent: {
    paddingHorizontal: 16,
  },
  tallScrollContent: {
    paddingHorizontal: 16,
  },
  minimalScrollContent: {
    paddingHorizontal: 16,
  },
  dairyScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  grainScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fruitScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  meatScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  seafoodScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  oilsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  legumesScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  processedScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  seedsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  othersScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  nutsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  poultryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eggsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  honeyScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  herbsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tubersScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  livestockScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  beveragesScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  wideCardsContainer: {
    paddingBottom: 4,
  },

  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
  productCardWrapper: {
    width: (width - 44) / 2,
    marginBottom: 14,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Preview Modal Styles
  previewModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  previewModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  previewModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewVerifiedBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7AABC4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  previewVerifiedText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  previewImageTapHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    padding: 20,
  },
  previewCategory: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  previewFarmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewFarmer: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  previewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  previewRating: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  previewReviews: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  previewSales: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginLeft: 4,
  },
  previewDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: 16,
  },
  previewFooter: {
    marginTop: 8,
  },
  previewPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  previewPrice: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  previewUnit: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    marginLeft: 4,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewViewBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewViewBtnText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
  },
  previewAddBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  previewAddBtnText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});
