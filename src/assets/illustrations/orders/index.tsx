import React from 'react';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Ellipse, ClipPath, Polygon } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
  // Alternative props for consistency with other illustration components
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

// ============================================
// Order Processing Step Illustrations
// ============================================

// Order Received/Created Illustration - Shopping bag with checkmark
export const OrderReceivedIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#4CAF50',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={c} />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
      <LinearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#000000" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="40" cy="72" rx="24" ry="4" fill="url(#shadowGrad)" />
    {/* Shopping bag body */}
    <Path
      d="M18 28C18 26.9 18.9 26 20 26H60C61.1 26 62 26.9 62 28V64C62 66.2 60.2 68 58 68H22C19.8 68 18 66.2 18 64V28Z"
      fill="url(#bagGrad)"
    />
    {/* Bag handles */}
    <Path
      d="M28 26V20C28 14.5 33.5 10 40 10C46.5 10 52 14.5 52 20V26"
      stroke={c}
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    {/* Bag fold line */}
    <Path d="M18 34H62" stroke="#2E7D32" strokeWidth="1" opacity="0.3" />
    {/* Checkmark circle */}
    <Circle cx="40" cy="48" r="14" fill="#FFFFFF" />
    {/* Checkmark */}
    <Path
      d="M32 48L37 53L48 42"
      stroke={c}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Shine effect */}
    <Path d="M22 30C22 30 24 28 28 28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </Svg>
  );
};

// Order Confirmed Illustration - Document with checkmark
export const OrderConfirmedIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#2196F3',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={c} />
        <Stop offset="100%" stopColor="#1565C0" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="40" cy="72" rx="22" ry="4" fill="#000000" opacity="0.08" />
    {/* Document */}
    <Path
      d="M20 14C20 11.8 21.8 10 24 10H48L60 22V66C60 68.2 58.2 70 56 70H24C21.8 70 20 68.2 20 66V14Z"
      fill="url(#docGrad)"
    />
    {/* Folded corner */}
    <Path d="M48 10V22H60L48 10Z" fill="#BBDEFB" />
    {/* Lines representing text */}
    <Rect x="28" y="32" width="24" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6" />
    <Rect x="28" y="40" width="20" height="3" rx="1.5" fill="#FFFFFF" opacity="0.5" />
    <Rect x="28" y="48" width="16" height="3" rx="1.5" fill="#FFFFFF" opacity="0.4" />
    {/* Checkmark badge */}
    <Circle cx="54" cy="56" r="12" fill="#4CAF50" />
    <Path d="M48 56L52 60L60 52" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Shine */}
    <Path d="M24 14L30 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </Svg>
  );
};

// Preparing Order Illustration - Chef/Cook preparing food
export const PreparingOrderIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#FF9800',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#78909C" />
        <Stop offset="100%" stopColor="#455A64" />
      </LinearGradient>
      <LinearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor={c} stopOpacity="0.8" />
        <Stop offset="100%" stopColor={c} stopOpacity="0" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="40" cy="72" rx="26" ry="4" fill="#000000" opacity="0.08" />
    {/* Stove base */}
    <Rect x="12" y="60" width="56" height="10" rx="2" fill="#37474F" />
    {/* Burner glow */}
    <Ellipse cx="40" cy="58" rx="16" ry="3" fill="#FF5722" opacity="0.3" />
    <Ellipse cx="40" cy="58" rx="12" ry="2" fill="#FF5722" opacity="0.5" />
    {/* Pot body */}
    <Path
      d="M18 44C18 42 19.8 40 22 40H58C60.2 40 62 42 62 44V54C62 56.2 60.2 58 58 58H22C19.8 58 18 56.2 18 54V44Z"
      fill="url(#potGrad)"
    />
    {/* Pot rim */}
    <Rect x="16" y="38" width="48" height="4" rx="2" fill="#607D8B" />
    {/* Pot handles */}
    <Rect x="8" y="44" width="10" height="6" rx="2" fill="#455A64" />
    <Rect x="62" y="44" width="10" height="6" rx="2" fill="#455A64" />
    {/* Lid */}
    <Ellipse cx="40" cy="38" rx="20" ry="3" fill="#90A4AE" />
    <Circle cx="40" cy="34" r="4" fill="#78909C" />
    {/* Steam */}
    <Path d="M30 30C30 30 28 22 30 14" stroke="url(#steamGrad)" strokeWidth="3" strokeLinecap="round" />
    <Path d="M40 28C40 28 38 18 40 8" stroke="url(#steamGrad)" strokeWidth="3" strokeLinecap="round" />
    <Path d="M50 30C50 30 48 22 50 14" stroke="url(#steamGrad)" strokeWidth="3" strokeLinecap="round" />
    {/* Timer badge */}
    <Circle cx="62" cy="22" r="10" fill={c} />
    <Path d="M62 16V22L66 24" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
  );
};

// Ready for Pickup Illustration - Package with ribbon
export const ReadyForPickupIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#9C27B0',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={c} />
        <Stop offset="100%" stopColor="#7B1FA2" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="40" cy="72" rx="24" ry="4" fill="#000000" opacity="0.08" />
    {/* Box base */}
    <Path d="M12 32L40 18L68 32V62L40 76L12 62V32Z" fill="url(#boxGrad)" />
    {/* Box top face */}
    <Path d="M12 32L40 46L68 32L40 18L12 32Z" fill="#A1887F" />
    {/* Box side line */}
    <Path d="M40 46V76" stroke="#4E342E" strokeWidth="1" opacity="0.5" />
    {/* Horizontal ribbon */}
    <Path d="M12 47L68 47" stroke="url(#ribbonGrad)" strokeWidth="6" />
    {/* Vertical ribbon */}
    <Path d="M40 18V76" stroke="url(#ribbonGrad)" strokeWidth="6" />
    {/* Ribbon bow */}
    <Circle cx="40" cy="32" r="8" fill={c} />
    <Ellipse cx="30" cy="28" rx="6" ry="4" fill={c} transform="rotate(-30 30 28)" />
    <Ellipse cx="50" cy="28" rx="6" ry="4" fill={c} transform="rotate(30 50 28)" />
    {/* Ribbon tails */}
    <Path d="M34 36C34 36 28 44 26 48" stroke={c} strokeWidth="4" strokeLinecap="round" />
    <Path d="M46 36C46 36 52 44 54 48" stroke={c} strokeWidth="4" strokeLinecap="round" />
    {/* Sparkle */}
    <Circle cx="60" cy="20" r="3" fill="#FFC107" />
    <Circle cx="18" cy="26" r="2" fill="#FFC107" />
  </Svg>
  );
};

// Rider Assigned Illustration - Motorcycle rider
export const RiderAssignedIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#00BCD4',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="bikeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={c} />
        <Stop offset="100%" stopColor="#0097A7" />
      </LinearGradient>
      <LinearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#37474F" />
        <Stop offset="100%" stopColor="#263238" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="40" cy="70" rx="30" ry="4" fill="#000000" opacity="0.08" />
    {/* Back wheel */}
    <Circle cx="22" cy="58" r="12" fill="#37474F" />
    <Circle cx="22" cy="58" r="8" fill="#455A64" />
    <Circle cx="22" cy="58" r="3" fill="#37474F" />
    {/* Front wheel */}
    <Circle cx="58" cy="58" r="12" fill="#37474F" />
    <Circle cx="58" cy="58" r="8" fill="#455A64" />
    <Circle cx="58" cy="58" r="3" fill="#37474F" />
    {/* Bike body */}
    <Path
      d="M22 58L32 42H50L58 58"
      stroke="url(#bikeGrad)"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <Path d="M32 42L38 52H48L50 42" fill="url(#bikeGrad)" />
    {/* Delivery box */}
    <Rect x="24" y="32" width="16" height="12" rx="2" fill="#FF9800" />
    <Rect x="26" y="34" width="12" height="2" fill="#FFFFFF" opacity="0.5" />
    {/* Rider body */}
    <Path d="M40 44C40 44 38 36 40 32" stroke="#5D4037" strokeWidth="6" strokeLinecap="round" />
    {/* Helmet */}
    <Circle cx="42" cy="24" r="10" fill="url(#helmetGrad)" />
    <Path d="M34 26C34 26 36 30 42 30C48 30 50 26 50 26" fill="#263238" />
    {/* Visor */}
    <Path d="M35 22H49" stroke={c} strokeWidth="3" strokeLinecap="round" />
    {/* Speed lines */}
    <Path d="M8 50H14" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <Path d="M6 56H12" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <Path d="M8 62H14" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </Svg>
  );
};

// Picked Up Illustration - Hand holding package
export const PickedUpIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#FF5722',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCCBC" />
        <Stop offset="100%" stopColor="#FFAB91" />
      </LinearGradient>
      <LinearGradient id="pkgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={c} />
        <Stop offset="100%" stopColor="#E64A19" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="40" cy="72" rx="20" ry="3" fill="#000000" opacity="0.08" />
    {/* Package */}
    <Rect x="20" y="16" width="40" height="32" rx="4" fill="url(#pkgGrad)" />
    {/* Package flaps */}
    <Path d="M20 24L40 32L60 24V16H20V24Z" fill="#FF7043" />
    <Path d="M40 16V32" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" />
    {/* Tape */}
    <Rect x="34" y="12" width="12" height="8" fill="#FFCC80" />
    <Rect x="34" y="32" width="12" height="12" fill="#FFCC80" />
    {/* Hand */}
    <Path
      d="M16 52C16 52 20 44 26 44H54C60 44 64 52 64 52V68C64 70 62 72 60 72H20C18 72 16 70 16 68V52Z"
      fill="url(#handGrad)"
    />
    {/* Fingers */}
    <Path d="M26 44V52" stroke="#FFAB91" strokeWidth="2" />
    <Path d="M36 44V52" stroke="#FFAB91" strokeWidth="2" />
    <Path d="M46 44V52" stroke="#FFAB91" strokeWidth="2" />
    <Path d="M56 44V52" stroke="#FFAB91" strokeWidth="2" />
    {/* Checkmark */}
    <Circle cx="60" cy="24" r="10" fill="#4CAF50" />
    <Path d="M55 24L58 27L66 19" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
  );
};

// In Transit Illustration - Delivery truck moving
export const InTransitIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#3F51B5',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="truckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={c} />
        <Stop offset="100%" stopColor="#303F9F" />
      </LinearGradient>
    </Defs>
    {/* Road */}
    <Rect x="0" y="66" width="80" height="8" fill="#455A64" />
    <Path d="M0 70H10M16 70H26M32 70H42M48 70H58M64 70H74" stroke="#FFC107" strokeWidth="2" strokeDasharray="4 4" />
    {/* Shadow */}
    <Ellipse cx="44" cy="66" rx="24" ry="2" fill="#000000" opacity="0.15" />
    {/* Truck cargo */}
    <Rect x="24" y="32" width="36" height="28" rx="2" fill="url(#truckGrad)" />
    {/* Cargo details */}
    <Path d="M28 40H56" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" />
    <Path d="M28 48H56" stroke="#FFFFFF" strokeWidth="2" opacity="0.2" />
    {/* Truck cabin */}
    <Path
      d="M60 44H72C74 44 76 46 76 48V60H60V44Z"
      fill="#283593"
    />
    {/* Window */}
    <Rect x="64" y="48" width="8" height="6" rx="1" fill="#90CAF9" />
    {/* Back wheel */}
    <Circle cx="34" cy="62" r="8" fill="#37474F" />
    <Circle cx="34" cy="62" r="5" fill="#607D8B" />
    <Circle cx="34" cy="62" r="2" fill="#37474F" />
    {/* Front wheel */}
    <Circle cx="66" cy="62" r="8" fill="#37474F" />
    <Circle cx="66" cy="62" r="5" fill="#607D8B" />
    <Circle cx="66" cy="62" r="2" fill="#37474F" />
    {/* Speed lines */}
    <Path d="M4 40H16" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <Path d="M8 48H18" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <Path d="M4 56H16" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    {/* Location pin on truck */}
    <Circle cx="42" cy="26" r="8" fill="#E91E63" />
    <Circle cx="42" cy="24" r="3" fill="#FFFFFF" />
    <Path d="M42 28L42 34" stroke="#E91E63" strokeWidth="2" />
  </Svg>
  );
};

// Delivered Illustration - House with package and celebration
export const DeliveredOrderIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#4CAF50',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="houseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D84315" />
        <Stop offset="100%" stopColor="#BF360C" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="40" cy="74" rx="28" ry="3" fill="#000000" opacity="0.08" />
    {/* House body */}
    <Rect x="16" y="38" width="48" height="34" fill="url(#houseGrad)" />
    {/* Roof */}
    <Path d="M10 40L40 16L70 40H10Z" fill="url(#roofGrad)" />
    {/* Door */}
    <Rect x="34" y="52" width="12" height="20" rx="1" fill="#5D4037" />
    <Circle cx="42" cy="62" r="2" fill="#FFC107" />
    {/* Windows */}
    <Rect x="20" y="46" width="10" height="10" rx="1" fill="#90CAF9" />
    <Rect x="50" y="46" width="10" height="10" rx="1" fill="#90CAF9" />
    <Path d="M25 46V56M20 51H30" stroke="#64B5F6" strokeWidth="1" />
    <Path d="M55 46V56M50 51H60" stroke="#64B5F6" strokeWidth="1" />
    {/* Package at door */}
    <Rect x="48" y="62" width="12" height="10" rx="1" fill="#FF9800" />
    <Path d="M54 62V72M48 67H60" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" />
    {/* Success checkmark */}
    <Circle cx="62" cy="24" r="12" fill={c} />
    <Path d="M56 24L60 28L70 18" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {/* Celebration sparkles */}
    <Circle cx="20" cy="20" r="3" fill="#FFC107" />
    <Circle cx="14" cy="30" r="2" fill="#E91E63" />
    <Circle cx="26" cy="12" r="2" fill="#9C27B0" />
    <Path d="M68 34L72 30M72 34L68 30" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" />
    <Path d="M8 44L12 40M12 44L8 40" stroke="#E91E63" strokeWidth="2" strokeLinecap="round" />
  </Svg>
  );
};

// Order Cancelled Illustration - Crossed out package
export const OrderCancelledIllustration: React.FC<IllustrationProps> = ({
  width,
  height,
  color,
  size = 80,
  primaryColor = '#F44336',
  secondaryColor,
}) => {
  const w = width ?? size;
  const h = height ?? size;
  const c = color ?? primaryColor;
  
  return (
  <Svg width={w} height={h} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="cancelBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#BDBDBD" />
        <Stop offset="100%" stopColor="#9E9E9E" />
      </LinearGradient>
    </Defs>
    {/* Shadow */}
    <Ellipse cx="40" cy="72" rx="22" ry="3" fill="#000000" opacity="0.08" />
    {/* Box */}
    <Rect x="18" y="22" width="44" height="44" rx="4" fill="url(#cancelBoxGrad)" />
    {/* Box top */}
    <Path d="M18 30L40 40L62 30V22H18V30Z" fill="#E0E0E0" />
    <Path d="M40 22V40" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" />
    {/* Cancel X */}
    <Circle cx="40" cy="48" r="16" fill={c} />
    <Path d="M32 40L48 56M48 40L32 56" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    {/* Sad expression on box */}
    <Circle cx="30" cy="50" r="2" fill="#757575" opacity="0.5" />
    <Circle cx="50" cy="50" r="2" fill="#757575" opacity="0.5" />
    <Path d="M34 58C34 58 38 54 46 58" stroke="#757575" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
  </Svg>
  );
};

// ============================================
// Original Smaller Utility Illustrations
// ============================================

// Customer/Person Illustration
export const CustomerIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#4CAF50'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="customerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    {/* Head */}
    <Circle cx="12" cy="7" r="4" fill="url(#customerGrad)" />
    {/* Body */}
    <Path
      d="M4 21C4 16.5 7.5 13 12 13C16.5 13 20 16.5 20 21"
      fill="url(#customerGrad)"
    />
    {/* Face details */}
    <Circle cx="10.5" cy="6.5" r="0.5" fill="#FFFFFF" opacity="0.8" />
    <Circle cx="13.5" cy="6.5" r="0.5" fill="#FFFFFF" opacity="0.8" />
    <Path d="M11 8.5C11 8.5 12 9 13 8.5" stroke="#FFFFFF" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />
  </Svg>
);

// Phone/Call Illustration
export const PhoneIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#2196F3'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#1565C0" />
      </LinearGradient>
    </Defs>
    {/* Phone base shape */}
    <Path
      d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
      fill="url(#phoneGrad)"
    />
    {/* Ring waves */}
    <Path d="M15 3C16.5 3 18 3.5 19 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <Path d="M15 6C15.8 6 16.5 6.3 17 6.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
  </Svg>
);

// Location/Map Pin Illustration
export const LocationIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#EF5350'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="locationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#C62828" />
      </LinearGradient>
    </Defs>
    {/* Pin shape */}
    <Path
      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
      fill="url(#locationGrad)"
    />
    {/* Inner circle */}
    <Circle cx="12" cy="9" r="3" fill="#FFFFFF" />
    {/* Shine effect */}
    <Path d="M9 6C9 6 10 5 12 5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </Svg>
);

// Building/City Illustration
export const BuildingIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#5C6BC0'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#3949AB" />
      </LinearGradient>
    </Defs>
    {/* Main building */}
    <Rect x="4" y="6" width="10" height="16" rx="1" fill="url(#buildingGrad)" />
    {/* Windows */}
    <Rect x="6" y="8" width="2" height="2" fill="#E8EAF6" />
    <Rect x="10" y="8" width="2" height="2" fill="#E8EAF6" />
    <Rect x="6" y="12" width="2" height="2" fill="#E8EAF6" />
    <Rect x="10" y="12" width="2" height="2" fill="#E8EAF6" />
    {/* Door */}
    <Rect x="7" y="17" width="4" height="5" rx="0.5" fill="#3949AB" />
    {/* Side building */}
    <Rect x="14" y="10" width="6" height="12" rx="1" fill={color} opacity="0.7" />
    <Rect x="16" y="12" width="2" height="2" fill="#E8EAF6" />
    <Rect x="16" y="16" width="2" height="2" fill="#E8EAF6" />
  </Svg>
);

// Notes/Document Illustration
export const NotesIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#FF9800'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="notesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
    </Defs>
    {/* Paper */}
    <Path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      fill="url(#notesGrad)"
    />
    {/* Fold corner */}
    <Path d="M14 2V8H20" fill="#FFE0B2" />
    <Path d="M14 2L20 8H14V2Z" fill="#FFE0B2" />
    {/* Lines */}
    <Path d="M7 13H17" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <Path d="M7 16H14" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <Path d="M7 19H11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
  </Svg>
);

// Payment/Wallet Illustration
export const PaymentIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#4CAF50'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    {/* Wallet body */}
    <Rect x="2" y="5" width="20" height="14" rx="2" fill="url(#walletGrad)" />
    {/* Flap */}
    <Path d="M2 9H22V7C22 5.9 21.1 5 20 5H4C2.9 5 2 5.9 2 7V9Z" fill="#2E7D32" />
    {/* Card slot */}
    <Rect x="14" y="11" width="6" height="4" rx="1" fill="#E8F5E9" />
    {/* Coin */}
    <Circle cx="7" cy="13" r="3" fill="#FFC107" />
    <Path d="M7 11V15M5.5 13H8.5" stroke="#FF9800" strokeWidth="1" strokeLinecap="round" />
  </Svg>
);

// Order Status Badge Illustrations
export const PendingIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#F59E0B'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="pendingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#D97706" />
      </LinearGradient>
    </Defs>
    {/* Clock circle */}
    <Circle cx="12" cy="12" r="10" fill="url(#pendingGrad)" />
    <Circle cx="12" cy="12" r="8" fill="#FEF3C7" />
    {/* Clock hands */}
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
);

export const ConfirmedIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#3B82F6'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="confirmedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#1D4ED8" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#confirmedGrad)" />
    <Path d="M7 12L10.5 15.5L17 9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PreparingIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#8B5CF6'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="preparingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#6D28D9" />
      </LinearGradient>
    </Defs>
    {/* Pot */}
    <Ellipse cx="12" cy="18" rx="8" ry="3" fill="url(#preparingGrad)" />
    <Rect x="4" y="12" width="16" height="6" fill="url(#preparingGrad)" />
    {/* Steam */}
    <Path d="M8 10C8 10 7 8 8 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <Path d="M12 9C12 9 11 6 12 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <Path d="M16 10C16 10 15 8 16 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    {/* Lid handle */}
    <Ellipse cx="12" cy="12" rx="2" ry="0.8" fill="#7C3AED" />
  </Svg>
);

export const ReadyIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#10B981'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="readyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#047857" />
      </LinearGradient>
    </Defs>
    {/* Box */}
    <Path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="url(#readyGrad)" />
    <Path d="M12 2L3 7L12 12L21 7L12 2Z" fill="#D1FAE5" />
    <Path d="M12 12V22" stroke="#047857" strokeWidth="1.5" />
    <Path d="M3 7L12 12" stroke="#047857" strokeWidth="1" opacity="0.5" />
    {/* Checkmark */}
    <Circle cx="18" cy="6" r="4" fill="#FFFFFF" />
    <Path d="M16 6L17.5 7.5L20 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const DeliveredIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#22C55E'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="deliveredGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#deliveredGrad)" />
    <Path d="M6 12L9.5 15.5L18 7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Sparkles */}
    <Circle cx="20" cy="5" r="1.5" fill="#FFC107" />
    <Circle cx="4" cy="8" r="1" fill="#FFC107" />
  </Svg>
);

export const CancelledIllustration: React.FC<IllustrationProps> = ({
  width = 24,
  height = 24,
  color = '#EF4444'
}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="cancelledGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#B91C1C" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#cancelledGrad)" />
    <Path d="M8 8L16 16M16 8L8 16" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export default {
  // Order Processing Step Illustrations (Large)
  OrderReceivedIllustration,
  OrderConfirmedIllustration,
  PreparingOrderIllustration,
  ReadyForPickupIllustration,
  RiderAssignedIllustration,
  PickedUpIllustration,
  InTransitIllustration,
  DeliveredOrderIllustration,
  OrderCancelledIllustration,
  // Utility Illustrations (Small)
  CustomerIllustration,
  PhoneIllustration,
  LocationIllustration,
  BuildingIllustration,
  NotesIllustration,
  PaymentIllustration,
  // Badge Illustrations
  PendingIllustration,
  ConfirmedIllustration,
  PreparingIllustration,
  ReadyIllustration,
  DeliveredIllustration,
  CancelledIllustration,
};
