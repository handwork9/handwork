import React from 'react';
import Svg, { Path, Rect, Circle, G, Line, Polyline } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// ============================================
// CHECKOUT SCREEN ICONS
// ============================================

/**
 * Chevron Back Icon - iOS style back arrow
 */
export const ChevronBackIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M15 19l-7-7 7-7" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Chevron Forward Icon - iOS style forward arrow
 */
export const ChevronForwardIcon = ({ size = 24, color = '#C7C7CC' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M9 5l7 7-7 7" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Chevron Up Icon
 */
export const ChevronUpIcon = ({ size = 24, color = '#8E8E93' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M18 15l-6-6-6 6" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Chevron Down Icon
 */
export const ChevronDownIcon = ({ size = 24, color = '#8E8E93' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M6 9l6 6 6-6" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Lock Closed Icon - Security indicator
 */
export const LockClosedIcon = ({ size = 24, color = '#8E8E93' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.8" />
    <Path 
      d="M8 11V7a4 4 0 0 1 8 0v4" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round"
    />
    <Circle cx="12" cy="16" r="1.5" fill={color} />
  </Svg>
);

/**
 * Checkmark Icon - Simple checkmark
 */
export const CheckmarkIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M5 12l5 5L20 7" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Checkmark Circle Icon - Filled circle with checkmark
 */
export const CheckmarkCircleIcon = ({ size = 24, color = '#34C759' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color} />
    <Path 
      d="M7 12l3.5 3.5L17 9" 
      stroke="#FFFFFF" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Checkmark Circle Outline Icon
 */
export const CheckmarkCircleOutlineIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path 
      d="M8 12l2.5 2.5L16 10" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Cube Outline Icon - Package/box outline
 */
export const CubeOutlineIcon = ({ size = 24, color = '#8E8E93' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <Path d="M3.27 6.96L12 12.01l8.73-5.05" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 22.08V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/**
 * Location Outline Icon - Map pin
 */
export const LocationOutlineIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8" />
  </Svg>
);

/**
 * Gift Outline Icon - Gift box
 */
export const GiftOutlineIcon = ({ size = 24, color = '#E91E63' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="8" width="18" height="4" rx="1" stroke={color} strokeWidth="1.8" />
    <Path d="M12 8v13" stroke={color} strokeWidth="1.8" />
    <Path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="1.8" />
    <Path 
      d="M7.5 8C7.5 8 7.5 4.5 9.75 4.5S12 8 12 8" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round"
    />
    <Path 
      d="M16.5 8C16.5 8 16.5 4.5 14.25 4.5S12 8 12 8" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Wallet Icon - Payment wallet
 */
export const WalletIcon = ({ size = 24, color = '#43A047' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="6" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" />
    <Path d="M2 10h20" stroke={color} strokeWidth="1.8" />
    <Circle cx="16" cy="14" r="1.5" fill={color} />
    <Path d="M6 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

/**
 * Card Icon - Credit/debit card
 */
export const CardIcon = ({ size = 24, color = '#1976D2' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" />
    <Path d="M2 10h20" stroke={color} strokeWidth="1.8" />
    <Path d="M6 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

/**
 * People Icon - Multiple users
 */
export const PeopleIcon = ({ size = 24, color = '#FF6B00' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth="1.8" />
    <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Circle cx="17" cy="7" r="2.5" stroke={color} strokeWidth="1.5" />
    <Path d="M17 11.5a3.5 3.5 0 0 1 3.5 3.5v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/**
 * Arrow Forward Icon
 */
export const ArrowForwardIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M5 12h14M13 6l6 6-6 6" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Link Icon - Chain link
 */
export const LinkIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <Path 
      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Share Outline Icon
 */
export const ShareOutlineIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <Polyline 
      points="16 6 12 2 8 6" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <Line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/**
 * Copy Outline Icon
 */
export const CopyOutlineIcon = ({ size = 24, color = '#000000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="11" height="11" rx="2" stroke={color} strokeWidth="1.8" />
    <Path 
      d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Bag Check Icon - Shopping bag with checkmark
 */
export const BagCheckIcon = ({ size = 24, color = '#43A047' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M6 6h12l1.5 14H4.5L6 6z" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinejoin="round"
    />
    <Path 
      d="M9 6V5a3 3 0 0 1 6 0v1" 
      stroke={color} 
      strokeWidth="1.8" 
      strokeLinecap="round"
    />
    <Path 
      d="M9 13l2 2 4-4" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Time Outline Icon - Clock
 */
export const TimeOutlineIcon = ({ size = 24, color = '#8E8E93' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/**
 * Add Circle Outline Icon
 */
export const AddCircleOutlineIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

// ============================================
// ORIGINAL ICONS
// ============================================

/**
 * Face ID Icon - Apple-style Face ID scanning icon
 * Used for biometric authentication
 */
export const FaceIDIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Corner brackets */}
    {/* Top left */}
    <Path 
      d="M4 8V6C4 4.895 4.895 4 6 4H8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Top right */}
    <Path 
      d="M16 4H18C19.105 4 20 4.895 20 6V8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Bottom left */}
    <Path 
      d="M4 16V18C4 19.105 4.895 20 6 20H8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Bottom right */}
    <Path 
      d="M16 20H18C19.105 20 20 19.105 20 18V16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Face elements - eyes */}
    <Circle cx="9" cy="10" r="1.2" fill={color} />
    <Circle cx="15" cy="10" r="1.2" fill={color} />
    {/* Nose */}
    <Path 
      d="M12 10.5V13"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Mouth smile */}
    <Path 
      d="M9.5 15C10 16 11 16.5 12 16.5C13 16.5 14 16 14.5 15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * Fingerprint Icon - Custom fingerprint scanning icon
 * Used for biometric authentication
 */
export const FingerprintIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Fingerprint ridges */}
    <Path 
      d="M12 3C8.134 3 5 6.134 5 10C5 11.5 5.5 13.5 6.5 15.5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path 
      d="M7.5 7C9 5.5 10.5 5 12 5C14.761 5 17 7.239 17 10C17 12 16.5 14 15.5 16"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path 
      d="M9 9C9.5 8 10.5 7 12 7C13.657 7 15 8.343 15 10C15 11.5 14.5 13.5 13.5 15.5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path 
      d="M12 9V10C12 12 11.5 14 10.5 16.5C10 18 9 20 8 21"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path 
      d="M17.5 13C17 15 16 17.5 14.5 20"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <Path 
      d="M19 10C19.5 12 19 14 18 16.5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
);

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

/**
 * View All Stories Icon - Multiple circles representing more stories
 */
export const ViewAllStoriesIcon = ({ size = 24, color = '#007AFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Top left circle */}
    <Circle cx="7" cy="7" r="3" fill={color} opacity={0.9} />
    {/* Top right circle */}
    <Circle cx="17" cy="7" r="3" fill={color} opacity={0.7} />
    {/* Bottom left circle */}
    <Circle cx="7" cy="17" r="3" fill={color} opacity={0.5} />
    {/* Bottom right - plus symbol */}
    <Circle cx="17" cy="17" r="3.5" stroke={color} strokeWidth="1.5" fill="none" />
    <Path d="M17 15v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M15 17h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/**
 * Menu Icon - Modern hamburger menu with staggered lines
 * Used for main navigation/quick menu access
 */
export const MenuIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Top line - shorter */}
    <Rect x="4" y="6" width="10" height="2.5" rx="1.25" fill={color} />
    {/* Middle line - full width */}
    <Rect x="4" y="10.75" width="16" height="2.5" rx="1.25" fill={color} />
    {/* Bottom line - medium */}
    <Rect x="4" y="15.5" width="13" height="2.5" rx="1.25" fill={color} />
  </Svg>
);

/**
 * Menu Grid Icon - Modern grid-based menu icon
 * Alternative style for quick actions menu
 */
export const MenuGridIcon = ({ size = 24, color = '#FFFFFF' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Top row dots */}
    <Circle cx="6" cy="6" r="2.5" fill={color} />
    <Circle cx="12" cy="6" r="2.5" fill={color} />
    <Circle cx="18" cy="6" r="2.5" fill={color} opacity={0.6} />
    {/* Bottom row dots */}
    <Circle cx="6" cy="12" r="2.5" fill={color} />
    <Circle cx="12" cy="12" r="2.5" fill={color} opacity={0.8} />
    <Circle cx="18" cy="12" r="2.5" fill={color} opacity={0.4} />
    {/* Third row - just two */}
    <Circle cx="6" cy="18" r="2.5" fill={color} opacity={0.6} />
    <Circle cx="12" cy="18" r="2.5" fill={color} opacity={0.4} />
  </Svg>
);

/**
 * Apps Menu Icon - Clean 4-dot bento/apps style menu
 * Modern minimal design
 */
export const AppsMenuIcon = ({ size = 24, color = '#000000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* 2x2 grid of rounded squares */}
    <Rect x="4" y="4" width="6.5" height="6.5" rx="2" fill={color} />
    <Rect x="13.5" y="4" width="6.5" height="6.5" rx="2" fill={color} opacity={0.7} />
    <Rect x="4" y="13.5" width="6.5" height="6.5" rx="2" fill={color} opacity={0.7} />
    <Rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" fill={color} opacity={0.5} />
  </Svg>
);

/**
 * Filter Icon - Modern sliders/filter icon
 * Used for filtering or settings menu
 */
export const FilterIcon = ({ size = 24, color = '#000000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Top line with circle */}
    <Path d="M4 6h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="11" cy="6" r="2.5" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M13.5 6h6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Middle line with circle */}
    <Path d="M4 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="16" cy="12" r="2.5" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M18.5 12h1.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Bottom line with circle */}
    <Path d="M4 18h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="9" cy="18" r="2.5" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M11.5 18h8.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default {
  // Checkout icons
  ChevronBackIcon,
  ChevronForwardIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  LockClosedIcon,
  CheckmarkIcon,
  CheckmarkCircleIcon,
  CheckmarkCircleOutlineIcon,
  CubeOutlineIcon,
  LocationOutlineIcon,
  GiftOutlineIcon,
  WalletIcon,
  CardIcon,
  PeopleIcon,
  ArrowForwardIcon,
  LinkIcon,
  ShareOutlineIcon,
  CopyOutlineIcon,
  BagCheckIcon,
  TimeOutlineIcon,
  AddCircleOutlineIcon,
  // Original icons
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
  ViewAllStoriesIcon,
  MenuIcon,
  MenuGridIcon,
  AppsMenuIcon,
  FilterIcon,
};
