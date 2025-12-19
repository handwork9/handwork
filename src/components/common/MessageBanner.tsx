import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { triggerHaptic } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MessageNotification {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: Date;
  senderRole?: 'farmer' | 'buyer' | 'rider';
}

interface MessageBannerProps {
  notification: MessageNotification | null;
  onDismiss: () => void;
  onPress?: (notification: MessageNotification) => void;
  duration?: number;
}

const MessageBanner: React.FC<MessageBannerProps> = ({
  notification,
  onDismiss,
  onPress,
  duration = 4000,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (notification) {
      // Trigger haptic feedback when message arrives
      triggerHaptic();
      
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    triggerHaptic();
    
    if (onPress && notification) {
      onPress(notification);
    }
    handleDismiss();
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'farmer':
        return '#34C759';
      case 'rider':
        return '#007AFF';
      case 'buyer':
      default:
        return '#FF9500';
    }
  };

  const getRoleIcon = (role?: string): keyof typeof Ionicons.glyphMap => {
    switch (role) {
      case 'farmer':
        return 'leaf';
      case 'rider':
        return 'bicycle';
      case 'buyer':
      default:
        return 'person';
    }
  };

  if (!notification) return null;

  const roleColor = getRoleColor(notification.senderRole);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + SPACING.xs,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.banner,
          {
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            ...SHADOWS.medium,
          },
        ]}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {notification.senderAvatar ? (
            <Image
              source={{ uri: notification.senderAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: roleColor }]}>
              <Ionicons
                name={getRoleIcon(notification.senderRole)}
                size={20}
                color="#FFFFFF"
              />
            </View>
          )}
          {/* Online indicator */}
          <View style={[styles.onlineIndicator, { borderColor: isDark ? colors.card : '#FFFFFF' }]} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
              {notification.senderName}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              Now
            </Text>
          </View>
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={(e) => {
            e.stopPropagation();
            triggerHaptic();
            handleDismiss();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* App indicator */}
        <View style={styles.appIndicator}>
          <Ionicons name="chatbubble-ellipses" size={12} color={roleColor} />
          <Text style={[styles.appName, { color: roleColor }]}>Message</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: SPACING.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xs,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
  },
  content: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: SPACING.xs,
  },
  appIndicator: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appName: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default MessageBanner;
