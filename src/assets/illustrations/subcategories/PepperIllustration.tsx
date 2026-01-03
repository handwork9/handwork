import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic red pepper/chili illustration
const PepperIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Photorealistic red pepper gradient */}
      <RadialGradient id="pepperBodyReal" cx="30%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FF5722" />
        <Stop offset="30%" stopColor="#F4511E" />
        <Stop offset="60%" stopColor="#E64A19" />
        <Stop offset="100%" stopColor="#BF360C" />
      </RadialGradient>
      <RadialGradient id="pepperShineReal" cx="20%" cy="25%" r="35%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="50%" stopColor="#FFAB91" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#FFAB91" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="pepperStemReal" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#2E7D32" />
        <Stop offset="50%" stopColor="#43A047" />
        <Stop offset="100%" stopColor="#66BB6A" />
      </LinearGradient>
    </Defs>
    
    {/* Main pepper body - elongated bell/chili shape */}
    <Path
      d="M22 14C16 18 12 30 14 44C16 56 26 62 32 62C38 62 48 56 50 44C52 30 48 18 42 14C38 12 26 12 22 14Z"
      fill="url(#pepperBodyReal)"
    />
    
    {/* Pepper ridges/curves - natural crease lines */}
    <Path d="M20 22C18 32 20 44 24 54" stroke="#BF360C" strokeWidth="0.8" opacity="0.3" />
    <Path d="M44 22C46 32 44 44 40 54" stroke="#D84315" strokeWidth="0.8" opacity="0.25" />
    <Path d="M32 14C32 28 32 42 32 58" stroke="#BF360C" strokeWidth="0.5" opacity="0.2" />
    
    {/* Main glossy highlight */}
    <Path d="M26 18C24 28 26 42 28 54" stroke="#FFCCBC" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    <Ellipse cx="24" cy="28" rx="4" ry="8" fill="url(#pepperShineReal)" />
    
    {/* Secondary highlight */}
    <Circle cx="40" cy="24" r="2" fill="#FFFFFF" opacity="0.15" />
    
    {/* Bottom tip highlight */}
    <Ellipse cx="32" cy="58" rx="4" ry="2" fill="#D84315" opacity="0.3" />
    
    {/* Green stem and calyx */}
    <G>
      {/* Calyx (green top cap) */}
      <Ellipse cx="32" cy="14" rx="10" ry="4" fill="#388E3C" />
      <Ellipse cx="32" cy="13" rx="7" ry="2.5" fill="#43A047" />
      
      {/* Stem */}
      <Path d="M32 14L32 6" stroke="url(#pepperStemReal)" strokeWidth="4" strokeLinecap="round" />
      <Path d="M32 6L30 2" stroke="#66BB6A" strokeWidth="2" strokeLinecap="round" />
      
      {/* Calyx lobes */}
      <Path d="M24 14C22 12 20 10 22 8C24 8 26 12 26 14" fill="#43A047" />
      <Path d="M40 14C42 12 44 10 42 8C40 8 38 12 38 14" fill="#43A047" />
      <Path d="M28 12C28 10 30 8 32 8C34 8 36 10 36 12" fill="#66BB6A" />
    </G>
    
    {/* Small texture dots */}
    <Circle cx="28" cy="36" r="0.8" fill="#BF360C" opacity="0.2" />
    <Circle cx="36" cy="44" r="0.6" fill="#BF360C" opacity="0.2" />
    <Circle cx="30" cy="50" r="0.7" fill="#BF360C" opacity="0.2" />
  </Svg>
);

export default PepperIllustration;
