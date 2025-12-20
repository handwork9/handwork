import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import sessionsService, { LoginActivity } from "../../services/sessionsService";

export default function LoginActivityScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoginHistory = useCallback(async () => {
    try {
      const data = await sessionsService.getLoginHistory();
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch login history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLoginHistory();
    }, [fetchLoginHistory])
  );

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "mobile": return "phone-portrait-outline";
      case "tablet": return "tablet-portrait-outline";
      case "desktop": return "desktop-outline";
      default: return "help-circle-outline";
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "success":
        return { color: "#16A34A", bg: "#DCFCE7", label: "Success" };
      case "failed":
        return { color: "#F59E0B", bg: "#FEF3C7", label: "Failed" };
      case "blocked":
        return { color: "#EF4444", bg: "#FEE2E2", label: "Blocked" };
      default:
        return { color: "#6B7280", bg: "#F3F4F6", label: "Unknown" };
    }
  };

  const getDateGroup = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (activityDate.getTime() === today.getTime()) return "Today";
    if (activityDate.getTime() === yesterday.getTime()) return "Yesterday";
    return "Earlier";
  };

  const groupedActivities = activities.reduce((groups, activity) => {
    const group = getDateGroup(activity.timestamp);
    if (!groups[group]) groups[group] = [];
    groups[group].push(activity);
    return groups;
  }, {} as Record<string, LoginActivity[]>);

  const groupOrder = ["Today", "Yesterday", "Earlier"];

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoginHistory();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: isDark ? colors.background : "#F2F2F7" }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading login history...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : "#F2F2F7" }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F2F2F7' }]}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Login Activity</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
      >
        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Recent sign-ins to your account</Text>

        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No login history</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Your login activity will appear here after you sign in
            </Text>
          </View>
        ) : (
          /* Activity List with Date Headers */
          <>
            {groupOrder.map((group) => {
              const groupActivities = groupedActivities[group];
              if (!groupActivities || groupActivities.length === 0) return null;

              return (
                <View key={group}>
                  <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{group}</Text>
                  {groupActivities.map((activity, index) => {
                    const statusConfig = getStatusConfig(activity.status);
                    const isLast = index === groupActivities.length - 1;

                    return (
                      <View
                        key={activity.id}
                        style={[
                          styles.activityItem,
                          !isLast && styles.activityItemBorder,
                          !isLast && { borderBottomColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB' },
                        ]}
                      >
                        <View style={[styles.deviceIconContainer, { backgroundColor: statusConfig.bg }]}>
                          <Ionicons name={getDeviceIcon(activity.deviceType)} size={22} color={statusConfig.color} />
                        </View>

                        <View style={styles.activityContent}>
                          <View style={styles.activityHeader}>
                            <Text style={[styles.deviceName, { color: colors.text }]} numberOfLines={1}>
                              {activity.device}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {statusConfig.label}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.locationText}>
                            {activity.location} • {activity.ip}
                          </Text>

                          <Text style={styles.timestampText}>
                            {formatTimestamp(activity.timestamp)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}

        {/* Security Tip */}
        <View style={[styles.tipContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
          <Ionicons name="information-circle" size={18} color="#F59E0B" />
          <Text style={[styles.tipText, { color: isDark ? '#FBBF24' : '#92400E' }]}>
            If you see unfamiliar activity, change your password immediately.
          </Text>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.18)',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif",
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  deviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif",
  },
  timestampText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif",
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 24,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#92400E",
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    fontFamily: Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    fontFamily: Platform.OS === "ios" ? "Avenir-Medium" : "sans-serif",
  },
});
