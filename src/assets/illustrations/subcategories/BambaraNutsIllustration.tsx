import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic Bambara nuts/groundnuts - round underground legume
const BambaraNutsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="bambaraShell" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#D4A574" />
        <Stop offset="40%" stopColor="#C4956A" />
        <Stop offset="80%" stopColor="#A67B5B" />
        <Stop offset="100%" stopColor="#8B6914" />
      </RadialGradient>
      <RadialGradient id="bambaraNut" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="40%" stopColor="#FFECB3" />
        <Stop offset="80%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </RadialGradient>
      <LinearGradient id="bambaraSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#C62828" />
        <Stop offset="50%" stopColor="#B71C1C" />
        <Stop offset="100%" stopColor="#8B0000" />
      </LinearGradient>
      <LinearGradient id="wovenBasket" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="30%" stopColor="#BCAAA4" />
        <Stop offset="70%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
    </Defs>
    
    {/* Woven basket */}
    <G>
      <Path
        d="M6 40C4 36 8 32 32 32C56 32 60 36 58 40L56 58C56 62 46 64 32 64C18 64 8 62 8 58L6 40Z"
        fill="url(#wovenBasket)"
      />
      {/* Basket weave pattern */}
      <Path d="M10 38C20 36 44 36 54 38" stroke="#6D4C41" strokeWidth="1" opacity="0.4" />
      <Path d="M8 46C22 44 42 44 56 46" stroke="#6D4C41" strokeWidth="1" opacity="0.35" />
      <Path d="M10 54C24 52 40 52 54 54" stroke="#6D4C41" strokeWidth="1" opacity="0.3" />
      {/* Vertical weave */}
      <Path d="M20 36L18 58" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      <Path d="M32 34L32 60" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      <Path d="M44 36L46 58" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Bambara nuts in shell (in basket) */}
    <G>
      <Circle cx="20" cy="42" r="6" fill="url(#bambaraShell)" />
      <Path d="M16 42C18 40 22 40 24 42" stroke="#6B4423" strokeWidth="0.5" opacity="0.4" />
      
      <Circle cx="34" cy="40" r="6" fill="url(#bambaraShell)" />
      <Path d="M30 40C32 38 36 38 38 40" stroke="#6B4423" strokeWidth="0.5" opacity="0.4" />
      
      <Circle cx="48" cy="42" r="6" fill="url(#bambaraShell)" />
      
      <Circle cx="26" cy="50" r="5.5" fill="url(#bambaraShell)" />
      
      <Circle cx="40" cy="52" r="6" fill="url(#bambaraShell)" />
      <Circle cx="42" cy="50" r="1.5" fill="#E8C89E" opacity="0.3" />
    </G>
    
    {/* Cracked shell showing nut inside */}
    <G>
      <Path
        d="M4 24C2 20 6 14 14 14C22 14 26 20 24 26C22 32 14 32 8 28C4 26 2 26 4 24Z"
        fill="url(#bambaraShell)"
      />
      {/* Crack opening */}
      <Path
        d="M10 18C14 16 20 18 20 22C20 26 16 28 12 26C8 24 8 20 10 18Z"
        fill="url(#bambaraNut)"
      />
      {/* Nut with red skin visible */}
      <Path
        d="M12 20C14 18 18 20 18 22C18 24 16 26 14 24C12 22 12 20 12 20Z"
        fill="url(#bambaraSkin)"
      />
      {/* Shell texture */}
      <Path d="M6 20C10 18 18 20 22 24" stroke="#6B4423" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Shelled bambara nuts */}
    <G>
      {/* With red skin */}
      <Circle cx="42" cy="18" r="6" fill="url(#bambaraSkin)" />
      <Circle cx="44" cy="16" r="1.5" fill="#EF5350" opacity="0.4" />
      
      {/* Skinless/cream colored */}
      <Circle cx="56" cy="22" r="5" fill="url(#bambaraNut)" />
      <Circle cx="58" cy="20" r="1.2" fill="#FFFFFF" opacity="0.4" />
      
      <Circle cx="52" cy="12" r="4.5" fill="url(#bambaraNut)" />
    </G>
    
    {/* Large featured nut */}
    <G>
      <Circle cx="30" cy="16" r="8" fill="url(#bambaraSkin)" />
      {/* Skin texture */}
      <Path d="M24 14C28 12 34 14 36 18" stroke="#8B0000" strokeWidth="0.5" opacity="0.4" />
      {/* Highlight */}
      <Circle cx="34" cy="12" r="2" fill="#EF5350" opacity="0.35" />
    </G>
    
    {/* Scattered shells */}
    <G opacity="0.6">
      <Path d="M58 36C60 34 62 36 60 38C58 40 56 38 58 36Z" fill="#A67B5B" />
      <Path d="M4 48C6 46 8 48 6 50C4 52 2 50 4 48Z" fill="#A67B5B" />
    </G>
  </Svg>
);

export default BambaraNutsIllustration;
