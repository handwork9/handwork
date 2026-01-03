import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic milk bottle illustration
const MilkIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="milkBottleReal" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E3F2FD" />
        <Stop offset="20%" stopColor="#FFFFFF" />
        <Stop offset="80%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E3F2FD" />
      </LinearGradient>
      <LinearGradient id="milkInsideReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </LinearGradient>
      <LinearGradient id="capBlueReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#42A5F5" />
        <Stop offset="50%" stopColor="#1E88E5" />
        <Stop offset="100%" stopColor="#1565C0" />
      </LinearGradient>
      <RadialGradient id="milkShine" cx="25%" cy="30%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="32" cy="62" rx="14" ry="2" fill="#90A4AE" opacity="0.2" />
    
    {/* Bottle body */}
    <Path
      d="M18 22H46V26L50 32V58C50 60 48 62 46 62H18C16 62 14 60 14 58V32L18 26V22Z"
      fill="url(#milkBottleReal)"
      stroke="#B3E5FC"
      strokeWidth="0.5"
    />
    
    {/* Milk fill level */}
    <Path
      d="M16 34H48V58C48 59 47 60 46 60H18C17 60 16 59 16 58V34Z"
      fill="url(#milkInsideReal)"
    />
    
    {/* Milk surface wave */}
    <Path
      d="M16 34C22 32 28 36 32 34C36 32 42 36 48 34"
      fill="#FAFAFA"
    />
    
    {/* Bottle neck */}
    <Rect x="22" y="12" width="20" height="10" rx="1" fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="0.5" />
    
    {/* Cap */}
    <Rect x="20" y="6" width="24" height="6" rx="2" fill="url(#capBlueReal)" />
    <Rect x="24" y="4" width="16" height="4" rx="1" fill="#1976D2" />
    {/* Cap highlight */}
    <Path d="M24 7H38" stroke="#64B5F6" strokeWidth="1" opacity="0.5" />
    
    {/* Bottle highlight - glass effect */}
    <Path
      d="M20 26C20 26 20 40 20 56"
      stroke="#FFFFFF"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.7"
    />
    
    {/* Label */}
    <G>
      <Rect x="18" y="40" width="28" height="16" rx="2" fill="#E3F2FD" />
      <Rect x="20" y="42" width="24" height="12" rx="1" fill="#BBDEFB" />
      {/* Cow icon */}
      <Ellipse cx="32" cy="48" rx="6" ry="4" fill="#90CAF9" />
      <Circle cx="29" cy="47" r="1" fill="#1565C0" />
      <Circle cx="35" cy="47" r="1" fill="#1565C0" />
      <Path d="M30 50C31 51 33 51 34 50" stroke="#1565C0" strokeWidth="0.8" strokeLinecap="round" />
    </G>
    
    {/* Milk splash decoration */}
    <G>
      <Ellipse cx="56" cy="52" rx="5" ry="2.5" fill="#FFFFFF" />
      <Circle cx="58" cy="48" r="2.5" fill="#FFFFFF" />
      <Circle cx="60" cy="54" r="1.8" fill="#FFFFFF" />
      <Circle cx="54" cy="56" r="1.5" fill="#FFFFFF" />
    </G>
  </Svg>
);

export default MilkIllustration;
