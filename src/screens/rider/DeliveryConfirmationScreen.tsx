import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic, triggerSuccessHaptic } from '../../utils/haptics';
import { formatCurrency } from '../../utils/formatters';
import { RiderStackParamList } from '../../types';
import { useAppDispatch } from '../../store';
import { fetchRiderEarnings, clearActiveDelivery } from '../../store/slices/riderSlice';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RiderStackParamList>;
type RouteProps = RouteProp<RiderStackParamList, 'DeliveryConfirmation'>;

// Confetti particle component
const ConfettiParticle: React.FC<{
  delay: number;
  startX: number;
  color: string;
}> = ({ delay, startX, color }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: startX + (Math.random() - 0.5) * 100,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: Math.random() * 10,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 10],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: spin },
          ],
          opacity,
        },
      ]}
    />
  );
};

export default function DeliveryConfirmationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { earnings, deliveryId } = route.params;

  // Animation values
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const earningsScale = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  // Confetti colors
  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  useEffect(() => {
    // Clear active delivery from Redux store
    dispatch(clearActiveDelivery());
    
    // Refresh earnings data
    dispatch(fetchRiderEarnings('today'));
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['active-delivery'] });
    queryClient.invalidateQueries({ queryKey: ['rider-earnings'] });
    queryClient.invalidateQueries({ queryKey: ['available-jobs'] });
    
    // Trigger success haptic
    triggerSuccessHaptic();

    // Animate checkmark
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Pulse animation
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
      ),
    ]).start();

    // Animate content
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(earningsScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // Animate stats
    setTimeout(() => {
      Animated.spring(statsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 700);
  }, []);

  const handleFindJobs = () => {
    triggerHaptic();
    navigation.navigate('RiderTabs', { screen: 'AvailableJobs' });
  };

  const handleViewEarnings = () => {
    triggerHaptic();
    navigation.navigate('RiderTabs', { screen: 'Earnings' });
  };

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    startX: Math.random() * width - width / 2,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Confetti Layer */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {confettiParticles.map((particle) => (
          <ConfettiParticle
            key={particle.id}
            delay={particle.delay}
            startX={particle.startX}
            color={particle.color}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#10B981', '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Animated Checkmark */}
            <Animated.View
              style={[
                styles.checkmarkContainer,
                {
                  transform: [
                    { scale: checkmarkScale },
                    { scale: pulseAnim },
                  ],
                  opacity: checkmarkOpacity,
                },
              ]}
            >
              <View style={styles.checkmarkCircle}>
                <Ionicons name="checkmark" size={56} color="#10B981" />
              </View>
            </Animated.View>

            {/* Success Text */}
            <Animated.View
              style={[
                styles.heroTextContainer,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslateY }],
                },
              ]}
            >
              <Text style={styles.heroTitle}>Delivery Complete! 🎉</Text>
              <Text style={styles.heroSubtitle}>
                Great job! You've successfully delivered the order
              </Text>
            </Animated.View>

            {/* Earnings Display */}
            <Animated.View
              style={[
                styles.earningsContainer,
                {
                  opacity: contentOpacity,
                  transform: [{ scale: earningsScale }],
                },
              ]}
            >
              <Text style={styles.earningsLabelHero}>You Earned</Text>
              <Text style={styles.earningsAmountHero}>
                {formatCurrency(earnings ?? 0)}
              </Text>
              <View style={styles.earningsBadge}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <Text style={styles.earningsBadgeText}>+12% bonus applied</Text>
              </View>
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: statsAnim,
              transform: [
                {
                  translateY: statsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Performance</Text>
          
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.card }]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.statIconBg}
              >
                <Ionicons name="star" size={24} color="#F59E0B" />
              </LinearGradient>
              <Text style={[styles.statValue, { color: colors.text }]}>4.9</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
              <View style={styles.statBadge}>
                <Ionicons name="arrow-up" size={10} color="#10B981" />
                <Text style={styles.statBadgeText}>0.2</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.card }]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.statIconBg}
              >
                <Ionicons name="bicycle" size={24} color="#3B82F6" />
              </LinearGradient>
              <Text style={[styles.statValue, { color: colors.text }]}>142</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Trips</Text>
              <View style={styles.statBadge}>
                <Ionicons name="add" size={10} color="#10B981" />
                <Text style={styles.statBadgeText}>1 today</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: colors.card }]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.statIconBg}
              >
                <Ionicons name="time" size={24} color="#10B981" />
              </LinearGradient>
              <Text style={[styles.statValue, { color: colors.text }]}>18m</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Time</Text>
              <View style={[styles.statBadge, styles.statBadgeNeutral]}>
                <Ionicons name="remove" size={10} color="#6B7280" />
                <Text style={[styles.statBadgeText, { color: '#6B7280' }]}>Same</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Achievement Card */}
        <Animated.View
          style={[
            styles.achievementCard,
            { backgroundColor: colors.card },
            {
              opacity: statsAnim,
              transform: [
                {
                  translateY: statsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.achievementIcon}
          >
            <Ionicons name="trophy" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.achievementContent}>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>
              Almost there! 🔥
            </Text>
            <Text style={[styles.achievementText, { color: colors.textSecondary }]}>
              8 more deliveries to reach Gold status
            </Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </Animated.View>

        {/* Rating Reminder */}
        <Animated.View
          style={[
            styles.reminderCard,
            {
              opacity: statsAnim,
              transform: [
                {
                  translateY: statsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.reminderIconContainer}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.reminderText}>
            The customer will rate their experience. Keep up the great work!
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: statsAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleFindJobs}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Find More Jobs</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.card }]}
            onPress={handleViewEarnings}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.secondaryButtonText, { color: COLORS.primary }]}>
              View Earnings
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 10,
  },
  confettiParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
  },
  heroSection: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  heroGradient: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  checkmarkContainer: {
    marginBottom: SPACING.lg,
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  heroTextContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  earningsContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
  },
  earningsLabelHero: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: SPACING.xs,
  },
  earningsAmountHero: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginTop: SPACING.sm,
    gap: 4,
  },
  earningsBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: '#059669',
  },
  statsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.small,
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
    gap: 2,
  },
  statBadgeNeutral: {
    backgroundColor: '#F3F4F6',
  },
  statBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#10B981',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  achievementText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    width: '85%',
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reminderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  reminderText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: '#1E40AF',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
