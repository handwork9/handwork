import React from 'react';
import Svg, { Path, Ellipse, Rect, Circle, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const BeveragesIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#4CAF50' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Juice glass */}
    <Path
      d="M10 20H26L24 54H12L10 20Z"
      fill="#FFECB3"
      opacity="0.6"
    />
    <Path
      d="M10 20H26L24 54H12L10 20Z"
      stroke="#FFA000"
      strokeWidth="2"
    />
    {/* Orange juice */}
    <Path
      d="M11 26H25L23 52H13L11 26Z"
      fill="#FF9800"
    />
    {/* Orange slice */}
    <Circle cx="18" cy="38" r="6" fill="#FFB74D" />
    <G>
      <Path d="M18 32V44" stroke="#FFF3E0" strokeWidth="1" />
      <Path d="M12 38H24" stroke="#FFF3E0" strokeWidth="1" />
      <Path d="M14 34L22 42" stroke="#FFF3E0" strokeWidth="1" />
      <Path d="M22 34L14 42" stroke="#FFF3E0" strokeWidth="1" />
    </G>
    {/* Smoothie cup */}
    <Path
      d="M34 16H50L48 56H36L34 16Z"
      fill="#E8F5E9"
    />
    <Path
      d="M35 22H49L47 54H37L35 22Z"
      fill={color}
    />
    {/* Straw */}
    <Rect x="40" y="8" width="3" height="20" fill="#E91E63" />
    <Path d="M40 8H43L44 12H39L40 8Z" fill="#E91E63" />
    {/* Lid */}
    <Ellipse cx="42" cy="16" rx="9" ry="2" fill="#A5D6A7" />
    {/* Bubbles */}
    <Circle cx="40" cy="40" r="2" fill="#81C784" />
    <Circle cx="44" cy="34" r="1.5" fill="#81C784" />
    <Circle cx="38" cy="46" r="1" fill="#81C784" />
    {/* Tea cup */}
    <Path
      d="M52 32H62C62 32 64 36 62 40H52V32Z"
      stroke="#8D6E63"
      strokeWidth="2"
      fill="none"
    />
    <Ellipse cx="56" cy="44" rx="8" ry="4" fill="#8D6E63" />
    <Ellipse cx="56" cy="32" rx="6" ry="2" fill="#6D4C41" />
    <Path
      d="M52 34H60V44C60 46 58 48 56 48C54 48 52 46 52 44V34Z"
      fill="#FFF8E1"
    />
    <Ellipse cx="56" cy="38" rx="4" ry="6" fill="#FFCC80" opacity="0.5" />
    {/* Steam */}
    <Path d="M54 28C54 26 56 26 56 28" stroke="#BDBDBD" strokeWidth="1" />
    <Path d="M58 26C58 24 60 24 60 26" stroke="#BDBDBD" strokeWidth="1" />
  </Svg>
);

export default BeveragesIllustration;
