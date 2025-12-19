import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Wara - Nigerian soft cheese made from cow milk
const WaraIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="waraWhite" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="50%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#EEEEEE" />
      </LinearGradient>
      <LinearGradient id="waraCream" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="100%" stopColor="#FFECB3" />
      </LinearGradient>
      <LinearGradient id="calabash" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="leaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#388E3C" />
      </LinearGradient>
    </Defs>
    
    {/* Calabash bowl */}
    <G>
      <Path
        d="M8 36C8 28 16 24 32 24C48 24 56 28 56 36V48C56 54 48 58 32 58C16 58 8 54 8 48V36Z"
        fill="url(#calabash)"
        stroke="#5D4037"
        strokeWidth="0.5"
      />
      
      {/* Bowl rim */}
      <Ellipse cx="32" cy="24" rx="24" ry="6" fill="#A1887F" stroke="#6D4C41" strokeWidth="0.5" />
      
      {/* Bowl inner shadow */}
      <Ellipse cx="32" cy="28" rx="20" ry="4" fill="#5D4037" opacity="0.3" />
      
      {/* Decorative pattern on bowl */}
      <Path d="M12 40C16 38 20 42 24 40C28 38 32 42 36 40C40 38 44 42 48 40C52 38 54 40 54 40" 
        stroke="#6D4C41" strokeWidth="1" fill="none" opacity="0.5" />
    </G>
    
    {/* Wara pieces in bowl */}
    <G>
      {/* Large wara piece */}
      <Ellipse cx="28" cy="32" rx="10" ry="6" fill="url(#waraWhite)" />
      <Ellipse cx="28" cy="30" rx="9" ry="4" fill="#FAFAFA" />
      
      {/* Second wara piece */}
      <Ellipse cx="40" cy="34" rx="8" ry="5" fill="url(#waraCream)" />
      <Ellipse cx="40" cy="32" rx="7" ry="3" fill="#FFF8E1" />
      
      {/* Small wara piece */}
      <Ellipse cx="22" cy="38" rx="6" ry="4" fill="url(#waraWhite)" />
      
      {/* Texture on wara - soft cheese texture */}
      <Circle cx="26" cy="30" r="1" fill="#E0E0E0" opacity="0.5" />
      <Circle cx="30" cy="32" r="0.8" fill="#E0E0E0" opacity="0.4" />
      <Circle cx="38" cy="32" r="1" fill="#FFE082" opacity="0.3" />
      <Circle cx="42" cy="34" r="0.6" fill="#FFE082" opacity="0.3" />
    </G>
    
    {/* Banana leaf underneath (traditional serving) */}
    <G>
      <Path
        d="M2 50C4 48 10 52 16 48C22 44 28 50 32 48C36 46 42 50 48 48C54 46 60 50 62 48"
        fill="url(#leaf)"
        opacity="0.6"
      />
      <Path
        d="M2 52C4 50 10 54 16 50C22 46 28 52 32 50C36 48 42 52 48 50C54 48 60 52 62 50"
        fill="url(#leaf)"
        opacity="0.4"
      />
      {/* Leaf vein */}
      <Path d="M2 51L62 49" stroke="#2E7D32" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Steam wisps (fresh wara) */}
    <G opacity="0.3">
      <Path d="M24 20C24 18 26 16 26 14" stroke="#BDBDBD" strokeWidth="1" strokeLinecap="round" fill="none" />
      <Path d="M32 18C32 16 34 14 34 12" stroke="#BDBDBD" strokeWidth="1" strokeLinecap="round" fill="none" />
      <Path d="M40 20C40 18 42 16 42 14" stroke="#BDBDBD" strokeWidth="1" strokeLinecap="round" fill="none" />
    </G>
  </Svg>
);

export default WaraIllustration;
