import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic carrot illustration
const CarrotIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Photorealistic carrot body gradient */}
      <LinearGradient id="carrotBodyReal" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E65100" />
        <Stop offset="25%" stopColor="#FF9800" />
        <Stop offset="50%" stopColor="#FFB74D" />
        <Stop offset="75%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <LinearGradient id="carrotTipReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#BF360C" />
      </LinearGradient>
      <LinearGradient id="carrotLeafReal" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#2E7D32" />
        <Stop offset="50%" stopColor="#43A047" />
        <Stop offset="100%" stopColor="#81C784" />
      </LinearGradient>
    </Defs>
    
    {/* Main carrot body - tapered realistic shape */}
    <Path
      d="M24 10C22 10 20 14 20 22C20 32 22 42 24 50C26 56 30 62 32 64C34 62 38 56 40 50C42 42 44 32 44 22C44 14 42 10 40 10C36 10 32 8 32 8C32 8 28 10 24 10Z"
      fill="url(#carrotBodyReal)"
    />
    
    {/* Carrot ring texture lines */}
    <Path d="M21 18C24 17 40 17 43 18" stroke="#E65100" strokeWidth="0.6" opacity="0.4" />
    <Path d="M21 26C24 25 40 25 43 26" stroke="#E65100" strokeWidth="0.6" opacity="0.4" />
    <Path d="M22 34C25 33 39 33 42 34" stroke="#E65100" strokeWidth="0.6" opacity="0.4" />
    <Path d="M24 42C27 41 37 41 40 42" stroke="#E65100" strokeWidth="0.6" opacity="0.4" />
    <Path d="M26 50C28 49 36 49 38 50" stroke="#E65100" strokeWidth="0.6" opacity="0.4" />
    <Path d="M28 56C30 55 34 55 36 56" stroke="#E65100" strokeWidth="0.6" opacity="0.4" />
    
    {/* Left highlight */}
    <Path d="M22 14C22 22 23 34 25 46C27 54 29 60 31 62" stroke="#FFE0B2" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
    
    {/* Right shadow */}
    <Path d="M42 14C42 22 41 34 39 46" stroke="#BF360C" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
    
    {/* Carrot tip */}
    <Path d="M30 60C31 62 32 64 32 64C32 64 33 62 34 60" fill="url(#carrotTipReal)" />
    
    {/* Feathery green tops */}
    <G>
      {/* Main center leaves */}
      <Path d="M32 10C32 6 31 2 29 0" stroke="url(#carrotLeafReal)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M32 10C32 6 33 2 35 0" stroke="url(#carrotLeafReal)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M32 10C32 4 32 0 32 -2" stroke="url(#carrotLeafReal)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      
      {/* Side leaves */}
      <Path d="M32 10C28 8 24 6 20 4" stroke="#66BB6A" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M32 10C36 8 40 6 44 4" stroke="#66BB6A" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      {/* Smaller feather leaves */}
      <Path d="M28 6C26 4 24 2 22 0" stroke="#81C784" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Path d="M36 6C38 4 40 2 42 0" stroke="#81C784" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Path d="M26 8C23 6 20 4 18 2" stroke="#A5D6A7" strokeWidth="1" strokeLinecap="round" fill="none" />
      <Path d="M38 8C41 6 44 4 46 2" stroke="#A5D6A7" strokeWidth="1" strokeLinecap="round" fill="none" />
      
      {/* Crown base */}
      <Ellipse cx="32" cy="10" rx="6" ry="2.5" fill="#558B2F" />
    </G>
    
    {/* Small texture marks */}
    <Circle cx="26" cy="24" r="0.8" fill="#BF360C" opacity="0.3" />
    <Circle cx="38" cy="30" r="0.6" fill="#BF360C" opacity="0.25" />
    <Circle cx="30" cy="40" r="0.7" fill="#BF360C" opacity="0.3" />
    <Circle cx="36" cy="48" r="0.5" fill="#BF360C" opacity="0.25" />
  </Svg>
);

export default CarrotIllustration;
