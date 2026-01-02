import React, { forwardRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
  Pressable,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      label,
      error,
      helper,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      disabled = false,
      style,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const { colors, isDark } = useTheme();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: colors.text }]} accessibilityRole="text">
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputContainer,
            { 
              backgroundColor: isDark ? colors.surface : COLORS.surface,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : COLORS.border,
            },
            hasError && styles.inputError,
            disabled && [styles.inputDisabled, { backgroundColor: isDark ? 'rgba(60, 60, 67, 0.12)' : COLORS.grayLight }],
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              { color: colors.text },
              leftIcon ? styles.inputWithLeftIcon : undefined,
              rightIcon ? styles.inputWithRightIcon : undefined,
              style,
            ]}
            placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : colors.textSecondary}
            editable={!disabled}
            accessibilityLabel={label}
            accessibilityHint={helper}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            {...props}
          />
          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.iconRight}
              disabled={!onRightIconPress}
              accessibilityRole="button"
            >
              {rightIcon}
            </Pressable>
          )}
        </View>
        {(error || helper) && (
          <Text style={[styles.helperText, { color: colors.textSecondary }, hasError && styles.errorText]}>
            {error || helper}
          </Text>
        )}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.grayLight,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  iconLeft: {
    paddingLeft: SPACING.md,
  },
  iconRight: {
    paddingRight: SPACING.md,
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
  },
});
