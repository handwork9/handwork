import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Fura - Nigerian millet balls often served with nono
const FuraIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="furaBall" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <LinearGradient id="furaBallLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#A1887F" />
      </LinearGradient>
      <LinearGradient id="milkBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="100%" stopColor="#F5F5F5" />
      </LinearGradient>
      <LinearGradient id="woodenBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
    </Defs>
    
    {/* Wooden bowl/plate */}
    <G>
      <Ellipse cx="32" cy="50" rx="28" ry="8" fill="url(#woodenBowl)" />
      <Ellipse cx="32" cy="48" rx="26" ry="6" fill="#8D6E63" />
      <Ellipse cx="32" cy="46" rx="24" ry="5" fill="#A1887F" />
      
      {/* Bowl wood grain */}
      <Path d="M10 50C18 48 26 52 32 50C38 48 46 52 54 50" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" fill="none" />
    </G>
    
    {/* Large fura ball in center */}
    <G>
      <Circle cx="32" cy="36" r="12" fill="url(#furaBall)" />
      {/* Texture/grain marks */}
      <Circle cx="28" cy="32" r="2" fill="#A1887F" opacity="0.4" />
      <Circle cx="36" cy="38" r="1.5" fill="#A1887F" opacity="0.3" />
      <Circle cx="30" cy="40" r="1" fill="#8D6E63" opacity="0.3" />
      {/* Highlight */}
      <Circle cx="28" cy="30" r="3" fill="#EFEBE9" opacity="0.4" />
      {/* Spice specks */}
      <Circle cx="34" cy="32" r="0.5" fill="#5D4037" opacity="0.5" />
      <Circle cx="30" cy="36" r="0.4" fill="#5D4037" opacity="0.4" />
      <Circle cx="36" cy="40" r="0.4" fill="#5D4037" opacity="0.4" />
    </G>
    
    {/* Medium fura ball */}
    <G>
      <Circle cx="14" cy="40" r="9" fill="url(#furaBallLight)" />
      <Circle cx="11" cy="36" r="2.5" fill="#EFEBE9" opacity="0.5" />
      {/* Texture */}
      <Circle cx="16" cy="42" r="1" fill="#BCAAA4" opacity="0.4" />
      <Circle cx="12" cy="40" r="0.8" fill="#A1887F" opacity="0.3" />
      {/* Spice specks */}
      <Circle cx="14" cy="38" r="0.4" fill="#5D4037" opacity="0.4" />
      <Circle cx="17" cy="41" r="0.3" fill="#5D4037" opacity="0.4" />
    </G>
    
    {/* Small fura ball */}
    <G>
      <Circle cx="50" cy="42" r="8" fill="url(#furaBall)" />
      <Circle cx="47" cy="38" r="2" fill="#D7CCC8" opacity="0.5" />
      {/* Texture */}
      <Circle cx="52" cy="44" r="1" fill="#8D6E63" opacity="0.3" />
      {/* Spice specks */}
      <Circle cx="50" cy="40" r="0.4" fill="#5D4037" opacity="0.4" />
      <Circle cx="48" cy="44" r="0.3" fill="#5D4037" opacity="0.4" />
    </G>
    
    {/* Tiny fura ball */}
    <G>
      <Circle cx="44" cy="28" r="5" fill="url(#furaBallLight)" />
      <Circle cx="42" cy="26" r="1.5" fill="#EFEBE9" opacity="0.5" />
    </G>
    
    {/* Cup of milk/nono on the side */}
    <G>
      <Path
        d="M52 10C52 8 54 6 58 6C62 6 64 8 64 10V22C64 24 62 26 58 26C54 26 52 24 52 22V10Z"
        fill="#E0E0E0"
        stroke="#BDBDBD"
        strokeWidth="0.5"
      />
      {/* Cup handle */}
      <Path
        d="M64 12C66 12 68 14 68 16C68 18 66 20 64 20"
        fill="none"
        stroke="#BDBDBD"
        strokeWidth="2"
      />
      {/* Milk inside */}
      <Path
        d="M54 12V20C54 22 55 24 58 24C61 24 62 22 62 20V12H54Z"
        fill="url(#milkBowl)"
      />
      {/* Milk surface */}
      <Ellipse cx="58" cy="12" rx="4" ry="1.5" fill="#FAFAFA" />
    </G>
    
    {/* Scattered millet grains */}
    <G opacity="0.6">
      <Circle cx="8" cy="54" r="1" fill="#FFE082" />
      <Circle cx="56" cy="56" r="0.8" fill="#FFE082" />
      <Circle cx="24" cy="58" r="0.8" fill="#FFCA28" />
      <Circle cx="42" cy="56" r="1" fill="#FFE082" />
    </G>
  </Svg>
);

export default FuraIllustration;
