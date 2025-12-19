import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic coconut oil - clear/white oil with coconut
const CoconutOilIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="coconutOilColor" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="30%" stopColor="#FFFEF5" />
        <Stop offset="60%" stopColor="#FFF9E6" />
        <Stop offset="100%" stopColor="#FFF3CD" />
      </LinearGradient>
      <LinearGradient id="coconutJar" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E8F5E9" stopOpacity="0.4" />
        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#E8F5E9" stopOpacity="0.3" />
      </LinearGradient>
      <LinearGradient id="coconutLid" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="coconutShell" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#4E342E" />
      </LinearGradient>
      <RadialGradient id="coconutFlesh" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="70%" stopColor="#FAFAFA" />
        <Stop offset="100%" stopColor="#F0F0F0" />
      </RadialGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="24" cy="62" rx="14" ry="2" fill="#5D4037" opacity="0.15" />
    
    {/* Glass jar */}
    <G>
      {/* Jar body */}
      <Path
        d="M10 18C10 14 14 12 24 12C34 12 38 14 38 18L38 56C38 60 34 62 24 62C14 62 10 60 10 56L10 18Z"
        fill="url(#coconutOilColor)"
      />
      
      {/* Glass reflection */}
      <Path
        d="M14 20C14 16 16 14 20 14L20 58C16 58 14 56 14 54L14 20Z"
        fill="url(#coconutJar)"
      />
      
      {/* Oil texture - slightly solidified look */}
      <Ellipse cx="24" cy="16" rx="12" ry="2" fill="#FFFFFF" opacity="0.8" />
      
      {/* Crystallization effect */}
      <Path d="M18 30C20 28 24 30 22 32" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" />
      <Path d="M26 40C28 38 32 40 30 42" stroke="#FFFFFF" strokeWidth="1" opacity="0.3" />
    </G>
    
    {/* Jar rim */}
    <Ellipse cx="24" cy="12" rx="14" ry="3" fill="#E0E0E0" opacity="0.5" />
    
    {/* Wooden lid */}
    <G>
      <Ellipse cx="24" cy="10" rx="12" ry="3" fill="url(#coconutLid)" />
      <Ellipse cx="24" cy="8" rx="10" ry="2.5" fill="#8D6E63" />
      {/* Lid texture */}
      <Path d="M16 8L32 8" stroke="#5D4037" strokeWidth="0.5" opacity="0.5" />
      <Path d="M18 10L30 10" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Label area */}
    <G>
      <Path
        d="M14 38L34 38L34 54L14 54Z"
        fill="#E8F5E9"
        opacity="0.8"
      />
      {/* Coconut icon */}
      <Circle cx="24" cy="44" r="4" fill="#6D4C41" />
      <Path d="M22 42C24 40 26 42 26 44C26 46 24 48 22 46C22 44 22 42 22 42Z" fill="#FFFFFF" />
      <Circle cx="22" cy="41" r="0.8" fill="#4E342E" />
      <Circle cx="26" cy="41" r="0.8" fill="#4E342E" />
    </G>
    
    {/* Half coconut beside jar */}
    <G>
      <Path
        d="M48 42C44 42 42 48 42 54C42 60 48 62 54 60C60 58 62 52 60 46C58 42 52 42 48 42Z"
        fill="url(#coconutShell)"
      />
      {/* White flesh inside */}
      <Path
        d="M50 46C48 48 48 54 50 58C54 58 58 54 58 50C58 46 54 44 50 46Z"
        fill="url(#coconutFlesh)"
      />
      {/* Flesh texture */}
      <Path d="M52 48L54 54" stroke="#E0E0E0" strokeWidth="0.5" opacity="0.5" />
      
      {/* Shell texture - hairy fibers */}
      <Path d="M46 48C44 50 46 52 44 54" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      <Path d="M60 50C62 52 60 54 62 56" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Coconut flakes */}
    <G opacity="0.7">
      <Path d="M42 38C44 36 46 38 44 40" fill="#FAFAFA" />
      <Path d="M46 36C48 34 50 36 48 38" fill="#F5F5F5" />
    </G>
  </Svg>
);

export default CoconutOilIllustration;
