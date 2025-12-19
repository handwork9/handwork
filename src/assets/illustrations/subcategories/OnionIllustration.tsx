import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const OnionIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="onionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
    </Defs>
    
    {/* Onion body */}
    <Ellipse cx="32" cy="40" rx="20" ry="18" fill="url(#onionGrad)" />
    
    {/* Onion layers */}
    <Path
      d="M16 40C16 40 24 32 32 32C40 32 48 40 48 40"
      stroke="#BF360C"
      strokeWidth="0.8"
      opacity="0.3"
      fill="none"
    />
    <Path
      d="M18 44C18 44 26 36 32 36C38 36 46 44 46 44"
      stroke="#BF360C"
      strokeWidth="0.8"
      opacity="0.3"
      fill="none"
    />
    
    {/* Root bottom */}
    <G>
      <Path d="M30 58C30 60 29 62 28 62" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" />
      <Path d="M32 58C32 60 32 62 32 62" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" />
      <Path d="M34 58C34 60 35 62 36 62" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Onion top/neck */}
    <Path
      d="M28 24C28 24 30 22 32 22C34 22 36 24 36 24L36 32C36 32 34 30 32 30C30 30 28 32 28 32L28 24Z"
      fill="#D7CCC8"
    />
    
    {/* Green shoots */}
    <G>
      <Path
        d="M32 22C32 22 32 8 32 4"
        stroke="#4CAF50"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M30 20C28 16 26 10 26 6"
        stroke="#66BB6A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M34 20C36 16 38 10 38 6"
        stroke="#66BB6A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </G>
    
    {/* Highlight */}
    <Ellipse cx="24" cy="38" rx="5" ry="8" fill="#FFE0B2" opacity="0.5" />
  </Svg>
);

export default OnionIllustration;
