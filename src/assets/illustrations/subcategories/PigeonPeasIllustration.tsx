import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic pigeon peas - small round tan/brown peas
const PigeonPeasIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="pigeonPeaLight" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#E8DCC8" />
        <Stop offset="50%" stopColor="#D4C4A8" />
        <Stop offset="100%" stopColor="#B8A888" />
      </RadialGradient>
      <RadialGradient id="pigeonPeaDark" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#C4A87C" />
        <Stop offset="50%" stopColor="#A68B5B" />
        <Stop offset="100%" stopColor="#8B734A" />
      </RadialGradient>
      <LinearGradient id="pigeonPod" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#9E9D24" />
        <Stop offset="50%" stopColor="#827717" />
        <Stop offset="100%" stopColor="#6B5E00" />
      </LinearGradient>
      <LinearGradient id="pigeonPodGreen" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8BC34A" />
        <Stop offset="50%" stopColor="#7CB342" />
        <Stop offset="100%" stopColor="#689F38" />
      </LinearGradient>
    </Defs>
    
    {/* Fresh green pod */}
    <G>
      <Path
        d="M4 12C2 8 8 4 16 6C24 8 30 16 28 22C26 28 18 30 10 26C4 22 2 18 4 12Z"
        fill="url(#pigeonPodGreen)"
      />
      {/* Peas visible through pod */}
      <Circle cx="10" cy="14" r="4" fill="#7CB342" />
      <Circle cx="18" cy="16" r="4" fill="#689F38" />
      <Circle cx="24" cy="20" r="3.5" fill="#7CB342" />
      {/* Pod seam */}
      <Path d="M8 10C14 14 22 18 26 22" stroke="#558B2F" strokeWidth="0.8" opacity="0.5" />
      {/* Highlight */}
      <Path d="M8 10C12 8 18 12 22 14" stroke="#AED581" strokeWidth="1.5" opacity="0.4" />
    </G>
    
    {/* Dried pod */}
    <G>
      <Path
        d="M36 8C34 4 40 0 48 2C56 4 60 12 58 18C56 24 48 26 42 22C38 18 34 14 36 8Z"
        fill="url(#pigeonPod)"
      />
      {/* Dried texture */}
      <Path d="M40 6C46 8 54 12 58 16" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      <Path d="M42 14C48 16 52 18 56 20" stroke="#5D4037" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Scattered dried pigeon peas */}
    <G>
      {/* Cluster 1 */}
      <Circle cx="14" cy="42" r="5" fill="url(#pigeonPeaLight)" />
      <Ellipse cx="13" cy="41" rx="1" ry="1.5" fill="#8B734A" />
      <Circle cx="16" cy="40" r="1" fill="#FFFFFF" opacity="0.3" />
      
      <Circle cx="24" cy="40" r="4.5" fill="url(#pigeonPeaDark)" />
      <Ellipse cx="23" cy="39" rx="1" ry="1.3" fill="#6B5E00" />
      
      <Circle cx="20" cy="50" r="5" fill="url(#pigeonPeaLight)" />
      <Ellipse cx="19" cy="49" rx="1" ry="1.5" fill="#8B734A" />
      
      {/* Cluster 2 */}
      <Circle cx="36" cy="38" r="4.5" fill="url(#pigeonPeaDark)" />
      <Ellipse cx="35" cy="37" rx="1" ry="1.3" fill="#6B5E00" />
      
      <Circle cx="44" cy="42" r="5" fill="url(#pigeonPeaLight)" />
      <Ellipse cx="43" cy="41" rx="1" ry="1.5" fill="#8B734A" />
      <Circle cx="46" cy="40" r="1" fill="#FFFFFF" opacity="0.3" />
      
      <Circle cx="40" cy="52" r="5" fill="url(#pigeonPeaDark)" />
      <Ellipse cx="39" cy="51" rx="1" ry="1.5" fill="#6B5E00" />
      
      <Circle cx="52" cy="48" r="4.5" fill="url(#pigeonPeaLight)" />
      <Ellipse cx="51" cy="47" rx="1" ry="1.3" fill="#8B734A" />
      
      {/* Front peas */}
      <Circle cx="30" cy="56" r="5" fill="url(#pigeonPeaLight)" />
      <Ellipse cx="29" cy="55" rx="1" ry="1.5" fill="#8B734A" />
      <Circle cx="32" cy="54" r="1.2" fill="#FFFFFF" opacity="0.35" />
      
      <Circle cx="50" cy="58" r="4.5" fill="url(#pigeonPeaDark)" />
      <Ellipse cx="49" cy="57" rx="1" ry="1.3" fill="#6B5E00" />
    </G>
    
    {/* Large featured pea */}
    <G>
      <Circle cx="56" cy="32" r="6" fill="url(#pigeonPeaLight)" />
      <Ellipse cx="54" cy="30" rx="1.5" ry="2" fill="#8B734A" />
      <Circle cx="58" cy="29" r="1.5" fill="#FFFFFF" opacity="0.35" />
    </G>
  </Svg>
);

export default PigeonPeasIllustration;
