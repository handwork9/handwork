import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Ellipse, G, Defs, LinearGradient as SvgLinearGradient, Stop, ClipPath } from 'react-native-svg';
import { AuthStackParamList } from '../../types';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

// Farm Fresh Illustration - Fresh vegetables and produce
const FarmFreshIllustration = ({ size = 80, isDark = false }: { size?: number; isDark?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Defs>
      <SvgLinearGradient id="basketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D97706" />
        <Stop offset="100%" stopColor="#92400E" />
      </SvgLinearGradient>
      <SvgLinearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#22C55E" />
        <Stop offset="100%" stopColor="#15803D" />
      </SvgLinearGradient>
      <SvgLinearGradient id="tomatoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#B91C1C" />
      </SvgLinearGradient>
      <SvgLinearGradient id="carrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FB923C" />
        <Stop offset="100%" stopColor="#EA580C" />
      </SvgLinearGradient>
      <SvgLinearGradient id="cornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FCD34D" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    {/* Basket */}
    <Path d="M16 50 L20 70 L60 70 L64 50 L16 50Z" fill="url(#basketGrad)" />
    <Path d="M18 52 L14 50 L66 50 L62 52 L18 52Z" fill="#B45309" />
    {/* Basket weave lines */}
    <Path d="M22 55 L22 65" stroke="#92400E" strokeWidth="1.5" />
    <Path d="M32 55 L32 65" stroke="#92400E" strokeWidth="1.5" />
    <Path d="M42 55 L42 65" stroke="#92400E" strokeWidth="1.5" />
    <Path d="M52 55 L52 65" stroke="#92400E" strokeWidth="1.5" />
    <Path d="M18 58 L62 58" stroke="#92400E" strokeWidth="1" />
    <Path d="M19 63 L61 63" stroke="#92400E" strokeWidth="1" />
    {/* Tomato */}
    <Circle cx="28" cy="42" r="10" fill="url(#tomatoGrad)" />
    <Ellipse cx="28" cy="33" rx="3" ry="2" fill="#22C55E" />
    <Path d="M28 32 Q30 28 28 26" stroke="#15803D" strokeWidth="1.5" fill="none" />
    {/* Carrot */}
    <Path d="M48 28 L52 48 L48 48 L44 28Z" fill="url(#carrotGrad)" />
    <Path d="M46 26 Q48 22 50 26" stroke="#22C55E" strokeWidth="2" fill="none" />
    <Path d="M44 24 Q46 18 48 24" stroke="#22C55E" strokeWidth="2" fill="none" />
    <Path d="M48 24 Q50 18 52 24" stroke="#22C55E" strokeWidth="2" fill="none" />
    {/* Corn */}
    <Ellipse cx="62" cy="38" rx="6" ry="12" fill="url(#cornGrad)" />
    <Path d="M58 28 Q62 24 66 28" stroke="#22C55E" strokeWidth="2" fill="none" />
    <Path d="M60 26 Q62 22 64 26" stroke="#15803D" strokeWidth="1.5" fill="none" />
    {/* Leaf decoration */}
    <Path d="M18 38 Q12 30 20 28 Q18 36 18 38Z" fill="url(#leafGrad)" />
    <Path d="M38 32 Q36 24 42 26 Q38 32 38 32Z" fill="url(#leafGrad)" />
    {/* Ground shadow */}
    <Ellipse cx="40" cy="72" rx="26" ry="4" fill={isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"} />
  </Svg>
);

// Fast Delivery Illustration - Delivery scooter/bike
const FastDeliveryIllustration = ({ size = 80, isDark = false }: { size?: number; isDark?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Defs>
      <SvgLinearGradient id="scooterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#3B82F6" />
        <Stop offset="100%" stopColor="#1D4ED8" />
      </SvgLinearGradient>
      <SvgLinearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#22C55E" />
        <Stop offset="100%" stopColor="#15803D" />
      </SvgLinearGradient>
      <SvgLinearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4B5563" />
        <Stop offset="100%" stopColor="#1F2937" />
      </SvgLinearGradient>
    </Defs>
    {/* Speed lines */}
    <Path d="M8 35 L16 35" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <Path d="M4 42 L14 42" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <Path d="M6 49 L12 49" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    {/* Delivery Box */}
    <Rect x="32" y="20" width="22" height="18" rx="3" fill="url(#boxGrad)" />
    <Rect x="35" y="23" width="16" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
    <Path d="M43 28 L43 35" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
    <Path d="M39 31 L47 31" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
    {/* Box strap */}
    <Path d="M34 26 L30 30" stroke="#15803D" strokeWidth="2" />
    <Path d="M52 26 L56 30" stroke="#15803D" strokeWidth="2" />
    {/* Scooter body */}
    <Path d="M26 48 Q24 40 30 38 L54 38 Q60 38 58 48 L26 48Z" fill="url(#scooterGrad)" />
    <Path d="M30 38 L32 32 L36 32 L34 38" fill="#60A5FA" />
    {/* Seat */}
    <Ellipse cx="46" cy="38" rx="8" ry="3" fill="#1E40AF" />
    {/* Handlebar */}
    <Path d="M30 35 L28 28" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M24 26 L32 26" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    {/* Front Wheel */}
    <Circle cx="26" cy="56" r="10" fill="url(#wheelGrad)" />
    <Circle cx="26" cy="56" r="6" fill="#374151" />
    <Circle cx="26" cy="56" r="3" fill="#6B7280" />
    {/* Rear Wheel */}
    <Circle cx="56" cy="56" r="10" fill="url(#wheelGrad)" />
    <Circle cx="56" cy="56" r="6" fill="#374151" />
    <Circle cx="56" cy="56" r="3" fill="#6B7280" />
    {/* Fender */}
    <Path d="M16 52 Q26 44 36 52" stroke="#2563EB" strokeWidth="3" fill="none" />
    <Path d="M46 52 Q56 44 66 52" stroke="#2563EB" strokeWidth="3" fill="none" />
    {/* Ground shadow */}
    <Ellipse cx="40" cy="68" rx="28" ry="4" fill={isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"} />
  </Svg>
);

// Secure Payment Illustration - Shield with lock
const SecurePaymentIllustration = ({ size = 80, isDark = false }: { size?: number; isDark?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <Defs>
      <SvgLinearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F97316" />
        <Stop offset="100%" stopColor="#C2410C" />
      </SvgLinearGradient>
      <SvgLinearGradient id="shieldInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FDBA74" />
        <Stop offset="100%" stopColor="#FB923C" />
      </SvgLinearGradient>
      <SvgLinearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FCD34D" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
      <SvgLinearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8B5CF6" />
        <Stop offset="100%" stopColor="#6D28D9" />
      </SvgLinearGradient>
    </Defs>
    {/* Credit Card behind */}
    <G transform="rotate(-15, 40, 45)">
      <Rect x="12" y="50" width="36" height="24" rx="4" fill="url(#cardGrad)" />
      <Rect x="16" y="55" width="12" height="3" rx="1" fill="#A78BFA" />
      <Rect x="16" y="60" width="20" height="2" rx="1" fill="#C4B5FD" opacity="0.6" />
      <Rect x="16" y="64" width="8" height="6" rx="1" fill="#FCD34D" />
    </G>
    {/* Shield */}
    <Path 
      d="M40 8 L62 16 L62 38 Q62 58 40 70 Q18 58 18 38 L18 16 L40 8Z" 
      fill="url(#shieldGrad)" 
    />
    <Path 
      d="M40 14 L56 20 L56 38 Q56 54 40 64 Q24 54 24 38 L24 20 L40 14Z" 
      fill="url(#shieldInnerGrad)" 
    />
    {/* Lock body */}
    <Rect x="32" y="36" width="16" height="14" rx="3" fill="url(#lockGrad)" />
    {/* Lock shackle */}
    <Path 
      d="M35 36 L35 30 Q35 24 40 24 Q45 24 45 30 L45 36" 
      stroke="#F59E0B" 
      strokeWidth="3.5" 
      fill="none"
      strokeLinecap="round"
    />
    {/* Keyhole */}
    <Circle cx="40" cy="42" r="2.5" fill="#92400E" />
    <Rect x="39" y="43" width="2" height="4" rx="1" fill="#92400E" />
    {/* Checkmark sparkles */}
    <Path d="M56 24 L58 22 L60 26 L56 24Z" fill="#FCD34D" />
    <Path d="M20 28 L22 26 L24 30 L20 28Z" fill="#FCD34D" />
    <Circle cx="52" cy="14" r="2" fill="#FBBF24" opacity="0.8" />
    <Circle cx="28" cy="16" r="1.5" fill="#FBBF24" opacity="0.6" />
    {/* Ground shadow */}
    <Ellipse cx="40" cy="74" rx="20" ry="3" fill={isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"} />
  </Svg>
);

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const featuresFade = useRef(new Animated.Value(0)).current;
  const featuresSlide = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(20)).current;
  
  // Floating animation for decorative elements
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(featuresFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(featuresSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous floating animations
    const createFloatAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatAnimation(float1, 3000).start();
    createFloatAnimation(float2, 3500).start();
    createFloatAnimation(float3, 4000).start();
  }, []);

  const float1Translate = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const float2Translate = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const float3Translate = float3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark 
          ? ['#0A1F0D', '#0D1A0F', '#000000']
          : ['#F0FDF4', '#ECFDF5', '#FFFFFF']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      {/* Decorative Gradient Orbs */}
      <Animated.View 
        style={[
          styles.gradientOrb1,
          { transform: [{ translateY: float1Translate }] }
        ]}
      >
        <LinearGradient
          colors={isDark 
            ? ['rgba(74, 222, 128, 0.25)', 'rgba(34, 197, 94, 0.08)']
            : ['rgba(74, 222, 128, 0.35)', 'rgba(34, 197, 94, 0.1)']
          }
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View 
        style={[
          styles.gradientOrb2,
          { transform: [{ translateY: float2Translate }] }
        ]}
      >
        <LinearGradient
          colors={isDark 
            ? ['rgba(52, 211, 153, 0.2)', 'rgba(16, 185, 129, 0.05)']
            : ['rgba(52, 211, 153, 0.3)', 'rgba(16, 185, 129, 0.08)']
          }
          style={styles.orb}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
        
        {/* Logo & Title Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }, { scale: logoScale }],
            }
          ]}
        >
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.logoInner}>
                <MaterialCommunityIcons name="leaf" size={36} color="#FFFFFF" />
              </View>
            </LinearGradient>
            {/* Glow effect */}
            <View style={styles.logoGlow} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            Handwork
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,24,39,0.6)' }]}>
            Fresh produce, delivered to your door
          </Text>
        </Animated.View>

        {/* Features Section */}
        <Animated.View 
          style={[
            styles.featuresSection,
            {
              opacity: featuresFade,
              transform: [{ translateY: featuresSlide }],
            }
          ]}
        >
          {/* Feature Cards */}
          <View style={styles.featuresGrid}>
            <Animated.View style={[styles.featureCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', transform: [{ translateY: float1Translate }] }]}>
              <View style={styles.illustrationContainer}>
                <FarmFreshIllustration size={70} isDark={isDark} />
              </View>
              <Text style={[styles.featureTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Farm Fresh</Text>
              <Text style={[styles.featureDesc, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(17,24,39,0.5)' }]}>
                Sourced directly from local farmers
              </Text>
            </Animated.View>

            <Animated.View style={[styles.featureCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', transform: [{ translateY: float2Translate }] }]}>
              <View style={styles.illustrationContainer}>
                <FastDeliveryIllustration size={70} isDark={isDark} />
              </View>
              <Text style={[styles.featureTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Fast Delivery</Text>
              <Text style={[styles.featureDesc, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(17,24,39,0.5)' }]}>
                Same-day delivery to your location
              </Text>
            </Animated.View>

            <Animated.View style={[styles.featureCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', transform: [{ translateY: float3Translate }] }]}>
              <View style={styles.illustrationContainer}>
                <SecurePaymentIllustration size={70} isDark={isDark} />
              </View>
              <Text style={[styles.featureTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Secure Pay</Text>
              <Text style={[styles.featureDesc, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(17,24,39,0.5)' }]}>
                Multiple secure payment options
              </Text>
            </Animated.View>
          </View>

          {/* Stats Bar */}
          <View style={[styles.statsBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#22C55E' }]}>15K+</Text>
              <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(17,24,39,0.5)' }]}>Users</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#22C55E' }]}>500+</Text>
              <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(17,24,39,0.5)' }]}>Farmers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#22C55E' }]}>50K+</Text>
              <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(17,24,39,0.5)' }]}>Deliveries</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <Animated.View 
          style={[
            styles.bottomSection,
            {
              opacity: buttonsFade,
              transform: [{ translateY: buttonsSlide }],
            }
          ]}
        >
          {/* Get Started Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SignupRole')}
            style={styles.primaryButtonWrapper}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <View style={styles.buttonIconBg}>
                <Ionicons name="arrow-forward" size={18} color="#22C55E" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
            style={[styles.secondaryButton, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
          >
            <Text style={[styles.secondaryButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Sign In
            </Text>
          </TouchableOpacity>

          {/* Terms Text */}
          <Text style={[styles.termsText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(17,24,39,0.4)' }]}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientOrb1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
  },
  gradientOrb2: {
    position: 'absolute',
    top: height * 0.3,
    left: -150,
    width: 350,
    height: 350,
  },
  orb: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logoInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: -10,
    backgroundColor: '#22C55E',
    borderRadius: 24,
    opacity: 0.2,
    transform: [{ scaleX: 1.1 }, { scaleY: 1.2 }],
  },
  title: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    letterSpacing: 0.2,
  },
  featuresSection: {
    flex: 1,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  illustrationContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 15,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  bottomSection: {
    paddingTop: 20,
  },
  primaryButtonWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
    marginRight: 12,
  },
  buttonIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  termsText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#22C55E',
    fontFamily: FONTS.medium,
  },
});
