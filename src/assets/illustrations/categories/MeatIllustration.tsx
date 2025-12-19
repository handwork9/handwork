import React from 'react';
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const MeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#D32F2F' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Steak */}
    <Path
      d="M12 24C8 28 8 40 14 46C20 52 36 54 44 48C52 42 54 30 48 22C42 14 24 12 16 16C12 18 12 20 12 24Z"
      fill={color}
    />
    <Path
      d="M18 28C16 32 18 40 24 44C30 48 38 46 42 40"
      stroke="#FFCDD2"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Fat marbling */}
    <Ellipse cx="26" cy="34" rx="3" ry="2" fill="#FFEBEE" opacity="0.6" />
    <Ellipse cx="34" cy="30" rx="2" ry="3" fill="#FFEBEE" opacity="0.6" />
    <Ellipse cx="30" cy="40" rx="2.5" ry="1.5" fill="#FFEBEE" opacity="0.6" />
    {/* Bone */}
    <Path
      d="M48 14C52 10 58 12 58 18C58 22 54 24 54 28C54 32 58 34 58 38C58 44 52 46 48 42"
      stroke="#EFEBE9"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <Circle cx="58" cy="18" r="4" fill="#EFEBE9" />
    <Circle cx="58" cy="38" r="4" fill="#EFEBE9" />
  </Svg>
);

export default MeatIllustration;
