import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { BuyerStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import RatingModal from '../../components/common/RatingModal';
import reviewService from '../../services/reviewService';

type Props = NativeStackScreenProps<BuyerStackParamList, 'OrderCompleted'>;

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#FFEB3B'];

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
}

export default function OrderCompletedScreen({ route, navigation }: Props) {
  const { orderId, orderNumber, total, farmerName } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showFarmerRating, setShowFarmerRating] = useState(false);
  const [showRiderRating, setShowRiderRating] = useState(false);
  const [hasRatedFarmer, setHasRatedFarmer] = useState(false);
  const [hasRatedRider, setHasRatedRider] = useState(false);

  // Check what can be rated
  const { data: ratingStatus } = useQuery({
    queryKey: ['canRate', orderId],
    queryFn: () => reviewService.canRateOrder(orderId),
  });

  useEffect(() => {
    // Create confetti pieces
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(-50),
        rotation: new Animated.Value(0),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 10 + 5,
      });
    }
    setConfetti(pieces);

    // Animate confetti
    pieces.forEach((piece, index) => {
      const delay = index * 30;
      Animated.parallel([
        Animated.timing(piece.y, {
          toValue: height + 50,
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Animate checkmark
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate content
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 500,
      delay: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const canRateFarmer = ratingStatus?.canRateFarmer && !hasRatedFarmer;
  const canRateRider = ratingStatus?.canRateRider && !hasRatedRider;
  const hasRider = ratingStatus?.hasRider;

  const handleRateFarmer = () => {
    setShowFarmerRating(true);
  };

  const handleRateRider = () => {
    setShowRiderRating(true);
  };

  const handleFarmerRatingSuccess = () => {
    setHasRatedFarmer(true);
  };

  const handleRiderRatingSuccess = () => {
    setHasRatedRider(true);
  };

  const handleDone = () => {
    navigation.navigate('BuyerTabs');
  };

  const handleOrderAgain = () => {
    navigation.navigate('BuyerTabs');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Confetti */}
      {confetti.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confetti,
            {
              width: piece.size,
              height: piece.size * 2,
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        {/* Success Checkmark */}
        <Animated.View
          style={[
            styles.checkmarkContainer,
            { transform: [{ scale: checkmarkScale }] },
          ]}
        >
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={64} color="#fff" />
          </View>
        </Animated.View>

        <Animated.View style={[styles.textContent, { opacity: contentOpacity }]}>
          <Text style={[styles.title, { color: colors.text }]}>Order Delivered! 🎉</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your fresh produce has arrived
          </Text>

          {/* Order Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Order Number</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>#{orderNumber}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Paid</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>₦{total?.toLocaleString()}</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.ratingTitle, { color: colors.text }]}>
              Rate Your Experience
            </Text>
            <Text style={[styles.ratingSubtitle, { color: colors.textSecondary }]}>
              Your feedback helps improve our service
            </Text>
            
            <View style={styles.ratingButtons}>
              {/* Rate Farmer Button */}
              {canRateFarmer ? (
                <TouchableOpacity
                  style={[styles.rateButton, { backgroundColor: '#E8F5E9' }]}
                  onPress={handleRateFarmer}
                >
                  <View style={[styles.rateButtonIcon, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name="leaf" size={24} color="#fff" />
                  </View>
                  <View style={styles.rateButtonContent}>
                    <Text style={[styles.rateButtonTitle, { color: colors.text }]}>
                      Rate {farmerName || 'Farmer'}
                    </Text>
                    <Text style={[styles.rateButtonSubtitle, { color: colors.textSecondary }]}>
                      Product quality & service
                    </Text>
                  </View>
                  <Ionicons name="star-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              ) : hasRatedFarmer || !ratingStatus?.canRateFarmer ? (
                <View style={[styles.ratedButton, { backgroundColor: colors.card, borderColor: COLORS.primary }]}>
                  <View style={[styles.rateButtonIcon, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  </View>
                  <Text style={[styles.ratedText, { color: COLORS.primary }]}>
                    Farmer Rated ✓
                  </Text>
                </View>
              ) : null}

              {/* Rate Rider Button */}
              {hasRider && (
                canRateRider ? (
                  <TouchableOpacity
                    style={[styles.rateButton, { backgroundColor: '#E3F2FD' }]}
                    onPress={handleRateRider}
                  >
                    <View style={[styles.rateButtonIcon, { backgroundColor: COLORS.accent }]}>
                      <Ionicons name="bicycle" size={24} color="#fff" />
                    </View>
                    <View style={styles.rateButtonContent}>
                      <Text style={[styles.rateButtonTitle, { color: colors.text }]}>
                        Rate Rider
                      </Text>
                      <Text style={[styles.rateButtonSubtitle, { color: colors.textSecondary }]}>
                        Delivery experience
                      </Text>
                    </View>
                    <Ionicons name="star-outline" size={24} color={COLORS.accent} />
                  </TouchableOpacity>
                ) : hasRatedRider || !ratingStatus?.canRateRider ? (
                  <View style={[styles.ratedButton, { backgroundColor: colors.card, borderColor: COLORS.accent }]}>
                    <View style={[styles.rateButtonIcon, { backgroundColor: COLORS.accent }]}>
                      <Ionicons name="checkmark" size={24} color="#fff" />
                    </View>
                    <Text style={[styles.ratedText, { color: COLORS.accent }]}>
                      Rider Rated ✓
                    </Text>
                  </View>
                ) : null
              )}
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity: contentOpacity }]}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleOrderAgain}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Order Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleDone}>
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Rating Modals */}
      <RatingModal
        visible={showFarmerRating}
        onClose={() => setShowFarmerRating(false)}
        orderId={orderId}
        type="farmer"
        recipientName={farmerName}
        onSuccess={handleFarmerRatingSuccess}
      />

      <RatingModal
        visible={showRiderRating}
        onClose={() => setShowRiderRating(false)}
        orderId={orderId}
        type="rider"
        onSuccess={handleRiderRatingSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  checkmarkContainer: {
    marginBottom: SPACING.lg,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  textContent: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.md,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  ratingCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  ratingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  ratingSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.lg,
  },
  ratingButtons: {
    width: '100%',
    gap: SPACING.md,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
  },
  rateButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateButtonContent: {
    flex: 1,
  },
  rateButtonTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  rateButtonSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  ratedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
    borderWidth: 2,
  },
  ratedText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
  },
});
