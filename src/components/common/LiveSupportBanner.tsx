import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { LiveSupportIllustration } from '../../assets/illustrations/hero';
import { triggerHaptic } from '../../utils/haptics';

interface LiveSupportBannerProps {
  variant?: 'full' | 'compact' | 'minimal';
  onPress?: () => void;
  style?: object;
}

const LiveSupportBanner: React.FC<LiveSupportBannerProps> = ({
  variant = 'full',
  onPress,
  style,
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePress = () => {
    triggerHaptic();
    if (onPress) {
      onPress();
    } else {
      (navigation as any).navigate('LiveChat');
    }
  };

  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        style={[
          styles.minimalContainer, 
          { 
            backgroundColor: isDark ? '#1E3A5F' : '#DBEAFE',
            borderWidth: isDark ? 0 : 1.5,
            borderColor: isDark ? 'transparent' : '#93C5FD',
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.15,
            shadowRadius: 4,
            elevation: isDark ? 0 : 3,
          }, 
          style
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.minimalContent}>
          <Animated.View style={[styles.onlineDot, { transform: [{ scale: pulseAnim }] }]} />
          <View style={[styles.minimalIconContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#3B82F6' }]}>
            <Ionicons name="chatbubbles" size={16} color={isDark ? '#3B82F6' : '#FFFFFF'} />
          </View>
          <View>
            <Text style={[styles.minimalTitle, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
              Live Support
            </Text>
            <Text style={[styles.minimalSubtitle, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>
              Available 24/7
            </Text>
          </View>
        </View>
        <View style={[styles.minimalButton, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#3B82F6' }]}>
          <Text style={[styles.minimalButtonText, { color: isDark ? '#60A5FA' : '#FFFFFF' }]}>Chat</Text>
          <Ionicons name="arrow-forward" size={14} color={isDark ? '#60A5FA' : '#FFFFFF'} />
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer, 
          {
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.25,
            shadowRadius: 8,
            elevation: 6,
          },
          style
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isDark ? ['#1E3A8A', '#1E40AF'] : ['#3B82F6', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactGradient}
        >
          <View style={styles.compactLeft}>
            <View style={styles.compactIconContainer}>
              <Ionicons name="headset" size={24} color="#FFF" />
              <Animated.View style={[styles.onlineDotSmall, { transform: [{ scale: pulseAnim }] }]} />
            </View>
            <View style={styles.compactTextContainer}>
              <Text style={styles.compactTitle}>Need Help?</Text>
              <Text style={styles.compactSubtitle}>Chat with our support team</Text>
            </View>
          </View>
          <View style={styles.compactButton}>
            <Text style={styles.compactButtonText}>Chat</Text>
            <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Full variant (default)
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={isDark ? ['#1E3A8A', '#1E40AF', '#1D4ED8'] : ['#3B82F6', '#2563EB', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background pattern */}
        <View style={styles.patternContainer}>
          <View style={[styles.patternCircle, styles.patternCircle1]} />
          <View style={[styles.patternCircle, styles.patternCircle2]} />
          <View style={[styles.patternCircle, styles.patternCircle3]} />
        </View>

        <View style={styles.content}>
          <View style={styles.textContainer}>
            {/* Online badge */}
            <View style={styles.onlineBadge}>
              <Animated.View style={[styles.onlineDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.onlineText}>Online Now</Text>
            </View>
            
            <Text style={styles.title}>Live Support Chat</Text>
            <Text style={styles.subtitle}>
              Get instant help from our support team 24/7
            </Text>
            
            <View style={styles.button}>
              <Text style={styles.buttonText}>Start Chat</Text>
              <Ionicons name="chatbubble-ellipses" size={16} color="#3B82F6" />
            </View>
          </View>

          <View style={styles.illustrationContainer}>
            <LiveSupportIllustration size={90} />
          </View>
        </View>

        {/* Features row */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={14} color="#FCD34D" />
            <Text style={styles.featureText}>Quick Response</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Ionicons name="time" size={14} color="#FCD34D" />
            <Text style={styles.featureText}>24/7 Available</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={14} color="#FCD34D" />
            <Text style={styles.featureText}>Expert Help</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Full variant styles
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  patternCircle3: {
    width: 60,
    height: 60,
    top: 20,
    left: '40%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  onlineDotSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  onlineText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#4ADE80',
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#3B82F6',
  },
  illustrationContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  featureDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },

  // Compact variant styles
  compactContainer: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactTextContainer: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  compactSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  compactButtonText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#3B82F6',
  },

  // Minimal variant styles
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  minimalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  minimalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimalTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  minimalSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  minimalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  minimalButtonText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  minimalText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
});

export default LiveSupportBanner;
