import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic poultry illustration - whole chicken, drumstick, and feathers
const PoultryIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FF8A65' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="chickenBody" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="40%" stopColor="#FFB74D" />
        <Stop offset="80%" stopColor="#FFA726" />
        <Stop offset="100%" stopColor="#F57C00" />
      </RadialGradient>
      <RadialGradient id="chickenHead" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFAB91" />
        <Stop offset="50%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#E64A19" />
      </RadialGradient>
      <LinearGradient id="combGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="50%" stopColor="#E53935" />
        <Stop offset="100%" stopColor="#C62828" />
      </LinearGradient>
      <LinearGradient id="beakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      <LinearGradient id="drumstickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="50%" stopColor="#D4A574" />
        <Stop offset="100%" stopColor="#A67B5B" />
      </LinearGradient>
      <LinearGradient id="legGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
    </Defs>
    
    {/* Live chicken */}
    <G>
      {/* Chicken body */}
      <Ellipse cx="28" cy="38" rx="16" ry="12" fill="url(#chickenBody)" />
      {/* Body highlight */}
      <Ellipse cx="24" cy="34" rx="6" ry="4" fill="#FFE0B2" opacity="0.4" />
      
      {/* Wing */}
      <Path
        d="M20 34C18 32 16 34 16 38C16 42 20 46 26 46C28 44 26 40 24 38C22 36 22 34 20 34Z"
        fill="#FFA726"
      />
      {/* Wing feather lines */}
      <Path d="M18 38C20 38 22 40 24 42" stroke="#F57C00" strokeWidth="0.6" opacity="0.4" />
      <Path d="M18 40C20 40 22 42 24 44" stroke="#F57C00" strokeWidth="0.5" opacity="0.3" />
      
      {/* Chicken head */}
      <Circle cx="42" cy="26" r="8" fill="url(#chickenHead)" />
      {/* Head highlight */}
      <Circle cx="40" cy="24" r="2" fill="#FFCCBC" opacity="0.5" />
      
      {/* Comb */}
      <Path
        d="M40 18C40 16 42 14 44 16C44 14 46 12 48 14C48 12 50 12 50 16L48 20H42L40 18Z"
        fill="url(#combGrad)"
      />
      
      {/* Beak */}
      <Path
        d="M48 26L56 28L48 30L48 26Z"
        fill="url(#beakGrad)"
      />
      
      {/* Eye */}
      <Circle cx="44" cy="24" r="2.5" fill="#FFFFFF" />
      <Circle cx="45" cy="23" r="1.5" fill="#212121" />
      <Circle cx="45.5" cy="22.5" r="0.5" fill="#FFFFFF" />
      
      {/* Wattle */}
      <Ellipse cx="46" cy="32" rx="2" ry="3.5" fill="url(#combGrad)" />
      
      {/* Tail feathers */}
      <G>
        <Path d="M12 34C8 30 6 26 8 24" stroke="#FF8A65" strokeWidth="3" strokeLinecap="round" />
        <Path d="M12 36C8 34 4 32 4 28" stroke="#FFAB91" strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M12 38C8 38 4 36 2 32" stroke="#FF8A65" strokeWidth="2" strokeLinecap="round" />
      </G>
      
      {/* Legs */}
      <Path d="M24 48V54" stroke="url(#legGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M24 54L20 58" stroke="url(#legGrad)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M24 54L28 58" stroke="url(#legGrad)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M24 54L24 58" stroke="url(#legGrad)" strokeWidth="1.5" strokeLinecap="round" />
      
      <Path d="M34 48V54" stroke="url(#legGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M34 54L30 58" stroke="url(#legGrad)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M34 54L38 58" stroke="url(#legGrad)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M34 54L34 58" stroke="url(#legGrad)" strokeWidth="1.5" strokeLinecap="round" />
    </G>
    
    {/* Drumstick */}
    <G>
      <Ellipse cx="56" cy="50" rx="6" ry="8" fill="url(#drumstickGrad)" />
      {/* Drumstick highlight */}
      <Ellipse cx="54" cy="48" rx="2" ry="3" fill="#FFE0B2" opacity="0.4" />
      {/* Bone */}
      <Path d="M56 58L56 62" stroke="#EFEBE9" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="56" cy="62" r="2" fill="#EFEBE9" />
    </G>
    
    {/* Small feathers floating */}
    <G opacity="0.6">
      <Path d="M6 12C8 10 10 12 8 14C6 16 4 14 6 12Z" fill="#FFCC80" />
      <Path d="M58 8C60 6 62 8 60 10C58 12 56 10 58 8Z" fill="#FFAB91" />
    </G>
  </Svg>
);

export default PoultryIllustration;
