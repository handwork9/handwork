import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const FruitsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FF9800' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Apple */}
    <Path
      d="M18 20C12 22 10 32 12 40C14 48 20 52 26 50C28 50 30 48 32 48C34 48 36 50 38 50C44 52 50 48 52 40C54 32 52 22 46 20C42 18 38 22 32 22C26 22 22 18 18 20Z"
      fill="#E53935"
    />
    <Path
      d="M32 22C32 22 34 14 38 12"
      stroke="#5D4037"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M36 14C36 14 40 12 42 14C44 16 42 18 40 18"
      fill="#4CAF50"
    />
    {/* Highlight */}
    <Ellipse cx="22" cy="32" rx="4" ry="6" fill="#EF5350" opacity="0.5" />
    {/* Orange */}
    <Circle cx="50" cy="50" r="10" fill={color} />
    <Circle cx="50" cy="50" r="8" fill="#FFB74D" opacity="0.3" />
    {/* Banana */}
    <Path
      d="M8 50C8 50 6 42 10 38C14 34 20 36 22 40C24 44 20 52 16 54C12 56 8 54 8 50Z"
      fill="#FFEB3B"
    />
    <Path
      d="M8 50C8 50 10 48 12 48"
      stroke="#FBC02D"
      strokeWidth="1"
    />
  </Svg>
);

export default FruitsIllustration;
