import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const DataIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#5856D6'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    {/* Globe */}
    <Circle cx="24" cy="24" r="16" fill={color} opacity="0.15" />
    <Circle cx="24" cy="24" r="12" stroke={color} strokeWidth="2" fill="none" />
    
    {/* Horizontal Lines */}
    <Path d="M12 24H36" stroke={color} strokeWidth="1.5" />
    <Path d="M14 18H34" stroke={color} strokeWidth="1" opacity="0.7" />
    <Path d="M14 30H34" stroke={color} strokeWidth="1" opacity="0.7" />
    
    {/* Vertical Ellipse */}
    <Path 
      d="M24 12C28 12 31 17.4 31 24C31 30.6 28 36 24 36C20 36 17 30.6 17 24C17 17.4 20 12 24 12Z" 
      stroke={color} 
      strokeWidth="1.5" 
      fill="none"
    />
    
    {/* Wi-Fi Symbol */}
    <G transform="translate(30, 6)">
      <Circle cx="6" cy="10" r="2" fill={color} />
      <Path 
        d="M6 7C8 7 9.5 8 10 9" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none"
      />
      <Path 
        d="M6 7C4 7 2.5 8 2 9" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none"
      />
      <Path 
        d="M6 4C9.5 4 12 5.5 13 7" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none"
        opacity="0.7"
      />
      <Path 
        d="M6 4C2.5 4 0 5.5 -1 7" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none"
        opacity="0.7"
      />
    </G>
    
    {/* Data Arrow Up */}
    <G transform="translate(6, 32)">
      <Path d="M4 8L4 2L1 5M4 2L7 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>
    
    {/* Data Arrow Down */}
    <G transform="translate(6, 32)">
      <Path d="M12 2L12 8L9 5M12 8L15 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  </Svg>
);

export default DataIllustration;
