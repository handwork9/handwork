import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic palm nuts - red palm fruit cluster
const PalmNutsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="palmNutRed" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF5722" />
        <Stop offset="30%" stopColor="#F4511E" />
        <Stop offset="70%" stopColor="#E64A19" />
        <Stop offset="100%" stopColor="#BF360C" />
      </LinearGradient>
      <LinearGradient id="palmNutOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="50%" stopColor="#F57C00" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <LinearGradient id="palmKernel" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="50%" stopColor="#4E342E" />
        <Stop offset="100%" stopColor="#3E2723" />
      </LinearGradient>
      <LinearGradient id="palmStem" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="palmOil" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF6F00" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
    </Defs>
    
    {/* Main cluster stem */}
    <G>
      <Path
        d="M32 2L32 16"
        stroke="url(#palmStem)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Branch stems */}
      <Path d="M32 12L20 24" stroke="url(#palmStem)" strokeWidth="2" />
      <Path d="M32 12L44 24" stroke="url(#palmStem)" strokeWidth="2" />
      <Path d="M32 10L14 20" stroke="url(#palmStem)" strokeWidth="1.5" />
      <Path d="M32 10L50 20" stroke="url(#palmStem)" strokeWidth="1.5" />
      <Path d="M32 8L26 18" stroke="url(#palmStem)" strokeWidth="1.5" />
      <Path d="M32 8L38 18" stroke="url(#palmStem)" strokeWidth="1.5" />
    </G>
    
    {/* Palm nuts cluster - multiple fruits */}
    <G>
      {/* Top row */}
      <Ellipse cx="26" cy="20" rx="4" ry="5" fill="url(#palmNutRed)" />
      <Ellipse cx="32" cy="18" rx="4" ry="5" fill="url(#palmNutOrange)" />
      <Ellipse cx="38" cy="20" rx="4" ry="5" fill="url(#palmNutRed)" />
      
      {/* Second row */}
      <Ellipse cx="20" cy="26" rx="4" ry="5" fill="url(#palmNutOrange)" />
      <Ellipse cx="28" cy="26" rx="4.5" ry="5.5" fill="url(#palmNutRed)" />
      <Ellipse cx="36" cy="26" rx="4.5" ry="5.5" fill="url(#palmNutRed)" />
      <Ellipse cx="44" cy="26" rx="4" ry="5" fill="url(#palmNutOrange)" />
      
      {/* Third row */}
      <Ellipse cx="16" cy="32" rx="4" ry="5" fill="url(#palmNutRed)" />
      <Ellipse cx="24" cy="34" rx="5" ry="6" fill="url(#palmNutRed)" />
      <Ellipse cx="32" cy="34" rx="5" ry="6" fill="url(#palmNutOrange)" />
      <Ellipse cx="40" cy="34" rx="5" ry="6" fill="url(#palmNutRed)" />
      <Ellipse cx="48" cy="32" rx="4" ry="5" fill="url(#palmNutRed)" />
      
      {/* Bottom row */}
      <Ellipse cx="20" cy="42" rx="4" ry="5" fill="url(#palmNutOrange)" />
      <Ellipse cx="28" cy="44" rx="4.5" ry="5.5" fill="url(#palmNutRed)" />
      <Ellipse cx="36" cy="44" rx="4.5" ry="5.5" fill="url(#palmNutRed)" />
      <Ellipse cx="44" cy="42" rx="4" ry="5" fill="url(#palmNutOrange)" />
      
      {/* Fruit highlights */}
      <Circle cx="24" cy="24" r="1" fill="#FFCCBC" opacity="0.5" />
      <Circle cx="32" cy="32" r="1.2" fill="#FFCCBC" opacity="0.5" />
      <Circle cx="40" cy="24" r="1" fill="#FFCCBC" opacity="0.5" />
    </G>
    
    {/* Separated palm nut showing kernel */}
    <G>
      {/* Outer flesh */}
      <Ellipse cx="10" cy="54" rx="6" ry="7" fill="url(#palmNutOrange)" />
      
      {/* Cut showing kernel */}
      <Path
        d="M10 48C14 50 16 56 14 60C10 60 6 56 6 52C6 50 8 48 10 48Z"
        fill="url(#palmKernel)"
      />
    </G>
    
    {/* Palm kernel (seed) */}
    <G>
      <Ellipse cx="54" cy="52" rx="5" ry="6" fill="url(#palmKernel)" />
      {/* Kernel texture */}
      <Path d="M52 48C54 50 56 52 56 56" stroke="#2E1F1A" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Oil drip */}
    <G>
      <Path
        d="M28 50C28 52 30 56 32 58C34 56 36 52 36 50C36 48 34 48 32 48C30 48 28 48 28 50Z"
        fill="url(#palmOil)"
        opacity="0.7"
      />
    </G>
    
    {/* Small scattered fruits */}
    <G>
      <Ellipse cx="52" cy="40" rx="3" ry="3.5" fill="url(#palmNutRed)" />
    </G>
  </Svg>
);

export default PalmNutsIllustration;
