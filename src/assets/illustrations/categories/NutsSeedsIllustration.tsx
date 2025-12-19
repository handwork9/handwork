import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const NutsSeedsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#8D6E63' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Peanut */}
    <G>
      <Ellipse cx="20" cy="24" rx="8" ry="6" fill={color} />
      <Ellipse cx="20" cy="36" rx="8" ry="6" fill={color} />
      <Ellipse cx="20" cy="30" rx="4" ry="3" fill="#A1887F" />
      <Path d="M14 24C14 24 12 30 14 36" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
      <Path d="M26 24C26 24 28 30 26 36" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
    </G>
    {/* Almond */}
    <Path
      d="M42 18C38 14 36 20 36 26C36 32 40 38 44 38C48 38 50 32 50 26C50 20 48 14 44 18L42 18Z"
      fill="#D7A86E"
    />
    <Ellipse cx="44" cy="28" rx="3" ry="6" fill="#E5C59E" opacity="0.4" />
    {/* Seeds */}
    <Ellipse cx="12" cy="52" rx="4" ry="2" fill="#5D4037" transform="rotate(-20 12 52)" />
    <Ellipse cx="22" cy="54" rx="4" ry="2" fill="#4E342E" transform="rotate(15 22 54)" />
    <Ellipse cx="32" cy="52" rx="4" ry="2" fill="#5D4037" transform="rotate(-10 32 52)" />
    {/* Sunflower seeds */}
    <Ellipse cx="44" cy="52" rx="3" ry="5" fill="#37474F" transform="rotate(10 44 52)" />
    <Path d="M43 49L45 55" stroke="#ECEFF1" strokeWidth="0.5" />
    <Ellipse cx="52" cy="50" rx="3" ry="5" fill="#455A64" transform="rotate(-15 52 50)" />
    <Path d="M51 47L53 53" stroke="#ECEFF1" strokeWidth="0.5" />
    {/* Walnut */}
    <Circle cx="54" cy="28" r="8" fill="#6D4C41" />
    <Path
      d="M48 28C50 24 54 24 56 28C58 24 54 32 54 32C54 32 50 32 48 28Z"
      fill="#8D6E63"
    />
    <Path d="M54 20V36" stroke="#5D4037" strokeWidth="1" />
  </Svg>
);

export default NutsSeedsIllustration;
