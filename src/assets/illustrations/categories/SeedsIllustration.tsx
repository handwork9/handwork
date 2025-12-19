import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Seeds illustration - various seeds including melon, egusi, ogbono
const SeedsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#6B8E23'
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="melonSeed" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="50%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFB300" />
      </RadialGradient>
      <RadialGradient id="egusiSeed" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#F5F5DC" />
        <Stop offset="50%" stopColor="#E8DCC8" />
        <Stop offset="100%" stopColor="#D4C4A8" />
      </RadialGradient>
      <RadialGradient id="ogbonoSeed" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#8B7355" />
        <Stop offset="50%" stopColor="#6B5344" />
        <Stop offset="100%" stopColor="#5D4037" />
      </RadialGradient>
      <RadialGradient id="pumpkinSeed" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#8BC34A" />
        <Stop offset="50%" stopColor="#689F38" />
        <Stop offset="100%" stopColor="#558B2F" />
      </RadialGradient>
      <RadialGradient id="sunflowerSeed" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#424242" />
        <Stop offset="50%" stopColor="#212121" />
        <Stop offset="100%" stopColor="#000000" />
      </RadialGradient>
    </Defs>
    
    {/* Egusi/Melon seeds - flat oval */}
    <G>
      <Ellipse cx="16" cy="18" rx="8" ry="5" fill="url(#egusiSeed)" />
      <Ellipse cx="14" cy="16" rx="2" ry="1" fill="#FFFFFF" opacity="0.3" />
      
      <Ellipse cx="32" cy="14" rx="7" ry="4.5" fill="url(#egusiSeed)" />
      
      <Ellipse cx="24" cy="26" rx="7.5" ry="5" fill="url(#egusiSeed)" />
      <Ellipse cx="22" cy="24" rx="2" ry="1" fill="#FFFFFF" opacity="0.3" />
    </G>
    
    {/* Ogbono seeds - round dark */}
    <G>
      <Circle cx="48" cy="16" r="6" fill="url(#ogbonoSeed)" />
      <Circle cx="50" cy="14" r="1.5" fill="#8B7355" opacity="0.4" />
      
      <Circle cx="52" cy="28" r="5.5" fill="url(#ogbonoSeed)" />
      
      <Circle cx="42" cy="24" r="5" fill="url(#ogbonoSeed)" />
    </G>
    
    {/* Pumpkin seeds - green oval */}
    <G>
      <Ellipse cx="12" cy="40" rx="6" ry="3.5" fill="url(#pumpkinSeed)" />
      <Path d="M8 40L16 40" stroke="#4CAF50" strokeWidth="0.5" opacity="0.4" />
      
      <Ellipse cx="26" cy="42" rx="5.5" ry="3" fill="url(#pumpkinSeed)" />
      
      <Ellipse cx="18" cy="50" rx="6" ry="3.5" fill="url(#pumpkinSeed)" />
    </G>
    
    {/* Sunflower seeds - striped dark */}
    <G>
      <Ellipse cx="44" cy="42" rx="5" ry="3" fill="url(#sunflowerSeed)" />
      <Path d="M40 42L48 42" stroke="#616161" strokeWidth="0.8" />
      <Path d="M41 40.5L47 40.5" stroke="#616161" strokeWidth="0.5" />
      <Path d="M41 43.5L47 43.5" stroke="#616161" strokeWidth="0.5" />
      
      <Ellipse cx="54" cy="46" rx="4.5" ry="2.8" fill="url(#sunflowerSeed)" />
      <Path d="M50 46L58 46" stroke="#616161" strokeWidth="0.6" />
      
      <Ellipse cx="48" cy="54" rx="5" ry="3" fill="url(#sunflowerSeed)" />
      <Path d="M44 54L52 54" stroke="#616161" strokeWidth="0.8" />
    </G>
    
    {/* More scattered seeds */}
    <G>
      <Ellipse cx="8" cy="56" rx="5" ry="3" fill="url(#egusiSeed)" />
      <Circle cx="34" cy="54" r="4" fill="url(#ogbonoSeed)" />
      <Ellipse cx="36" cy="38" rx="5" ry="3" fill="url(#melonSeed)" />
    </G>
  </Svg>
);

export default SeedsIllustration;
