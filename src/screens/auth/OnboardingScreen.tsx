import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from '../../types';
import { COLORS, SPACING, FONTS, FONT_SIZES } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

// Modern Icon-based Illustration Components
const FreshProduceIllustration = ({ isDark }: { isDark: boolean }) => (
  <View style={illustrationStyles.container}>
    <View style={[illustrationStyles.circleOuter, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.08)' : 'rgba(76, 175, 80, 0.06)' }]}>
      <View style={[illustrationStyles.circleMiddle, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.12)' : 'rgba(76, 175, 80, 0.10)' }]}>
        <View style={[illustrationStyles.circleInner, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.18)' : 'rgba(76, 175, 80, 0.15)' }]}>
          <LinearGradient
            colors={['#66BB6A', '#43A047']}
            style={illustrationStyles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="fruit-cherries" size={64} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </View>
    </View>
    {/* Floating elements */}
    <View style={[illustrationStyles.floatingBadge, { top: 30, left: 20, backgroundColor: '#FF6B6B' }]}>
      <MaterialCommunityIcons name="leaf" size={20} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { top: 60, right: 15, backgroundColor: '#FFA726' }]}>
      <MaterialCommunityIcons name="fruit-citrus" size={18} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { bottom: 50, left: 30, backgroundColor: '#4CAF50' }]}>
      <MaterialCommunityIcons name="carrot" size={18} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { bottom: 30, right: 25, backgroundColor: '#9C27B0' }]}>
      <MaterialCommunityIcons name="fruit-grapes" size={18} color="#FFFFFF" />
    </View>
  </View>
);

const FastDeliveryIllustration = ({ isDark }: { isDark: boolean }) => (
  <View style={illustrationStyles.container}>
    <View style={[illustrationStyles.circleOuter, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.06)' }]}>
      <View style={[illustrationStyles.circleMiddle, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.12)' : 'rgba(33, 150, 243, 0.10)' }]}>
        <View style={[illustrationStyles.circleInner, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.18)' : 'rgba(33, 150, 243, 0.15)' }]}>
          <LinearGradient
            colors={['#42A5F5', '#1976D2']}
            style={illustrationStyles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="truck-fast" size={64} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </View>
    </View>
    {/* Floating elements */}
    <View style={[illustrationStyles.floatingBadge, { top: 25, left: 25, backgroundColor: '#4CAF50' }]}>
      <Ionicons name="time" size={18} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { top: 50, right: 20, backgroundColor: '#FF9800' }]}>
      <Ionicons name="location" size={18} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { bottom: 55, left: 20, backgroundColor: '#E91E63' }]}>
      <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { bottom: 35, right: 30, backgroundColor: '#00BCD4' }]}>
      <Ionicons name="navigate" size={18} color="#FFFFFF" />
    </View>
  </View>
);

const SecurePaymentIllustration = ({ isDark }: { isDark: boolean }) => (
  <View style={illustrationStyles.container}>
    <View style={[illustrationStyles.circleOuter, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.08)' : 'rgba(76, 175, 80, 0.06)' }]}>
      <View style={[illustrationStyles.circleMiddle, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.12)' : 'rgba(76, 175, 80, 0.10)' }]}>
        <View style={[illustrationStyles.circleInner, { backgroundColor: isDark ? 'rgba(76, 175, 80, 0.18)' : 'rgba(76, 175, 80, 0.15)' }]}>
          <LinearGradient
            colors={['#66BB6A', '#388E3C']}
            style={illustrationStyles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="shield-check" size={64} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </View>
    </View>
    {/* Floating elements */}
    <View style={[illustrationStyles.floatingBadge, { top: 30, left: 15, backgroundColor: '#2196F3' }]}>
      <Ionicons name="card" size={18} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { top: 55, right: 20, backgroundColor: '#FFC107' }]}>
      <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { bottom: 50, left: 25, backgroundColor: '#9C27B0' }]}>
      <MaterialCommunityIcons name="fingerprint" size={20} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { bottom: 30, right: 25, backgroundColor: '#4CAF50' }]}>
      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
    </View>
  </View>
);

const SupportFarmersIllustration = ({ isDark }: { isDark: boolean }) => (
  <View style={illustrationStyles.container}>
    <View style={[illustrationStyles.circleOuter, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.06)' }]}>
      <View style={[illustrationStyles.circleMiddle, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.12)' : 'rgba(255, 152, 0, 0.10)' }]}>
        <View style={[illustrationStyles.circleInner, { backgroundColor: isDark ? 'rgba(255, 152, 0, 0.18)' : 'rgba(255, 152, 0, 0.15)' }]}>
          <LinearGradient
            colors={['#FFB74D', '#F57C00']}
            style={illustrationStyles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="hand-holding-heart" size={56} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </View>
    </View>
    {/* Floating elements */}
    <View style={[illustrationStyles.floatingBadge, { top: 25, left: 20, backgroundColor: '#4CAF50' }]}>
      <MaterialCommunityIcons name="sprout" size={20} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { top: 60, right: 15, backgroundColor: '#E91E63' }]}>
      <Ionicons name="heart" size={18} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { bottom: 55, left: 25, backgroundColor: '#8BC34A' }]}>
      <MaterialCommunityIcons name="tractor" size={18} color="#FFFFFF" />
    </View>
    <View style={[illustrationStyles.floatingBadge, { bottom: 30, right: 20, backgroundColor: '#00BCD4' }]}>
      <Ionicons name="people" size={18} color="#FFFFFF" />
    </View>
  </View>
);

const illustrationStyles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleMiddle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 145,
    height: 145,
    borderRadius: 72.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  floatingBadge: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});

// Illustration prop type
type IllustrationProps = { isDark: boolean };

// Onboarding data
const ONBOARDING_DATA: Array<{
  id: string;
  title: string;
  description: string;
  Illustration: React.FC<IllustrationProps>;
  color: string;
}> = [
  {
    id: '1',
    title: 'Fresh from the Farm',
    description: 'Discover the freshest produce sourced directly from local farmers. Quality you can taste in every bite.',
    Illustration: FreshProduceIllustration,
    color: '#4CAF50',
  },
  {
    id: '2',
    title: 'Lightning Fast Delivery',
    description: 'Get your orders delivered to your doorstep in record time. Track your delivery in real-time.',
    Illustration: FastDeliveryIllustration,
    color: '#2196F3',
  },
  {
    id: '3',
    title: 'Safe & Secure Payments',
    description: 'Multiple payment options with bank-grade security. Your transactions are always protected.',
    Illustration: SecurePaymentIllustration,
    color: '#FF9800',
  },
  {
    id: '4',
    title: 'Support Local Farmers',
    description: 'Every purchase directly supports hardworking farmers in your community. Grow together.',
    Illustration: SupportFarmersIllustration,
    color: '#8BC34A',
  },
];

const ONBOARDING_KEY = '@handwork_onboarding_complete';

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollXNonNative = useRef(new Animated.Value(0)).current; // For width animations
  const slidesRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      navigation.replace('Welcome');
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      navigation.replace('Welcome');
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const renderItem = ({ item, index }: { item: typeof ONBOARDING_DATA[0]; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View
          style={[
            styles.illustrationContainer,
            {
              transform: [{ scale }, { translateY }],
              opacity,
            },
          ]}
        >
          <item.Illustration isDark={isDark} />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity, transform: [{ translateY }] }]}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>
            {item.description}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {ONBOARDING_DATA.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollXNonNative.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollXNonNative.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                  backgroundColor: COLORS.primary,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0D0D0D' : '#FFFFFF' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Skip button */}
      <Animated.View
        style={[
          styles.skipContainer,
          { paddingTop: insets.top + 10, opacity: fadeAnim },
        ]}
      >
        <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Slides */}
      <Animated.FlatList
        ref={slidesRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: true,
            listener: (event: any) => {
              scrollXNonNative.setValue(event.nativeEvent.contentOffset.x);
            },
          }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={16}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      />

      {/* Bottom section */}
      <Animated.View
        style={[
          styles.bottomContainer,
          { paddingBottom: insets.bottom + 20, opacity: fadeAnim },
        ]}
      >
        {renderPagination()}

        <TouchableOpacity
          style={styles.nextButton}
          onPress={scrollToNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === ONBOARDING_DATA.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentIndex === ONBOARDING_DATA.length - 1 && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={[styles.loginText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>
              Already have an account?{' '}
              <Text style={{ color: COLORS.primary, fontFamily: FONTS.semiBold }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: SPACING.lg,
  },
  skipButton: {
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  illustrationContainer: {
    width: 280,
    height: 280,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: SPACING.xl,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  nextButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  loginText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
});
