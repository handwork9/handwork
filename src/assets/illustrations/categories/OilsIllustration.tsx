import React from 'react';
import Svg, { Path, Ellipse, Rect, Circle } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const OilsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FFCA28' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Oil bottle */}
    <Path
      d="M22 18H34V22L36 26V54C36 56 34 58 32 58H24C22 58 20 56 20 54V26L22 22V18Z"
      fill="#C8E6C9"
    />
    {/* Oil inside */}
    <Path
      d="M22 30H34V54C34 55 33 56 32 56H24C23 56 22 55 22 54V30Z"
      fill={color}
      opacity="0.8"
    />
    {/* Bottle cap */}
    <Rect x="24" y="12" width="8" height="6" rx="1" fill="#5D4037" />
    <Rect x="22" y="16" width="12" height="2" fill="#8D6E63" />
    {/* Olive */}
    <Ellipse cx="28" cy="42" rx="4" ry="5" fill="#558B2F" />
    <Circle cx="28" cy="41" r="1.5" fill="#33691E" />
    {/* Oil drop */}
    <Path
      d="M48 20C48 20 44 28 44 34C44 40 48 44 52 44C56 44 60 40 60 34C60 28 56 20 52 20L48 20Z"
      fill={color}
    />
    <Ellipse cx="50" cy="32" rx="3" ry="5" fill="#FFD54F" opacity="0.5" />
    {/* Small bottles */}
    <Path
      d="M8 36H16V38L18 40V54C18 55 17 56 16 56H8C7 56 6 55 6 54V40L8 38V36Z"
      fill="#FFECB3"
    />
    <Path
      d="M8 42H16V54C16 55 15 55 14 55H10C9 55 8 55 8 54V42Z"
      fill="#FFA000"
      opacity="0.7"
    />
    <Rect x="10" y="32" width="4" height="4" rx="1" fill="#6D4C41" />
  </Svg>
);

export default OilsIllustration;
