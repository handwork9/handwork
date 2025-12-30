import React from 'react';
import Svg, { Path, Rect, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const TvIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#FF3B30'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    {/* TV Body */}
    <Rect x="6" y="10" width="36" height="24" rx="3" fill={color} opacity="0.15" />
    <Rect x="6" y="10" width="36" height="24" rx="3" stroke={color} strokeWidth="2" fill="none" />
    
    {/* Screen */}
    <Rect x="10" y="14" width="28" height="16" rx="2" fill={color} opacity="0.2" />
    
    {/* Play Button */}
    <Path 
      d="M22 18L28 22L22 26V18Z" 
      fill={color}
    />
    
    {/* Stand */}
    <Path 
      d="M20 34V38H28V34" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="none"
    />
    <Rect x="16" y="38" width="16" height="2" rx="1" fill={color} />
    
    {/* Signal Indicator */}
    <G transform="translate(32, 4)">
      <Path 
        d="M4 8L4 6" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <Path 
        d="M1 6C2.5 4.5 5.5 4.5 7 6" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="none"
      />
      <Path 
        d="M-1 4C2 1.5 6 1.5 9 4" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </G>
    
    {/* Antenna (Retro Touch) */}
    <Path 
      d="M18 10L14 4M30 10L34 4" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
      opacity="0.5"
    />
  </Svg>
);

export default TvIllustration;
