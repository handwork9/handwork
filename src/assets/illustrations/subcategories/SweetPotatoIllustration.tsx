import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic sweet potato
const SweetPotatoIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="sweetPotatoSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#C62828" />
        <Stop offset="30%" stopColor="#B71C1C" />
        <Stop offset="70%" stopColor="#8B0000" />
        <Stop offset="100%" stopColor="#5D0000" />
      </LinearGradient>
      <LinearGradient id="sweetPotatoPurple" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#7B1FA2" />
        <Stop offset="50%" stopColor="#6A1B9A" />
        <Stop offset="100%" stopColor="#4A148C" />
      </LinearGradient>
      <LinearGradient id="sweetPotatoFlesh" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFE0B2" />
        <Stop offset="30%" stopColor="#FFCC80" />
        <Stop offset="70%" stopColor="#FFB74D" />
        <Stop offset="100%" stopColor="#FFA726" />
      </LinearGradient>
      <LinearGradient id="sweetPotatoPurpleFlesh" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#CE93D8" />
        <Stop offset="50%" stopColor="#BA68C8" />
        <Stop offset="100%" stopColor="#AB47BC" />
      </LinearGradient>
    </Defs>
    
    {/* Main sweet potato - red/brown variety */}
    <G>
      <Path
        d="M6 28C2 22 6 12 18 8C30 4 50 10 58 22C62 30 58 42 48 48C38 54 18 52 10 44C4 38 2 34 6 28Z"
        fill="url(#sweetPotatoSkin)"
      />
      
      {/* Skin texture */}
      <Path d="M14 16C26 12 44 16 54 26" stroke="#5D0000" strokeWidth="0.8" opacity="0.4" />
      <Path d="M10 30C22 26 40 30 52 38" stroke="#5D0000" strokeWidth="0.6" opacity="0.3" />
      
      {/* Natural ridges */}
      <Path d="M20 20C24 22 28 20 32 22" stroke="#8B0000" strokeWidth="1" opacity="0.3" />
      <Path d="M36 34C40 36 44 34 48 36" stroke="#8B0000" strokeWidth="0.8" opacity="0.3" />
      
      {/* Highlight */}
      <Path d="M16 18C24 14 36 18 44 24" stroke="#EF5350" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      
      {/* Root end points */}
      <Circle cx="56" cy="28" r="2" fill="#5D0000" />
    </G>
    
    {/* Cut sweet potato showing orange flesh */}
    <G>
      <Path
        d="M2 52C0 48 4 42 12 42C20 42 26 48 24 54C22 60 14 62 8 60C4 58 0 56 2 52Z"
        fill="url(#sweetPotatoSkin)"
      />
      {/* Orange flesh */}
      <Ellipse cx="12" cy="52" rx="8" ry="7" fill="url(#sweetPotatoFlesh)" />
      {/* Flesh fibers */}
      <Path d="M8 48L10 56" stroke="#FF8F00" strokeWidth="0.5" opacity="0.4" />
      <Path d="M14 48L16 56" stroke="#FF8F00" strokeWidth="0.5" opacity="0.4" />
      {/* Skin ring */}
      <Ellipse cx="12" cy="52" rx="8" ry="7" fill="none" stroke="#B71C1C" strokeWidth="1.5" />
    </G>
    
    {/* Purple sweet potato variety */}
    <G>
      <Path
        d="M40 52C38 48 42 44 50 44C58 44 64 50 62 56C60 62 52 64 46 62C42 60 38 58 40 52Z"
        fill="url(#sweetPotatoPurple)"
      />
      {/* Cut showing purple flesh */}
      <Path
        d="M50 46C56 48 60 54 58 58C54 60 48 58 46 54C44 50 46 46 50 46Z"
        fill="url(#sweetPotatoPurpleFlesh)"
      />
      {/* Highlight */}
      <Path d="M48 48C52 50 54 48 56 50" stroke="#9C27B0" strokeWidth="1" opacity="0.4" />
    </G>
    
    {/* Small whole sweet potato */}
    <G>
      <Ellipse cx="52" cy="18" rx="8" ry="5" fill="url(#sweetPotatoSkin)" />
      <Path d="M46 16C50 18 54 16 58 18" stroke="#8B0000" strokeWidth="0.5" opacity="0.3" />
      {/* Root */}
      <Path d="M60 18L64 20" stroke="#5D0000" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Leaf hint */}
    <G>
      <Path
        d="M6 10C8 8 12 10 12 14C12 18 8 20 4 18C6 16 6 12 6 10Z"
        fill="#66BB6A"
      />
      <Path d="M6 12L10 14" stroke="#388E3C" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default SweetPotatoIllustration;
