import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic roasted chicken/whole chicken illustration
const ChickenIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="chickenBodyReal" cx="40%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#FFCCBC" />
        <Stop offset="30%" stopColor="#FFB74D" />
        <Stop offset="60%" stopColor="#F4A460" />
        <Stop offset="100%" stopColor="#D2691E" />
      </RadialGradient>
      <RadialGradient id="chickenGolden" cx="35%" cy="30%" r="60%">
        <Stop offset="0%" stopColor="#FFE0B2" />
        <Stop offset="50%" stopColor="#FFAB40" />
        <Stop offset="100%" stopColor="#E65100" />
      </RadialGradient>
      <LinearGradient id="plateReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ECEFF1" />
        <Stop offset="50%" stopColor="#CFD8DC" />
        <Stop offset="100%" stopColor="#B0BEC5" />
      </LinearGradient>
    </Defs>
    
    {/* Plate/platter */}
    <Ellipse cx="32" cy="56" rx="26" ry="6" fill="url(#plateReal)" />
    <Ellipse cx="32" cy="54" rx="22" ry="4" fill="#FAFAFA" />
    
    {/* Main roasted chicken body */}
    <Ellipse cx="32" cy="38" rx="18" ry="14" fill="url(#chickenBodyReal)" />
    
    {/* Golden crispy top */}
    <Path
      d="M16 34C18 26 26 22 32 22C38 22 46 26 48 34"
      stroke="url(#chickenGolden)"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    
    {/* Breast highlight - golden brown */}
    <Ellipse cx="28" cy="36" rx="8" ry="6" fill="#FFE0B2" opacity="0.4" />
    <Ellipse cx="36" cy="36" rx="7" ry="5" fill="#FFE0B2" opacity="0.35" />
    
    {/* Chicken legs */}
    <G>
      {/* Left drumstick */}
      <Path
        d="M14 42C10 44 6 50 8 54C12 56 16 52 18 46C20 42 16 40 14 42Z"
        fill="url(#chickenGolden)"
      />
      <Ellipse cx="8" cy="54" rx="3" ry="2" fill="#FFE0B2" />
      
      {/* Right drumstick */}
      <Path
        d="M50 42C54 44 58 50 56 54C52 56 48 52 46 46C44 42 48 40 50 42Z"
        fill="url(#chickenGolden)"
      />
      <Ellipse cx="56" cy="54" rx="3" ry="2" fill="#FFE0B2" />
    </G>
    
    {/* Crispy skin texture */}
    <Path d="M22 32C28 30 36 30 42 32" stroke="#D2691E" strokeWidth="0.5" opacity="0.4" />
    <Path d="M20 38C26 36 38 36 44 38" stroke="#D2691E" strokeWidth="0.5" opacity="0.35" />
    
    {/* Wings tucked */}
    <Path
      d="M18 38C16 36 14 34 14 36C14 40 18 44 22 42"
      fill="#F4A460"
    />
    <Path
      d="M46 38C48 36 50 34 50 36C50 40 46 44 42 42"
      fill="#F4A460"
    />
    
    {/* Garnish - herbs */}
    <G>
      <Path d="M12 52C14 50 16 50 18 52" stroke="#43A047" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M14 54C16 52 18 52 20 54" stroke="#66BB6A" strokeWidth="1" strokeLinecap="round" />
      <Path d="M46 52C48 50 50 50 52 52" stroke="#43A047" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M44 54C46 52 48 52 50 54" stroke="#66BB6A" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Steam wisps */}
    <G opacity="0.25">
      <Path d="M28 18C28 14 30 10 28 6" stroke="#90A4AE" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Path d="M36 16C36 12 38 8 36 4" stroke="#90A4AE" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </G>
  </Svg>
);

export default ChickenIllustration;
