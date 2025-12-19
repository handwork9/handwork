import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { BuyerStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerSuccessHaptic } from '../../utils/haptics';

type Props = NativeStackScreenProps<BuyerStackParamList, 'OrderConfirmation'>;

const { width, height } = Dimensions.get('window');

// Confetti colors
const CONFETTI_COLORS = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#03A9F4'];

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'circle' | 'strip';
}

export default function OrderConfirmationScreen({ route, navigation }: Props) {
  const { orderId, orderNumber, total, itemCount, paymentMethod, estimatedDelivery } = route.params;
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Animation refs
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslate = useRef(new Animated.Value(20)).current;
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showProcessing, setShowProcessing] = useState(true);
  const [processingStep, setProcessingStep] = useState(0);

  const processingSteps = [
    { text: 'Payment verified', icon: 'card-outline' as const },
    { text: 'Creating your order', icon: 'receipt-outline' as const },
    { text: 'Notifying farmer', icon: 'notifications-outline' as const },
    { text: 'Order confirmed!', icon: 'checkmark-circle' as const },
  ];

  useEffect(() => {
    triggerSuccessHaptic();

    // Step through processing states
    const stepTimers: NodeJS.Timeout[] = [];
    processingSteps.forEach((_, index) => {
      const timer = setTimeout(() => {
        setProcessingStep(index);
        if (index === processingSteps.length - 1) {
          // Last step - show success
          setTimeout(() => {
            setShowProcessing(false);
            startSuccessAnimations();
          }, 800);
        }
      }, index * 700);
      stepTimers.push(timer);
    });

    return () => stepTimers.forEach(t => clearTimeout(t));
  }, []);

  const startSuccessAnimations = () => {
    // Create confetti
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 60; i++) {
      const shapes: ('square' | 'circle' | 'strip')[] = ['square', 'circle', 'strip'];
      pieces.push({
        id: i,
        x: new Animated.Value(width / 2 + (Math.random() - 0.5) * 100),
        y: new Animated.Value(height / 3),
        rotation: new Animated.Value(0),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 12 + 6,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }
    setConfetti(pieces);

    // Animate confetti explosion
    pieces.forEach((piece, index) => {
      const angle = (Math.PI * 2 * index) / pieces.length + Math.random() * 0.5;
      const distance = 150 + Math.random() * 200;
      const targetX = width / 2 + Math.cos(angle) * distance;
      const targetY = height + 100;

      Animated.parallel([
        Animated.sequence([
          Animated.timing(piece.x, {
            toValue: width / 2 + Math.cos(angle) * (distance * 0.3),
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(piece.x, {
            toValue: targetX,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(piece.y, {
          toValue: targetY,
          duration: 2700,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotation, {
          toValue: 720 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2700,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Animate checkmark
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for check circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate content
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate buttons
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonTranslate, {
        toValue: 0,
        duration: 400,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTrackOrder = () => {
    navigation.replace('OrderTracking', { orderId });
  };

  const handleContinueShopping = () => {
    navigation.navigate('BuyerTabs');
  };

  const renderConfetti = () => {
    return confetti.map((piece) => {
      const style = {
        position: 'absolute' as const,
        zIndex: 999,
        elevation: 999,
        width: piece.shape === 'strip' ? piece.size * 0.4 : piece.size,
        height: piece.shape === 'strip' ? piece.size * 2 : piece.size,
        backgroundColor: piece.color,
        borderRadius: piece.shape === 'circle' ? piece.size / 2 : piece.shape === 'strip' ? 2 : 3,
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
      };
      return <Animated.View key={piece.id} style={style} pointerEvents="none" />;
    });
  };

  const renderProcessingState = () => {
    return (
      <View style={styles.processingContainer}>
        <View style={[styles.processingCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {/* Loading spinner */}
          <View style={styles.loadingContainer}>
            <Animated.View style={styles.spinnerOuter}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.spinnerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
          </View>

          {/* Processing steps */}
          <View style={styles.stepsContainer}>
            {processingSteps.map((step, index) => {
              const isActive = index === processingStep;
              const isCompleted = index < processingStep;
              
              return (
                <View key={index} style={styles.stepRow}>
                  <View style={[
                    styles.stepIconContainer,
                    isCompleted && styles.stepIconCompleted,
                    isActive && styles.stepIconActive,
                    { 
                      backgroundColor: isCompleted 
                        ? COLORS.primary 
                        : isActive 
                          ? isDark ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9'
                          : isDark ? colors.surface : '#F5F5F5'
                    }
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                      <Ionicons 
                        name={step.icon} 
                        size={18} 
                        color={isActive ? COLORS.primary : colors.textSecondary} 
                      />
                    )}
                  </View>
                  <Text style={[
                    styles.stepText,
                    { color: isActive || isCompleted ? colors.text : colors.textSecondary },
                    isActive && styles.stepTextActive,
                  ]}>
                    {step.text}
                  </Text>
                  {isActive && (
                    <View style={styles.stepLoadingDots}>
                      <LoadingDots />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderSuccessState = () => {
    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Success checkmark */}
        <Animated.View style={[
          styles.checkContainer,
          {
            transform: [{ scale: checkScale }],
            opacity: checkOpacity,
          }
        ]}>
          <Animated.View style={[
            styles.checkCircle,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.checkGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark" size={60} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Content */}
        <Animated.View style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
          }
        ]}>
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Order Confirmed!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Thank you for your order. We're getting it ready for you.
          </Text>

          {/* Order details card */}
          <View style={[styles.orderCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>Order Number</Text>
              <Text style={[styles.orderValue, { color: colors.text }]}>#{orderNumber}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]} />
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>Items</Text>
              <Text style={[styles.orderValue, { color: colors.text }]}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]} />
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>Total Paid</Text>
              <Text style={[styles.orderValueHighlight, { color: COLORS.primary }]}>₦{total.toLocaleString()}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]} />
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>Payment</Text>
              <View style={styles.paymentBadge}>
                <Ionicons 
                  name={paymentMethod === 'wallet' ? 'wallet' : 'card'} 
                  size={14} 
                  color={COLORS.primary} 
                />
                <Text style={[styles.paymentText, { color: COLORS.primary }]}>
                  {paymentMethod === 'wallet' ? 'Wallet' : 'Card'}
                </Text>
              </View>
            </View>
            {estimatedDelivery && (
              <>
                <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]} />
                <View style={styles.orderRow}>
                  <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>Est. Delivery</Text>
                  <Text style={[styles.orderValue, { color: colors.text }]}>{estimatedDelivery}</Text>
                </View>
              </>
            )}
          </View>

          {/* What's next section */}
          <View style={[styles.nextStepsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.nextStepsTitle, { color: colors.text }]}>What happens next?</Text>
            <View style={styles.nextStep}>
              <View style={[styles.nextStepIcon, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : '#E8F5E9' }]}>
                <Ionicons name="storefront-outline" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.nextStepContent}>
                <Text style={[styles.nextStepText, { color: colors.text }]}>Farmer prepares your order</Text>
                <Text style={[styles.nextStepSubtext, { color: colors.textSecondary }]}>Fresh from the farm</Text>
              </View>
            </View>
            <View style={styles.nextStep}>
              <View style={[styles.nextStepIcon, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD' }]}>
                <Ionicons name="bicycle-outline" size={20} color="#2196F3" />
              </View>
              <View style={styles.nextStepContent}>
                <Text style={[styles.nextStepText, { color: colors.text }]}>Rider picks up & delivers</Text>
                <Text style={[styles.nextStepSubtext, { color: colors.textSecondary }]}>Track in real-time</Text>
              </View>
            </View>
            <View style={styles.nextStep}>
              <View style={[styles.nextStepIcon, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.2)' : '#FFF3E0' }]}>
                <Ionicons name="happy-outline" size={20} color="#FF9800" />
              </View>
              <View style={styles.nextStepContent}>
                <Text style={[styles.nextStepText, { color: colors.text }]}>Enjoy your fresh produce!</Text>
                <Text style={[styles.nextStepSubtext, { color: colors.textSecondary }]}>Rate your experience</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[
          styles.buttonContainer,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslate }],
            paddingBottom: insets.bottom + SPACING.md,
          }
        ]}>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={handleTrackOrder}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.trackButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              <Text style={styles.trackButtonText}>Track My Order</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: isDark ? colors.card : '#F5F5F5' }]}
            onPress={handleContinueShopping}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueButtonText, { color: colors.text }]}>Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {showProcessing ? renderProcessingState() : renderSuccessState()}
      {/* Confetti overlay - rendered on top of everything */}
      {!showProcessing && <View style={styles.confettiContainer} pointerEvents="none">{renderConfetti()}</View>}
    </View>
  );
}

// Loading dots component
const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [{
                scale: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.3],
                }),
              }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  processingCard: {
    width: '100%',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingContainer: {
    width: 80,
    height: 80,
    marginBottom: SPACING.xl,
  },
  spinnerOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  spinnerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepIconActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  stepText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  stepTextActive: {
    fontFamily: FONTS.semiBold,
  },
  stepLoadingDots: {
    marginLeft: SPACING.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  checkContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  checkGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  successSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  orderCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  orderLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  orderValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  orderValueHighlight: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: BORDER_RADIUS.md,
  },
  paymentText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  nextStepsCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  nextStepsTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  nextStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextStepContent: {
    flex: 1,
  },
  nextStepText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: 2,
  },
  nextStepSubtext: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  trackButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  trackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md + 2,
  },
  trackButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  continueButton: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
});
