import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const TomatoIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="tomatoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF6B6B" />
        <Stop offset="100%" stopColor="#C62828" />
      </LinearGradient>
    </Defs>
    
    {/* Main tomato body */}
    <Circle cx="32" cy="36" r="22" fill="url(#tomatoGrad)" />
    
    {/* Tomato segments */}
    <Path d="M32 14C32 14 32 58 32 58" stroke="#B71C1C" strokeWidth="0.5" opacity="0.3" />
    <Path d="M10 36C10 36 54 36 54 36" stroke="#B71C1C" strokeWidth="0.5" opacity="0.3" />
    
    {/* Highlight */}
    <Ellipse cx="24" cy="28" rx="6" ry="8" fill="#FF8A80" opacity="0.5" />
    <Circle cx="22" cy="26" r="3" fill="#FFCDD2" opacity="0.6" />
    
    {/* Stem */}
    <Path
      d="M32 14V8"
      stroke="#5D4037"
      strokeWidth="3"
      strokeLinecap="round"
    />
    
    {/* Leaves */}
    <G>
      <Path
        d="M32 14C28 10 24 10 24 14C24 16 28 16 32 14Z"
        fill="#4CAF50"
      />
      <Path
        d="M32 14C36 10 40 10 40 14C40 16 36 16 32 14Z"
        fill="#4CAF50"
      />
      <Path
        d="M32 12C30 6 32 4 34 6C36 8 34 12 32 12Z"
        fill="#66BB6A"
      />
      <Path
        d="M28 16C24 14 22 16 24 18C26 20 30 18 28 16Z"
        fill="#81C784"
      />
      <Path
        d="M36 16C40 14 42 16 40 18C38 20 34 18 36 16Z"
        fill="#81C784"
      />
    </G>
  </Svg>
);

export default TomatoIllustration;
