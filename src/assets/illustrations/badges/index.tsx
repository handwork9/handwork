import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  G,
} from 'react-native-svg';

interface BadgeIllustrationProps {
  size?: number;
}

// First Sale Badge - Celebration/Party
export const FirstSaleBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="fs_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="100%" stopColor="#10B981" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#fs_bg)" />
    {/* Confetti */}
    <Rect x="12" y="14" width="3" height="6" rx="1" fill="#FCD34D" transform="rotate(-15 12 14)" />
    <Rect x="33" y="12" width="3" height="6" rx="1" fill="#F472B6" transform="rotate(20 33 12)" />
    <Rect x="10" y="28" width="2" height="5" rx="1" fill="#60A5FA" transform="rotate(-25 10 28)" />
    <Rect x="36" y="30" width="2" height="5" rx="1" fill="#A78BFA" transform="rotate(15 36 30)" />
    {/* Star burst */}
    <Path d="M24 12 L26 19 L33 19 L27 24 L30 31 L24 27 L18 31 L21 24 L15 19 L22 19 Z" fill="#FFF" />
    {/* Sparkles */}
    <Circle cx="16" cy="36" r="1.5" fill="#FFF" opacity={0.8} />
    <Circle cx="32" cy="38" r="1" fill="#FFF" opacity={0.6} />
  </Svg>
);

// Sales Milestone Badges - Star progression
export const RisingStarBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="rs_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#rs_bg)" />
    {/* Main star */}
    <Path d="M24 10 L27.5 18.5 L37 19.5 L30 26 L32 35 L24 30 L16 35 L18 26 L11 19.5 L20.5 18.5 Z" fill="#FFF" />
    {/* Sparkles */}
    <Circle cx="10" cy="14" r="2" fill="#FFF" opacity={0.7} />
    <Circle cx="38" cy="12" r="1.5" fill="#FFF" opacity={0.6} />
    <Circle cx="40" cy="34" r="1" fill="#FFF" opacity={0.5} />
  </Svg>
);

export const ProvenSellerBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="ps_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#ps_bg)" />
    {/* Double star */}
    <Path d="M24 8 L26.5 15 L34 15.5 L28.5 20.5 L30 28 L24 24 L18 28 L19.5 20.5 L14 15.5 L21.5 15 Z" fill="#FFF" />
    {/* Small stars */}
    <Path d="M10 32 L11 34 L13 34 L11.5 35.5 L12.5 38 L10 36.5 L7.5 38 L8.5 35.5 L7 34 L9 34 Z" fill="#FFF" opacity={0.8} />
    <Path d="M38 32 L39 34 L41 34 L39.5 35.5 L40.5 38 L38 36.5 L35.5 38 L36.5 35.5 L35 34 L37 34 Z" fill="#FFF" opacity={0.8} />
  </Svg>
);

export const TopSellerBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="ts_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A78BFA" />
        <Stop offset="100%" stopColor="#8B5CF6" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#ts_bg)" />
    {/* Shooting star */}
    <Path d="M24 10 L27 17 L35 17.5 L29 23 L31 31 L24 26.5 L17 31 L19 23 L13 17.5 L21 17 Z" fill="#FFF" />
    {/* Trail */}
    <Path d="M36 12 L30 18" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity={0.7} />
    <Path d="M40 16 L34 20" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
    {/* Sparkles */}
    <Circle cx="10" cy="30" r="1.5" fill="#FFF" opacity={0.6} />
    <Circle cx="38" cy="36" r="1" fill="#FFF" opacity={0.5} />
  </Svg>
);

export const EliteSellerBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="es_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#818CF8" />
        <Stop offset="100%" stopColor="#6366F1" />
      </SvgLinearGradient>
      <SvgLinearGradient id="es_trophy" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FCD34D" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#es_bg)" />
    {/* Trophy */}
    <Path d="M16 14 L32 14 L30 26 L26 28 L26 32 L22 32 L22 28 L18 26 Z" fill="url(#es_trophy)" />
    {/* Trophy handles */}
    <Path d="M16 16 C10 16 10 24 16 24" stroke="url(#es_trophy)" strokeWidth="2.5" fill="none" />
    <Path d="M32 16 C38 16 38 24 32 24" stroke="url(#es_trophy)" strokeWidth="2.5" fill="none" />
    {/* Base */}
    <Rect x="19" y="32" width="10" height="3" rx="1" fill="url(#es_trophy)" />
    {/* Star on trophy */}
    <Path d="M24 17 L25 19.5 L28 19.5 L25.5 21.5 L26.5 24 L24 22.5 L21.5 24 L22.5 21.5 L20 19.5 L23 19.5 Z" fill="#FFF" />
    {/* Sparkles */}
    <Circle cx="10" cy="12" r="1.5" fill="#FFF" opacity={0.7} />
    <Circle cx="38" cy="14" r="1" fill="#FFF" opacity={0.6} />
  </Svg>
);

export const LegendBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="lg_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#F472B6" />
        <Stop offset="100%" stopColor="#EC4899" />
      </SvgLinearGradient>
      <SvgLinearGradient id="lg_crown" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FCD34D" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#lg_bg)" />
    {/* Crown */}
    <Path d="M10 28 L14 16 L19 22 L24 12 L29 22 L34 16 L38 28 L10 28 Z" fill="url(#lg_crown)" />
    {/* Crown base */}
    <Rect x="10" y="28" width="28" height="6" rx="2" fill="url(#lg_crown)" />
    {/* Gems on crown */}
    <Circle cx="14" cy="18" r="2" fill="#EF4444" />
    <Circle cx="24" cy="14" r="2.5" fill="#3B82F6" />
    <Circle cx="34" cy="18" r="2" fill="#10B981" />
    {/* Sparkles */}
    <Circle cx="8" cy="12" r="1.5" fill="#FFF" opacity={0.8} />
    <Circle cx="40" cy="10" r="1" fill="#FFF" opacity={0.7} />
    <Circle cx="42" cy="36" r="1" fill="#FFF" opacity={0.6} />
  </Svg>
);

// Revenue Badges - Coins/Money
export const BronzeRevenueBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="br_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D97706" />
        <Stop offset="100%" stopColor="#B45309" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#br_bg)" />
    {/* Coin stack */}
    <Ellipse cx="24" cy="32" rx="12" ry="4" fill="#92400E" />
    <Ellipse cx="24" cy="30" rx="12" ry="4" fill="#CD7F32" />
    <Ellipse cx="24" cy="26" rx="12" ry="4" fill="#92400E" />
    <Ellipse cx="24" cy="24" rx="12" ry="4" fill="#CD7F32" />
    <Ellipse cx="24" cy="20" rx="12" ry="4" fill="#92400E" />
    <Ellipse cx="24" cy="18" rx="12" ry="4" fill="#D4A574" />
    {/* Naira symbol */}
    <Path d="M22 16 L22 20 M26 16 L26 20 M20 17.5 L28 17.5 M20 19 L28 19" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const SilverRevenueBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="sr_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#9CA3AF" />
        <Stop offset="100%" stopColor="#6B7280" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#sr_bg)" />
    {/* Coin stack */}
    <Ellipse cx="24" cy="32" rx="12" ry="4" fill="#4B5563" />
    <Ellipse cx="24" cy="30" rx="12" ry="4" fill="#9CA3AF" />
    <Ellipse cx="24" cy="26" rx="12" ry="4" fill="#4B5563" />
    <Ellipse cx="24" cy="24" rx="12" ry="4" fill="#9CA3AF" />
    <Ellipse cx="24" cy="20" rx="12" ry="4" fill="#4B5563" />
    <Ellipse cx="24" cy="18" rx="12" ry="4" fill="#D1D5DB" />
    {/* Naira symbol */}
    <Path d="M22 16 L22 20 M26 16 L26 20 M20 17.5 L28 17.5 M20 19 L28 19" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" />
    {/* Sparkle */}
    <Circle cx="38" cy="14" r="1.5" fill="#FFF" opacity={0.6} />
  </Svg>
);

export const GoldRevenueBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="gr_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FCD34D" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#gr_bg)" />
    {/* Coin stack */}
    <Ellipse cx="24" cy="32" rx="12" ry="4" fill="#B45309" />
    <Ellipse cx="24" cy="30" rx="12" ry="4" fill="#F59E0B" />
    <Ellipse cx="24" cy="26" rx="12" ry="4" fill="#B45309" />
    <Ellipse cx="24" cy="24" rx="12" ry="4" fill="#F59E0B" />
    <Ellipse cx="24" cy="20" rx="12" ry="4" fill="#B45309" />
    <Ellipse cx="24" cy="18" rx="12" ry="4" fill="#FCD34D" />
    {/* Naira symbol */}
    <Path d="M22 16 L22 20 M26 16 L26 20 M20 17.5 L28 17.5 M20 19 L28 19" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
    {/* Sparkles */}
    <Circle cx="10" cy="14" r="1.5" fill="#FFF" opacity={0.8} />
    <Circle cx="38" cy="12" r="1" fill="#FFF" opacity={0.7} />
  </Svg>
);

export const PlatinumRevenueBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="pr_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#818CF8" />
        <Stop offset="100%" stopColor="#6366F1" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#pr_bg)" />
    {/* Diamond */}
    <Path d="M24 10 L34 20 L24 38 L14 20 Z" fill="#E0E7FF" />
    <Path d="M24 10 L14 20 L24 20 Z" fill="#C7D2FE" />
    <Path d="M24 10 L34 20 L24 20 Z" fill="#A5B4FC" />
    <Path d="M24 20 L14 20 L24 38 Z" fill="#818CF8" />
    <Path d="M24 20 L34 20 L24 38 Z" fill="#6366F1" />
    {/* Sparkles */}
    <Circle cx="10" cy="12" r="1.5" fill="#FFF" opacity={0.8} />
    <Circle cx="38" cy="14" r="1" fill="#FFF" opacity={0.7} />
    <Circle cx="8" cy="32" r="1" fill="#FFF" opacity={0.6} />
  </Svg>
);

export const DiamondRevenueBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="dr_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#F472B6" />
        <Stop offset="100%" stopColor="#EC4899" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#dr_bg)" />
    {/* Diamond */}
    <Path d="M24 8 L36 18 L24 40 L12 18 Z" fill="#FBCFE8" />
    <Path d="M24 8 L12 18 L24 18 Z" fill="#F9A8D4" />
    <Path d="M24 8 L36 18 L24 18 Z" fill="#F472B6" />
    <Path d="M24 18 L12 18 L24 40 Z" fill="#EC4899" />
    <Path d="M24 18 L36 18 L24 40 Z" fill="#DB2777" />
    {/* Sparkles */}
    <Circle cx="8" cy="12" r="2" fill="#FFF" opacity={0.8} />
    <Circle cx="40" cy="10" r="1.5" fill="#FFF" opacity={0.7} />
    <Circle cx="6" cy="34" r="1" fill="#FFF" opacity={0.6} />
    <Circle cx="42" cy="32" r="1" fill="#FFF" opacity={0.5} />
  </Svg>
);

// Rating Badges
export const TopRatedBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="tr_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#tr_bg)" />
    {/* Star */}
    <Path d="M24 10 L28 19 L38 20 L31 27 L33 37 L24 32 L15 37 L17 27 L10 20 L20 19 Z" fill="#FFF" />
    {/* Inner star glow */}
    <Path d="M24 14 L26.5 20 L33 20.5 L28 25 L29.5 32 L24 28.5 L18.5 32 L20 25 L15 20.5 L21.5 20 Z" fill="#FEF3C7" />
  </Svg>
);

export const FiveStarBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="5s_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#5s_bg)" />
    {/* 5 small stars in arc */}
    <Path d="M10 24 L11 26.5 L14 26.5 L11.5 28 L12.5 30.5 L10 29 L7.5 30.5 L8.5 28 L6 26.5 L9 26.5 Z" fill="#FFF" />
    <Path d="M17 16 L18 18.5 L21 18.5 L18.5 20 L19.5 22.5 L17 21 L14.5 22.5 L15.5 20 L13 18.5 L16 18.5 Z" fill="#FFF" />
    <Path d="M24 12 L25.5 15.5 L29 15.5 L26 17.5 L27 21 L24 19 L21 21 L22 17.5 L19 15.5 L22.5 15.5 Z" fill="#FFF" />
    <Path d="M31 16 L32 18.5 L35 18.5 L32.5 20 L33.5 22.5 L31 21 L28.5 22.5 L29.5 20 L27 18.5 L30 18.5 Z" fill="#FFF" />
    <Path d="M38 24 L39 26.5 L42 26.5 L39.5 28 L40.5 30.5 L38 29 L35.5 30.5 L36.5 28 L34 26.5 L37 26.5 Z" fill="#FFF" />
    {/* Big 5 */}
    <Path d="M20 32 L28 32 L28 34 L22 34 L22 36 L27 36 C28.5 36 30 37.5 30 39 C30 40.5 28.5 42 27 42 L20 42 L20 40 L27 40 C27.5 40 28 39.5 28 39 C28 38.5 27.5 38 27 38 L20 38 Z" fill="#FFF" />
  </Svg>
);

export const ConsistentQualityBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="cq_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="100%" stopColor="#10B981" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#cq_bg)" />
    {/* Sparkle cluster */}
    <Path d="M24 8 L25 14 L31 14 L26 18 L28 24 L24 20 L20 24 L22 18 L17 14 L23 14 Z" fill="#FFF" />
    <Circle cx="14" cy="28" r="3" fill="#FFF" opacity={0.9} />
    <Circle cx="34" cy="28" r="3" fill="#FFF" opacity={0.9} />
    <Circle cx="24" cy="36" r="3" fill="#FFF" opacity={0.9} />
    {/* Connecting lines */}
    <Path d="M17 28 L31 28 M21 33 L27 33" stroke="#FFF" strokeWidth="1.5" opacity={0.5} />
  </Svg>
);

// Product Badges
export const ProductVarietyBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="pv_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#60A5FA" />
        <Stop offset="100%" stopColor="#3B82F6" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#pv_bg)" />
    {/* Shopping cart */}
    <Path d="M10 14 L14 14 L18 28 L34 28 L38 18 L16 18" stroke="#FFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="19" cy="34" r="3" fill="#FFF" />
    <Circle cx="33" cy="34" r="3" fill="#FFF" />
    {/* Items in cart */}
    <Rect x="20" y="21" width="4" height="5" rx="1" fill="#FFF" opacity={0.7} />
    <Rect x="26" y="21" width="4" height="5" rx="1" fill="#FFF" opacity={0.7} />
    <Rect x="32" y="21" width="3" height="5" rx="1" fill="#FFF" opacity={0.7} />
  </Svg>
);

export const OrganicCertifiedBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="oc_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="100%" stopColor="#10B981" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#oc_bg)" />
    {/* Leaf */}
    <Path d="M24 38 C24 38 12 28 12 18 C12 12 18 8 24 8 C30 8 36 12 36 18 C36 28 24 38 24 38 Z" fill="#FFF" />
    {/* Leaf vein */}
    <Path d="M24 12 L24 34" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
    <Path d="M24 18 L18 14" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M24 18 L30 14" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M24 24 L17 20" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M24 24 L31 20" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M24 30 L19 27" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M24 30 L29 27" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const LocalChampionBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="lc_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A78BFA" />
        <Stop offset="100%" stopColor="#8B5CF6" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#lc_bg)" />
    {/* Medal */}
    <Circle cx="24" cy="28" r="12" fill="#FCD34D" />
    <Circle cx="24" cy="28" r="9" fill="#F59E0B" />
    {/* Number 1 */}
    <Path d="M22 23 L24 21 L24 35" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {/* Ribbon */}
    <Path d="M18 10 L18 22 L24 18 L30 22 L30 10" fill="#EF4444" />
    <Path d="M18 10 L18 22 L24 18" fill="#DC2626" />
  </Svg>
);

// Customer Service Badges
export const FastResponderBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="fr_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#fr_bg)" />
    {/* Lightning bolt */}
    <Path d="M26 8 L16 24 L22 24 L20 40 L34 20 L26 20 Z" fill="#FFF" />
    {/* Spark lines */}
    <Path d="M10 18 L14 20" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
    <Path d="M8 26 L12 26" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
    <Path d="M36 28 L40 28" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
    <Path d="M34 34 L38 36" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const QuickShipperBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="qs_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#60A5FA" />
        <Stop offset="100%" stopColor="#3B82F6" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#qs_bg)" />
    {/* Package box */}
    <Rect x="14" y="16" width="20" height="18" rx="2" fill="#FFF" />
    <Path d="M14 22 L34 22" stroke="#3B82F6" strokeWidth="2" />
    <Path d="M24 16 L24 22" stroke="#3B82F6" strokeWidth="2" />
    {/* Speed lines */}
    <Path d="M8 20 L12 20" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
    <Path d="M6 26 L11 26" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
    <Path d="M8 32 L12 32" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
    {/* Checkmark */}
    <Path d="M20 27 L23 30 L30 23" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TrustedSellerBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="tsd_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="100%" stopColor="#10B981" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#tsd_bg)" />
    {/* Shield */}
    <Path d="M24 8 L38 14 L38 26 C38 34 31 40 24 42 C17 40 10 34 10 26 L10 14 Z" fill="#FFF" />
    {/* Checkmark */}
    <Path d="M17 24 L22 29 L32 19" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Tenure Badges
export const NewMemberBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="nm_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="100%" stopColor="#10B981" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#nm_bg)" />
    {/* Seedling */}
    <Ellipse cx="24" cy="38" rx="10" ry="4" fill="#065F46" />
    <Path d="M24 38 L24 26" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
    {/* Leaves */}
    <Path d="M24 30 C24 30 18 26 18 22 C18 18 24 18 24 22" fill="#FFF" />
    <Path d="M24 26 C24 26 30 22 30 18 C30 14 24 14 24 18" fill="#FFF" />
    {/* Drops */}
    <Circle cx="14" cy="18" r="2" fill="#FFF" opacity={0.6} />
    <Circle cx="34" cy="16" r="1.5" fill="#FFF" opacity={0.5} />
  </Svg>
);

export const EstablishedBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="eb_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#34D399" />
        <Stop offset="100%" stopColor="#10B981" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#eb_bg)" />
    {/* Tree */}
    <Rect x="21" y="32" width="6" height="10" rx="1" fill="#92400E" />
    {/* Foliage */}
    <Circle cx="24" cy="22" r="14" fill="#FFF" />
    <Circle cx="16" cy="26" r="8" fill="#FFF" />
    <Circle cx="32" cy="26" r="8" fill="#FFF" />
    {/* Inner detail */}
    <Circle cx="24" cy="22" r="10" fill="#D1FAE5" />
    <Circle cx="16" cy="26" r="5" fill="#D1FAE5" />
    <Circle cx="32" cy="26" r="5" fill="#D1FAE5" />
  </Svg>
);

export const VeteranBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="vb_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="100%" stopColor="#F59E0B" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#vb_bg)" />
    {/* Medal with ribbon */}
    <Path d="M18 6 L24 16 L30 6" fill="#EF4444" />
    <Circle cx="24" cy="26" r="14" fill="#FFF" />
    <Circle cx="24" cy="26" r="10" fill="#FEF3C7" />
    {/* Star in center */}
    <Path d="M24 18 L26 23 L31 23 L27 26.5 L29 32 L24 29 L19 32 L21 26.5 L17 23 L22 23 Z" fill="#F59E0B" />
  </Svg>
);

export const PioneerBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="pb_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A78BFA" />
        <Stop offset="100%" stopColor="#8B5CF6" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#pb_bg)" />
    {/* Temple/Building */}
    <Path d="M24 8 L40 18 L40 20 L8 20 L8 18 Z" fill="#FFF" />
    <Rect x="10" y="20" width="28" height="20" fill="#FFF" />
    {/* Pillars */}
    <Rect x="13" y="22" width="4" height="16" fill="#8B5CF6" />
    <Rect x="22" y="22" width="4" height="16" fill="#8B5CF6" />
    <Rect x="31" y="22" width="4" height="16" fill="#8B5CF6" />
    {/* Base */}
    <Rect x="8" y="38" width="32" height="4" rx="1" fill="#FFF" />
  </Svg>
);

// Special Badges
export const VerifiedFarmerBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="vf_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#60A5FA" />
        <Stop offset="100%" stopColor="#3B82F6" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#vf_bg)" />
    {/* Verification badge */}
    <Circle cx="24" cy="24" r="16" fill="#FFF" />
    {/* Checkmark */}
    <Path d="M15 24 L21 30 L33 18" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    {/* Sparkles */}
    <Circle cx="10" cy="12" r="2" fill="#FFF" opacity={0.8} />
    <Circle cx="38" cy="14" r="1.5" fill="#FFF" opacity={0.7} />
  </Svg>
);

export const PremiumSellerBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="psb_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#F472B6" />
        <Stop offset="100%" stopColor="#EC4899" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#psb_bg)" />
    {/* Diamond */}
    <Path d="M24 8 L36 20 L24 40 L12 20 Z" fill="#FFF" />
    <Path d="M24 8 L12 20 L24 20 Z" fill="#FBCFE8" />
    <Path d="M24 8 L36 20 L24 20 Z" fill="#F9A8D4" />
    <Path d="M24 20 L12 20 L24 40 Z" fill="#F472B6" />
    <Path d="M24 20 L36 20 L24 40 Z" fill="#EC4899" />
    {/* Sparkles */}
    <Circle cx="8" cy="14" r="2" fill="#FFF" opacity={0.8} />
    <Circle cx="40" cy="12" r="1.5" fill="#FFF" opacity={0.7} />
    <Circle cx="6" cy="32" r="1" fill="#FFF" opacity={0.6} />
  </Svg>
);

export const TrendingSellerBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="tsb_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#F87171" />
        <Stop offset="100%" stopColor="#EF4444" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#tsb_bg)" />
    {/* Flame */}
    <Path d="M24 8 C24 8 32 16 32 26 C32 32 28 38 24 38 C20 38 16 32 16 26 C16 16 24 8 24 8 Z" fill="#FFF" />
    <Path d="M24 18 C24 18 28 22 28 28 C28 32 26 36 24 36 C22 36 20 32 20 28 C20 22 24 18 24 18 Z" fill="#FBBF24" />
    <Path d="M24 26 C24 26 26 28 26 31 C26 33 25 35 24 35 C23 35 22 33 22 31 C22 28 24 26 24 26 Z" fill="#F59E0B" />
    {/* Sparkles */}
    <Circle cx="10" cy="14" r="2" fill="#FFF" opacity={0.7} />
    <Circle cx="38" cy="16" r="1.5" fill="#FFF" opacity={0.6} />
  </Svg>
);

export const CommunityFavoriteBadge: React.FC<BadgeIllustrationProps> = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Defs>
      <SvgLinearGradient id="cf_bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#F472B6" />
        <Stop offset="100%" stopColor="#EC4899" />
      </SvgLinearGradient>
    </Defs>
    <Circle cx="24" cy="24" r="22" fill="url(#cf_bg)" />
    {/* Heart */}
    <Path d="M24 38 C24 38 8 28 8 18 C8 12 13 8 18 8 C21 8 24 10 24 14 C24 10 27 8 30 8 C35 8 40 12 40 18 C40 28 24 38 24 38 Z" fill="#FFF" />
    {/* Inner heart detail */}
    <Circle cx="18" cy="16" r="3" fill="#FBCFE8" />
    {/* Sparkles */}
    <Circle cx="8" cy="8" r="2" fill="#FFF" opacity={0.8} />
    <Circle cx="40" cy="10" r="1.5" fill="#FFF" opacity={0.7} />
  </Svg>
);

// Badge type to component mapping
export const BadgeIllustrations: Record<string, React.FC<BadgeIllustrationProps>> = {
  // Sales
  first_sale: FirstSaleBadge,
  sales_10: RisingStarBadge,
  sales_50: ProvenSellerBadge,
  sales_100: TopSellerBadge,
  sales_500: EliteSellerBadge,
  sales_1000: LegendBadge,
  
  // Revenue
  revenue_10k: BronzeRevenueBadge,
  revenue_50k: SilverRevenueBadge,
  revenue_100k: GoldRevenueBadge,
  revenue_500k: PlatinumRevenueBadge,
  revenue_1m: DiamondRevenueBadge,
  
  // Rating
  top_rated: TopRatedBadge,
  five_star: FiveStarBadge,
  consistent_quality: ConsistentQualityBadge,
  
  // Product
  product_variety: ProductVarietyBadge,
  organic_certified: OrganicCertifiedBadge,
  local_champion: LocalChampionBadge,
  
  // Customer Service
  fast_responder: FastResponderBadge,
  quick_shipper: QuickShipperBadge,
  zero_disputes: TrustedSellerBadge,
  
  // Tenure
  member_1_month: NewMemberBadge,
  member_6_months: EstablishedBadge,
  member_1_year: VeteranBadge,
  member_2_years: PioneerBadge,
  
  // Special
  verified_farmer: VerifiedFarmerBadge,
  premium_seller: PremiumSellerBadge,
  trending_seller: TrendingSellerBadge,
  community_favorite: CommunityFavoriteBadge,
};

// Helper function to get badge illustration
export const getBadgeIllustration = (badgeType: string): React.FC<BadgeIllustrationProps> | null => {
  return BadgeIllustrations[badgeType] || null;
};
