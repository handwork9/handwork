import React from 'react';
import Svg, { Path, Rect, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic meat illustration - steak with bone, sausages
const MeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#D32F2F' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Steak gradients */}
      <RadialGradient id="meatSteakMain" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="50%" stopColor="#D32F2F" />
        <Stop offset="100%" stopColor="#B71C1C" />
      </RadialGradient>
      <LinearGradient id="meatFatStripe" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFEBEE" />
        <Stop offset="100%" stopColor="#FFCDD2" />
      </LinearGradient>
      
      {/* Bone gradients */}
      <LinearGradient id="meatBoneMain" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#FAFAFA" />
        <Stop offset="100%" stopColor="#D7CCC8" />
      </LinearGradient>
      
      {/* Sausage gradients */}
      <LinearGradient id="meatSausage" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="30%" stopColor="#A1887F" />
        <Stop offset="70%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#4E342E" />
      </LinearGradient>
    </Defs>
    
    {/* T-bone steak */}
    <G>
      {/* Main steak body */}
      <Path
        d="M8 26C6 30 6 42 12 48C18 54 32 56 42 50C50 44 52 34 48 26C44 18 28 14 18 18C12 20 8 22 8 26Z"
        fill="url(#meatSteakMain)"
      />
      
      {/* Fat marbling lines */}
      <Path
        d="M14 32C12 36 14 44 20 48C26 52 34 50 38 44"
        stroke="url(#meatFatStripe)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.8"
      />
      <Path d="M18 38C22 36 28 38 32 42" stroke="#FFCDD2" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <Path d="M24 30C28 32 32 30 36 32" stroke="#FFCDD2" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
      
      {/* Fat marbling spots */}
      <Ellipse cx="22" cy="36" rx="3" ry="2" fill="#FFEBEE" opacity="0.7" />
      <Ellipse cx="32" cy="32" rx="2.5" ry="3" fill="#FFEBEE" opacity="0.6" />
      <Ellipse cx="28" cy="44" rx="2" ry="1.5" fill="#FFEBEE" opacity="0.5" />
      <Ellipse cx="18" cy="42" rx="1.5" ry="2" fill="#FFEBEE" opacity="0.5" />
      
      {/* Grill marks */}
      <Path d="M14 28L38 46" stroke="#B71C1C" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <Path d="M10 36L34 52" stroke="#B71C1C" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      <Path d="M20 22L42 38" stroke="#B71C1C" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
    </G>
    
    {/* T-bone */}
    <G>
      {/* Bone shaft */}
      <Path
        d="M46 18C50 14 56 16 56 22C56 26 52 28 52 32C52 36 56 38 56 42C56 48 50 50 46 46"
        stroke="url(#meatBoneMain)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Bone ends */}
      <Circle cx="56" cy="22" r="5" fill="url(#meatBoneMain)" />
      <Circle cx="56" cy="42" r="5" fill="url(#meatBoneMain)" />
      {/* Bone highlights */}
      <Circle cx="54" cy="20" r="1.5" fill="#FFFFFF" opacity="0.5" />
      <Circle cx="54" cy="40" r="1.5" fill="#FFFFFF" opacity="0.5" />
      {/* Bone marrow center */}
      <Circle cx="56" cy="22" r="2" fill="#BCAAA4" opacity="0.4" />
      <Circle cx="56" cy="42" r="2" fill="#BCAAA4" opacity="0.4" />
    </G>
    
    {/* Small sausages - bottom corner */}
    <G>
      <Path
        d="M4 56C4 56 6 52 12 52C18 52 20 56 20 56"
        stroke="url(#meatSausage)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Path
        d="M8 60C8 60 10 56 16 56C22 56 24 60 24 60"
        stroke="url(#meatSausage)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Sausage links */}
      <Path d="M12 50L12 54" stroke="#5D4037" strokeWidth="1" opacity="0.4" />
      <Path d="M16 54L16 58" stroke="#5D4037" strokeWidth="1" opacity="0.4" />
    </G>
  </Svg>
);

export default MeatIllustration;
