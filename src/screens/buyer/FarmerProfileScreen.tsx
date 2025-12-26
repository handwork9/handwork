import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuyerStackParamList, Product } from '../../types';
import { ProductCard, LoadingSpinner, EmptyState } from '../../components/common';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants/theme';
import { productService } from '../../services/productService';
import { apiClient } from '../../services/apiClient';
import { useTheme } from '../../context/ThemeContext';

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

  const { data: farmerData, isLoading: farmerLoading } = useQuery({
    queryKey: ['farmer', farmerId],
    queryFn: () => apiClient.get<{ success: boolean; data: FarmerData }>(`/farmers/profile/${farmerId}`),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['farmer-products', farmerId],
    queryFn: () => productService.getFarmerProducts(farmerId),
  });

  const farmer = farmerData?.data;
  const products = productsData?.data?.data || [];

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
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
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
              <View style={[styles.ratingBadge, { backgroundColor: '#FFF8E1' }]}>
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
                <Ionicons name="cube" size={18} color={colors.primary} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: colors.text }]}>{products.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Products</Text>
              </View>
            </View>
            <View style={[styles.statSeparator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' }]} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="calendar" size={18} color="#43A047" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: colors.text }]}>{formatJoinDate(farmer?.joinedDate)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Joined</Text>
              </View>
            </View>
          </View>
        </View>

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
});
