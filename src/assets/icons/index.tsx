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

export default {
  ProductPlusIcon,
  ProductsIcon,
  CalendarIcon,
  BoxIcon,
  CartPlusIcon,
  StoreIcon,
  LeafIcon,
  TruckIcon,
};
