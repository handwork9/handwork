import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const BillsHeroIllustration: React.FC<IllustrationProps> = ({
  width = 120,
  height = 120,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 120 120" fill="none">
    {/* Background Circle */}
    <Circle cx="60" cy="60" r="50" fill={color} opacity="0.1" />
    <Circle cx="60" cy="60" r="38" fill={color} opacity="0.08" />
    
    {/* Receipt/Bill */}
    <Rect x="35" y="25" width="50" height="70" rx="4" fill="#FFFFFF" />
    <Rect x="35" y="25" width="50" height="70" rx="4" stroke={color} strokeWidth="2" fill="none" />
    
    {/* Receipt Header */}
    <Rect x="40" y="30" width="40" height="6" rx="2" fill={color} opacity="0.2" />
    
    {/* Receipt Lines */}
    <G opacity="0.4">
      <Rect x="40" y="42" width="30" height="3" rx="1" fill={color} />
      <Rect x="40" y="50" width="35" height="3" rx="1" fill={color} />
      <Rect x="40" y="58" width="25" height="3" rx="1" fill={color} />
      <Rect x="40" y="66" width="32" height="3" rx="1" fill={color} />
    </G>
    
    {/* Total Amount */}
    <Rect x="40" y="76" width="40" height="8" rx="2" fill={color} opacity="0.15" />
    <Rect x="42" y="78" width="20" height="4" rx="1" fill={color} />
    
    {/* Checkmark Badge */}
    <Circle cx="80" cy="35" r="12" fill={color} />
    <Path 
      d="M75 35L78 38L85 31" 
      stroke="#FFFFFF" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    
    {/* Floating Icons */}
    {/* Phone */}
    <G transform="translate(18, 45)">
      <Rect width="14" height="22" rx="2" fill={color} opacity="0.2" />
      <Rect x="2" y="3" width="10" height="14" rx="1" fill="#FFFFFF" />
      <Rect x="5" y="18" width="4" height="2" rx="1" fill="#FFFFFF" opacity="0.7" />
    </G>
    
    {/* Lightning */}
    <G transform="translate(88, 55)">
      <Path 
        d="M8 0L2 10H7L5 18L14 7H9L12 0H8Z" 
        fill={color}
        opacity="0.3"
      />
    </G>
    
    {/* Wi-Fi */}
    <G transform="translate(22, 78)">
      <Circle cx="6" cy="10" r="2" fill={color} opacity="0.4" />
      <Path d="M6 7C8.5 7 10 8 11 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
      <Path d="M6 7C3.5 7 2 8 1 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
    </G>
    
    {/* Decorative Dots */}
    <Circle cx="95" cy="85" r="3" fill={color} opacity="0.2" />
    <Circle cx="100" cy="75" r="2" fill={color} opacity="0.15" />
    <Circle cx="25" cy="35" r="2" fill={color} opacity="0.2" />
  </Svg>
);

export default BillsHeroIllustration;
