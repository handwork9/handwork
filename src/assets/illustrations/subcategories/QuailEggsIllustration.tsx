import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const QuailEggsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="quailEggBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="30%" stopColor="#D7CCC8" />
        <Stop offset="70%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#A1887F" />
      </LinearGradient>
      <LinearGradient id="quailEggLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="50%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFE082" />
      </LinearGradient>
      <RadialGradient id="quailHighlight" cx="30%" cy="25%" r="40%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="ceramicBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ECEFF1" />
        <Stop offset="50%" stopColor="#CFD8DC" />
        <Stop offset="100%" stopColor="#90A4AE" />
      </LinearGradient>
    </Defs>
    
    {/* Ceramic bowl */}
    <G>
      <Path
        d="M6 36C6 32 14 28 32 28C50 28 58 32 58 36V48C58 54 50 58 32 58C14 58 6 54 6 48V36Z"
        fill="url(#ceramicBowl)"
        stroke="#78909C"
        strokeWidth="0.5"
      />
      <Ellipse cx="32" cy="28" rx="26" ry="6" fill="#ECEFF1" stroke="#90A4AE" strokeWidth="0.5" />
      {/* Bowl inner shadow */}
      <Ellipse cx="32" cy="32" rx="22" ry="4" fill="#78909C" opacity="0.2" />
      {/* Bowl shine */}
      <Path d="M10 36V46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </G>
    
    {/* Quail eggs - small and speckled */}
    {/* Egg 1 */}
    <G>
      <Ellipse cx="22" cy="36" rx="6" ry="8" fill="url(#quailEggBase)" />
      <Ellipse cx="20" cy="32" rx="2.5" ry="3.5" fill="url(#quailHighlight)" />
      {/* Speckles - characteristic of quail eggs */}
      <Circle cx="24" cy="34" r="1.2" fill="#5D4037" opacity="0.7" />
      <Circle cx="20" cy="38" r="1" fill="#6D4C41" opacity="0.6" />
      <Circle cx="23" cy="40" r="0.8" fill="#5D4037" opacity="0.5" />
      <Circle cx="18" cy="35" r="0.7" fill="#4E342E" opacity="0.6" />
      <Circle cx="25" cy="37" r="0.6" fill="#5D4037" opacity="0.5" />
      <Circle cx="21" cy="42" r="0.9" fill="#6D4C41" opacity="0.6" />
    </G>
    
    {/* Egg 2 */}
    <G>
      <Ellipse cx="34" cy="34" rx="6" ry="8" fill="url(#quailEggLight)" />
      <Ellipse cx="32" cy="30" rx="2.5" ry="3.5" fill="url(#quailHighlight)" />
      {/* Speckles */}
      <Circle cx="36" cy="32" r="1" fill="#8D6E63" opacity="0.7" />
      <Circle cx="32" cy="36" r="1.1" fill="#795548" opacity="0.6" />
      <Circle cx="35" cy="38" r="0.7" fill="#6D4C41" opacity="0.5" />
      <Circle cx="31" cy="33" r="0.8" fill="#5D4037" opacity="0.6" />
      <Circle cx="37" cy="35" r="0.5" fill="#8D6E63" opacity="0.5" />
      <Circle cx="33" cy="40" r="0.9" fill="#795548" opacity="0.5" />
    </G>
    
    {/* Egg 3 */}
    <G>
      <Ellipse cx="44" cy="38" rx="5.5" ry="7.5" fill="url(#quailEggBase)" />
      <Ellipse cx="42" cy="34" rx="2" ry="3" fill="url(#quailHighlight)" />
      {/* Speckles */}
      <Circle cx="46" cy="36" r="1" fill="#5D4037" opacity="0.7" />
      <Circle cx="42" cy="40" r="0.9" fill="#6D4C41" opacity="0.6" />
      <Circle cx="45" cy="42" r="0.7" fill="#5D4037" opacity="0.5" />
      <Circle cx="41" cy="37" r="0.6" fill="#4E342E" opacity="0.6" />
      <Circle cx="47" cy="39" r="0.5" fill="#5D4037" opacity="0.5" />
    </G>
    
    {/* Egg 4 */}
    <G>
      <Ellipse cx="16" cy="42" rx="5" ry="7" fill="url(#quailEggLight)" />
      <Ellipse cx="14" cy="38" rx="2" ry="3" fill="url(#quailHighlight)" />
      {/* Speckles */}
      <Circle cx="18" cy="40" r="0.9" fill="#795548" opacity="0.7" />
      <Circle cx="14" cy="44" r="0.8" fill="#6D4C41" opacity="0.6" />
      <Circle cx="17" cy="46" r="0.6" fill="#8D6E63" opacity="0.5" />
      <Circle cx="13" cy="41" r="0.7" fill="#5D4037" opacity="0.6" />
    </G>
    
    {/* Egg 5 */}
    <G>
      <Ellipse cx="28" cy="44" rx="5" ry="7" fill="url(#quailEggBase)" />
      <Ellipse cx="26" cy="40" rx="2" ry="3" fill="url(#quailHighlight)" />
      {/* Speckles */}
      <Circle cx="30" cy="42" r="1" fill="#5D4037" opacity="0.7" />
      <Circle cx="26" cy="46" r="0.8" fill="#6D4C41" opacity="0.6" />
      <Circle cx="29" cy="48" r="0.6" fill="#5D4037" opacity="0.5" />
    </G>
    
    {/* Egg 6 - partially visible */}
    <G>
      <Ellipse cx="40" cy="46" rx="4.5" ry="6.5" fill="url(#quailEggLight)" />
      <Ellipse cx="38" cy="42" rx="2" ry="2.5" fill="url(#quailHighlight)" />
      {/* Speckles */}
      <Circle cx="42" cy="44" r="0.8" fill="#795548" opacity="0.6" />
      <Circle cx="38" cy="48" r="0.7" fill="#6D4C41" opacity="0.5" />
    </G>
    
    {/* Egg 7 */}
    <G>
      <Ellipse cx="50" cy="44" rx="4" ry="6" fill="url(#quailEggBase)" />
      <Ellipse cx="48" cy="40" rx="1.5" ry="2.5" fill="url(#quailHighlight)" />
      {/* Speckles */}
      <Circle cx="52" cy="42" r="0.7" fill="#5D4037" opacity="0.6" />
      <Circle cx="49" cy="46" r="0.6" fill="#6D4C41" opacity="0.5" />
    </G>
  </Svg>
);

export default QuailEggsIllustration;
