import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const AirtimeIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#34C759'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    {/* Phone Body */}
    <Rect x="12" y="4" width="24" height="40" rx="4" fill={color} />
    <Rect x="14" y="8" width="20" height="28" rx="2" fill="#FFFFFF" />
    
    {/* Signal Bars */}
    <G transform="translate(18, 14)">
      <Rect x="0" y="12" width="3" height="6" rx="1" fill={color} opacity="0.4" />
      <Rect x="5" y="8" width="3" height="10" rx="1" fill={color} opacity="0.6" />
      <Rect x="10" y="4" width="3" height="14" rx="1" fill={color} opacity="0.8" />
      <Rect x="15" y="0" width="3" height="18" rx="1" fill={color} />
    </G>
    
    {/* Phone Notch */}
    <Rect x="20" y="5" width="8" height="2" rx="1" fill="#FFFFFF" opacity="0.5" />
    
    {/* Home Indicator */}
    <Rect x="20" y="40" width="8" height="2" rx="1" fill="#FFFFFF" opacity="0.5" />
    
    {/* Plus Symbol */}
    <Circle cx="36" cy="12" r="6" fill="#FF9500" />
    <Path d="M36 9V15M33 12H39" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default AirtimeIllustration;
