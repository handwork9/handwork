import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { triggerHaptic, triggerMediumHaptic, triggerSelectionHaptic } from '../../utils/haptics';

type HapticType = 'light' | 'medium' | 'selection';

interface TouchableHapticProps extends TouchableOpacityProps {
  hapticType?: HapticType;
  disabled?: boolean;
}

/**
 * TouchableOpacity wrapper that provides haptic feedback on press.
 * Use this component for any touchable element that should trigger haptic feedback.
 * 
 * @param hapticType - Type of haptic feedback: 'light' (default), 'medium', or 'selection'
 * @param disabled - If true, no haptic feedback will be triggered
 */
export const TouchableHaptic: React.FC<TouchableHapticProps> = ({
  onPress,
  hapticType = 'light',
  disabled = false,
  children,
  ...props
}) => {
  const handlePress = (event: any) => {
    if (!disabled) {
      switch (hapticType) {
        case 'medium':
          triggerMediumHaptic();
          break;
        case 'selection':
          triggerSelectionHaptic();
          break;
        case 'light':
        default:
          triggerHaptic();
          break;
      }
    }
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      disabled={disabled}
    >
      {children}
    </TouchableOpacity>
  );
};

export default TouchableHaptic;
