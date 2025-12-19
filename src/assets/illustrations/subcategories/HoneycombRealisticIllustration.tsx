import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Polygon, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic honeycomb - fresh comb with honey dripping
const HoneycombRealisticIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="combWax" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFECB3" />
        <Stop offset="30%" stopColor="#FFE082" />
        <Stop offset="70%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FFC107" />
      </LinearGradient>
      <LinearGradient id="honeyFill" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFB300" />
        <Stop offset="50%" stopColor="#FF8F00" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <LinearGradient id="honeyDrip" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF6F00" />
      </LinearGradient>
      <LinearGradient id="woodPlate" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
    </Defs>
    
    {/* Wooden plate/board */}
    <G>
      <Ellipse cx="32" cy="58" rx="28" ry="6" fill="url(#woodPlate)" />
      <Ellipse cx="32" cy="56" rx="24" ry="4" fill="#8D6E63" />
      <Path d="M12 56C20 54 44 54 52 56" stroke="#5D4037" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Main honeycomb piece */}
    <G>
      {/* Comb base */}
      <Path
        d="M8 20C8 16 12 12 20 12H44C52 12 56 16 56 20V44C56 48 52 52 44 52H20C12 52 8 48 8 44V20Z"
        fill="url(#combWax)"
        stroke="#FFA000"
        strokeWidth="1"
      />
      
      {/* Hexagonal cells - Row 1 */}
      <Polygon points="16,16 22,19 22,25 16,28 10,25 10,19" fill="url(#honeyFill)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="28,16 34,19 34,25 28,28 22,25 22,19" fill="url(#combWax)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="40,16 46,19 46,25 40,28 34,25 34,19" fill="url(#honeyFill)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="52,16 58,19 58,25 52,28 46,25 46,19" fill="url(#combWax)" stroke="#FFA000" strokeWidth="0.8" />
      
      {/* Row 2 */}
      <Polygon points="10,28 16,31 16,37 10,40 4,37 4,31" fill="url(#honeyFill)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="22,28 28,31 28,37 22,40 16,37 16,31" fill="url(#honeyFill)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="34,28 40,31 40,37 34,40 28,37 28,31" fill="url(#combWax)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="46,28 52,31 52,37 46,40 40,37 40,31" fill="url(#honeyFill)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="58,28 64,31 64,37 58,40 52,37 52,31" fill="url(#combWax)" stroke="#FFA000" strokeWidth="0.8" />
      
      {/* Row 3 */}
      <Polygon points="16,40 22,43 22,49 16,52 10,49 10,43" fill="url(#combWax)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="28,40 34,43 34,49 28,52 22,49 22,43" fill="url(#honeyFill)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="40,40 46,43 46,49 40,52 34,49 34,43" fill="url(#honeyFill)" stroke="#FFA000" strokeWidth="0.8" />
      <Polygon points="52,40 58,43 58,49 52,52 46,49 46,43" fill="url(#combWax)" stroke="#FFA000" strokeWidth="0.8" />
      
      {/* Honey shine in filled cells */}
      <Circle cx="16" cy="22" r="1.5" fill="#FFE082" opacity="0.6" />
      <Circle cx="40" cy="22" r="1.5" fill="#FFE082" opacity="0.6" />
      <Circle cx="10" cy="34" r="1.5" fill="#FFE082" opacity="0.6" />
      <Circle cx="22" cy="34" r="1.5" fill="#FFE082" opacity="0.6" />
      <Circle cx="28" cy="46" r="1.5" fill="#FFE082" opacity="0.6" />
    </G>
    
    {/* Honey drips */}
    <G>
      {/* Drip 1 */}
      <Path
        d="M22 52C22 54 23 58 24 60C25 62 23 64 22 62C21 60 20 56 20 54C20 52 22 52 22 52Z"
        fill="url(#honeyDrip)"
      />
      
      {/* Drip 2 */}
      <Path
        d="M40 52C40 56 41 60 42 62C42 64 40 64 40 62C38 60 38 56 38 54C38 52 40 52 40 52Z"
        fill="url(#honeyDrip)"
      />
      
      {/* Pooling honey on plate */}
      <Ellipse cx="32" cy="56" rx="12" ry="2" fill="#FF8F00" opacity="0.5" />
    </G>
    
    {/* Bee on comb */}
    <G>
      {/* Bee body */}
      <Ellipse cx="50" cy="24" rx="4" ry="2.5" fill="#FFC107" />
      <Path d="M48 22V26" stroke="#212121" strokeWidth="1" />
      <Path d="M50 22V26" stroke="#212121" strokeWidth="1" />
      <Path d="M52 22V26" stroke="#212121" strokeWidth="1" />
      {/* Head */}
      <Circle cx="54" cy="24" r="2" fill="#212121" />
      {/* Wings */}
      <Ellipse cx="48" cy="22" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.6" />
      <Ellipse cx="49" cy="21" rx="2.5" ry="1.2" fill="#FFFFFF" opacity="0.4" />
    </G>
    
    {/* Comb edge texture */}
    <G opacity="0.3">
      <Path d="M8 24C10 22 12 24 14 22" stroke="#E65100" strokeWidth="0.5" />
      <Path d="M50 48C52 46 54 48 56 46" stroke="#E65100" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default HoneycombRealisticIllustration;
