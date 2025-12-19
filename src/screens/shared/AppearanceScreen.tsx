import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, AccentColor, ACCENT_COLOR_VALUES } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { FONTS } from '../../constants/theme';

interface ToggleItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  iconColor: string;
  iconBgColor: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

type AppearanceMode = 'light' | 'dark' | 'system';

const ACCENT_COLORS: { key: AccentColor; color: string; label: string }[] = [
  { key: 'green', color: ACCENT_COLOR_VALUES.green, label: 'Green' },
  { key: 'blue', color: ACCENT_COLOR_VALUES.blue, label: 'Blue' },
  { key: 'purple', color: ACCENT_COLOR_VALUES.purple, label: 'Purple' },
  { key: 'orange', color: ACCENT_COLOR_VALUES.orange, label: 'Orange' },
  { key: 'pink', color: ACCENT_COLOR_VALUES.pink, label: 'Pink' },
];

export default function AppearanceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { 
    colors, 
    isDark, 
    themeMode,
    accentColor, 
    accentColorValue,
    accessibility,
    setThemeMode,
    setAccentColor,
    setAccessibility,
  } = useTheme();

  const handleModeChange = (mode: AppearanceMode) => {
    if (accessibility.hapticFeedback) {
      triggerHaptic();
    }
    setThemeMode(mode);
  };

  const handleAccentChange = (color: AccentColor) => {
    if (accessibility.hapticFeedback) {
      triggerHaptic();
    }
    setAccentColor(color);
  };

  const bg = isDark ? colors.background : '#F2F2F7';
  const cardBg = isDark ? colors.card : '#FFFFFF';

  const handleAccessibilityChange = (key: keyof typeof accessibility, value: boolean) => {
    if (accessibility.hapticFeedback && key !== 'hapticFeedback') {
      triggerHaptic();
    }
    setAccessibility({ [key]: value });
  };

  const accessibilityItems: ToggleItem[] = [
    {
      icon: 'sparkles-outline',
      label: 'Reduce Motion',
      description: 'Minimize animations',
      iconColor: '#FFFFFF',
      iconBgColor: '#8E8E93',
      value: accessibility.reducedMotion,
      onValueChange: (value) => handleAccessibilityChange('reducedMotion', value),
    },
    {
      icon: 'text',
      label: 'Bold Text',
      description: 'Enhanced readability',
      iconColor: '#FFFFFF',
      iconBgColor: '#1D1D1F',
      value: accessibility.boldText,
      onValueChange: (value) => handleAccessibilityChange('boldText', value),
    },
    {
      icon: 'resize',
      label: 'Larger Text',
      description: 'Increase font size',
      iconColor: '#FFFFFF',
      iconBgColor: '#007AFF',
      value: accessibility.largeText,
      onValueChange: (value) => handleAccessibilityChange('largeText', value),
    },
    {
      icon: 'phone-portrait-outline',
      label: 'Haptic Feedback',
      description: 'Vibration on interactions',
      iconColor: '#FFFFFF',
      iconBgColor: '#FF9500',
      value: accessibility.hapticFeedback,
      onValueChange: (value) => handleAccessibilityChange('hapticFeedback', value),
    },
  ];

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Appearance</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Theme Selector - Modern Cards */}
        <View style={styles.themeSelectorContainer}>
          {/* Light Mode Card */}
          <TouchableOpacity
            style={[
              styles.themeCard,
              { backgroundColor: cardBg },
              themeMode === 'light' && { borderWidth: 2, borderColor: accentColorValue },
            ]}
            onPress={() => handleModeChange('light')}
            activeOpacity={0.8}
          >
            <View style={styles.themePreview}>
              <View style={[styles.previewScreen, styles.previewScreenLight]}>
                <View style={styles.previewStatusBar}>
                  <View style={[styles.previewDot, { backgroundColor: '#FF5F56' }]} />
                  <View style={[styles.previewDot, { backgroundColor: '#FFBD2E' }]} />
                  <View style={[styles.previewDot, { backgroundColor: '#27C93F' }]} />
                </View>
                <View style={styles.previewContent}>
                  <View style={[styles.previewLine, { backgroundColor: '#E5E5EA', width: '80%' }]} />
                  <View style={[styles.previewLine, { backgroundColor: '#E5E5EA', width: '60%' }]} />
                  <View style={[styles.previewLine, { backgroundColor: '#E5E5EA', width: '70%' }]} />
                </View>
              </View>
            </View>
            <View style={styles.themeInfo}>
              <Ionicons 
                name="sunny" 
                size={20} 
                color={themeMode === 'light' ? accentColorValue : '#8E8E93'} 
              />
              <Text style={[
                styles.themeLabel, 
                { color: colors.text },
                themeMode === 'light' && { color: accentColorValue }
              ]}>
                Light
              </Text>
            </View>
            {themeMode === 'light' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={accentColorValue} />
              </View>
            )}
          </TouchableOpacity>

          {/* Dark Mode Card */}
          <TouchableOpacity
            style={[
              styles.themeCard,
              { backgroundColor: cardBg },
              themeMode === 'dark' && { borderWidth: 2, borderColor: accentColorValue },
            ]}
            onPress={() => handleModeChange('dark')}
            activeOpacity={0.8}
          >
            <View style={styles.themePreview}>
              <View style={[styles.previewScreen, styles.previewScreenDark]}>
                <View style={styles.previewStatusBar}>
                  <View style={[styles.previewDot, { backgroundColor: '#FF5F56' }]} />
                  <View style={[styles.previewDot, { backgroundColor: '#FFBD2E' }]} />
                  <View style={[styles.previewDot, { backgroundColor: '#27C93F' }]} />
                </View>
                <View style={styles.previewContent}>
                  <View style={[styles.previewLine, { backgroundColor: '#3A3A3C', width: '80%' }]} />
                  <View style={[styles.previewLine, { backgroundColor: '#3A3A3C', width: '60%' }]} />
                  <View style={[styles.previewLine, { backgroundColor: '#3A3A3C', width: '70%' }]} />
                </View>
              </View>
            </View>
            <View style={styles.themeInfo}>
              <Ionicons 
                name="moon" 
                size={20} 
                color={themeMode === 'dark' ? accentColorValue : '#8E8E93'} 
              />
              <Text style={[
                styles.themeLabel, 
                { color: colors.text },
                themeMode === 'dark' && { color: accentColorValue }
              ]}>
                Dark
              </Text>
            </View>
            {themeMode === 'dark' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={accentColorValue} />
              </View>
            )}
          </TouchableOpacity>

          {/* System Mode Card */}
          <TouchableOpacity
            style={[
              styles.themeCard,
              { backgroundColor: cardBg },
              themeMode === 'system' && { borderWidth: 2, borderColor: accentColorValue },
            ]}
            onPress={() => handleModeChange('system')}
            activeOpacity={0.8}
          >
            <View style={styles.themePreview}>
              <View style={styles.splitPreview}>
                <View style={[styles.halfScreen, styles.halfScreenLight]}>
                  <View style={[styles.halfLine, { backgroundColor: '#E5E5EA' }]} />
                  <View style={[styles.halfLine, { backgroundColor: '#E5E5EA', width: '60%' }]} />
                </View>
                <View style={[styles.halfScreen, styles.halfScreenDark]}>
                  <View style={[styles.halfLine, { backgroundColor: '#3A3A3C' }]} />
                  <View style={[styles.halfLine, { backgroundColor: '#3A3A3C', width: '60%' }]} />
                </View>
              </View>
            </View>
            <View style={styles.themeInfo}>
              <Ionicons 
                name="phone-portrait-outline" 
                size={20} 
                color={themeMode === 'system' ? accentColorValue : '#8E8E93'} 
              />
              <Text style={[
                styles.themeLabel, 
                { color: colors.text },
                themeMode === 'system' && { color: accentColorValue }
              ]}>
                Auto
              </Text>
            </View>
            {themeMode === 'system' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={accentColorValue} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Accent Color Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCENT COLOR</Text>
        </View>
        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          <View style={styles.colorPicker}>
            {ACCENT_COLORS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.colorOption}
                onPress={() => handleAccentChange(item.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.colorCircle,
                  { backgroundColor: item.color },
                  accentColor === item.key && styles.colorCircleSelected,
                ]}>
                  {accentColor === item.key && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[
                  styles.colorLabel,
                  { color: accentColor === item.key ? item.color : colors.textSecondary }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accessibility Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCESSIBILITY</Text>
        </View>
        <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
          {accessibilityItems.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.settingRow,
                index < accessibilityItems.length - 1 && styles.settingRowBorder,
              ]}
            >
              <View style={[styles.settingIconBg, { backgroundColor: item.iconBgColor }]}>
                <Ionicons name={item.icon} size={18} color={item.iconColor} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.onValueChange}
                trackColor={{ false: isDark ? '#39393D' : '#E5E5EA', true: accentColorValue }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#39393D' : '#E5E5EA'}
              />
            </View>
          ))}
        </View>

        {/* Quick Tips */}
        <View style={[styles.tipCard, { backgroundColor: cardBg }]}>
          <View style={[styles.tipIconContainer, { backgroundColor: `${accentColorValue}20` }]}>
            <Ionicons name="bulb" size={20} color={accentColorValue} />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>Pro Tip</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Enable "Auto" mode to automatically switch between light and dark themes based on your device settings.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footerNote, { color: colors.textSecondary }]}>
          Your appearance preferences sync across all your devices when signed in.
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
  
  // Theme Selector Cards
  themeSelectorContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  themeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  themePreview: {
    marginBottom: 10,
  },
  previewScreen: {
    height: 70,
    borderRadius: 8,
    padding: 8,
    overflow: 'hidden',
  },
  previewScreenLight: {
    backgroundColor: '#F5F5F5',
  },
  previewScreenDark: {
    backgroundColor: '#1C1C1E',
  },
  previewStatusBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewContent: {
    gap: 6,
  },
  previewLine: {
    height: 6,
    borderRadius: 3,
  },
  splitPreview: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
  },
  halfScreen: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 6,
  },
  halfScreenLight: {
    backgroundColor: '#F5F5F5',
  },
  halfScreenDark: {
    backgroundColor: '#1C1C1E',
  },
  halfLine: {
    height: 5,
    borderRadius: 2.5,
    width: '80%',
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Section Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  sectionCard: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },

  // Color Picker
  colorPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  colorOption: {
    alignItems: 'center',
    gap: 8,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },

  // Settings Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  settingIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
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

  // Tip Card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.regular,
  },

  // Footer
  footerNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
    fontFamily: FONTS.regular,
  },
});
