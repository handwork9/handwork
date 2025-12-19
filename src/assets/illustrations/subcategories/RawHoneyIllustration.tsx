import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic raw honey - jar with crystallized honey and natural comb piece
const RawHoneyIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="rawHoneyGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="30%" stopColor="#FFB300" />
        <Stop offset="70%" stopColor="#FF8F00" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <LinearGradient id="jarGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <Stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
      </LinearGradient>
      <LinearGradient id="woodenLid" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="30%" stopColor="#8D6E63" />
        <Stop offset="70%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="combPiece" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFECB3" />
        <Stop offset="50%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
      <RadialGradient id="crystalHoney" cx="50%" cy="70%" r="50%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="70%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </RadialGradient>
    </Defs>
    
    {/* Mason jar body */}
    <G>
      {/* Main jar shape */}
      <Path
        d="M16 18C16 16 18 14 22 14H42C46 14 48 16 48 18V54C48 58 44 60 32 60C20 60 16 58 16 54V18Z"
        fill="url(#rawHoneyGold)"
        stroke="#E65100"
        strokeWidth="0.5"
      />
      
      {/* Crystallized honey at bottom (raw honey characteristic) */}
      <Path
        d="M16 48C16 46 20 44 32 44C44 44 48 46 48 48V54C48 58 44 60 32 60C20 60 16 58 16 54V48Z"
        fill="url(#crystalHoney)"
        opacity="0.7"
      />
      
      {/* Crystal texture */}
      <Circle cx="24" cy="52" r="2" fill="#FFECB3" opacity="0.6" />
      <Circle cx="32" cy="54" r="1.5" fill="#FFE082" opacity="0.5" />
      <Circle cx="38" cy="52" r="2.5" fill="#FFECB3" opacity="0.5" />
      <Circle cx="28" cy="56" r="1.8" fill="#FFE082" opacity="0.6" />
      
      {/* Jar glass reflection */}
      <Path
        d="M18 20C18 18 20 16 24 16V50C20 50 18 48 18 46V20Z"
        fill="url(#jarGlass)"
      />
      
      {/* Honey surface shine */}
      <Path d="M22 28C28 26 38 28 44 26" stroke="#FFE082" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </G>
    
    {/* Honeycomb piece floating in honey */}
    <G>
      <Path
        d="M34 26L38 28L38 34L34 36L30 34L30 28Z"
        fill="url(#combPiece)"
        stroke="#FFA000"
        strokeWidth="0.5"
      />
      <Path
        d="M42 30L46 32L46 38L42 40L38 38L38 32Z"
        fill="url(#combPiece)"
        stroke="#FFA000"
        strokeWidth="0.5"
      />
      {/* Cell detail */}
      <Circle cx="34" cy="31" r="1" fill="#FF8F00" opacity="0.5" />
      <Circle cx="42" cy="35" r="1" fill="#FF8F00" opacity="0.5" />
    </G>
    
    {/* Wooden lid */}
    <G>
      <Ellipse cx="32" cy="14" rx="16" ry="4" fill="url(#woodenLid)" />
      <Ellipse cx="32" cy="12" rx="14" ry="3" fill="#8D6E63" />
      {/* Lid texture */}
      <Path d="M20 12C24 11 40 11 44 12" stroke="#5D4037" strokeWidth="0.5" opacity="0.5" />
      <Path d="M22 14C28 13 36 13 42 14" stroke="#4E342E" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Jar neck/thread */}
    <G>
      <Rect x="20" y="10" width="24" height="4" fill="#E0E0E0" rx="1" />
      <Path d="M20 11H44" stroke="#9E9E9E" strokeWidth="0.5" />
      <Path d="M20 13H44" stroke="#9E9E9E" strokeWidth="0.5" />
    </G>
    
    {/* "RAW" label hint */}
    <G>
      <Rect x="24" y="38" width="16" height="6" rx="1" fill="#FFF8E1" opacity="0.8" />
      <Path d="M26 42H38" stroke="#8D6E63" strokeWidth="1" />
    </G>
    
    {/* Honey drip on jar */}
    <G>
      <Path
        d="M46 24C48 26 48 30 46 32C46 34 48 36 48 34V24C48 22 46 22 46 24Z"
        fill="#FF8F00"
        opacity="0.6"
      />
    </G>
  </Svg>
);

export default RawHoneyIllustration;
