import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, ImageErrorEventData, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Product } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic, triggerSuccessHaptic } from '../../utils/haptics';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleFavorite, selectFavoriteIds } from '../../store/slices/favoritesSlice';
import { getFirstValidImageUrl } from '../../utils/formatters';
import { AddToBagIcon, HeartIcon, StarIcon, VerifiedIcon } from '../../assets/icons';

const PLACEHOLDER_IMAGE = 'https://placehold.co/300x300/E8F5E9/4CAF50/png?text=Product';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  variant?: 'default' | 'compact' | 'horizontal' | 'featured' | 'minimal' | 'wide' | 'tall' | 'dairy' | 'grain' | 'fruit' | 'poultry' | 'eggs' | 'honey' | 'herbs' | 'tubers' | 'livestock' | 'beverages' | 'meat' | 'seafood' | 'oils' | 'legumes' | 'processed' | 'seeds' | 'others' | 'nuts' | 'recommended' | 'promoted' | 'adminProduct' | 'sponsored';
}

export function ProductCard({ product, onPress, onQuickView, variant = 'default' }: ProductCardProps) {
  const { colors, isDark, getFontSize, getFontWeight } = useTheme();
  const dispatch = useAppDispatch();
  const favoriteIds = useAppSelector(selectFavoriteIds);
  
  // Track image loading errors
  const [imageError, setImageError] = useState(false);
  
  // Handle image loading error - fallback to placeholder
  const handleImageError = useCallback((e: NativeSyntheticEvent<ImageErrorEventData>) => {
    console.log('Image load error:', e.nativeEvent.error);
    setImageError(true);
  }, []);
  
  // Early return if product is invalid
  if (!product || !product.id) {
    return null;
  }
  
  const isFavorite = favoriteIds.includes(product.id);

  const handleFavoriteToggle = useCallback(() => {
    triggerHaptic();
    dispatch(toggleFavorite(product.id));
    triggerSuccessHaptic();
  }, [dispatch, product.id]);
  
  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    image: {
      backgroundColor: isDark ? colors.surface : '#F5F5F5',
    },
    categoryBadge: {
      backgroundColor: isDark ? colors.primaryLight : '#E8F5E9',
    },
    title: {
      color: colors.text,
      fontSize: getFontSize(FONT_SIZES.md),
      fontWeight: getFontWeight('600'),
    },
    farmer: {
      color: colors.textSecondary,
      fontSize: getFontSize(FONT_SIZES.sm),
    },
    ratingText: {
      color: colors.text,
      fontSize: getFontSize(FONT_SIZES.sm),
    },
    addButton: {
      backgroundColor: isDark ? colors.primaryLight : '#E8F5E9',
    },
    unit: {
      color: colors.textSecondary,
    },
  }), [colors, isDark]);
  
  // Safely get the first image or use placeholder - validate URI and fix host
  const getValidImageUri = useCallback(() => {
    // If there was an error loading the image, use placeholder
    if (imageError) {
      return PLACEHOLDER_IMAGE;
    }
    const fixedUri = getFirstValidImageUrl(product.images);
    if (fixedUri) {
      return fixedUri;
    }
    return PLACEHOLDER_IMAGE;
  }, [product.images, imageError]);
  const productImage = getValidImageUri();
  
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.horizontalContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${product.title}, ${product.price} per ${product.unit}`}
      >
        <Image
          source={{ uri: productImage }}
          style={styles.horizontalImage}
          onError={handleImageError}
        />
        <View style={styles.horizontalContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {product.title}
          </Text>
          <View style={styles.farmerRow}>
            <Text style={[styles.farmer, { color: colors.textSecondary }]} numberOfLines={1}>
              by {product.farmerName || 'Unknown'}
            </Text>
            {product.isVerifiedSeller && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              ₦{Number(product.price).toLocaleString()}
            </Text>
            <Text style={[styles.unit, { color: colors.textSecondary }]}>/{product.unit}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${product.title}, ${product.price} per ${product.unit}`}
      >
        <Image
          source={{ uri: productImage }}
          style={styles.compactImage}
          onError={handleImageError}
        />
        <Text style={[styles.compactTitle, { color: colors.text }]} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={[styles.compactPrice, { color: colors.primary }]}>
          ₦{Number(product.price).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  }

  // Featured variant - Large hero card with gradient overlay
  if (variant === 'featured') {
    return (
      <TouchableOpacity
        style={[styles.featuredContainer, { backgroundColor: colors.card }]}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: productImage }}
          style={styles.featuredImage}
          onError={handleImageError}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.featuredGradient}
        >
          <View style={styles.featuredContent}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{product.category}</Text>
            </View>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <View style={styles.featuredFooter}>
              <Text style={styles.featuredPrice}>
                ₦{Number(product.price).toLocaleString()}
                <Text style={styles.featuredUnit}>/{product.unit}</Text>
              </Text>
              <View style={styles.featuredRating}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={styles.featuredRatingText}>
                  {product.rating ? Number(product.rating).toFixed(1) : '4.5'}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
        <TouchableOpacity 
          style={styles.featuredFavorite}
          onPress={handleFavoriteToggle}
        >
          <Ionicons 
            name={isFavorite ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isFavorite ? '#FF4757' : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // Minimal variant - Clean, simple card
  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        style={[styles.minimalContainer, { backgroundColor: colors.card }]}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.minimalImageWrapper}>
          <Image
            source={{ uri: productImage }}
            style={styles.minimalImage}
            onError={handleImageError}
          />
        </View>
        <View style={styles.minimalContent}>
          <Text style={[styles.minimalTitle, { color: colors.text }]} numberOfLines={1}>
            {product.title}
          </Text>
          <Text style={[styles.minimalPrice, { color: colors.primary }]}>
            ₦{Number(product.price).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Eggs variant - Farmhouse nest style with warm cream tones
  if (variant === 'eggs') {
    return (
      <TouchableOpacity
        style={styles.eggsContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FEFDFB', '#FAF8F5', '#F5F3F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.eggsGradient}
        >
          {/* Nest texture lines */}
          <View style={styles.eggsNestLine1} />
          <View style={styles.eggsNestLine2} />
          
          <View style={styles.eggsImageContainer}>
            <View style={styles.eggsImageNest}>
              <Image source={{ uri: productImage }} style={styles.eggsImage} onError={handleImageError} />
            </View>
            <View style={styles.eggsFreshBadge}>
              <Ionicons name="sunny" size={10} color="#B8956A" />
              <Text style={styles.eggsFreshText}>Farm Fresh</Text>
            </View>
          </View>
          
          <View style={styles.eggsContent}>
            <View style={styles.eggsHeader}>
              <View style={styles.eggsTypeBadge}>
                <Text style={styles.eggsTypeText}>🥚 Eggs</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#B8956A'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.eggsTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.eggsFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Farm'}</Text>
            <View style={styles.eggsFooter}>
              <View style={styles.eggsPriceContainer}>
                <Text style={[styles.eggsPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.eggsUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.eggsAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Honey variant - Golden honeycomb style
  if (variant === 'honey') {
    return (
      <TouchableOpacity
        style={styles.honeyContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FDFCFB', '#FAF7F5', '#F7F4F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.honeyGradient}
        >
          {/* Honeycomb pattern */}
          <View style={styles.honeyHexagon1} />
          <View style={styles.honeyHexagon2} />
          <View style={styles.honeyHexagon3} />
          
          <View style={styles.honeyImageContainer}>
            <View style={styles.honeyImageJar}>
              <Image source={{ uri: productImage }} style={styles.honeyImage} onError={handleImageError} />
            </View>
            <View style={styles.honeyPureBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#FFFFFF" />
              <Text style={styles.honeyPureText}>100% Pure</Text>
            </View>
          </View>
          
          <View style={styles.honeyContent}>
            <View style={styles.honeyHeader}>
              <View style={styles.honeyTypeBadge}>
                <Text style={styles.honeyTypeText}>🍯 Honey</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#EA580C'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.honeyTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <View style={styles.honeyOriginRow}>
              <Ionicons name="leaf" size={10} color="#65A30D" />
              <Text style={styles.honeyOrigin}>Organic</Text>
            </View>
            <View style={styles.honeyFooter}>
              <View style={styles.honeyPriceContainer}>
                <Text style={[styles.honeyPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.honeyUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.honeyAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Drip effect */}
          <View style={styles.honeyDrip} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Herbs variant - Botanical aromatic style
  if (variant === 'herbs') {
    return (
      <TouchableOpacity
        style={styles.herbsContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#F8FAF8', '#F2F5F2', '#EBF0EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.herbsGradient}
        >
          {/* Botanical leaf decorations */}
          <View style={styles.herbsLeaf1}>
            <Ionicons name="leaf" size={24} color="rgba(34,197,94,0.2)" />
          </View>
          <View style={styles.herbsLeaf2}>
            <Ionicons name="leaf" size={18} color="rgba(34,197,94,0.15)" />
          </View>
          
          <View style={styles.herbsImageContainer}>
            <View style={styles.herbsImageFrame}>
              <Image source={{ uri: productImage }} style={styles.herbsImage} onError={handleImageError} />
            </View>
            <View style={styles.herbsAromaBadge}>
              <Ionicons name="sparkles" size={10} color="#5A8A6A" />
              <Text style={styles.herbsAromaText}>Aromatic</Text>
            </View>
          </View>
          
          <View style={styles.herbsContent}>
            <View style={styles.herbsHeader}>
              <View style={styles.herbsTypeBadge}>
                <Ionicons name="leaf" size={10} color="#FFFFFF" />
                <Text style={styles.herbsTypeText}>Herbs</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#5A8A6A'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.herbsTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.herbsFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Herb Garden'}</Text>
            <View style={styles.herbsFooter}>
              <View style={styles.herbsPriceContainer}>
                <Text style={[styles.herbsPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.herbsUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.herbsAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Tubers variant - Earthy rustic style
  if (variant === 'tubers') {
    return (
      <TouchableOpacity
        style={styles.tubersContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FBFAFC', '#F5F3F7', '#EFECF3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tubersGradient}
        >
          {/* Soil/earth texture */}
          <View style={styles.tubersEarthDot1} />
          <View style={styles.tubersEarthDot2} />
          <View style={styles.tubersEarthDot3} />
          
          <View style={styles.tubersImageContainer}>
            <View style={styles.tubersImageFrame}>
              <Image source={{ uri: productImage }} style={styles.tubersImage} onError={handleImageError} />
            </View>
            <View style={styles.tubersHarvestBadge}>
              <Ionicons name="nutrition" size={10} color="#9A7AB4" />
              <Text style={styles.tubersHarvestText}>Root Crop</Text>
            </View>
          </View>
          
          <View style={styles.tubersContent}>
            <View style={styles.tubersHeader}>
              <View style={styles.tubersTypeBadge}>
                <Text style={styles.tubersTypeText}>🥔 Tubers</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#9A7AB4'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.tubersTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.tubersFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Farm'}</Text>
            <View style={styles.tubersFooter}>
              <View style={styles.tubersPriceContainer}>
                <Text style={[styles.tubersPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.tubersUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.tubersAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Promoted variant - Sponsored/boosted products with glow effect
  if (variant === 'promoted') {
    return (
      <TouchableOpacity
        style={styles.promotedContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        {/* Glow border effect */}
        <View style={styles.promotedGlowBorder} />
        
        <LinearGradient
          colors={['#FCFBFD', '#F7F5F9', '#F2EEF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promotedGradient}
        >
          {/* Sponsored banner */}
          <View style={styles.promotedBanner}>
            <Ionicons name="megaphone" size={10} color="#FFFFFF" />
            <Text style={styles.promotedBannerText}>Sponsored</Text>
          </View>
          
          {/* Sparkle decorations */}
          <View style={styles.promotedSparkle1}>
            <Ionicons name="flash" size={12} color="rgba(168,85,247,0.3)" />
          </View>
          <View style={styles.promotedSparkle2}>
            <Ionicons name="star" size={10} color="rgba(168,85,247,0.25)" />
          </View>
          
          <View style={styles.promotedImageContainer}>
            <View style={styles.promotedImageFrame}>
              <Image source={{ uri: productImage }} style={styles.promotedImage} onError={handleImageError} />
              {/* Boost indicator */}
              <View style={styles.promotedBoostBadge}>
                <Ionicons name="trending-up" size={12} color="#FFFFFF" />
              </View>
            </View>
          </View>
          
          <View style={styles.promotedContent}>
            <View style={styles.promotedHeader}>
              <View style={styles.promotedTypeBadge}>
                <Ionicons name="rocket" size={10} color="#9A7AB4" />
                <Text style={styles.promotedTypeText}>Boosted</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#A855F7'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.promotedTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.promotedFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Farm'}</Text>
            <View style={styles.promotedFooter}>
              <View style={styles.promotedPriceContainer}>
                <Text style={[styles.promotedPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.promotedUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.promotedAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Sponsored variant - Products from verified/premium subscription sellers
  if (variant === 'sponsored') {
    const isPremiumSeller = product.sponsorTier === 'premium';
    const tierColor = isPremiumSeller ? '#D4A574' : colors.primary;
    
    return (
      <TouchableOpacity
        style={[styles.dairyContainer, { backgroundColor: colors.card }]}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.95}
      >
        {/* Full-width Image Section */}
        <View style={[styles.dairyImageContainer, { backgroundColor: isDark ? colors.surface : '#F2F6FA' }]}>
          <Image source={{ uri: productImage }} style={styles.dairyImage} onError={handleImageError} />
          
          {/* Favorite Button */}
          <TouchableOpacity 
            style={[styles.dairyFavoriteBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' }]}
            onPress={handleFavoriteToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={18} 
              color={isFavorite ? '#FF4757' : (isDark ? '#FFFFFF' : tierColor)} 
            />
          </TouchableOpacity>
          
          {/* AD Badge */}
          <View style={[styles.dairyFreshBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="megaphone" size={10} color="#FFFFFF" />
            <Text style={styles.dairyFreshText}>AD</Text>
          </View>
        </View>
        
        {/* Content Section */}
        <View style={styles.dairyContent}>
          {/* Trusted Badge */}
          <View style={[styles.dairyCategoryTag, { backgroundColor: isDark ? colors.surface : `${tierColor}15` }]}>
            <Ionicons name="ribbon" size={10} color={tierColor} />
            <Text style={[styles.dairyCategoryText, { color: tierColor }]}>Trusted Seller</Text>
          </View>
          
          {/* Title */}
          <Text style={[styles.dairyTitle, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Text>
          
          {/* Farmer Info */}
          <View style={styles.dairyFarmerRow}>
            <Ionicons name="storefront-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.dairyFarmer, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.farmerName || 'Verified Farm'}
            </Text>
            <Ionicons name="checkmark-circle" size={12} color={tierColor} />
          </View>
          
          {/* Price Row */}
          <View style={styles.dairyFooter}>
            <View style={styles.dairyPriceContainer}>
              <Text style={[styles.dairyPrice, { color: tierColor }]}>
                ₦{Number(product.price).toLocaleString()}
              </Text>
              <Text style={[styles.dairyUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.dairyAddButton, { backgroundColor: tierColor }]}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
              <AddToBagIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // AdminProduct variant - Official/verified admin-curated products
  if (variant === 'adminProduct') {
    return (
      <TouchableOpacity
        style={[styles.dairyContainer, { backgroundColor: colors.card }]}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.95}
      >
        {/* Full-width Image Section */}
        <View style={[styles.dairyImageContainer, { backgroundColor: isDark ? colors.surface : '#F2F6FA' }]}>
          <Image source={{ uri: productImage }} style={styles.dairyImage} onError={handleImageError} />
          
          {/* Favorite Button */}
          <TouchableOpacity 
            style={[styles.dairyFavoriteBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' }]}
            onPress={handleFavoriteToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={18} 
              color={isFavorite ? '#FF4757' : (isDark ? '#FFFFFF' : '#6A9BAA')} 
            />
          </TouchableOpacity>
          
          {/* OFFICIAL Badge */}
          <View style={[styles.dairyFreshBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="storefront" size={10} color="#FFFFFF" />
            <Text style={styles.dairyFreshText}>OFFICIAL</Text>
          </View>
        </View>
        
        {/* Content Section */}
        <View style={styles.dairyContent}>
          {/* Verified Badge */}
          <View style={[styles.dairyCategoryTag, { backgroundColor: isDark ? colors.surface : '#E0F2F1' }]}>
            <Ionicons name="checkmark-done" size={10} color={colors.primary} />
            <Text style={[styles.dairyCategoryText, { color: colors.primary }]}>Quality Assured</Text>
          </View>
          
          {/* Title */}
          <Text style={[styles.dairyTitle, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Text>
          
          {/* Farmer Info */}
          <View style={styles.dairyFarmerRow}>
            <Ionicons name="storefront-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.dairyFarmer, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.farmerName || 'Handwork Official'}
            </Text>
          </View>
          
          {/* Price Row */}
          <View style={styles.dairyFooter}>
            <View style={styles.dairyPriceContainer}>
              <Text style={[styles.dairyPrice, { color: colors.primary }]}>
                ₦{Number(product.price).toLocaleString()}
              </Text>
              <Text style={[styles.dairyUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.dairyAddButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
              <AddToBagIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Recommended variant - Clean modern card style
  if (variant === 'recommended') {
    return (
      <TouchableOpacity
        style={[styles.recommendedContainer, { backgroundColor: colors.card }]}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.95}
      >
        {/* Image Section */}
        <View style={[styles.recommendedImageContainer, { backgroundColor: isDark ? colors.surface : '#F8F9FA' }]}>
          <Image source={{ uri: productImage }} style={styles.recommendedImage} onError={handleImageError} />
          
          {/* Favorite Button */}
          <TouchableOpacity 
            style={[styles.recommendedFavoriteBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' }]}
            onPress={handleFavoriteToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={18} 
              color={isFavorite ? '#FF4757' : (isDark ? '#FFFFFF' : '#666666')} 
            />
          </TouchableOpacity>
          
          {/* Verified Seller Badge */}
          {product.isVerifiedSeller && (
            <View style={[styles.recommendedVerifiedBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        {/* Content Section */}
        <View style={styles.recommendedContent}>
          {/* Category Tag */}
          <View style={[styles.recommendedCategoryTag, { backgroundColor: isDark ? colors.surface : '#F0F9F0' }]}>
            <Text style={[styles.recommendedCategoryText, { color: colors.primary }]} numberOfLines={1}>
              {product.category || 'Fresh'}
            </Text>
          </View>
          
          {/* Title */}
          <Text style={[styles.recommendedTitle, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Text>
          
          {/* Farmer Info */}
          <View style={styles.recommendedFarmerRow}>
            <Ionicons name="storefront-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.recommendedFarmer, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.farmerName || 'Local Farm'}
            </Text>
            {product.isVerifiedSeller && (
              <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
            )}
          </View>
          
          {/* Rating */}
          <View style={styles.recommendedRatingRow}>
            <Ionicons name="star" size={12} color="#FFB800" />
            <Text style={[styles.recommendedRating, { color: colors.text }]}>
              {product.rating ? Number(product.rating).toFixed(1) : '4.5'}
            </Text>
            <Text style={[styles.recommendedReviews, { color: colors.textSecondary }]}>
              ({product.reviewCount || 0})
            </Text>
          </View>
          
          {/* Price Row */}
          <View style={styles.recommendedFooter}>
            <View style={styles.recommendedPriceContainer}>
              <Text style={[styles.recommendedPrice, { color: colors.primary }]}>
                ₦{Number(product.price).toLocaleString()}
              </Text>
              <Text style={[styles.recommendedUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.recommendedAddButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
              <AddToBagIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Nuts variant - Crunchy earthy style
  if (variant === 'nuts') {
    return (
      <TouchableOpacity
        style={styles.nutsContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FDFCFA', '#F8F6F2', '#F2EFEA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.nutsGradient}
        >
          {/* Nut shape decorations */}
          <View style={styles.nutsShape1} />
          <View style={styles.nutsShape2} />
          <View style={styles.nutsShape3} />
          <View style={styles.nutsShape4} />
          <View style={styles.nutsShape5} />
          
          {/* Crunch lines */}
          <View style={styles.nutsCrunch1} />
          <View style={styles.nutsCrunch2} />
          
          <View style={styles.nutsImageContainer}>
            <View style={styles.nutsImageBowl}>
              <Image source={{ uri: productImage }} style={styles.nutsImage} onError={handleImageError} />
            </View>
            <View style={styles.nutsCrunchyBadge}>
              <Ionicons name="flash" size={10} color="#92400E" />
              <Text style={styles.nutsCrunchyText}>Crunchy</Text>
            </View>
          </View>
          
          <View style={styles.nutsContent}>
            <View style={styles.nutsHeader}>
              <View style={styles.nutsTypeBadge}>
                <Text style={styles.nutsTypeText}>🥜 Nuts</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#92400E'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.nutsTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.nutsFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Farm'}</Text>
            <View style={styles.nutsFooter}>
              <View style={styles.nutsPriceContainer}>
                <Text style={[styles.nutsPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.nutsUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.nutsAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Others variant - Versatile box/misc style
  if (variant === 'others') {
    return (
      <TouchableOpacity
        style={styles.othersContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FAFBFC', '#F5F7F9', '#F0F2F5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.othersGradient}
        >
          {/* Grid pattern decorations */}
          <View style={styles.othersGrid1} />
          <View style={styles.othersGrid2} />
          <View style={styles.othersGrid3} />
          <View style={styles.othersGrid4} />
          
          {/* Corner accent */}
          <View style={styles.othersCornerAccent} />
          
          <View style={styles.othersImageContainer}>
            <View style={styles.othersImageFrame}>
              <Image source={{ uri: productImage }} style={styles.othersImage} onError={handleImageError} />
            </View>
            <View style={styles.othersMiscBadge}>
              <Ionicons name="cube" size={10} color="#6B7280" />
              <Text style={styles.othersMiscText}>More Items</Text>
            </View>
          </View>
          
          <View style={styles.othersContent}>
            <View style={styles.othersHeader}>
              <View style={styles.othersTypeBadge}>
                <Text style={styles.othersTypeText}>📦 Other</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.othersTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.othersFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Seller'}</Text>
            <View style={styles.othersFooter}>
              <View style={styles.othersPriceContainer}>
                <Text style={[styles.othersPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.othersUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.othersAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Seeds variant - Garden/nursery style
  if (variant === 'seeds') {
    return (
      <TouchableOpacity
        style={styles.seedsContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#F8FCFA', '#F2F8F5', '#ECF4F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.seedsGradient}
        >
          {/* Soil decoration at bottom */}
          <View style={styles.seedsSoilLayer} />
          
          {/* Sprout decorations */}
          <View style={styles.seedsSprout1}>
            <View style={styles.seedsSproutStem} />
            <View style={styles.seedsSproutLeaf1} />
            <View style={styles.seedsSproutLeaf2} />
          </View>
          <View style={styles.seedsSprout2}>
            <View style={styles.seedsSproutStemSmall} />
            <View style={styles.seedsSproutLeafSmall} />
          </View>
          
          {/* Seed dot decorations */}
          <View style={styles.seedsDot1} />
          <View style={styles.seedsDot2} />
          <View style={styles.seedsDot3} />
          <View style={styles.seedsDot4} />
          
          <View style={styles.seedsImageContainer}>
            <View style={styles.seedsImagePot}>
              <Image source={{ uri: productImage }} style={styles.seedsImage} onError={handleImageError} />
            </View>
            <View style={styles.seedsPlantBadge}>
              <Ionicons name="leaf" size={10} color="#047857" />
              <Text style={styles.seedsPlantText}>Plant Now</Text>
            </View>
          </View>
          
          <View style={styles.seedsContent}>
            <View style={styles.seedsHeader}>
              <View style={styles.seedsTypeBadge}>
                <Text style={styles.seedsTypeText}>🌱 Seeds</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#059669'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.seedsTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.seedsFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Nursery Farm'}</Text>
            <View style={styles.seedsFooter}>
              <View style={styles.seedsPriceContainer}>
                <Text style={[styles.seedsPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.seedsUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.seedsAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Processed variant - Package/factory style
  if (variant === 'processed') {
    return (
      <TouchableOpacity
        style={styles.processedContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FAFAFA', '#F5F5F5', '#F0F0F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.processedGradient}
        >
          {/* Package pattern decorations */}
          <View style={styles.processedStripe1} />
          <View style={styles.processedStripe2} />
          <View style={styles.processedDot1} />
          <View style={styles.processedDot2} />
          <View style={styles.processedDot3} />
          
          <View style={styles.processedImageContainer}>
            <View style={styles.processedImageBox}>
              <Image source={{ uri: productImage }} style={styles.processedImage} onError={handleImageError} />
            </View>
            <View style={styles.processedReadyBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#7C3AED" />
              <Text style={styles.processedReadyText}>Ready to Use</Text>
            </View>
          </View>
          
          <View style={styles.processedContent}>
            <View style={styles.processedHeader}>
              <View style={styles.processedTypeBadge}>
                <Text style={styles.processedTypeText}>📦 Processed</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#7C3AED'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.processedTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.processedFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Producer'}</Text>
            <View style={styles.processedFooter}>
              <View style={styles.processedPriceContainer}>
                <Text style={[styles.processedPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.processedUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.processedAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Legumes variant - Earthy bean/pod style
  if (variant === 'legumes') {
    return (
      <TouchableOpacity
        style={styles.legumesContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FDFCFB', '#F9F7F5', '#F5F2EF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.legumesGradient}
        >
          {/* Bean decorations */}
          <View style={styles.legumesBean1} />
          <View style={styles.legumesBean2} />
          <View style={styles.legumesBean3} />
          <View style={styles.legumesPod1} />
          <View style={styles.legumesPod2} />
          
          <View style={styles.legumesImageContainer}>
            <View style={styles.legumesImageFrame}>
              <Image source={{ uri: productImage }} style={styles.legumesImage} onError={handleImageError} />
            </View>
            <View style={styles.legumesProteinBadge}>
              <Ionicons name="fitness" size={10} color="#92400E" />
              <Text style={styles.legumesProteinText}>High Protein</Text>
            </View>
          </View>
          
          <View style={styles.legumesContent}>
            <View style={styles.legumesHeader}>
              <View style={styles.legumesTypeBadge}>
                <Text style={styles.legumesTypeText}>🫘 Legumes</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#C2410C'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.legumesTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.legumesFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Farmer'}</Text>
            <View style={styles.legumesFooter}>
              <View style={styles.legumesPriceContainer}>
                <Text style={[styles.legumesPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.legumesUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.legumesAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Oils variant - Golden bottle/drip style
  if (variant === 'oils') {
    return (
      <TouchableOpacity
        style={styles.oilsContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FEFDFB', '#FAF8F5', '#F5F3F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.oilsGradient}
        >
          {/* Oil drip decorations */}
          <View style={styles.oilsDrip1} />
          <View style={styles.oilsDrip2} />
          <View style={styles.oilsDrip3} />
          {/* Shine effects */}
          <View style={styles.oilsShine1} />
          <View style={styles.oilsShine2} />
          
          <View style={styles.oilsImageContainer}>
            <View style={styles.oilsBottleFrame}>
              <Image source={{ uri: productImage }} style={styles.oilsImage} onError={handleImageError} />
            </View>
            <View style={styles.oilsPurityBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#B45309" />
              <Text style={styles.oilsPurityText}>100% Pure</Text>
            </View>
          </View>
          
          <View style={styles.oilsContent}>
            <View style={styles.oilsHeader}>
              <View style={styles.oilsTypeBadge}>
                <Text style={styles.oilsTypeText}>🫒 Cooking Oil</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#B45309'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.oilsTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.oilsFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Producer'}</Text>
            <View style={styles.oilsFooter}>
              <View style={styles.oilsPriceContainer}>
                <Text style={[styles.oilsPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.oilsUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.oilsAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Seafood variant - Ocean fresh style
  if (variant === 'seafood') {
    return (
      <TouchableOpacity
        style={styles.seafoodContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#F8FBFC', '#F2F7FA', '#ECF3F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.seafoodGradient}
        >
          {/* Wave decorations */}
          <View style={styles.seafoodWave1} />
          <View style={styles.seafoodWave2} />
          <View style={styles.seafoodBubble1} />
          <View style={styles.seafoodBubble2} />
          {/* Hair lines */}
          <View style={styles.seafoodHairLine1} />
          <View style={styles.seafoodHairLine2} />
          <View style={styles.seafoodHairLine3} />
          <View style={styles.seafoodHairLine4} />
          
          <View style={styles.seafoodImageContainer}>
            <View style={styles.seafoodImageFrame}>
              <Image source={{ uri: productImage }} style={styles.seafoodImage} onError={handleImageError} />
            </View>
            <View style={styles.seafoodFreshBadge}>
              <Ionicons name="water" size={10} color="#0369A1" />
              <Text style={styles.seafoodFreshText}>Ocean Fresh</Text>
            </View>
          </View>
          
          <View style={styles.seafoodContent}>
            <View style={styles.seafoodHeader}>
              <View style={styles.seafoodTypeBadge}>
                <Text style={styles.seafoodTypeText}>🐟 Seafood</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#0284C7'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.seafoodTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.seafoodFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Fisherman'}</Text>
            <View style={styles.seafoodFooter}>
              <View style={styles.seafoodPriceContainer}>
                <Text style={[styles.seafoodPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.seafoodUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.seafoodAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Meat variant - Butcher shop/premium cuts style
  if (variant === 'meat') {
    return (
      <TouchableOpacity
        style={styles.meatContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FDFBFB', '#F9F5F5', '#F5F0F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.meatGradient}
        >
          {/* Decorative marbling lines */}
          <View style={styles.meatMarble1} />
          <View style={styles.meatMarble2} />
          <View style={styles.meatMarble3} />
          
          <View style={styles.meatImageContainer}>
            <View style={styles.meatImageFrame}>
              <Image source={{ uri: productImage }} style={styles.meatImage} onError={handleImageError} />
              <View style={styles.meatCutBadge}>
                <Ionicons name="cut" size={10} color="#991B1B" />
                <Text style={styles.meatCutText}>Premium</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.meatFavoriteBtn} onPress={handleFavoriteToggle}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={16} color={isFavorite ? '#FF4757' : '#991B1B'} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.meatContent}>
            <View style={styles.meatHeader}>
              <View style={styles.meatTypeBadge}>
                <Text style={styles.meatTypeText}>🥩 Fresh Cut</Text>
              </View>
            </View>
            <Text style={[styles.meatTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.meatFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Butcher'}</Text>
            <View style={styles.meatFooter}>
              <View style={styles.meatPriceContainer}>
                <Text style={[styles.meatPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.meatUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.meatAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Livestock variant - Ranch/farm style
  if (variant === 'livestock') {
    return (
      <TouchableOpacity
        style={styles.livestockContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.livestockCard}>
          {/* Fence post decorations */}
          <View style={styles.livestockFencePost1} />
          <View style={styles.livestockFencePost2} />
          <View style={styles.livestockFenceRail} />
          
          <View style={styles.livestockImageSection}>
            <Image source={{ uri: productImage }} style={styles.livestockImage} onError={handleImageError} />
            <LinearGradient
              colors={['transparent', 'rgba(120,53,15,0.7)']}
              style={styles.livestockImageOverlay}
            />
            {/* Grass decoration at bottom */}
            <View style={styles.livestockGrass1} />
            <View style={styles.livestockGrass2} />
            <View style={styles.livestockGrass3} />
            
            <View style={styles.livestockFarmBadge}>
              <Ionicons name="home" size={10} color="#FFFFFF" />
              <Text style={styles.livestockFarmText}>Farm Raised</Text>
            </View>
            <TouchableOpacity style={styles.livestockFavoriteBtn} onPress={handleFavoriteToggle}>
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
          <View style={styles.livestockContent}>
            <View style={styles.livestockTypeBadge}>
              <Text style={styles.livestockTypeText}>🐄 Livestock</Text>
            </View>
            <Text style={[styles.livestockTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.livestockFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Ranch'}</Text>
            <View style={styles.livestockFooter}>
              <View style={styles.livestockPriceContainer}>
                <Text style={[styles.livestockPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.livestockUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.livestockAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Beverages variant - Refreshing glass style
  if (variant === 'beverages') {
    return (
      <TouchableOpacity
        style={styles.beveragesContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FDFBFC', '#F9F5F8', '#F5F0F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.beveragesGradient}
        >
          {/* Bubble decorations */}
          <View style={styles.beveragesBubble1} />
          <View style={styles.beveragesBubble2} />
          <View style={styles.beveragesBubble3} />
          
          <View style={styles.beveragesImageContainer}>
            <View style={styles.beveragesImageGlass}>
              <Image source={{ uri: productImage }} style={styles.beveragesImage} onError={handleImageError} />
            </View>
            <View style={styles.beveragesRefreshBadge}>
              <Ionicons name="water" size={10} color="#B47A8A" />
              <Text style={styles.beveragesRefreshText}>Refreshing</Text>
            </View>
          </View>
          
          <View style={styles.beveragesContent}>
            <View style={styles.beveragesHeader}>
              <View style={styles.beveragesTypeBadge}>
                <Text style={styles.beveragesTypeText}>🍹 Drinks</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#B47A8A'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.beveragesTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.beveragesFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Producer'}</Text>
            <View style={styles.beveragesFooter}>
              <View style={styles.beveragesPriceContainer}>
                <Text style={[styles.beveragesPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.beveragesUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.beveragesAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Poultry variant - Farm fresh chicken style
  if (variant === 'poultry') {
    return (
      <TouchableOpacity
        style={styles.poultryContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FDFCFC', '#F9F6F6', '#F5F1F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.poultryGradient}
        >
          {/* Feather decorations */}
          <View style={styles.poultryFeather1} />
          <View style={styles.poultryFeather2} />
          <View style={styles.poultryFeather3} />
          
          {/* Wing pattern lines */}
          <View style={styles.poultryWing1} />
          <View style={styles.poultryWing2} />
          
          <View style={styles.poultryImageContainer}>
            <View style={styles.poultryImageFrame}>
              <Image source={{ uri: productImage }} style={styles.poultryImage} onError={handleImageError} />
            </View>
            <View style={styles.poultryFreshBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#C4635A" />
              <Text style={styles.poultryFreshText}>Farm Fresh</Text>
            </View>
          </View>
          
          <View style={styles.poultryContent}>
            <View style={styles.poultryHeader}>
              <View style={styles.poultryTypeBadge}>
                <Text style={styles.poultryTypeText}>🍗 Poultry</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : '#C4635A'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.poultryTitle, { color: colors.text }]} numberOfLines={2}>{product.title}</Text>
            <Text style={[styles.poultryFarmer, { color: colors.textSecondary }]} numberOfLines={1}>{product.farmerName || 'Local Farm'}</Text>
            <View style={styles.poultryFooter}>
              <View style={styles.poultryPriceContainer}>
                <Text style={[styles.poultryPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.poultryUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.poultryAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Fruit variant - Fresh, vibrant juicy design with tropical feel
  if (variant === 'fruit') {
    return (
      <TouchableOpacity
        style={styles.fruitContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FDFCFA', '#F9F6F3', '#F5F1ED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fruitGradient}
        >
          {/* Decorative fruit splash */}
          <View style={styles.fruitSplash1} />
          <View style={styles.fruitSplash2} />
          <View style={styles.fruitSplash3} />
          
          <View style={styles.fruitImageContainer}>
            <View style={styles.fruitImageRing}>
              <Image
                source={{ uri: productImage }}
                style={styles.fruitImage}
                onError={handleImageError}
              />
            </View>
            <View style={styles.fruitSeasonBadge}>
              <Ionicons name="sunny" size={10} color="#FF6D00" />
              <Text style={styles.fruitSeasonText}>In Season</Text>
            </View>
          </View>
          
          <View style={styles.fruitContent}>
            <View style={styles.fruitHeader}>
              <View style={styles.fruitTypeBadge}>
                <Ionicons name="nutrition" size={10} color="#FFFFFF" />
                <Text style={styles.fruitTypeText}>Fresh</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={18} 
                  color={isFavorite ? '#FF4757' : '#FF7043'} 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.fruitTitle, { color: colors.text }]} numberOfLines={2}>
              {product.title}
            </Text>
            
            <View style={styles.fruitVitaminRow}>
              <View style={styles.fruitVitaminBadge}>
                <Text style={styles.fruitVitaminText}>🍊 Rich in Vitamins</Text>
              </View>
            </View>
            
            <View style={styles.fruitFooter}>
              <View style={styles.fruitPriceContainer}>
                <Text style={[styles.fruitPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.fruitUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <TouchableOpacity 
              style={styles.fruitAddButton}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
                <Ionicons name="basket" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Decorative leaf */}
          <View style={styles.fruitLeaf}>
            <Ionicons name="leaf" size={20} color="rgba(76,175,80,0.3)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Grain variant - Warm, earthy wheat-inspired design
  if (variant === 'grain') {
    return (
      <TouchableOpacity
        style={styles.grainContainer}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FDFCFA', '#F9F7F3', '#F5F2ED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.grainGradient}
        >
          {/* Wheat pattern decorative elements */}
          <View style={styles.grainPatternContainer}>
            <View style={styles.grainWheatLine1} />
            <View style={styles.grainWheatLine2} />
            <View style={styles.grainWheatLine3} />
          </View>
          
          <View style={styles.grainImageWrapper}>
            <View style={styles.grainImageFrame}>
              <Image
                source={{ uri: productImage }}
                style={styles.grainImage}
                onError={handleImageError}
              />
            </View>
            <View style={styles.grainHarvestBadge}>
              <Ionicons name="sunny" size={10} color="#FF8F00" />
              <Text style={styles.grainHarvestText}>Harvest</Text>
            </View>
          </View>
          
          <View style={styles.grainContent}>
            <View style={styles.grainHeader}>
              <View style={styles.grainTypeBadge}>
                <Ionicons name="leaf" size={10} color="#FFFFFF" />
                <Text style={styles.grainTypeText}>Grain</Text>
              </View>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={18} 
                  color={isFavorite ? '#FF4757' : '#F57C00'} 
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.grainTitle, { color: colors.text }]} numberOfLines={2}>
              {product.title}
            </Text>
            <View style={styles.grainOriginRow}>
              <Ionicons name="location" size={10} color="#8D6E63" />
              <Text style={[styles.grainFarmer, { color: colors.textSecondary }]} numberOfLines={1}>
                {product.farmerName || 'Local Farm'}
              </Text>
            </View>
            <View style={styles.grainFooter}>
              <View style={styles.grainPriceContainer}>
                <Text style={[styles.grainPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
                <Text style={[styles.grainUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
              </View>
              <View style={styles.grainWeightBadge}>
                <Ionicons name="scale" size={12} color="#795548" />
              </View>
            </View>
          </View>
          
          {/* Decorative grain kernels */}
          <View style={styles.grainKernel1} />
          <View style={styles.grainKernel2} />
          <View style={styles.grainKernel3} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Dairy variant - Modern media card with full-width top image
  if (variant === 'dairy') {
    return (
      <TouchableOpacity
        style={[styles.dairyContainer, { backgroundColor: colors.card }]}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.95}
      >
        {/* Full-width Image Section */}
        <View style={[styles.dairyImageContainer, { backgroundColor: isDark ? colors.surface : '#F2F6FA' }]}>
          <Image source={{ uri: productImage }} style={styles.dairyImage} onError={handleImageError} />
          
          {/* Favorite Button */}
          <TouchableOpacity 
            style={[styles.dairyFavoriteBtn, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)' }]}
            onPress={handleFavoriteToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={18} 
              color={isFavorite ? '#FF4757' : (isDark ? '#FFFFFF' : '#6A9BC4')} 
            />
          </TouchableOpacity>
          
          {/* Fresh Badge */}
          <View style={styles.dairyFreshBadge}>
            <Ionicons name="snow" size={10} color="#FFFFFF" />
            <Text style={styles.dairyFreshText}>Fresh</Text>
          </View>
        </View>
        
        {/* Content Section */}
        <View style={styles.dairyContent}>
          {/* Category Tag */}
          <View style={[styles.dairyCategoryTag, { backgroundColor: isDark ? colors.surface : '#E3F2FD' }]}>
            <Ionicons name="water" size={10} color={colors.primary} />
            <Text style={[styles.dairyCategoryText, { color: colors.primary }]}>Dairy</Text>
          </View>
          
          {/* Title */}
          <Text style={[styles.dairyTitle, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Text>
          
          {/* Farmer Info */}
          <View style={styles.dairyFarmerRow}>
            <Ionicons name="storefront-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.dairyFarmer, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.farmerName || 'Local Farm'}
            </Text>
          </View>
          
          {/* Price Row */}
          <View style={styles.dairyFooter}>
            <View style={styles.dairyPriceContainer}>
              <Text style={[styles.dairyPrice, { color: colors.primary }]}>
                ₦{Number(product.price).toLocaleString()}
              </Text>
              <Text style={[styles.dairyUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.dairyAddButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                triggerSuccessHaptic();
                onQuickView?.(product);
              }}
            >
              <AddToBagIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Wide variant - Horizontal card with more details
  if (variant === 'wide') {
    return (
      <TouchableOpacity
        style={[styles.wideContainer, { backgroundColor: colors.card }]}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: productImage }}
          style={styles.wideImage}
          onError={handleImageError}
        />
        <View style={styles.wideContent}>
          <View style={styles.wideBadgeRow}>
            <View style={[styles.wideCategoryBadge, { backgroundColor: isDark ? colors.primaryLight : '#E8F5E9' }]}>
              <Text style={styles.wideCategoryText}>{product.category}</Text>
            </View>
            {product.isOrganic && (
              <View style={styles.wideOrganicBadge}>
                <Ionicons name="leaf" size={10} color="#FFFFFF" />
                <Text style={styles.wideOrganicText}>Organic</Text>
              </View>
            )}
            {product.certifications && product.certifications.length > 0 && !product.isOrganic && (
              <View style={[styles.wideOrganicBadge, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
                <Text style={styles.wideOrganicText}>Certified</Text>
              </View>
            )}
          </View>
          <Text style={[styles.wideTitle, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={[styles.wideFarmer, { color: colors.textSecondary }]} numberOfLines={1}>
            by {product.farmerName || 'Local Farmer'}
          </Text>
          {product.bulkDiscountPercent && product.bulkDiscountQuantity && (
            <View style={styles.wideBulkBadge}>
              <Ionicons name="pricetag" size={10} color="#FFFFFF" />
              <Text style={styles.wideBulkText}>
                {product.bulkDiscountPercent}% off {product.bulkDiscountQuantity}+ {product.unit}
              </Text>
            </View>
          )}
          <View style={styles.wideFooter}>
            <View style={styles.widePriceRow}>
              <Text style={styles.widePrice}>₦{Number(product.price).toLocaleString()}</Text>
              <Text style={[styles.wideUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
            </View>
            <View style={styles.wideActions}>
              <TouchableOpacity onPress={handleFavoriteToggle}>
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={22} 
                  color={isFavorite ? '#FF4757' : colors.textSecondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.wideAddBtn, { backgroundColor: colors.primary }]}>
                <AddToBagIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Tall variant - Vertical card with prominent image
  if (variant === 'tall') {
    return (
      <TouchableOpacity
        style={[styles.tallContainer, { backgroundColor: colors.card }]}
        onPress={() => {
          triggerHaptic();
          onPress(product);
        }}
        activeOpacity={0.9}
      >
        <View style={styles.tallImageContainer}>
          <Image
            source={{ uri: productImage }}
            style={styles.tallImage}
            onError={handleImageError}
          />
          <TouchableOpacity 
            style={styles.tallFavorite}
            onPress={handleFavoriteToggle}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={20} 
              color={isFavorite ? '#FF4757' : colors.iconSecondary} 
            />
          </TouchableOpacity>
          {product.rating !== undefined && product.rating > 0 && (
            <View style={styles.tallRatingBadge}>
              <Ionicons name="star" size={10} color="#FFB800" />
              <Text style={styles.tallRatingText}>{Number(product.rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.tallContent}>
          <Text style={[styles.tallTitle, { color: colors.text }]} numberOfLines={2}>
            {product.title}
          </Text>
          <View style={styles.tallPriceRow}>
            <Text style={[styles.tallPrice, { color: colors.primary }]}>₦{Number(product.price).toLocaleString()}</Text>
            <Text style={[styles.tallUnit, { color: colors.textSecondary }]}>/{product.unit}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, dynamicStyles.container]}
      onPress={() => {
        triggerHaptic();
        onPress(product);
      }}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${product.price} per ${product.unit}, sold by ${product.farmerName || 'Unknown'}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: productImage }}
          style={[styles.image, dynamicStyles.image]}
          onError={handleImageError}
        />
        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleFavoriteToggle}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isFavorite ? 'heart' : 'heart-outline'} 
            size={20} 
            color={isFavorite ? '#FF4757' : colors.iconSecondary} 
          />
        </TouchableOpacity>
        
        {/* Stock Badges */}
        {product.stock < 10 && product.stock > 0 && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.badgeText}>Low Stock</Text>
          </View>
        )}
        {product.stock === 0 && (
          <View style={[styles.lowStockBadge, styles.outOfStockBadge]}>
            <Text style={styles.badgeText}>Out of Stock</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, dynamicStyles.categoryBadge]}>
            <Text style={styles.category}>{product.category}</Text>
          </View>
          {product.rating !== undefined && product.rating > 0 && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={[styles.ratingText, dynamicStyles.ratingText]}>{Number(product.rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.title, dynamicStyles.title]} numberOfLines={2}>
          {product.title}
        </Text>
        
        <View style={styles.farmerRow}>
          <Text style={[styles.farmer, dynamicStyles.farmer]} numberOfLines={1}>
            <Ionicons name="person-circle-outline" size={12} color={colors.textSecondary} /> {product.farmerName || 'Unknown'}
          </Text>
          {product.isVerifiedSeller && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₦{Number(product.price).toLocaleString()}</Text>
            <Text style={[styles.unit, dynamicStyles.unit]}>/{product.unit}</Text>
          </View>
          <TouchableOpacity style={[styles.addButton, dynamicStyles.addButton]} activeOpacity={0.8}>
            <AddToBagIcon size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  category: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    lineHeight: 20,
  },
  farmer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  unit: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#43A047',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#D4A574',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockBadge: {
    backgroundColor: '#D4736A',
  },
  badgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '700',
  },

  // Compact variant
  compactContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    width: 120,
    marginRight: SPACING.sm,
    ...SHADOWS.small,
  },
  compactImage: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.grayLight,
  },
  compactTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    padding: SPACING.xs,
    paddingBottom: 0,
  },
  compactPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    padding: SPACING.xs,
  },

  // Horizontal variant
  horizontalContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  horizontalImage: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.grayLight,
  },
  horizontalContent: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
  },

  // Featured variant styles
  featuredContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 280,
    height: 200,
    marginRight: 16,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  featuredContent: {},
  featuredBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  featuredUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredFavorite: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Minimal variant styles
  minimalContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 140,
    marginRight: 12,
    padding: 8,
  },
  minimalImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  minimalImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#F5F5F5',
  },
  minimalContent: {
    paddingHorizontal: 4,
  },
  minimalTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  minimalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Wide variant styles
  wideContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  wideImage: {
    width: 120,
    height: 160,
    backgroundColor: '#F5F5F5',
  },
  wideContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  wideBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  wideCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wideCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  wideOrganicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B9B7A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  wideOrganicText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wideBulkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  wideBulkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wideTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  wideFarmer: {
    fontSize: 12,
    marginBottom: 8,
  },
  wideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  widePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  widePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  wideUnit: {
    fontSize: 12,
    marginLeft: 2,
  },
  wideActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wideAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tall variant styles
  tallContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 160,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tallImageContainer: {
    position: 'relative',
  },
  tallImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F5F5F5',
  },
  tallFavorite: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tallRatingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  tallRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tallContent: {
    padding: 12,
  },
  tallTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  tallPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tallPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  tallUnit: {
    fontSize: 11,
    marginLeft: 2,
  },

  // Dairy variant styles - Modern media card
  dairyContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dairyImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F2F6FA',
    position: 'relative',
  },
  dairyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dairyFavoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dairyFreshBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43A047',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  dairyFreshText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dairyContent: {
    padding: 12,
  },
  dairyCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    gap: 4,
  },
  dairyCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6A9BC4',
  },
  dairyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 18,
  },
  dairyFarmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  dairyFarmer: {
    fontSize: 11,
    flex: 1,
  },
  dairyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dairyPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dairyPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  dairyUnit: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 2,
  },
  dairyAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#43A047',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Grain variant styles
  grainContainer: {
    width: 200,
    marginRight: 16,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  grainGradient: {
    padding: 16,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  grainPatternContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    opacity: 0.15,
  },
  grainWheatLine1: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 3,
    height: 40,
    backgroundColor: '#795548',
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  grainWheatLine2: {
    position: 'absolute',
    top: 15,
    right: 35,
    width: 3,
    height: 35,
    backgroundColor: '#795548',
    borderRadius: 2,
    transform: [{ rotate: '-10deg' }],
  },
  grainWheatLine3: {
    position: 'absolute',
    top: 5,
    right: 50,
    width: 3,
    height: 45,
    backgroundColor: '#795548',
    borderRadius: 2,
    transform: [{ rotate: '5deg' }],
  },
  grainImageWrapper: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  grainImageFrame: {
    width: 100,
    height: 100,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  grainImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  grainHarvestBadge: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#FFB74D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  grainHarvestText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E65100',
  },
  grainContent: {
    zIndex: 1,
  },
  grainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  grainTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D6E63',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  grainTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  grainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4E342E',
    marginBottom: 4,
    lineHeight: 18,
  },
  grainOriginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  grainFarmer: {
    fontSize: 11,
    color: '#8D6E63',
    flex: 1,
  },
  grainFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grainPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  grainPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#5D4037',
  },
  grainUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8D6E63',
    marginLeft: 2,
  },
  grainWeightBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE0B2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFCC80',
  },
  grainKernel1: {
    position: 'absolute',
    top: 20,
    left: -8,
    width: 20,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,183,77,0.4)',
    transform: [{ rotate: '45deg' }],
  },
  grainKernel2: {
    position: 'absolute',
    bottom: 40,
    right: -5,
    width: 16,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,183,77,0.3)',
    transform: [{ rotate: '-30deg' }],
  },
  grainKernel3: {
    position: 'absolute',
    bottom: 10,
    left: 30,
    width: 14,
    height: 7,
    borderRadius: 7,
    backgroundColor: 'rgba(255,183,77,0.35)',
    transform: [{ rotate: '20deg' }],
  },
  
  // Fruit variant styles
  fruitContainer: {
    width: 200,
    marginRight: 16,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  fruitGradient: {
    padding: 16,
    borderRadius: 26,
    position: 'relative',
    overflow: 'hidden',
  },
  fruitSplash1: {
    position: 'absolute',
    top: -35,
    right: -25,
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: 'rgba(255,138,101,0.3)',
  },
  fruitSplash2: {
    position: 'absolute',
    top: 25,
    right: 45,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,183,77,0.25)',
  },
  fruitSplash3: {
    position: 'absolute',
    bottom: -25,
    left: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,138,101,0.2)',
  },
  fruitImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  fruitImageRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    padding: 5,
    borderWidth: 3,
    borderColor: '#FFAB91',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fruitImage: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
  },
  fruitSeasonBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
    borderWidth: 2,
    borderColor: '#FFB74D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  fruitSeasonText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E65100',
    textTransform: 'uppercase',
  },
  fruitContent: {
    zIndex: 1,
    marginTop: 4,
  },
  fruitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fruitTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7043',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  fruitTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  fruitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#BF360C',
    marginBottom: 6,
    lineHeight: 19,
  },
  fruitVitaminRow: {
    marginBottom: 8,
  },
  fruitVitaminBadge: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  fruitVitaminText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E65100',
  },
  fruitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fruitPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  fruitPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D84315',
  },
  fruitUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FF8A65',
    marginLeft: 2,
  },
  fruitAddButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF7043',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fruitLeaf: {
    position: 'absolute',
    top: 8,
    left: 8,
    transform: [{ rotate: '-30deg' }],
  },
  
  // Poultry variant styles - Farm fresh chicken style
  poultryContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#C4635A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  poultryGradient: {
    padding: 14,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  poultryFeather1: {
    position: 'absolute',
    top: 15,
    right: 18,
    width: 20,
    height: 6,
    backgroundColor: 'rgba(220,38,38,0.12)',
    borderRadius: 10,
    transform: [{ rotate: '35deg' }],
  },
  poultryFeather2: {
    position: 'absolute',
    top: 28,
    right: 30,
    width: 16,
    height: 5,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderRadius: 8,
    transform: [{ rotate: '25deg' }],
  },
  poultryFeather3: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    width: 18,
    height: 5,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 9,
    transform: [{ rotate: '-20deg' }],
  },
  poultryWing1: {
    position: 'absolute',
    top: 45,
    right: 12,
    width: 25,
    height: 2,
    backgroundColor: 'rgba(185,28,28,0.1)',
    borderRadius: 1,
    transform: [{ rotate: '50deg' }],
  },
  poultryWing2: {
    position: 'absolute',
    bottom: 100,
    left: 12,
    width: 20,
    height: 2,
    backgroundColor: 'rgba(185,28,28,0.08)',
    borderRadius: 1,
    transform: [{ rotate: '-40deg' }],
  },
  poultryImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  poultryImageFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    padding: 4,
    shadowColor: '#C4635A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#D4736A',
  },
  poultryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  poultryFreshBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C4635A',
    gap: 4,
  },
  poultryFreshText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4635A',
  },
  poultryContent: {
    marginTop: 8,
  },
  poultryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  poultryTypeBadge: {
    backgroundColor: 'rgba(220,38,38,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  poultryTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
  },
  poultryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7F1D1D',
    marginBottom: 4,
    lineHeight: 20,
  },
  poultryFarmer: {
    fontSize: 11,
    color: '#C4635A',
    marginBottom: 10,
  },
  poultryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poultryPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  poultryPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#991B1B',
  },
  poultryUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C4635A',
    marginLeft: 2,
  },
  poultryAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C4635A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Eggs variant styles - Farmhouse nest
  eggsContainer: {
    width: 180,
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#B8956A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  eggsGradient: {
    padding: 14,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  eggsNestLine1: {
    position: 'absolute',
    top: 20,
    left: -10,
    width: 60,
    height: 3,
    backgroundColor: 'rgba(217,119,6,0.15)',
    borderRadius: 2,
    transform: [{ rotate: '25deg' }],
  },
  eggsNestLine2: {
    position: 'absolute',
    top: 35,
    left: -5,
    width: 50,
    height: 3,
    backgroundColor: 'rgba(217,119,6,0.1)',
    borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
  },
  eggsImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  eggsImageNest: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 3,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eggsImage: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
  },
  eggsFreshBadge: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  eggsFreshText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  eggsContent: {
    zIndex: 1,
    marginTop: 4,
  },
  eggsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eggsTypeBadge: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  eggsTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350F',
  },
  eggsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 2,
    lineHeight: 18,
  },
  eggsFarmer: {
    fontSize: 11,
    color: '#A16207',
    marginBottom: 8,
  },
  eggsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eggsPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  eggsPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400E',
  },
  eggsUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B45309',
    marginLeft: 2,
  },
  eggsAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C9A86A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Honey variant styles - Golden honeycomb
  honeyContainer: {
    width: 180,
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  honeyGradient: {
    padding: 14,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  honeyHexagon1: {
    position: 'absolute',
    top: -15,
    right: 20,
    width: 40,
    height: 46,
    backgroundColor: 'rgba(251,146,60,0.2)',
    borderRadius: 8,
    transform: [{ rotate: '30deg' }],
  },
  honeyHexagon2: {
    position: 'absolute',
    top: 15,
    right: -5,
    width: 30,
    height: 34,
    backgroundColor: 'rgba(251,146,60,0.15)',
    borderRadius: 6,
    transform: [{ rotate: '30deg' }],
  },
  honeyHexagon3: {
    position: 'absolute',
    bottom: 30,
    left: -10,
    width: 25,
    height: 28,
    backgroundColor: 'rgba(251,146,60,0.1)',
    borderRadius: 5,
    transform: [{ rotate: '30deg' }],
  },
  honeyImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  honeyImageJar: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 2,
    borderColor: '#FB923C',
  },
  honeyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  honeyPureBadge: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  honeyPureText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  honeyContent: {
    zIndex: 1,
    marginTop: 4,
  },
  honeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  honeyTypeBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  honeyTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  honeyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C2D12',
    marginBottom: 4,
    lineHeight: 18,
  },
  honeyOriginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  honeyOrigin: {
    fontSize: 11,
    color: '#65A30D',
    fontWeight: '600',
  },
  honeyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  honeyPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  honeyPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#9A3412',
  },
  honeyUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C2410C',
    marginLeft: 2,
  },
  honeyAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  honeyDrip: {
    position: 'absolute',
    bottom: -10,
    right: 30,
    width: 12,
    height: 20,
    backgroundColor: 'rgba(251,146,60,0.4)',
    borderRadius: 6,
  },
  
  // Herbs variant styles - Botanical aromatic
  herbsContainer: {
    width: 180,
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#5A8A6A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  herbsGradient: {
    padding: 14,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  herbsLeaf1: {
    position: 'absolute',
    top: 5,
    right: 10,
    transform: [{ rotate: '-45deg' }],
  },
  herbsLeaf2: {
    position: 'absolute',
    bottom: 40,
    left: 5,
    transform: [{ rotate: '30deg' }],
  },
  herbsImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  herbsImageFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  herbsImage: {
    width: '100%',
    height: '100%',
    borderRadius: 41,
  },
  herbsAromaBadge: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  herbsAromaText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
    textTransform: 'uppercase',
  },
  herbsContent: {
    zIndex: 1,
    marginTop: 4,
  },
  herbsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  herbsTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B9B7A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  herbsTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  herbsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14532D',
    marginBottom: 2,
    lineHeight: 18,
  },
  herbsFarmer: {
    fontSize: 11,
    color: '#15803D',
    marginBottom: 8,
  },
  herbsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  herbsPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  herbsPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#166534',
  },
  herbsUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#15803D',
    marginLeft: 2,
  },
  herbsAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B9B7A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tubers variant styles - Earthy purple
  tubersContainer: {
    width: 180,
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#9A7AB4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tubersGradient: {
    padding: 14,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  tubersEarthDot1: {
    position: 'absolute',
    top: 15,
    right: 25,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(147,51,234,0.2)',
  },
  tubersEarthDot2: {
    position: 'absolute',
    top: 40,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(147,51,234,0.15)',
  },
  tubersEarthDot3: {
    position: 'absolute',
    bottom: 50,
    left: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(147,51,234,0.1)',
  },
  tubersImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  tubersImageFrame: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  tubersImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  tubersHarvestBadge: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5D0FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  tubersHarvestText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7E22CE',
    textTransform: 'uppercase',
  },
  tubersContent: {
    zIndex: 1,
    marginTop: 4,
  },
  tubersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tubersTypeBadge: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tubersTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tubersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#581C87',
    marginBottom: 2,
    lineHeight: 18,
  },
  tubersFarmer: {
    fontSize: 11,
    color: '#7E22CE',
    marginBottom: 8,
  },
  tubersFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tubersPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tubersPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#6B21A8',
  },
  tubersUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9A7AB4',
    marginLeft: 2,
  },
  tubersAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Processed variant styles - Package style
  processedContainer: {
    width: 195,
    marginRight: 14,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  processedGradient: {
    padding: 14,
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  processedStripe1: {
    position: 'absolute',
    top: 0,
    left: 30,
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(124,58,237,0.06)',
  },
  processedStripe2: {
    position: 'absolute',
    top: 0,
    right: 40,
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(124,58,237,0.04)',
  },
  processedDot1: {
    position: 'absolute',
    top: 20,
    right: 25,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  processedDot2: {
    position: 'absolute',
    top: 50,
    left: 15,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  processedDot3: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(124,58,237,0.06)',
  },
  processedImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  processedImageBox: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  processedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  processedReadyBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  processedReadyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6D28D9',
    textTransform: 'uppercase',
  },
  processedContent: {
    zIndex: 1,
    marginTop: 4,
  },
  processedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  processedTypeBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  processedTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#44403C',
    marginBottom: 2,
    lineHeight: 18,
  },
  processedFarmer: {
    fontSize: 11,
    color: '#78716C',
    marginBottom: 10,
  },
  processedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  processedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  processedPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#5B21B6',
  },
  processedUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7C3AED',
    marginLeft: 2,
  },
  processedAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Seeds variant styles - Garden/nursery style
  seedsContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  seedsGradient: {
    padding: 14,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  seedsSoilLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#78350F',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  seedsSprout1: {
    position: 'absolute',
    bottom: 8,
    left: 20,
    alignItems: 'center',
  },
  seedsSproutStem: {
    width: 2,
    height: 18,
    backgroundColor: '#10B981',
  },
  seedsSproutLeaf1: {
    position: 'absolute',
    top: 0,
    left: -6,
    width: 8,
    height: 6,
    backgroundColor: '#34D399',
    borderRadius: 4,
    transform: [{ rotate: '-30deg' }],
  },
  seedsSproutLeaf2: {
    position: 'absolute',
    top: 2,
    right: -6,
    width: 8,
    height: 6,
    backgroundColor: '#34D399',
    borderRadius: 4,
    transform: [{ rotate: '30deg' }],
  },
  seedsSprout2: {
    position: 'absolute',
    bottom: 8,
    right: 25,
    alignItems: 'center',
  },
  seedsSproutStemSmall: {
    width: 2,
    height: 12,
    backgroundColor: '#10B981',
  },
  seedsSproutLeafSmall: {
    position: 'absolute',
    top: 0,
    left: -4,
    width: 6,
    height: 5,
    backgroundColor: '#6EE7B7',
    borderRadius: 3,
    transform: [{ rotate: '-20deg' }],
  },
  seedsDot1: {
    position: 'absolute',
    top: 20,
    right: 18,
    width: 6,
    height: 6,
    backgroundColor: 'rgba(4,120,87,0.2)',
    borderRadius: 3,
  },
  seedsDot2: {
    position: 'absolute',
    top: 35,
    right: 30,
    width: 4,
    height: 4,
    backgroundColor: 'rgba(4,120,87,0.15)',
    borderRadius: 2,
  },
  seedsDot3: {
    position: 'absolute',
    top: 50,
    left: 15,
    width: 5,
    height: 5,
    backgroundColor: 'rgba(4,120,87,0.18)',
    borderRadius: 2.5,
  },
  seedsDot4: {
    position: 'absolute',
    top: 28,
    left: 25,
    width: 4,
    height: 4,
    backgroundColor: 'rgba(4,120,87,0.12)',
    borderRadius: 2,
  },
  seedsImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  seedsImagePot: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    padding: 4,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#059669',
  },
  seedsImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  seedsPlantBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#047857',
    gap: 4,
  },
  seedsPlantText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  seedsContent: {
    marginTop: 8,
  },
  seedsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  seedsTypeBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  seedsTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  seedsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#064E3B',
    marginBottom: 4,
    lineHeight: 20,
  },
  seedsFarmer: {
    fontSize: 11,
    color: '#059669',
    marginBottom: 10,
  },
  seedsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seedsPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  seedsPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#047857',
  },
  seedsUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 2,
  },
  seedsAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Others variant styles - Versatile misc style
  othersContainer: {
    width: 190,
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  othersGradient: {
    padding: 14,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  othersGrid1: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 20,
    height: 1,
    backgroundColor: 'rgba(107,114,128,0.15)',
  },
  othersGrid2: {
    position: 'absolute',
    top: 22,
    right: 15,
    width: 15,
    height: 1,
    backgroundColor: 'rgba(107,114,128,0.12)',
  },
  othersGrid3: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    width: 18,
    height: 1,
    backgroundColor: 'rgba(107,114,128,0.1)',
  },
  othersGrid4: {
    position: 'absolute',
    bottom: 68,
    left: 12,
    width: 12,
    height: 1,
    backgroundColor: 'rgba(107,114,128,0.08)',
  },
  othersCornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(107,114,128,0.08)',
    borderBottomLeftRadius: 30,
  },
  othersImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  othersImageFrame: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 4,
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  othersImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  othersMiscBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    gap: 4,
  },
  othersMiscText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
  },
  othersContent: {
    marginTop: 8,
  },
  othersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  othersTypeBadge: {
    backgroundColor: 'rgba(107,114,128,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  othersTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  othersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 19,
  },
  othersFarmer: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 10,
  },
  othersFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  othersPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  othersPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
  },
  othersUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 2,
  },
  othersAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Nuts variant styles - Crunchy earthy style
  nutsContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#92400E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  nutsGradient: {
    padding: 14,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  nutsShape1: {
    position: 'absolute',
    top: 18,
    right: 20,
    width: 14,
    height: 10,
    backgroundColor: 'rgba(120,53,15,0.15)',
    borderRadius: 7,
    transform: [{ rotate: '20deg' }],
  },
  nutsShape2: {
    position: 'absolute',
    top: 35,
    right: 35,
    width: 10,
    height: 7,
    backgroundColor: 'rgba(120,53,15,0.12)',
    borderRadius: 5,
    transform: [{ rotate: '-15deg' }],
  },
  nutsShape3: {
    position: 'absolute',
    top: 25,
    left: 15,
    width: 12,
    height: 9,
    backgroundColor: 'rgba(120,53,15,0.1)',
    borderRadius: 6,
    transform: [{ rotate: '35deg' }],
  },
  nutsShape4: {
    position: 'absolute',
    bottom: 70,
    right: 12,
    width: 8,
    height: 6,
    backgroundColor: 'rgba(120,53,15,0.08)',
    borderRadius: 4,
  },
  nutsShape5: {
    position: 'absolute',
    bottom: 85,
    left: 20,
    width: 10,
    height: 7,
    backgroundColor: 'rgba(120,53,15,0.1)',
    borderRadius: 5,
    transform: [{ rotate: '-25deg' }],
  },
  nutsCrunch1: {
    position: 'absolute',
    top: 50,
    right: 18,
    width: 15,
    height: 2,
    backgroundColor: 'rgba(217,119,6,0.2)',
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  nutsCrunch2: {
    position: 'absolute',
    bottom: 95,
    left: 18,
    width: 12,
    height: 2,
    backgroundColor: 'rgba(217,119,6,0.15)',
    borderRadius: 1,
    transform: [{ rotate: '-30deg' }],
  },
  nutsImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  nutsImageBowl: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFBEB',
    padding: 4,
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#B45309',
  },
  nutsImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  nutsCrunchyBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#92400E',
    gap: 4,
  },
  nutsCrunchyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  nutsContent: {
    marginTop: 8,
  },
  nutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutsTypeBadge: {
    backgroundColor: 'rgba(146,64,14,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nutsTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
  },
  nutsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#451A03',
    marginBottom: 4,
    lineHeight: 20,
  },
  nutsFarmer: {
    fontSize: 11,
    color: '#92400E',
    marginBottom: 10,
  },
  nutsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutsPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  nutsPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#78350F',
  },
  nutsUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#92400E',
    marginLeft: 2,
  },
  nutsAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B45309',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Recommended variant styles - Clean modern card
  recommendedContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendedImageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  recommendedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  recommendedFavoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendedVerifiedBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#43A047',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendedContent: {
    padding: 12,
  },
  recommendedCategoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  recommendedCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  recommendedFarmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  recommendedFarmer: {
    fontSize: 11,
    flex: 1,
  },
  recommendedRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 3,
  },
  recommendedRating: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendedReviews: {
    fontSize: 11,
  },
  recommendedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    flex: 1,
  },
  recommendedPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  recommendedUnit: {
    fontSize: 11,
    marginLeft: 2,
  },
  recommendedAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Promoted variant styles - Sponsored/boosted with glow
  promotedContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 22,
    position: 'relative',
  },
  promotedGlowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#A855F7',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  promotedGradient: {
    padding: 14,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  promotedBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9A7AB4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
    gap: 4,
  },
  promotedBannerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  promotedSparkle1: {
    position: 'absolute',
    top: 40,
    left: 12,
  },
  promotedSparkle2: {
    position: 'absolute',
    bottom: 80,
    right: 15,
  },
  promotedImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
    position: 'relative',
  },
  promotedImageFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    padding: 4,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#C084FC',
  },
  promotedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  promotedBoostBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9A7AB4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  promotedContent: {
    marginTop: 4,
  },
  promotedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  promotedTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(147,51,234,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  promotedTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  promotedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#581C87',
    marginBottom: 4,
    lineHeight: 20,
  },
  promotedFarmer: {
    fontSize: 11,
    color: '#9A7AB4',
    marginBottom: 10,
  },
  promotedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promotedPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  promotedPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#6B21A8',
  },
  promotedUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9A7AB4',
    marginLeft: 2,
  },
  promotedAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9A7AB4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sponsored variant styles - Verified/Premium sellers
  sponsoredContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 22,
    position: 'relative',
  },
  sponsoredAdBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43A047',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sponsoredAdText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sponsoredGlowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D0',
  },
  sponsoredGradient: {
    padding: 14,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  sponsoredBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43A047',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
    gap: 4,
  },
  sponsoredBannerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sponsoredSparkle1: {
    position: 'absolute',
    top: 40,
    left: 12,
  },
  sponsoredSparkle2: {
    position: 'absolute',
    bottom: 80,
    right: 15,
  },
  sponsoredImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
    position: 'relative',
  },
  sponsoredImageFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D0',
  },
  sponsoredImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  sponsoredTrustBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#43A047',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sponsoredContent: {
    marginTop: 4,
  },
  sponsoredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sponsoredTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  sponsoredTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sponsoredTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 4,
    lineHeight: 20,
  },
  sponsoredFarmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  sponsoredFarmer: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  sponsoredRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  sponsoredRating: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  sponsoredSales: {
    fontSize: 10,
    color: '#94A3B8',
  },
  sponsoredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sponsoredPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sponsoredPrice: {
    fontSize: 17,
    fontWeight: '800',
  },
  sponsoredUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 2,
  },
  sponsoredAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // AdminProduct variant styles - Official/verified
  adminContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D0',
  },
  officialStoreBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43A047',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  officialStoreText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  adminGradient: {
    padding: 14,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  adminRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#43A047',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomRightRadius: 12,
    gap: 4,
  },
  adminRibbonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  adminCheck1: {
    position: 'absolute',
    top: 35,
    right: 15,
  },
  adminCheck2: {
    position: 'absolute',
    bottom: 90,
    left: 12,
  },
  adminImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
    position: 'relative',
  },
  adminImageFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0D0D0',
  },
  adminImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  adminVerifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#43A047',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  adminContent: {
    marginTop: 4,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  adminTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,145,178,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  adminTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0E7490',
  },
  adminTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#164E63',
    marginBottom: 4,
    lineHeight: 20,
  },
  adminFarmer: {
    fontSize: 11,
    color: '#6A9BAA',
    marginBottom: 4,
  },
  adminQualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  adminQualityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6A9BAA',
  },
  adminFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  adminPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E7490',
  },
  adminUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6A9BAA',
    marginLeft: 2,
  },
  adminAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#43A047',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Legumes variant styles - Earthy bean
  legumesContainer: {
    width: 195,
    marginRight: 14,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  legumesGradient: {
    padding: 14,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  legumesBean1: {
    position: 'absolute',
    top: 25,
    right: 20,
    width: 12,
    height: 8,
    backgroundColor: 'rgba(194,65,12,0.12)',
    borderRadius: 6,
    transform: [{ rotate: '25deg' }],
  },
  legumesBean2: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 10,
    height: 6,
    backgroundColor: 'rgba(194,65,12,0.1)',
    borderRadius: 5,
    transform: [{ rotate: '-15deg' }],
  },
  legumesBean3: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    width: 11,
    height: 7,
    backgroundColor: 'rgba(194,65,12,0.08)',
    borderRadius: 5,
    transform: [{ rotate: '10deg' }],
  },
  legumesPod1: {
    position: 'absolute',
    top: 60,
    left: 10,
    width: 25,
    height: 4,
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderRadius: 2,
    transform: [{ rotate: '-20deg' }],
  },
  legumesPod2: {
    position: 'absolute',
    bottom: 90,
    right: 15,
    width: 20,
    height: 3,
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  legumesImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  legumesImageFrame: {
    width: 95,
    height: 95,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 2,
    borderColor: '#FB923C',
  },
  legumesImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  legumesProteinBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  legumesProteinText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  legumesContent: {
    zIndex: 1,
    marginTop: 4,
  },
  legumesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  legumesTypeBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  legumesTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legumesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C2D12',
    marginBottom: 2,
    lineHeight: 18,
  },
  legumesFarmer: {
    fontSize: 11,
    color: '#C2410C',
    marginBottom: 10,
  },
  legumesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legumesPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  legumesPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#9A3412',
  },
  legumesUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#EA580C',
    marginLeft: 2,
  },
  legumesAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Oils variant styles - Golden bottle
  oilsContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  oilsGradient: {
    padding: 16,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  oilsDrip1: {
    position: 'absolute',
    top: 30,
    right: 20,
    width: 8,
    height: 20,
    backgroundColor: 'rgba(217,119,6,0.15)',
    borderRadius: 4,
    transform: [{ rotate: '5deg' }],
  },
  oilsDrip2: {
    position: 'absolute',
    top: 45,
    right: 35,
    width: 6,
    height: 15,
    backgroundColor: 'rgba(217,119,6,0.12)',
    borderRadius: 3,
    transform: [{ rotate: '-3deg' }],
  },
  oilsDrip3: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    width: 5,
    height: 12,
    backgroundColor: 'rgba(217,119,6,0.1)',
    borderRadius: 3,
  },
  oilsShine1: {
    position: 'absolute',
    top: 15,
    left: 25,
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    transform: [{ rotate: '-30deg' }],
  },
  oilsShine2: {
    position: 'absolute',
    top: 25,
    left: 35,
    width: 25,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    transform: [{ rotate: '-30deg' }],
  },
  oilsImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  oilsBottleFrame: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 2,
    borderColor: '#C9A86A',
  },
  oilsImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  oilsPurityBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  oilsPurityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  oilsContent: {
    zIndex: 1,
    marginTop: 4,
  },
  oilsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  oilsTypeBadge: {
    backgroundColor: '#B8956A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  oilsTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  oilsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 2,
    lineHeight: 18,
  },
  oilsFarmer: {
    fontSize: 11,
    color: '#B45309',
    marginBottom: 10,
  },
  oilsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oilsPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  oilsPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400E',
  },
  oilsUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B8956A',
    marginLeft: 2,
  },
  oilsAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B8956A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Seafood variant styles - Ocean fresh
  seafoodContainer: {
    width: 210,
    marginRight: 14,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  seafoodGradient: {
    padding: 16,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  seafoodWave1: {
    position: 'absolute',
    bottom: 80,
    left: -20,
    width: 100,
    height: 40,
    backgroundColor: 'rgba(14,165,233,0.08)',
    borderRadius: 50,
    transform: [{ rotate: '-10deg' }],
  },
  seafoodWave2: {
    position: 'absolute',
    bottom: 60,
    right: -30,
    width: 120,
    height: 50,
    backgroundColor: 'rgba(14,165,233,0.06)',
    borderRadius: 60,
    transform: [{ rotate: '5deg' }],
  },
  seafoodBubble1: {
    position: 'absolute',
    top: 20,
    right: 25,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(14,165,233,0.15)',
  },
  seafoodBubble2: {
    position: 'absolute',
    top: 40,
    right: 45,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(14,165,233,0.12)',
  },
  seafoodHairLine1: {
    position: 'absolute',
    top: 55,
    left: 10,
    width: 35,
    height: 1,
    backgroundColor: 'rgba(14,165,233,0.15)',
    transform: [{ rotate: '15deg' }],
  },
  seafoodHairLine2: {
    position: 'absolute',
    top: 75,
    left: 5,
    width: 25,
    height: 1,
    backgroundColor: 'rgba(14,165,233,0.12)',
    transform: [{ rotate: '10deg' }],
  },
  seafoodHairLine3: {
    position: 'absolute',
    bottom: 90,
    right: 15,
    width: 30,
    height: 1,
    backgroundColor: 'rgba(14,165,233,0.1)',
    transform: [{ rotate: '-12deg' }],
  },
  seafoodHairLine4: {
    position: 'absolute',
    bottom: 110,
    right: 25,
    width: 20,
    height: 1,
    backgroundColor: 'rgba(14,165,233,0.08)',
    transform: [{ rotate: '-8deg' }],
  },
  seafoodImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  seafoodImageFrame: {
    width: 110,
    height: 110,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 2,
    borderColor: '#7DD3FC',
  },
  seafoodImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  seafoodFreshBadge: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  seafoodFreshText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
  },
  seafoodContent: {
    zIndex: 1,
    marginTop: 4,
  },
  seafoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  seafoodTypeBadge: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  seafoodTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seafoodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C4A6E',
    marginBottom: 2,
    lineHeight: 18,
  },
  seafoodFarmer: {
    fontSize: 11,
    color: '#0369A1',
    marginBottom: 10,
  },
  seafoodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seafoodPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  seafoodPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#075985',
  },
  seafoodUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0284C7',
    marginLeft: 2,
  },
  seafoodAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Meat variant styles - Butcher shop premium
  meatContainer: {
    width: 200,
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#991B1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  meatGradient: {
    padding: 14,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  meatMarble1: {
    position: 'absolute',
    top: 20,
    right: -10,
    width: 60,
    height: 3,
    backgroundColor: 'rgba(153,27,27,0.1)',
    transform: [{ rotate: '-25deg' }],
    borderRadius: 2,
  },
  meatMarble2: {
    position: 'absolute',
    top: 45,
    right: 10,
    width: 40,
    height: 2,
    backgroundColor: 'rgba(153,27,27,0.08)',
    transform: [{ rotate: '-20deg' }],
    borderRadius: 1,
  },
  meatMarble3: {
    position: 'absolute',
    bottom: 60,
    left: -5,
    width: 50,
    height: 2,
    backgroundColor: 'rgba(153,27,27,0.06)',
    transform: [{ rotate: '15deg' }],
    borderRadius: 1,
  },
  meatImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  meatImageFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 3,
    borderColor: '#C4635A',
    position: 'relative',
  },
  meatImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  meatCutBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  meatCutText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#991B1B',
    textTransform: 'uppercase',
  },
  meatFavoriteBtn: {
    position: 'absolute',
    top: 0,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  meatContent: {
    zIndex: 1,
    marginTop: 4,
  },
  meatHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  meatTypeBadge: {
    backgroundColor: '#C4635A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  meatTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  meatTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7F1D1D',
    marginBottom: 2,
    lineHeight: 20,
    textAlign: 'center',
  },
  meatFarmer: {
    fontSize: 11,
    color: '#B91C1C',
    marginBottom: 10,
    textAlign: 'center',
  },
  meatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meatPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  meatPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#991B1B',
  },
  meatUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C4635A',
    marginLeft: 2,
  },
  meatAddButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C4635A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Livestock variant styles - Ranch style
  livestockContainer: {
    width: 210,
    marginRight: 16,
  },
  livestockCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
  },
  livestockFencePost1: {
    position: 'absolute',
    top: 0,
    left: 15,
    width: 6,
    height: 25,
    backgroundColor: '#92400E',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 10,
  },
  livestockFencePost2: {
    position: 'absolute',
    top: 0,
    right: 15,
    width: 6,
    height: 25,
    backgroundColor: '#92400E',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 10,
  },
  livestockFenceRail: {
    position: 'absolute',
    top: 12,
    left: 15,
    right: 15,
    height: 4,
    backgroundColor: '#B45309',
    borderRadius: 2,
    zIndex: 10,
  },
  livestockImageSection: {
    position: 'relative',
    height: 130,
    backgroundColor: '#FEF3C7',
  },
  livestockImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  livestockImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  livestockGrass1: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    width: 3,
    height: 12,
    backgroundColor: '#6B9B7A',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    transform: [{ rotate: '-15deg' }],
  },
  livestockGrass2: {
    position: 'absolute',
    bottom: 0,
    left: 18,
    width: 3,
    height: 15,
    backgroundColor: '#5A8A6A',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    transform: [{ rotate: '10deg' }],
  },
  livestockGrass3: {
    position: 'absolute',
    bottom: 0,
    right: 15,
    width: 3,
    height: 10,
    backgroundColor: '#6B9B7A',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    transform: [{ rotate: '5deg' }],
  },
  livestockFarmBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  livestockFarmText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  livestockFavoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  livestockContent: {
    padding: 12,
  },
  livestockTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  livestockTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  livestockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#451A03',
    marginBottom: 4,
    lineHeight: 20,
  },
  livestockFarmer: {
    fontSize: 11,
    color: '#92400E',
    marginBottom: 8,
  },
  livestockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livestockPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  livestockPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#78350F',
  },
  livestockUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A16207',
    marginLeft: 2,
  },
  livestockAddButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#B45309',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Beverages variant styles - Refreshing pink
  beveragesContainer: {
    width: 180,
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#B47A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  beveragesGradient: {
    padding: 14,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  beveragesBubble1: {
    position: 'absolute',
    top: 15,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(236,72,153,0.2)',
  },
  beveragesBubble2: {
    position: 'absolute',
    top: 35,
    right: 40,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(236,72,153,0.15)',
  },
  beveragesBubble3: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(236,72,153,0.1)',
  },
  beveragesImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  beveragesImageGlass: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderWidth: 2,
    borderColor: '#F9A8D4',
  },
  beveragesImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  beveragesRefreshBadge: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F9A8D4',
  },
  beveragesRefreshText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#BE185D',
    textTransform: 'uppercase',
  },
  beveragesContent: {
    zIndex: 1,
    marginTop: 4,
  },
  beveragesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  beveragesTypeBadge: {
    backgroundColor: '#C48A9A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  beveragesTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  beveragesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 2,
    lineHeight: 18,
  },
  beveragesFarmer: {
    fontSize: 11,
    color: '#BE185D',
    marginBottom: 8,
  },
  beveragesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  beveragesPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  beveragesPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#9D174D',
  },
  beveragesUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B47A8A',
    marginLeft: 2,
  },
  beveragesAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C48A9A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
