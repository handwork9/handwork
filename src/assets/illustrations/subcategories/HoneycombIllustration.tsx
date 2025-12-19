import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const HoneycombIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="honeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      <LinearGradient id="cellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFB300" />
      </LinearGradient>
    </Defs>
    
    {/* Honeycomb cells */}
    <G>
      {/* Row 1 */}
      <Polygon points="20,8 28,12 28,20 20,24 12,20 12,12" fill="url(#cellGrad)" stroke="#FFA000" strokeWidth="1" />
      <Polygon points="36,8 44,12 44,20 36,24 28,20 28,12" fill="url(#cellGrad)" stroke="#FFA000" strokeWidth="1" />
      <Polygon points="52,8 60,12 60,20 52,24 44,20 44,12" fill="url(#honeyGrad)" stroke="#FFA000" strokeWidth="1" />
      
      {/* Row 2 */}
      <Polygon points="12,24 20,28 20,36 12,40 4,36 4,28" fill="url(#honeyGrad)" stroke="#FFA000" strokeWidth="1" />
      <Polygon points="28,24 36,28 36,36 28,40 20,36 20,28" fill="url(#cellGrad)" stroke="#FFA000" strokeWidth="1" />
      <Polygon points="44,24 52,28 52,36 44,40 36,36 36,28" fill="url(#honeyGrad)" stroke="#FFA000" strokeWidth="1" />
      
      {/* Row 3 */}
      <Polygon points="20,40 28,44 28,52 20,56 12,52 12,44" fill="url(#honeyGrad)" stroke="#FFA000" strokeWidth="1" />
      <Polygon points="36,40 44,44 44,52 36,56 28,52 28,44" fill="url(#cellGrad)" stroke="#FFA000" strokeWidth="1" />
      <Polygon points="52,40 60,44 60,52 52,56 44,52 44,44" fill="url(#cellGrad)" stroke="#FFA000" strokeWidth="1" />
    </G>
    
    {/* Honey drips */}
    <G>
      <Path
        d="M28 52C28 54 30 58 32 58C34 58 36 54 36 52"
        fill="#FF8F00"
      />
      <Ellipse cx="32" cy="60" rx="3" ry="2" fill="#FFB300" />
    </G>
    
    {/* Bee */}
    <G>
      {/* Body */}
      <Ellipse cx="54" cy="32" rx="5" ry="3.5" fill="#FFC107" />
      <Path d="M51 30V34" stroke="#212121" strokeWidth="1.2" />
      <Path d="M54 30V34" stroke="#212121" strokeWidth="1.2" />
      <Path d="M57 30V34" stroke="#212121" strokeWidth="1.2" />
      
      {/* Head */}
      <Circle cx="59" cy="32" r="2.5" fill="#212121" />
      
      {/* Wings */}
      <Ellipse cx="52" cy="28" rx="4" ry="2" fill="#E3F2FD" opacity="0.8" />
      <Ellipse cx="55" cy="28" rx="3" ry="1.5" fill="#E3F2FD" opacity="0.8" />
      
      {/* Stinger */}
      <Path d="M49 32L47 32" stroke="#212121" strokeWidth="0.8" />
    </G>
    
    {/* Small honey drops */}
    <Circle cx="8" cy="46" r="2" fill="#FFB300" />
    <Circle cx="58" cy="58" r="1.5" fill="#FFC107" />
  </Svg>
);

export default HoneycombIllustration;
