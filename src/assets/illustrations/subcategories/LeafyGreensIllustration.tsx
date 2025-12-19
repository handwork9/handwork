import React from 'react';
import Svg, { Path, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const LeafyGreensIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
      <LinearGradient id="leafGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A5D6A7" />
        <Stop offset="100%" stopColor="#388E3C" />
      </LinearGradient>
      <LinearGradient id="leafGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#1B5E20" />
      </LinearGradient>
    </Defs>
    
    {/* Back left leaf - natural curved shape */}
    <Path
      d="M14 54C14 54 10 40 16 28C22 16 30 14 30 14C30 14 24 18 20 28C16 38 18 48 14 54Z"
      fill="url(#leafGrad2)"
    />
    {/* Left leaf vein */}
    <Path
      d="M29 16C25 22 20 30 16 44"
      stroke="#1B5E20"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.5"
    />
    
    {/* Back right leaf */}
    <Path
      d="M50 54C50 54 54 40 48 28C42 16 34 14 34 14C34 14 40 18 44 28C48 38 46 48 50 54Z"
      fill="url(#leafGrad2)"
    />
    {/* Right leaf vein */}
    <Path
      d="M35 16C39 22 44 30 48 44"
      stroke="#1B5E20"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.5"
    />
    
    {/* Center main leaf - larger, more prominent */}
    <Path
      d="M32 58C32 58 18 46 18 30C18 14 32 6 32 6C32 6 46 14 46 30C46 46 32 58 32 58Z"
      fill="url(#leafGrad1)"
    />
    
    {/* Main leaf center vein */}
    <Path
      d="M32 10V54"
      stroke="#1B5E20"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
    
    {/* Main leaf side veins - curved naturally */}
    <G opacity="0.4" stroke="#1B5E20" strokeWidth="1" strokeLinecap="round">
      <Path d="M32 18Q26 22 22 26" />
      <Path d="M32 18Q38 22 42 26" />
      <Path d="M32 28Q24 34 20 38" />
      <Path d="M32 28Q40 34 44 38" />
      <Path d="M32 40Q26 46 24 50" />
      <Path d="M32 40Q38 46 40 50" />
    </G>
    
    {/* Leaf highlights for depth */}
    <Path
      d="M26 20Q22 30 24 42"
      stroke="#C8E6C9"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
    
    {/* Small accent leaf on left */}
    <Path
      d="M8 48C8 48 6 40 10 34C14 28 20 28 20 28C20 28 16 32 14 38C12 44 10 46 8 48Z"
      fill="url(#leafGrad3)"
    />
    
    {/* Small accent leaf on right */}
    <Path
      d="M56 48C56 48 58 40 54 34C50 28 44 28 44 28C44 28 48 32 50 38C52 44 54 46 56 48Z"
      fill="url(#leafGrad3)"
    />
  </Svg>
);

export default LeafyGreensIllustration;
