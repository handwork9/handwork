import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic groundnut/peanut oil - golden yellow oil
const GroundnutOilIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="groundnutOilColor" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="30%" stopColor="#FFCA28" />
        <Stop offset="60%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      <LinearGradient id="groundnutBottle" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
      </LinearGradient>
      <LinearGradient id="groundnutCap" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#C62828" />
        <Stop offset="50%" stopColor="#B71C1C" />
        <Stop offset="100%" stopColor="#8B0000" />
      </LinearGradient>
      <RadialGradient id="groundnutShine" cx="25%" cy="25%" r="60%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="28" cy="62" rx="12" ry="2" fill="#5D4037" opacity="0.2" />
    
    {/* Main bottle - classic oil bottle shape */}
    <G>
      {/* Bottle body */}
      <Path
        d="M16 24C16 20 18 18 22 16L22 12C22 10 24 8 28 8C32 8 34 10 34 12L34 16C38 18 40 20 40 24L40 56C40 60 36 62 28 62C20 62 16 60 16 56L16 24Z"
        fill="url(#groundnutOilColor)"
      />
      
      {/* Glass effect */}
      <Path
        d="M20 26C20 22 22 20 24 18L24 56C20 56 20 54 20 52L20 26Z"
        fill="url(#groundnutBottle)"
      />
      
      {/* Oil level surface */}
      <Ellipse cx="28" cy="18" rx="8" ry="2" fill="#FFE082" opacity="0.7" />
      
      {/* Shine */}
      <Path
        d="M22 28L22 48C22 46 24 28 22 28Z"
        fill="url(#groundnutShine)"
      />
    </G>
    
    {/* Bottle neck */}
    <Path
      d="M24 8L24 4C24 2 26 0 28 0C30 0 32 2 32 4L32 8"
      fill="#FFCA28"
    />
    
    {/* Red cap */}
    <Path
      d="M23 4L23 0C23 -2 25 -4 28 -4C31 -4 33 -2 33 0L33 4C33 6 31 6 28 6C25 6 23 6 23 4Z"
      fill="url(#groundnutCap)"
    />
    <Ellipse cx="28" cy="0" rx="5" ry="2" fill="#D32F2F" />
    
    {/* Label */}
    <G>
      <Path
        d="M20 36L36 36L36 52L20 52Z"
        fill="#FFF8E1"
        opacity="0.85"
      />
      {/* Peanut icon */}
      <Ellipse cx="26" cy="42" rx="3" ry="4" fill="#D4A574" />
      <Ellipse cx="30" cy="42" rx="3" ry="4" fill="#C4956A" />
      <Path d="M26 38L26 46" stroke="#8B6914" strokeWidth="0.5" opacity="0.5" />
      <Path d="M30 38L30 46" stroke="#8B6914" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Peanuts beside bottle */}
    <G>
      <Ellipse cx="50" cy="54" rx="5" ry="7" fill="#D4A574" />
      <Ellipse cx="56" cy="56" rx="4" ry="6" fill="#C4956A" />
      <Path d="M50 48L50 60" stroke="#8B6914" strokeWidth="0.5" opacity="0.4" />
      {/* Shell texture */}
      <Path d="M48 52C50 50 52 52 50 54" stroke="#A67B5B" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Oil drip */}
    <Path
      d="M44 30C46 32 46 36 44 38C42 36 42 32 44 30Z"
      fill="url(#groundnutOilColor)"
      opacity="0.7"
    />
  </Svg>
);

export default GroundnutOilIllustration;
