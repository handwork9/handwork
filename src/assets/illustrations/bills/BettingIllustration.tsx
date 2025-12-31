import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface Props {
  width?: number;
  height?: number;
  color?: string;
}

export const BettingIllustration: React.FC<Props> = ({ 
  width = 64, 
  height = 64, 
  color = '#FF2D55' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Ticket/Slip */}
      <Rect x="12" y="8" width="40" height="48" rx="4" fill={color} opacity={0.15} />
      <Rect x="16" y="12" width="32" height="40" rx="2" fill={color} opacity={0.25} />
      
      {/* Ticket lines */}
      <Rect x="20" y="18" width="24" height="3" rx="1.5" fill={color} opacity={0.5} />
      <Rect x="20" y="24" width="18" height="3" rx="1.5" fill={color} opacity={0.4} />
      <Rect x="20" y="30" width="20" height="3" rx="1.5" fill={color} opacity={0.4} />
      
      {/* Dice */}
      <G>
        <Rect x="34" y="38" width="12" height="12" rx="2" fill={color} />
        <Circle cx="37" cy="41" r="1" fill="white" />
        <Circle cx="43" cy="41" r="1" fill="white" />
        <Circle cx="40" cy="44" r="1" fill="white" />
        <Circle cx="37" cy="47" r="1" fill="white" />
        <Circle cx="43" cy="47" r="1" fill="white" />
      </G>
      
      {/* Star/Win symbol */}
      <Path
        d="M26 40L27.5 43.5L31 44L28.5 46.5L29 50L26 48.5L23 50L23.5 46.5L21 44L24.5 43.5L26 40Z"
        fill={color}
      />
      
      {/* Checkmark */}
      <Path
        d="M44 16L46 18L50 14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default BettingIllustration;
