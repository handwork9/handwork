import React from 'react';
import Svg, { Path, Ellipse, G, Circle } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const HerbsSpicesIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#66BB6A' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Herb pot */}
    <Path
      d="M16 40H48L44 58H20L16 40Z"
      fill="#8D6E63"
    />
    <Path
      d="M14 36H50V40H14V36Z"
      fill="#A1887F"
    />
    {/* Basil leaves */}
    <G>
      <Path
        d="M32 36V20"
        stroke="#33691E"
        strokeWidth="2"
      />
      <Path
        d="M32 20C28 16 24 18 24 22C24 26 28 28 32 26"
        fill={color}
      />
      <Path
        d="M32 20C36 16 40 18 40 22C40 26 36 28 32 26"
        fill={color}
      />
      <Path
        d="M32 26C28 22 22 24 22 30C22 36 28 38 32 34"
        fill="#81C784"
      />
      <Path
        d="M32 26C36 22 42 24 42 30C42 36 36 38 32 34"
        fill="#81C784"
      />
    </G>
    {/* Chili peppers */}
    <Path
      d="M10 24C10 24 8 20 10 16C12 12 14 14 14 18C14 22 12 26 10 24Z"
      fill="#E53935"
    />
    <Path
      d="M10 16C10 14 12 12 12 12"
      stroke="#33691E"
      strokeWidth="1"
    />
    <Path
      d="M54 28C54 28 52 24 54 20C56 16 58 18 58 22C58 26 56 30 54 28Z"
      fill="#FF5722"
    />
    <Path
      d="M54 20C54 18 56 16 56 16"
      stroke="#33691E"
      strokeWidth="1"
    />
    {/* Garlic */}
    <Ellipse cx="50" cy="48" rx="6" ry="7" fill="#F5F5F5" />
    <Path
      d="M50 41V38"
      stroke="#BDBDBD"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path d="M47 48C47 45 50 44 50 48" stroke="#E0E0E0" strokeWidth="1" />
    <Path d="M53 48C53 45 50 44 50 48" stroke="#E0E0E0" strokeWidth="1" />
  </Svg>
);

export default HerbsSpicesIllustration;
