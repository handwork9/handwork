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
import { BuyerStackParamList } from '../../types';
import { COLORS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerSuccessHaptic } from '../../utils/haptics';

type Props = NativeStackScreenProps<BuyerStackParamList, 'OrderConfirmation'>;

const { width, height } = Dimensions.get('window');

// Subtle confetti colors matching iOS
const CONFETTI_COLORS = ['#34C759', '#5AC8FA', '#FF9F0A', '#FF375F', '#BF5AF2', '#64D2FF'];

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
    { text: 'Payment verified', icon: 'checkmark-circle' as const },
    { text: 'Creating order', icon: 'document-text-outline' as const },
    { text: 'Notifying farmer', icon: 'leaf-outline' as const },
    { text: 'All set!', icon: 'sparkles' as const },
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
          {/* iOS-style animated ring */}
          <View style={styles.loadingRingContainer}>
            <View style={[styles.loadingRingOuter, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            <Animated.View style={[styles.loadingRingProgress, { borderColor: COLORS.primary }]} />
            <View style={styles.loadingIconCenter}>
              <Ionicons name="bag-check" size={28} color={COLORS.primary} />
            </View>
          </View>

          {/* Processing steps - iOS style list */}
          <View style={styles.stepsContainer}>
            {processingSteps.map((step, index) => {
              const isActive = index === processingStep;
              const isCompleted = index < processingStep;
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.stepRow,
                    index < processingSteps.length - 1 && { 
                      borderBottomWidth: StyleSheet.hairlineWidth, 
                      borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' 
                    }
                  ]}
                >
                  <View style={[
                    styles.stepIconContainer,
                    { 
                      backgroundColor: isCompleted 
                        ? '#34C759'
                        : isActive 
                          ? isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.12)'
                          : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.06)'
                    }
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : (
                      <Ionicons 
                        name={step.icon} 
                        size={16} 
                        color={isActive ? '#34C759' : colors.textSecondary} 
                      />
                    )}
                  </View>
                  <Text style={[
                    styles.stepText,
                    { color: isCompleted || isActive ? colors.text : colors.textSecondary },
                    isActive && { fontWeight: '600' },
                  ]}>
                    {step.text}
                  </Text>
                  {isActive && <LoadingDots color={COLORS.primary} />}
                  {isCompleted && (
                    <Ionicons name="checkmark" size={18} color="#34C759" />
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
        {/* iOS-style Success checkmark */}
        <Animated.View style={[
          styles.checkContainer,
          {
            transform: [{ scale: checkScale }],
            opacity: checkOpacity,
          }
        ]}>
          <Animated.View style={[
            styles.checkCircle,
            { 
              transform: [{ scale: pulseAnim }],
              backgroundColor: '#34C759',
            }
          ]}>
            <Ionicons name="checkmark" size={56} color="#FFFFFF" />
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
            Order Placed!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            Your order is on its way to being prepared
          </Text>

          {/* iOS-style Order details card */}
          <View style={[styles.orderCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.orderCardHeader}>
              <View style={[styles.orderIconCircle, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)' }]}>
                <Ionicons name="receipt-outline" size={20} color="#34C759" />
              </View>
              <View style={styles.orderHeaderText}>
                <Text style={[styles.orderNumberLabel, { color: colors.textSecondary }]}>Order</Text>
                <Text style={[styles.orderNumberValue, { color: colors.text }]}>#{orderNumber}</Text>
              </View>
            </View>
            
            <View style={[styles.orderDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' }]} />
            
            <View style={styles.orderDetailsGrid}>
              <View style={styles.orderDetailItem}>
                <Text style={[styles.orderDetailLabel, { color: colors.textSecondary }]}>Items</Text>
                <Text style={[styles.orderDetailValue, { color: colors.text }]}>{itemCount}</Text>
              </View>
              <View style={[styles.orderDetailDividerV, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' }]} />
              <View style={styles.orderDetailItem}>
                <Text style={[styles.orderDetailLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.orderDetailValue, { color: '#34C759' }]}>₦{total.toLocaleString()}</Text>
              </View>
              <View style={[styles.orderDetailDividerV, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' }]} />
              <View style={styles.orderDetailItem}>
                <Text style={[styles.orderDetailLabel, { color: colors.textSecondary }]}>Payment</Text>
                <View style={styles.paymentBadge}>
                  <Ionicons 
                    name={paymentMethod === 'wallet' ? 'wallet-outline' : 'card-outline'} 
                    size={14} 
                    color={colors.primary} 
                  />
                </View>
              </View>
            </View>
            
            {estimatedDelivery && (
              <>
                <View style={[styles.orderDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(60,60,67,0.12)' }]} />
                <View style={styles.deliveryEstimate}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.deliveryEstimateText, { color: colors.textSecondary }]}>
                    Est. delivery: <Text style={{ color: colors.text, fontWeight: '600' }}>{estimatedDelivery}</Text>
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* iOS-style What's next steps */}
          <View style={[styles.nextStepsCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <Text style={[styles.nextStepsTitle, { color: colors.text }]}>What's Next</Text>
            
            <View style={styles.nextStepsList}>
              <View style={styles.nextStep}>
                <View style={[styles.nextStepNumber, { backgroundColor: '#34C759' }]}>
                  <Text style={styles.nextStepNumberText}>1</Text>
                </View>
                <View style={styles.nextStepContent}>
                  <Text style={[styles.nextStepText, { color: colors.text }]}>Farmer prepares your order</Text>
                </View>
              </View>
              
              <View style={[styles.nextStepLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60,60,67,0.1)' }]} />
              
              <View style={styles.nextStep}>
                <View style={[styles.nextStepNumber, { backgroundColor: '#5AC8FA' }]}>
                  <Text style={styles.nextStepNumberText}>2</Text>
                </View>
                <View style={styles.nextStepContent}>
                  <Text style={[styles.nextStepText, { color: colors.text }]}>Rider picks up & delivers</Text>
                </View>
              </View>
              
              <View style={[styles.nextStepLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60,60,67,0.1)' }]} />
              
              <View style={styles.nextStep}>
                <View style={[styles.nextStepNumber, { backgroundColor: '#FF9F0A' }]}>
                  <Text style={styles.nextStepNumberText}>3</Text>
                </View>
                <View style={styles.nextStepContent}>
                  <Text style={[styles.nextStepText, { color: colors.text }]}>Enjoy fresh produce!</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* iOS-style Buttons */}
        <Animated.View style={[
          styles.buttonContainer,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslate }],
            paddingBottom: insets.bottom + 16,
          }
        ]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: COLORS.primary }]}
            onPress={handleTrackOrder}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Track Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: isDark ? colors.card : 'rgba(60,60,67,0.06)' }]}
            onPress={handleContinueShopping}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Continue Shopping</Text>
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
const LoadingDots = ({ color = COLORS.primary }: { color?: string }) => {
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
            { backgroundColor: color },
            {
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [{
                scale: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
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
    paddingBottom: 24,
  },
  // Processing State - iOS Style
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  processingCard: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingRingContainer: {
    width: 72,
    height: 72,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRingOuter: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
  },
  loadingRingProgress: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  loadingIconCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsContainer: {
    width: '100%',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  stepIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
  },
  // Loading dots
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  // Success State - iOS Style
  checkContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  // Order Card - iOS Style
  orderCard: {
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  orderIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderHeaderText: {
    flex: 1,
  },
  orderNumberLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderNumberValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  orderDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  orderDetailsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  orderDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  orderDetailLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  orderDetailValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  orderDetailDividerV: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  paymentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  deliveryEstimateText: {
    fontSize: 14,
  },
  // What's Next - iOS Style
  nextStepsCard: {
    padding: 20,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  nextStepsList: {
    gap: 0,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nextStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextStepContent: {
    flex: 1,
  },
  nextStepText: {
    fontSize: 15,
    fontWeight: '500',
  },
  nextStepLine: {
    width: 2,
    height: 16,
    marginLeft: 13,
    borderRadius: 1,
  },
  // Buttons - iOS Style
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
