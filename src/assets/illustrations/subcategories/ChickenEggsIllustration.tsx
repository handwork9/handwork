import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const ChickenEggsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="eggShell1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="30%" stopColor="#FFECB3" />
        <Stop offset="70%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </LinearGradient>
      <LinearGradient id="eggShell2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="30%" stopColor="#FAFAFA" />
        <Stop offset="70%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#EEEEEE" />
      </LinearGradient>
      <LinearGradient id="eggShell3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
      <RadialGradient id="eggHighlight" cx="30%" cy="30%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="nestStraw" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
    </Defs>
    
    {/* Nest/straw base */}
    <G>
      <Ellipse cx="32" cy="54" rx="28" ry="8" fill="url(#nestStraw)" />
      {/* Straw texture */}
      <Path d="M8 52C12 50 18 54 24 52C30 50 38 54 44 52C50 50 54 52 56 54" stroke="#8D6E63" strokeWidth="1" fill="none" opacity="0.5" />
      <Path d="M6 54C10 52 16 56 22 54C28 52 36 56 42 54C48 52 56 54 58 56" stroke="#6D4C41" strokeWidth="0.8" fill="none" opacity="0.4" />
      <Path d="M10 56C14 54 20 58 26 56C32 54 40 58 46 56C52 54 56 56 58 58" stroke="#A1887F" strokeWidth="0.6" fill="none" opacity="0.3" />
    </G>
    
    {/* Back egg (brown) */}
    <G>
      <Ellipse cx="44" cy="36" rx="10" ry="14" fill="url(#eggShell3)" />
      {/* Highlight */}
      <Ellipse cx="41" cy="30" rx="4" ry="6" fill="url(#eggHighlight)" />
      {/* Subtle speckles */}
      <Circle cx="46" cy="32" r="0.8" fill="#A1887F" opacity="0.3" />
      <Circle cx="42" cy="38" r="0.6" fill="#8D6E63" opacity="0.3" />
      <Circle cx="48" cy="40" r="0.5" fill="#A1887F" opacity="0.2" />
    </G>
    
    {/* Middle egg (white) */}
    <G>
      <Ellipse cx="22" cy="34" rx="11" ry="15" fill="url(#eggShell2)" />
      {/* Highlight */}
      <Ellipse cx="18" cy="28" rx="5" ry="7" fill="url(#eggHighlight)" />
      {/* Shadow on shell */}
      <Path d="M14 42C16 44 20 46 26 44" stroke="#E0E0E0" strokeWidth="2" fill="none" opacity="0.5" />
    </G>
    
    {/* Front egg (cream/tan) */}
    <G>
      <Ellipse cx="34" cy="40" rx="12" ry="16" fill="url(#eggShell1)" />
      {/* Highlight */}
      <Ellipse cx="30" cy="32" rx="5" ry="8" fill="url(#eggHighlight)" />
      {/* Subtle texture */}
      <Circle cx="38" cy="36" r="0.5" fill="#FFD54F" opacity="0.4" />
      <Circle cx="32" cy="44" r="0.4" fill="#FFCA28" opacity="0.3" />
    </G>
    
    {/* Small egg peeking */}
    <G>
      <Ellipse cx="52" cy="46" rx="7" ry="10" fill="url(#eggShell2)" />
      <Ellipse cx="50" cy="42" rx="3" ry="4" fill="url(#eggHighlight)" />
    </G>
    
    {/* Straw pieces on top */}
    <G opacity="0.6">
      <Path d="M16 48L20 44" stroke="#A1887F" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M46 50L50 46" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" />
      <Path d="M28 52L30 48" stroke="#BCAAA4" strokeWidth="1" strokeLinecap="round" />
    </G>
  </Svg>
);

export default ChickenEggsIllustration;
