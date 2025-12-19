export const COLORS = {
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
  
  // Neutral colors
  black: '#000000',
  white: '#FFFFFF',
  gray: '#9E9E9E',
  grayLight: '#E0E0E0',
  grayDark: '#424242',
  
  // Background colors
  background: '#F5F5F5',
  backgroundDark: '#303030',
  surface: '#FFFFFF',
  surfaceDark: '#424242',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textWhite: '#FFFFFF',
  
  // Order status colors
  orderPending: '#FFC107',
  orderConfirmed: '#2196F3',
  orderRiderAssigned: '#9C27B0',
  orderPickedUp: '#FF9800',
  orderInTransit: '#FF5722',
  orderDelivered: '#4CAF50',
  orderCancelled: '#F44336',
  
  // Border colors
  border: '#E0E0E0',
  borderDark: '#616161',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Poppins font family
export const FONTS = {
  light: 'Poppins-Light',
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const SCREEN_PADDING = SPACING.md;
