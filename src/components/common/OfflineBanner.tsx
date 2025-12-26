import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOfflineMode } from '../../hooks/useOfflineMode';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../../constants/theme';

interface OfflineBannerProps {
  onSyncPress?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onSyncPress }) => {
  const { isOnline, hasPendingActions, syncPendingActions } = useOfflineMode();
  const [showBanner, setShowBanner] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);
  const slideAnim = useState(new Animated.Value(-100))[0];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isOnline || hasPendingActions) {
      setShowBanner(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowBanner(false);
        setSyncResult(null);
      });
    }
  }, [isOnline, hasPendingActions]);

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      const result = await syncPendingActions();
      setSyncResult(result);
      onSyncPress?.();
      
      // Clear result after 3 seconds
      setTimeout(() => {
        setSyncResult(null);
      }, 3000);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!showBanner) return null;

  const getBannerContent = () => {
    if (!isOnline) {
      return {
        icon: 'wifi-off' as const,
        text: 'You\'re offline',
        subtext: 'Some features may be limited',
        bgColor: COLORS.warning,
      };
    }

    if (hasPendingActions) {
      if (syncResult) {
        return {
          icon: 'check-circle' as const,
          text: `Synced ${syncResult.success} action${syncResult.success !== 1 ? 's' : ''}`,
          subtext: syncResult.failed > 0 ? `${syncResult.failed} failed` : undefined,
          bgColor: syncResult.failed > 0 ? COLORS.warning : COLORS.success,
        };
      }
      return {
        icon: 'cloud-sync' as const,
        text: 'Pending changes',
        subtext: 'Tap to sync',
        bgColor: COLORS.primary,
        showSync: true,
      };
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: content.bgColor,
          paddingTop: insets.top + SPACING.xs,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={content.showSync ? handleSync : undefined}
        disabled={!content.showSync || isSyncing}
        activeOpacity={content.showSync ? 0.7 : 1}
      >
        <MaterialCommunityIcons
          name={isSyncing ? 'loading' : content.icon}
          size={20}
          color="#FFFFFF"
          style={isSyncing ? styles.spinning : undefined}
        />
        <View style={styles.textContainer}>
          <Text style={styles.text}>{content.text}</Text>
          {content.subtext && <Text style={styles.subtext}>{content.subtext}</Text>}
        </View>
        {content.showSync && !isSyncing && (
          <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
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
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: '#FFFFFF',
  },
  subtext: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  spinning: {
    // Note: For actual spinning animation, you'd need Animated.loop
  },
});

export default OfflineBanner;
