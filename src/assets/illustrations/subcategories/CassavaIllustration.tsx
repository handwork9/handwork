import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CassavaIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cassavaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="100%" stopColor="#A1887F" />
      </LinearGradient>
      <LinearGradient id="cassavaInner" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#FFF8E1" />
      </LinearGradient>
    </Defs>
    
    {/* Cassava 1 - main */}
    <Path
      d="M20 8C16 10 14 20 16 36C18 52 24 60 28 60C32 60 36 52 36 36C36 20 32 10 28 8C24 6 22 6 20 8Z"
      fill="url(#cassavaGrad)"
    />
    
    {/* Bark texture */}
    <G opacity="0.4">
      <Path d="M20 16C22 16 26 16 28 16" stroke="#6D4C41" strokeWidth="0.5" />
      <Path d="M18 24C22 24 28 24 32 24" stroke="#6D4C41" strokeWidth="0.5" />
      <Path d="M18 32C22 32 30 32 34 32" stroke="#6D4C41" strokeWidth="0.5" />
      <Path d="M18 40C22 40 30 40 34 40" stroke="#6D4C41" strokeWidth="0.5" />
      <Path d="M20 48C24 48 28 48 32 48" stroke="#6D4C41" strokeWidth="0.5" />
    </G>
    
    {/* Cross section showing white interior */}
    <G>
      <Ellipse cx="27" cy="60" rx="8" ry="3" fill="url(#cassavaInner)" />
      <Circle cx="27" cy="60" r="2" fill="#D7CCC8" opacity="0.5" />
    </G>
    
    {/* Cassava 2 - smaller */}
    <Path
      d="M42 16C40 18 38 26 40 38C42 50 46 56 48 56C50 56 54 50 54 38C54 26 50 18 48 16C46 14 44 14 42 16Z"
      fill="url(#cassavaGrad)"
    />
    
    {/* Bark texture for second */}
    <G opacity="0.3">
      <Path d="M42 22C44 22 48 22 50 22" stroke="#6D4C41" strokeWidth="0.5" />
      <Path d="M40 30C44 30 50 30 52 30" stroke="#6D4C41" strokeWidth="0.5" />
      <Path d="M40 38C44 38 50 38 52 38" stroke="#6D4C41" strokeWidth="0.5" />
      <Path d="M42 46C44 46 48 46 50 46" stroke="#6D4C41" strokeWidth="0.5" />
    </G>
    
    {/* Stem/root connections */}
    <G>
      <Path d="M24 8C24 4 26 2 28 4" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
      <Path d="M46 16C46 12 48 10 50 12" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
    </G>
    
    {/* Some peeled bark showing */}
    <Path
      d="M34 28C36 30 36 34 34 36"
      stroke="#FFF8E1"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export default CassavaIllustration;
