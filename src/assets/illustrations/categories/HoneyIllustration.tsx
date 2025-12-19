import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Polygon } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const HoneyIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FFC107' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Honey jar */}
    <Path
      d="M20 24H44V26L46 30V54C46 56 44 58 42 58H22C20 58 18 56 18 54V30L20 26V24Z"
      fill={color}
    />
    <Path
      d="M20 24H44V28H20V24Z"
      fill="#FFD54F"
    />
    {/* Jar lid */}
    <Path
      d="M18 20H46V24H18V20Z"
      fill="#8D6E63"
    />
    <Path
      d="M20 16H44V20H20V16Z"
      fill="#A1887F"
    />
    {/* Honey drip */}
    <Path
      d="M36 28V36C36 38 38 40 38 42C38 44 36 46 34 46C32 46 30 44 30 42"
      fill="#FF8F00"
    />
    {/* Honeycomb pattern */}
    <G opacity="0.4">
      <Polygon points="28,38 32,36 36,38 36,42 32,44 28,42" fill="#FFB300" />
      <Polygon points="28,46 32,44 36,46 36,50 32,52 28,50" fill="#FFB300" />
    </G>
    {/* Bee */}
    <G>
      {/* Body */}
      <Ellipse cx="52" cy="16" rx="6" ry="4" fill="#FFC107" />
      <Path d="M48 14V18" stroke="#212121" strokeWidth="1.5" />
      <Path d="M52 14V18" stroke="#212121" strokeWidth="1.5" />
      <Path d="M56 14V18" stroke="#212121" strokeWidth="1.5" />
      {/* Head */}
      <Circle cx="58" cy="16" r="3" fill="#212121" />
      {/* Wings */}
      <Ellipse cx="50" cy="12" rx="4" ry="2" fill="#E3F2FD" opacity="0.8" />
      <Ellipse cx="54" cy="12" rx="3" ry="1.5" fill="#E3F2FD" opacity="0.8" />
      {/* Stinger */}
      <Path d="M46 16L44 16" stroke="#212121" strokeWidth="1" />
    </G>
    {/* Second bee */}
    <G>
      <Ellipse cx="10" cy="32" rx="5" ry="3" fill="#FFC107" />
      <Path d="M7 30V34" stroke="#212121" strokeWidth="1" />
      <Path d="M10 30V34" stroke="#212121" strokeWidth="1" />
      <Path d="M13 30V34" stroke="#212121" strokeWidth="1" />
      <Circle cx="15" cy="32" r="2.5" fill="#212121" />
      <Ellipse cx="9" cy="28" rx="3" ry="1.5" fill="#E3F2FD" opacity="0.8" />
    </G>
  </Svg>
);

export default HoneyIllustration;
