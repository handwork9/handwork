import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic fish illustration
const FishIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="fishBodyReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#0277BD" />
        <Stop offset="30%" stopColor="#0288D1" />
        <Stop offset="50%" stopColor="#03A9F4" />
        <Stop offset="100%" stopColor="#81D4FA" />
      </LinearGradient>
      <RadialGradient id="fishBellyReal" cx="50%" cy="80%" r="60%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#E1F5FE" />
        <Stop offset="100%" stopColor="#B3E5FC" />
      </RadialGradient>
      <LinearGradient id="fishFinReal" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#01579B" />
        <Stop offset="100%" stopColor="#0288D1" />
      </LinearGradient>
      <RadialGradient id="fishShine" cx="30%" cy="30%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    
    {/* Tail fin - forked */}
    <Path
      d="M4 32L16 18L16 28L16 36L16 46L4 32Z"
      fill="url(#fishFinReal)"
    />
    <Path d="M12 24L16 28" stroke="#01579B" strokeWidth="0.5" opacity="0.4" />
    <Path d="M12 40L16 36" stroke="#01579B" strokeWidth="0.5" opacity="0.4" />
    
    {/* Fish body */}
    <Path
      d="M10 32C10 20 22 12 40 12C56 12 62 22 62 32C62 42 56 52 40 52C22 52 10 44 10 32Z"
      fill="url(#fishBodyReal)"
    />
    
    {/* Belly - silvery white */}
    <Path
      d="M14 38C14 44 24 50 40 50C54 50 60 44 60 40C60 40 52 48 40 48C26 48 14 44 14 38Z"
      fill="url(#fishBellyReal)"
    />
    
    {/* Dorsal fin - top */}
    <Path
      d="M30 12C30 12 38 2 46 4C48 8 42 14 30 12Z"
      fill="url(#fishFinReal)"
    />
    <Path d="M34 6C40 6 44 8 44 10" stroke="#0277BD" strokeWidth="0.5" opacity="0.5" />
    
    {/* Pectoral fin - side */}
    <Path
      d="M28 36C22 40 16 46 20 48C26 48 32 42 28 36Z"
      fill="#29B6F6"
    />
    <Path d="M22 42C26 42 30 40 30 38" stroke="#0288D1" strokeWidth="0.5" opacity="0.4" />
    
    {/* Ventral fin - bottom */}
    <Path
      d="M34 52C34 52 40 58 44 56C44 54 40 52 34 52Z"
      fill="url(#fishFinReal)"
    />
    
    {/* Scales pattern - detailed */}
    <G opacity="0.3">
      <Path d="M24 24C27 22 31 22 34 24C31 26 27 26 24 24Z" fill="#01579B" />
      <Path d="M36 24C39 22 43 22 46 24C43 26 39 26 36 24Z" fill="#01579B" />
      <Path d="M48 24C51 22 55 22 58 24C55 26 51 26 48 24Z" fill="#01579B" />
      <Path d="M18 30C21 28 25 28 28 30C25 32 21 32 18 30Z" fill="#01579B" />
      <Path d="M30 30C33 28 37 28 40 30C37 32 33 32 30 30Z" fill="#01579B" />
      <Path d="M42 30C45 28 49 28 52 30C49 32 45 32 42 30Z" fill="#01579B" />
      <Path d="M24 36C27 34 31 34 34 36C31 38 27 38 24 36Z" fill="#01579B" />
      <Path d="M36 36C39 34 43 34 46 36C43 38 39 38 36 36Z" fill="#01579B" />
    </G>
    
    {/* Lateral line */}
    <Path d="M16 32C30 32 48 32 58 32" stroke="#0277BD" strokeWidth="0.8" opacity="0.4" />
    
    {/* Eye */}
    <Circle cx="54" cy="26" r="5" fill="#FFFFFF" />
    <Circle cx="55" cy="25" r="3" fill="#212121" />
    <Circle cx="56" cy="24" r="1.2" fill="#FFFFFF" />
    
    {/* Mouth */}
    <Path
      d="M60 34C58 32 58 36 60 34"
      stroke="#01579B"
      strokeWidth="2"
      strokeLinecap="round"
    />
    
    {/* Gill slit */}
    <Path d="M48 28C46 32 46 36 48 40" stroke="#0277BD" strokeWidth="1" opacity="0.5" />
    
    {/* Body shine */}
    <Ellipse cx="34" cy="24" rx="10" ry="6" fill="url(#fishShine)" />
  </Svg>
);

export default FishIllustration;
