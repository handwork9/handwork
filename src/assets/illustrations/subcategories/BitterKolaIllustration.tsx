import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic bitter kola - Garcinia kola
const BitterKolaIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="bitterKolaSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="30%" stopColor="#4E342E" />
        <Stop offset="70%" stopColor="#3E2723" />
        <Stop offset="100%" stopColor="#2E1F1A" />
      </LinearGradient>
      <LinearGradient id="bitterKolaFlesh" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFECB3" />
        <Stop offset="30%" stopColor="#FFE082" />
        <Stop offset="70%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FFC107" />
      </LinearGradient>
      <LinearGradient id="bitterBrown" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#795548" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="weavePlate" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
    </Defs>
    
    {/* Woven plate/basket */}
    <G>
      <Ellipse cx="32" cy="56" rx="28" ry="8" fill="url(#weavePlate)" />
      <Ellipse cx="32" cy="54" rx="24" ry="6" fill="#D7CCC8" />
      {/* Weave pattern */}
      <Path d="M12 54L16 52L20 54L24 52L28 54L32 52L36 54L40 52L44 54L48 52L52 54" stroke="#A1887F" strokeWidth="0.8" />
      <Path d="M14 58L18 56L22 58L26 56L30 58L34 56L38 58L42 56L46 58L50 56" stroke="#8D6E63" strokeWidth="0.5" />
    </G>
    
    {/* Whole bitter kola nuts on plate */}
    <G>
      {/* Nut 1 - whole with skin */}
      <Ellipse cx="22" cy="48" rx="8" ry="6" fill="url(#bitterKolaSkin)" />
      {/* Characteristic ridges */}
      <Path d="M16 48C20 46 24 48 28 46" stroke="#2E1F1A" strokeWidth="0.8" opacity="0.5" />
      <Path d="M18 50C22 48 24 50 26 48" stroke="#2E1F1A" strokeWidth="0.5" opacity="0.4" />
      
      {/* Nut 2 */}
      <Ellipse cx="40" cy="50" rx="7" ry="5" fill="url(#bitterKolaSkin)" />
      <Path d="M34 50C38 48 42 50 46 48" stroke="#2E1F1A" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Cut/bitten bitter kola showing yellow flesh */}
    <G>
      {/* Main piece */}
      <Path
        d="M24 14C20 10 22 4 30 2C38 0 46 6 46 16C46 26 38 32 30 32C22 32 18 24 24 14Z"
        fill="url(#bitterKolaSkin)"
      />
      
      {/* Cut surface showing flesh */}
      <Path
        d="M30 6C36 6 42 12 42 20C42 28 36 30 30 30C30 24 30 12 30 6Z"
        fill="url(#bitterKolaFlesh)"
      />
      {/* Flesh texture */}
      <Path d="M34 12L38 20" stroke="#FFA000" strokeWidth="0.5" opacity="0.4" />
      <Path d="M32 16L36 24" stroke="#FFA000" strokeWidth="0.5" opacity="0.3" />
      
      {/* Skin edge */}
      <Path d="M30 6C30 12 30 24 30 30" stroke="#3E2723" strokeWidth="1" />
    </G>
    
    {/* Small piece bitten off */}
    <G>
      <Path
        d="M8 28C6 26 8 20 14 20C20 20 22 26 20 30C18 34 12 34 10 32C8 30 6 30 8 28Z"
        fill="url(#bitterKolaSkin)"
      />
      {/* Bite mark showing flesh */}
      <Path
        d="M12 22C16 24 18 28 16 30"
        fill="url(#bitterKolaFlesh)"
      />
    </G>
    
    {/* Another small piece */}
    <G>
      <Path
        d="M50 30C48 28 50 24 54 24C58 24 60 28 58 32C56 36 52 36 50 34C48 32 48 32 50 30Z"
        fill="url(#bitterBrown)"
      />
    </G>
    
    {/* Characteristic brown powder/residue */}
    <G opacity="0.3">
      <Circle cx="32" cy="54" r="1" fill="#5D4037" />
      <Circle cx="36" cy="52" r="0.8" fill="#4E342E" />
      <Circle cx="28" cy="56" r="0.6" fill="#5D4037" />
    </G>
    
    {/* Decorative leaf */}
    <G>
      <Path
        d="M52 8C54 6 60 8 60 14C60 20 54 22 50 18C52 16 52 10 52 8Z"
        fill="#66BB6A"
      />
      <Path d="M54 10L58 14" stroke="#388E3C" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default BitterKolaIllustration;
