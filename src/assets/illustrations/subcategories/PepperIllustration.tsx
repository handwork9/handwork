import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const PepperIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="pepperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF5722" />
        <Stop offset="100%" stopColor="#BF360C" />
      </LinearGradient>
    </Defs>
    
    {/* Pepper body */}
    <Path
      d="M24 16C18 20 14 32 16 44C18 54 26 60 32 60C38 60 46 54 48 44C50 32 46 20 40 16C36 14 28 14 24 16Z"
      fill="url(#pepperGrad)"
    />
    
    {/* Pepper curves */}
    <Path
      d="M24 24C22 32 24 44 28 52"
      stroke="#D84315"
      strokeWidth="1"
      opacity="0.4"
    />
    <Path
      d="M40 24C42 32 40 44 36 52"
      stroke="#FF8A65"
      strokeWidth="1"
      opacity="0.3"
    />
    
    {/* Highlight */}
    <Path
      d="M28 22C26 30 28 42 30 50"
      stroke="#FFAB91"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.4"
    />
    
    {/* Stem */}
    <Path
      d="M32 16V8C32 6 30 4 28 6C26 8 28 12 32 12"
      stroke="#4CAF50"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    <Circle cx="32" cy="6" r="3" fill="#66BB6A" />
    
    {/* Calyx (green top) */}
    <G>
      <Path
        d="M26 18C24 14 26 12 28 14C30 16 28 18 26 18Z"
        fill="#4CAF50"
      />
      <Path
        d="M38 18C40 14 38 12 36 14C34 16 36 18 38 18Z"
        fill="#4CAF50"
      />
      <Path
        d="M32 16C32 12 34 10 36 12"
        stroke="#66BB6A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M32 16C32 12 30 10 28 12"
        stroke="#66BB6A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </G>
  </Svg>
);

export default PepperIllustration;
