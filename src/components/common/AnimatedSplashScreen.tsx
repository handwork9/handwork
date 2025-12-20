import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { 
  Path, 
  G, 
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationComplete?: () => void;
}

// Premium Handwork Logo - Modern leaf/hand abstract mark
const HandworkLogo = ({ size = 80 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
      </SvgLinearGradient>
      <SvgLinearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A5D6A7" />
        <Stop offset="100%" stopColor="#81C784" />
      </SvgLinearGradient>
    </Defs>
    
    {/* Abstract H mark with leaf element */}
    <G>
      {/* Left vertical stroke */}
      <Rect x="20" y="25" width="8" height="50" rx="4" fill="url(#logoGradient)" />
      
      {/* Right vertical stroke */}
      <Rect x="72" y="25" width="8" height="50" rx="4" fill="url(#logoGradient)" />
      
      {/* Horizontal connector */}
      <Rect x="20" y="46" width="60" height="8" rx="4" fill="url(#logoGradient)" />
      
      {/* Leaf accent */}
      <Path
        d="M50 15 Q65 20 70 35 Q65 40 50 38 Q35 40 30 35 Q35 20 50 15"
        fill="url(#accentGradient)"
      />
      <Path
        d="M50 18 L50 35"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M50 24 Q42 28 38 32"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M50 24 Q58 28 62 32"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        fill="none"
      />
    </G>
  </Svg>
);

// Animated ring component
const AnimatedRing = ({ 
  delay, 
  duration, 
  size, 
  opacity 
}: { 
  delay: number; 
  duration: number; 
  size: number; 
  opacity: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 2.5,
            duration: duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: opacity,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    />
  );
};

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
}) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const shimmerPosition = useRef(new Animated.Value(-1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Subtle glow pulse
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.6,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Shimmer effect
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerPosition, {
        toValue: 1,
        duration: 2500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    // Main animation sequence
    Animated.sequence([
      // 1. Logo appears with elegant scale and subtle rotation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),

      // Small pause
      Animated.delay(200),

      // 2. Decorative line expands
      Animated.timing(lineWidth, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),

      // 3. App name fades in
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),

      // 4. Tagline appears
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),

      // 5. Progress bar
      Animated.timing(progressOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),

      // 6. Hold briefly
      Animated.delay(200),

      // 7. Elegant fade out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete?.();
    });

    glowAnimation.start();
    shimmerAnimation.start();

    return () => {
      glowAnimation.stop();
      shimmerAnimation.stop();
    };
  }, []);

  const logoRotateStyle = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '0deg'],
  });

  const shimmerTranslate = shimmerPosition.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#1A1A1A', '#0D0D0D', '#000000']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Subtle background gradient overlay */}
        <View style={styles.gradientOverlay}>
          <LinearGradient
            colors={['transparent', 'rgba(46, 125, 50, 0.08)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
          />
        </View>

        {/* Animated rings */}
        <View style={styles.ringsContainer}>
          <AnimatedRing delay={0} duration={3000} size={120} opacity={0.1} />
          <AnimatedRing delay={1000} duration={3000} size={120} opacity={0.08} />
          <AnimatedRing delay={2000} duration={3000} size={120} opacity={0.06} />
        </View>

        {/* Main content */}
        <View style={styles.contentContainer}>
          {/* Logo with glow */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { rotate: logoRotateStyle },
                ],
              },
            ]}
          >
            {/* Glow effect */}
            <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
            
            {/* Logo border ring */}
            <View style={styles.logoBorder}>
              <HandworkLogo size={70} />
            </View>

            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </Animated.View>

          {/* Decorative line */}
          <Animated.View
            style={[
              styles.decorativeLine,
              {
                width: lineWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 60],
                }),
              },
            ]}
          />

          {/* App name */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.appName}>HANDWORK</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[
              styles.taglineContainer,
              {
                opacity: taglineOpacity,
                transform: [{ translateY: taglineTranslateY }],
              },
            ]}
          >
            <Text style={styles.tagline}>Farm to Table, Delivered</Text>
          </Animated.View>

          {/* Progress indicator */}
          <Animated.View style={[styles.progressContainer, { opacity: progressOpacity }]}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={['#2E7D32', '#4CAF50', '#66BB6A']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        {/* Bottom branding */}
        <Animated.View style={[styles.bottomBranding, { opacity: taglineOpacity }]}>
          <View style={styles.brandingDot} />
          <Text style={styles.brandingText}>Fresh • Local • Delivered</Text>
          <View style={styles.brandingDot} />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ringsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  logoBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    width: 60,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '20deg' }],
  },
  decorativeLine: {
    height: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.6)',
    marginBottom: 24,
    borderRadius: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
  },
  progressContainer: {
    width: width * 0.4,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1,
    overflow: 'hidden',
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(76, 175, 80, 0.6)',
  },
  brandingText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

export default AnimatedSplashScreen;
