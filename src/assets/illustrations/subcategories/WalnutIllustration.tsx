import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic walnut - whole and cracked
const WalnutIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="walnutShell" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="30%" stopColor="#6D4C41" />
        <Stop offset="70%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#4E342E" />
      </LinearGradient>
      <LinearGradient id="walnutMeat" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFECB3" />
        <Stop offset="30%" stopColor="#FFE082" />
        <Stop offset="70%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
      <LinearGradient id="walnutSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="woodSurface" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
    </Defs>
    
    {/* Wooden surface */}
    <G>
      <Path
        d="M0 50C0 48 10 46 32 46C54 46 64 48 64 50V62C64 64 54 66 32 66C10 66 0 64 0 62V50Z"
        fill="url(#woodSurface)"
      />
      {/* Wood grain */}
      <Path d="M8 52H56" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      <Path d="M12 58H52" stroke="#5D4037" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Cracked walnut half showing brain-like meat */}
    <G>
      {/* Shell half */}
      <Path
        d="M8 24C4 18 6 8 18 4C30 0 42 8 44 20C46 32 36 40 24 40C12 40 4 32 8 24Z"
        fill="url(#walnutShell)"
      />
      
      {/* Inner cavity */}
      <Path
        d="M12 22C10 18 12 12 20 10C28 8 36 14 36 22C36 30 28 34 20 34C14 34 10 28 12 22Z"
        fill="#3E2723"
      />
      
      {/* Walnut meat - brain-like pattern */}
      <Path
        d="M14 22C12 18 16 12 22 12C28 12 34 16 34 22C34 28 28 32 22 32C16 32 12 28 14 22Z"
        fill="url(#walnutMeat)"
      />
      
      {/* Brain-like ridges */}
      <Path d="M16 18C20 20 24 18 28 20" stroke="url(#walnutSkin)" strokeWidth="1.5" opacity="0.6" />
      <Path d="M18 24C22 22 26 24 30 22" stroke="url(#walnutSkin)" strokeWidth="1.5" opacity="0.6" />
      <Path d="M16 28C20 26 24 28 28 26" stroke="url(#walnutSkin)" strokeWidth="1" opacity="0.5" />
      <Path d="M22 14V30" stroke="url(#walnutSkin)" strokeWidth="1" opacity="0.4" />
      
      {/* Shell texture */}
      <Path d="M10 16C14 14 18 16 20 14" stroke="#4E342E" strokeWidth="0.8" opacity="0.5" />
      <Path d="M30 12C34 14 38 12 40 14" stroke="#4E342E" strokeWidth="0.8" opacity="0.5" />
    </G>
    
    {/* Whole walnut */}
    <G>
      <Ellipse cx="52" cy="28" rx="10" ry="12" fill="url(#walnutShell)" />
      {/* Shell seam line */}
      <Path d="M52 16V40" stroke="#4E342E" strokeWidth="1" opacity="0.6" />
      {/* Shell texture */}
      <Path d="M44 24C48 22 52 24 56 22" stroke="#3E2723" strokeWidth="0.8" opacity="0.5" />
      <Path d="M46 30C50 28 54 30 58 28" stroke="#3E2723" strokeWidth="0.8" opacity="0.5" />
      <Path d="M44 34C48 32 52 34 56 32" stroke="#3E2723" strokeWidth="0.6" opacity="0.4" />
    </G>
    
    {/* Shell piece on surface */}
    <G>
      <Path
        d="M26 50C24 48 26 44 32 44C38 44 42 48 40 52C38 56 30 56 28 54C26 52 24 52 26 50Z"
        fill="url(#walnutShell)"
      />
      <Path d="M30 48C34 50 36 48 38 50" stroke="#4E342E" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Loose walnut meat piece */}
    <G>
      <Path
        d="M48 50C46 48 48 44 52 44C56 44 58 48 56 52C54 56 50 56 48 54C48 52 46 52 48 50Z"
        fill="url(#walnutMeat)"
      />
      <Path d="M50 48C52 50 54 48 56 50" stroke="#8D6E63" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Shell fragments */}
    <G opacity="0.6">
      <Path d="M14 52C16 50 20 52 18 56C16 58 12 56 14 52Z" fill="#5D4037" />
      <Path d="M58 54C60 52 64 54 62 58C60 60 56 58 58 54Z" fill="#6D4C41" />
    </G>
  </Svg>
);

export default WalnutIllustration;
