import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic Irish potatoes
const PotatoIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="potatoSkin" cx="30%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="40%" stopColor="#BCAAA4" />
        <Stop offset="80%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </RadialGradient>
      <RadialGradient id="potatoRusset" cx="30%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </RadialGradient>
      <LinearGradient id="potatoFlesh" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="30%" stopColor="#FFECB3" />
        <Stop offset="70%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </LinearGradient>
      <LinearGradient id="burlap" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
    </Defs>
    
    {/* Burlap sack hint */}
    <G>
      <Path
        d="M4 50C4 46 12 44 32 44C52 44 60 46 60 50V60C60 64 52 66 32 66C12 66 4 64 4 60V50Z"
        fill="url(#burlap)"
        opacity="0.6"
      />
      {/* Sack texture */}
      <Path d="M10 52H54" stroke="#8D6E63" strokeWidth="0.5" opacity="0.4" />
      <Path d="M12 56H52" stroke="#8D6E63" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Large potato 1 */}
    <G>
      <Ellipse cx="24" cy="32" rx="16" ry="12" fill="url(#potatoSkin)" />
      {/* Eyes (potato eyes) */}
      <Circle cx="16" cy="28" r="1.5" fill="#6D4C41" opacity="0.6" />
      <Circle cx="28" cy="26" r="1" fill="#5D4037" opacity="0.5" />
      <Circle cx="20" cy="36" r="1.2" fill="#6D4C41" opacity="0.5" />
      <Circle cx="32" cy="34" r="1" fill="#5D4037" opacity="0.4" />
      {/* Skin imperfections */}
      <Path d="M14 30C16 32 18 30 20 32" stroke="#8D6E63" strokeWidth="0.5" opacity="0.4" />
      {/* Highlight */}
      <Path d="M16 26C20 24 26 26 28 28" stroke="#E0E0E0" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </G>
    
    {/* Potato 2 - russet variety */}
    <G>
      <Ellipse cx="46" cy="28" rx="12" ry="10" fill="url(#potatoRusset)" />
      {/* Eyes */}
      <Circle cx="40" cy="26" r="1" fill="#5D4037" opacity="0.5" />
      <Circle cx="50" cy="24" r="1.2" fill="#4E342E" opacity="0.5" />
      <Circle cx="48" cy="32" r="0.8" fill="#5D4037" opacity="0.4" />
      {/* Rough skin texture */}
      <Path d="M38 28C42 26 48 28 52 26" stroke="#5D4037" strokeWidth="0.8" opacity="0.3" />
    </G>
    
    {/* Small potato 3 */}
    <G>
      <Ellipse cx="36" cy="48" rx="8" ry="6" fill="url(#potatoSkin)" />
      <Circle cx="32" cy="46" r="0.8" fill="#6D4C41" opacity="0.5" />
      <Circle cx="38" cy="50" r="0.6" fill="#5D4037" opacity="0.4" />
    </G>
    
    {/* Cut potato showing yellow flesh */}
    <G>
      <Path
        d="M4 18C2 14 6 8 14 8C22 8 26 16 24 22C22 28 14 28 8 26C4 24 2 22 4 18Z"
        fill="url(#potatoSkin)"
      />
      {/* Cut surface */}
      <Path
        d="M10 10C16 10 22 16 20 22C16 24 10 22 8 18C6 14 8 10 10 10Z"
        fill="url(#potatoFlesh)"
      />
      {/* Flesh pattern */}
      <Circle cx="14" cy="16" r="2" fill="#FFE082" opacity="0.3" />
    </G>
    
    {/* Potato 4 - in sack */}
    <G>
      <Ellipse cx="20" cy="54" rx="7" ry="5" fill="url(#potatoSkin)" />
      <Circle cx="18" cy="52" r="0.6" fill="#6D4C41" opacity="0.4" />
    </G>
    
    {/* Potato 5 - in sack */}
    <G>
      <Ellipse cx="48" cy="52" rx="6" ry="5" fill="url(#potatoRusset)" />
    </G>
    
    {/* Dirt specks */}
    <G opacity="0.3">
      <Circle cx="22" cy="38" r="0.5" fill="#5D4037" />
      <Circle cx="44" cy="36" r="0.4" fill="#4E342E" />
      <Circle cx="12" cy="34" r="0.4" fill="#5D4037" />
    </G>
  </Svg>
);

export default PotatoIllustration;
