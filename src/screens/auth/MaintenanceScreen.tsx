import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Maintenance'>;

const { width, height } = Dimensions.get('window');

// Floating logo configurations
const FLOATING_LOGOS = [
  { x: width * 0.1, y: height * 0.15, size: 24, duration: 4000, delay: 0 },
  { x: width * 0.8, y: height * 0.2, size: 20, duration: 3500, delay: 500 },
  { x: width * 0.2, y: height * 0.35, size: 28, duration: 4500, delay: 1000 },
  { x: width * 0.75, y: height * 0.4, size: 22, duration: 3800, delay: 300 },
  { x: width * 0.15, y: height * 0.55, size: 26, duration: 4200, delay: 700 },
  { x: width * 0.85, y: height * 0.6, size: 18, duration: 3600, delay: 200 },
  { x: width * 0.1, y: height * 0.75, size: 24, duration: 4000, delay: 800 },
  { x: width * 0.9, y: height * 0.8, size: 20, duration: 3700, delay: 400 },
  { x: width * 0.5, y: height * 0.12, size: 22, duration: 4100, delay: 600 },
  { x: width * 0.6, y: height * 0.85, size: 26, duration: 3900, delay: 100 },
];

const FloatingLogo = ({ x, y, size, duration, delay }: typeof FLOATING_LOGOS[0]) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -20,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.35,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingLogo,
        {
          left: x,
          top: y,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <MaterialCommunityIcons name="sprout" size={size} color={COLORS.white} />
    </Animated.View>
  );
};

export default function MaintenanceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Floating Background Logos */}
      {FLOATING_LOGOS.map((logo, index) => (
        <FloatingLogo key={index} {...logo} />
      ))}

      {/* Top Section - Logo and Handwork */}
      <View style={styles.topSection}>
        <View style={styles.logoRow}>
          <MaterialCommunityIcons name="sprout" size={36} color={COLORS.white} />
          <Text style={styles.brandText}>handwork</Text>
        </View>
      </View>

      {/* Center Section - Information Text */}
      <View style={styles.centerSection}>
        <Text style={styles.mainTitle}>We're Making Things Better</Text>
        <Text style={styles.subtitle}>
          Our app is currently under maintenance.{'\n'}
          We're working hard to bring you an{'\n'}
          improved experience. Thank you for{'\n'}
          your patience!
        </Text>

        {/* See What You Missed Chip */}
        <TouchableOpacity 
          style={styles.chip} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('WhatYouMissed')}
        >
          <MaterialCommunityIcons name="gift-outline" size={18} color={COLORS.white} />
          <Text style={styles.chipText}>See what you missed</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Footer Section - Login and Sign Up Buttons */}
      <View style={styles.footerSection}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignupRole')}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16A34A',
  },
  floatingLogo: {
    position: 'absolute',
    zIndex: 0,
  },
  topSection: {
    paddingTop: SPACING.xl,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  brandText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: 1,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.xl,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 24,
    gap: 4,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  footerSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    zIndex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  loginButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  signUpButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
});
