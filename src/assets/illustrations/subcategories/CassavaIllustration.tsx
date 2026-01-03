import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic cassava/yuca root illustration
const CassavaIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cassavaSkinReal" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="30%" stopColor="#A1887F" />
        <Stop offset="70%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <RadialGradient id="cassavaFleshReal" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="60%" stopColor="#FFF8E1" />
        <Stop offset="100%" stopColor="#FFECB3" />
      </RadialGradient>
      <LinearGradient id="cassavaWaxReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#A1887F" />
      </LinearGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="26" cy="62" rx="14" ry="2" fill="#3E2723" opacity="0.15" />
    <Ellipse cx="48" cy="60" rx="10" ry="2" fill="#3E2723" opacity="0.12" />
    
    {/* Cassava 1 - main large root */}
    <G>
      <Path
        d="M18 6C12 10 10 22 12 38C14 54 22 62 28 62C34 62 38 54 38 38C38 22 34 10 28 6C24 4 20 4 18 6Z"
        fill="url(#cassavaSkinReal)"
      />
      
      {/* Bark texture rings */}
      <Path d="M14 16C18 14 28 14 34 16" stroke="#6D4C41" strokeWidth="0.6" opacity="0.5" />
      <Path d="M12 26C18 24 30 24 36 26" stroke="#6D4C41" strokeWidth="0.6" opacity="0.45" />
      <Path d="M12 36C18 34 32 34 36 36" stroke="#6D4C41" strokeWidth="0.6" opacity="0.4" />
      <Path d="M14 46C20 44 32 44 36 46" stroke="#6D4C41" strokeWidth="0.6" opacity="0.35" />
      <Path d="M16 54C22 52 30 52 34 54" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      
      {/* Vertical bark lines */}
      <Path d="M20 10C18 24 20 42 22 56" stroke="#5D4037" strokeWidth="0.4" opacity="0.3" />
      <Path d="M32 10C30 24 32 42 30 58" stroke="#5D4037" strokeWidth="0.4" opacity="0.25" />
      
      {/* Highlight */}
      <Path d="M16 12C18 20 18 34 18 48" stroke="#D7CCC8" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      
      {/* Root marks */}
      <Circle cx="18" cy="22" r="1.5" fill="#5D4037" opacity="0.4" />
      <Circle cx="30" cy="34" r="1.2" fill="#5D4037" opacity="0.35" />
      <Circle cx="22" cy="48" r="1.3" fill="#5D4037" opacity="0.35" />
    </G>
    
    {/* Cross section showing white flesh */}
    <G>
      <Ellipse cx="28" cy="62" rx="10" ry="4" fill="url(#cassavaFleshReal)" />
      {/* Core fiber */}
      <Circle cx="28" cy="62" r="2.5" fill="#EFEBE9" />
      <Circle cx="28" cy="62" r="1" fill="#D7CCC8" />
    </G>
    
    {/* Cassava 2 - smaller root */}
    <G>
      <Path
        d="M44 14C40 18 38 28 40 40C42 52 48 58 52 58C56 58 60 52 60 40C60 28 56 18 52 14C50 12 46 12 44 14Z"
        fill="url(#cassavaSkinReal)"
      />
      
      {/* Bark texture */}
      <Path d="M42 22C46 20 54 20 58 22" stroke="#6D4C41" strokeWidth="0.5" opacity="0.4" />
      <Path d="M40 32C46 30 56 30 58 32" stroke="#6D4C41" strokeWidth="0.5" opacity="0.35" />
      <Path d="M42 42C48 40 56 40 58 42" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      <Path d="M44 50C50 48 54 48 56 50" stroke="#6D4C41" strokeWidth="0.4" opacity="0.25" />
      
      {/* Highlight */}
      <Path d="M44 18C44 28 46 40 46 50" stroke="#D7CCC8" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    </G>
    
    {/* Stem/root connections at top */}
    <G>
      <Path d="M24 6C24 2 26 0 28 2" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="24" cy="6" r="2" fill="#8D6E63" />
      <Path d="M50 14C50 10 52 8 54 10" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="50" cy="14" r="1.5" fill="#8D6E63" />
    </G>
    
    {/* Peeled bark showing white */}
    <Path
      d="M36 30C38 32 38 38 36 42"
      stroke="url(#cassavaFleshReal)"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </Svg>
);

export default CassavaIllustration;
