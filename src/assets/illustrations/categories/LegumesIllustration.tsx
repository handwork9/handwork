import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic legumes category illustration - beans, lentils, cowpeas
const LegumesIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#8B7355'
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="brownBean" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#D4A574" />
        <Stop offset="50%" stopColor="#A67B5B" />
        <Stop offset="100%" stopColor="#8B6914" />
      </RadialGradient>
      <RadialGradient id="redLentil" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="50%" stopColor="#E64A19" />
        <Stop offset="100%" stopColor="#BF360C" />
      </RadialGradient>
      <RadialGradient id="cowpeaBase" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="50%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFE082" />
      </RadialGradient>
      <RadialGradient id="greenLentil" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#8BC34A" />
        <Stop offset="50%" stopColor="#689F38" />
        <Stop offset="100%" stopColor="#558B2F" />
      </RadialGradient>
    </Defs>
    
    {/* Honey beans / brown beans */}
    <G>
      <Ellipse cx="16" cy="20" rx="8" ry="6" fill="url(#brownBean)" />
      <Path d="M10 20L22 20" stroke="#6B4423" strokeWidth="0.6" opacity="0.4" />
      <Ellipse cx="12" cy="18" rx="2" ry="1" fill="#E8C89E" opacity="0.4" />
      
      <Ellipse cx="30" cy="16" rx="7" ry="5" fill="url(#brownBean)" />
      <Path d="M25 16L35 16" stroke="#6B4423" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Cowpeas with black eye */}
    <G>
      <Ellipse cx="48" cy="18" rx="8" ry="6" fill="url(#cowpeaBase)" />
      <Circle cx="46" cy="16" r="2.5" fill="#1B0000" />
      <Circle cx="50" cy="15" r="1" fill="#FFFFFF" opacity="0.3" />
    </G>
    
    {/* Red lentils */}
    <G>
      <Ellipse cx="12" cy="36" rx="5" ry="2.5" fill="url(#redLentil)" />
      <Ellipse cx="22" cy="34" rx="4.5" ry="2.2" fill="url(#redLentil)" />
      <Ellipse cx="18" cy="40" rx="5" ry="2.5" fill="url(#redLentil)" />
    </G>
    
    {/* Green lentils */}
    <G>
      <Ellipse cx="34" cy="38" rx="5" ry="2.5" fill="url(#greenLentil)" />
      <Ellipse cx="44" cy="36" rx="4.5" ry="2.2" fill="url(#greenLentil)" />
      <Ellipse cx="40" cy="42" rx="5" ry="2.5" fill="url(#greenLentil)" />
    </G>
    
    {/* More beans scattered */}
    <G>
      <Ellipse cx="54" cy="40" rx="6" ry="4.5" fill="url(#brownBean)" />
      <Path d="M50 40L58 40" stroke="#6B4423" strokeWidth="0.5" opacity="0.4" />
      
      <Ellipse cx="10" cy="52" rx="6" ry="4.5" fill="url(#cowpeaBase)" />
      <Circle cx="8" cy="51" r="2" fill="#1B0000" />
      
      <Ellipse cx="26" cy="54" rx="5.5" ry="4" fill="url(#brownBean)" />
      
      <Ellipse cx="42" cy="56" rx="6" ry="4.5" fill="url(#cowpeaBase)" />
      <Circle cx="40" cy="55" r="2" fill="#1B0000" />
      
      <Ellipse cx="56" cy="54" rx="5" ry="3.5" fill="url(#brownBean)" />
    </G>
    
    {/* Scattered lentils */}
    <G>
      <Ellipse cx="50" cy="48" rx="3" ry="1.5" fill="url(#redLentil)" />
      <Ellipse cx="32" cy="48" rx="3" ry="1.5" fill="url(#greenLentil)" />
      <Ellipse cx="18" cy="48" rx="3" ry="1.5" fill="url(#redLentil)" />
    </G>
  </Svg>
);

export default LegumesIllustration;
