import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const ChickenIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="chickenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCCBC" />
        <Stop offset="100%" stopColor="#FF8A65" />
      </LinearGradient>
    </Defs>
    
    {/* Body */}
    <Ellipse cx="28" cy="38" rx="18" ry="14" fill="url(#chickenGrad)" />
    
    {/* Breast highlight */}
    <Ellipse cx="24" cy="40" rx="8" ry="6" fill="#FFAB91" opacity="0.5" />
    
    {/* Head */}
    <Circle cx="48" cy="26" r="10" fill="url(#chickenGrad)" />
    
    {/* Comb */}
    <G>
      <Circle cx="46" cy="16" r="3" fill="#F44336" />
      <Circle cx="50" cy="14" r="3.5" fill="#E53935" />
      <Circle cx="54" cy="16" r="3" fill="#F44336" />
    </G>
    
    {/* Wattle */}
    <Ellipse cx="54" cy="32" rx="2" ry="4" fill="#E53935" />
    
    {/* Beak */}
    <Path
      d="M56 26L62 28L56 30L56 26Z"
      fill="#FF8F00"
    />
    
    {/* Eye */}
    <Circle cx="52" cy="24" r="2.5" fill="#FFFFFF" />
    <Circle cx="53" cy="23" r="1.5" fill="#212121" />
    <Circle cx="53.5" cy="22.5" r="0.5" fill="#FFFFFF" />
    
    {/* Wing */}
    <Path
      d="M18 34C14 36 12 40 14 44C16 48 22 50 28 48C24 44 20 40 18 34Z"
      fill="#FFAB91"
    />
    <Path
      d="M16 38C14 40 14 44 18 46"
      stroke="#FF8A65"
      strokeWidth="1"
      opacity="0.5"
    />
    
    {/* Tail feathers */}
    <G>
      <Path
        d="M10 34C6 30 4 26 6 24C8 22 12 24 14 28"
        stroke="#FFAB91"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Path
        d="M10 38C4 36 2 32 4 28"
        stroke="#FF8A65"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </G>
    
    {/* Legs */}
    <G>
      <Path
        d="M22 50V58M22 58L18 60M22 58L26 60"
        stroke="#FF8F00"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M34 50V58M34 58L30 60M34 58L38 60"
        stroke="#FF8F00"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </G>
  </Svg>
);

export default ChickenIllustration;
