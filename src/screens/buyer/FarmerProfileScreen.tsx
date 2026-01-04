import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop, Rect, G } from 'react-native-svg';
import { BuyerStackParamList, Product } from '../../types';
import { ProductCard, LoadingSpinner, EmptyState, ReportModal } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { productService } from '../../services/productService';
import { apiClient } from '../../services/apiClient';
import { useTheme } from '../../context/ThemeContext';
import { getBadgeIllustration } from '../../assets/illustrations/badges';

// SVG Stat Icons
const ProductsStatIcon = ({ size = 32, color = '#007AFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Defs>
      <SvgLinearGradient id="productGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity={1} />
        <Stop offset="100%" stopColor={color} stopOpacity={0.7} />
      </SvgLinearGradient>
    </Defs>
    {/* Main box */}
    <Rect x="5" y="10" width="22" height="16" rx="3" fill="url(#productGrad)" />
    {/* Box opening flaps */}
    <Path d="M5 13L16 6L27 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Inner crease */}
    <Path d="M16 6V14" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
    {/* Shine */}
    <Rect x="8" y="14" width="6" height="2" rx="1" fill="white" opacity={0.4} />
  </Svg>
);

const JoinedStatIcon = ({ size = 32, color = '#43A047' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Defs>
      <SvgLinearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity={1} />
        <Stop offset="100%" stopColor={color} stopOpacity={0.7} />
      </SvgLinearGradient>
    </Defs>
    {/* Calendar body */}
    <Rect x="5" y="8" width="22" height="19" rx="3" fill="url(#calGrad)" />
    {/* Calendar top header */}
    <Rect x="5" y="8" width="22" height="7" rx="3" fill={color} />
    {/* Rings */}
    <Rect x="10" y="5" width="2" height="6" rx="1" fill={color} />
    <Rect x="20" y="5" width="2" height="6" rx="1" fill={color} />
    {/* Calendar days - dots */}
    <Circle cx="11" cy="20" r="1.5" fill="white" opacity={0.8} />
    <Circle cx="16" cy="20" r="1.5" fill="white" opacity={0.8} />
    <Circle cx="21" cy="20" r="1.5" fill="white" opacity={0.8} />
    <Circle cx="11" cy="24" r="1.5" fill="white" opacity={0.5} />
    <Circle cx="16" cy="24" r="1.5" fill="white" opacity={0.5} />
    {/* Checkmark on active day */}
    <Path d="M19 23L20.5 24.5L23 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Badge type definitions
interface FarmerBadge {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  points: number;
  earnedAt: string;
  isDisplayed: boolean;
}

type Props = NativeStackScreenProps<BuyerStackParamList, 'FarmerProfile'>;

interface FarmerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  rating?: number;
  reviewCount?: number;
  joinedDate: string;
  bio?: string;
  avatar?: string;
}

export default function FarmerProfileScreen({ navigation, route }: Props) {
  const { farmerId } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: farmerResponse, isLoading: farmerLoading, error: farmerError } = useQuery({
    queryKey: ['farmer', farmerId],
    queryFn: async () => {
      console.log('[FarmerProfileScreen] Fetching farmer:', farmerId);
      const response = await apiClient.get<{ success: boolean; data: FarmerData }>(`/farmers/profile/${farmerId}`);
      console.log('[FarmerProfileScreen] API Response:', response);
      return response;
    },
    enabled: !!farmerId,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['farmer-products', farmerId],
    queryFn: () => productService.getFarmerProducts(farmerId),
    enabled: !!farmerId,
  });

  // Fetch farmer badges
  const { data: badgesResponse } = useQuery({
    queryKey: ['farmer-badges', farmerId],
    queryFn: () => apiClient.get<{ success: boolean; data: FarmerBadge[] }>(`/badges/farmer/${farmerId}`),
    enabled: !!farmerId,
  });

  // Extract data from API response wrapper
  const farmer = farmerResponse?.data;
  const badges = badgesResponse?.data || [];
  const products = productsData?.data?.data || [];

  // Debug logging
  console.log('[FarmerProfileScreen] farmerId:', farmerId);
  console.log('[FarmerProfileScreen] farmerResponse:', farmerResponse);
  console.log('[FarmerProfileScreen] farmer:', farmer);
  console.log('[FarmerProfileScreen] farmerError:', farmerError);

  if (farmerLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleChatFarmer = () => {
    navigation.navigate('FarmerChat', {
      farmerId: farmerId,
      farmerName: farmer?.name || 'Farmer',
      farmerPhone: farmer?.phone,
      farmerAvatar: farmer?.avatar,
    });
  };

  const handleCallFarmer = () => {
    const farmerPhone = farmer?.phone;
    
    if (!farmerPhone) {
      Alert.alert('Contact Unavailable', 'Farmer phone number is not available. Try sending a message instead.');
      return;
    }

    Alert.alert(
      'Contact Farmer',
      `Would you like to call ${farmer?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Voice Call',
          onPress: () => {
            Linking.openURL(`tel:${farmerPhone}`).catch(() => {
              Alert.alert('Error', 'Unable to make phone call');
            });
          },
        },
        {
          text: 'Video Call',
          onPress: () => {
            Alert.alert('Video Call', 'Connecting video call...');
          },
        },
      ]
    );
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Farmer Profile</Text>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="flag-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card with SVG Background */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          {/* SVG Background Decoration */}
          <View style={styles.profileCardSvgBackground}>
            <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
              <Defs>
                <SvgLinearGradient id="farmerProfileGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity={isDark ? 0.15 : 0.08} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={isDark ? 0.08 : 0.03} />
                </SvgLinearGradient>
                <SvgLinearGradient id="farmerProfileGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#34C759" stopOpacity={isDark ? 0.12 : 0.06} />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity={isDark ? 0.06 : 0.02} />
                </SvgLinearGradient>
              </Defs>
              <Circle cx="350" cy="30" r="80" fill="url(#farmerProfileGrad1)" />
              <Circle cx="380" cy="100" r="50" fill="url(#farmerProfileGrad2)" />
              <Circle cx="40" cy="150" r="60" fill="url(#farmerProfileGrad2)" />
              <Circle cx="-20" cy="50" r="70" fill="url(#farmerProfileGrad1)" />
              <Path d="M0,160 Q150,100 300,140 T400,120" fill="none" stroke="url(#farmerProfileGrad1)" strokeWidth="40" opacity={0.4} />
            </Svg>
          </View>
          
          <View style={[styles.avatarContainer, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
            <MaterialCommunityIcons name="account-cowboy-hat" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{farmer?.name || 'Farmer'}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={[styles.location, { color: colors.textSecondary }]}>
              {farmer?.city}, {farmer?.state}
            </Text>
          </View>

          {farmer?.rating != null && Number(farmer.rating) > 0 && (
            <View style={styles.ratingRow}>
              <View style={[styles.ratingBadge, { backgroundColor: isDark ? 'rgba(255, 184, 0, 0.2)' : '#FFF8E1' }]}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={styles.ratingText}>{Number(farmer.rating).toFixed(1)}</Text>
              </View>
              {farmer.reviewCount !== undefined && (
                <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                  {farmer.reviewCount} reviews
                </Text>
              )}
            </View>
          )}

          {farmer?.bio && (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{farmer.bio}</Text>
          )}

          {/* Contact Actions */}
          <View style={[styles.contactDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
          <View style={styles.contactActionsRow}>
            <TouchableOpacity style={styles.contactActionButton} onPress={handleChatFarmer}>
              <View style={[styles.contactActionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.contactActionText, { color: colors.primary }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactActionButton} onPress={handleCallFarmer}>
              <View style={[styles.contactActionIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.contactActionText, { color: '#34C759' }]}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>STATS</Text>
        <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#E5F1FF' }]}>
                <ProductsStatIcon size={24} color={colors.primary} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: colors.text }]}>{products.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Products</Text>
              </View>
            </View>
            <View style={[styles.statSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(67, 160, 71, 0.15)' : '#E8F5E9' }]}>
                <JoinedStatIcon size={24} color="#43A047" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: colors.text }]}>{formatJoinDate(farmer?.joinedDate)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Joined</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        {badges.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              ACHIEVEMENTS ({badges.length})
            </Text>
            <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', padding: 12 }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.badgesRow}>
                  {badges.slice(0, 6).map((badge: FarmerBadge) => {
                    const BadgeIllustration = getBadgeIllustration(badge.type);
                    return (
                      <View key={badge.id} style={styles.badgeItem}>
                        <View style={[styles.badgeIconContainer, { backgroundColor: badge.color + '15' }]}>
                          {BadgeIllustration ? (
                            <BadgeIllustration size={40} />
                          ) : (
                            <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                          )}
                        </View>
                        <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                          {badge.name}
                        </Text>
                        <Text style={[styles.badgePoints, { color: badge.color }]}>
                          +{badge.points} pts
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              {badges.length > 6 && (
                <TouchableOpacity style={styles.viewAllBadgesButton}>
                  <Text style={[styles.viewAllBadgesText, { color: colors.primary }]}>
                    View all {badges.length} badges
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* About Section */}
        {farmer?.bio && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT</Text>
            <View style={[styles.insetCard, { backgroundColor: isDark ? colors.card : '#FFFFFF', padding: 16 }]}>
              <Text style={[styles.aboutText, { color: colors.text }]}>{farmer.bio}</Text>
            </View>
          </>
        )}

        {/* Products Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          PRODUCTS ({products.length})
        </Text>
        
        {productsLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : products.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <EmptyState
              title="No products yet"
              description="This farmer hasn't listed any products."
            />
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <View key={product.id} style={styles.productCardWrapper}>
                <ProductCard
                  product={product}
                  onPress={handleProductPress}
                />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="user"
        contentId={farmerId}
        contentTitle={farmer?.name || 'Farmer'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  reportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 8,
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  profileCardSvgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#FF8F00',
  },
  reviewCount: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  bio: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  contactDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginTop: 16,
    marginBottom: 12,
  },
  contactActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 4,
  },
  contactActionButton: {
    alignItems: 'center',
    gap: 6,
  },
  contactActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactActionText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 32,
    marginTop: 24,
  },
  insetCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statSeparator: {
    width: StyleSheet.hairlineWidth,
    height: 40,
  },
  aboutText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  loadingContainer: {
    paddingVertical: 40,
  },
  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 24,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  productCardWrapper: {
    width: '48%',
    marginBottom: 8,
  },
  // Badge styles
  badgesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  badgeItem: {
    alignItems: 'center',
    width: 72,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  badgePoints: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    marginTop: 2,
  },
  viewAllBadgesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60, 60, 67, 0.12)',
    gap: 4,
  },
  viewAllBadgesText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
});
