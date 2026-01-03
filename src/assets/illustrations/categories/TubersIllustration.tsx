import React from 'react';
import Svg, { Path, Ellipse, G, Rect, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic tubers illustration - potato, sweet potato, yam, ginger, cassava
const TubersIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#8D6E63' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Potato gradient */}
      <RadialGradient id="tuberPotato" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#5D4037" />
      </RadialGradient>
      
      {/* Sweet potato gradient */}
      <RadialGradient id="tuberSweet" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="50%" stopColor="#E65100" />
        <Stop offset="100%" stopColor="#BF360C" />
      </RadialGradient>
      
      {/* Yam gradient */}
      <RadialGradient id="tuberYam" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#3E2723" />
      </RadialGradient>
      
      {/* Ginger gradient */}
      <RadialGradient id="tuberGinger" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFE0B2" />
        <Stop offset="50%" stopColor="#FFCC80" />
        <Stop offset="100%" stopColor="#FFA726" />
      </RadialGradient>
      
      {/* Cassava gradient */}
      <LinearGradient id="tuberCassava" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
    </Defs>
    
    {/* Large potato - main focus */}
    <G>
      <Path
        d="M8 30C8 22 16 16 26 16C36 16 42 22 42 32C42 42 34 48 24 48C14 48 8 40 8 30Z"
        fill="url(#tuberPotato)"
      />
      {/* Potato eyes (spots) */}
      <Ellipse cx="16" cy="26" rx="2.5" ry="1.5" fill="#5D4037" />
      <Ellipse cx="30" cy="30" rx="2" ry="1.2" fill="#5D4037" />
      <Ellipse cx="22" cy="38" rx="2.5" ry="1.5" fill="#5D4037" />
      <Ellipse cx="14" cy="34" rx="1.5" ry="0.8" fill="#5D4037" />
      <Ellipse cx="34" cy="36" rx="1.5" ry="1" fill="#5D4037" />
      {/* Potato highlight */}
      <Ellipse cx="20" cy="24" rx="6" ry="4" fill="#BCAAA4" opacity="0.3" />
    </G>
    
    {/* Sweet potato - bottom right */}
    <G>
      <Path
        d="M38 44C38 38 44 34 52 36C60 38 62 46 60 52C58 58 50 60 44 56C40 54 38 50 38 44Z"
        fill="url(#tuberSweet)"
      />
      {/* Sweet potato highlight */}
      <Ellipse cx="50" cy="44" rx="5" ry="6" fill="#FFAB91" opacity="0.3" />
      {/* Texture lines */}
      <Path d="M46 42C48 40 52 40 54 42" stroke="#BF360C" strokeWidth="0.5" opacity="0.4" />
      <Path d="M48 48C50 46 54 46 56 48" stroke="#BF360C" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Cassava - top right */}
    <G>
      <Path
        d="M46 6C46 6 44 12 46 20C48 28 52 30 54 28C56 26 56 18 54 10C52 4 48 4 46 6Z"
        fill="url(#tuberCassava)"
      />
      {/* Cassava center line */}
      <Path d="M50 8V26" stroke="#A1887F" strokeWidth="1.2" opacity="0.5" />
      {/* Cassava bark texture */}
      <Path d="M48 12H52" stroke="#8D6E63" strokeWidth="0.5" opacity="0.3" />
      <Path d="M48 18H52" stroke="#8D6E63" strokeWidth="0.5" opacity="0.3" />
      <Path d="M48 24H52" stroke="#8D6E63" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Yam piece - right side */}
    <G>
      <Path
        d="M58 14C58 14 54 18 56 26C58 34 62 34 62 30C62 24 62 14 58 14Z"
        fill="url(#tuberYam)"
      />
      {/* Yam texture */}
      <Ellipse cx="58" cy="24" rx="2" ry="3" fill="#4E342E" opacity="0.3" />
    </G>
    
    {/* Ginger root - bottom left */}
    <G>
      {/* Main ginger body */}
      <Ellipse cx="14" cy="56" rx="8" ry="5" fill="url(#tuberGinger)" />
      {/* Ginger knobs */}
      <Ellipse cx="6" cy="54" rx="5" ry="3.5" fill="url(#tuberGinger)" />
      <Ellipse cx="20" cy="60" rx="4" ry="5" fill="url(#tuberGinger)" transform="rotate(-25 20 60)" />
      <Ellipse cx="8" cy="60" rx="3" ry="4" fill="url(#tuberGinger)" transform="rotate(20 8 60)" />
      {/* Ginger texture lines */}
      <Path d="M10 54C10 54 14 52 16 54" stroke="#FF8F00" strokeWidth="0.8" opacity="0.4" />
      <Path d="M12 58C12 58 14 56 18 58" stroke="#FF8F00" strokeWidth="0.6" opacity="0.3" />
    </G>
  </Svg>
);

export default TubersIllustration;
