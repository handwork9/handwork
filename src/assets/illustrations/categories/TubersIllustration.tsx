import React from 'react';
import Svg, { Path, Ellipse, G, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const TubersIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#8D6E63' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Potato */}
    <Path
      d="M10 32C10 24 16 20 24 20C32 20 38 24 38 32C38 40 32 46 24 46C16 46 10 40 10 32Z"
      fill={color}
    />
    <Ellipse cx="18" cy="28" rx="2" ry="1" fill="#6D4C41" />
    <Ellipse cx="28" cy="32" rx="1.5" ry="1" fill="#6D4C41" />
    <Ellipse cx="22" cy="38" rx="2" ry="1" fill="#6D4C41" />
    <Ellipse cx="16" cy="34" rx="1" ry="0.5" fill="#6D4C41" />
    {/* Sweet potato */}
    <Path
      d="M36 42C36 36 42 32 50 34C58 36 60 44 58 50C56 56 48 58 42 54C38 52 36 48 36 42Z"
      fill="#E65100"
    />
    <Ellipse cx="46" cy="44" rx="4" ry="6" fill="#EF6C00" opacity="0.4" />
    {/* Cassava */}
    <Path
      d="M44 8C44 8 42 14 44 20C46 26 50 28 52 26C54 24 54 18 52 12C50 6 46 6 44 8Z"
      fill="#D7CCC8"
    />
    <Path d="M48 10V24" stroke="#BCAAA4" strokeWidth="1" />
    {/* Yam */}
    <Path
      d="M56 14C56 14 52 18 54 24C56 30 62 32 62 28C62 24 60 14 56 14Z"
      fill="#5D4037"
    />
    {/* Ginger */}
    <G>
      <Ellipse cx="14" cy="54" rx="6" ry="4" fill="#FFCC80" />
      <Ellipse cx="8" cy="52" rx="4" ry="3" fill="#FFB74D" />
      <Ellipse cx="18" cy="58" rx="3" ry="4" fill="#FFCC80" transform="rotate(-30 18 58)" />
      <Path d="M10 50C10 50 12 48 14 50" stroke="#FF8F00" strokeWidth="1" />
    </G>
  </Svg>
);

export default TubersIllustration;
