import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const MilkIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="milkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E3F2FD" />
      </LinearGradient>
      <LinearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#42A5F5" />
        <Stop offset="100%" stopColor="#1565C0" />
      </LinearGradient>
    </Defs>
    
    {/* Bottle body */}
    <Path
      d="M20 20H44V24L48 30V56C48 58 46 60 44 60H20C18 60 16 58 16 56V30L20 24V20Z"
      fill="url(#milkGrad)"
      stroke="#B3E5FC"
      strokeWidth="1"
    />
    
    {/* Milk inside */}
    <Path
      d="M18 32H46V56C46 57 45 58 44 58H20C19 58 18 57 18 56V32Z"
      fill="#BBDEFB"
      opacity="0.4"
    />
    
    {/* Bottle neck */}
    <Rect x="22" y="12" width="20" height="8" rx="1" fill="#FAFAFA" stroke="#E0E0E0" strokeWidth="0.5" />
    
    {/* Cap */}
    <Rect x="20" y="6" width="24" height="6" rx="2" fill="url(#capGrad)" />
    <Rect x="24" y="4" width="16" height="4" rx="1" fill="#1E88E5" />
    
    {/* Label */}
    <G>
      <Rect x="20" y="38" width="24" height="14" rx="2" fill="#E3F2FD" />
      <Ellipse cx="32" cy="45" rx="6" ry="4" fill="#90CAF9" />
      <Path d="M29 43C29 43 32 48 35 43" stroke="#1565C0" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Highlight */}
    <Path
      d="M22 30C22 30 22 50 22 54"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
    
    {/* Milk splash */}
    <G>
      <Ellipse cx="54" cy="50" rx="4" ry="2" fill="#FFFFFF" />
      <Circle cx="56" cy="46" r="2" fill="#FFFFFF" />
      <Circle cx="58" cy="52" r="1.5" fill="#FFFFFF" />
    </G>
  </Svg>
);

export default MilkIllustration;
