import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic tomato illustration
const TomatoIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Photorealistic tomato body gradient */}
      <RadialGradient id="tomatoBodyReal" cx="35%" cy="30%" r="65%">
        <Stop offset="0%" stopColor="#FF5252" />
        <Stop offset="25%" stopColor="#F44336" />
        <Stop offset="50%" stopColor="#E53935" />
        <Stop offset="75%" stopColor="#D32F2F" />
        <Stop offset="100%" stopColor="#B71C1C" />
      </RadialGradient>
      <RadialGradient id="tomatoShineReal" cx="25%" cy="25%" r="40%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
        <Stop offset="50%" stopColor="#FFCDD2" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#FFCDD2" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="tomatoBottomReal" cx="50%" cy="85%" r="40%">
        <Stop offset="0%" stopColor="#B71C1C" stopOpacity="0.6" />
        <Stop offset="100%" stopColor="#C62828" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    
    {/* Main tomato body - slightly flattened sphere */}
    <Path
      d="M8 36C8 24 18 14 32 14C46 14 56 24 56 36C56 50 46 58 32 58C18 58 8 50 8 36Z"
      fill="url(#tomatoBodyReal)"
    />
    
    {/* Tomato segment creases */}
    <Path d="M14 32C22 28 28 26 32 36" stroke="#B71C1C" strokeWidth="0.6" opacity="0.25" />
    <Path d="M32 36C36 26 42 28 50 32" stroke="#B71C1C" strokeWidth="0.6" opacity="0.25" />
    <Path d="M16 44C24 40 32 38 32 36" stroke="#B71C1C" strokeWidth="0.5" opacity="0.2" />
    <Path d="M32 36C32 38 40 40 48 44" stroke="#B71C1C" strokeWidth="0.5" opacity="0.2" />
    
    {/* Bottom shadow */}
    <Ellipse cx="32" cy="52" rx="12" ry="4" fill="url(#tomatoBottomReal)" />
    
    {/* Main glossy highlight */}
    <Ellipse cx="22" cy="26" rx="8" ry="6" fill="url(#tomatoShineReal)" />
    {/* Secondary small highlight */}
    <Circle cx="42" cy="28" r="3" fill="#FFFFFF" opacity="0.2" />
    
    {/* Green calyx (star-shaped top) */}
    <Ellipse cx="32" cy="14" rx="8" ry="3" fill="#2E7D32" />
    
    {/* 5 pointed sepals */}
    <Path d="M24 14C20 12 18 8 20 6C22 6 24 10 26 13" fill="#43A047" />
    <Path d="M30 12C30 8 31 4 33 4C35 4 34 8 34 12" fill="#66BB6A" />
    <Path d="M38 13C40 10 42 6 44 6C46 8 44 12 40 14" fill="#43A047" />
    <Path d="M22 16C18 15 16 12 17 10C19 10 22 14 24 16" fill="#388E3C" />
    <Path d="M40 16C44 14 46 10 47 12C46 14 44 16 42 16" fill="#388E3C" />
    
    {/* Center stem */}
    <Ellipse cx="32" cy="12" rx="2.5" ry="1.5" fill="#1B5E20" />
    <Path d="M32 12L32 6" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
    <Path d="M32 6L31 4" stroke="#4E342E" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export default TomatoIllustration;
