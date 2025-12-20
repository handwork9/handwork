import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { FONTS } from "../../constants/theme";
import sessionsService, { Session } from "../../services/sessionsService";
import { useAppDispatch } from "../../store";
import { logout } from "../../store/slices/authSlice";

export default function ActiveSessionsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [endingSession, setEndingSession] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await sessionsService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Show current device as fallback
      setSessions([
        {
          id: "current",
          device: "This Device",
          deviceType: "mobile",
          os: Platform.OS === 'ios' ? 'iOS' : 'Android',
          location: "Current Location",
          ip: "xxx.xxx.xxx.xxx",
          lastActive: new Date().toISOString(),
          isCurrent: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatLastActive = (dateStr: string, isCurrent: boolean) => {
    if (isCurrent) return "Active now";

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getDeviceIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "mobile": return "phone-portrait-outline";
      case "tablet": return "tablet-portrait-outline";
      case "desktop": return "desktop-outline";
      default: return "help-circle-outline";
    }
  };

  const handleEndSession = async (session: Session) => {
    if (session.isCurrent) {
      Alert.alert(
        "End Current Session?",
        "This will log you out of the app. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log Out",
            style: "destructive",
            onPress: async () => {
              try {
                setEndingSession(session.id);
                await sessionsService.endSession(session.id);
                dispatch(logout());
              } catch (error) {
                console.error('Error ending session:', error);
                Alert.alert('Error', 'Failed to end session. Please try again.');
              } finally {
                setEndingSession(null);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "End Session?",
        `This will log out the ${session.device}. You can always log back in.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "End Session",
            style: "destructive",
            onPress: async () => {
              try {
                setEndingSession(session.id);
                await sessionsService.endSession(session.id);
                setSessions((prev) => prev.filter((s) => s.id !== session.id));
              } catch (error) {
                console.error('Error ending session:', error);
                Alert.alert('Error', 'Failed to end session. Please try again.');
              } finally {
                setEndingSession(null);
              }
            },
          },
        ]
      );
    }
  };

  const handleEndAllOtherSessions = () => {
    const otherSessions = sessions.filter((s) => !s.isCurrent);
    if (otherSessions.length === 0) {
      Alert.alert("No Other Sessions", "You only have one active session.");
      return;
    }

    Alert.alert(
      "End All Other Sessions?",
      `This will log out ${otherSessions.length} other device${otherSessions.length > 1 ? "s" : ""}. Only this device will remain logged in.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End All",
          style: "destructive",
          onPress: async () => {
            try {
              setEndingSession('all');
              const response = await sessionsService.endAllOtherSessions();
              setSessions((prev) => prev.filter((s) => s.isCurrent));
              Alert.alert('Success', `Ended ${response.endedCount || otherSessions.length} session(s)`);
            } catch (error) {
              console.error('Error ending sessions:', error);
              Alert.alert('Error', 'Failed to end sessions. Please try again.');
            } finally {
              setEndingSession(null);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? colors.background : "#F2F2F7" }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading sessions...</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Active Sessions</Text>
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
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Devices logged into your account</Text>

        {/* Current Session */}
        {currentSession && (
          <View style={[styles.sessionItem, styles.sessionItemBorder, { borderBottomColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB' }]}>
            <View style={[styles.deviceIconContainer, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name={getDeviceIcon(currentSession.deviceType)} size={22} color="#16A34A" />
            </View>

            <View style={styles.sessionContent}>
              <View style={styles.sessionHeader}>
                <Text style={[styles.deviceName, { color: colors.text }]} numberOfLines={1}>
                  {currentSession.device}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: "#DCFCE7" }]}>
                  <View style={styles.activeDot} />
                  <Text style={[styles.statusText, { color: "#16A34A" }]}>Active</Text>
                </View>
              </View>

              <Text style={[styles.osText, { color: colors.textSecondary }]}>{currentSession.os}</Text>

              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {currentSession.location} • {currentSession.ip}
              </Text>
            </View>
          </View>
        )}

        {/* Other Sessions Header */}
        {otherSessions.length > 0 && (
          <View style={styles.otherSessionsHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Other devices</Text>
            <TouchableOpacity onPress={handleEndAllOtherSessions} disabled={endingSession === 'all'}>
              {endingSession === 'all' ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Text style={styles.endAllText}>End All</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Other Sessions */}
        {otherSessions.map((session, index) => {
          const isLast = index === otherSessions.length - 1;
          const isEnding = endingSession === session.id;

          return (
            <View
              key={session.id}
              style={[styles.sessionItem, !isLast && styles.sessionItemBorder, !isLast && { borderBottomColor: isDark ? 'rgba(60, 60, 67, 0.12)' : '#E5E7EB' }]}
            >
              <View style={[styles.deviceIconContainer, { backgroundColor: isDark ? 'rgba(107, 114, 128, 0.2)' : "#F3F4F6" }]}>
                <Ionicons name={getDeviceIcon(session.deviceType)} size={22} color="#6B7280" />
              </View>

              <View style={styles.sessionContent}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.deviceName, { color: colors.text }]} numberOfLines={1}>
                    {session.device}
                  </Text>
                  <TouchableOpacity
                    style={styles.endButton}
                    onPress={() => handleEndSession(session)}
                    disabled={isEnding}
                  >
                    {isEnding ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Ionicons name="close-circle" size={22} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={[styles.osText, { color: colors.textSecondary }]}>{session.os}</Text>

                <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                  {session.location} • {formatLastActive(session.lastActive, session.isCurrent)}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Empty State */}
        {otherSessions.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="shield-checkmark" size={28} color="#16A34A" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear!</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>You're only logged in on this device.</Text>
          </View>
        )}

        {/* Security Tip */}
        <View style={[styles.tipContainer, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7' }]}>
          <Ionicons name="information-circle" size={18} color="#F59E0B" />
          <Text style={[styles.tipText, { color: isDark ? '#FBBF24' : '#92400E' }]}>
            End sessions from devices you don't recognize to keep your account secure.
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
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 44,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    fontFamily: FONTS.regular,
    marginBottom: 20,
  },
  sessionItem: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  sessionItemBorder: {
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
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  deviceName: {
    fontSize: 16,
    flex: 1,
    marginRight: 12,
    fontFamily: FONTS.semiBold,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  osText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
    fontFamily: FONTS.regular,
  },
  locationText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: FONTS.regular,
  },
  otherSessionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: FONTS.semiBold,
  },
  endAllText: {
    fontSize: 14,
    color: "#EF4444",
    fontFamily: FONTS.semiBold,
  },
  endButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: FONTS.regular,
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
    fontFamily: FONTS.regular,
  },
});
