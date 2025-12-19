import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// See All / Browse All Categories illustration - shopping basket with various items
const SeeAllIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#AF52DE'
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="basketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="30%" stopColor="#BCAAA4" />
        <Stop offset="70%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <RadialGradient id="tomatoMini" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FF6B6B" />
        <Stop offset="100%" stopColor="#E53935" />
      </RadialGradient>
      <RadialGradient id="orangeMini" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFB74D" />
        <Stop offset="100%" stopColor="#FF9800" />
      </RadialGradient>
      <RadialGradient id="appleMini" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </RadialGradient>
      <LinearGradient id="carrotMini" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A50" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <RadialGradient id="eggMini" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#FFE082" />
      </RadialGradient>
      <LinearGradient id="fishMini" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4FC3F7" />
        <Stop offset="100%" stopColor="#0288D1" />
      </LinearGradient>
      <LinearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#7C4DFF" />
        <Stop offset="100%" stopColor="#536DFE" />
      </LinearGradient>
    </Defs>
    
    {/* Basket */}
    <G>
      {/* Basket body */}
      <Path
        d="M8 30L4 56C4 60 12 62 32 62C52 62 60 60 60 56L56 30"
        fill="url(#basketGrad)"
      />
      {/* Basket rim */}
      <Ellipse cx="32" cy="30" rx="26" ry="6" fill="#BCAAA4" />
      <Ellipse cx="32" cy="30" rx="24" ry="5" fill="#D7CCC8" />
      {/* Basket weave pattern */}
      <Path d="M10 38C20 36 44 36 54 38" stroke="#8D6E63" strokeWidth="1" opacity="0.4" />
      <Path d="M8 46C22 44 42 44 56 46" stroke="#8D6E63" strokeWidth="1" opacity="0.35" />
      <Path d="M6 54C24 52 40 52 58 54" stroke="#8D6E63" strokeWidth="1" opacity="0.3" />
      {/* Vertical weave */}
      <Path d="M20 32L18 58" stroke="#8D6E63" strokeWidth="0.8" opacity="0.3" />
      <Path d="M32 30L32 60" stroke="#8D6E63" strokeWidth="0.8" opacity="0.3" />
      <Path d="M44 32L46 58" stroke="#8D6E63" strokeWidth="0.8" opacity="0.3" />
      {/* Basket handle */}
      <Path
        d="M18 30C18 16 26 8 32 8C38 8 46 16 46 30"
        stroke="#A1887F"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M20 30C20 18 27 12 32 12C37 12 44 18 44 30"
        stroke="#BCAAA4"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </G>
    
    {/* Items in basket */}
    <G>
      {/* Red tomato */}
      <Circle cx="18" cy="26" r="6" fill="url(#tomatoMini)" />
      <Path d="M18 20L18 18" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="16" cy="24" r="1.5" fill="#FF8A80" opacity="0.4" />
      
      {/* Orange */}
      <Circle cx="32" cy="24" r="7" fill="url(#orangeMini)" />
      <Circle cx="30" cy="22" r="2" fill="#FFE0B2" opacity="0.4" />
      <Circle cx="32" cy="18" r="1" fill="#4CAF50" />
      
      {/* Green apple */}
      <Circle cx="46" cy="26" r="6" fill="url(#appleMini)" />
      <Path d="M46 20L47 18" stroke="#5D4037" strokeWidth="1" strokeLinecap="round" />
      <Path d="M47 19C48 18 49 19 48 20" fill="#4CAF50" />
      <Circle cx="44" cy="24" r="1.5" fill="#A5D6A7" opacity="0.4" />
      
      {/* Carrot sticking out */}
      <Path d="M52 28C52 28 54 20 55 14" stroke="url(#carrotMini)" strokeWidth="4" strokeLinecap="round" />
      <Path d="M54 14C52 10 56 8 58 12" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M55 14C56 10 58 10 60 14" stroke="#66BB6A" strokeWidth="1" strokeLinecap="round" />
      
      {/* Egg */}
      <Ellipse cx="24" cy="34" rx="4" ry="5" fill="url(#eggMini)" />
      
      {/* Mini fish tail visible */}
      <Path d="M40 34L44 30L44 38L40 34Z" fill="url(#fishMini)" />
    </G>
    
    {/* "More" indicator - arrow circle */}
    <G>
      <Circle cx="54" cy="50" r="8" fill="url(#arrowGrad)" />
      <Path d="M50 50L56 50" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <Path d="M54 47L57 50L54 53" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </G>
    
    {/* Sparkles indicating variety */}
    <G opacity="0.7">
      <Path d="M6 12L8 16L10 12L8 8Z" fill="#FFD54F" />
      <Path d="M58 4L59 6L60 4L59 2Z" fill="#7C4DFF" />
      <Circle cx="4" cy="24" r="1.5" fill="#FF4081" />
    </G>
  </Svg>
);

export default SeeAllIllustration;
