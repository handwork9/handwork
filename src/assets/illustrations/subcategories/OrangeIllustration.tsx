import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const OrangeIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="100%" stopColor="#EF6C00" />
      </LinearGradient>
    </Defs>
    
    {/* Orange body */}
    <Circle cx="32" cy="36" r="22" fill="url(#orangeGrad)" />
    
    {/* Texture dots */}
    <G opacity="0.3">
      <Circle cx="22" cy="30" r="1" fill="#E65100" />
      <Circle cx="26" cy="36" r="1" fill="#E65100" />
      <Circle cx="30" cy="28" r="1" fill="#E65100" />
      <Circle cx="38" cy="32" r="1" fill="#E65100" />
      <Circle cx="42" cy="38" r="1" fill="#E65100" />
      <Circle cx="34" cy="44" r="1" fill="#E65100" />
      <Circle cx="28" cy="46" r="1" fill="#E65100" />
      <Circle cx="40" cy="46" r="1" fill="#E65100" />
      <Circle cx="24" cy="40" r="1" fill="#E65100" />
    </G>
    
    {/* Highlight */}
    <Ellipse cx="24" cy="28" rx="6" ry="8" fill="#FFE0B2" opacity="0.5" />
    <Circle cx="22" cy="26" r="3" fill="#FFF3E0" opacity="0.6" />
    
    {/* Stem indent */}
    <Circle cx="32" cy="14" r="3" fill="#BF360C" />
    
    {/* Leaf */}
    <Path
      d="M32 14C36 10 42 8 46 10C46 14 42 18 36 18C32 18 32 16 32 14Z"
      fill="#4CAF50"
    />
    <Path d="M36 10C40 14 42 16 36 18" stroke="#2E7D32" strokeWidth="0.5" />
    
    {/* Stem */}
    <Path
      d="M32 14V10"
      stroke="#5D4037"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export default OrangeIllustration;
