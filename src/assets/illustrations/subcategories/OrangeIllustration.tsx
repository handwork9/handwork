import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic orange illustration
const OrangeIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="orangeBodyReal" cx="35%" cy="30%" r="65%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="30%" stopColor="#FFA726" />
        <Stop offset="60%" stopColor="#FF9800" />
        <Stop offset="85%" stopColor="#F57C00" />
        <Stop offset="100%" stopColor="#E65100" />
      </RadialGradient>
      <RadialGradient id="orangeShineReal" cx="25%" cy="25%" r="40%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="50%" stopColor="#FFE0B2" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#FFE0B2" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="32" cy="60" rx="18" ry="3" fill="#3E2723" opacity="0.15" />
    
    {/* Main orange body */}
    <Circle cx="32" cy="36" r="22" fill="url(#orangeBodyReal)" />
    
    {/* Orange peel texture - dimpled surface */}
    <G opacity="0.25">
      {/* Scattered dimples */}
      <Circle cx="20" cy="28" r="1.2" fill="#E65100" />
      <Circle cx="26" cy="32" r="1" fill="#E65100" />
      <Circle cx="24" cy="40" r="1.1" fill="#E65100" />
      <Circle cx="30" cy="26" r="0.9" fill="#E65100" />
      <Circle cx="38" cy="30" r="1" fill="#E65100" />
      <Circle cx="42" cy="36" r="1.2" fill="#E65100" />
      <Circle cx="46" cy="42" r="1" fill="#E65100" />
      <Circle cx="34" cy="44" r="1.1" fill="#E65100" />
      <Circle cx="28" cy="48" r="0.9" fill="#E65100" />
      <Circle cx="40" cy="48" r="1" fill="#E65100" />
      <Circle cx="18" cy="36" r="1" fill="#E65100" />
      <Circle cx="22" cy="46" r="0.8" fill="#E65100" />
      <Circle cx="36" cy="52" r="0.9" fill="#E65100" />
      <Circle cx="44" cy="28" r="0.8" fill="#E65100" />
      <Circle cx="32" cy="36" r="1" fill="#E65100" />
    </G>
    
    {/* Main glossy highlight */}
    <Ellipse cx="24" cy="28" rx="8" ry="10" fill="url(#orangeShineReal)" />
    <Ellipse cx="22" cy="26" rx="4" ry="5" fill="#FFFFFF" opacity="0.25" />
    <Circle cx="20" cy="24" r="2" fill="#FFFFFF" opacity="0.35" />
    
    {/* Navel/stem indent at top */}
    <Ellipse cx="32" cy="15" rx="4" ry="2" fill="#E65100" />
    <Ellipse cx="32" cy="15" rx="2.5" ry="1.2" fill="#BF360C" />
    
    {/* Stem */}
    <Path
      d="M32 15V10"
      stroke="#5D4037"
      strokeWidth="3"
      strokeLinecap="round"
    />
    
    {/* Leaf */}
    <Path
      d="M32 12C36 8 44 6 48 10C48 16 42 20 36 18C30 16 30 14 32 12Z"
      fill="#43A047"
    />
    <Path d="M36 8C42 12 46 16 40 18" stroke="#2E7D32" strokeWidth="0.8" fill="none" />
    <Path d="M38 10C42 13 44 15 42 17" stroke="#66BB6A" strokeWidth="0.4" fill="none" />
    
    {/* Bottom dimple */}
    <Circle cx="32" cy="56" r="2" fill="#BF360C" opacity="0.4" />
  </Svg>
);

export default OrangeIllustration;
