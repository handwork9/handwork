import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESSIBILITY_STORAGE_KEY = '@handwork_accessibility';

export interface AccessibilitySettings {
  reducedMotion: boolean;
  boldText: boolean;
  largeText: boolean;
  hapticFeedback: boolean;
}

// Cache settings to avoid async reads
let cachedSettings: AccessibilitySettings = {
  reducedMotion: false,
  boldText: false,
  largeText: false,
  hapticFeedback: true,
};

// Load settings from storage
export const loadAccessibilitySettings = async (): Promise<AccessibilitySettings> => {
  try {
    const saved = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      cachedSettings = {
        reducedMotion: parsed.reducedMotion ?? false,
        boldText: parsed.boldText ?? false,
        largeText: parsed.largeText ?? false,
        hapticFeedback: parsed.hapticFeedback ?? true,
      };
    }
  } catch {
    // Use defaults
  }
  return cachedSettings;
};

// Initialize on import
loadAccessibilitySettings();

// Update cached settings when they change
export const updateAccessibilitySettings = (settings: Partial<AccessibilitySettings>) => {
  cachedSettings = { ...cachedSettings, ...settings };
};

// Get current settings (sync)
export const getAccessibilitySettings = (): AccessibilitySettings => {
  return cachedSettings;
};

// Check if reduced motion is enabled
export const isReducedMotionEnabled = (): boolean => {
  return cachedSettings.reducedMotion;
};

// Check if bold text is enabled
export const isBoldTextEnabled = (): boolean => {
  return cachedSettings.boldText;
};

// Check if large text is enabled
export const isLargeTextEnabled = (): boolean => {
  return cachedSettings.largeText;
};

// Get animation duration (respects reduced motion)
export const getAnimationDuration = (normalDuration: number): number => {
  return cachedSettings.reducedMotion ? 0 : normalDuration;
};

// Get font size (respects large text setting)
export const getScaledFontSize = (baseSize: number): number => {
  return cachedSettings.largeText ? baseSize * 1.2 : baseSize;
};

// Get font weight (respects bold text setting)
export const getFontWeight = (normalWeight: 'normal' | '400' | '500' | '600' | '700' | 'bold' = 'normal'): 'normal' | '400' | '500' | '600' | '700' | 'bold' => {
  if (!cachedSettings.boldText) return normalWeight;
  
  // Increase weight by one level
  switch (normalWeight) {
    case 'normal':
    case '400':
      return '500';
    case '500':
      return '600';
    case '600':
    case '700':
    case 'bold':
      return 'bold';
    default:
      return '600';
  }
};

// Get font family with bold variant if needed
export const getFontFamily = (baseFamily: string): string => {
  if (!cachedSettings.boldText) return baseFamily;
  
  // Common font family mappings for bold
  const boldMappings: Record<string, string> = {
    'System': 'System',
    'Avenir': 'Avenir-Medium',
    'Avenir-Light': 'Avenir-Medium',
    'Avenir-Medium': 'Avenir-Heavy',
    'Avenir-Heavy': 'Avenir-Black',
    'sans-serif': 'sans-serif-medium',
    'sans-serif-light': 'sans-serif-medium',
    'sans-serif-medium': 'sans-serif',
  };
  
  return boldMappings[baseFamily] || baseFamily;
};
