import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../../constants/theme';

interface RiderLocation {
  lat: number;
  lng: number;
}

interface LiveTrackingCardProps {
  riderLocation: RiderLocation | null;
  deliveryLocation: {
    lat: number;
    lng: number;
  };
  riderName?: string;
  isOnline?: boolean;
  lastUpdateTime?: Date;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate ETA based on distance and average speed
 */
function calculateETA(distanceKm: number): number {
  const avgSpeedKmPerHour = 25; // Average speed in urban areas
  const timeHours = distanceKm / avgSpeedKmPerHour;
  return Math.round(timeHours * 60); // Return in minutes
}

export default function LiveTrackingCard({
  riderLocation,
  deliveryLocation,
  riderName,
  isOnline = true,
  lastUpdateTime,
}: LiveTrackingCardProps) {
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [updateAgo, setUpdateAgo] = useState<string>('');

  // Pulse animation for live indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Calculate distance and ETA when rider location updates
  useEffect(() => {
    if (riderLocation && deliveryLocation) {
      const distance = calculateDistance(
        riderLocation.lat,
        riderLocation.lng,
        deliveryLocation.lat,
        deliveryLocation.lng
      );
      setDistanceKm(distance);
      setEtaMinutes(calculateETA(distance));
    }
  }, [riderLocation, deliveryLocation]);

  // Update "time ago" display
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdateTime) {
        setUpdateAgo('');
        return;
      }
      
      const seconds = Math.floor((new Date().getTime() - lastUpdateTime.getTime()) / 1000);
      
      if (seconds < 10) {
        setUpdateAgo('Just now');
      } else if (seconds < 60) {
        setUpdateAgo(`${seconds}s ago`);
      } else {
        setUpdateAgo(`${Math.floor(seconds / 60)}m ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  if (!riderLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.waitingContainer}>
          <Ionicons name="location-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
            Waiting for rider location...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Live Indicator */}
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <Animated.View
            style={[
              styles.liveDot,
              {
                backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Text style={[styles.liveText, { color: isOnline ? '#4CAF50' : '#9E9E9E' }]}>
            {isOnline ? 'LIVE' : 'OFFLINE'}
          </Text>
        </View>
        {updateAgo && (
          <Text style={[styles.updateTime, { color: colors.textSecondary }]}>
            Updated {updateAgo}
          </Text>
        )}
      </View>

      {/* Main Stats */}
      <View style={styles.statsRow}>
        {/* ETA */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="time" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {etaMinutes !== null ? `${etaMinutes} min` : '--'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ETA</Text>
          </View>
        </View>

        {/* Distance */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FF9800' + '15' }]}>
            <Ionicons name="navigate" size={20} color="#FF9800" />
          </View>
          <View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '--'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Away</Text>
          </View>
        </View>

        {/* Speed Indicator */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#2196F3' + '15' }]}>
            <Ionicons name="speedometer" size={20} color="#2196F3" />
          </View>
          <View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {isOnline ? 'Moving' : 'Stopped'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Status</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      {distanceKm !== null && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.max(0, Math.min(100, 100 - (distanceKm / 5) * 100))}%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <View style={styles.progressLabel}>
              <Ionicons name="bicycle" size={14} color={colors.primary} />
              <Text style={[styles.progressLabelText, { color: colors.textSecondary }]}>Rider</Text>
            </View>
            <View style={styles.progressLabel}>
              <Ionicons name="home" size={14} color={colors.success} />
              <Text style={[styles.progressLabelText, { color: colors.textSecondary }]}>You</Text>
            </View>
          </View>
        </View>
      )}

      {/* Rider Name */}
      {riderName && (
        <View style={[styles.riderInfo, { borderTopColor: colors.border }]}>
          <Text style={[styles.riderLabel, { color: colors.textSecondary }]}>
            Your rider:
          </Text>
          <Text style={[styles.riderName, { color: colors.text }]}>{riderName}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  updateTime: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  progressContainer: {
    gap: SPACING.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabelText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  riderLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  riderName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  waitingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
});
