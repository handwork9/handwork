import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic locust beans (Iru/Dawadawa) - fermented seasoning
const LocustBeansIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="locustBeanFresh" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="50%" stopColor="#4E342E" />
        <Stop offset="100%" stopColor="#3E2723" />
      </RadialGradient>
      <RadialGradient id="locustBeanDark" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#3E2723" />
        <Stop offset="50%" stopColor="#2E1F1A" />
        <Stop offset="100%" stopColor="#1B0F0A" />
      </RadialGradient>
      <LinearGradient id="locustPod" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#6D4C41" />
        <Stop offset="50%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#4E342E" />
      </LinearGradient>
      <LinearGradient id="calabashBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFB74D" />
        <Stop offset="30%" stopColor="#FFA726" />
        <Stop offset="70%" stopColor="#FB8C00" />
        <Stop offset="100%" stopColor="#EF6C00" />
      </LinearGradient>
    </Defs>
    
    {/* Calabash bowl for fermented beans */}
    <G>
      <Path
        d="M10 38C8 34 12 30 32 30C52 30 56 34 54 38L52 56C52 60 44 62 32 62C20 62 12 60 12 56L10 38Z"
        fill="url(#calabashBowl)"
      />
      {/* Bowl rim */}
      <Ellipse cx="32" cy="30" rx="22" ry="5" fill="#FFB74D" />
      <Ellipse cx="32" cy="30" rx="20" ry="4" fill="#FFA726" />
      {/* Bowl texture */}
      <Path d="M16 40C24 38 40 38 48 40" stroke="#E65100" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Fermented locust beans (iru) in bowl - dark sticky mass */}
    <G>
      <Ellipse cx="32" cy="34" rx="16" ry="4" fill="url(#locustBeanDark)" />
      {/* Texture - individual beans visible in mass */}
      <Circle cx="24" cy="34" r="2" fill="#3E2723" />
      <Circle cx="32" cy="32" r="2.5" fill="#4E342E" />
      <Circle cx="40" cy="34" r="2" fill="#3E2723" />
      <Circle cx="28" cy="36" r="1.8" fill="#4E342E" />
      <Circle cx="36" cy="36" r="1.8" fill="#3E2723" />
      {/* Glossy fermented look */}
      <Ellipse cx="30" cy="32" rx="3" ry="1" fill="#5D4037" opacity="0.4" />
    </G>
    
    {/* Locust bean pod */}
    <G>
      <Path
        d="M2 16C0 12 4 6 14 4C24 2 36 6 40 14C42 20 38 26 28 28C18 30 6 26 2 20C0 18 0 16 2 16Z"
        fill="url(#locustPod)"
      />
      {/* Pod segments showing beans */}
      <Ellipse cx="10" cy="14" rx="4" ry="5" fill="#5D4037" />
      <Ellipse cx="20" cy="16" rx="4" ry="5" fill="#6D4C41" />
      <Ellipse cx="30" cy="18" rx="4" ry="5" fill="#5D4037" />
      {/* Pod seam */}
      <Path d="M6 10C14 14 28 18 38 18" stroke="#3E2723" strokeWidth="0.8" opacity="0.5" />
      {/* Highlight */}
      <Path d="M8 12C14 10 24 12 32 16" stroke="#8D6E63" strokeWidth="1.5" opacity="0.3" />
    </G>
    
    {/* Individual dried beans */}
    <G>
      <Circle cx="48" cy="20" r="4" fill="url(#locustBeanFresh)" />
      <Circle cx="50" cy="18" r="1" fill="#6D4C41" opacity="0.4" />
      
      <Circle cx="56" cy="28" r="3.5" fill="url(#locustBeanFresh)" />
      
      <Circle cx="52" cy="38" r="4" fill="url(#locustBeanDark)" />
      
      <Circle cx="58" cy="46" r="3.5" fill="url(#locustBeanDark)" />
      <Circle cx="60" cy="44" r="0.8" fill="#4E342E" opacity="0.4" />
    </G>
    
    {/* Scattered fermented beans */}
    <G>
      <Circle cx="6" cy="50" r="3" fill="url(#locustBeanDark)" />
      <Circle cx="10" cy="56" r="2.5" fill="url(#locustBeanDark)" />
      <Circle cx="54" cy="58" r="2.5" fill="url(#locustBeanDark)" />
    </G>
    
    {/* Open pod showing beans */}
    <G>
      <Path
        d="M44 6C42 4 46 0 52 2C58 4 62 10 60 14C58 18 52 18 48 14C46 12 44 10 44 6Z"
        fill="url(#locustPod)"
      />
      {/* Beans visible inside */}
      <Circle cx="50" cy="8" r="3" fill="url(#locustBeanFresh)" />
      <Circle cx="56" cy="10" r="2.5" fill="url(#locustBeanFresh)" />
      {/* Pod edge */}
      <Path d="M46 8C50 6 56 8 60 12" stroke="#4E342E" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Aromatic wavy lines (to show fermented aroma) */}
    <G opacity="0.3">
      <Path d="M28 26C30 24 32 26 34 24" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" />
      <Path d="M30 22C32 20 34 22 36 20" stroke="#8D6E63" strokeWidth="0.8" strokeLinecap="round" />
    </G>
  </Svg>
);

export default LocustBeansIllustration;
