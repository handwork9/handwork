import React from 'react';
import Svg, { Path, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient, Circle } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic eggs illustration - eggs in nest/basket with various types
const EggsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FFECB3' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="whiteEgg" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="40%" stopColor="#FFF8E1" />
        <Stop offset="80%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFE082" />
      </RadialGradient>
      <RadialGradient id="brownEgg" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="40%" stopColor="#D7CCC8" />
        <Stop offset="80%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </RadialGradient>
      <RadialGradient id="speckledEgg" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#E8F5E9" />
        <Stop offset="50%" stopColor="#C8E6C9" />
        <Stop offset="100%" stopColor="#A5D6A7" />
      </RadialGradient>
      <LinearGradient id="nestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <RadialGradient id="yolkGrad" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFEB3B" />
        <Stop offset="70%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </RadialGradient>
    </Defs>
    
    {/* Nest/straw base */}
    <G>
      <Ellipse cx="32" cy="52" rx="28" ry="10" fill="url(#nestGrad)" />
      {/* Straw texture */}
      <Path d="M8 50C14 48 22 52 30 50C38 48 46 52 54 50" stroke="#8D6E63" strokeWidth="1" opacity="0.5" />
      <Path d="M10 54C18 52 26 56 34 54C42 52 50 56 56 54" stroke="#6D4C41" strokeWidth="0.8" opacity="0.4" />
      <Path d="M6 52C16 50 28 54 38 52C48 50 56 54 58 52" stroke="#8D6E63" strokeWidth="0.6" opacity="0.3" />
    </G>
    
    {/* Eggs in nest */}
    <G>
      {/* Back row eggs */}
      <Ellipse cx="20" cy="42" rx="8" ry="10" fill="url(#brownEgg)" />
      <Ellipse cx="18" cy="38" rx="2" ry="2.5" fill="#EFEBE9" opacity="0.4" />
      
      <Ellipse cx="44" cy="42" rx="8" ry="10" fill="url(#whiteEgg)" />
      <Ellipse cx="42" cy="38" rx="2" ry="2.5" fill="#FFFFFF" opacity="0.5" />
      
      {/* Front center egg */}
      <Ellipse cx="32" cy="46" rx="9" ry="11" fill="url(#whiteEgg)" />
      <Ellipse cx="29" cy="41" rx="2.5" ry="3" fill="#FFFFFF" opacity="0.5" />
    </G>
    
    {/* Large featured egg */}
    <G>
      <Path
        d="M50 6C42 6 36 16 36 24C36 32 42 38 50 38C58 38 64 32 64 24C64 16 58 6 50 6Z"
        fill="url(#brownEgg)"
      />
      {/* Egg highlight */}
      <Ellipse cx="46" cy="16" rx="4" ry="6" fill="#EFEBE9" opacity="0.5" />
      {/* Speckles on brown egg */}
      <Circle cx="48" cy="22" r="1" fill="#6D4C41" opacity="0.3" />
      <Circle cx="52" cy="18" r="0.8" fill="#6D4C41" opacity="0.25" />
      <Circle cx="54" cy="26" r="1.2" fill="#6D4C41" opacity="0.3" />
      <Circle cx="46" cy="28" r="0.7" fill="#6D4C41" opacity="0.2" />
    </G>
    
    {/* Cracked egg with yolk */}
    <G>
      {/* Egg white puddle */}
      <Ellipse cx="12" cy="26" rx="10" ry="6" fill="#FAFAFA" />
      <Ellipse cx="14" cy="28" rx="8" ry="4" fill="#FFFFFF" opacity="0.6" />
      {/* Yolk */}
      <Circle cx="12" cy="24" r="5" fill="url(#yolkGrad)" />
      <Circle cx="10" cy="22" r="1.5" fill="#FFEB3B" opacity="0.5" />
      {/* Broken shell pieces */}
      <Path d="M6 18C8 16 10 18 8 20C6 22 4 20 6 18Z" fill="url(#whiteEgg)" />
      <Path d="M16 16C18 18 20 16 18 14C16 12 14 14 16 16Z" fill="url(#whiteEgg)" />
    </G>
  </Svg>
);

export default EggsIllustration;
