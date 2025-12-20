import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList, UserRole } from '../../../types';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../../constants/theme';
import { useTheme } from '../../../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignupRole'>;

const { width } = Dimensions.get('window');

interface Role {
  value: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  benefits: string[];
  color: string;
}

const ROLES: Role[] = [
  {
    value: 'buyer',
    title: 'Customer',
    description: 'Shop fresh produce from local farmers',
    icon: 'cart',
    benefits: ['Browse fresh products', 'Track deliveries', 'Earn rewards'],
    color: '#007AFF',
  },
  {
    value: 'farmer',
    title: 'Farmer',
    description: 'Sell your farm produce directly',
    icon: 'leaf',
    benefits: ['List your products', 'Manage orders', 'Grow your business'],
    color: '#34C759',
  },
  {
    value: 'rider',
    title: 'Rider',
    description: 'Deliver orders and earn money',
    icon: 'bicycle',
    benefits: ['Flexible schedule', 'Earn per delivery', 'Be your own boss'],
    color: '#FF9500',
  },
];

export default function SignupRoleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scaleAnims = useRef(ROLES.map(() => new Animated.Value(1))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleSelectRole = (role: UserRole) => {
    navigation.navigate('SignupEmail', { role });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            How will you use Handwork?
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Choose your role to get started. You can always change this later.
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {ROLES.map((role, index) => (
            <Animated.View
              key={role.value}
              style={[
                { transform: [{ scale: scaleAnims[index] }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  { 
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                  },
                ]}
                onPress={() => handleSelectRole(role.value)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                activeOpacity={1}
              >
                <View style={styles.roleHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${role.color}15` }]}>
                    <Ionicons name={role.icon} size={28} color={role.color} />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={[styles.roleTitle, { color: colors.text }]}>
                      {role.title}
                    </Text>
                    <Text style={[styles.roleDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                      {role.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
                </View>
                
                <View style={[styles.benefitsContainer, { borderTopColor: isDark ? '#374151' : '#F3F4F6' }]}>
                  {role.benefits.map((benefit, i) => (
                    <View key={i} style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={16} color={role.color} />
                      <Text style={[styles.benefitText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
            Already have an account?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              Sign In
            </Text>
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  rolesContainer: {
    gap: SPACING.md,
  },
  roleCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  footerContainer: {
    marginTop: 'auto',
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  footerLink: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});
