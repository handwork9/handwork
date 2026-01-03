import React from 'react';
import Svg, { Path, Ellipse, G, Circle, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic herbs & spices illustration - basil plant, chili peppers, garlic, peppercorns
const HerbsSpicesIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#66BB6A' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Terracotta pot gradient */}
      <LinearGradient id="herbPot" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="30%" stopColor="#A1887F" />
        <Stop offset="70%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      
      {/* Basil leaf gradient */}
      <LinearGradient id="basilLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="50%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#388E3C" />
      </LinearGradient>
      
      {/* Chili pepper gradient */}
      <LinearGradient id="chiliRed" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF5252" />
        <Stop offset="50%" stopColor="#E53935" />
        <Stop offset="100%" stopColor="#B71C1C" />
      </LinearGradient>
      
      {/* Orange chili */}
      <LinearGradient id="chiliOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFAB40" />
        <Stop offset="50%" stopColor="#FF6D00" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      
      {/* Garlic gradient */}
      <RadialGradient id="garlicBulb" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="50%" stopColor="#EEEEEE" />
        <Stop offset="100%" stopColor="#BDBDBD" />
      </RadialGradient>
    </Defs>
    
    {/* Terracotta pot */}
    <G>
      <Path d="M18 42H46L42 58H22L18 42Z" fill="url(#herbPot)" />
      <Path d="M16 38H48V42H16V38Z" fill="#A1887F" />
      {/* Pot rim highlight */}
      <Path d="M16 38H48V39H16V38Z" fill="#BCAAA4" opacity="0.6" />
      {/* Soil */}
      <Ellipse cx="32" cy="42" rx="14" ry="3" fill="#5D4037" />
      <Ellipse cx="30" cy="41" rx="6" ry="1.5" fill="#6D4C41" opacity="0.5" />
    </G>
    
    {/* Basil plant */}
    <G>
      {/* Main stem */}
      <Path d="M32 42V22" stroke="#33691E" strokeWidth="2.5" strokeLinecap="round" />
      {/* Side stems */}
      <Path d="M32 30L26 24" stroke="#33691E" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M32 30L38 24" stroke="#33691E" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M32 36L24 32" stroke="#33691E" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M32 36L40 32" stroke="#33691E" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Top leaves */}
      <Path d="M32 22C29 18 25 20 25 24C25 28 29 30 32 28" fill="url(#basilLeaf)" />
      <Path d="M32 22C35 18 39 20 39 24C39 28 35 30 32 28" fill="url(#basilLeaf)" />
      {/* Leaf veins */}
      <Path d="M32 22L28 24" stroke="#388E3C" strokeWidth="0.4" opacity="0.4" />
      <Path d="M32 22L36 24" stroke="#388E3C" strokeWidth="0.4" opacity="0.4" />
      
      {/* Middle leaves */}
      <Path d="M26 24C22 22 18 26 20 30C22 34 26 32 28 30" fill="url(#basilLeaf)" />
      <Path d="M38 24C42 22 46 26 44 30C42 34 38 32 36 30" fill="url(#basilLeaf)" />
      
      {/* Lower leaves */}
      <Path d="M24 32C20 30 16 34 18 38C20 42 24 40 26 38" fill="#81C784" />
      <Path d="M40 32C44 30 48 34 46 38C44 42 40 40 38 38" fill="#81C784" />
    </G>
    
    {/* Red chili pepper - left */}
    <G>
      <Path
        d="M6 28C6 28 4 22 6 16C8 10 12 12 12 18C12 24 10 30 6 28Z"
        fill="url(#chiliRed)"
      />
      {/* Chili highlight */}
      <Path d="M8 18C8 16 9 14 9 14" stroke="#FF8A80" strokeWidth="1" opacity="0.5" />
      {/* Stem */}
      <Path d="M7 15C7 12 9 10 9 10" stroke="#33691E" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M9 10L7 8" stroke="#33691E" strokeWidth="1" strokeLinecap="round" />
      <Path d="M9 10L11 9" stroke="#33691E" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Orange chili pepper - right */}
    <G>
      <Path
        d="M56 32C56 32 54 26 56 20C58 14 62 16 62 22C62 28 60 34 56 32Z"
        fill="url(#chiliOrange)"
      />
      {/* Chili highlight */}
      <Path d="M58 22C58 20 59 18 59 18" stroke="#FFCC80" strokeWidth="1" opacity="0.5" />
      {/* Stem */}
      <Path d="M57 19C57 16 59 14 59 14" stroke="#33691E" strokeWidth="1.5" strokeLinecap="round" />
    </G>
    
    {/* Garlic bulb - bottom right */}
    <G>
      {/* Garlic body */}
      <Ellipse cx="54" cy="52" rx="7" ry="8" fill="url(#garlicBulb)" />
      {/* Garlic clove lines */}
      <Path d="M50 52C50 48 54 46 54 52" stroke="#E0E0E0" strokeWidth="0.8" />
      <Path d="M52 52C52 49 54 48 54 52" stroke="#E0E0E0" strokeWidth="0.8" />
      <Path d="M56 52C56 49 54 48 54 52" stroke="#E0E0E0" strokeWidth="0.8" />
      <Path d="M58 52C58 48 54 46 54 52" stroke="#E0E0E0" strokeWidth="0.8" />
      {/* Garlic top/stem */}
      <Path d="M54 44V40" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" />
      <Path d="M52 44L54 46L56 44" stroke="#BDBDBD" strokeWidth="1" />
    </G>
    
    {/* Scattered peppercorns */}
    <Circle cx="8" cy="56" r="1.5" fill="#4E342E" />
    <Circle cx="12" cy="58" r="1.2" fill="#3E2723" />
    <Circle cx="10" cy="60" r="1" fill="#5D4037" />
    <Circle cx="60" cy="58" r="1.3" fill="#4E342E" />
    <Circle cx="58" cy="60" r="1" fill="#3E2723" />
  </Svg>
);

export default HerbsSpicesIllustration;
