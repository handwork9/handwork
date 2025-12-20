import React, { useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'leaf' as const,
    title: 'Farm Fresh',
    description: 'Direct from local farmers to your table',
    color: '#34C759',
  },
  {
    icon: 'rocket' as const,
    title: 'Lightning Fast',
    description: 'Same-day delivery within your state',
    color: '#FF9500',
  },
  {
    icon: 'location' as const,
    title: 'Live Tracking',
    description: 'Watch your order arrive in real-time',
    color: '#007AFF',
  },
];

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresTranslate = useRef(new Animated.Value(30)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo fade in with scale
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Title slide up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Features slide up
      Animated.parallel([
        Animated.timing(featuresOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(featuresTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Buttons fade in
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header Gradient */}
      <LinearGradient
        colors={isDark 
          ? ['#1C3D1E', '#1A1A1A', colors.background] 
          : ['#E8F5E9', '#F1F8F2', '#F2F2F7']
        }
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Decorative Elements */}
      <View style={[styles.decorCircle1, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.08)' }]} />
      <View style={[styles.decorCircle2, { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.05)' : 'rgba(52, 199, 89, 0.05)' }]} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content, 
          { 
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 24,
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScale }],
                opacity: logoOpacity,
              },
            ]}
          >
            <View style={[styles.logoBackground, { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.2)' }]}>
              <LinearGradient
                colors={['#34C759', '#30B350']}
                style={styles.logoGradient}
              >
                <MaterialCommunityIcons name="sprout" size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslate }],
              },
            ]}
          >
            <Text style={[styles.title, { color: colors.text }]}>Handwork</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Farm to Table, Delivered Fast
            </Text>
          </Animated.View>
        </View>

        {/* Features Section */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: featuresOpacity,
              transform: [{ translateY: featuresTranslate }],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            WHY CHOOSE HANDWORK
          </Text>
          <View style={[styles.featuresCard, { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.2)' }]}>
            {FEATURES.map((feature, index) => (
              <View key={feature.title}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                    <Ionicons name={feature.icon} size={22} color={feature.color} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                    <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                      {feature.description}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                </View>
                {index < FEATURES.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Social Proof */}
        <Animated.View
          style={[
            styles.socialProofSection,
            {
              opacity: featuresOpacity,
              transform: [{ translateY: featuresTranslate }],
            },
          ]}
        >
          <View style={[styles.socialProofCard, { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.2)' }]}>
            <View style={styles.avatarStack}>
              {['#FF9500', '#FF3B30', '#AF52DE', '#007AFF', '#34C759', '#5856D6'].map((color, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.avatar, 
                    { 
                      marginLeft: i > 0 ? -10 : 0,
                      backgroundColor: color,
                      borderColor: isDark ? '#2C2C2E' : '#DEDEE0',
                    }
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {['J', 'M', 'S', 'A', 'K', 'O'][i]}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.socialProofContent}>
              <Text style={[styles.socialProofNumber, { color: colors.text }]}>10,000+</Text>
              <Text style={[styles.socialProofText, { color: colors.textSecondary }]}>
                Happy customers across Nigeria
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslate }],
            },
          ]}
        >
          {/* Get Started Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SignupRole')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
              Already have an account? 
            </Text>
            <Text style={styles.signInText}> Sign In</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
  },
  decorCircle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -80,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 60,
    left: -60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  featuresSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  featuresCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 74,
  },
  socialProofSection: {
    marginBottom: 24,
  },
  socialProofCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  socialProofContent: {
    flex: 1,
  },
  socialProofNumber: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  socialProofText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  signInText: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: '#34C759',
  },
  termsText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#34C759',
    fontFamily: FONTS.medium,
  },
});
