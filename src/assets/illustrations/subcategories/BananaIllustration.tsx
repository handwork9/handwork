import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic banana bunch illustration
const BananaIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="bananaBodyReal" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#F9A825" />
        <Stop offset="25%" stopColor="#FDD835" />
        <Stop offset="50%" stopColor="#FFEB3B" />
        <Stop offset="75%" stopColor="#FDD835" />
        <Stop offset="100%" stopColor="#F9A825" />
      </LinearGradient>
      <LinearGradient id="bananaStemReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="50%" stopColor="#4E342E" />
        <Stop offset="100%" stopColor="#3E2723" />
      </LinearGradient>
      <RadialGradient id="bananaShine" cx="30%" cy="30%" r="60%">
        <Stop offset="0%" stopColor="#FFFDE7" stopOpacity="0.5" />
        <Stop offset="100%" stopColor="#FFFDE7" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="32" cy="60" rx="22" ry="3" fill="#3E2723" opacity="0.15" />
    
    {/* Banana 1 - back */}
    <G>
      <Path
        d="M10 48C6 44 4 34 8 24C12 16 20 12 28 14C28 20 22 30 16 40C12 48 12 52 10 48Z"
        fill="url(#bananaBodyReal)"
      />
      <Path d="M12 42C10 36 12 26 18 18" stroke="#E6A700" strokeWidth="1" opacity="0.4" />
      <Ellipse cx="18" cy="24" rx="4" ry="8" fill="url(#bananaShine)" />
    </G>
    
    {/* Banana 2 */}
    <G>
      <Path
        d="M20 52C16 50 12 40 14 28C16 18 26 12 36 12C38 18 34 30 28 42C24 52 22 56 20 52Z"
        fill="url(#bananaBodyReal)"
      />
      <Path d="M22 46C20 40 22 28 28 18" stroke="#E6A700" strokeWidth="1" opacity="0.4" />
      <Ellipse cx="28" cy="26" rx="4" ry="10" fill="url(#bananaShine)" />
    </G>
    
    {/* Banana 3 - front center */}
    <G>
      <Path
        d="M32 54C28 52 24 42 26 30C28 18 38 12 48 14C50 20 46 32 40 44C36 54 34 58 32 54Z"
        fill="url(#bananaBodyReal)"
      />
      <Path d="M34 48C32 42 34 30 40 20" stroke="#E6A700" strokeWidth="1" opacity="0.4" />
      <Ellipse cx="38" cy="28" rx="4" ry="10" fill="url(#bananaShine)" />
    </G>
    
    {/* Banana 4 - front right */}
    <G>
      <Path
        d="M44 52C40 50 38 40 42 28C46 18 54 14 60 18C60 26 54 38 46 48C42 54 44 56 44 52Z"
        fill="url(#bananaBodyReal)"
      />
      <Path d="M46 46C44 40 48 28 54 20" stroke="#E6A700" strokeWidth="1" opacity="0.4" />
    </G>
    
    {/* Banana tips - brown ends */}
    <Circle cx="10" cy="48" r="2.5" fill="#5D4037" />
    <Circle cx="20" cy="52" r="2.5" fill="#6D4C41" />
    <Circle cx="32" cy="54" r="2.5" fill="#5D4037" />
    <Circle cx="44" cy="52" r="2" fill="#6D4C41" />
    
    {/* Stem/crown at top */}
    <Path
      d="M28 14C28 10 32 6 40 6C48 6 52 10 54 16"
      stroke="url(#bananaStemReal)"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
    <Ellipse cx="40" cy="6" rx="6" ry="3" fill="#4E342E" />
    
    {/* Brown spots (ripe) */}
    <Circle cx="24" cy="36" r="1" fill="#5D4037" opacity="0.3" />
    <Circle cx="36" cy="38" r="0.8" fill="#5D4037" opacity="0.25" />
    <Circle cx="16" cy="32" r="0.6" fill="#5D4037" opacity="0.2" />
  </Svg>
);

export default BananaIllustration;
