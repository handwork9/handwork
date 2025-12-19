import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect, Polygon } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const SnailIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="snailShell" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="30%" stopColor="#6D4C41" />
        <Stop offset="70%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#4E342E" />
      </LinearGradient>
      <LinearGradient id="shellPattern" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="snailBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#BCAAA4" />
        <Stop offset="50%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <LinearGradient id="calabashPot" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#795548" />
        <Stop offset="50%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#3E2723" />
      </LinearGradient>
    </Defs>
    
    {/* Calabash/Clay pot */}
    <G>
      <Path
        d="M8 40C8 34 16 30 32 30C48 30 56 34 56 40V52C56 58 48 62 32 62C16 62 8 58 8 52V40Z"
        fill="url(#calabashPot)"
        stroke="#3E2723"
        strokeWidth="0.5"
      />
      {/* Pot rim */}
      <Ellipse cx="32" cy="30" rx="24" ry="6" fill="#6D4C41" stroke="#4E342E" strokeWidth="0.5" />
      {/* Pot decoration */}
      <Path d="M12 44C18 42 26 46 32 44C38 42 46 46 52 44" stroke="#4E342E" strokeWidth="1" fill="none" opacity="0.5" />
      <Path d="M12 50C18 48 26 52 32 50C38 48 46 52 52 50" stroke="#4E342E" strokeWidth="1" fill="none" opacity="0.5" />
    </G>
    
    {/* Large snail - main */}
    <G>
      {/* Shell */}
      <Circle cx="28" cy="24" r="14" fill="url(#snailShell)" />
      {/* Shell spiral pattern */}
      <Path
        d="M28 24C28 20 32 18 34 20C36 22 34 26 32 28C30 30 26 30 24 28C22 26 22 22 24 20C26 18 30 18 32 20"
        stroke="url(#shellPattern)"
        strokeWidth="2"
        fill="none"
      />
      <Circle cx="28" cy="24" r="4" fill="#5D4037" />
      <Circle cx="28" cy="24" r="2" fill="#4E342E" />
      
      {/* Shell stripes */}
      <Path d="M16 20C18 18 22 16 28 16" stroke="#A1887F" strokeWidth="1" opacity="0.4" />
      <Path d="M16 28C18 30 22 32 28 32" stroke="#4E342E" strokeWidth="1" opacity="0.4" />
      
      {/* Shell highlight */}
      <Path d="M20 18C22 16 26 16 28 18" stroke="#D7CCC8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      
      {/* Snail body */}
      <Path
        d="M18 30C14 32 10 36 12 40C14 44 20 46 26 44C30 42 32 38 30 34"
        fill="url(#snailBody)"
      />
      
      {/* Body texture */}
      <Circle cx="18" cy="38" r="1" fill="#8D6E63" opacity="0.4" />
      <Circle cx="22" cy="42" r="0.8" fill="#6D4C41" opacity="0.3" />
      
      {/* Eye stalks */}
      <Path d="M14 32L10 28" stroke="#A1887F" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="10" cy="28" r="1.5" fill="#424242" />
      
      <Path d="M18 30L16 26" stroke="#A1887F" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="16" cy="26" r="1.5" fill="#424242" />
    </G>
    
    {/* Second smaller snail */}
    <G>
      <Circle cx="46" cy="28" r="10" fill="url(#snailShell)" />
      {/* Shell spiral */}
      <Circle cx="46" cy="28" r="6" fill="none" stroke="url(#shellPattern)" strokeWidth="1.5" />
      <Circle cx="46" cy="28" r="3" fill="#5D4037" />
      
      {/* Body */}
      <Path
        d="M40 34C38 36 38 40 40 42C44 44 48 42 50 40"
        fill="url(#snailBody)"
      />
      
      {/* Eye stalks */}
      <Path d="M38 34L36 32" stroke="#A1887F" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="36" cy="32" r="1" fill="#424242" />
    </G>
    
    {/* Sauce/broth in pot */}
    <G opacity="0.6">
      <Ellipse cx="32" cy="36" rx="18" ry="4" fill="#6D4C41" />
    </G>
    
    {/* Pepper garnish */}
    <G>
      <Circle cx="52" cy="36" r="2" fill="#F44336" />
      <Circle cx="48" cy="38" r="1.5" fill="#FF5722" />
    </G>
  </Svg>
);

export default SnailIllustration;
