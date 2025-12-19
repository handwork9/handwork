import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic cocoyam/taro
const CocoyamIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cocoyamSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#795548" />
        <Stop offset="30%" stopColor="#6D4C41" />
        <Stop offset="70%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#4E342E" />
      </LinearGradient>
      <LinearGradient id="cocoyamFlesh" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="30%" stopColor="#F5F5F5" />
        <Stop offset="70%" stopColor="#EEEEEE" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </LinearGradient>
      <LinearGradient id="cocoyamPurple" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#E1BEE7" />
        <Stop offset="50%" stopColor="#CE93D8" />
        <Stop offset="100%" stopColor="#BA68C8" />
      </LinearGradient>
      <LinearGradient id="taroLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="50%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#4CAF50" />
      </LinearGradient>
    </Defs>
    
    {/* Main cocoyam corm - rounded barrel shape */}
    <G>
      <Path
        d="M14 20C10 14 14 6 26 4C38 2 50 8 54 18C58 28 54 42 44 48C34 54 20 52 14 42C10 34 10 28 14 20Z"
        fill="url(#cocoyamSkin)"
      />
      
      {/* Characteristic ring patterns */}
      <Path d="M18 14C28 10 44 14 52 22" stroke="#3E2723" strokeWidth="1.2" opacity="0.4" />
      <Path d="M14 26C26 22 44 26 52 32" stroke="#3E2723" strokeWidth="1" opacity="0.35" />
      <Path d="M16 38C28 34 42 38 48 42" stroke="#3E2723" strokeWidth="0.8" opacity="0.3" />
      
      {/* Root scars */}
      <Circle cx="20" cy="18" r="1.5" fill="#4E342E" opacity="0.5" />
      <Circle cx="36" cy="12" r="1.2" fill="#3E2723" opacity="0.4" />
      <Circle cx="48" cy="24" r="1.8" fill="#4E342E" opacity="0.5" />
      <Circle cx="42" cy="40" r="1.3" fill="#3E2723" opacity="0.4" />
      <Circle cx="24" cy="44" r="1.5" fill="#4E342E" opacity="0.4" />
      
      {/* Hairy roots */}
      <Path d="M52 26C56 24 58 26 56 28" stroke="#3E2723" strokeWidth="0.5" opacity="0.5" />
      <Path d="M50 36C54 34 56 36 54 38" stroke="#3E2723" strokeWidth="0.5" opacity="0.4" />
      
      {/* Highlight */}
      <Path d="M22 12C30 10 40 14 46 20" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </G>
    
    {/* Cut cocoyam showing flesh with purple streaks */}
    <G>
      <Path
        d="M2 44C0 40 4 34 12 34C20 34 26 40 24 46C22 52 14 54 8 52C4 50 0 48 2 44Z"
        fill="url(#cocoyamSkin)"
      />
      {/* White flesh */}
      <Ellipse cx="12" cy="44" rx="8" ry="7" fill="url(#cocoyamFlesh)" />
      {/* Purple veins - characteristic of cocoyam */}
      <Path d="M8 40L12 48" stroke="url(#cocoyamPurple)" strokeWidth="1.5" opacity="0.6" />
      <Path d="M12 40L16 48" stroke="url(#cocoyamPurple)" strokeWidth="1" opacity="0.5" />
      <Path d="M10 42L14 46" stroke="url(#cocoyamPurple)" strokeWidth="0.8" opacity="0.4" />
      {/* Skin ring */}
      <Ellipse cx="12" cy="44" rx="8" ry="7" fill="none" stroke="#5D4037" strokeWidth="1.5" />
    </G>
    
    {/* Small corm */}
    <G>
      <Ellipse cx="50" cy="56" rx="8" ry="6" fill="url(#cocoyamSkin)" />
      <Path d="M44 54C48 56 52 54 56 56" stroke="#3E2723" strokeWidth="0.5" opacity="0.3" />
      <Circle cx="48" cy="54" r="1" fill="#4E342E" opacity="0.4" />
    </G>
    
    {/* Taro leaf - characteristic heart/arrow shape */}
    <G>
      <Path
        d="M54 6C58 2 64 4 64 10C64 16 58 24 52 24C48 24 46 20 48 14C50 10 52 8 54 6Z"
        fill="url(#taroLeaf)"
      />
      <Path
        d="M48 14C46 18 44 20 42 18C42 14 46 10 48 14Z"
        fill="url(#taroLeaf)"
      />
      {/* Leaf veins */}
      <Path d="M54 8L54 22" stroke="#388E3C" strokeWidth="1" opacity="0.5" />
      <Path d="M54 12L60 16" stroke="#388E3C" strokeWidth="0.5" opacity="0.4" />
      <Path d="M54 14L48 18" stroke="#388E3C" strokeWidth="0.5" opacity="0.4" />
      {/* Stem */}
      <Path d="M52 24L48 32" stroke="#6D4C41" strokeWidth="2" strokeLinecap="round" />
    </G>
    
    {/* Root fibers */}
    <G opacity="0.4">
      <Path d="M26 50C28 52 30 50 32 52" stroke="#5D4037" strokeWidth="0.5" />
      <Path d="M36 48C38 50 40 48 42 50" stroke="#4E342E" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default CocoyamIllustration;
