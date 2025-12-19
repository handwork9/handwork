import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateHapticSetting } from '../utils/haptics';
import { updateAccessibilitySettings, getAnimationDuration, getScaledFontSize, getFontWeight } from '../utils/accessibility';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'green' | 'blue' | 'purple' | 'orange' | 'pink';

interface AccessibilitySettings {
  reducedMotion: boolean;
  boldText: boolean;
  largeText: boolean;
  hapticFeedback: boolean;
}

const ACCENT_COLOR_VALUES: Record<AccentColor, string> = {
  green: '#16A34A',
  blue: '#007AFF',
  purple: '#AF52DE',
  orange: '#FF9500',
  pink: '#FF2D55',
};

interface ThemeColors {
  // Primary palette
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Secondary palette
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  
  // Accent colors
  accent: string;
  accentDark: string;
  accentLight: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // Background colors
  background: string;
  surface: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderLight: string;
  
  // Other
  overlay: string;
  icon: string;
  iconSecondary: string;
  
  // Order status colors
  orderPending: string;
  orderConfirmed: string;
  orderRiderAssigned: string;
  orderPickedUp: string;
  orderInTransit: string;
  orderDelivered: string;
  orderCancelled: string;
}

interface ThemeContextType {
  isDark: boolean;
  themeMode: ThemeMode;
  colors: ThemeColors;
  accentColor: AccentColor;
  accentColorValue: string;
  accessibility: AccessibilitySettings;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  toggleTheme: () => void;
  // Accessibility helpers
  getFontSize: (baseSize: number) => number;
  getFontWeight: (normalWeight?: 'normal' | '400' | '500' | '600' | '700' | 'bold') => 'normal' | '400' | '500' | '600' | '700' | 'bold';
  getAnimationDuration: (normalDuration: number) => number;
}

const lightColors: ThemeColors = {
  // Primary palette
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#C8E6C9',
  
  // Secondary palette
  secondary: '#FF9800',
  secondaryDark: '#F57C00',
  secondaryLight: '#FFE0B2',
  
  // Accent colors
  accent: '#2196F3',
  accentDark: '#1976D2',
  accentLight: '#BBDEFB',
  
  // Status colors
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FFC107',
  warningLight: '#FFF8E1',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',
  
  // Background colors
  background: '#F8F8F8',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  // Text colors
  text: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textInverse: '#FFFFFF',
  
  // Border colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
  // Other
  overlay: 'rgba(0, 0, 0, 0.5)',
  icon: '#212121',
  iconSecondary: '#757575',
  
  // Order status colors
  orderPending: '#FFC107',
  orderConfirmed: '#2196F3',
  orderRiderAssigned: '#9C27B0',
  orderPickedUp: '#FF9800',
  orderInTransit: '#FF5722',
  orderDelivered: '#4CAF50',
  orderCancelled: '#F44336',
};

const darkColors: ThemeColors = {
  // Primary palette
  primary: '#66BB6A',
  primaryDark: '#4CAF50',
  primaryLight: '#1B5E20',
  
  // Secondary palette
  secondary: '#FFB74D',
  secondaryDark: '#FF9800',
  secondaryLight: '#E65100',
  
  // Accent colors
  accent: '#64B5F6',
  accentDark: '#2196F3',
  accentLight: '#0D47A1',
  
  // Status colors
  success: '#66BB6A',
  successLight: '#1B5E20',
  warning: '#FFCA28',
  warningLight: '#FF6F00',
  error: '#EF5350',
  errorLight: '#B71C1C',
  info: '#64B5F6',
  infoLight: '#0D47A1',
  
  // Background colors
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textDisabled: '#666666',
  textInverse: '#212121',
  
  // Border colors
  border: '#3D3D3D',
  borderLight: '#2C2C2C',
  
  // Other
  overlay: 'rgba(0, 0, 0, 0.7)',
  icon: '#FFFFFF',
  iconSecondary: '#B0B0B0',
  
  // Order status colors
  orderPending: '#FFCA28',
  orderConfirmed: '#64B5F6',
  orderRiderAssigned: '#BA68C8',
  orderPickedUp: '#FFB74D',
  orderInTransit: '#FF8A65',
  orderDelivered: '#66BB6A',
  orderCancelled: '#EF5350',
};

const THEME_STORAGE_KEY = '@handwork_theme_mode';
const ACCENT_STORAGE_KEY = '@handwork_accent_color';
const ACCESSIBILITY_STORAGE_KEY = '@handwork_accessibility';

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reducedMotion: false,
  boldText: false,
  largeText: false,
  hapticFeedback: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>('green');
  const [accessibility, setAccessibilityState] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedMode, savedAccent, savedAccessibility] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(ACCENT_STORAGE_KEY),
          AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY),
        ]);

        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }

        if (savedAccent && ['green', 'blue', 'purple', 'orange', 'pink'].includes(savedAccent)) {
          setAccentColorState(savedAccent as AccentColor);
        }

        if (savedAccessibility) {
          try {
            const parsed = JSON.parse(savedAccessibility);
            const accessibilitySettings = { ...DEFAULT_ACCESSIBILITY, ...parsed };
            setAccessibilityState(accessibilitySettings);
            // Update utilities with saved settings
            updateAccessibilitySettings(accessibilitySettings);
            updateHapticSetting(parsed.hapticFeedback !== false);
          } catch (e) {
            // Invalid JSON, use defaults
          }
        }
      } catch (e) {
        // Error loading, use defaults
      }
      setIsLoaded(true);
    };

    loadPreferences();
  }, []);

  // Determine if dark mode based on theme mode and system preference
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const accentColorValue = useMemo(() => {
    return ACCENT_COLOR_VALUES[accentColor];
  }, [accentColor]);

  const colors = useMemo(() => {
    const baseColors = isDark ? darkColors : lightColors;
    // Override primary color with accent color
    return {
      ...baseColors,
      primary: accentColorValue,
      primaryDark: accentColorValue,
    };
  }, [isDark, accentColorValue]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const setAccentColor = async (color: AccentColor) => {
    setAccentColorState(color);
    await AsyncStorage.setItem(ACCENT_STORAGE_KEY, color);
  };

  const setAccessibility = async (settings: Partial<AccessibilitySettings>) => {
    const newSettings = { ...accessibility, ...settings };
    setAccessibilityState(newSettings);
    await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(newSettings));
    
    // Update accessibility utility with new settings
    updateAccessibilitySettings(newSettings);
    
    // Update haptic utility when hapticFeedback setting changes
    if (settings.hapticFeedback !== undefined) {
      updateHapticSetting(settings.hapticFeedback);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  // Helper function for font scaling based on accessibility settings
  const getFontSizeHelper = (baseSize: number): number => {
    return getScaledFontSize(baseSize);
  };

  // Helper function for font weight based on accessibility settings
  const getFontWeightHelper = (normalWeight: 'normal' | '400' | '500' | '600' | '700' | 'bold' = 'normal') => {
    return getFontWeight(normalWeight);
  };

  // Helper function for animation duration based on accessibility settings
  const getAnimationDurationHelper = (normalDuration: number): number => {
    return getAnimationDuration(normalDuration);
  };

  const value = useMemo(
    () => ({
      isDark,
      themeMode,
      colors,
      accentColor,
      accentColorValue,
      accessibility,
      setThemeMode,
      setAccentColor,
      setAccessibility,
      toggleTheme,
      getFontSize: getFontSizeHelper,
      getFontWeight: getFontWeightHelper,
      getAnimationDuration: getAnimationDurationHelper,
    }),
    [isDark, themeMode, colors, accentColor, accentColorValue, accessibility]
  );

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export colors for components that need static access
export { lightColors, darkColors, ACCENT_COLOR_VALUES };
export type { ThemeColors, ThemeMode, AccentColor, AccessibilitySettings };
