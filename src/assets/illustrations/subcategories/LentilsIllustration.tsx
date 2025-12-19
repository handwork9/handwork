import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic lentils - small flat disc-shaped legumes
const LentilsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="greenLentil" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#8BC34A" />
        <Stop offset="50%" stopColor="#689F38" />
        <Stop offset="100%" stopColor="#558B2F" />
      </RadialGradient>
      <RadialGradient id="redLentil" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="50%" stopColor="#E64A19" />
        <Stop offset="100%" stopColor="#BF360C" />
      </RadialGradient>
      <RadialGradient id="brownLentil" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </RadialGradient>
      <LinearGradient id="lentilBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
    </Defs>
    
    {/* Ceramic bowl */}
    <G>
      <Ellipse cx="32" cy="54" rx="28" ry="8" fill="url(#lentilBowl)" />
      <Ellipse cx="32" cy="50" rx="26" ry="6" fill="#EFEBE9" />
    </G>
    
    {/* Mixed lentils in bowl */}
    <G>
      {/* Green lentils */}
      <Ellipse cx="20" cy="48" rx="4" ry="2" fill="url(#greenLentil)" />
      <Ellipse cx="32" cy="46" rx="4" ry="2" fill="url(#greenLentil)" />
      <Ellipse cx="44" cy="48" rx="4" ry="2" fill="url(#greenLentil)" />
      
      {/* Red lentils */}
      <Ellipse cx="26" cy="50" rx="3.5" ry="1.8" fill="url(#redLentil)" />
      <Ellipse cx="38" cy="50" rx="3.5" ry="1.8" fill="url(#redLentil)" />
      
      {/* Brown lentils */}
      <Ellipse cx="22" cy="52" rx="3.5" ry="1.8" fill="url(#brownLentil)" />
      <Ellipse cx="34" cy="52" rx="3.5" ry="1.8" fill="url(#brownLentil)" />
      <Ellipse cx="42" cy="52" rx="3.5" ry="1.8" fill="url(#brownLentil)" />
    </G>
    
    {/* Pile of green lentils */}
    <G>
      <Ellipse cx="12" cy="32" rx="5" ry="2.5" fill="url(#greenLentil)" />
      <Ellipse cx="10" cy="31" rx="1" ry="0.5" fill="#AED581" opacity="0.4" />
      
      <Ellipse cx="18" cy="30" rx="4.5" ry="2.3" fill="url(#greenLentil)" />
      
      <Ellipse cx="8" cy="36" rx="4.5" ry="2.3" fill="url(#greenLentil)" />
      
      <Ellipse cx="14" cy="38" rx="5" ry="2.5" fill="url(#greenLentil)" />
      <Ellipse cx="12" cy="37" rx="1" ry="0.5" fill="#AED581" opacity="0.4" />
    </G>
    
    {/* Pile of red lentils */}
    <G>
      <Ellipse cx="48" cy="28" rx="5" ry="2.5" fill="url(#redLentil)" />
      <Ellipse cx="46" cy="27" rx="1" ry="0.5" fill="#FFAB91" opacity="0.4" />
      
      <Ellipse cx="54" cy="30" rx="4.5" ry="2.3" fill="url(#redLentil)" />
      
      <Ellipse cx="50" cy="34" rx="5" ry="2.5" fill="url(#redLentil)" />
      
      <Ellipse cx="56" cy="36" rx="4.5" ry="2.3" fill="url(#redLentil)" />
      <Ellipse cx="54" cy="35" rx="1" ry="0.5" fill="#FFAB91" opacity="0.4" />
    </G>
    
    {/* Large featured lentils */}
    <G>
      {/* Large green lentil */}
      <Ellipse cx="28" cy="14" rx="8" ry="4" fill="url(#greenLentil)" />
      <Ellipse cx="26" cy="13" rx="2" ry="1" fill="#AED581" opacity="0.4" />
      <Path d="M22 14L34 14" stroke="#558B2F" strokeWidth="0.5" opacity="0.3" />
      
      {/* Large red lentil */}
      <Ellipse cx="44" cy="12" rx="7" ry="3.5" fill="url(#redLentil)" />
      <Ellipse cx="42" cy="11" rx="1.5" ry="0.8" fill="#FFAB91" opacity="0.4" />
      
      {/* Large brown lentil */}
      <Ellipse cx="36" cy="22" rx="7" ry="3.5" fill="url(#brownLentil)" />
      <Ellipse cx="34" cy="21" rx="1.5" ry="0.8" fill="#A1887F" opacity="0.4" />
    </G>
    
    {/* Scattered single lentils */}
    <G>
      <Ellipse cx="4" cy="44" rx="3" ry="1.5" fill="url(#redLentil)" />
      <Ellipse cx="60" cy="42" rx="3" ry="1.5" fill="url(#greenLentil)" />
      <Ellipse cx="24" cy="26" rx="3" ry="1.5" fill="url(#brownLentil)" />
    </G>
  </Svg>
);

export default LentilsIllustration;
