import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic seafood illustration - fish, shrimp, crab
const SeafoodIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#29B6F6' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="fishBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4FC3F7" />
        <Stop offset="30%" stopColor="#29B6F6" />
        <Stop offset="70%" stopColor="#0288D1" />
        <Stop offset="100%" stopColor="#01579B" />
      </LinearGradient>
      <LinearGradient id="fishBelly" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#E1F5FE" />
        <Stop offset="100%" stopColor="#B3E5FC" />
      </LinearGradient>
      <RadialGradient id="shrimpBody" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFAB91" />
        <Stop offset="50%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#E64A19" />
      </RadialGradient>
      <LinearGradient id="crabShell" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF7043" />
        <Stop offset="50%" stopColor="#E64A19" />
        <Stop offset="100%" stopColor="#BF360C" />
      </LinearGradient>
    </Defs>
    
    {/* Fish */}
    <G>
      {/* Fish body */}
      <Path
        d="M6 28C6 20 14 12 30 12C46 12 54 20 54 28C54 36 46 44 30 44C14 44 6 36 6 28Z"
        fill="url(#fishBody)"
      />
      {/* Fish belly */}
      <Path
        d="M10 32C10 32 18 38 30 38C42 38 50 32 50 32C50 36 42 42 30 42C18 42 10 36 10 32Z"
        fill="url(#fishBelly)"
      />
      {/* Fish tail */}
      <Path
        d="M2 28L10 20V36L2 28Z"
        fill="url(#fishBody)"
      />
      <Path d="M4 28L8 24" stroke="#01579B" strokeWidth="0.8" opacity="0.4" />
      <Path d="M4 28L8 32" stroke="#01579B" strokeWidth="0.8" opacity="0.4" />
      {/* Dorsal fin */}
      <Path
        d="M24 12C24 12 28 4 32 4C36 4 38 12 38 12"
        fill="#0288D1"
      />
      {/* Pectoral fin */}
      <Path
        d="M20 32C18 36 22 40 26 38C24 34 22 32 20 32Z"
        fill="#0288D1"
      />
      {/* Fish scales pattern */}
      <G opacity="0.3">
        <Path d="M18 24C20 22 24 22 26 24C24 26 20 26 18 24Z" fill="#01579B" />
        <Path d="M26 24C28 22 32 22 34 24C32 26 28 26 26 24Z" fill="#01579B" />
        <Path d="M34 24C36 22 40 22 42 24C40 26 36 26 34 24Z" fill="#01579B" />
        <Path d="M22 30C24 28 28 28 30 30C28 32 24 32 22 30Z" fill="#01579B" />
        <Path d="M30 30C32 28 36 28 38 30C36 32 32 32 30 30Z" fill="#01579B" />
      </G>
      {/* Fish eye */}
      <Circle cx="46" cy="24" r="4" fill="#FFFFFF" />
      <Circle cx="47" cy="23" r="2.5" fill="#212121" />
      <Circle cx="48" cy="22" r="1" fill="#FFFFFF" />
      {/* Fish mouth */}
      <Path d="M52 28C54 26 54 30 52 28" stroke="#01579B" strokeWidth="1.5" />
      {/* Gill */}
      <Path d="M42 22C42 28 42 32 42 34" stroke="#0277BD" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Shrimp */}
    <G>
      <Path
        d="M48 48C46 46 44 48 44 50C44 52 46 56 50 58C54 60 58 58 60 56C62 54 60 50 58 50C56 50 54 52 52 52C50 52 50 50 48 48Z"
        fill="url(#shrimpBody)"
      />
      {/* Shrimp segments */}
      <Path d="M48 52C50 52 52 54 54 54" stroke="#BF360C" strokeWidth="0.6" opacity="0.4" />
      <Path d="M50 54C52 54 54 56 56 56" stroke="#BF360C" strokeWidth="0.6" opacity="0.4" />
      {/* Shrimp tail */}
      <Path d="M60 56C62 58 64 56 62 54" stroke="#E64A19" strokeWidth="2" strokeLinecap="round" />
      {/* Shrimp antennae */}
      <Path d="M46 48C44 46 42 44 40 46" stroke="#FF8A65" strokeWidth="0.8" />
      <Path d="M46 48C44 48 42 50 40 50" stroke="#FF8A65" strokeWidth="0.8" />
    </G>
    
    {/* Small crab claw */}
    <G>
      <Ellipse cx="58" cy="42" rx="4" ry="3" fill="url(#crabShell)" />
      <Path d="M60 40L64 38" stroke="#E64A19" strokeWidth="2" strokeLinecap="round" />
      <Path d="M62 42L64 44" stroke="#E64A19" strokeWidth="1.5" strokeLinecap="round" />
    </G>
    
    {/* Bubbles */}
    <G opacity="0.6">
      <Circle cx="56" cy="8" r="2" fill="#B3E5FC" />
      <Circle cx="60" cy="14" r="1.5" fill="#E1F5FE" />
      <Circle cx="52" cy="4" r="1" fill="#B3E5FC" />
    </G>
  </Svg>
);

export default SeafoodIllustration;
