import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CarrotIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="carrotBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A50" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
    </Defs>
    
    {/* Main carrot body */}
    <Path
      d="M26 12C26 12 22 28 24 44C26 56 32 60 32 60C32 60 38 56 40 44C42 28 38 12 38 12C38 12 32 8 26 12Z"
      fill="url(#carrotBody)"
    />
    
    {/* Carrot lines */}
    <Path d="M28 20C28 20 32 20 36 20" stroke="#FFAB91" strokeWidth="0.8" opacity="0.6" />
    <Path d="M27 28C27 28 32 28 37 28" stroke="#FFAB91" strokeWidth="0.8" opacity="0.6" />
    <Path d="M28 36C28 36 32 36 36 36" stroke="#FFAB91" strokeWidth="0.8" opacity="0.6" />
    <Path d="M29 44C29 44 32 44 35 44" stroke="#FFAB91" strokeWidth="0.8" opacity="0.6" />
    
    {/* Green tops */}
    <G>
      <Path
        d="M32 12C32 12 32 4 32 4"
        stroke="#4CAF50"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M28 14C28 14 24 6 22 4"
        stroke="#66BB6A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M36 14C36 14 40 6 42 4"
        stroke="#66BB6A"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M26 12C26 12 20 8 18 8"
        stroke="#81C784"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M38 12C38 12 44 8 46 8"
        stroke="#81C784"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </G>
    
    {/* Highlight */}
    <Ellipse cx="30" cy="30" rx="3" ry="12" fill="#FFCC80" opacity="0.3" />
  </Svg>
);

export default CarrotIllustration;
