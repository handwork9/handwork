import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic chicken meat - whole roasted chicken
const ChickenMeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="chickenSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="30%" stopColor="#FFB74D" />
        <Stop offset="70%" stopColor="#FFA726" />
        <Stop offset="100%" stopColor="#FB8C00" />
      </LinearGradient>
      <LinearGradient id="goldenBrown" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#F57C00" />
        <Stop offset="50%" stopColor="#EF6C00" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <LinearGradient id="chickenMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFECB3" />
        <Stop offset="50%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </LinearGradient>
      <LinearGradient id="servingPlate" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ECEFF1" />
        <Stop offset="50%" stopColor="#CFD8DC" />
        <Stop offset="100%" stopColor="#B0BEC5" />
      </LinearGradient>
      <LinearGradient id="drumstickBone" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
    </Defs>
    
    {/* Serving plate */}
    <G>
      <Ellipse cx="32" cy="54" rx="28" ry="8" fill="url(#servingPlate)" />
      <Ellipse cx="32" cy="52" rx="24" ry="5" fill="#ECEFF1" />
      {/* Plate shine */}
      <Path d="M14 52C20 50 28 52 36 50" stroke="#FFFFFF" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Whole roasted chicken body */}
    <G>
      {/* Main body */}
      <Ellipse cx="32" cy="36" rx="20" ry="16" fill="url(#chickenSkin)" />
      
      {/* Breast area - golden brown */}
      <Ellipse cx="32" cy="32" rx="14" ry="10" fill="url(#goldenBrown)" opacity="0.6" />
      
      {/* Crispy skin texture */}
      <Path d="M20 30C24 28 30 32 36 30C42 28 44 30 44 32" stroke="#E65100" strokeWidth="0.8" fill="none" opacity="0.4" />
      <Path d="M18 38C22 36 28 40 34 38C40 36 46 38 46 40" stroke="#E65100" strokeWidth="0.6" fill="none" opacity="0.3" />
      
      {/* Skin shine/glaze */}
      <Path d="M22 28C26 26 32 28 36 26" stroke="#FFE082" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <Circle cx="28" cy="34" r="2" fill="#FFECB3" opacity="0.4" />
    </G>
    
    {/* Left drumstick */}
    <G>
      <Path
        d="M14 44C10 46 6 52 8 56C10 58 14 58 18 56C20 54 20 50 18 46L14 44Z"
        fill="url(#chickenSkin)"
      />
      {/* Bone end */}
      <Path d="M8 56L4 60" stroke="url(#drumstickBone)" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="4" cy="60" r="2" fill="#D7CCC8" />
      {/* Skin texture */}
      <Path d="M12 48C14 50 16 52 16 54" stroke="#FB8C00" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Right drumstick */}
    <G>
      <Path
        d="M50 44C54 46 58 52 56 56C54 58 50 58 46 56C44 54 44 50 46 46L50 44Z"
        fill="url(#chickenSkin)"
      />
      {/* Bone end */}
      <Path d="M56 56L60 60" stroke="url(#drumstickBone)" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="60" cy="60" r="2" fill="#D7CCC8" />
      {/* Skin texture */}
      <Path d="M52 48C50 50 48 52 48 54" stroke="#FB8C00" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Wings tucked */}
    <G>
      <Ellipse cx="18" cy="34" rx="6" ry="4" fill="url(#goldenBrown)" />
      <Ellipse cx="46" cy="34" rx="6" ry="4" fill="url(#goldenBrown)" />
    </G>
    
    {/* Herbs garnish */}
    <G>
      {/* Rosemary sprig */}
      <Path d="M24 48L28 44" stroke="#4CAF50" strokeWidth="1" />
      <Path d="M25 47C26 46 28 46 28 48C28 49 26 49 25 48Z" fill="#66BB6A" />
      <Path d="M27 45C28 44 30 44 30 46C30 47 28 47 27 46Z" fill="#81C784" />
      
      {/* Lemon slice */}
      <Circle cx="42" cy="50" r="4" fill="#FFF59D" />
      <Circle cx="42" cy="50" r="3" fill="#FFEE58" />
      <Path d="M42 47V53M39 50H45" stroke="#FBC02D" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default ChickenMeatIllustration;
