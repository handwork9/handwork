import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Product Plus Icon - Shopping bag with plus sign
 * Used for "Add Product" actions
 */
export const ProductPlusIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Bag handle */}
    <Path 
      d="M8 6V5C8 3.343 9.343 2 11 2h2c1.657 0 3 1.343 3 3v1"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Bag body */}
    <Path 
      d="M4 8C4 6.895 4.895 6 6 6h12c1.105 0 2 .895 2 2v10c0 1.657-1.343 3-3 3H7c-1.657 0-3-1.343-3-3V8z"
      fill={color}
      opacity={0.12}
    />
    <Path 
      d="M4 8C4 6.895 4.895 6 6 6h12c1.105 0 2 .895 2 2v10c0 1.657-1.343 3-3 3H7c-1.657 0-3-1.343-3-3V8z"
      stroke={color}
      strokeWidth="1.8"
    />
    {/* Plus sign */}
    <Path d="M12 10v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M9 13h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * Products Icon - Shopping bag
 * Used for products list/stats
 */
export const ProductsIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Bag handle */}
    <Path 
      d="M6 6.5V5.5C6 3.567 7.567 2 9.5 2h5C16.433 2 18 3.567 18 5.5v1"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Bag body */}
    <Path 
      d="M3.5 8.5C3.5 7.395 4.395 6.5 5.5 6.5h13c1.105 0 2 .895 2 2v10c0 1.657-1.343 3-3 3H6.5c-1.657 0-3-1.343-3-3v-10z"
      fill={color}
      opacity={0.12}
    />
    <Path 
      d="M3.5 8.5C3.5 7.395 4.395 6.5 5.5 6.5h13c1.105 0 2 .895 2 2v10c0 1.657-1.343 3-3 3H6.5c-1.657 0-3-1.343-3-3v-10z"
      stroke={color}
      strokeWidth="1.8"
    />
    {/* Lines */}
    <Path d="M8 11h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M8 14.5h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
  </Svg>
);

/**
 * Calendar Icon - For dates/joined stats
 */
export const CalendarIcon = ({ size = 24, color = '#43A047' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Calendar body */}
    <Rect x="3" y="5" width="18" height="16" rx="3" fill={color} opacity={0.12} />
    <Rect x="3" y="5" width="18" height="16" rx="3" stroke={color} strokeWidth="1.8" />
    {/* Header line */}
    <Path d="M3 10h18" stroke={color} strokeWidth="1.8" />
    {/* Rings */}
    <Path d="M8 3v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M16 3v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    {/* Date dot */}
    <Circle cx="12" cy="15" r="2" fill={color} />
  </Svg>
);

/**
 * Box Icon - Package/shipping box
 */
export const BoxIcon = ({ size = 24, color = '#FF9500' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Box body */}
    <Path 
      d="M3 8l9-5 9 5v8l-9 5-9-5V8z"
      fill={color}
      opacity={0.12}
    />
    <Path 
      d="M3 8l9-5 9 5v8l-9 5-9-5V8z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Center line */}
    <Path d="M12 11v10" stroke={color} strokeWidth="1.8" />
    {/* Top cross */}
    <Path d="M3 8l9 4 9-4" stroke={color} strokeWidth="1.8" />
  </Svg>
);

/**
 * Cart Plus Icon - Shopping cart with plus
 */
export const CartPlusIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Cart body */}
    <Path 
      d="M4 4h2l2.68 13.39a2 2 0 002 1.61h8.72a2 2 0 002-1.61L23 6H6"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Wheels */}
    <Circle cx="9" cy="21" r="1" fill={color} />
    <Circle cx="18" cy="21" r="1" fill={color} />
    {/* Plus sign */}
    <Path d="M14 9v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M12 11h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

/**
 * Store Icon - Shop/storefront
 */
export const StoreIcon = ({ size = 24, color = '#5856D6' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Roof */}
    <Path 
      d="M3 9l2-5h14l2 5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Awning */}
    <Path 
      d="M3 9c0 1.657 1.343 3 3 3s3-1.343 3-3c0 1.657 1.343 3 3 3s3-1.343 3-3c0 1.657 1.343 3 3 3s3-1.343 3-3"
      stroke={color}
      strokeWidth="1.8"
    />
    {/* Building */}
    <Path 
      d="M4 12v8h16v-8"
      stroke={color}
      strokeWidth="1.8"
    />
    {/* Door */}
    <Rect x="9" y="14" width="6" height="6" rx="1" fill={color} opacity={0.12} stroke={color} strokeWidth="1.5" />
  </Svg>
);

/**
 * Leaf Icon - For farm/organic products
 */
export const LeafIcon = ({ size = 24, color = '#34C759' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M6 21c4-4 6-9 6-14 0 5 2 10 6 14"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path 
      d="M12 7c-2 0-6 2-6 9 0 0 3-2 6-2s6 2 6 2c0-7-4-9-6-9z"
      fill={color}
      opacity={0.15}
    />
    <Path 
      d="M12 7c-2 0-6 2-6 9 0 0 3-2 6-2s6 2 6 2c0-7-4-9-6-9z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Stem */}
    <Path d="M12 14v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

/**
 * Truck Icon - For delivery
 */
export const TruckIcon = ({ size = 24, color = '#FF9500' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Truck body */}
    <Rect x="1" y="6" width="14" height="10" rx="2" fill={color} opacity={0.12} stroke={color} strokeWidth="1.8" />
    {/* Cabin */}
    <Path 
      d="M15 10h4l3 4v2h-7v-6z"
      fill={color}
      opacity={0.12}
    />
    <Path 
      d="M15 10h4l3 4v2h-7v-6z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Wheels */}
    <Circle cx="6" cy="17" r="2" fill={color} />
    <Circle cx="18" cy="17" r="2" fill={color} />
  </Svg>
);

/**
 * Add To Bag Icon - Compact bag with plus for product cards
 */
export const AddToBagIcon = ({ size = 18, color = '#FFFFFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Bag handle */}
    <Path 
      d="M8 8V6a4 4 0 118 0v2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Bag body */}
    <Path 
      d="M5 8h14l1 13H4L5 8z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Plus */}
    <Path d="M12 12v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M9.5 14.5h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * Heart Icon - For favorites (outline)
 */
export const HeartIcon = ({ size = 18, color = '#FF4757', filled = false }: IconProps & { filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth="2"
    />
  </Svg>
);

/**
 * Star Icon - For ratings
 */
export const StarIcon = ({ size = 14, color = '#FFB800', filled = true }: IconProps & { filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Verified Badge Icon - Checkmark circle
 */
export const VerifiedIcon = ({ size = 14, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Path 
      d="M8 12l3 3 5-6"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Organic Leaf Icon - Small badge for organic products
 */
export const OrganicLeafIcon = ({ size = 10, color = '#34C759' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 3c-4 0-8 4-8 10 0 0 4-2 8-2s8 2 8 2c0-6-4-10-8-10z"
      fill={color}
    />
    <Path d="M12 13v8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * Fresh Sun Icon - For fresh products
 */
export const FreshSunIcon = ({ size = 10, color = '#FF9500' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="5" fill={color} />
    <Path d="M12 2v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 19v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M4.22 4.22l2.12 2.12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M17.66 17.66l2.12 2.12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M2 12h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M19 12h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M4.22 19.78l2.12-2.12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M17.66 6.34l2.12-2.12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ============================================
// FARM-TO-TABLE JOURNEY ICONS
// ============================================

/**
 * Farm Origin Icon - Barn/Farm building for journey step
 */
export const FarmIcon = ({ size = 24, color = '#4CAF50' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Barn roof */}
    <Path 
      d="M3 12L12 4l9 8" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Barn body */}
    <Path 
      d="M5 10v10h14V10" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Barn door */}
    <Path 
      d="M9 20v-6a3 3 0 0 1 6 0v6" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Hay loft window */}
    <Circle cx="12" cy="12" r="1.5" stroke={color} strokeWidth="1.5" fill="none" />
  </Svg>
);

/**
 * Harvest Icon - Calendar with leaf for harvest date
 */
export const HarvestIcon = ({ size = 24, color = '#FF9800' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Calendar body */}
    <Rect 
      x="3" y="4" 
      width="18" height="18" 
      rx="2" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Calendar top hooks */}
    <Path d="M8 2v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Path d="M16 2v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    {/* Divider line */}
    <Path d="M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    {/* Small plant/sprout in calendar */}
    <Path 
      d="M12 14c-1.5 0-2.5 1-2.5 2.5S12 19 12 19s2.5-1 2.5-2.5S13.5 14 12 14z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

/**
 * Quality Check Icon - Shield with checkmark
 */
export const QualityCheckIcon = ({ size = 24, color = '#2196F3' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Shield */}
    <Path 
      d="M12 3L4 7v5c0 5.25 3.4 10.1 8 11 4.6-.9 8-5.75 8-11V7l-8-4z" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Checkmark */}
    <Path 
      d="M8.5 12l2.5 2.5 4.5-4.5" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Delivery Home Icon - House with door for delivery destination
 */
export const DeliveryHomeIcon = ({ size = 24, color = '#22C55E' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* House roof */}
    <Path 
      d="M3 11l9-8 9 8" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* House body */}
    <Path 
      d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Door */}
    <Path 
      d="M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

export default {
  ProductPlusIcon,
  ProductsIcon,
  CalendarIcon,
  BoxIcon,
  CartPlusIcon,
  StoreIcon,
  LeafIcon,
  TruckIcon,
  AddToBagIcon,
  HeartIcon,
  StarIcon,
  VerifiedIcon,
  OrganicLeafIcon,
  FreshSunIcon,
  FarmIcon,
  HarvestIcon,
  QualityCheckIcon,
  DeliveryHomeIcon,
};
