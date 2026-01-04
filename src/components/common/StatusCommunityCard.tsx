import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { StatusCommunityIllustration } from '../../assets/illustrations/hero';

interface StatusCommunityCardProps {
  storiesCount?: number;
  liveCount?: number;
  style?: object;
}

const StatusCommunityCard: React.FC<StatusCommunityCardProps> = ({
  storiesCount = 0,
  liveCount = 0,
  style,
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const totalActivity = storiesCount + liveCount;
  const hasNewContent = totalActivity > 0;
  const hasLive = liveCount > 0;

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const dotPulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const ringRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasNewContent) {
      // Pulse animation for the badge
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Glow animation for the card border
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );

      // Dot pulse animation
      const dotPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(dotPulseAnim, {
            toValue: 1.5,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dotPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

      // Shimmer effect
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      // Bounce animation for illustration
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      pulse.start();
      glow.start();
      dotPulse.start();
      shimmer.start();
      bounce.start();

      return () => {
        pulse.stop();
        glow.stop();
        dotPulse.stop();
        shimmer.stop();
        bounce.stop();
      };
    }
  }, [hasNewContent]);

  // Ring rotation animation for live content
  useEffect(() => {
    if (hasLive) {
      const rotate = Animated.loop(
        Animated.timing(ringRotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotate.start();
      return () => rotate.stop();
    }
  }, [hasLive]);

  const handlePress = () => {
    triggerHaptic();
    (navigation as any).navigate('SocialFeed');
  };

  const animatedShadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.5],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-400, 400],
  });

  const ringRotation = ringRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        hasNewContent && {
          shadowOpacity: animatedShadowOpacity,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isDark ? ['#581C87', '#4C1D95'] : ['#A855F7', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Background pattern */}
          <View style={styles.patternContainer}>
            <View style={[styles.patternCircle, styles.patternCircle1]} />
            <View style={[styles.patternCircle, styles.patternCircle2]} />
          </View>

          {/* Shimmer effect overlay */}
          {hasNewContent && (
            <Animated.View
              style={[
                styles.shimmerContainer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          )}

          <View style={styles.content}>
            <View style={styles.textContainer}>
              {hasNewContent && (
                <Animated.View 
                  style={[
                    styles.activityBadge,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <Animated.View 
                    style={[
                      styles.activityDot,
                      hasLive && styles.liveDot,
                      { transform: [{ scale: dotPulseAnim }] }
                    ]} 
                  />
                  <Text style={styles.activityText}>
                    {hasLive ? `${liveCount} Live` : `${totalActivity} New`}
                  </Text>
                </Animated.View>
              )}
              <Text style={styles.title}>Status & Community</Text>
              <Text style={styles.subtitle}>
                View stories, updates & connect with farmers
              </Text>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Explore</Text>
                <Ionicons name="arrow-forward" size={14} color="#7C3AED" />
              </View>
            </View>

            <Animated.View 
              style={[
                styles.illustrationContainer,
                hasNewContent && {
                  transform: [
                    { translateY: bounceAnim },
                    ...(hasLive ? [{ rotate: ringRotation }] : []),
                  ],
                },
              ]}
            >
              {/* Animated ring around illustration when live */}
              {hasLive && (
                <Animated.View 
                  style={[
                    styles.liveRing,
                    { transform: [{ rotate: ringRotation }] }
                  ]}
                />
              )}
              <StatusCommunityIllustration size={80} />
            </Animated.View>
          </View>

          {/* Live indicator badge */}
          {hasLive && (
            <Animated.View 
              style={[
                styles.liveBadge,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Animated.View 
                style={[
                  styles.liveBadgeDot,
                  { transform: [{ scale: dotPulseAnim }] }
                ]} 
              />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </Animated.View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  patternCircle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -20,
  },
  patternCircle2: {
    width: 80,
    height: 80,
    bottom: -30,
    left: -20,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  liveDot: {
    backgroundColor: '#EF4444',
  },
  activityText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  buttonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#7C3AED',
  },
  illustrationContainer: {
    marginLeft: 8,
    position: 'relative',
  },
  liveRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#EF4444',
    borderRightColor: '#F472B6',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
});

export default StatusCommunityCard;