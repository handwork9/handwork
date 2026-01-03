import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic onion illustration
const OnionIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Photorealistic onion body gradient */}
      <RadialGradient id="onionBodyReal" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#FFE0B2" />
        <Stop offset="30%" stopColor="#FFCC80" />
        <Stop offset="60%" stopColor="#FFB74D" />
        <Stop offset="85%" stopColor="#E65100" />
        <Stop offset="100%" stopColor="#BF360C" />
      </RadialGradient>
      <RadialGradient id="onionShineReal" cx="25%" cy="30%" r="35%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="onionNeckReal" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#EFEBE9" />
      </LinearGradient>
    </Defs>
    
    {/* Main onion body - bulb shape */}
    <Path
      d="M10 42C10 30 18 22 32 22C46 22 54 30 54 42C54 54 46 60 32 60C18 60 10 54 10 42Z"
      fill="url(#onionBodyReal)"
    />
    
    {/* Onion layer lines - papery skin texture */}
    <Path d="M14 38C20 32 28 28 32 28C36 28 44 32 50 38" stroke="#BF360C" strokeWidth="0.8" opacity="0.3" fill="none" />
    <Path d="M16 44C22 38 28 34 32 34C36 34 42 38 48 44" stroke="#BF360C" strokeWidth="0.7" opacity="0.25" fill="none" />
    <Path d="M18 50C24 44 28 40 32 40C36 40 40 44 46 50" stroke="#BF360C" strokeWidth="0.6" opacity="0.2" fill="none" />
    
    {/* Vertical layer lines */}
    <Path d="M24 26C22 34 22 46 24 56" stroke="#E65100" strokeWidth="0.5" opacity="0.2" />
    <Path d="M40 26C42 34 42 46 40 56" stroke="#E65100" strokeWidth="0.5" opacity="0.2" />
    
    {/* Highlight */}
    <Ellipse cx="22" cy="36" rx="6" ry="10" fill="url(#onionShineReal)" />
    
    {/* Root bottom - hairy roots */}
    <G>
      <Path d="M28 60C27 62 26 64 25 66" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" />
      <Path d="M30 60C30 63 29 65 28 66" stroke="#6D4C41" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M32 60C32 63 32 65 32 66" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" />
      <Path d="M34 60C34 63 35 65 36 66" stroke="#6D4C41" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M36 60C37 62 38 64 39 66" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Onion top/neck - papery */}
    <Path
      d="M26 22C26 18 28 14 32 14C36 14 38 18 38 22L38 28C36 26 34 24 32 24C30 24 28 26 26 28L26 22Z"
      fill="url(#onionNeckReal)"
    />
    
    {/* Neck texture */}
    <Path d="M28 18L28 24" stroke="#BCAAA4" strokeWidth="0.5" opacity="0.4" />
    <Path d="M32 16L32 24" stroke="#BCAAA4" strokeWidth="0.5" opacity="0.4" />
    <Path d="M36 18L36 24" stroke="#BCAAA4" strokeWidth="0.5" opacity="0.4" />
    
    {/* Green shoots sprouting */}
    <G>
      <Path d="M32 14C32 10 32 4 32 0" stroke="#43A047" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M32 14C30 10 28 6 26 2" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M32 14C34 10 36 6 38 2" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M32 14C28 12 24 10 22 6" stroke="#81C784" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Path d="M32 14C36 12 40 10 42 6" stroke="#81C784" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </G>
  </Svg>
);

export default OnionIllustration;
