import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic vegetables illustration - tomato, carrot, pepper, leafy greens
const VegetablesIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#4CAF50' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="tomatoGrad" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#FF6B6B" />
        <Stop offset="50%" stopColor="#E53935" />
        <Stop offset="100%" stopColor="#C62828" />
      </RadialGradient>
      <LinearGradient id="carrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A50" />
        <Stop offset="50%" stopColor="#FF6D00" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <RadialGradient id="pepperGrad" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="50%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </RadialGradient>
      <LinearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="50%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    
    {/* Leafy green (spinach/lettuce) */}
    <G>
      <Path
        d="M8 28C6 22 10 14 18 12C26 10 32 16 30 24C28 32 20 36 12 34C8 32 6 30 8 28Z"
        fill="url(#leafGrad)"
      />
      <Path d="M12 20C16 18 22 20 26 24" stroke="#2E7D32" strokeWidth="0.8" opacity="0.5" />
      <Path d="M10 26C14 24 20 26 24 28" stroke="#2E7D32" strokeWidth="0.6" opacity="0.4" />
      {/* Leaf vein */}
      <Path d="M16 14L18 30" stroke="#388E3C" strokeWidth="0.8" opacity="0.4" />
    </G>
    
    {/* Tomato */}
    <G>
      <Circle cx="42" cy="38" r="14" fill="url(#tomatoGrad)" />
      {/* Tomato segments */}
      <Path d="M32 38C36 36 40 36 42 38" stroke="#C62828" strokeWidth="0.5" opacity="0.3" />
      <Path d="M42 38C44 36 48 36 52 38" stroke="#C62828" strokeWidth="0.5" opacity="0.3" />
      {/* Highlight */}
      <Ellipse cx="38" cy="32" rx="4" ry="3" fill="#FF8A80" opacity="0.4" />
      {/* Stem */}
      <Path
        d="M40 24C40 24 42 22 44 24C46 26 44 28 42 26C40 24 40 24 40 24Z"
        fill="#4CAF50"
      />
      <Path d="M38 26C38 22 40 20 42 18" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M46 26C48 24 46 20 44 18" stroke="#388E3C" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Carrot */}
    <G>
      <Path
        d="M52 8C52 8 48 20 50 32C51 40 54 48 54 48"
        stroke="url(#carrotGrad)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Carrot lines */}
      <Path d="M49 18L53 18" stroke="#E65100" strokeWidth="0.5" opacity="0.4" />
      <Path d="M49 26L54 26" stroke="#E65100" strokeWidth="0.5" opacity="0.4" />
      <Path d="M50 34L55 34" stroke="#E65100" strokeWidth="0.5" opacity="0.4" />
      {/* Carrot top greens */}
      <Path d="M52 8C50 4 48 2 46 4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <Path d="M52 8C52 4 54 2 56 2" stroke="#66BB6A" strokeWidth="2" strokeLinecap="round" />
      <Path d="M52 8C54 6 58 6 60 8" stroke="#388E3C" strokeWidth="1.5" strokeLinecap="round" />
    </G>
    
    {/* Yellow pepper */}
    <G>
      <Path
        d="M14 44C12 40 14 36 20 36C26 36 28 40 26 46C24 52 20 56 18 56C16 56 14 52 14 44Z"
        fill="url(#pepperGrad)"
      />
      {/* Pepper highlight */}
      <Ellipse cx="18" cy="42" rx="2" ry="4" fill="#FFEE58" opacity="0.4" />
      {/* Pepper stem */}
      <Path d="M18 36L18 32" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <Ellipse cx="18" cy="32" rx="3" ry="1.5" fill="#66BB6A" />
    </G>
  </Svg>
);

export default VegetablesIllustration;
