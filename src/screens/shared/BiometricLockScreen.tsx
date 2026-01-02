import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import biometricService from '../../services/biometricService';
import { useAppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { clearPaymentMethods } from '../../store/slices/paymentSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { clearAddresses } from '../../store/slices/addressSlice';
import { resetFavorites } from '../../store/slices/favoritesSlice';
import { clearFarmerState } from '../../store/slices/farmerSlice';
import { clearRiderState } from '../../store/slices/riderSlice';
import { clearBuyerState } from '../../store/slices/buyerSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BiometricLockScreenProps {
  onUnlock: () => void;
  userName?: string;
  userAvatar?: string;
}

export default function BiometricLockScreen({ onUnlock, userName, userAvatar }: BiometricLockScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [attemptCount, setAttemptCount] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation
    startPulseAnimation();

    loadBiometricType();
    // Auto-trigger biometric auth on mount with slight delay
    const timer = setTimeout(() => {
      handleAuthenticate();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  };

  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const triggerSuccessAnimation = () => {
    Animated.timing(iconRotate, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  const loadBiometricType = async () => {
    const type = await biometricService.getBiometricTypeName();
    setBiometricType(type);
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);

    const result = await biometricService.authenticate(`Unlock with ${biometricType}`);
    
    setIsAuthenticating(false);

    if (result.success) {
      triggerSuccessAnimation();
      // Small delay for success animation, then unlock
      setTimeout(() => onUnlock(), 200);
    } else if (result.errorCode !== 'user_cancel') {
      setAttemptCount(prev => prev + 1);
      triggerShakeAnimation();
      setError(result.error || 'Authentication failed. Please try again.');
    }
  };

  const handleLogout = () => {
    biometricService.resetLastAuth();
    // Clear all user-specific state to prevent data leaking between users
    dispatch(clearPaymentMethods());
    dispatch(clearCart());
    dispatch(clearAddresses());
    dispatch(resetFavorites());
    dispatch(clearFarmerState());
    dispatch(clearRiderState());
    dispatch(clearBuyerState());
    dispatch(logout());
  };

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    if (biometricType.includes('Face')) {
      return 'scan-outline';
    }
    return 'finger-print-outline';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userName ? userName.split(' ')[0] : '';

  const rotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={isDark 
          ? ['#1a1a2e', '#16213e', '#0f3460']
          : ['#16A34A', '#15803D', '#166534']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={[styles.decorativeCircle, styles.circle1]} />
      <View style={[styles.decorativeCircle, styles.circle2]} />
      <View style={[styles.decorativeCircle, styles.circle3]} />

      <Animated.View 
        style={[
          styles.content, 
          { 
            paddingTop: insets.top + 40,
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          }
        ]}
      >
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/logo-dark.png')} 
            style={styles.appLogo}
            resizeMode="contain"
          />
        </View>

        {/* Lock Icon with Pulse */}
        <Animated.View style={[styles.lockIconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.lockIconOuter}>
            <View style={styles.lockIconInner}>
              <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                <Ionicons 
                  name={isAuthenticating ? 'shield-outline' : getBiometricIcon()} 
                  size={56} 
                  color="#FFFFFF" 
                />
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* User Info Section */}
        <View style={styles.userSection}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={28} color="#FFFFFF" />
            </View>
          )}
          
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          {firstName ? (
            <Text style={styles.nameText}>{firstName}</Text>
          ) : null}
        </View>

        {/* Status Text */}
        <View style={styles.statusSection}>
          {isAuthenticating ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.statusText}>Verifying...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBadge}>
              <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <Text style={styles.instructionText}>
              Use {biometricType} to unlock your account
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Main Unlock Button */}
          <TouchableOpacity
            style={[
              styles.unlockButton,
              isAuthenticating && styles.unlockButtonDisabled,
            ]}
            onPress={handleAuthenticate}
            disabled={isAuthenticating}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={getBiometricIcon()} 
              size={24} 
              color={isDark ? '#16A34A' : '#15803D'} 
            />
            <Text style={[styles.unlockButtonText, { color: isDark ? '#16A34A' : '#15803D' }]}>
              {isAuthenticating ? 'Authenticating...' : `Unlock with ${biometricType}`}
            </Text>
          </TouchableOpacity>

          {/* Retry hint after failed attempts */}
          {attemptCount > 0 && !isAuthenticating && (
            <Text style={styles.retryHint}>
              Tap the button above to try again
            </Text>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.secondaryButtonText}>Switch Account</Text>
          </TouchableOpacity>

          {/* App branding */}
          <View style={styles.brandingContainer}>
            <Ionicons name="leaf" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.brandingText}>Handwork</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  appLogo: {
    width: 140,
    height: 70,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circle1: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    top: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.2,
  },
  circle2: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    bottom: SCREEN_WIDTH * 0.1,
    left: -SCREEN_WIDTH * 0.3,
  },
  circle3: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    bottom: -SCREEN_WIDTH * 0.1,
    right: SCREEN_WIDTH * 0.1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  lockIconContainer: {
    marginBottom: SPACING.xl,
  },
  lockIconOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: SPACING.md,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  greetingText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
  },
  nameText: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    minHeight: 60,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    gap: SPACING.xs,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    width: '100%',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  unlockButtonDisabled: {
    opacity: 0.8,
  },
  unlockButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  retryHint: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.md,
  },
  bottomActions: {
    marginTop: 'auto',
    alignItems: 'center',
    width: '100%',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  brandingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.5)',
  },
});
