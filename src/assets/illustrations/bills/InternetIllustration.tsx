import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const InternetIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#007AFF'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    {/* Router Body */}
    <Rect x="8" y="24" width="32" height="14" rx="3" fill={color} opacity="0.15" />
    <Rect x="8" y="24" width="32" height="14" rx="3" stroke={color} strokeWidth="2" fill="none" />
    
    {/* Router Details */}
    <Circle cx="14" cy="31" r="2" fill={color} />
    <Circle cx="20" cy="31" r="2" fill={color} opacity="0.6" />
    <Rect x="28" y="29" width="8" height="4" rx="1" fill={color} opacity="0.3" />
    
    {/* Antenna Left */}
    <Path d="M14 24V18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="14" cy="16" r="2" fill={color} />
    
    {/* Antenna Right */}
    <Path d="M34 24V18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="34" cy="16" r="2" fill={color} />
    
    {/* Wi-Fi Signal */}
    <G transform="translate(17, 4)">
      <Circle cx="7" cy="12" r="2" fill={color} />
      <Path 
        d="M7 9C9.5 9 11 10 12 11" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
      />
      <Path 
        d="M7 9C4.5 9 3 10 2 11" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
      />
      <Path 
        d="M7 5C11 5 13.5 7 15 9" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
        opacity="0.7"
      />
      <Path 
        d="M7 5C3 5 0.5 7 -1 9" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
        opacity="0.7"
      />
      <Path 
        d="M7 1C12.5 1 16 3.5 18 6" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
        opacity="0.4"
      />
      <Path 
        d="M7 1C1.5 1 -2 3.5 -4 6" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        fill="none"
        opacity="0.4"
      />
    </G>
    
    {/* Ethernet Ports */}
    <Rect x="12" y="34" width="4" height="3" rx="0.5" fill={color} opacity="0.4" />
    <Rect x="18" y="34" width="4" height="3" rx="0.5" fill={color} opacity="0.4" />
    <Rect x="24" y="34" width="4" height="3" rx="0.5" fill={color} opacity="0.4" />
  </Svg>
);

export default InternetIllustration;
