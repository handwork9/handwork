import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { notificationService } from '../../services/notificationService';

interface Notification {
  id: string;
  type: 'order' | 'delivery' | 'payment' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
  orderId?: string;
}

type RouteParams = {
  NotificationDetail: {
    notification: Notification;
  };
};

const getNotificationConfig = (type: Notification['type']) => {
  switch (type) {
    case 'order':
      return {
        icon: 'bag-handle' as const,
        color: '#7C3AED',
        lightColor: '#F3E8FF',
        label: 'Order Update',
        actionLabel: 'View Order',
        actionIcon: 'arrow-forward' as const,
      };
    case 'delivery':
      return {
        icon: 'bicycle' as const,
        color: '#0EA5E9',
        lightColor: '#E0F2FE',
        label: 'Delivery Update',
        actionLabel: 'Track Delivery',
        actionIcon: 'location' as const,
      };
    case 'payment':
      return {
        icon: 'card' as const,
        color: '#10B981',
        lightColor: '#D1FAE5',
        label: 'Payment',
        actionLabel: 'View Transaction',
        actionIcon: 'receipt' as const,
      };
    case 'promotion':
      return {
        icon: 'pricetag' as const,
        color: '#F59E0B',
        lightColor: '#FEF3C7',
        label: 'Special Offer',
        actionLabel: 'Shop Now',
        actionIcon: 'storefront' as const,
      };
    default:
      return {
        icon: 'notifications' as const,
        color: '#6B7280',
        lightColor: '#F3F4F6',
        label: 'System',
        actionLabel: 'Learn More',
        actionIcon: 'information-circle' as const,
      };
  }
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  let relative = '';
  if (minutes < 1) relative = 'Just now';
  else if (minutes < 60) relative = `${minutes}m ago`;
  else if (hours < 24) relative = `${hours}h ago`;
  else if (days === 1) relative = 'Yesterday';
  else if (days < 7) relative = `${days}d ago`;
  else relative = date.toLocaleDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fullDate = date.toLocaleDateString([], { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return { relative, time, fullDate };
};

export function NotificationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'NotificationDetail'>>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { notification } = route.params;
  
  const config = getNotificationConfig(notification.type);
  const dateInfo = formatDateTime(notification.createdAt);
  
  // State
  const [isMuted, setIsMuted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: isDark ? colors.background : '#F2F2F7' },
    card: { backgroundColor: isDark ? colors.card : '#FFFFFF' },
    cardAlt: { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' },
    text: { color: colors.text },
    textSecondary: { color: colors.textSecondary },
    separator: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(60, 60, 67, 0.12)' },
  }), [colors, isDark]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Mark as read when viewing
    if (!notification.read) {
      notificationService.markAsRead(notification.id).catch(console.error);
    }
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        title: notification.title,
        message: `${notification.title}\n\n${notification.message}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await notificationService.deleteNotification(notification.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    Alert.alert(
      isMuted ? 'Unmuted' : 'Muted',
      isMuted 
        ? 'You will receive notifications like this again' 
        : 'You will no longer receive notifications like this',
      [{ text: 'OK' }]
    );
  };

  const handleAction = () => {
    switch (notification.type) {
      case 'order':
        if (notification.orderId) {
          (navigation as any).navigate('OrderTracking', { orderId: notification.orderId });
        } else {
          navigation.goBack();
        }
        break;
      case 'delivery':
        if (notification.orderId) {
          (navigation as any).navigate('OrderTracking', { orderId: notification.orderId });
        } else {
          navigation.goBack();
        }
        break;
      case 'payment':
        (navigation as any).navigate('Wallet');
        break;
      case 'promotion':
        (navigation as any).navigate('Home');
        break;
      default:
        navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* iOS-style Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Animated.Text 
            style={[
              styles.headerTitle, 
              { color: colors.text, opacity: headerOpacity }
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Animated.Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Large Title */}
        <Animated.View style={[styles.largeTitleContainer, { opacity: titleOpacity }]}>
          {/* Icon Badge */}
          <View style={[styles.iconBadge, { backgroundColor: config.lightColor }]}>
            <Ionicons name={config.icon} size={32} color={config.color} />
          </View>
          
          {/* Type Label */}
          <View style={[styles.typeBadge, { backgroundColor: config.lightColor }]}>
            <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.largeTitle, dynamicStyles.text]}>{notification.title}</Text>
          
          {/* Time */}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.timeText, dynamicStyles.textSecondary]}>
              {dateInfo.relative} • {dateInfo.time}
            </Text>
          </View>
        </Animated.View>

        {/* Message Section */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>MESSAGE</Text>
          <View style={[styles.insetCard, dynamicStyles.card]}>
            <Text style={[styles.messageText, dynamicStyles.text]}>{notification.message}</Text>
          </View>
        </Animated.View>

        {/* Details Section */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>DETAILS</Text>
          <View style={[styles.insetCard, dynamicStyles.card]}>
            {/* Date Row */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#DEDEE0' }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Received</Text>
                <Text style={[styles.detailValue, dynamicStyles.text]}>{dateInfo.fullDate}</Text>
              </View>
            </View>

            <View style={[styles.separator, dynamicStyles.separator]} />

            {/* Type Row */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: config.lightColor }]}>
                <Ionicons name={config.icon} size={18} color={config.color} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Category</Text>
                <Text style={[styles.detailValue, dynamicStyles.text]}>{config.label}</Text>
              </View>
            </View>

            <View style={[styles.separator, dynamicStyles.separator]} />

            {/* Status Row */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIconContainer, { backgroundColor: notification.read ? '#D1FAE5' : '#FEF3C7' }]}>
                <Ionicons 
                  name={notification.read ? "checkmark-circle" : "ellipse"} 
                  size={18} 
                  color={notification.read ? '#10B981' : '#F59E0B'} 
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Status</Text>
                <Text style={[styles.detailValue, dynamicStyles.text]}>
                  {notification.read ? 'Read' : 'Unread'}
                </Text>
              </View>
            </View>

            {notification.orderId && (
              <>
                <View style={[styles.separator, dynamicStyles.separator]} />
                <View style={styles.detailRow}>
                  <View style={[styles.detailIconContainer, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="receipt-outline" size={18} color="#6366F1" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, dynamicStyles.textSecondary]}>Order ID</Text>
                    <Text style={[styles.detailValue, dynamicStyles.text]}>
                      #{notification.orderId.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Quick Actions Section */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={[styles.sectionTitle, dynamicStyles.textSecondary]}>ACTIONS</Text>
          <View style={[styles.insetCard, dynamicStyles.card]}>
            {/* Delete */}
            <TouchableOpacity 
              style={styles.actionRow}
              onPress={handleDelete}
              activeOpacity={0.6}
              disabled={isDeleting}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Delete Notification</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.separator, dynamicStyles.separator]} />

            {/* Mute */}
            <TouchableOpacity 
              style={styles.actionRow}
              onPress={handleMute}
              activeOpacity={0.6}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: isMuted ? '#D1FAE5' : '#FEF3C7' }]}>
                <Ionicons 
                  name={isMuted ? "notifications" : "notifications-off-outline"} 
                  size={20} 
                  color={isMuted ? "#10B981" : "#F59E0B"} 
                />
              </View>
              <Text style={[styles.actionLabel, dynamicStyles.text]}>
                {isMuted ? 'Unmute Similar' : 'Mute Similar'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.separator, dynamicStyles.separator]} />

            {/* Share */}
            <TouchableOpacity 
              style={styles.actionRow}
              onPress={handleShare}
              activeOpacity={0.6}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="share-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.actionLabel, dynamicStyles.text]}>Share</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Bottom Action Button */}
      <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: config.color }]}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <Ionicons name={config.actionIcon} size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{config.actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  shareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  largeTitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  largeTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  insetCard: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  messageText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 24,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60, 60, 67, 0.12)',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
});

export default NotificationDetailScreen;
