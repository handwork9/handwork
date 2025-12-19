import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CheeseIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cheeseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFEE58" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
      <LinearGradient id="cheeseSide" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
    </Defs>
    
    {/* Cheese wedge - top */}
    <Polygon
      points="8,44 56,44 56,24 32,8"
      fill="url(#cheeseGrad)"
    />
    
    {/* Cheese wedge - front face */}
    <Polygon
      points="8,44 56,44 56,52 8,52"
      fill="url(#cheeseSide)"
    />
    
    {/* Cheese wedge - side */}
    <Polygon
      points="56,24 56,52 60,48 60,28"
      fill="#FF8F00"
    />
    
    {/* Holes on top */}
    <G>
      <Ellipse cx="24" cy="32" rx="5" ry="3" fill="#FFF59D" />
      <Ellipse cx="42" cy="28" rx="4" ry="2.5" fill="#FFF59D" />
      <Ellipse cx="36" cy="38" rx="6" ry="3.5" fill="#FFF59D" />
      <Ellipse cx="18" cy="40" rx="3" ry="2" fill="#FFF59D" />
      <Ellipse cx="50" cy="36" rx="3.5" ry="2" fill="#FFF59D" />
    </G>
    
    {/* Holes on front */}
    <G>
      <Ellipse cx="20" cy="48" rx="3" ry="2" fill="#FFCC80" />
      <Ellipse cx="36" cy="48" rx="4" ry="2.5" fill="#FFCC80" />
      <Ellipse cx="50" cy="48" rx="2.5" ry="1.5" fill="#FFCC80" />
    </G>
    
    {/* Highlight on top edge */}
    <Path
      d="M32 8L8 44"
      stroke="#FFF9C4"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
    
    {/* Small cheese pieces */}
    <G>
      <Circle cx="10" cy="58" r="4" fill="#FFD54F" />
      <Circle cx="8" cy="56" r="1" fill="#FFF59D" />
    </G>
  </Svg>
);

export default CheeseIllustration;
