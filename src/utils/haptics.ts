import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESSIBILITY_STORAGE_KEY = '@handwork_accessibility';

// Cache the haptic setting to avoid async reads on every haptic
let hapticEnabled: boolean | null = null;

// Load haptic setting from storage
const loadHapticSetting = async (): Promise<boolean> => {
  try {
    const saved = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.hapticFeedback !== false; // Default to true
    }
    return true;
  } catch {
    return true;
  }
};

// Initialize haptic setting on app start
loadHapticSetting().then((enabled) => {
  hapticEnabled = enabled;
});

// Allow external update when settings change
export const updateHapticSetting = (enabled: boolean) => {
  hapticEnabled = enabled;
};

// Check if haptics should run
const shouldTriggerHaptic = (): boolean => {
  return Platform.OS !== 'web' && hapticEnabled !== false;
};

/**
 * Trigger light haptic feedback for button presses and navigation
 */
export const triggerHaptic = () => {
  if (shouldTriggerHaptic()) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Trigger medium haptic feedback for important actions
 */
export const triggerMediumHaptic = () => {
  if (shouldTriggerHaptic()) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Trigger heavy haptic feedback for significant actions
 */
export const triggerHeavyHaptic = () => {
  if (shouldTriggerHaptic()) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Trigger success haptic feedback
 */
export const triggerSuccessHaptic = () => {
  if (shouldTriggerHaptic()) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Trigger error haptic feedback
 */
export const triggerErrorHaptic = () => {
  if (shouldTriggerHaptic()) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

/**
 * Trigger selection changed haptic feedback
 */
export const triggerSelectionHaptic = () => {
  if (shouldTriggerHaptic()) {
    Haptics.selectionAsync();
  }
};
