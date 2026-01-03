import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic mango illustration
const MangoIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="mangoBodyReal" cx="25%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFEB3B" />
        <Stop offset="30%" stopColor="#FFC107" />
        <Stop offset="60%" stopColor="#FF9800" />
        <Stop offset="85%" stopColor="#F57C00" />
        <Stop offset="100%" stopColor="#E65100" />
      </RadialGradient>
      <RadialGradient id="mangoShineReal" cx="30%" cy="25%" r="40%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="50%" stopColor="#FFFDE7" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#FFFDE7" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="mangoBlush" x1="100%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF5722" stopOpacity="0.4" />
        <Stop offset="100%" stopColor="#FF5722" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="34" cy="60" rx="16" ry="3" fill="#3E2723" opacity="0.15" />
    
    {/* Main mango body - kidney/paisley shape */}
    <Path
      d="M14 34C14 20 24 8 38 8C52 8 58 24 54 40C50 54 38 60 26 58C14 56 14 46 14 34Z"
      fill="url(#mangoBodyReal)"
    />
    
    {/* Red/orange blush on one side */}
    <Path
      d="M40 12C50 14 56 26 52 42C48 54 40 58 36 58"
      stroke="url(#mangoBlush)"
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    
    {/* Subtle curve lines for dimension */}
    <Path d="M20 26C28 20 40 20 48 28" stroke="#E65100" strokeWidth="0.5" opacity="0.2" />
    <Path d="M18 38C26 34 42 36 50 44" stroke="#E65100" strokeWidth="0.4" opacity="0.15" />
    
    {/* Main glossy highlight */}
    <Ellipse cx="28" cy="26" rx="10" ry="14" fill="url(#mangoShineReal)" />
    
    {/* Secondary highlight */}
    <Ellipse cx="24" cy="22" rx="5" ry="7" fill="#FFFDE7" opacity="0.35" />
    <Circle cx="22" cy="20" r="2.5" fill="#FFFFFF" opacity="0.4" />
    
    {/* Stem */}
    <Path
      d="M38 8C38 6 40 3 42 2"
      stroke="#5D4037"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Ellipse cx="38" cy="9" rx="3" ry="2" fill="#6D4C41" />
    
    {/* Leaf */}
    <Path
      d="M42 4C48 2 54 4 56 10C56 16 50 18 44 16C38 14 38 8 42 4Z"
      fill="#43A047"
    />
    <Path d="M44 5C50 10 52 14 46 16" stroke="#2E7D32" strokeWidth="0.8" fill="none" />
    <Path d="M46 4C52 8 54 12 48 15" stroke="#66BB6A" strokeWidth="0.4" fill="none" />
    
    {/* Small spots/pores */}
    <Circle cx="36" cy="32" r="0.8" fill="#E65100" opacity="0.2" />
    <Circle cx="30" cy="44" r="0.6" fill="#E65100" opacity="0.2" />
    <Circle cx="42" cy="40" r="0.7" fill="#E65100" opacity="0.15" />
  </Svg>
);

export default MangoIllustration;
