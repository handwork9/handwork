import React from 'react';
import Svg, { Path, Ellipse, Rect, Circle, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic grains illustration - wheat stalks, rice bag, grain pile
const GrainsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FFB300' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Wheat grain gradient */}
      <LinearGradient id="grainWheatKernel" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="50%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      
      {/* Stalk gradient */}
      <LinearGradient id="grainStalk" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      
      {/* Rice/grain bag gradient */}
      <LinearGradient id="grainBag" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="30%" stopColor="#EFEBE9" />
        <Stop offset="70%" stopColor="#EFEBE9" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
      
      {/* Rice grains gradient */}
      <LinearGradient id="grainRice" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </LinearGradient>
    </Defs>
    
    {/* Wheat stalk 1 - left */}
    <G>
      <Path d="M12 58V28" stroke="url(#grainStalk)" strokeWidth="2" strokeLinecap="round" />
      {/* Wheat kernels left side */}
      <Ellipse cx="8" cy="26" rx="4" ry="2" fill="url(#grainWheatKernel)" transform="rotate(-35 8 26)" />
      <Ellipse cx="8" cy="21" rx="3.5" ry="1.8" fill="url(#grainWheatKernel)" transform="rotate(-35 8 21)" />
      <Ellipse cx="8" cy="16" rx="3" ry="1.6" fill="url(#grainWheatKernel)" transform="rotate(-35 8 16)" />
      <Ellipse cx="9" cy="12" rx="2.5" ry="1.4" fill="url(#grainWheatKernel)" transform="rotate(-35 9 12)" />
      {/* Wheat kernels right side */}
      <Ellipse cx="16" cy="26" rx="4" ry="2" fill="url(#grainWheatKernel)" transform="rotate(35 16 26)" />
      <Ellipse cx="16" cy="21" rx="3.5" ry="1.8" fill="url(#grainWheatKernel)" transform="rotate(35 16 21)" />
      <Ellipse cx="16" cy="16" rx="3" ry="1.6" fill="url(#grainWheatKernel)" transform="rotate(35 16 16)" />
      <Ellipse cx="15" cy="12" rx="2.5" ry="1.4" fill="url(#grainWheatKernel)" transform="rotate(35 15 12)" />
      {/* Top kernel */}
      <Ellipse cx="12" cy="8" rx="2" ry="3" fill="url(#grainWheatKernel)" />
      {/* Awns (whiskers) */}
      <Path d="M12 8L10 2" stroke="#8D6E63" strokeWidth="0.5" strokeLinecap="round" />
      <Path d="M12 8L14 2" stroke="#8D6E63" strokeWidth="0.5" strokeLinecap="round" />
      <Path d="M12 8L12 3" stroke="#8D6E63" strokeWidth="0.5" strokeLinecap="round" />
    </G>
    
    {/* Wheat stalk 2 - center */}
    <G>
      <Path d="M28 58V32" stroke="url(#grainStalk)" strokeWidth="2" strokeLinecap="round" />
      <Ellipse cx="24" cy="30" rx="4" ry="2" fill="url(#grainWheatKernel)" transform="rotate(-35 24 30)" />
      <Ellipse cx="24" cy="25" rx="3.5" ry="1.8" fill="url(#grainWheatKernel)" transform="rotate(-35 24 25)" />
      <Ellipse cx="24" cy="20" rx="3" ry="1.6" fill="url(#grainWheatKernel)" transform="rotate(-35 24 20)" />
      <Ellipse cx="32" cy="30" rx="4" ry="2" fill="url(#grainWheatKernel)" transform="rotate(35 32 30)" />
      <Ellipse cx="32" cy="25" rx="3.5" ry="1.8" fill="url(#grainWheatKernel)" transform="rotate(35 32 25)" />
      <Ellipse cx="32" cy="20" rx="3" ry="1.6" fill="url(#grainWheatKernel)" transform="rotate(35 32 20)" />
      <Ellipse cx="28" cy="14" rx="2" ry="3" fill="url(#grainWheatKernel)" />
      <Path d="M28 14L26 8" stroke="#8D6E63" strokeWidth="0.5" strokeLinecap="round" />
      <Path d="M28 14L30 8" stroke="#8D6E63" strokeWidth="0.5" strokeLinecap="round" />
    </G>
    
    {/* Wheat stalk 3 - right */}
    <G>
      <Path d="M44 58V26" stroke="url(#grainStalk)" strokeWidth="2" strokeLinecap="round" />
      <Ellipse cx="40" cy="24" rx="4" ry="2" fill="url(#grainWheatKernel)" transform="rotate(-35 40 24)" />
      <Ellipse cx="40" cy="19" rx="3.5" ry="1.8" fill="url(#grainWheatKernel)" transform="rotate(-35 40 19)" />
      <Ellipse cx="40" cy="14" rx="3" ry="1.6" fill="url(#grainWheatKernel)" transform="rotate(-35 40 14)" />
      <Ellipse cx="48" cy="24" rx="4" ry="2" fill="url(#grainWheatKernel)" transform="rotate(35 48 24)" />
      <Ellipse cx="48" cy="19" rx="3.5" ry="1.8" fill="url(#grainWheatKernel)" transform="rotate(35 48 19)" />
      <Ellipse cx="48" cy="14" rx="3" ry="1.6" fill="url(#grainWheatKernel)" transform="rotate(35 48 14)" />
      <Ellipse cx="44" cy="8" rx="2" ry="3" fill="url(#grainWheatKernel)" />
      <Path d="M44 8L42 2" stroke="#8D6E63" strokeWidth="0.5" strokeLinecap="round" />
      <Path d="M44 8L46 2" stroke="#8D6E63" strokeWidth="0.5" strokeLinecap="round" />
    </G>
    
    {/* Rice bag - bottom right */}
    <G>
      <Path
        d="M50 50C48 50 46 54 46 58C46 60 48 62 54 62C60 62 62 60 62 58C62 54 60 50 58 50C56 50 54 52 54 52C54 52 52 50 50 50Z"
        fill="url(#grainBag)"
      />
      {/* Bag fold */}
      <Path d="M50 50C52 52 56 52 58 50" stroke="#A1887F" strokeWidth="0.5" opacity="0.5" />
      {/* Rice grains spilling */}
      <Ellipse cx="48" cy="58" rx="1.5" ry="0.8" fill="url(#grainRice)" transform="rotate(20 48 58)" />
      <Ellipse cx="46" cy="60" rx="1.5" ry="0.8" fill="url(#grainRice)" transform="rotate(-10 46 60)" />
      <Ellipse cx="50" cy="56" rx="1.2" ry="0.6" fill="url(#grainRice)" transform="rotate(45 50 56)" />
    </G>
  </Svg>
);

export default GrainsIllustration;
