import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const ElectricityIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#FF9500'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    {/* Background Circle */}
    <Circle cx="24" cy="24" r="18" fill={color} opacity="0.12" />
    
    {/* Light Bulb Body */}
    <Path 
      d="M24 8C18.5 8 14 12.5 14 18C14 22 16.5 25.5 20 27V32H28V27C31.5 25.5 34 22 34 18C34 12.5 29.5 8 24 8Z" 
      fill={color}
      opacity="0.3"
    />
    <Path 
      d="M24 8C18.5 8 14 12.5 14 18C14 22 16.5 25.5 20 27V32H28V27C31.5 25.5 34 22 34 18C34 12.5 29.5 8 24 8Z" 
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    
    {/* Bulb Base */}
    <Rect x="20" y="32" width="8" height="3" fill={color} />
    <Rect x="21" y="35" width="6" height="2" rx="1" fill={color} opacity="0.7" />
    <Rect x="22" y="37" width="4" height="3" rx="2" fill={color} opacity="0.5" />
    
    {/* Lightning Bolt */}
    <Path 
      d="M26 12L21 20H24L22 26L28 17H25L26 12Z" 
      fill="#FFFFFF"
      stroke={color}
      strokeWidth="0.5"
    />
    
    {/* Glow Lines */}
    <G opacity="0.5">
      <Path d="M10 18H6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M42 18H38" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M11 10L8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M40 7L37 10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </G>
  </Svg>
);

export default ElectricityIllustration;
