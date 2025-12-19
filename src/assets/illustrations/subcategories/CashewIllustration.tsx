import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic cashew nuts
const CashewIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cashewNut" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="30%" stopColor="#FFECB3" />
        <Stop offset="70%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </LinearGradient>
      <LinearGradient id="cashewRoasted" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="50%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FFC107" />
      </LinearGradient>
      <LinearGradient id="cashewFruit" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFEB3B" />
        <Stop offset="30%" stopColor="#FFC107" />
        <Stop offset="70%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#FF5722" />
      </LinearGradient>
      <LinearGradient id="leafGreen" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    
    {/* Cashew apple (fruit) with nut attached */}
    <G>
      {/* Apple/fruit part */}
      <Path
        d="M36 8C44 8 52 16 52 28C52 40 44 46 36 46C28 46 24 40 24 28C24 16 28 8 36 8Z"
        fill="url(#cashewFruit)"
      />
      {/* Fruit highlight */}
      <Path d="M30 16C34 12 42 14 46 18" stroke="#FFEB3B" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      
      {/* Stem */}
      <Path d="M36 6L36 2" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" />
      
      {/* Leaf */}
      <Path
        d="M38 4C42 2 48 4 48 8C48 12 42 14 38 12C40 10 40 6 38 4Z"
        fill="url(#leafGreen)"
      />
      <Path d="M40 6L46 8" stroke="#388E3C" strokeWidth="0.5" />
      
      {/* Cashew nut attached to fruit */}
      <Path
        d="M28 44C24 48 20 54 24 58C28 62 36 60 40 56C44 52 44 46 40 44C36 42 32 42 28 44Z"
        fill="url(#cashewNut)"
        stroke="#FFC107"
        strokeWidth="0.5"
      />
      {/* Nut curve detail */}
      <Path d="M30 48C32 52 36 54 38 52" stroke="#FFB300" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Loose cashew nuts */}
    <G>
      {/* Cashew 1 */}
      <Path
        d="M6 36C4 40 4 48 8 52C12 56 18 54 20 50C22 46 20 40 16 38C12 36 8 34 6 36Z"
        fill="url(#cashewRoasted)"
        stroke="#FFB300"
        strokeWidth="0.5"
      />
      <Path d="M8 42C10 46 14 48 16 46" stroke="#FFC107" strokeWidth="1" opacity="0.4" />
      
      {/* Cashew 2 */}
      <Path
        d="M8 56C6 58 6 62 10 64C14 66 20 64 22 60C24 56 22 52 18 52C14 52 10 54 8 56Z"
        fill="url(#cashewNut)"
        stroke="#FFB300"
        strokeWidth="0.5"
      />
      
      {/* Cashew 3 */}
      <Path
        d="M48 54C46 56 46 60 50 62C54 64 58 62 60 58C62 54 60 50 56 50C52 50 50 52 48 54Z"
        fill="url(#cashewRoasted)"
        stroke="#FFB300"
        strokeWidth="0.5"
      />
      <Path d="M50 56C52 58 56 58 58 56" stroke="#FFC107" strokeWidth="0.8" opacity="0.4" />
    </G>
    
    {/* Salt crystals on roasted nuts */}
    <G opacity="0.6">
      <Circle cx="10" cy="44" r="0.5" fill="#FFFFFF" />
      <Circle cx="14" cy="50" r="0.4" fill="#FFFFFF" />
      <Circle cx="54" cy="56" r="0.5" fill="#FFFFFF" />
      <Circle cx="56" cy="60" r="0.4" fill="#FFFFFF" />
    </G>
  </Svg>
);

export default CashewIllustration;
