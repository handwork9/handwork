import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ACCENT_COLOR_VALUES } from '../../context/ThemeContext';
import { notificationService, NotificationSettings } from '../../services/notificationService';
import { FONTS } from '../../constants/theme';
import { triggerHaptic } from '../../utils/haptics';
import { useAppDispatch } from '../../store';
import { setNotificationSettings, updateNotificationSetting } from '../../store/slices/notificationSettingsSlice';

interface SettingItem {
  key: keyof NotificationSettings;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  iconColor: string;
  iconBgColor: string;
}

interface SettingSection {
  title: string;
  subtitle?: string;
  items: SettingItem[];
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushNotificationsEnabled: true,
  orderUpdatesEnabled: true,
  deliveryAlertsEnabled: true,
  paymentAlertsEnabled: true,
  promotionsEnabled: false,
  newProductsEnabled: true,
  priceDropsEnabled: true,
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: false,
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, accentColorValue, accessibility } = useTheme();
  const dispatch = useAppDispatch();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const primaryColor = accentColorValue || ACCENT_COLOR_VALUES.green;
  const bg = isDark ? colors.background : '#F2F2F7';
  const cardBg = isDark ? colors.card : '#FFFFFF';

  const fetchSettings = useCallback(async () => {
    try {
      const data = await notificationService.getNotificationSettings();
      setSettings(data);
      // Sync to Redux store for use in notification handler
      dispatch(setNotificationSettings(data));
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      // Use default settings on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSettings();
  };

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    if (accessibility.hapticFeedback) {
      triggerHaptic();
    }

    // Optimistic update - both local state and Redux
    const previousSettings = { ...settings };
    setSettings((prev) => ({ ...prev, [key]: value }));
    dispatch(updateNotificationSetting({ key, value }));
    setSaving(key);

    try {
      // Update on server and use the returned settings to ensure state is in sync
      const updatedSettings = await notificationService.updateNotificationSettings({ [key]: value });
      setSettings(updatedSettings);
      // Sync updated settings to Redux store
      dispatch(setNotificationSettings(updatedSettings));
    } catch (error) {
      console.error('Failed to update setting:', error);
      // Revert on error - both local state and Redux
      setSettings(previousSettings);
      dispatch(setNotificationSettings(previousSettings));
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleTestNotification = async () => {
    if (accessibility.hapticFeedback) {
      triggerHaptic();
    }

    try {
      const result = await notificationService.sendTestNotification();
      Alert.alert(
        result.success ? 'Success' : 'Note',
        result.message,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const sections: SettingSection[] = [
    {
      title: 'General',
      subtitle: 'Control all push notifications',
      items: [
        {
          key: 'pushNotificationsEnabled',
          icon: 'notifications',
          label: 'Push Notifications',
          description: 'Enable all push notifications',
          iconColor: '#FFFFFF',
          iconBgColor: '#FF3B30',
        },
      ],
    },
    {
      title: 'Orders & Delivery',
      subtitle: 'Stay updated on your orders',
      items: [
        {
          key: 'orderUpdatesEnabled',
          icon: 'cart',
          label: 'Order Updates',
          description: 'Order confirmation & status changes',
          iconColor: '#FFFFFF',
          iconBgColor: '#007AFF',
        },
        {
          key: 'deliveryAlertsEnabled',
          icon: 'bicycle',
          label: 'Delivery Alerts',
          description: 'Rider location & delivery status',
          iconColor: '#FFFFFF',
          iconBgColor: '#34C759',
        },
        {
          key: 'paymentAlertsEnabled',
          icon: 'card',
          label: 'Payment Alerts',
          description: 'Payment confirmations & refunds',
          iconColor: '#FFFFFF',
          iconBgColor: '#5856D6',
        },
      ],
    },
    {
      title: 'Marketing',
      subtitle: 'Deals and product updates',
      items: [
        {
          key: 'promotionsEnabled',
          icon: 'megaphone',
          label: 'Promotions & Offers',
          description: 'Special deals and discounts',
          iconColor: '#FFFFFF',
          iconBgColor: '#FF9500',
        },
        {
          key: 'newProductsEnabled',
          icon: 'leaf',
          label: 'New Products',
          description: 'Fresh arrivals from farmers',
          iconColor: '#FFFFFF',
          iconBgColor: '#30D158',
        },
        {
          key: 'priceDropsEnabled',
          icon: 'trending-down',
          label: 'Price Drops',
          description: 'Alerts for items in your wishlist',
          iconColor: '#FFFFFF',
          iconBgColor: '#FF2D55',
        },
      ],
    },
    {
      title: 'Channels',
      subtitle: 'Choose how you want to be notified',
      items: [
        {
          key: 'emailNotificationsEnabled',
          icon: 'mail',
          label: 'Email Notifications',
          description: 'Receive updates via email',
          iconColor: '#FFFFFF',
          iconBgColor: '#007AFF',
        },
        {
          key: 'smsNotificationsEnabled',
          icon: 'chatbubble',
          label: 'SMS Notifications',
          description: 'Receive updates via SMS',
          iconColor: '#FFFFFF',
          iconBgColor: '#34C759',
        },
      ],
    },
    {
      title: 'Sounds & Haptics',
      subtitle: 'Customize notification feedback',
      items: [
        {
          key: 'soundEnabled',
          icon: 'volume-high',
          label: 'Sound',
          description: 'Play sound for notifications',
          iconColor: '#FFFFFF',
          iconBgColor: '#FF3B30',
        },
        {
          key: 'vibrationEnabled',
          icon: 'phone-portrait',
          label: 'Vibration',
          description: 'Vibrate for notifications',
          iconColor: '#FFFFFF',
          iconBgColor: '#8E8E93',
        },
        {
          key: 'badgeEnabled',
          icon: 'ellipse',
          label: 'Badge App Icon',
          description: 'Show unread count on app icon',
          iconColor: '#FFFFFF',
          iconBgColor: '#FF3B30',
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem, isLast: boolean, isEnabled: boolean) => {
    const isSaving = saving === item.key;
    const isDisabled = !settings.pushNotificationsEnabled && item.key !== 'pushNotificationsEnabled';

    return (
      <View
        key={item.key}
        style={[
          styles.settingItem,
          { opacity: isDisabled ? 0.5 : 1 },
        ]}
      >
        <View style={[styles.iconBg, { backgroundColor: item.iconBgColor }]}>
          <Ionicons name={item.icon} size={18} color={item.iconColor} />
        </View>
        <View style={[styles.settingContent, !isLast && styles.settingBorder]}>
          <View style={styles.settingText}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          </View>
          {isSaving ? (
            <ActivityIndicator size="small" color={primaryColor} style={{ marginRight: 8 }} />
          ) : (
            <Switch
              value={isEnabled}
              onValueChange={(value) => handleToggle(item.key, value)}
              trackColor={{ false: isDark ? '#39393D' : '#E5E5EA', true: primaryColor }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={isDark ? '#39393D' : '#E5E5EA'}
              disabled={isDisabled}
            />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: cardBg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <View style={[styles.statIconBg, { backgroundColor: `${primaryColor}20` }]}>
              <Ionicons
                name={settings.pushNotificationsEnabled ? 'notifications' : 'notifications-off'}
                size={20}
                color={primaryColor}
              />
            </View>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              {settings.pushNotificationsEnabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
              Push Notifications
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <View style={[styles.statIconBg, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="mail" size={20} color="#007AFF" />
            </View>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              {settings.emailNotificationsEnabled ? 'On' : 'Off'}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>Email</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <View style={[styles.statIconBg, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="chatbubble" size={20} color="#34C759" />
            </View>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              {settings.smsNotificationsEnabled ? 'On' : 'Off'}
            </Text>
            <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>SMS</Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title.toUpperCase()}
              </Text>
              {section.subtitle && (
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {section.subtitle}
                </Text>
              )}
            </View>
            <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
              {section.items.map((item, index) =>
                renderSettingItem(item, index === section.items.length - 1, settings[item.key])
              )}
            </View>
          </View>
        ))}

        {/* Test Notification Button */}
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: cardBg }]}
          onPress={handleTestNotification}
          activeOpacity={0.7}
        >
          <View style={[styles.testIconBg, { backgroundColor: `${primaryColor}20` }]}>
            <Ionicons name="send" size={18} color={primaryColor} />
          </View>
          <View style={styles.testContent}>
            <Text style={[styles.testLabel, { color: colors.text }]}>Send Test Notification</Text>
            <Text style={[styles.testDescription, { color: colors.textSecondary }]}>
              Verify your notification setup
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }]}>
          <View style={[styles.infoIconBg, { backgroundColor: `${primaryColor}20` }]}>
            <Ionicons name="information-circle" size={20} color={primaryColor} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>About Notifications</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              You can manage notification permissions in your device settings. Disabling push
              notifications will stop all alerts except critical account security notifications.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
          Your notification preferences sync across all your devices.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  statSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  sectionCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    minHeight: 60,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 16,
    marginLeft: 12,
  },
  settingBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  settingText: {
    flex: 1,
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  testIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testContent: {
    flex: 1,
    marginLeft: 12,
  },
  testLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  testDescription: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.regular,
  },
  footerNote: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontFamily: FONTS.regular,
  },
});
