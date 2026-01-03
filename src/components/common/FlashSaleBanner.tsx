import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
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

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

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

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <View style={styles.timeBlock}>
      <View style={[styles.timeValue, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
        <Text style={styles.timeNumber}>{value.toString().padStart(2, '0')}</Text>
      </View>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.countdownContainer}>
      <TimeBlock value={timeLeft.hours} label="HRS" />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.minutes} label="MIN" />
      <Text style={styles.separator}>:</Text>
      <TimeBlock value={timeLeft.seconds} label="SEC" />
    </View>
  );
};

const ProgressBar = ({ sold, total }: { sold: number; total: number }) => {
  const percentage = Math.min((sold / total) * 100, 100);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (percentage > 80) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [percentage]);

  return (
    <Animated.View style={[styles.progressContainer, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={percentage > 80 ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${percentage}%` }]}
        />
      </View>
      <Text style={styles.progressText}>
        {percentage > 80 ? '🔥 Almost Gone!' : `${sold}/${total} Sold`}
      </Text>
    </Animated.View>
  );
};

export const FlashSaleCard: React.FC<FlashSaleCountdownProps> = ({ flashSale, onPress }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#EF4444', '#DC2626', '#B91C1C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.flashBadge}>
              <Ionicons name="flash" size={16} color="#FFF" />
              <Text style={styles.flashText}>FLASH SALE</Text>
            </View>
            <CountdownTimer endTime={flashSale.endTime} />
          </View>

          {/* Product Info */}
          <View style={styles.productRow}>
            <Image
              source={{ uri: flashSale.productImage || 'https://via.placeholder.com/80' }}
              style={styles.productImage}
              defaultSource={require('../../assets/placeholder.png')}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {flashSale.productTitle}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.salePrice}>₦{flashSale.salePrice.toLocaleString()}</Text>
                <Text style={styles.originalPrice}>₦{flashSale.originalPrice.toLocaleString()}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{flashSale.discountPercentage}%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Progress */}
          <ProgressBar sold={flashSale.soldCount} total={flashSale.stockLimit} />

          {/* CTA */}
          <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
            <Text style={styles.ctaText}>Grab Now</Text>
            <Ionicons name="arrow-forward" size={16} color="#EF4444" />
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
}

export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({
  flashSales,
  onSeeAll,
  onProductPress,
}) => {
  const { colors } = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;

  if (!flashSales || flashSales.length === 0) {
    return null;
  }

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
        snapToInterval={width - 40}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: width - 56, marginRight: 16 }}>
            <FlashSaleCard
              flashSale={item}
              onPress={() => onProductPress?.(item.productId)}
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flashText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFF',
    letterSpacing: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeNumber: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  timeLabel: {
    fontSize: 8,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  separator: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFF',
    marginHorizontal: 4,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#FFF',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salePrice: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  originalPrice: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
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
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#FFF',
    textAlign: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#EF4444',
  },
});

export default FlashSaleBanner;
