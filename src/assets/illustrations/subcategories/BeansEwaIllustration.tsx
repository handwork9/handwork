import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic Nigerian beans (Ewa) - honey beans/brown beans
const BeansEwaIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="honeyBean" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#D4A574" />
        <Stop offset="40%" stopColor="#C4956A" />
        <Stop offset="80%" stopColor="#A67B5B" />
        <Stop offset="100%" stopColor="#8B6914" />
      </RadialGradient>
      <RadialGradient id="brownBean" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#5D4037" />
      </RadialGradient>
      <RadialGradient id="redBean" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#C62828" />
        <Stop offset="50%" stopColor="#B71C1C" />
        <Stop offset="100%" stopColor="#8B0000" />
      </RadialGradient>
      <LinearGradient id="clayPot" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="30%" stopColor="#8D6E63" />
        <Stop offset="70%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
    </Defs>
    
    {/* Clay pot */}
    <G>
      <Path
        d="M12 32C10 28 12 24 18 22L46 22C52 24 54 28 52 32L50 54C50 58 44 60 32 60C20 60 14 58 14 54L12 32Z"
        fill="url(#clayPot)"
      />
      {/* Pot rim */}
      <Ellipse cx="32" cy="22" rx="20" ry="4" fill="#8D6E63" />
      <Ellipse cx="32" cy="22" rx="18" ry="3" fill="#A1887F" />
      {/* Pot texture */}
      <Path d="M16 34C24 32 40 32 48 34" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Beans in pot */}
    <G>
      {/* Honey beans */}
      <Ellipse cx="24" cy="26" rx="5" ry="3.5" fill="url(#honeyBean)" />
      <Path d="M22 26L26 26" stroke="#8B6914" strokeWidth="0.5" opacity="0.4" />
      
      <Ellipse cx="40" cy="26" rx="5" ry="3.5" fill="url(#honeyBean)" />
      
      <Ellipse cx="32" cy="30" rx="5" ry="3.5" fill="url(#honeyBean)" />
      <Ellipse cx="30" cy="29" rx="1.5" ry="0.8" fill="#E8C89E" opacity="0.4" />
    </G>
    
    {/* Beans outside pot - various types */}
    <G>
      {/* Honey beans pile */}
      <Ellipse cx="8" cy="44" rx="5" ry="3.5" fill="url(#honeyBean)" />
      <Ellipse cx="6" cy="43" rx="1.2" ry="0.8" fill="#E8C89E" opacity="0.4" />
      
      <Ellipse cx="6" cy="50" rx="4.5" ry="3" fill="url(#honeyBean)" />
      
      <Ellipse cx="12" cy="52" rx="5" ry="3.5" fill="url(#honeyBean)" />
      <Path d="M10 52L14 52" stroke="#8B6914" strokeWidth="0.5" opacity="0.3" />
      
      {/* Brown beans */}
      <Ellipse cx="56" cy="42" rx="5" ry="3.5" fill="url(#brownBean)" />
      <Ellipse cx="54" cy="41" rx="1.2" ry="0.8" fill="#BCAAA4" opacity="0.4" />
      
      <Ellipse cx="58" cy="50" rx="4.5" ry="3" fill="url(#brownBean)" />
      
      <Ellipse cx="52" cy="54" rx="5" ry="3.5" fill="url(#brownBean)" />
    </G>
    
    {/* Large featured beans */}
    <G>
      {/* Large honey bean */}
      <Ellipse cx="20" cy="12" rx="10" ry="7" fill="url(#honeyBean)" />
      <Path d="M14 12L26 12" stroke="#8B6914" strokeWidth="0.8" opacity="0.4" />
      <Ellipse cx="16" cy="10" rx="2" ry="1.2" fill="#E8C89E" opacity="0.4" />
      
      {/* Large brown bean */}
      <Ellipse cx="44" cy="10" rx="9" ry="6" fill="url(#brownBean)" />
      <Path d="M38 10L50 10" stroke="#5D4037" strokeWidth="0.6" opacity="0.4" />
      <Ellipse cx="40" cy="8" rx="1.8" ry="1" fill="#BCAAA4" opacity="0.4" />
      
      {/* Red kidney bean */}
      <Ellipse cx="56" cy="18" rx="6" ry="4" fill="url(#redBean)" />
      <Path d="M52 18L60 18" stroke="#5D0000" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Scattered beans */}
    <G>
      <Ellipse cx="4" cy="36" rx="3" ry="2" fill="url(#honeyBean)" />
      <Ellipse cx="60" cy="34" rx="3" ry="2" fill="url(#brownBean)" />
      <Ellipse cx="28" cy="58" rx="3" ry="2" fill="url(#redBean)" />
    </G>
  </Svg>
);

export default BeansEwaIllustration;
