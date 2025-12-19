import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic shea butter - creamy solid in container
const SheaButterIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="sheaButterColor" cx="50%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFFEF5" />
        <Stop offset="30%" stopColor="#FFF9E6" />
        <Stop offset="60%" stopColor="#FFF3CD" />
        <Stop offset="100%" stopColor="#FFE9A0" />
      </RadialGradient>
      <LinearGradient id="sheaContainer" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="sheaLid" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="sheaNut" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="28" cy="60" rx="18" ry="3" fill="#5D4037" opacity="0.2" />
    
    {/* Wooden/clay container */}
    <G>
      {/* Container body */}
      <Path
        d="M8 28C8 24 12 22 28 22C44 22 48 24 48 28L48 54C48 58 44 60 28 60C12 60 8 58 8 54L8 28Z"
        fill="url(#sheaContainer)"
      />
      
      {/* Container rim */}
      <Ellipse cx="28" cy="22" rx="20" ry="4" fill="#8D6E63" />
      <Ellipse cx="28" cy="22" rx="18" ry="3" fill="#A1887F" />
      
      {/* Container texture */}
      <Path d="M12 30C16 28 40 28 44 30" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      <Path d="M10 40C18 38 38 38 46 40" stroke="#5D4037" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Shea butter inside container */}
    <G>
      <Ellipse cx="28" cy="24" rx="16" ry="3" fill="url(#sheaButterColor)" />
      
      {/* Butter texture - creamy swirls */}
      <Path d="M18 24C22 22 28 26 34 24C38 22 40 26 38 24" stroke="#FFE082" strokeWidth="1" opacity="0.5" />
      <Path d="M20 26C24 24 32 28 36 26" stroke="#FFF8E1" strokeWidth="0.8" opacity="0.4" />
      
      {/* Surface highlight */}
      <Ellipse cx="24" cy="23" rx="4" ry="1" fill="#FFFFFF" opacity="0.4" />
    </G>
    
    {/* Lid beside container */}
    <G>
      <Ellipse cx="54" cy="36" rx="8" ry="3" fill="url(#sheaLid)" />
      <Ellipse cx="54" cy="34" rx="7" ry="2.5" fill="#A1887F" />
      {/* Lid knob */}
      <Circle cx="54" cy="32" r="2" fill="#8D6E63" />
    </G>
    
    {/* Shea nuts */}
    <G>
      {/* Whole nut */}
      <Ellipse cx="54" cy="52" rx="5" ry="6" fill="url(#sheaNut)" />
      <Path d="M52 48L52 56" stroke="#4E342E" strokeWidth="0.5" opacity="0.4" />
      <Ellipse cx="52" cy="50" rx="1.5" ry="2" fill="#8D6E63" opacity="0.5" />
      
      {/* Cracked nut showing kernel */}
      <Path
        d="M58 48C60 46 64 48 64 52C64 56 60 58 58 56C56 54 56 50 58 48Z"
        fill="url(#sheaNut)"
      />
      <Path
        d="M60 50C62 52 62 54 60 54C58 54 58 52 60 50Z"
        fill="#FFF8E1"
      />
    </G>
    
    {/* Small butter chunk */}
    <G>
      <Path
        d="M4 44C2 42 4 38 8 38C12 38 14 42 12 46C10 48 6 48 4 44Z"
        fill="url(#sheaButterColor)"
      />
      {/* Chunk texture */}
      <Path d="M6 42C8 40 10 42 8 44" stroke="#FFE082" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Leaves (shea tree reference) */}
    <G opacity="0.7">
      <Path d="M44 14C48 12 52 14 50 18C48 20 44 18 44 14Z" fill="#81C784" />
      <Path d="M50 16C54 14 58 16 56 20C54 22 50 20 50 16Z" fill="#66BB6A" />
      <Path d="M48 16L52 18" stroke="#388E3C" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default SheaButterIllustration;
