import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic rice in bowl illustration
const RiceIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="bowlRealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ECEFF1" />
        <Stop offset="50%" stopColor="#CFD8DC" />
        <Stop offset="100%" stopColor="#90A4AE" />
      </LinearGradient>
      <RadialGradient id="riceGrainReal" cx="30%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#FFF8E1" />
        <Stop offset="100%" stopColor="#F5F5DC" />
      </RadialGradient>
      <LinearGradient id="chopstickReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
    </Defs>
    
    {/* Bowl shadow */}
    <Ellipse cx="32" cy="60" rx="20" ry="3" fill="#263238" opacity="0.15" />
    
    {/* Bowl body */}
    <Path
      d="M6 34C6 34 6 48 14 54C22 60 42 60 50 54C58 48 58 34 58 34L6 34Z"
      fill="url(#bowlRealGrad)"
    />
    {/* Bowl rim */}
    <Ellipse cx="32" cy="34" rx="26" ry="7" fill="#CFD8DC" />
    <Ellipse cx="32" cy="33" rx="24" ry="5.5" fill="#ECEFF1" />
    
    {/* Bowl interior shadow */}
    <Ellipse cx="32" cy="40" rx="18" ry="5" fill="#B0BEC5" opacity="0.3" />
    
    {/* Rice pile base */}
    <Ellipse cx="32" cy="32" rx="20" ry="9" fill="#FAFAFA" />
    <Ellipse cx="32" cy="30" rx="18" ry="7" fill="url(#riceGrainReal)" />
    
    {/* Individual rice grains on top - scattered realistically */}
    <G>
      {/* Top layer grains */}
      <Ellipse cx="22" cy="26" rx="3.5" ry="1.3" fill="#FFFEF7" transform="rotate(-25 22 26)" />
      <Ellipse cx="30" cy="24" rx="3.5" ry="1.3" fill="#FFF8E1" transform="rotate(8 30 24)" />
      <Ellipse cx="38" cy="25" rx="3.5" ry="1.3" fill="#FFFEF7" transform="rotate(20 38 25)" />
      <Ellipse cx="44" cy="27" rx="3.2" ry="1.2" fill="#FFF8E1" transform="rotate(35 44 27)" />
      <Ellipse cx="18" cy="28" rx="3" ry="1.1" fill="#FFFDE7" transform="rotate(-35 18 28)" />
      
      {/* Middle layer */}
      <Ellipse cx="26" cy="29" rx="3.2" ry="1.2" fill="#FFF8E1" transform="rotate(-12 26 29)" />
      <Ellipse cx="34" cy="28" rx="3.5" ry="1.3" fill="#FFFEF7" transform="rotate(15 34 28)" />
      <Ellipse cx="40" cy="30" rx="3" ry="1.1" fill="#FFFDE7" transform="rotate(28 40 30)" />
      <Ellipse cx="20" cy="31" rx="2.8" ry="1" fill="#FFF8E1" transform="rotate(-30 20 31)" />
      
      {/* Lower visible grains */}
      <Ellipse cx="28" cy="32" rx="3" ry="1.1" fill="#FFF3E0" transform="rotate(-5 28 32)" />
      <Ellipse cx="36" cy="32" rx="3" ry="1.1" fill="#FFFDE7" transform="rotate(10 36 32)" />
      
      {/* Grain highlights */}
      <Circle cx="23" cy="25" r="0.6" fill="#FFFFFF" opacity="0.6" />
      <Circle cx="31" cy="23" r="0.5" fill="#FFFFFF" opacity="0.5" />
      <Circle cx="39" cy="24" r="0.5" fill="#FFFFFF" opacity="0.5" />
    </G>
    
    {/* Chopsticks */}
    <G>
      <Path
        d="M44 6L36 28"
        stroke="url(#chopstickReal)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M50 8L40 28"
        stroke="url(#chopstickReal)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Chopstick highlights */}
      <Path d="M45 7L38 26" stroke="#BCAAA4" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <Path d="M51 9L42 26" stroke="#BCAAA4" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
    </G>
    
    {/* Steam wisps */}
    <G opacity="0.35">
      <Path d="M20 22C20 18 22 14 20 10" stroke="#90A4AE" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Path d="M28 20C28 16 26 12 28 8" stroke="#B0BEC5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Path d="M36 18C36 14 38 10 36 6" stroke="#90A4AE" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Path d="M24 18C24 14 22 10 24 6" stroke="#CFD8DC" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <Path d="M32 20C32 16 34 12 32 8" stroke="#CFD8DC" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </G>
  </Svg>
);

export default RiceIllustration;
