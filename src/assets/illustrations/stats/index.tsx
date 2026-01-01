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

// Quick Actions Illustration - Lightning bolt with grid
export const QuickActionsIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#7C3AED'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="quickGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#5B21B6" />
      </LinearGradient>
      <LinearGradient id="quickBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF9800" />
      </LinearGradient>
    </Defs>
    {/* Grid squares */}
    <Rect x="4" y="4" width="16" height="16" rx="4" fill="url(#quickGrad1)" opacity="0.9" />
    <Rect x="24" y="4" width="16" height="16" rx="4" fill={color} opacity="0.6" />
    <Rect x="4" y="24" width="16" height="16" rx="4" fill={color} opacity="0.6" />
    <Rect x="24" y="24" width="16" height="16" rx="4" fill={color} opacity="0.4" />
    {/* Icons in grid */}
    <Path d="M10 12H16M12 10V14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <Circle cx="32" cy="12" r="4" stroke="#FFFFFF" strokeWidth="2" fill="none" />
    <Path d="M10 32L14 36L18 30" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M30 30H34M30 34H36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    {/* Lightning bolt overlay */}
    <Path
      d="M38 2L28 18H36L26 38L34 20H26L38 2Z"
      fill="url(#quickBoltGrad)"
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
// FARMER DASHBOARD STAT ILLUSTRATIONS
// ========================================

// Pending Orders Illustration - Modern clipboard with notification
export const PendingOrdersIllustration: React.FC<IllustrationProps> = ({
  width = 64,
  height = 64,
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="pendingClipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFE0B2" />
        <Stop offset="100%" stopColor="#FFCC80" />
      </LinearGradient>
      <LinearGradient id="pendingPaperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#F5F5F5" />
      </LinearGradient>
      <LinearGradient id="pendingBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#F57C00" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="32" cy="58" rx="18" ry="4" fill="#000000" opacity="0.1" />
    {/* Clipboard back */}
    <Rect x="12" y="10" width="36" height="46" rx="4" fill="#8D6E63" />
    {/* Clipboard clip */}
    <Rect x="22" y="6" width="16" height="10" rx="2" fill="url(#pendingClipGrad)" />
    <Rect x="26" y="4" width="8" height="4" rx="2" fill="#FFB74D" />
    {/* Paper */}
    <Rect x="14" y="14" width="32" height="40" rx="2" fill="url(#pendingPaperGrad)" />
    {/* List items */}
    <Rect x="18" y="20" width="12" height="3" rx="1.5" fill="#FFE0B2" />
    <Rect x="18" y="27" width="24" height="2" rx="1" fill="#E0E0E0" />
    <Rect x="18" y="32" width="20" height="2" rx="1" fill="#E0E0E0" />
    <Rect x="18" y="39" width="12" height="3" rx="1.5" fill="#FFE0B2" />
    <Rect x="18" y="46" width="22" height="2" rx="1" fill="#E0E0E0" />
    {/* Checkboxes */}
    <Rect x="32" y="19" width="5" height="5" rx="1" fill="#FF9800" opacity="0.2" />
    <Rect x="32" y="38" width="5" height="5" rx="1" fill="#FF9800" opacity="0.2" />
    {/* Notification badge */}
    <Circle cx="48" cy="14" r="10" fill="url(#pendingBadgeGrad)" />
    <Circle cx="48" cy="14" r="8" fill="#FF9800" />
    <Path d="M48 9V14L51 16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Processing Orders Illustration - Modern package box with gears
export const ProcessingOrdersIllustration: React.FC<IllustrationProps> = ({
  width = 64,
  height = 64,
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="processBoxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#42A5F5" />
        <Stop offset="100%" stopColor="#1E88E5" />
      </LinearGradient>
      <LinearGradient id="processBoxSide" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#1976D2" />
        <Stop offset="100%" stopColor="#1565C0" />
      </LinearGradient>
      <LinearGradient id="processBoxTop" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#64B5F6" />
        <Stop offset="100%" stopColor="#90CAF9" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="28" cy="58" rx="20" ry="4" fill="#000000" opacity="0.12" />
    {/* Box - back face */}
    <Path d="M8 24L28 14L48 24V48L28 58L8 48V24Z" fill="url(#processBoxGrad)" />
    {/* Box - top face */}
    <Path d="M8 24L28 14L48 24L28 34L8 24Z" fill="url(#processBoxTop)" />
    {/* Box - right face (shadow) */}
    <Path d="M28 34L48 24V48L28 58V34Z" fill="url(#processBoxSide)" />
    {/* Box tape */}
    <Path d="M28 14V34" stroke="#BBDEFB" strokeWidth="4" />
    <Path d="M8 24L28 34L48 24" stroke="#BBDEFB" strokeWidth="4" fill="none" />
    {/* Gear badge - larger */}
    <Circle cx="52" cy="18" r="11" fill="#FFFFFF" />
    <Circle cx="52" cy="18" r="9" fill="#1E88E5" />
    {/* Gear teeth */}
    <Path d="M52 10V12M52 24V26M44 18H46M58 18H60M46.3 12.3L47.7 13.7M56.3 22.3L57.7 23.7M46.3 23.7L47.7 22.3M56.3 13.7L57.7 12.3" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" />
    {/* Inner gear */}
    <Circle cx="52" cy="18" r="4" fill="#FFFFFF" />
    <Circle cx="52" cy="18" r="2" fill="#1E88E5" />
    {/* Motion lines */}
    <Path d="M4 32H10" stroke="#64B5F6" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <Path d="M2 38H8" stroke="#64B5F6" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <Path d="M6 44H12" stroke="#64B5F6" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </Svg>
);

// Products/Inventory Illustration - Stacked boxes with plant
export const InventoryIllustration: React.FC<IllustrationProps> = ({
  width = 64,
  height = 64,
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="invBox1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#66BB6A" />
      </LinearGradient>
      <LinearGradient id="invBox1Side" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#43A047" />
      </LinearGradient>
      <LinearGradient id="invBox2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A5D6A7" />
        <Stop offset="100%" stopColor="#81C784" />
      </LinearGradient>
      <LinearGradient id="invLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="30" cy="60" rx="22" ry="3" fill="#000000" opacity="0.1" />
    {/* Back box */}
    <Path d="M20 20L38 11L56 20V38L38 47L20 38V20Z" fill="url(#invBox2Grad)" opacity="0.7" />
    <Path d="M20 20L38 11L56 20L38 29L20 20Z" fill="#C8E6C9" opacity="0.7" />
    {/* Front box - main */}
    <Path d="M6 30L26 20L46 30V52L26 62L6 52V30Z" fill="url(#invBox1Grad)" />
    {/* Front box - top */}
    <Path d="M6 30L26 20L46 30L26 40L6 30Z" fill="#A5D6A7" />
    {/* Front box - right side */}
    <Path d="M26 40L46 30V52L26 62V40Z" fill="url(#invBox1Side)" />
    {/* Box details */}
    <Path d="M26 20V40" stroke="#E8F5E9" strokeWidth="3" />
    <Path d="M6 30L26 40L46 30" stroke="#E8F5E9" strokeWidth="3" fill="none" />
    {/* Leaf/Plant badge */}
    <Circle cx="52" cy="16" r="10" fill="#FFFFFF" />
    {/* Leaf shape */}
    <Path d="M52 8C52 8 45 13 45 20C45 25 48 27 52 27C56 27 59 25 59 20C59 13 52 8 52 8Z" fill="url(#invLeafGrad)" />
    <Path d="M52 12C52 12 50 16 50 20C50 22 51 24 52 24" stroke="#81C784" strokeWidth="1.5" fill="none" />
  </Svg>
);

// Low Stock Alert Illustration - Empty shelf with warning
export const LowStockIllustration: React.FC<IllustrationProps> = ({
  width = 64,
  height = 64,
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="lowShelfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFCDD2" />
        <Stop offset="100%" stopColor="#EF9A9A" />
      </LinearGradient>
      <LinearGradient id="lowBoxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFEBEE" />
        <Stop offset="100%" stopColor="#FFCDD2" />
      </LinearGradient>
      <LinearGradient id="lowAlertGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF5252" />
        <Stop offset="100%" stopColor="#D32F2F" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="30" cy="60" rx="20" ry="3" fill="#000000" opacity="0.1" />
    {/* Shelf back */}
    <Rect x="8" y="16" width="44" height="40" rx="3" fill="#ECEFF1" />
    {/* Shelf boards */}
    <Rect x="8" y="16" width="44" height="6" rx="1" fill="#CFD8DC" />
    <Rect x="8" y="32" width="44" height="4" rx="1" fill="url(#lowShelfGrad)" />
    <Rect x="8" y="48" width="44" height="4" rx="1" fill="url(#lowShelfGrad)" />
    {/* Empty box outlines (dashed) - top shelf */}
    <Rect x="12" y="22" width="12" height="9" rx="1" stroke="#E57373" strokeWidth="1.5" strokeDasharray="3 2" fill="none" opacity="0.5" />
    <Rect x="28" y="22" width="10" height="9" rx="1" stroke="#E57373" strokeWidth="1.5" strokeDasharray="3 2" fill="none" opacity="0.5" />
    {/* Single small box on bottom - shows low stock */}
    <Path d="M14 42L20 39L26 42V50L20 53L14 50V42Z" fill="url(#lowBoxGrad)" />
    <Path d="M14 42L20 39L26 42L20 45L14 42Z" fill="#FFFFFF" opacity="0.5" />
    <Path d="M20 45L26 42V50L20 53V45Z" fill="#EF9A9A" />
    {/* Warning badge */}
    <Circle cx="52" cy="14" r="11" fill="#FFFFFF" />
    <Circle cx="52" cy="14" r="9" fill="url(#lowAlertGrad)" />
    {/* Exclamation mark */}
    <Path d="M52 9V14" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <Circle cx="52" cy="18" r="1.5" fill="#FFFFFF" />
  </Svg>
);

// Peak Selling Hours Illustration - Clock with chart bars
export const PeakHoursIllustration: React.FC<IllustrationProps> = ({
  width = 64,
  height = 64,
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="peakClockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#E8F5E9" />
        <Stop offset="100%" stopColor="#C8E6C9" />
      </LinearGradient>
      <LinearGradient id="peakClockRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
      <LinearGradient id="peakBar1" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#81C784" />
      </LinearGradient>
      <LinearGradient id="peakBar2" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#66BB6A" />
      </LinearGradient>
      <LinearGradient id="peakBar3" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#43A047" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="32" cy="60" rx="22" ry="3" fill="#000000" opacity="0.1" />
    {/* Clock face */}
    <Circle cx="28" cy="28" r="24" fill="url(#peakClockGrad)" />
    <Circle cx="28" cy="28" r="22" stroke="url(#peakClockRing)" strokeWidth="3" fill="none" />
    {/* Clock hour markers */}
    <Circle cx="28" cy="10" r="2" fill="#4CAF50" />
    <Circle cx="46" cy="28" r="2" fill="#4CAF50" />
    <Circle cx="28" cy="46" r="2" fill="#4CAF50" />
    <Circle cx="10" cy="28" r="2" fill="#4CAF50" />
    {/* Small markers */}
    <Circle cx="40" cy="14" r="1" fill="#81C784" />
    <Circle cx="16" cy="14" r="1" fill="#81C784" />
    <Circle cx="40" cy="42" r="1" fill="#81C784" />
    <Circle cx="16" cy="42" r="1" fill="#81C784" />
    {/* Clock hands */}
    <Path d="M28 28V14" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" />
    <Path d="M28 28L38 34" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" />
    {/* Center dot */}
    <Circle cx="28" cy="28" r="3" fill="#2E7D32" />
    <Circle cx="28" cy="28" r="1.5" fill="#FFFFFF" />
    {/* Bar chart overlay - bottom right */}
    <Rect x="42" y="42" width="6" height="18" rx="2" fill="url(#peakBar1)" />
    <Rect x="50" y="34" width="6" height="26" rx="2" fill="url(#peakBar2)" />
    <Rect x="58" y="46" width="6" height="14" rx="2" fill="url(#peakBar3)" opacity="0.7" />
    {/* Rising arrow badge */}
    <Circle cx="54" cy="14" r="9" fill="#FFFFFF" />
    <Circle cx="54" cy="14" r="7" fill="#4CAF50" />
    <Path d="M50 16L54 10L58 16M54 10V18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

// Earnings Card Illustration - Growing chart with coins
export const EarningsCardIllustration: React.FC<IllustrationProps> = ({
  width = 80,
  height = 80,
  color = '#10B981'
}) => (
  <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
      </LinearGradient>
      <LinearGradient id="coinGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
      <LinearGradient id="coinGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
    </Defs>
    
    {/* Background glow */}
    <Circle cx="40" cy="40" r="35" fill={color} opacity="0.08" />
    
    {/* Chart area fill */}
    <Path
      d="M12 65 L12 50 Q18 48 24 42 Q30 36 36 38 Q42 40 48 30 Q54 20 60 22 Q66 24 68 18 L68 65 Z"
      fill="url(#chartGrad)"
      opacity="0.4"
    />
    
    {/* Chart line */}
    <Path
      d="M12 50 Q18 48 24 42 Q30 36 36 38 Q42 40 48 30 Q54 20 60 22 Q66 24 68 18"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    
    {/* Data points */}
    <Circle cx="12" cy="50" r="4" fill={color} />
    <Circle cx="24" cy="42" r="4" fill={color} />
    <Circle cx="36" cy="38" r="4" fill={color} />
    <Circle cx="48" cy="30" r="4" fill={color} />
    <Circle cx="60" cy="22" r="4" fill={color} />
    <Circle cx="68" cy="18" r="5" fill="#FFFFFF" stroke={color} strokeWidth="2" />
    
    {/* Upward arrow at end */}
    <Path
      d="M68 12 L68 8 M64 12 L68 8 L72 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Stack of coins on left */}
    <G>
      {/* Bottom coin */}
      <Ellipse cx="18" cy="70" rx="10" ry="3" fill="#B8860B" />
      <Path d="M8 67 L8 70 Q8 73 18 73 Q28 73 28 70 L28 67 Q28 64 18 64 Q8 64 8 67" fill="url(#coinGrad1)" />
      <Ellipse cx="18" cy="67" rx="10" ry="3" fill="url(#coinGrad2)" />
      <Path d="M13 67 L23 67" stroke="#FFE082" strokeWidth="1" />
      
      {/* Middle coin */}
      <Path d="M8 62 L8 65 Q8 68 18 68 Q28 68 28 65 L28 62 Q28 59 18 59 Q8 59 8 62" fill="url(#coinGrad1)" />
      <Ellipse cx="18" cy="62" rx="10" ry="3" fill="url(#coinGrad2)" />
      <Path d="M13 62 L23 62" stroke="#FFE082" strokeWidth="1" />
      
      {/* Top coin */}
      <Path d="M8 57 L8 60 Q8 63 18 63 Q28 63 28 60 L28 57 Q28 54 18 54 Q8 54 8 57" fill="url(#coinGrad1)" />
      <Ellipse cx="18" cy="57" rx="10" ry="3" fill="url(#coinGrad2)" />
      <Path d="M15 56 L15 58 M21 56 L21 58" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M13 57 L23 57" stroke="#B8860B" strokeWidth="0.5" />
    </G>
    
    {/* Floating coin with sparkle */}
    <G>
      <Circle cx="62" cy="55" r="8" fill="url(#coinGrad1)" />
      <Circle cx="62" cy="55" r="6" fill="url(#coinGrad2)" />
      <Path d="M59 55 L65 55 M62 52 L62 58" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" />
      {/* Sparkle */}
      <Path d="M72 48 L74 50 L76 48 L74 46 Z" fill="#FFD700" />
      <Path d="M74 44 L74 46 M76 48 L78 48" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Small coin */}
    <Circle cx="50" cy="62" r="5" fill="url(#coinGrad1)" />
    <Circle cx="50" cy="62" r="3.5" fill="url(#coinGrad2)" />
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

// Top Sellers Trophy Illustration
export const TopSellersIllustration: React.FC<IllustrationProps> = ({
  width = 80,
  height = 80,
  color = '#FFD700'
}) => (
  <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="50%" stopColor="#FFA000" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      <LinearGradient id="trophyShine" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
      </LinearGradient>
      <LinearGradient id="baseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#3E2723" />
      </LinearGradient>
      <LinearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#FFE082" />
      </LinearGradient>
    </Defs>
    
    {/* Decorative sparkles */}
    <G opacity="0.6">
      <Path d="M12 18L14 22L12 26L10 22L12 18Z" fill="#FFD700" />
      <Path d="M68 20L70 24L68 28L66 24L68 20Z" fill="#FFD700" />
      <Path d="M20 8L21 11L20 14L19 11L20 8Z" fill="#FFA000" />
      <Path d="M60 10L61 13L60 16L59 13L60 10Z" fill="#FFA000" />
    </G>
    
    {/* Trophy base/pedestal */}
    <Rect x="25" y="68" width="30" height="6" rx="2" fill="url(#baseGrad)" />
    <Rect x="30" y="62" width="20" height="8" rx="1" fill="url(#baseGrad)" />
    
    {/* Trophy stem */}
    <Rect x="36" y="50" width="8" height="14" fill="url(#trophyGrad)" />
    
    {/* Trophy cup - main body */}
    <Path
      d="M20 16C20 12 23 10 28 10H52C57 10 60 12 60 16V26C60 40 52 50 40 50C28 50 20 40 20 26V16Z"
      fill="url(#trophyGrad)"
    />
    
    {/* Shine effect on cup */}
    <Path
      d="M24 16C24 14 26 12 30 12H36V38C28 36 24 30 24 24V16Z"
      fill="url(#trophyShine)"
    />
    
    {/* Trophy handles */}
    <Path
      d="M20 18H16C12 18 10 22 10 26C10 32 14 36 18 36H20"
      stroke="url(#trophyGrad)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M60 18H64C68 18 70 22 70 26C70 32 66 36 62 36H60"
      stroke="url(#trophyGrad)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    
    {/* Star on trophy */}
    <Path
      d="M40 20L43 28L51 28L45 33L47 41L40 36L33 41L35 33L29 28L37 28L40 20Z"
      fill="url(#starGrad)"
    />
    
    {/* Number 1 badge */}
    <Circle cx="40" cy="30" r="8" fill="#FFA000" />
    <Path d="M38 26V34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M38 26L40 24" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    
    {/* Small medals/ribbons */}
    <G opacity="0.8">
      <Circle cx="16" cy="50" r="6" fill="#C0C0C0" />
      <Path d="M14 46V42" stroke="#C0C0C0" strokeWidth="2" />
      <Path d="M18 46V42" stroke="#C0C0C0" strokeWidth="2" />
      <Path d="M14 48V52" stroke="#FF5252" strokeWidth="2" />
      <Path d="M18 48V52" stroke="#2196F3" strokeWidth="2" />
    </G>
    
    <G opacity="0.8">
      <Circle cx="64" cy="50" r="6" fill="#CD7F32" />
      <Path d="M62 46V42" stroke="#CD7F32" strokeWidth="2" />
      <Path d="M66 46V42" stroke="#CD7F32" strokeWidth="2" />
      <Path d="M62 48V52" stroke="#4CAF50" strokeWidth="2" />
      <Path d="M66 48V52" stroke="#FF9800" strokeWidth="2" />
    </G>
  </Svg>
);

// Recent Orders Illustration - Clipboard with orders
export const RecentOrdersIllustration: React.FC<IllustrationProps> = ({
  width = 80,
  height = 80,
  color = '#2196F3'
}) => (
  <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="clipboardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#42A5F5" />
        <Stop offset="50%" stopColor="#1E88E5" />
        <Stop offset="100%" stopColor="#1565C0" />
      </LinearGradient>
      <LinearGradient id="paperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#F5F5F5" />
      </LinearGradient>
      <LinearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#F57C00" />
      </LinearGradient>
    </Defs>
    
    {/* Decorative sparkles */}
    <G opacity="0.5">
      <Circle cx="12" cy="20" r="2" fill="#42A5F5" />
      <Circle cx="68" cy="25" r="2.5" fill="#1E88E5" />
      <Circle cx="8" cy="55" r="1.5" fill="#64B5F6" />
    </G>
    
    {/* Main clipboard */}
    <Rect x="16" y="14" width="48" height="60" rx="6" fill="url(#clipboardGrad)" />
    
    {/* Clipboard clip */}
    <Rect x="28" y="8" width="24" height="12" rx="4" fill="#1565C0" />
    <Rect x="32" y="12" width="16" height="6" rx="2" fill="#90CAF9" />
    
    {/* Paper */}
    <Rect x="20" y="22" width="40" height="48" rx="3" fill="url(#paperGrad)" />
    
    {/* Order lines */}
    <G>
      {/* Order 1 - Completed */}
      <Rect x="26" y="28" width="28" height="12" rx="2" fill="#E3F2FD" />
      <Circle cx="30" cy="34" r="3" fill="#4CAF50" />
      <Path d="M28.5 34L29.5 35L31.5 33" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="36" y="31" width="14" height="2" rx="1" fill="#90CAF9" />
      <Rect x="36" y="35" width="10" height="2" rx="1" fill="#BBDEFB" />
    </G>
    
    <G>
      {/* Order 2 - In Progress */}
      <Rect x="26" y="44" width="28" height="12" rx="2" fill="#FFF3E0" />
      <Circle cx="30" cy="50" r="3" fill="#FF9800" />
      <Path d="M30 48V50.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      <Circle cx="30" cy="52" r="0.8" fill="#FFFFFF" />
      <Rect x="36" y="47" width="14" height="2" rx="1" fill="#FFCC80" />
      <Rect x="36" y="51" width="10" height="2" rx="1" fill="#FFE0B2" />
    </G>
    
    <G>
      {/* Order 3 - New */}
      <Rect x="26" y="60" width="28" height="8" rx="2" fill="#E8F5E9" />
      <Circle cx="30" cy="64" r="2.5" fill="#4CAF50" />
      <Rect x="36" y="62" width="14" height="2" rx="1" fill="#A5D6A7" />
    </G>
    
    {/* Notification bell */}
    <G>
      <Circle cx="62" cy="18" r="10" fill="url(#bellGrad)" />
      <Path
        d="M62 12C59 12 57 14 57 17V20L55 22V23H69V22L67 20V17C67 14 65 12 62 12Z"
        fill="#FFFFFF"
      />
      <Circle cx="62" cy="25" r="2" fill="#FFFFFF" />
      {/* Notification dot */}
      <Circle cx="68" cy="12" r="5" fill="#F44336" />
      <Circle cx="68" cy="12" r="2" fill="#FFFFFF" />
    </G>
    
    {/* Decorative package icon */}
    <G opacity="0.9">
      <Rect x="4" y="38" width="12" height="12" rx="2" fill="#4CAF50" />
      <Path d="M10 38V50" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
      <Path d="M4 44H16" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
      <Path d="M7 41L10 38L13 41" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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
  PendingOrdersIllustration,
  ProcessingOrdersIllustration,
  InventoryIllustration,
  LowStockIllustration,
  PeakHoursIllustration,
  EarningsCardIllustration,
  TopSellersIllustration,
  RecentOrdersIllustration,
};
