import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus, usePendingActionsCount } from '../../services/offlineService';
import { FONTS } from '../../constants/theme';

interface OfflineIndicatorProps {
  onPress?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStatus();
  const pendingCount = usePendingActionsCount();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const wasOnline = useRef(isOnline);

  useEffect(() => {
    if (!isOnline) {
      // Slide in when offline
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else if (wasOnline.current === false) {
      // Show "Back Online" briefly then slide out
      setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);
    }
    
    wasOnline.current = isOnline;
  }, [isOnline]);

  // Don't render if online and no pending actions
  if (isOnline && pendingCount === 0 && wasOnline.current) {
    return null;
  }

  const backgroundColor = isOnline ? '#22C55E' : '#EF4444';
  const icon = isOnline ? 'wifi' : 'cloud-offline';
  const message = isOnline 
    ? 'Back Online' + (pendingCount > 0 ? ` • Syncing ${pendingCount} changes...` : '')
    : `You're Offline${pendingCount > 0 ? ` • ${pendingCount} pending` : ''}`;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY: slideAnim }],
          paddingTop: insets.top + 4,
          backgroundColor,
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={!onPress}
      >
        <Ionicons name={icon} size={16} color="#FFFFFF" />
        <Text style={styles.text}>{message}</Text>
        {!isOnline && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Tap to retry</Text>
          </View>
        )}
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
    paddingBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
});

export default OfflineIndicator;
