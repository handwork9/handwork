import React from 'react';
import Svg, { Path, Ellipse, Rect, Circle, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic beverages illustration - juice glass, smoothie cup, tea cup with steam
const BeveragesIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#4CAF50' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Orange juice gradient */}
      <LinearGradient id="bevOrangeJuice" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFB74D" />
        <Stop offset="50%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      
      {/* Glass gradient */}
      <LinearGradient id="bevGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" opacity="0.4" />
        <Stop offset="20%" stopColor="#FFFFFF" opacity="0.1" />
        <Stop offset="100%" stopColor="#FFFFFF" opacity="0.3" />
      </LinearGradient>
      
      {/* Green smoothie gradient */}
      <LinearGradient id="bevSmoothie" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="50%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
      
      {/* Tea gradient */}
      <RadialGradient id="bevTea" cx="50%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="50%" stopColor="#FFA726" />
        <Stop offset="100%" stopColor="#E65100" />
      </RadialGradient>
      
      {/* Ceramic cup gradient */}
      <LinearGradient id="bevCup" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#D7CCC8" />
      </LinearGradient>
    </Defs>
    
    {/* Orange juice glass */}
    <G>
      {/* Glass outline */}
      <Path
        d="M8 18H26L24 54H10L8 18Z"
        fill="#FFECB3"
        opacity="0.3"
      />
      <Path
        d="M8 18H26L24 54H10L8 18Z"
        stroke="#FFA000"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Juice inside */}
      <Path
        d="M9.5 26H24.5L22.5 52H11.5L9.5 26Z"
        fill="url(#bevOrangeJuice)"
      />
      {/* Glass reflection */}
      <Path d="M11 26V50" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
      
      {/* Orange slice */}
      <Circle cx="17" cy="40" r="6" fill="#FFB74D" />
      <Circle cx="17" cy="40" r="5" fill="#FFA726" />
      {/* Orange segments */}
      <G>
        <Path d="M17 35V45" stroke="#FFF3E0" strokeWidth="1.2" />
        <Path d="M12 40H22" stroke="#FFF3E0" strokeWidth="1.2" />
        <Path d="M13.5 36.5L20.5 43.5" stroke="#FFF3E0" strokeWidth="1" />
        <Path d="M20.5 36.5L13.5 43.5" stroke="#FFF3E0" strokeWidth="1" />
      </G>
      <Circle cx="17" cy="40" r="1.5" fill="#FFE0B2" />
    </G>
    
    {/* Green smoothie cup */}
    <G>
      {/* Plastic cup */}
      <Path
        d="M34 16H50L48 56H36L34 16Z"
        fill="#E8F5E9"
        opacity="0.8"
      />
      {/* Smoothie */}
      <Path
        d="M35.5 24H48.5L46.5 54H37.5L35.5 24Z"
        fill="url(#bevSmoothie)"
      />
      {/* Cup shine */}
      <Path d="M37 24V52" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" />
      
      {/* Straw */}
      <Rect x="40" y="6" width="3" height="22" rx="1" fill="#E91E63" />
      <Path d="M40 6H43L44 10H39L40 6Z" fill="#EC407A" />
      
      {/* Domed lid */}
      <Ellipse cx="42" cy="18" rx="9" ry="3" fill="#A5D6A7" />
      <Ellipse cx="42" cy="17" rx="7" ry="2" fill="#C8E6C9" opacity="0.5" />
      
      {/* Bubbles in smoothie */}
      <Circle cx="40" cy="38" r="2.5" fill="#81C784" opacity="0.6" />
      <Circle cx="44" cy="32" r="2" fill="#81C784" opacity="0.5" />
      <Circle cx="38" cy="44" r="1.5" fill="#81C784" opacity="0.4" />
      <Circle cx="45" cy="42" r="1" fill="#A5D6A7" opacity="0.5" />
    </G>
    
    {/* Tea cup - right side */}
    <G>
      {/* Cup handle */}
      <Path
        d="M60 36C64 36 66 40 64 44C62 48 58 46 58 44"
        stroke="#8D6E63"
        strokeWidth="2.5"
        fill="none"
      />
      
      {/* Saucer */}
      <Ellipse cx="56" cy="56" rx="8" ry="3" fill="#D7CCC8" />
      <Ellipse cx="56" cy="55" rx="6" ry="2" fill="#EFEBE9" />
      
      {/* Cup body */}
      <Path
        d="M50 38H62V50C62 53 59 56 56 56C53 56 50 53 50 50V38Z"
        fill="url(#bevCup)"
      />
      {/* Cup rim */}
      <Ellipse cx="56" cy="38" rx="6" ry="2" fill="#8D6E63" />
      <Ellipse cx="56" cy="37" rx="5" ry="1.5" fill="#A1887F" />
      
      {/* Tea inside */}
      <Ellipse cx="56" cy="40" rx="5" ry="4" fill="url(#bevTea)" />
      
      {/* Steam curls */}
      <Path d="M53 32C53 30 55 30 55 32C55 34 53 34 53 32" stroke="#BDBDBD" strokeWidth="1" fill="none" opacity="0.6" />
      <Path d="M56 28C56 26 58 26 58 28C58 30 56 30 56 28" stroke="#BDBDBD" strokeWidth="1" fill="none" opacity="0.5" />
      <Path d="M59 32C59 30 61 30 61 32" stroke="#BDBDBD" strokeWidth="1" fill="none" opacity="0.4" />
    </G>
  </Svg>
);

export default BeveragesIllustration;
