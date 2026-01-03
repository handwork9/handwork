import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Polygon, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic honeycomb illustration
const HoneycombIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="honeyFilledReal" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="50%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </RadialGradient>
      <LinearGradient id="waxCellReal" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFECB3" />
        <Stop offset="50%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </LinearGradient>
      <RadialGradient id="honeyShineReal" cx="30%" cy="30%" r="60%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    
    {/* Honeycomb cells - detailed hexagonal pattern */}
    <G>
      {/* Row 1 */}
      <Polygon points="20,8 28,12 28,20 20,24 12,20 12,12" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="20" cy="16" r="5" fill="url(#honeyFilledReal)" />
      <Circle cx="18" cy="14" r="1.5" fill="url(#honeyShineReal)" />
      
      <Polygon points="36,8 44,12 44,20 36,24 28,20 28,12" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="36" cy="16" r="5" fill="url(#honeyFilledReal)" />
      <Circle cx="34" cy="14" r="1.5" fill="url(#honeyShineReal)" />
      
      <Polygon points="52,8 60,12 60,20 52,24 44,20 44,12" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="52" cy="16" r="4" fill="url(#honeyFilledReal)" opacity="0.8" />
      
      {/* Row 2 */}
      <Polygon points="12,24 20,28 20,36 12,40 4,36 4,28" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="12" cy="32" r="5" fill="url(#honeyFilledReal)" />
      
      <Polygon points="28,24 36,28 36,36 28,40 20,36 20,28" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="28" cy="32" r="5" fill="url(#honeyFilledReal)" />
      <Circle cx="26" cy="30" r="1.5" fill="url(#honeyShineReal)" />
      
      <Polygon points="44,24 52,28 52,36 44,40 36,36 36,28" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="44" cy="32" r="4.5" fill="url(#honeyFilledReal)" opacity="0.9" />
      
      {/* Row 3 */}
      <Polygon points="20,40 28,44 28,52 20,56 12,52 12,44" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="20" cy="48" r="5" fill="url(#honeyFilledReal)" />
      
      <Polygon points="36,40 44,44 44,52 36,56 28,52 28,44" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="36" cy="48" r="5" fill="url(#honeyFilledReal)" />
      <Circle cx="34" cy="46" r="1.5" fill="url(#honeyShineReal)" />
      
      <Polygon points="52,40 60,44 60,52 52,56 44,52 44,44" fill="url(#waxCellReal)" stroke="#FFA000" strokeWidth="1.2" />
      <Circle cx="52" cy="48" r="4" fill="url(#honeyFilledReal)" opacity="0.7" />
    </G>
    
    {/* Honey drip */}
    <G>
      <Path
        d="M28 52C28 54 30 60 32 62C34 60 36 54 36 52"
        fill="url(#honeyFilledReal)"
      />
      <Ellipse cx="32" cy="62" rx="4" ry="2" fill="#FFB300" />
      <Circle cx="30" cy="60" r="1" fill="#FFFDE7" opacity="0.5" />
    </G>
    
    {/* Realistic bee */}
    <G>
      {/* Wings */}
      <Ellipse cx="52" cy="26" rx="5" ry="3" fill="#E3F2FD" opacity="0.7" />
      <Ellipse cx="56" cy="27" rx="4" ry="2.5" fill="#BBDEFB" opacity="0.7" />
      
      {/* Body - fuzzy abdomen */}
      <Ellipse cx="56" cy="32" rx="6" ry="4" fill="#FFC107" />
      {/* Stripes */}
      <Path d="M52 30V34" stroke="#212121" strokeWidth="1.5" />
      <Path d="M55 29V35" stroke="#212121" strokeWidth="1.5" />
      <Path d="M58 30V34" stroke="#212121" strokeWidth="1.5" />
      
      {/* Thorax */}
      <Circle cx="60" cy="32" r="2.5" fill="#FFB300" />
      
      {/* Head */}
      <Circle cx="63" cy="32" r="2" fill="#3E2723" />
      {/* Eyes */}
      <Circle cx="64" cy="31" r="0.8" fill="#212121" />
      
      {/* Antennae */}
      <Path d="M64 30L66 28" stroke="#212121" strokeWidth="0.5" />
      <Path d="M64 31L66 30" stroke="#212121" strokeWidth="0.5" />
      
      {/* Stinger */}
      <Path d="M50 32L48 32" stroke="#3E2723" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Extra honey drops */}
    <Circle cx="6" cy="46" r="2.5" fill="#FFB300" />
    <Circle cx="5" cy="45" r="0.8" fill="#FFFDE7" opacity="0.5" />
  </Svg>
);

export default HoneycombIllustration;
