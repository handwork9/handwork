import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';
import { useAppSelector, useAppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic, triggerErrorHaptic } from '../../utils/haptics';
import {
  profileStatsService,
  FarmerProfileStats,
  RiderProfileStats,
  BuyerProfileStats,
} from '../../services/profileStatsService';
import {
  ProductsIllustration,
  OrdersIllustration,
  RatingIllustration,
  DeliveriesIllustration,
  EarningsIllustration,
  SavedIllustration,
  ReviewsIllustration,
} from '../../assets/illustrations/stats';

interface StatItem {
  label: string;
  value: string;
  Illustration: React.FC<{ width?: number; height?: number; color?: string }>;
}

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  action: () => void;
  rightElement?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

// Skeleton loading component for stat items
const SkeletonStatItem: React.FC<{ isDark: boolean; index: number }> = ({ isDark, index }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    // Stagger the animation start based on index
    const timeout = setTimeout(() => animation.start(), index * 150);
    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [pulseAnim, index]);

  const backgroundColor = isDark ? '#3C3C3E' : '#E5E7EB';

  return (
    <View style={skeletonStyles.container}>
      <Animated.View 
        style={[
          skeletonStyles.iconPlaceholder, 
          { backgroundColor, opacity: pulseAnim }
        ]} 
      />
      <Animated.View 
        style={[
          skeletonStyles.valuePlaceholder, 
          { backgroundColor, opacity: pulseAnim }
        ]} 
      />
      <Animated.View 
        style={[
          skeletonStyles.labelPlaceholder, 
          { backgroundColor, opacity: pulseAnim }
        ]} 
      />
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
  },
  valuePlaceholder: {
    width: 50,
    height: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  labelPlaceholder: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
});


export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  // Stats state
  const [stats, setStats] = useState<FarmerProfileStats | RiderProfileStats | BuyerProfileStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const diamondRotateAnim = useRef(new Animated.Value(0)).current;

  // Fetch profile stats when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        if (!user?.role) return;
        setIsLoadingStats(true);
        try {
          const fetchedStats = await profileStatsService.getStats(user.role as 'farmer' | 'rider' | 'buyer');
          setStats(fetchedStats);
        } catch (error) {
          console.error('Failed to fetch profile stats:', error);
        } finally {
          setIsLoadingStats(false);
        }
      };
      fetchStats();
    }, [user?.role])
  );

  // Rotating animation for Go Premium diamond icon
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(diamondRotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();
    return () => rotateAnimation.stop();
  }, []);

  const diamondRotation = diamondRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Header animation - show user info after scrolling 50px
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.background,
    },
    sectionTitle: {
      color: colors.textSecondary,
    },
    menuLabel: {
      color: colors.text,
    },
    menuSubtitle: {
      color: colors.textSecondary,
    },
    chevron: {
      color: colors.textSecondary,
    },
    statValue: {
      color: colors.text,
    },
    statLabel: {
      color: colors.textSecondary,
    },
    menuItemBg: {
      backgroundColor: colors.background,
    },
  }), [colors]);

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = () => {
    triggerErrorHaptic();
    Alert.alert(
      t('auth.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch (e) {
              // Continue with local logout even if API fails
            }
            dispatch(logout());
          },
        },
      ]
    );
  };

  const getRoleConfig = () => {
    // Helper to format numbers
    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        const val = num / 1000000;
        return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
      }
      if (num >= 1000) {
        const val = num / 1000;
        return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
      }
      return num.toString();
    };

    // Helper to format currency
    const formatCurrency = (num: number) => {
      if (num >= 1000000) {
        const val = num / 1000000;
        return val % 1 === 0 ? `₦${val}M` : `₦${val.toFixed(1)}M`;
      }
      if (num >= 1000) {
        const val = num / 1000;
        return val % 1 === 0 ? `₦${val}K` : `₦${val.toFixed(1)}K`;
      }
      return `₦${num.toLocaleString()}`;
    };

    // Helper to format rating
    const formatRating = (rating: number | undefined | null) => {
      if (rating === undefined || rating === null) return '0.0';
      return Number(rating) > 0 ? Number(rating).toFixed(1) : '0.0';
    };

    switch (user?.role) {
      case 'farmer': {
        const farmerStats = stats as FarmerProfileStats | null;
        return {
          icon: 'leaf' as const,
          label: 'Verified Farmer',
          gradient: ['#43A047', '#66BB6A'] as const,
          stats: [
            { label: 'Products', value: formatNumber(farmerStats?.totalProducts || 0), Illustration: ProductsIllustration },
            { label: 'Orders', value: formatNumber(farmerStats?.totalOrders || 0), Illustration: OrdersIllustration },
            { label: 'Rating', value: formatRating(farmerStats?.avgRating || 0), Illustration: RatingIllustration },
          ],
        };
      }
      case 'rider': {
        const riderStats = stats as RiderProfileStats | null;
        return {
          icon: 'bicycle' as const,
          label: 'Active Rider',
          gradient: ['#1976D2', '#42A5F5'] as const,
          stats: [
            { label: 'Deliveries', value: formatNumber(riderStats?.totalDeliveries || 0), Illustration: DeliveriesIllustration },
            { label: 'Earnings', value: formatCurrency(riderStats?.totalEarnings || 0), Illustration: EarningsIllustration },
            { label: 'Rating', value: formatRating(riderStats?.avgRating || 0), Illustration: RatingIllustration },
          ],
        };
      }
      case 'buyer':
      default: {
        const buyerStats = stats as BuyerProfileStats | null;
        // Premium tier configuration
        const getPremiumConfig = () => {
          if (!user?.isPremium) {
            return {
              icon: 'bag-outline' as const,
              label: 'Buyer',
              gradient: ['#757575', '#9E9E9E'] as const,
            };
          }
          switch (user?.premiumTier) {
            case 'platinum':
              return {
                icon: 'diamond' as const,
                label: 'Platinum Buyer',
                gradient: ['#1A237E', '#3949AB'] as const,
              };
            case 'gold':
              return {
                icon: 'star' as const,
                label: 'Gold Buyer',
                gradient: ['#F57C00', '#FFB74D'] as const,
              };
            case 'basic':
            default:
              return {
                icon: 'bag-handle' as const,
                label: 'Premium Buyer',
                gradient: ['#7B1FA2', '#AB47BC'] as const,
              };
          }
        };
        const premiumConfig = getPremiumConfig();
        return {
          icon: premiumConfig.icon,
          label: premiumConfig.label,
          gradient: premiumConfig.gradient,
          stats: [
            { label: 'Orders', value: formatNumber(buyerStats?.totalOrders || user?.totalOrders || 0), Illustration: OrdersIllustration },
            { label: 'Saved', value: formatNumber(buyerStats?.totalSaved || 0), Illustration: SavedIllustration },
            { label: 'Points', value: formatNumber(buyerStats?.totalReviews || 0), Illustration: ReviewsIllustration },
          ],
        };
      }
    }
  };

  const roleConfig = getRoleConfig();

  // Build menu sections - add Go Premium for non-premium buyers
  const getAccountItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      {
        icon: 'person',
        label: t('profile.editProfile'),
        action: () => (navigation as any).navigate('EditProfile'),
        iconColor: COLORS.accent,
        iconBg: COLORS.accentLight,
      },
    ];

    // My Addresses - only for buyers (riders deliver to addresses, farmers ship from farm)
    if (user?.role === 'buyer') {
      items.push({
        icon: 'location',
        label: t('profile.address'),
        action: () => (navigation as any).navigate('MyAddress'),
        iconColor: COLORS.secondary,
        iconBg: COLORS.secondaryLight,
      });
    }

    // Payment Methods - for buyers (to pay) and riders (to receive payments/withdrawals)
    if (user?.role === 'buyer' || user?.role === 'rider') {
      items.push({
        icon: 'card',
        label: t('wallet.paymentMethods'),
        action: () => (navigation as any).navigate('PaymentMethods'),
        iconColor: COLORS.primary,
        iconBg: COLORS.primaryLight,
      });
    }

    // Security - for all roles
    items.push({
      icon: 'lock-closed',
      label: t('settings.security'),
      action: () => (navigation as any).navigate('Security'),
      iconColor: '#E91E63',
      iconBg: '#FCE4EC',
    });

    // Add Go Premium option for non-premium buyers
    if (user?.role === 'buyer' && !user?.isPremium) {
      items.splice(0, 0, {
        icon: 'diamond',
        label: t('profile.goPremium'),
        action: () => (navigation as any).navigate('GoPremium'),
        iconColor: '#7B1FA2',
        iconBg: '#F3E5F5',
      });
    }

    // Add Become Verified Seller option for non-premium farmers
    if (user?.role === 'farmer' && !user?.isPremium) {
      items.splice(0, 0, {
        icon: 'checkmark-circle',
        label: t('profile.becomeVerified') || 'Become Verified Seller',
        action: () => (navigation as any).navigate('FarmerSubscription'),
        iconColor: '#1DA1F2',
        iconBg: '#E3F2FD',
      });
    }

    return items;
  };

  // Build My Activity items based on role
  const getActivityItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      {
        icon: 'wallet',
        label: t('wallet.title'),
        action: () => (navigation as any).navigate('Wallet'),
        iconColor: '#4CAF50',
        iconBg: '#E8F5E9',
      },
      {
        icon: 'gift',
        label: t('rewards.title'),
        action: () => (navigation as any).navigate('Rewards'),
        iconColor: '#FF9800',
        iconBg: '#FFF3E0',
      },
    ];

    // Favorites is only for buyers (riders deliver, farmers sell)
    if (user?.role === 'buyer') {
      items.push({
        icon: 'heart',
        label: t('favorites.title'),
        action: () => (navigation as any).navigate('Favorites'),
        iconColor: '#E91E63',
        iconBg: '#FCE4EC',
      });
    }

    // Invite Friends is available for all roles
    items.push({
      icon: 'people',
      label: t('invite.title'),
      action: () => (navigation as any).navigate('Invite'),
      iconColor: '#9C27B0',
      iconBg: '#F3E5F5',
    });

    return items;
  };

  const menuSections: MenuSection[] = [
    {
      title: t('profile.account'),
      items: getAccountItems(),
    },
    {
      title: t('profile.myActivity'),
      items: getActivityItems(),
    },
    {
      title: t('profile.preferences'),
      items: [
        {
          icon: 'notifications',
          label: t('settings.notifications'),
          action: () => (navigation as any).navigate('NotificationSettings'),
          iconColor: '#FF5722',
          iconBg: '#FBE9E7',
        },
        {
          icon: 'color-palette',
          label: t('settings.appearance'),
          action: () => (navigation as any).navigate('Appearance'),
          iconColor: '#673AB7',
          iconBg: '#EDE7F6',
        },
        {
          icon: 'globe',
          label: t('settings.language'),
          action: () => (navigation as any).navigate('Language'),
          iconColor: '#009688',
          iconBg: '#E0F2F1',
        },
      ],
    },
    {
      title: t('support.title'),
      items: [
        {
          icon: 'help-circle',
          label: t('support.helpCenter'),
          action: () => (navigation as any).navigate('HelpCenter'),
          iconColor: '#2196F3',
          iconBg: '#E3F2FD',
        },
        {
          icon: 'chatbubble-ellipses',
          label: t('support.contactUs'),
          action: () => (navigation as any).navigate('ContactUs'),
          iconColor: '#4CAF50',
          iconBg: '#E8F5E9',
        },
        {
          icon: 'star',
          label: t('profile.rateApp'),
          action: () => (navigation as any).navigate('RateApp'),
          iconColor: '#FFC107',
          iconBg: '#FFF8E1',
        },
        {
          icon: 'document-text',
          label: t('profile.termsPrivacy'),
          action: () => (navigation as any).navigate('TermsPrivacy'),
          iconColor: '#607D8B',
          iconBg: '#ECEFF1',
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem, isLast: boolean, isFirst: boolean) => (
    <TouchableOpacity
      key={item.label}
      style={[
        styles.menuItem,
        isFirst && styles.menuItemFirst,
        isLast && styles.menuItemLast,
      ]}
      onPress={() => {
        triggerHaptic();
        item.action();
      }}
      activeOpacity={0.5}
    >
      <View style={[styles.menuIconBg, { backgroundColor: item.iconColor || colors.primary }]}>
        {item.label === 'Go Premium' ? (
          <Animated.View style={{ transform: [{ rotate: diamondRotation }] }}>
            <Ionicons name={item.icon} size={18} color="#FFFFFF" />
          </Animated.View>
        ) : (
          <Ionicons name={item.icon} size={18} color="#FFFFFF" />
        )}
      </View>
      <View style={[styles.menuContent, !isLast && styles.menuItemBorder]}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
        <View style={styles.menuRight}>
          {item.rightElement || (
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <View style={styles.headerContent}>
          {/* Title - always visible */}
          <Text style={[styles.fixedHeaderTitle, { color: colors.text }]}>
            {t('profile.title')}
          </Text>
        </View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: SPACING.md }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarContainer, { backgroundColor: roleConfig.gradient[0] }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'user@example.com'}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: `${roleConfig.gradient[0]}20` }]}>
              <Ionicons name={roleConfig.icon} size={14} color={roleConfig.gradient[0]} />
              <Text style={[styles.roleBadgeText, { color: roleConfig.gradient[0] }]}>
                {roleConfig.label}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              triggerHaptic();
              (navigation as any).navigate('EditProfile');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {isLoadingStats ? (
            <>
              {[0, 1, 2].map((index) => (
                <View key={index} style={styles.statItem}>
                  <SkeletonStatItem isDark={isDark} index={index} />
                </View>
              ))}
            </>
          ) : (
            roleConfig.stats.map((stat, index) => (
              <View key={stat.label} style={styles.statItem}>
                <stat.Illustration width={36} height={36} color="#16A34A" />
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))
          )}
        </View>

        {/* iOS Inset Grouped List Sections */}
        {menuSections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.insetGroupedContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
              {section.items.map((item, index) =>
                renderMenuItem(item, index === section.items.length - 1, index === 0)
              )}
            </View>
          </Animated.View>
        ))}

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={[styles.insetGroupedContainer, styles.logoutContainer, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <TouchableOpacity
              style={styles.logoutItem}
              onPress={() => {
                triggerHaptic();
                handleLogout();
              }}
              activeOpacity={0.5}
            >
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Version & Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text }]}>Handwork Marketplace</Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.copyrightText, { color: colors.textDisabled }]}>© 2025 All Rights Reserved</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerSpacer: {
    width: 40,
  },
  headerContent: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  fixedHeaderTitle: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  profileName: {
    fontSize: 20,
    marginBottom: 2,
    fontFamily: FONTS.bold,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: FONTS.regular,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  editProfileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 90,
  },
  statsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  headerUserText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  headerUserName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semiBold,
  },
  headerUserEmail: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  headerSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rewardsTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
  },
  quickCardsContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  quickCardImage: {
    width: 30,
    height: 30,
  },
  quickCardEmoji: {
    fontSize: 26,
  },
  quickCardLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
    fontFamily: FONTS.semiBold,
  },
  insetGroupedContainer: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    minHeight: 48,
  },
  menuItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuIconBg: {
    width: 30,
    height: 30,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: SPACING.md,
    marginLeft: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  menuRight: {
    marginLeft: 'auto',
  },
  menuLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  logoutContainer: {
    borderRadius: 12,
  },
  logoutItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 12,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginTop: SPACING.md,
  },
  footerText: {
    fontSize: FONT_SIZES.md,
    color: '#16A34A',
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  versionText: {
    fontSize: FONT_SIZES.sm,
    color: '#6B7280',
    marginTop: 6,
    fontFamily: FONTS.medium,
  },
  copyrightText: {
    fontSize: FONT_SIZES.sm,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
});
