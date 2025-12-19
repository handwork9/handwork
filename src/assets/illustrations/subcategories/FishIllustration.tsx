import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const FishIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="fishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#4FC3F7" />
        <Stop offset="100%" stopColor="#0288D1" />
      </LinearGradient>
      <LinearGradient id="fishBelly" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E1F5FE" />
        <Stop offset="100%" stopColor="#81D4FA" />
      </LinearGradient>
    </Defs>
    
    {/* Fish body */}
    <Path
      d="M8 32C8 22 18 14 36 14C54 14 60 24 60 32C60 40 54 50 36 50C18 50 8 42 8 32Z"
      fill="url(#fishGrad)"
    />
    
    {/* Belly */}
    <Path
      d="M14 36C14 42 22 46 36 46C50 46 56 42 56 38C56 38 48 44 36 44C24 44 14 40 14 36Z"
      fill="url(#fishBelly)"
    />
    
    {/* Tail fin */}
    <Path
      d="M4 32L14 22V42L4 32Z"
      fill="#0288D1"
    />
    
    {/* Dorsal fin */}
    <Path
      d="M30 14C30 14 36 6 42 8C42 12 38 14 30 14Z"
      fill="#039BE5"
    />
    
    {/* Bottom fin */}
    <Path
      d="M32 50C32 50 36 56 40 54C40 52 36 50 32 50Z"
      fill="#0288D1"
    />
    
    {/* Side fin */}
    <Path
      d="M26 36C22 38 18 42 20 44C24 44 28 40 26 36Z"
      fill="#29B6F6"
    />
    
    {/* Scales pattern */}
    <G opacity="0.3">
      <Path d="M22 28C24 26 28 26 30 28C28 30 24 30 22 28Z" fill="#01579B" />
      <Path d="M32 28C34 26 38 26 40 28C38 30 34 30 32 28Z" fill="#01579B" />
      <Path d="M42 28C44 26 48 26 50 28C48 30 44 30 42 28Z" fill="#01579B" />
      <Path d="M27 34C29 32 33 32 35 34C33 36 29 36 27 34Z" fill="#01579B" />
      <Path d="M37 34C39 32 43 32 45 34C43 36 39 36 37 34Z" fill="#01579B" />
    </G>
    
    {/* Eye */}
    <Circle cx="52" cy="28" r="5" fill="#FFFFFF" />
    <Circle cx="53" cy="27" r="3" fill="#212121" />
    <Circle cx="54" cy="26" r="1" fill="#FFFFFF" />
    
    {/* Mouth */}
    <Path
      d="M58 34C56 32 56 36 58 34"
      stroke="#01579B"
      strokeWidth="2"
      strokeLinecap="round"
    />
    
    {/* Gill */}
    <Path
      d="M46 30C44 34 44 38 46 42"
      stroke="#0277BD"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
    
    {/* Bubbles */}
    <G>
      <Circle cx="60" cy="20" r="2" fill="#B3E5FC" />
      <Circle cx="58" cy="14" r="1.5" fill="#B3E5FC" />
      <Circle cx="62" cy="10" r="1" fill="#B3E5FC" />
    </G>
  </Svg>
);

export default FishIllustration;
