import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const DuckEggsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="duckEggBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E3F2FD" />
        <Stop offset="30%" stopColor="#BBDEFB" />
        <Stop offset="70%" stopColor="#90CAF9" />
        <Stop offset="100%" stopColor="#64B5F6" />
      </LinearGradient>
      <LinearGradient id="duckEggGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E8F5E9" />
        <Stop offset="30%" stopColor="#C8E6C9" />
        <Stop offset="70%" stopColor="#A5D6A7" />
        <Stop offset="100%" stopColor="#81C784" />
      </LinearGradient>
      <LinearGradient id="duckEggWhite" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="50%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </LinearGradient>
      <RadialGradient id="duckHighlight" cx="30%" cy="25%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="basketWeave" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
    </Defs>
    
    {/* Basket base */}
    <G>
      <Path
        d="M4 44C4 40 12 36 32 36C52 36 60 40 60 44V54C60 58 52 62 32 62C12 62 4 58 4 54V44Z"
        fill="url(#basketWeave)"
        stroke="#5D4037"
        strokeWidth="0.5"
      />
      {/* Basket weave pattern */}
      <Path d="M8 46H56" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
      <Path d="M8 50H56" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
      <Path d="M8 54H56" stroke="#6D4C41" strokeWidth="1" opacity="0.5" />
      <Path d="M16 42V58" stroke="#6D4C41" strokeWidth="0.8" opacity="0.4" />
      <Path d="M28 40V60" stroke="#6D4C41" strokeWidth="0.8" opacity="0.4" />
      <Path d="M40 40V60" stroke="#6D4C41" strokeWidth="0.8" opacity="0.4" />
      <Path d="M52 42V58" stroke="#6D4C41" strokeWidth="0.8" opacity="0.4" />
      
      {/* Basket rim */}
      <Ellipse cx="32" cy="36" rx="28" ry="6" fill="#A1887F" stroke="#6D4C41" strokeWidth="0.5" />
    </G>
    
    {/* Back duck egg (greenish) */}
    <G>
      <Ellipse cx="18" cy="28" rx="10" ry="14" fill="url(#duckEggGreen)" />
      <Ellipse cx="15" cy="22" rx="4" ry="6" fill="url(#duckHighlight)" />
      {/* Surface texture */}
      <Circle cx="20" cy="26" r="0.6" fill="#81C784" opacity="0.3" />
      <Circle cx="16" cy="32" r="0.5" fill="#66BB6A" opacity="0.2" />
    </G>
    
    {/* Middle duck egg (blue) - larger, characteristic of duck eggs */}
    <G>
      <Ellipse cx="36" cy="26" rx="12" ry="16" fill="url(#duckEggBlue)" />
      <Ellipse cx="32" cy="18" rx="5" ry="8" fill="url(#duckHighlight)" />
      {/* Surface sheen */}
      <Path d="M30 34C34 36 40 34 42 32" stroke="#90CAF9" strokeWidth="1.5" fill="none" opacity="0.4" />
    </G>
    
    {/* Front duck egg (off-white/cream) */}
    <G>
      <Ellipse cx="26" cy="38" rx="11" ry="14" fill="url(#duckEggWhite)" />
      <Ellipse cx="23" cy="32" rx="5" ry="6" fill="url(#duckHighlight)" />
    </G>
    
    {/* Side duck egg (blue tint) */}
    <G>
      <Ellipse cx="48" cy="32" rx="9" ry="12" fill="url(#duckEggBlue)" />
      <Ellipse cx="46" cy="26" rx="4" ry="5" fill="url(#duckHighlight)" />
    </G>
    
    {/* Small feather detail */}
    <G opacity="0.6">
      <Path
        d="M54 20C56 18 58 16 60 18C58 20 56 22 54 20Z"
        fill="#BDBDBD"
      />
      <Path d="M54 20L60 18" stroke="#9E9E9E" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default DuckEggsIllustration;
