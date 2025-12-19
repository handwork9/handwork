import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic black-eyed peas - cream colored with distinctive black eye
const BlackEyedPeasIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="bepBase" cx="40%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="40%" stopColor="#FFECB3" />
        <Stop offset="80%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#F5D56A" />
      </RadialGradient>
      <RadialGradient id="bepEye" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#1A1A1A" />
        <Stop offset="70%" stopColor="#0D0D0D" />
        <Stop offset="100%" stopColor="#000000" />
      </RadialGradient>
      <LinearGradient id="bepBurlap" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
    </Defs>
    
    {/* Burlap sack background */}
    <G>
      <Path
        d="M8 36C8 32 14 30 32 30C50 30 56 32 56 36L56 58C56 62 50 64 32 64C14 64 8 62 8 58L8 36Z"
        fill="url(#bepBurlap)"
        opacity="0.5"
      />
      {/* Burlap texture */}
      <Path d="M12 40H52" stroke="#8D6E63" strokeWidth="0.5" opacity="0.3" />
      <Path d="M14 48H50" stroke="#8D6E63" strokeWidth="0.5" opacity="0.25" />
      <Path d="M16 56H48" stroke="#8D6E63" strokeWidth="0.5" opacity="0.2" />
    </G>
    
    {/* Black-eyed peas spilling out */}
    <G>
      {/* Back layer */}
      <Ellipse cx="22" cy="38" rx="5" ry="4" fill="url(#bepBase)" />
      <Circle cx="20" cy="37" r="2" fill="url(#bepEye)" />
      
      <Ellipse cx="34" cy="36" rx="5" ry="4" fill="url(#bepBase)" />
      <Circle cx="32" cy="35" r="2" fill="url(#bepEye)" />
      
      <Ellipse cx="46" cy="38" rx="5" ry="4" fill="url(#bepBase)" />
      <Circle cx="44" cy="37" r="2" fill="url(#bepEye)" />
      
      {/* Middle layer */}
      <Ellipse cx="16" cy="46" rx="5.5" ry="4.5" fill="url(#bepBase)" />
      <Circle cx="14" cy="45" r="2.2" fill="url(#bepEye)" />
      
      <Ellipse cx="28" cy="44" rx="5" ry="4" fill="url(#bepBase)" />
      <Circle cx="26" cy="43" r="2" fill="url(#bepEye)" />
      
      <Ellipse cx="40" cy="46" rx="5.5" ry="4.5" fill="url(#bepBase)" />
      <Circle cx="38" cy="45" r="2.2" fill="url(#bepEye)" />
      
      <Ellipse cx="52" cy="44" rx="5" ry="4" fill="url(#bepBase)" />
      <Circle cx="50" cy="43" r="2" fill="url(#bepEye)" />
      
      {/* Front layer */}
      <Ellipse cx="22" cy="54" rx="5" ry="4" fill="url(#bepBase)" />
      <Circle cx="20" cy="53" r="2" fill="url(#bepEye)" />
      
      <Ellipse cx="34" cy="52" rx="5.5" ry="4.5" fill="url(#bepBase)" />
      <Circle cx="32" cy="51" r="2.2" fill="url(#bepEye)" />
      <Ellipse cx="36" cy="50" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.3" />
      
      <Ellipse cx="46" cy="54" rx="5" ry="4" fill="url(#bepBase)" />
      <Circle cx="44" cy="53" r="2" fill="url(#bepEye)" />
    </G>
    
    {/* Large featured black-eyed pea */}
    <G>
      <Ellipse cx="32" cy="16" rx="14" ry="11" fill="url(#bepBase)" />
      {/* Distinctive black eye */}
      <Circle cx="28" cy="14" r="5" fill="url(#bepEye)" />
      {/* Eye highlight */}
      <Circle cx="26" cy="12" r="1.5" fill="#333333" opacity="0.3" />
      {/* Bean highlight */}
      <Ellipse cx="38" cy="12" rx="3" ry="2" fill="#FFFFFF" opacity="0.3" />
      {/* Seed line */}
      <Path d="M22 18C28 20 38 20 44 18" stroke="#F5D56A" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Scattered peas */}
    <G>
      <Ellipse cx="8" cy="28" rx="4" ry="3" fill="url(#bepBase)" />
      <Circle cx="7" cy="27" r="1.5" fill="url(#bepEye)" />
      
      <Ellipse cx="56" cy="26" rx="4" ry="3" fill="url(#bepBase)" />
      <Circle cx="55" cy="25" r="1.5" fill="url(#bepEye)" />
      
      <Ellipse cx="12" cy="20" rx="4" ry="3" fill="url(#bepBase)" />
      <Circle cx="11" cy="19" r="1.5" fill="url(#bepEye)" />
    </G>
  </Svg>
);

export default BlackEyedPeasIllustration;
