import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic soybeans - round yellowish beans
const SoybeansIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="soybeanColor" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#F5E6A3" />
        <Stop offset="40%" stopColor="#E6D279" />
        <Stop offset="80%" stopColor="#D4BC5E" />
        <Stop offset="100%" stopColor="#C4A94D" />
      </RadialGradient>
      <LinearGradient id="soybeanHilum" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#3E2723" />
      </LinearGradient>
      <LinearGradient id="soyPod" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8BC34A" />
        <Stop offset="50%" stopColor="#689F38" />
        <Stop offset="100%" stopColor="#558B2F" />
      </LinearGradient>
    </Defs>
    
    {/* Green soybean pod (edamame) */}
    <G>
      <Path
        d="M4 20C2 16 6 10 14 10C22 10 28 14 30 20C32 26 28 32 20 34C12 36 6 30 4 24C2 22 2 20 4 20Z"
        fill="url(#soyPod)"
      />
      {/* Pod bumps showing beans inside */}
      <Circle cx="12" cy="20" r="5" fill="#7CB342" />
      <Circle cx="22" cy="22" r="4.5" fill="#7CB342" />
      {/* Pod texture */}
      <Path d="M8 16C12 14 20 16 26 20" stroke="#558B2F" strokeWidth="0.5" opacity="0.5" />
      <Path d="M6 24C10 26 18 28 24 26" stroke="#558B2F" strokeWidth="0.5" opacity="0.4" />
      {/* Highlight */}
      <Path d="M10 16C14 14 18 16 20 18" stroke="#AED581" strokeWidth="1.5" opacity="0.4" />
    </G>
    
    {/* Pile of dried soybeans */}
    <G>
      {/* Back row */}
      <Circle cx="40" cy="28" r="5" fill="url(#soybeanColor)" />
      <Ellipse cx="39" cy="27" rx="1" ry="1.5" fill="url(#soybeanHilum)" />
      
      <Circle cx="50" cy="26" r="5" fill="url(#soybeanColor)" />
      <Ellipse cx="49" cy="25" rx="1" ry="1.5" fill="url(#soybeanHilum)" />
      
      <Circle cx="58" cy="30" r="4.5" fill="url(#soybeanColor)" />
      <Ellipse cx="57" cy="29" rx="1" ry="1.3" fill="url(#soybeanHilum)" />
      
      {/* Middle row */}
      <Circle cx="36" cy="38" r="5.5" fill="url(#soybeanColor)" />
      <Ellipse cx="35" cy="37" rx="1.2" ry="1.6" fill="url(#soybeanHilum)" />
      <Circle cx="36" cy="35" r="1" fill="#FFFFFF" opacity="0.3" />
      
      <Circle cx="46" cy="36" r="5" fill="url(#soybeanColor)" />
      <Ellipse cx="45" cy="35" rx="1" ry="1.5" fill="url(#soybeanHilum)" />
      
      <Circle cx="56" cy="40" r="5" fill="url(#soybeanColor)" />
      <Ellipse cx="55" cy="39" rx="1" ry="1.5" fill="url(#soybeanHilum)" />
      
      {/* Front row */}
      <Circle cx="40" cy="48" r="5.5" fill="url(#soybeanColor)" />
      <Ellipse cx="39" cy="47" rx="1.2" ry="1.6" fill="url(#soybeanHilum)" />
      <Circle cx="42" cy="45" r="1.2" fill="#FFFFFF" opacity="0.35" />
      
      <Circle cx="52" cy="50" r="5" fill="url(#soybeanColor)" />
      <Ellipse cx="51" cy="49" rx="1" ry="1.5" fill="url(#soybeanHilum)" />
    </G>
    
    {/* Large featured soybean */}
    <G>
      <Circle cx="20" cy="52" r="8" fill="url(#soybeanColor)" />
      {/* Hilum - seed scar */}
      <Ellipse cx="18" cy="50" rx="2" ry="3" fill="url(#soybeanHilum)" />
      {/* Highlight */}
      <Circle cx="24" cy="48" r="2" fill="#FFFFFF" opacity="0.35" />
      {/* Subtle line */}
      <Path d="M14 54C18 56 24 56 28 54" stroke="#C4A94D" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Soy milk reference */}
    <G opacity="0.6">
      <Path
        d="M2 42C2 40 4 38 6 38L10 38C12 38 14 40 14 42L14 58C14 60 12 62 10 62L6 62C4 62 2 60 2 58L2 42Z"
        fill="#FAFAFA"
      />
      <Ellipse cx="8" cy="40" rx="4" ry="1.5" fill="#F5F5F5" />
      <Path d="M4 48L12 48" stroke="#E0E0E0" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default SoybeansIllustration;
