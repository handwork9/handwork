import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Bush meat - African wild game meat
const BushMeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="bushMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="30%" stopColor="#795548" />
        <Stop offset="70%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="smokedSurface" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4E342E" />
        <Stop offset="50%" stopColor="#3E2723" />
        <Stop offset="100%" stopColor="#212121" />
      </LinearGradient>
      <LinearGradient id="leafWrap" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#66BB6A" />
        <Stop offset="50%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#388E3C" />
      </LinearGradient>
      <LinearGradient id="ropeColor" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
    </Defs>
    
    {/* Banana leaf base */}
    <G>
      <Path
        d="M2 48C8 42 20 44 32 42C44 40 56 44 62 48C56 54 44 56 32 58C20 60 8 56 2 48Z"
        fill="url(#leafWrap)"
      />
      {/* Leaf veins */}
      <Path d="M4 50L60 46" stroke="#2E7D32" strokeWidth="1" opacity="0.5" />
      <Path d="M10 46L20 52" stroke="#2E7D32" strokeWidth="0.5" opacity="0.4" />
      <Path d="M30 44L40 52" stroke="#2E7D32" strokeWidth="0.5" opacity="0.4" />
      <Path d="M50 44L54 50" stroke="#2E7D32" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Main smoked meat piece */}
    <G>
      {/* Meat body - irregular shape characteristic of bush meat */}
      <Path
        d="M12 22C10 18 14 12 22 10C30 8 40 10 46 16C52 22 54 32 50 40C46 46 36 48 26 46C16 44 14 34 12 28V22Z"
        fill="url(#bushMeat)"
      />
      
      {/* Smoked/charred exterior */}
      <Path
        d="M12 22C10 18 14 12 22 10C26 12 24 16 22 20C18 24 14 26 12 22Z"
        fill="url(#smokedSurface)"
        opacity="0.7"
      />
      <Path
        d="M46 16C52 22 54 32 50 40C48 36 50 28 46 22C44 18 46 16 46 16Z"
        fill="url(#smokedSurface)"
        opacity="0.6"
      />
      
      {/* Meat texture - dried/smoked appearance */}
      <Path d="M18 20C22 18 28 22 34 20C40 18 46 22 48 26" stroke="#5D4037" strokeWidth="1" fill="none" opacity="0.4" />
      <Path d="M16 28C20 26 26 30 32 28C38 26 44 30 48 32" stroke="#4E342E" strokeWidth="0.8" fill="none" opacity="0.3" />
      <Path d="M18 36C22 34 28 38 34 36C40 34 44 38 46 40" stroke="#5D4037" strokeWidth="0.6" fill="none" opacity="0.3" />
      
      {/* Bone showing */}
      <Path
        d="M38 14C42 10 48 8 52 10C54 12 52 16 48 18"
        stroke="#D7CCC8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Circle cx="52" cy="10" r="3" fill="#EFEBE9" />
      <Circle cx="52" cy="10" r="1.5" fill="#D7CCC8" />
    </G>
    
    {/* Rope/twine tied around (traditional presentation) */}
    <G>
      <Path
        d="M20 30C20 28 24 26 30 26C36 26 40 28 40 30"
        stroke="url(#ropeColor)"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M22 38C22 36 26 34 32 34C38 34 42 36 42 38"
        stroke="url(#ropeColor)"
        strokeWidth="2"
        fill="none"
      />
    </G>
    
    {/* Small pepper garnish */}
    <G>
      <Circle cx="50" cy="50" r="2.5" fill="#F44336" />
      <Path d="M50 48V46" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" />
      
      <Circle cx="44" cy="52" r="2" fill="#FF5722" />
      <Path d="M44 50V49" stroke="#388E3C" strokeWidth="0.8" strokeLinecap="round" />
    </G>
    
    {/* Smoke wisps */}
    <G opacity="0.3">
      <Path d="M24 8C24 6 26 4 26 2" stroke="#9E9E9E" strokeWidth="1" strokeLinecap="round" fill="none" />
      <Path d="M32 6C32 4 34 2 34 0" stroke="#9E9E9E" strokeWidth="1" strokeLinecap="round" fill="none" />
    </G>
  </Svg>
);

export default BushMeatIllustration;
