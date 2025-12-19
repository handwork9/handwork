import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ProfileData {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
  location?: string;
  role: 'buyer' | 'farmer' | 'rider';
  rating?: number;
  totalOrders?: number;
  totalDeliveries?: number;
  memberSince?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  specialties?: string[];
  bio?: string;
  responseTime?: string;
}

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: ProfileData;
  onNavigateToFullProfile?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  profile,
  onNavigateToFullProfile,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 400,
          delay: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
      scaleAnim.setValue(0.9);
      contentAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleCall = () => {
    if (!profile.phone) {
      Alert.alert('Contact Unavailable', 'Phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${profile.phone}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleSMS = () => {
    if (!profile.phone) {
      Alert.alert('Contact Unavailable', 'Phone number is not available.');
      return;
    }
    Linking.openURL(`sms:${profile.phone}`).catch(() => {
      Alert.alert('Error', 'Unable to send SMS');
    });
  };

  const handleEmail = () => {
    if (!profile.email) {
      Alert.alert('Email Unavailable', 'Email address is not available.');
      return;
    }
    Linking.openURL(`mailto:${profile.email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email');
    });
  };

  const getRoleIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (profile.role) {
      case 'buyer':
        return 'cart';
      case 'farmer':
        return 'leaf';
      case 'rider':
        return 'bicycle';
      default:
        return 'person';
    }
  };

  const getRoleColor = () => {
    switch (profile.role) {
      case 'buyer':
        return '#007AFF';
      case 'farmer':
        return '#34C759';
      case 'rider':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getRoleGradient = (): [string, string] => {
    switch (profile.role) {
      case 'buyer':
        return ['#007AFF', '#5856D6'];
      case 'farmer':
        return ['#34C759', '#30D158'];
      case 'rider':
        return ['#FF9500', '#FF6B00'];
      default:
        return ['#8E8E93', '#636366'];
    }
  };

  const getRoleLabel = () => {
    switch (profile.role) {
      case 'buyer':
        return 'Buyer';
      case 'farmer':
        return 'Farmer';
      case 'rider':
        return 'Delivery Rider';
      default:
        return 'User';
    }
  };

  const getStatsLabel = () => {
    switch (profile.role) {
      case 'buyer':
        return 'Orders';
      case 'farmer':
        return 'Products Sold';
      case 'rider':
        return 'Deliveries';
      default:
        return 'Transactions';
    }
  };

  const getStatsValue = () => {
    if (profile.role === 'rider' && profile.totalDeliveries !== undefined) {
      return profile.totalDeliveries;
    }
    return profile.totalOrders || 0;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color="#FFD700" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color="#FFD700" />);
      }
    }
    return stars;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop,
            { 
              backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
              opacity: backdropAnim,
            }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={handleClose}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.container,
            { 
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              paddingBottom: insets.bottom + 16,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            }
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBarContainer}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : '#D1D1D6' }]} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Header with Gradient */}
            <Animated.View style={[styles.headerSection, { opacity: contentAnim }]}>
              <LinearGradient
                colors={getRoleGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatarContainer, { borderColor: '#FFFFFF' }]}>
                    {profile.avatar && profile.avatar.trim() !== '' ? (
                      <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                        <Ionicons name={getRoleIcon()} size={44} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  {profile.isOnline && (
                    <View style={styles.onlineIndicator}>
                      <View style={styles.onlineDot} />
                    </View>
                  )}
                  {profile.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                
                <Text style={styles.headerName}>{profile.name}</Text>
                
                <View style={styles.roleBadge}>
                  <Ionicons name={getRoleIcon()} size={14} color="#FFFFFF" />
                  <Text style={styles.roleText}>{getRoleLabel()}</Text>
                </View>

                {/* Rating Stars */}
                {profile.rating != null && Number(profile.rating) > 0 && (
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsRow}>
                      {renderStars(Number(profile.rating))}
                    </View>
                    <Text style={styles.ratingText}>{Number(profile.rating).toFixed(1)}</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>

            {/* Stats Row */}
            <Animated.View 
              style={[
                styles.statsRow, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F9FA',
                  opacity: contentAnim,
                  transform: [{
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }
              ]}
            >
              {profile.rating != null && Number(profile.rating) > 0 && (
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {Number(profile.rating).toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
                </View>
              )}
              {profile.rating != null && Number(profile.rating) > 0 && (
                <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]} />
              )}
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {getStatsValue()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{getStatsLabel()}</Text>
              </View>
              {profile.responseTime && (
                <>
                  <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E5EA' }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {profile.responseTime}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Response</Text>
                  </View>
                </>
              )}
            </Animated.View>

            {/* Bio Section */}
            {profile.bio && (
              <Animated.View 
                style={[
                  styles.bioSection,
                  {
                    opacity: contentAnim,
                    transform: [{
                      translateY: contentAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  }
                ]}
              >
                <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                  "{profile.bio}"
                </Text>
              </Animated.View>
            )}

            {/* Profile Info */}
            <Animated.View 
              style={[
                styles.infoSection,
                {
                  opacity: contentAnim,
                  transform: [{
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }
              ]}
            >
              {profile.location && (
                <View style={[styles.infoRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}>
                  <View style={[styles.infoIconContainer, { backgroundColor: `${getRoleColor()}15` }]}>
                    <Ionicons name="location" size={18} color={getRoleColor()} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{profile.location}</Text>
                  </View>
                </View>
              )}
              
              {profile.phone && (
                <TouchableOpacity 
                  style={[styles.infoRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <View style={[styles.infoIconContainer, { backgroundColor: '#34C75915' }]}>
                    <Ionicons name="call" size={18} color="#34C759" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
                    <Text style={[styles.infoValue, { color: '#34C759' }]}>{profile.phone}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              {profile.email && (
                <TouchableOpacity 
                  style={[styles.infoRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}
                  onPress={handleEmail}
                  activeOpacity={0.7}
                >
                  <View style={[styles.infoIconContainer, { backgroundColor: '#007AFF15' }]}>
                    <Ionicons name="mail" size={18} color="#007AFF" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                    <Text style={[styles.infoValue, { color: '#007AFF' }]}>{profile.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              
              {profile.vehicleType && (
                <View style={[styles.infoRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}>
                  <View style={[styles.infoIconContainer, { backgroundColor: '#FF950015' }]}>
                    <Ionicons name="car" size={18} color="#FF9500" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Vehicle</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {profile.vehicleType}{profile.vehiclePlate ? ` • ${profile.vehiclePlate}` : ''}
                    </Text>
                  </View>
                </View>
              )}
              
              {profile.memberSince && (
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <View style={[styles.infoIconContainer, { backgroundColor: '#5856D615' }]}>
                    <Ionicons name="calendar" size={18} color="#5856D6" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Member Since</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{profile.memberSince}</Text>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Specialties Tags */}
            {profile.specialties && profile.specialties.length > 0 && (
              <Animated.View 
                style={[
                  styles.specialtiesSection,
                  {
                    opacity: contentAnim,
                    transform: [{
                      translateY: contentAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  }
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Specialties</Text>
                <View style={styles.tagsContainer}>
                  {profile.specialties.map((specialty, index) => (
                    <View 
                      key={index} 
                      style={[styles.tag, { backgroundColor: `${getRoleColor()}15` }]}
                    >
                      <Ionicons name="leaf" size={12} color={getRoleColor()} />
                      <Text style={[styles.tagText, { color: getRoleColor() }]}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Quick Action Buttons */}
            <Animated.View 
              style={[
                styles.quickActions,
                {
                  opacity: contentAnim,
                  transform: [{
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }
              ]}
            >
              {profile.phone && (
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: '#34C759' }]}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              {profile.phone && (
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: '#007AFF' }]}
                  onPress={handleSMS}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {profile.email && (
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: '#5856D6' }]}
                  onPress={handleEmail}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              {onNavigateToFullProfile && profile.role === 'farmer' && (
                <TouchableOpacity
                  style={[styles.quickActionButton, { backgroundColor: '#FF9500' }]}
                  onPress={() => {
                    handleClose();
                    setTimeout(() => onNavigateToFullProfile(), 300);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="storefront" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* View Full Profile Button (for farmers) */}
            {onNavigateToFullProfile && profile.role === 'farmer' && (
              <Animated.View
                style={{
                  opacity: contentAnim,
                  transform: [{
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                }}
              >
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() => {
                    handleClose();
                    setTimeout(() => onNavigateToFullProfile(), 300);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={getRoleGradient()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.viewProfileGradient}
                  >
                    <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.viewProfileText}>Visit Shop</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F2F2F7' }]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...SHADOWS.large,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 0,
    right: -4,
    backgroundColor: '#34C759',
    borderRadius: 12,
    ...SHADOWS.small,
  },
  headerName: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  bioSection: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  bioText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: FONTS.medium,
  },
  specialtiesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  quickActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  viewProfileButton: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  viewProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  viewProfileText: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 14,
    marginBottom: 8,
  },
  closeText: {
    fontSize: 17,
    fontFamily: FONTS.semiBold,
  },
});

export default ProfileModal;
