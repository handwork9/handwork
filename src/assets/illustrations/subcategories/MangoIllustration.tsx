import React from 'react';
import Svg, { Path, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const MangoIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="mangoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFEB3B" />
        <Stop offset="50%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#F44336" />
      </LinearGradient>
    </Defs>
    
    {/* Mango body */}
    <Path
      d="M16 32C16 20 24 10 36 10C48 10 54 24 52 38C50 52 40 58 28 56C16 54 16 44 16 32Z"
      fill="url(#mangoGrad)"
    />
    
    {/* Highlight */}
    <Ellipse cx="28" cy="28" rx="8" ry="12" fill="#FFF59D" opacity="0.4" />
    <Ellipse cx="24" cy="24" rx="4" ry="6" fill="#FFEE58" opacity="0.5" />
    
    {/* Stem */}
    <Path
      d="M36 10C36 10 38 6 40 4"
      stroke="#5D4037"
      strokeWidth="2"
      strokeLinecap="round"
    />
    
    {/* Leaf */}
    <Path
      d="M40 6C44 4 48 6 48 10C48 14 44 16 40 14C36 12 36 8 40 6Z"
      fill="#4CAF50"
    />
    <Path d="M40 6C44 10 44 14 40 14" stroke="#2E7D32" strokeWidth="0.5" />
  </Svg>
);

export default MangoIllustration;
