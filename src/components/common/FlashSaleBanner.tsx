import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface FlashSaleItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  soldCount: number;
  stockLimit: number;
  startTime: string;
  endTime: string;
}

interface FlashSaleCountdownProps {
  flashSale: FlashSaleItem;
  onPress?: () => void;
}

const CountdownTimer = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tickAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for urgency
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      // Tick animation on each second
      Animated.sequence([
        Animated.timing(tickAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(tickAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => {
    const scale = tickAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.1],
    });
    
    return (
      <View style={styles.timeBlock}>
        <Animated.View style={[styles.timeValue, { backgroundColor: 'rgba(0,0,0,0.3)', transform: [{ scale }] }]}>
          <Text style={styles.timeNumber}>{value.toString().padStart(2, '0')}</Text>
        </Animated.View>
        <Text style={styles.timeLabel}>{label}</Text>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.countdownContainer, { transform: [{ scale: pulseAnim }] }]}>
      <TimeBlock value={timeLeft.hours} label="HRS" />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.minutes} label="MIN" />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.seconds} label="SEC" />
    </Animated.View>
  );
};

const ProgressBar = ({ sold, total }: { sold: number; total: number }) => {
  const safeSold = sold || 0;
  const safeTotal = total || 1;
  const percentage = Math.min((safeSold / safeTotal) * 100, 100);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const fireAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar width on mount
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (percentage > 70) {
      // Pulse animation for urgency
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();

      // Fire icon animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(fireAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [percentage]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const fireScale = fireAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const remaining = safeTotal - safeSold;
  const isAlmostGone = percentage > 80;
  const isHot = percentage > 50;

  return (
    <Animated.View style={[styles.progressContainer, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.progressBar}>
        <Animated.View style={{ width: animatedWidth, height: '100%' }}>
          <LinearGradient
            colors={isAlmostGone ? ['#FF6B6B', '#EF4444', '#DC2626'] : isHot ? ['#F59E0B', '#EF4444'] : ['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </Animated.View>
        {/* Shimmer effect */}
        <Animated.View style={[styles.shimmer, { left: animatedWidth }]} />
      </View>
      <View style={styles.progressLabelRow}>
        {isAlmostGone ? (
          <View style={styles.urgentLabel}>
            <Animated.View style={{ transform: [{ scale: fireScale }] }}>
              <Text style={styles.fireEmoji}>🔥</Text>
            </Animated.View>
            <Text style={styles.urgentText}>Only {remaining} left!</Text>
          </View>
        ) : (
          <Text style={styles.progressText}>{safeSold} sold</Text>
        )}
        <Text style={styles.stockText}>{remaining} remaining</Text>
      </View>
    </Animated.View>
  );
};

export const FlashSaleCard: React.FC<FlashSaleCountdownProps> = ({ flashSale, onPress }) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Safe values with fallbacks
  const salePrice = flashSale.salePrice || 0;
  const originalPrice = flashSale.originalPrice || 0;
  const discountPercentage = flashSale.discountPercentage || 0;
  const soldCount = flashSale.soldCount || 0;
  const stockLimit = flashSale.stockLimit || 1;
  const savings = originalPrice - salePrice;

  useEffect(() => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Flash icon animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const flashScale = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Outer glow effect */}
        <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />
        
        <LinearGradient
          colors={['#FF6B6B', '#EF4444', '#DC2626', '#B91C1C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Decorative elements */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.flashBadge}>
              <Animated.View style={{ transform: [{ scale: flashScale }] }}>
                <Ionicons name="flash" size={18} color="#FFD700" />
              </Animated.View>
              <Text style={styles.flashText}>FLASH SALE</Text>
              <View style={styles.liveDotSmall} />
            </View>
            <CountdownTimer endTime={flashSale.endTime} />
          </View>

          {/* Product Info */}
          <View style={styles.productRow}>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: flashSale.productImage || 'https://via.placeholder.com/80' }}
                style={styles.productImage}
              />
              {/* Discount badge on image */}
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>-{discountPercentage}%</Text>
              </View>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {flashSale.productTitle || 'Flash Sale Product'}
              </Text>
              <View style={styles.priceSection}>
                <Text style={styles.salePrice}>₦{salePrice.toLocaleString()}</Text>
                <View style={styles.priceDetails}>
                  <Text style={styles.originalPrice}>₦{originalPrice.toLocaleString()}</Text>
                  <View style={styles.savingsBadge}>
                    <Ionicons name="pricetag" size={10} color="#059669" />
                    <Text style={styles.savingsText}>Save ₦{savings.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Progress */}
          <ProgressBar sold={soldCount} total={stockLimit} />

          {/* CTA */}
          <TouchableOpacity style={styles.ctaButton} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
              colors={['#FFF', '#F9FAFB']}
              style={styles.ctaGradient}
            >
              <Ionicons name="cart" size={18} color="#EF4444" />
              <Text style={styles.ctaText}>Grab This Deal</Text>
              <Ionicons name="arrow-forward" size={16} color="#EF4444" />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface FlashSaleBannerProps {
  flashSales: FlashSaleItem[];
  onSeeAll?: () => void;
  onProductPress?: (productId: string) => void;
  onSalePress?: (saleId: string) => void;
}

export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({
  flashSales,
  onSeeAll,
  onProductPress,
  onSalePress,
}) => {
  const { colors } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;

  if (!flashSales || flashSales.length === 0) {
    return null;
  }

  const handlePress = (item: FlashSaleItem) => {
    // Prefer navigating to flash sale detail if handler provided
    if (onSalePress) {
      onSalePress(item.id);
    } else if (onProductPress) {
      onProductPress(item.productId);
    }
  };

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerHeader}>
        <View style={styles.bannerTitleRow}>
          <Ionicons name="flash" size={24} color="#EF4444" />
          <Text style={[styles.bannerTitle, { color: colors.text }]}>Flash Sales</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        data={flashSales}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width - 16}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        renderItem={({ item }) => (
          <View style={{ width: width - 32, marginRight: 16 }}>
            <FlashSaleCard
              flashSale={item}
              onPress={() => handlePress(item)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    marginVertical: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginLeft: 4,
  },
  liveText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#EF4444',
  },
  seeAll: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#EF4444',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    backgroundColor: '#EF4444',
    zIndex: -1,
  },
  cardGradient: {
    padding: 16,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  flashText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  timeLabel: {
    fontSize: 7,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  separator: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.8)',
    marginHorizontal: 2,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  imageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#FFF',
  },
  imageBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  imageBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#92400E',
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceSection: {
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salePrice: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  originalPrice: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  savingsText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: '#059669',
  },
  discountBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#92400E',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fireEmoji: {
    fontSize: 14,
  },
  urgentText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#FEF08A',
  },
  progressText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  stockText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.7)',
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#EF4444',
  },
});

export default FlashSaleBanner;
