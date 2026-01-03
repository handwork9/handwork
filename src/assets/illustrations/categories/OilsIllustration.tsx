import React from 'react';
import Svg, { Path, Ellipse, Rect, Circle, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic oils illustration - olive oil bottle, cooking oil, oil drop
const OilsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FFCA28' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Olive oil gradient */}
      <LinearGradient id="oilOlive" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A5D6A7" />
        <Stop offset="30%" stopColor="#81C784" />
        <Stop offset="70%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#43A047" />
      </LinearGradient>
      
      {/* Vegetable oil gradient */}
      <LinearGradient id="oilVegetable" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFECB3" />
        <Stop offset="30%" stopColor="#FFCA28" />
        <Stop offset="70%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      
      {/* Glass bottle gradient */}
      <LinearGradient id="oilBottle" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E8F5E9" opacity="0.8" />
        <Stop offset="20%" stopColor="#FFFFFF" opacity="0.9" />
        <Stop offset="80%" stopColor="#E8F5E9" opacity="0.8" />
        <Stop offset="100%" stopColor="#C8E6C9" opacity="0.7" />
      </LinearGradient>
      
      {/* Cork stopper gradient */}
      <LinearGradient id="oilCork" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      
      {/* Oil droplet gradient */}
      <RadialGradient id="oilDrop" cx="30%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="50%" stopColor="#FFCA28" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </RadialGradient>
      
      {/* Small bottle oil */}
      <LinearGradient id="oilSmall" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
    </Defs>
    
    {/* Main olive oil bottle */}
    <G>
      {/* Bottle body */}
      <Path
        d="M20 20H36V24L38 28V54C38 57 35 60 32 60H24C21 60 18 57 18 54V28L20 24V20Z"
        fill="url(#oilBottle)"
      />
      {/* Oil inside */}
      <Path
        d="M20 32H36V54C36 56 34 58 32 58H24C22 58 20 56 20 54V32Z"
        fill="url(#oilOlive)"
        opacity="0.85"
      />
      {/* Glass reflection */}
      <Path d="M22 32V56" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.5" />
      
      {/* Bottle neck */}
      <Path d="M24 16H32V20H24V16Z" fill="#E8F5E9" />
      
      {/* Cork stopper */}
      <Rect x="25" y="10" width="6" height="6" rx="1" fill="url(#oilCork)" />
      <Path d="M26 12H30" stroke="#5D4037" strokeWidth="0.5" opacity="0.5" />
      <Path d="M26 14H30" stroke="#5D4037" strokeWidth="0.5" opacity="0.5" />
      
      {/* Olive decoration */}
      <G>
        <Ellipse cx="28" cy="44" rx="4" ry="5" fill="#558B2F" />
        <Ellipse cx="27" cy="43" rx="1.5" ry="2" fill="#689F38" opacity="0.5" />
        <Circle cx="28" cy="43" r="1.5" fill="#33691E" />
        {/* Olive leaf */}
        <Path d="M32 40C34 38 36 40 34 42C32 44 30 42 32 40Z" fill="#81C784" />
      </G>
    </G>
    
    {/* Golden oil drop - right side */}
    <G>
      <Path
        d="M52 18C52 18 48 28 48 36C48 44 52 48 56 48C60 48 64 44 64 36C64 28 60 18 56 18C54 18 52 18 52 18Z"
        fill="url(#oilDrop)"
      />
      {/* Drop highlight */}
      <Ellipse cx="52" cy="32" rx="3" ry="6" fill="#FFECB3" opacity="0.4" />
      {/* Drop shine */}
      <Circle cx="51" cy="28" r="2" fill="#FFFFFF" opacity="0.5" />
    </G>
    
    {/* Small cooking oil bottle - left */}
    <G>
      {/* Bottle body */}
      <Path
        d="M6 38H16V40L18 42V56C18 57.5 16.5 58 15 58H7C5.5 58 4 57.5 4 56V42L6 40V38Z"
        fill="#FFF8E1"
        opacity="0.9"
      />
      {/* Oil inside */}
      <Path
        d="M6 44H16V56C16 57 15 57 14 57H8C7 57 6 57 6 56V44Z"
        fill="url(#oilSmall)"
        opacity="0.8"
      />
      {/* Bottle reflection */}
      <Path d="M8 44V55" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" />
      
      {/* Cap */}
      <Rect x="8" y="34" width="6" height="4" rx="1" fill="#6D4C41" />
      <Rect x="7" y="36" width="8" height="2" fill="#8D6E63" />
    </G>
    
    {/* Oil splash/drops on surface */}
    <Ellipse cx="42" cy="58" rx="3" ry="1.5" fill="#FFCA28" opacity="0.6" />
    <Ellipse cx="46" cy="60" rx="2" ry="1" fill="#FFB300" opacity="0.5" />
  </Svg>
);

export default OilsIllustration;
