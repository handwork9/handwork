import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic cowpeas - white/cream beans with black eye
const CowpeasIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="cowpeaBase" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="50%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFE082" />
      </RadialGradient>
      <LinearGradient id="cowpeaEye" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="50%" stopColor="#3E2723" />
        <Stop offset="100%" stopColor="#1B0000" />
      </LinearGradient>
      <LinearGradient id="woodenBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
    </Defs>
    
    {/* Wooden bowl */}
    <G>
      <Ellipse cx="32" cy="52" rx="26" ry="10" fill="url(#woodenBowl)" />
      <Ellipse cx="32" cy="48" rx="24" ry="8" fill="#D7CCC8" />
      <Ellipse cx="32" cy="48" rx="22" ry="6" fill="#EFEBE9" />
    </G>
    
    {/* Cowpeas in bowl */}
    <G>
      {/* Row 1 */}
      <Ellipse cx="24" cy="46" rx="5" ry="4" fill="url(#cowpeaBase)" />
      <Ellipse cx="23" cy="45" rx="2" ry="1.5" fill="url(#cowpeaEye)" />
      
      <Ellipse cx="34" cy="44" rx="5" ry="4" fill="url(#cowpeaBase)" />
      <Ellipse cx="33" cy="43" rx="2" ry="1.5" fill="url(#cowpeaEye)" />
      
      <Ellipse cx="44" cy="46" rx="5" ry="4" fill="url(#cowpeaBase)" />
      <Ellipse cx="43" cy="45" rx="2" ry="1.5" fill="url(#cowpeaEye)" />
      
      {/* Row 2 */}
      <Ellipse cx="28" cy="50" rx="4.5" ry="3.5" fill="url(#cowpeaBase)" />
      <Ellipse cx="27" cy="49" rx="1.8" ry="1.3" fill="url(#cowpeaEye)" />
      
      <Ellipse cx="38" cy="50" rx="4.5" ry="3.5" fill="url(#cowpeaBase)" />
      <Ellipse cx="37" cy="49" rx="1.8" ry="1.3" fill="url(#cowpeaEye)" />
    </G>
    
    {/* Single cowpeas outside bowl */}
    <G>
      <Ellipse cx="12" cy="38" rx="6" ry="5" fill="url(#cowpeaBase)" />
      <Ellipse cx="10" cy="37" rx="2.5" ry="2" fill="url(#cowpeaEye)" />
      {/* Highlight */}
      <Ellipse cx="14" cy="36" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.4" />
      
      <Ellipse cx="52" cy="36" rx="6" ry="5" fill="url(#cowpeaBase)" />
      <Ellipse cx="50" cy="35" rx="2.5" ry="2" fill="url(#cowpeaEye)" />
      <Ellipse cx="54" cy="34" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.4" />
    </G>
    
    {/* Large featured cowpea */}
    <G>
      <Ellipse cx="32" cy="20" rx="12" ry="10" fill="url(#cowpeaBase)" />
      {/* Black eye - characteristic marking */}
      <Path
        d="M26 18C28 14 34 14 36 18C36 22 32 24 28 22C26 20 26 18 26 18Z"
        fill="url(#cowpeaEye)"
      />
      {/* Hilum line */}
      <Path d="M28 20L34 18" stroke="#1B0000" strokeWidth="0.5" opacity="0.6" />
      {/* Highlight */}
      <Ellipse cx="36" cy="16" rx="3" ry="2" fill="#FFFFFF" opacity="0.3" />
      {/* Bean texture line */}
      <Path d="M24 22C28 24 36 24 40 22" stroke="#FFD54F" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Scattered beans */}
    <G>
      <Ellipse cx="8" cy="54" rx="4" ry="3" fill="url(#cowpeaBase)" />
      <Ellipse cx="7" cy="53" rx="1.5" ry="1" fill="url(#cowpeaEye)" />
      
      <Ellipse cx="56" cy="56" rx="4" ry="3" fill="url(#cowpeaBase)" />
      <Ellipse cx="55" cy="55" rx="1.5" ry="1" fill="url(#cowpeaEye)" />
    </G>
  </Svg>
);

export default CowpeasIllustration;
