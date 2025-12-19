import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic water yam - white/yellow yam variety
const WaterYamIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="waterYamSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="30%" stopColor="#BCAAA4" />
        <Stop offset="70%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <LinearGradient id="waterYamFlesh" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="30%" stopColor="#FAFAFA" />
        <Stop offset="70%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#EEEEEE" />
      </LinearGradient>
      <LinearGradient id="waterYamWet" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E3F2FD" />
        <Stop offset="50%" stopColor="#BBDEFB" />
        <Stop offset="100%" stopColor="#90CAF9" />
      </LinearGradient>
      <LinearGradient id="waterBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#90CAF9" />
        <Stop offset="30%" stopColor="#64B5F6" />
        <Stop offset="100%" stopColor="#42A5F5" />
      </LinearGradient>
    </Defs>
    
    {/* Water bowl (water yam often soaked) */}
    <G>
      <Path
        d="M8 44C8 40 16 38 32 38C48 38 56 40 56 44V58C56 62 48 64 32 64C16 64 8 62 8 58V44Z"
        fill="url(#waterBowl)"
        opacity="0.3"
      />
      {/* Water surface */}
      <Ellipse cx="32" cy="38" rx="24" ry="4" fill="#90CAF9" opacity="0.4" />
      {/* Ripples */}
      <Ellipse cx="32" cy="42" rx="18" ry="2" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Main water yam - smoother than regular yam */}
    <G>
      <Path
        d="M10 24C6 18 10 8 22 4C34 0 52 6 58 18C62 28 56 40 44 44C32 48 18 44 12 36C8 30 6 28 10 24Z"
        fill="url(#waterYamSkin)"
      />
      
      {/* Smoother skin texture */}
      <Path d="M18 12C30 8 48 14 56 24" stroke="#8D6E63" strokeWidth="0.8" opacity="0.3" />
      <Path d="M14 28C28 24 46 28 54 36" stroke="#8D6E63" strokeWidth="0.6" opacity="0.25" />
      
      {/* Wet sheen */}
      <Path d="M20 10C32 8 46 14 52 22" stroke="url(#waterYamWet)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      
      {/* Light spots */}
      <Circle cx="26" cy="16" r="2" fill="#E0E0E0" opacity="0.3" />
      <Circle cx="42" cy="22" r="1.5" fill="#EEEEEE" opacity="0.3" />
      
      {/* Root base */}
      <Ellipse cx="56" cy="26" rx="3" ry="4" fill="#8D6E63" />
    </G>
    
    {/* Sliced water yam pieces in water */}
    <G>
      {/* Slice 1 */}
      <Ellipse cx="24" cy="50" rx="8" ry="4" fill="url(#waterYamFlesh)" />
      <Ellipse cx="24" cy="50" rx="8" ry="4" fill="none" stroke="#BCAAA4" strokeWidth="1" />
      
      {/* Slice 2 */}
      <Ellipse cx="40" cy="52" rx="7" ry="3.5" fill="url(#waterYamFlesh)" />
      <Ellipse cx="40" cy="52" rx="7" ry="3.5" fill="none" stroke="#A1887F" strokeWidth="1" />
      
      {/* Water droplets on slices */}
      <Circle cx="22" cy="48" r="0.8" fill="#64B5F6" opacity="0.6" />
      <Circle cx="42" cy="50" r="0.6" fill="#90CAF9" opacity="0.5" />
    </G>
    
    {/* Cut piece showing white flesh */}
    <G>
      <Path
        d="M4 18C2 14 6 8 14 8C22 8 26 14 24 20C22 26 14 26 8 24C4 22 2 20 4 18Z"
        fill="url(#waterYamSkin)"
      />
      {/* White flesh */}
      <Ellipse cx="12" cy="16" rx="7" ry="6" fill="url(#waterYamFlesh)" />
      {/* Wet sheen on cut surface */}
      <Path d="M8 14C10 12 14 14 16 12" stroke="url(#waterYamWet)" strokeWidth="1.5" opacity="0.5" />
    </G>
    
    {/* Water drops on main yam */}
    <G opacity="0.6">
      <Circle cx="32" cy="20" r="1.5" fill="#90CAF9" />
      <Circle cx="38" cy="30" r="1" fill="#64B5F6" />
      <Circle cx="24" cy="28" r="1.2" fill="#90CAF9" />
    </G>
    
    {/* Vine tendril */}
    <G>
      <Path
        d="M58 12C60 8 64 10 64 14C64 18 60 20 58 18"
        stroke="#8D6E63"
        strokeWidth="1.5"
        fill="none"
      />
      <Path
        d="M62 10C64 8 66 10 64 12"
        stroke="#66BB6A"
        strokeWidth="1"
        fill="none"
      />
    </G>
  </Svg>
);

export default WaterYamIllustration;
