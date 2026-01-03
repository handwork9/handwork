import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  color,
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const spinnerColor = color || colors.primary;

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
}

// Alias for full screen loading state
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return <LoadingSpinner fullScreen message={message} />;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  iconBackgroundColor?: string;
  gradientColors?: [string, string];
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  iconBackgroundColor = '#E8F5E9',
  gradientColors = ['#4CAF50', '#81C784'],
}: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  
  return (
    <View style={[
      styles.emptyContainer,
      {
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      }
    ]}>
      {/* SVG Background */}
      <View style={styles.emptyBackground}>
        <Svg width={200} height={200}>
          <Defs>
            <SvgLinearGradient id="emptyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="0.08" />
            </SvgLinearGradient>
          </Defs>
          <Circle cx="100" cy="100" r="90" fill="url(#emptyGrad)" />
          <Circle cx="100" cy="100" r="60" fill="url(#emptyGrad)" />
        </Svg>
      </View>
      {icon && (
        <View style={[styles.emptyIconContainer, { backgroundColor: iconBackgroundColor }]}>
          {icon}
        </View>
      )}
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {description && <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>{description}</Text>}
      {action && <View style={styles.emptyAction}>{action}</View>}
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={[styles.errorMessage, { color: colors.error }]}>{message}</Text>
      {onRetry && (
        <Text style={[styles.retryButton, { color: colors.primary }]} onPress={onRetry}>
          Tap to retry
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  emptyBackground: {
    position: 'absolute',
    opacity: 0.8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyAction: {
    marginTop: SPACING.md,
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorMessage: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
