import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Users/Community Illustration
export const UsersIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#4CAF50'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="userGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    {/* Center person */}
    <Circle cx="24" cy="14" r="8" fill="url(#userGrad1)" />
    <Path
      d="M12 38C12 30 17 26 24 26C31 26 36 30 36 38"
      fill="url(#userGrad1)"
    />
    {/* Left person */}
    <Circle cx="10" cy="18" r="5" fill={color} opacity="0.7" />
    <Path
      d="M2 36C2 31 5 28 10 28C13 28 15 29 16 31"
      fill={color}
      opacity="0.7"
    />
    {/* Right person */}
    <Circle cx="38" cy="18" r="5" fill={color} opacity="0.7" />
    <Path
      d="M46 36C46 31 43 28 38 28C35 28 33 29 32 31"
      fill={color}
      opacity="0.7"
    />
  </Svg>
);

// Shopping/Orders Illustration
export const OrdersIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#FF9800'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
    </Defs>
    {/* Shopping bag */}
    <Path
      d="M8 16L12 42H36L40 16H8Z"
      fill="url(#bagGrad)"
    />
    <Path
      d="M8 16L12 42H36L40 16H8Z"
      stroke="#E65100"
      strokeWidth="2"
      fill="none"
    />
    {/* Handle */}
    <Path
      d="M16 16V12C16 8 19 6 24 6C29 6 32 8 32 12V16"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Items inside */}
    <Circle cx="18" cy="26" r="4" fill="#FFF3E0" />
    <Circle cx="30" cy="28" r="3" fill="#FFF3E0" />
    <Rect x="22" y="32" width="6" height="6" rx="1" fill="#FFF3E0" />
    {/* Checkmark */}
    <Circle cx="38" cy="10" r="6" fill="#4CAF50" />
    <Path d="M35 10L37 12L41 8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Farmers/Sprout Illustration
export const FarmersIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#8BC34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#558B2F" />
      </LinearGradient>
      <LinearGradient id="potGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
    </Defs>
    {/* Pot */}
    <Path
      d="M12 38L14 46H34L36 38H12Z"
      fill="url(#potGrad)"
    />
    <Ellipse cx="24" cy="38" rx="12" ry="3" fill="#6D4C41" />
    {/* Soil */}
    <Ellipse cx="24" cy="38" rx="10" ry="2" fill="#3E2723" />
    {/* Stem */}
    <Path d="M24 38V22" stroke="#558B2F" strokeWidth="3" strokeLinecap="round" />
    {/* Leaves */}
    <Path
      d="M24 28C24 28 18 26 16 20C14 14 18 8 24 12C24 12 20 8 24 4C28 0 32 6 32 12C32 12 38 8 40 14C42 20 36 26 30 28"
      fill="url(#leafGrad)"
    />
    <Path d="M24 22C24 22 20 18 20 14" stroke="#689F38" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <Path d="M24 22C24 22 28 18 28 14" stroke="#689F38" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    {/* Small sprouts */}
    <Path d="M16 42C16 42 14 40 16 38" stroke="#8BC34A" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M32 42C32 42 34 40 32 38" stroke="#8BC34A" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Deliveries/Truck Illustration
export const DeliveriesIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#2196F3'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="truckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#1565C0" />
      </LinearGradient>
    </Defs>
    {/* Speed lines */}
    <G opacity="0.4">
      <Path d="M2 20H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M0 26H6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 32H10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </G>
    {/* Truck body */}
    <Rect x="8" y="18" width="24" height="18" rx="2" fill="url(#truckGrad)" />
    {/* Cabin */}
    <Path
      d="M32 22H40C42 22 44 24 44 26V36H32V22Z"
      fill="#1565C0"
    />
    {/* Window */}
    <Rect x="34" y="24" width="8" height="6" rx="1" fill="#BBDEFB" />
    {/* Wheels */}
    <Circle cx="16" cy="38" r="5" fill="#37474F" />
    <Circle cx="16" cy="38" r="3" fill="#607D8B" />
    <Circle cx="38" cy="38" r="5" fill="#37474F" />
    <Circle cx="38" cy="38" r="3" fill="#607D8B" />
    {/* Package on truck */}
    <Rect x="12" y="22" width="8" height="8" rx="1" fill="#FFC107" />
    <Path d="M16 22V30M12 26H20" stroke="#FFA000" strokeWidth="1" />
    <Rect x="22" y="24" width="6" height="6" rx="1" fill="#4CAF50" />
  </Svg>
);

// Fast Delivery Illustration
export const FastDeliveryIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF9800" />
      </LinearGradient>
    </Defs>
    {/* Clock face */}
    <Circle cx="24" cy="24" r="20" fill="#E8F5E9" />
    <Circle cx="24" cy="24" r="18" stroke={color} strokeWidth="3" fill="none" />
    {/* Clock hands */}
    <Path d="M24 24V12" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <Path d="M24 24L32 28" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <Circle cx="24" cy="24" r="3" fill={color} />
    {/* Lightning bolt */}
    <Path
      d="M36 8L30 20H36L28 36L34 22H28L36 8Z"
      fill="url(#boltGrad)"
    />
    {/* Speed swoosh */}
    <Path
      d="M8 18C8 18 4 22 4 28C4 34 8 38 8 38"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
  </Svg>
);

// Secure Payment Illustration
export const SecurePaymentIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
    </Defs>
    {/* Shield */}
    <Path
      d="M24 4L6 12V22C6 34 14 42 24 46C34 42 42 34 42 22V12L24 4Z"
      fill="url(#shieldGrad)"
    />
    <Path
      d="M24 6L8 13V22C8 32 15 40 24 44C33 40 40 32 40 22V13L24 6Z"
      fill="#E8F5E9"
      opacity="0.2"
    />
    {/* Lock */}
    <Rect x="18" y="22" width="12" height="10" rx="2" fill="#FFFFFF" />
    <Path
      d="M20 22V18C20 15 22 13 24 13C26 13 28 15 28 18V22"
      stroke="#FFFFFF"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Keyhole */}
    <Circle cx="24" cy="26" r="2" fill={color} />
    <Rect x="23" y="27" width="2" height="3" fill={color} />
    {/* Checkmark */}
    <Circle cx="38" cy="38" r="7" fill="#4CAF50" />
    <Path d="M34 38L37 41L42 35" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Live Tracking Illustration
export const LiveTrackingIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EF4444" />
        <Stop offset="100%" stopColor="#DC2626" />
      </LinearGradient>
      <LinearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
    </Defs>
    {/* Map background */}
    <Rect x="4" y="8" width="40" height="32" rx="4" fill="#E8F5E9" />
    {/* Map lines */}
    <Path d="M4 20H44" stroke="#C8E6C9" strokeWidth="2" />
    <Path d="M4 32H44" stroke="#C8E6C9" strokeWidth="2" />
    <Path d="M16 8V40" stroke="#C8E6C9" strokeWidth="2" />
    <Path d="M32 8V40" stroke="#C8E6C9" strokeWidth="2" />
    {/* Route path */}
    <Path
      d="M12 34C12 34 18 28 24 28C30 28 32 20 38 16"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="6 4"
      fill="none"
    />
    {/* Start point */}
    <Circle cx="12" cy="34" r="4" fill="url(#mapGrad)" />
    <Circle cx="12" cy="34" r="2" fill="#FFFFFF" />
    {/* Location pin */}
    <Path
      d="M38 6C32 6 28 10 28 16C28 24 38 32 38 32C38 32 48 24 48 16C48 10 44 6 38 6Z"
      fill="url(#pinGrad)"
    />
    <Circle cx="38" cy="14" r="4" fill="#FFFFFF" />
    {/* Pulse rings */}
    <Circle cx="38" cy="16" r="10" stroke={color} strokeWidth="1" fill="none" opacity="0.3" />
    <Circle cx="38" cy="16" r="14" stroke={color} strokeWidth="1" fill="none" opacity="0.2" />
  </Svg>
);

// Rewards Illustration
export const RewardsIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF9800" />
      </LinearGradient>
      <LinearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
    </Defs>
    {/* Main star */}
    <Path
      d="M24 4L28 16L40 16L30 24L34 36L24 28L14 36L18 24L8 16L20 16L24 4Z"
      fill="url(#starGrad)"
    />
    {/* Inner glow */}
    <Path
      d="M24 10L26 18L34 18L28 23L30 31L24 26L18 31L20 23L14 18L22 18L24 10Z"
      fill="#FFECB3"
      opacity="0.5"
    />
    {/* Coins */}
    <Circle cx="8" cy="38" r="6" fill="url(#coinGrad)" />
    <Circle cx="8" cy="38" r="4" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.5" />
    <Path d="M6 36V40M5 38H9" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    
    <Circle cx="40" cy="40" r="5" fill="url(#coinGrad)" />
    <Circle cx="40" cy="40" r="3" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.5" />
    
    <Circle cx="42" cy="28" r="4" fill="url(#coinGrad)" />
    {/* Sparkles */}
    <G fill="#FFC107">
      <Circle cx="6" cy="10" r="2" />
      <Circle cx="44" cy="8" r="1.5" />
      <Circle cx="2" cy="24" r="1" />
      <Circle cx="46" cy="20" r="1.5" />
    </G>
  </Svg>
);

// Products Illustration - for farmer stats
export const ProductsIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="prodBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.15" />
        <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
      </LinearGradient>
    </Defs>
    {/* Background circle */}
    <Circle cx="24" cy="24" r="22" fill="url(#prodBgGrad)" />
    {/* Box base */}
    <Path
      d="M10 18L24 10L38 18V32L24 40L10 32V18Z"
      fill={color}
      opacity="0.9"
    />
    {/* Box top highlight */}
    <Path
      d="M10 18L24 10L38 18L24 26L10 18Z"
      fill="#FFFFFF"
      opacity="0.3"
    />
    {/* Box shadow side */}
    <Path
      d="M24 26L38 18V32L24 40V26Z"
      fill="#000000"
      opacity="0.15"
    />
    {/* Center line */}
    <Path d="M24 26V40" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
    {/* Open box flaps */}
    <Path
      d="M10 18L16 14L24 18"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </Svg>
);

// Earnings/Money Illustration - for rider stats
export const EarningsIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="earnBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.15" />
        <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
      </LinearGradient>
    </Defs>
    {/* Background circle */}
    <Circle cx="24" cy="24" r="22" fill="url(#earnBgGrad)" />
    {/* Coin stack base */}
    <Ellipse cx="24" cy="34" rx="14" ry="4" fill={color} opacity="0.3" />
    <Ellipse cx="24" cy="31" rx="14" ry="4" fill={color} opacity="0.5" />
    <Ellipse cx="24" cy="28" rx="14" ry="4" fill={color} opacity="0.7" />
    <Ellipse cx="24" cy="25" rx="14" ry="4" fill={color} opacity="0.85" />
    <Ellipse cx="24" cy="22" rx="14" ry="4" fill={color} />
    {/* Naira symbol on top */}
    <Path 
      d="M19 19V25M29 19V25M17 21H31M17 23H31" 
      stroke="#FFFFFF" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    {/* Rising arrow */}
    <Path
      d="M36 16L40 10M40 10L44 16M40 10V20"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Rating/Star Illustration - for both farmer and rider stats
export const RatingIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="ratingBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFC107" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#FF9800" stopOpacity="0.1" />
      </LinearGradient>
      <LinearGradient id="starFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
    </Defs>
    {/* Background circle */}
    <Circle cx="24" cy="24" r="22" fill="url(#ratingBgGrad)" />
    {/* Main star */}
    <Path
      d="M24 6L29.5 17.5L42 19.5L33 28.5L35 41L24 35L13 41L15 28.5L6 19.5L18.5 17.5L24 6Z"
      fill="url(#starFillGrad)"
    />
    {/* Star highlight */}
    <Path
      d="M24 10L28 18.5L37 20L30 27L31.5 36L24 32L16.5 36L18 27L11 20L20 18.5L24 10Z"
      fill="#FFFFFF"
      opacity="0.3"
    />
    {/* Shine effect */}
    <Circle cx="18" cy="16" r="2" fill="#FFFFFF" opacity="0.6" />
  </Svg>
);

// Saved/Bookmark Illustration - for buyer stats
export const SavedIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="savedBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E91E63" stopOpacity="0.15" />
        <Stop offset="100%" stopColor="#E91E63" stopOpacity="0.05" />
      </LinearGradient>
    </Defs>
    {/* Background circle */}
    <Circle cx="24" cy="24" r="22" fill="url(#savedBgGrad)" />
    {/* Heart shape */}
    <Path
      d="M24 38C24 38 8 28 8 18C8 12 13 8 19 8C22 8 24 10 24 10C24 10 26 8 29 8C35 8 40 12 40 18C40 28 24 38 24 38Z"
      fill="#E91E63"
    />
    {/* Heart highlight */}
    <Path
      d="M19 12C15 12 12 15 12 18C12 20 13 22 14 24"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.5"
    />
    {/* Small heart badge */}
    <Circle cx="38" cy="12" r="6" fill={color} />
    <Path
      d="M38 15C38 15 34 12 34 10C34 9 35 8 36 8C37 8 38 9 38 9C38 9 39 8 40 8C41 8 42 9 42 10C42 12 38 15 38 15Z"
      fill="#FFFFFF"
    />
  </Svg>
);

// Reviews/Points Illustration - for buyer stats
export const ReviewsIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="reviewBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.15" />
        <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
      </LinearGradient>
    </Defs>
    {/* Background circle */}
    <Circle cx="24" cy="24" r="22" fill="url(#reviewBgGrad)" />
    {/* Trophy/Award cup */}
    <Path
      d="M14 12H34V18C34 26 30 32 24 34C18 32 14 26 14 18V12Z"
      fill={color}
    />
    {/* Cup highlight */}
    <Path
      d="M16 14H32V18C32 24 29 29 24 31"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.3"
    />
    {/* Handles */}
    <Path
      d="M14 14H10C10 14 8 14 8 18C8 22 10 22 10 22H14"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Path
      d="M34 14H38C38 14 40 14 40 18C40 22 38 22 38 22H34"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Base */}
    <Path d="M20 34H28V38H20V34Z" fill={color} />
    <Path d="M16 38H32V42H16V38Z" fill={color} opacity="0.7" />
    {/* Star on cup */}
    <Path
      d="M24 18L25.5 21L29 21.5L26.5 24L27 27.5L24 26L21 27.5L21.5 24L19 21.5L22.5 21L24 18Z"
      fill="#FFD54F"
    />
  </Svg>
);

// ========================================
// WALLET HERO ILLUSTRATIONS
// ========================================

// Wallet Hero Illustration - for wallet screen
export const WalletHeroIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#FFFFFF'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    {/* Wallet body */}
    <Path
      d="M6 14C6 11.79 7.79 10 10 10H38C40.21 10 42 11.79 42 14V38C42 40.21 40.21 42 38 42H10C7.79 42 6 40.21 6 38V14Z"
      fill={color}
    />
    {/* Wallet flap/top section */}
    <Path
      d="M6 14C6 11.79 7.79 10 10 10H38C40.21 10 42 11.79 42 14V18H6V14Z"
      fill={color}
      opacity="0.5"
    />
    {/* Card slot on right */}
    <Path
      d="M42 24H32C30.9 24 30 24.9 30 26V30C30 31.1 30.9 32 32 32H42"
      fill={color}
      opacity="0.3"
    />
    <Circle cx="34" cy="28" r="2" fill={color} opacity="0.5" />
    {/* Naira symbol centered */}
    <G opacity="0.9">
      <Path d="M18 22V34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M24 22V34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M16 26H26" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 30H26" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </G>
  </Svg>
);

// Top Up Hero Illustration - for top up screen
export const TopUpHeroIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#FFFFFF'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    {/* Wallet body */}
    <Path
      d="M4 16C4 13.79 5.79 12 8 12H32C34.21 12 36 13.79 36 16V40C36 42.21 34.21 44 32 44H8C5.79 44 4 42.21 4 40V16Z"
      fill={color}
    />
    {/* Wallet flap */}
    <Path
      d="M4 16C4 13.79 5.79 12 8 12H32C34.21 12 36 13.79 36 16V20H4V16Z"
      fill={color}
      opacity="0.5"
    />
    {/* Naira symbol */}
    <G opacity="0.7">
      <Path d="M14 26V36" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M20 26V36" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 30H22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </G>
    {/* Plus circle badge */}
    <Circle cx="38" cy="14" r="10" fill={color} />
    <Path
      d="M38 9V19M33 14H43"
      stroke="#16A34A"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Downward arrow into wallet */}
    <G opacity="0.6">
      <Path d="M42 28V38" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M38 34L42 38L46 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

// Withdraw Hero Illustration - for withdraw screen
export const WithdrawHeroIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#FFFFFF'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    {/* Wallet body */}
    <Path
      d="M12 14C12 11.79 13.79 10 16 10H40C42.21 10 44 11.79 44 14V38C44 40.21 42.21 42 40 42H16C13.79 42 12 40.21 12 38V14Z"
      fill={color}
    />
    {/* Wallet flap */}
    <Path
      d="M12 14C12 11.79 13.79 10 16 10H40C42.21 10 44 11.79 44 14V18H12V14Z"
      fill={color}
      opacity="0.5"
    />
    {/* Naira symbol */}
    <G opacity="0.7">
      <Path d="M22 22V32" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M28 22V32" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M20 26H30" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </G>
    {/* Bank icon on left */}
    <G>
      <Path d="M2 20L8 14L14 20V34H2V20Z" fill={color} />
      <Rect x="4" y="24" width="2" height="8" fill="#FF9500" opacity="0.8" />
      <Rect x="8" y="24" width="2" height="8" fill="#FF9500" opacity="0.8" />
      <Rect x="12" y="24" width="2" height="8" fill="#FF9500" opacity="0.8" />
    </G>
    {/* Outward arrow */}
    <G opacity="0.6">
      <Path d="M2 40H12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M8 36L2 40L8 44" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

export default {
  UsersIllustration,
  OrdersIllustration,
  FarmersIllustration,
  DeliveriesIllustration,
  FastDeliveryIllustration,
  SecurePaymentIllustration,
  LiveTrackingIllustration,
  RewardsIllustration,
  ProductsIllustration,
  EarningsIllustration,
  RatingIllustration,
  SavedIllustration,
  ReviewsIllustration,
  WalletHeroIllustration,
  TopUpHeroIllustration,
  WithdrawHeroIllustration,
};
