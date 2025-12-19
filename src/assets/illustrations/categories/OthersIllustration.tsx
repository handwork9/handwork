import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect, Polygon } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const OthersIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#78909C' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Shopping basket */}
    <Path
      d="M8 28H56L52 54H12L8 28Z"
      fill={color}
    />
    <Path
      d="M8 28H56V32H8V28Z"
      fill="#90A4AE"
    />
    {/* Basket handle */}
    <Path
      d="M20 28C20 28 20 16 32 16C44 16 44 28 44 28"
      stroke="#546E7A"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Basket weave pattern */}
    <G opacity="0.3">
      <Path d="M12 36H52" stroke="#455A64" strokeWidth="2" />
      <Path d="M14 44H50" stroke="#455A64" strokeWidth="2" />
      <Path d="M20 32V52" stroke="#455A64" strokeWidth="2" />
      <Path d="M32 32V52" stroke="#455A64" strokeWidth="2" />
      <Path d="M44 32V52" stroke="#455A64" strokeWidth="2" />
    </G>
    {/* Items peeking out */}
    {/* Carrot */}
    <Path
      d="M18 28V20"
      stroke="#FF6B35"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Path
      d="M16 18L18 14L20 18"
      stroke="#4CAF50"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Apple */}
    <Circle cx="28" cy="24" r="5" fill="#E53935" />
    <Path d="M28 19V17" stroke="#5D4037" strokeWidth="1" />
    <Ellipse cx="30" cy="17" rx="2" ry="1" fill="#4CAF50" />
    {/* Bread */}
    <Ellipse cx="40" cy="24" rx="6" ry="4" fill="#FFCC80" />
    <Path d="M36 22C38 20 42 20 44 22" stroke="#FFB74D" strokeWidth="1" />
    {/* Leaf */}
    <Path
      d="M50 24C50 24 48 18 52 16C56 18 54 24 54 24C54 24 52 26 50 24Z"
      fill="#66BB6A"
    />
    <Path d="M52 16V24" stroke="#43A047" strokeWidth="1" />
  </Svg>
);

export default OthersIllustration;
