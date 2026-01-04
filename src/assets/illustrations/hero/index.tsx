import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Ellipse, Rect, Text as SvgText } from 'react-native-svg';

interface IllustrationProps {
  size?: number;
}

// Farmer Activation - Plant with coins
export const FarmerActivationIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="fa_plant" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    <Circle cx="60" cy="60" r="55" fill="rgba(255,255,255,0.15)" />
    <Path d="M45 85 L50 100 L70 100 L75 85 Z" fill="#5D4037" />
    <Ellipse cx="60" cy="85" rx="15" ry="4" fill="#8D6E63" />
    <Path d="M60 85 Q60 70 60 55" stroke="url(#fa_plant)" strokeWidth="4" strokeLinecap="round" fill="none" />
    <Path d="M60 70 Q45 60 35 50 Q40 70 60 70" fill="#66BB6A" />
    <Path d="M60 65 Q75 55 85 45 Q80 65 60 65" fill="#81C784" />
    <Path d="M60 55 Q55 40 45 30 Q55 45 60 55" fill="#A5D6A7" />
    <Path d="M60 55 Q65 40 75 30 Q65 45 60 55" fill="#C8E6C9" />
    <Circle cx="25" cy="85" r="8" fill="#FFD700" />
    <Circle cx="25" cy="85" r="6" fill="#FFC107" />
    <Circle cx="95" cy="90" r="6" fill="#FFD700" />
    <Circle cx="30" cy="40" r="2" fill="#FFF" opacity={0.7} />
    <Circle cx="90" cy="35" r="2" fill="#FFF" opacity={0.6} />
  </Svg>
);

// Go Premium - Crown with diamond
export const GoPremiumIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="gp_crown" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      <LinearGradient id="gp_diamond" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4FC3F7" />
        <Stop offset="100%" stopColor="#0288D1" />
      </LinearGradient>
    </Defs>
    <Circle cx="60" cy="60" r="55" fill="rgba(255,255,255,0.15)" />
    <Path d="M30 55 L38 35 L50 50 L60 25 L70 50 L82 35 L90 55 L85 65 L35 65 Z" fill="url(#gp_crown)" />
    <Circle cx="38" cy="35" r="4" fill="#FFF59D" />
    <Circle cx="60" cy="25" r="5" fill="#FFF59D" />
    <Circle cx="82" cy="35" r="4" fill="#FFF59D" />
    <Rect x="35" y="60" width="50" height="8" rx="2" fill="#FF8F00" />
    <Path d="M60 75 L75 75 L80 85 L60 110 L40 85 L45 75 Z" fill="url(#gp_diamond)" />
    <Path d="M40 85 L60 110 L80 85" fill="#0288D1" opacity={0.5} />
    <Circle cx="20" cy="35" r="2" fill="#FFF" opacity={0.8} />
    <Circle cx="100" cy="45" r="2" fill="#FFF" opacity={0.7} />
  </Svg>
);

// Verified Seller - Shield badge
export const VerifiedSellerIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="vs_shield" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#1E88E5" />
        <Stop offset="100%" stopColor="#0D47A1" />
      </LinearGradient>
      <LinearGradient id="vs_inner" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#42A5F5" />
        <Stop offset="100%" stopColor="#1565C0" />
      </LinearGradient>
    </Defs>
    <Circle cx="60" cy="60" r="55" fill="rgba(255,255,255,0.15)" />
    <Path d="M60 15 L95 30 L95 60 Q95 90 60 105 Q25 90 25 60 L25 30 Z" fill="url(#vs_shield)" />
    <Path d="M60 22 L88 35 L88 58 Q88 84 60 97 Q32 84 32 58 L32 35 Z" fill="url(#vs_inner)" />
    <Path d="M45 60 L55 72 L78 45" stroke="#FFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Path d="M18 28 L20 33 L18 38 L16 33 Z" fill="#FFD54F" />
    <Path d="M102 25 L104 30 L102 35 L100 30 Z" fill="#FFD54F" />
    <Circle cx="15" cy="70" r="2" fill="#FFF" opacity={0.7} />
    <Circle cx="105" cy="65" r="2" fill="#FFF" opacity={0.6} />
  </Svg>
);

// Biometric Lock - Fingerprint with shield
export const BiometricLockIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="bl_shield" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#16A34A" />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
      <LinearGradient id="bl_finger" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </LinearGradient>
    </Defs>
    {/* Outer glow circle */}
    <Circle cx="60" cy="60" r="55" fill="rgba(22, 163, 74, 0.15)" />
    {/* Shield background */}
    <Path d="M60 12 L100 28 L100 58 Q100 92 60 110 Q20 92 20 58 L20 28 Z" fill="url(#bl_shield)" />
    {/* Inner shield highlight */}
    <Path d="M60 20 L92 34 L92 56 Q92 86 60 102 Q28 86 28 56 L28 34 Z" fill="rgba(255,255,255,0.1)" />
    {/* Fingerprint lines */}
    <Path d="M60 40 Q50 40 48 50 Q46 62 50 72" stroke="url(#bl_finger)" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Path d="M60 40 Q70 40 72 50 Q74 62 70 72" stroke="url(#bl_finger)" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Path d="M55 38 Q45 42 44 55 Q43 68 48 78" stroke="url(#bl_finger)" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Path d="M65 38 Q75 42 76 55 Q77 68 72 78" stroke="url(#bl_finger)" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Path d="M60 42 Q55 42 54 50 Q53 58 55 68" stroke="url(#bl_finger)" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Path d="M60 42 Q65 42 66 50 Q67 58 65 68" stroke="url(#bl_finger)" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Path d="M60 44 L60 62" stroke="url(#bl_finger)" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Lock icon at bottom */}
    <Rect x="52" y="78" width="16" height="12" rx="2" fill="#FFF" />
    <Path d="M55 78 L55 74 Q55 70 60 70 Q65 70 65 74 L65 78" stroke="#FFF" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Circle cx="60" cy="84" r="2" fill="#16A34A" />
    {/* Decorative stars */}
    <Path d="M15 35 L17 40 L15 45 L13 40 Z" fill="#FFD54F" />
    <Path d="M105 30 L107 35 L105 40 L103 35 Z" fill="#FFD54F" />
    <Circle cx="18" cy="75" r="2" fill="#FFF" opacity={0.7} />
    <Circle cx="102" cy="70" r="2" fill="#FFF" opacity={0.6} />
  </Svg>
);

// Face ID Lock - Face scan illustration
export const FaceIdIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="fi_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#16A34A" />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
    </Defs>
    {/* Outer glow */}
    <Circle cx="60" cy="60" r="55" fill="rgba(22, 163, 74, 0.15)" />
    {/* Main circle */}
    <Circle cx="60" cy="60" r="45" fill="url(#fi_bg)" />
    {/* Scan frame corners */}
    <Path d="M30 40 L30 30 L40 30" stroke="#FFF" strokeWidth="4" strokeLinecap="round" fill="none" />
    <Path d="M80 30 L90 30 L90 40" stroke="#FFF" strokeWidth="4" strokeLinecap="round" fill="none" />
    <Path d="M90 80 L90 90 L80 90" stroke="#FFF" strokeWidth="4" strokeLinecap="round" fill="none" />
    <Path d="M40 90 L30 90 L30 80" stroke="#FFF" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Face - eyes */}
    <Circle cx="48" cy="52" r="4" fill="#FFF" />
    <Circle cx="72" cy="52" r="4" fill="#FFF" />
    {/* Face - nose */}
    <Path d="M60 55 L60 65" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
    {/* Face - smile */}
    <Path d="M48 72 Q60 82 72 72" stroke="#FFF" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Scan line animation suggestion */}
    <Rect x="32" y="58" width="56" height="3" rx="1.5" fill="#FFF" opacity={0.5} />
    {/* Decorative elements */}
    <Circle cx="15" cy="60" r="2" fill="#FFF" opacity={0.7} />
    <Circle cx="105" cy="60" r="2" fill="#FFF" opacity={0.6} />
  </Svg>
);

// Rewards Hero - Trophy with stars and coins
export const RewardsHeroIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="rh_trophy" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
      <LinearGradient id="rh_shine" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    {/* Outer glow */}
    <Circle cx="60" cy="60" r="55" fill="rgba(255, 204, 0, 0.12)" />
    {/* Trophy cup */}
    <Path d="M40 35 L40 55 Q40 75 60 80 Q80 75 80 55 L80 35 Z" fill="url(#rh_trophy)" />
    {/* Trophy shine */}
    <Path d="M45 38 L45 52 Q45 68 55 72" stroke="url(#rh_shine)" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Trophy handles */}
    <Path d="M40 40 Q25 40 25 52 Q25 62 40 62" stroke="#FFD700" strokeWidth="4" fill="none" />
    <Path d="M80 40 Q95 40 95 52 Q95 62 80 62" stroke="#FFD700" strokeWidth="4" fill="none" />
    {/* Trophy base */}
    <Rect x="50" y="80" width="20" height="6" rx="2" fill="#FFA000" />
    <Rect x="45" y="86" width="30" height="8" rx="3" fill="#FF8F00" />
    {/* Star on trophy */}
    <Path d="M60 48 L63 56 L72 56 L65 62 L68 70 L60 65 L52 70 L55 62 L48 56 L57 56 Z" fill="#FFF" />
    {/* Floating stars */}
    <Path d="M22 28 L24 33 L29 33 L25 36 L27 41 L22 38 L17 41 L19 36 L15 33 L20 33 Z" fill="#FFCC00" />
    <Path d="M98 25 L100 29 L104 29 L101 31 L102 35 L98 33 L94 35 L95 31 L92 29 L96 29 Z" fill="#FFCC00" />
    <Path d="M18 70 L19 73 L22 73 L20 75 L21 78 L18 76 L15 78 L16 75 L14 73 L17 73 Z" fill="#FFD54F" />
    {/* Floating coins */}
    <Circle cx="95" cy="75" r="8" fill="#FFD700" />
    <Circle cx="95" cy="75" r="6" fill="#FFC107" />
    <Circle cx="105" cy="85" r="6" fill="#FFD700" />
    <Circle cx="105" cy="85" r="4.5" fill="#FFC107" />
    {/* Sparkles */}
    <Circle cx="30" cy="50" r="2" fill="#FFF" opacity={0.8} />
    <Circle cx="90" cy="45" r="2" fill="#FFF" opacity={0.7} />
    <Circle cx="15" cy="90" r="1.5" fill="#FFF" opacity={0.6} />
  </Svg>
);

// Points Badge - Coin stack with stars for points display
export const PointsBadgeIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="pb_coin1" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </LinearGradient>
      <LinearGradient id="pb_coin2" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF9800" />
      </LinearGradient>
    </Defs>
    {/* Outer glow */}
    <Circle cx="60" cy="60" r="55" fill="rgba(255, 204, 0, 0.1)" />
    {/* Stacked coins */}
    <Ellipse cx="60" cy="82" rx="28" ry="8" fill="#B45309" />
    <Ellipse cx="60" cy="80" rx="28" ry="8" fill="url(#pb_coin2)" />
    <Ellipse cx="60" cy="72" rx="28" ry="8" fill="#B45309" />
    <Ellipse cx="60" cy="70" rx="28" ry="8" fill="url(#pb_coin2)" />
    <Ellipse cx="60" cy="62" rx="28" ry="8" fill="#B45309" />
    <Ellipse cx="60" cy="60" rx="28" ry="8" fill="url(#pb_coin1)" />
    {/* Top coin detail - star */}
    <Path d="M60 52 L62 57 L67 57 L63 60 L65 65 L60 62 L55 65 L57 60 L53 57 L58 57 Z" fill="#FFF" opacity={0.9} />
    {/* Floating sparkles */}
    <Circle cx="25" cy="45" r="3" fill="#FFD700" />
    <Circle cx="95" cy="50" r="2.5" fill="#FFC107" />
    <Circle cx="20" cy="70" r="2" fill="#FFD54F" />
    <Circle cx="100" cy="75" r="2" fill="#FFD54F" />
    {/* Small stars */}
    <Path d="M88 30 L90 35 L95 35 L91 38 L93 43 L88 40 L83 43 L85 38 L81 35 L86 35 Z" fill="#FFCC00" />
    <Path d="M28 32 L29 35 L32 35 L30 37 L31 40 L28 38 L25 40 L26 37 L24 35 L27 35 Z" fill="#FFCC00" />
    {/* Shine lines */}
    <Path d="M75 42 L82 35" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
    <Path d="M78 48 L83 43" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Transaction History - Wallet with arrows
export const TransactionHistoryIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="th_wallet" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#16A34A" />
        <Stop offset="100%" stopColor="#15803D" />
      </LinearGradient>
      <LinearGradient id="th_inner" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#22C55E" />
        <Stop offset="100%" stopColor="#16A34A" />
      </LinearGradient>
    </Defs>
    {/* Outer glow */}
    <Circle cx="60" cy="60" r="55" fill="rgba(22, 163, 74, 0.1)" />
    {/* Wallet body */}
    <Rect x="25" y="40" width="70" height="50" rx="8" fill="url(#th_wallet)" />
    {/* Wallet fold */}
    <Path d="M25 48 L95 48" stroke="#15803D" strokeWidth="2" />
    {/* Card slot */}
    <Rect x="65" y="55" width="22" height="15" rx="4" fill="url(#th_inner)" />
    <Circle cx="76" cy="62.5" r="4" fill="#FFF" opacity={0.3} />
    {/* Credit arrow - incoming */}
    <Circle cx="25" cy="35" r="12" fill="#DCFCE7" />
    <Path d="M25 29 L25 41 M20 36 L25 41 L30 36" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Debit arrow - outgoing */}
    <Circle cx="95" cy="35" r="12" fill="#FEE2E2" />
    <Path d="M95 41 L95 29 M90 34 L95 29 L100 34" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Dollar signs */}
    <SvgText x="45" y="72" fill="#FFF" fontSize="16" fontWeight="bold" opacity={0.8}>$</SvgText>
    {/* Floating elements */}
    <Circle cx="15" cy="65" r="2" fill="#16A34A" opacity={0.5} />
    <Circle cx="105" cy="70" r="2" fill="#16A34A" opacity={0.5} />
  </Svg>
);

// Credit Transaction - Money received illustration
export const CreditTransactionIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="ct_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#22C55E" />
        <Stop offset="100%" stopColor="#16A34A" />
      </LinearGradient>
    </Defs>
    {/* Outer glow */}
    <Circle cx="60" cy="60" r="55" fill="rgba(22, 163, 74, 0.12)" />
    {/* Main circle */}
    <Circle cx="60" cy="60" r="45" fill="url(#ct_bg)" />
    {/* Arrow down */}
    <Path d="M60 35 L60 75" stroke="#FFF" strokeWidth="6" strokeLinecap="round" />
    <Path d="M45 60 L60 75 L75 60" stroke="#FFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    {/* Sparkles */}
    <Circle cx="25" cy="40" r="3" fill="#22C55E" />
    <Circle cx="95" cy="45" r="2.5" fill="#22C55E" />
    <Circle cx="20" cy="75" r="2" fill="#86EFAC" />
    <Circle cx="100" cy="80" r="2" fill="#86EFAC" />
    {/* Plus signs */}
    <Path d="M25 25 L25 20 M22.5 22.5 L27.5 22.5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
    <Path d="M95 20 L95 15 M92.5 17.5 L97.5 17.5" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Debit Transaction - Money sent illustration
export const DebitTransactionIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="dt_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#F87171" />
        <Stop offset="100%" stopColor="#EF4444" />
      </LinearGradient>
    </Defs>
    {/* Outer glow */}
    <Circle cx="60" cy="60" r="55" fill="rgba(239, 68, 68, 0.12)" />
    {/* Main circle */}
    <Circle cx="60" cy="60" r="45" fill="url(#dt_bg)" />
    {/* Arrow up */}
    <Path d="M60 85 L60 45" stroke="#FFF" strokeWidth="6" strokeLinecap="round" />
    <Path d="M45 60 L60 45 L75 60" stroke="#FFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    {/* Sparkles */}
    <Circle cx="25" cy="40" r="3" fill="#F87171" />
    <Circle cx="95" cy="45" r="2.5" fill="#F87171" />
    <Circle cx="20" cy="75" r="2" fill="#FECACA" />
    <Circle cx="100" cy="80" r="2" fill="#FECACA" />
    {/* Minus signs */}
    <Path d="M22.5 22.5 L27.5 22.5" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
    <Path d="M92.5 17.5 L97.5 17.5" stroke="#F87171" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Live Support Chat - Headset with chat bubbles
export const LiveSupportIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="ls_headset" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#3B82F6" />
        <Stop offset="100%" stopColor="#1D4ED8" />
      </LinearGradient>
      <LinearGradient id="ls_bubble" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#60A5FA" />
        <Stop offset="100%" stopColor="#3B82F6" />
      </LinearGradient>
    </Defs>
    {/* Outer glow */}
    <Circle cx="60" cy="60" r="55" fill="rgba(59, 130, 246, 0.12)" />
    {/* Head circle */}
    <Circle cx="60" cy="55" r="28" fill="none" stroke="url(#ls_headset)" strokeWidth="6" />
    {/* Headset band */}
    <Path d="M32 55 Q32 28 60 28 Q88 28 88 55" stroke="url(#ls_headset)" strokeWidth="5" strokeLinecap="round" fill="none" />
    {/* Left ear cup */}
    <Rect x="25" y="48" width="14" height="22" rx="7" fill="url(#ls_headset)" />
    <Rect x="28" y="52" width="8" height="14" rx="4" fill="#1E40AF" />
    {/* Right ear cup */}
    <Rect x="81" y="48" width="14" height="22" rx="7" fill="url(#ls_headset)" />
    <Rect x="84" y="52" width="8" height="14" rx="4" fill="#1E40AF" />
    {/* Microphone boom */}
    <Path d="M39 65 Q39 75 50 78" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" fill="none" />
    <Circle cx="52" cy="80" r="5" fill="url(#ls_headset)" />
    <Circle cx="52" cy="80" r="3" fill="#60A5FA" />
    {/* Chat bubble right */}
    <Path d="M75 75 L95 75 Q100 75 100 80 L100 92 Q100 97 95 97 L82 97 L78 103 L78 97 L75 97 Q70 97 70 92 L70 80 Q70 75 75 75 Z" fill="url(#ls_bubble)" />
    {/* Chat dots */}
    <Circle cx="78" cy="86" r="2" fill="#FFF" />
    <Circle cx="85" cy="86" r="2" fill="#FFF" />
    <Circle cx="92" cy="86" r="2" fill="#FFF" />
    {/* Online indicator */}
    <Circle cx="95" cy="72" r="6" fill="#22C55E" />
    <Circle cx="95" cy="72" r="4" fill="#4ADE80" />
    {/* Sparkles */}
    <Circle cx="18" cy="35" r="2" fill="#60A5FA" opacity={0.8} />
    <Circle cx="102" cy="40" r="2" fill="#60A5FA" opacity={0.7} />
    <Path d="M15 65 L17 70 L15 75 L13 70 Z" fill="#3B82F6" opacity={0.6} />
  </Svg>
);

// Status & Community - Camera/Stories with people
export const StatusCommunityIllustration: React.FC<IllustrationProps> = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <LinearGradient id="sc_purple" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A855F7" />
        <Stop offset="100%" stopColor="#7C3AED" />
      </LinearGradient>
      <LinearGradient id="sc_ring" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F472B6" />
        <Stop offset="50%" stopColor="#A855F7" />
        <Stop offset="100%" stopColor="#6366F1" />
      </LinearGradient>
      <LinearGradient id="sc_green" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="100%" stopColor="#10B981" />
      </LinearGradient>
    </Defs>
    {/* Outer glow */}
    <Circle cx="60" cy="60" r="55" fill="rgba(168, 85, 247, 0.1)" />
    {/* Story ring - main circle */}
    <Circle cx="60" cy="50" r="28" fill="none" stroke="url(#sc_ring)" strokeWidth="4" strokeDasharray="12 3" />
    {/* Camera lens/status icon */}
    <Circle cx="60" cy="50" r="22" fill="url(#sc_purple)" />
    <Circle cx="60" cy="50" r="16" fill="rgba(255,255,255,0.15)" />
    <Circle cx="60" cy="50" r="10" fill="rgba(255,255,255,0.2)" />
    <Circle cx="60" cy="50" r="5" fill="#FFF" />
    {/* Camera flash/shine */}
    <Circle cx="72" cy="38" r="4" fill="#FFF" opacity={0.9} />
    {/* People icons at bottom */}
    <Circle cx="35" cy="92" r="8" fill="url(#sc_green)" />
    <Circle cx="35" cy="92" r="5" fill="rgba(255,255,255,0.3)" />
    <Path d="M25 108 Q25 100 35 100 Q45 100 45 108" fill="url(#sc_green)" />
    <Circle cx="60" cy="88" r="10" fill="url(#sc_purple)" />
    <Circle cx="60" cy="88" r="6" fill="rgba(255,255,255,0.3)" />
    <Path d="M47 108 Q47 98 60 98 Q73 98 73 108" fill="url(#sc_purple)" />
    <Circle cx="85" cy="92" r="8" fill="url(#sc_green)" />
    <Circle cx="85" cy="92" r="5" fill="rgba(255,255,255,0.3)" />
    <Path d="M75 108 Q75 100 85 100 Q95 100 95 108" fill="url(#sc_green)" />
    {/* Decorative sparkles */}
    <Circle cx="18" cy="40" r="2" fill="#A855F7" opacity={0.8} />
    <Circle cx="102" cy="45" r="2" fill="#A855F7" opacity={0.7} />
    <Path d="M95 70 L97 75 L95 80 L93 75 Z" fill="#F472B6" opacity={0.7} />
    <Path d="M20 70 L22 75 L20 80 L18 75 Z" fill="#34D399" opacity={0.7} />
    {/* Plus icon for add story */}
    <Circle cx="85" cy="35" r="8" fill="url(#sc_green)" />
    <Path d="M85 31 L85 39" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
    <Path d="M81 35 L89 35" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default {
  FarmerActivationIllustration,
  GoPremiumIllustration,
  VerifiedSellerIllustration,
  BiometricLockIllustration,
  FaceIdIllustration,
  RewardsHeroIllustration,
  PointsBadgeIllustration,
  TransactionHistoryIllustration,
  CreditTransactionIllustration,
  DebitTransactionIllustration,
  LiveSupportIllustration,
  StatusCommunityIllustration,
};
