import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic processed honey - squeeze bottle with smooth, clear honey
const ProcessedHoneyIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="processedHoney" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="50%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FFB300" />
      </LinearGradient>
      <LinearGradient id="clearHoney" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFECB3" stopOpacity="0.8" />
        <Stop offset="50%" stopColor="#FFD54F" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#FFECB3" stopOpacity="0.8" />
      </LinearGradient>
      <LinearGradient id="plasticBottle" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="15%" stopColor="#FFFFFF" stopOpacity="0.2" />
        <Stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
      </LinearGradient>
      <LinearGradient id="yellowCap" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFC107" />
        <Stop offset="50%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
    </Defs>
    
    {/* Bear-shaped squeeze bottle silhouette */}
    <G>
      {/* Main body - bear shape */}
      <Path
        d="M20 24C18 24 16 28 16 36C16 44 18 54 22 58C26 62 38 62 42 58C46 54 48 44 48 36C48 28 46 24 44 24C44 20 42 16 40 16C40 14 38 12 36 12H28C26 12 24 14 24 16C22 16 20 20 20 24Z"
        fill="url(#processedHoney)"
        stroke="#FF8F00"
        strokeWidth="0.5"
      />
      
      {/* Smooth honey appearance */}
      <Path
        d="M20 30C20 28 22 26 32 26C42 26 44 28 44 30V52C44 56 40 58 32 58C24 58 20 56 20 52V30Z"
        fill="url(#clearHoney)"
        opacity="0.5"
      />
      
      {/* Bear ears */}
      <Circle cx="22" cy="18" r="4" fill="url(#processedHoney)" stroke="#FF8F00" strokeWidth="0.5" />
      <Circle cx="42" cy="18" r="4" fill="url(#processedHoney)" stroke="#FF8F00" strokeWidth="0.5" />
      <Circle cx="22" cy="18" r="2" fill="#FFB300" />
      <Circle cx="42" cy="18" r="2" fill="#FFB300" />
      
      {/* Bear face area */}
      <Ellipse cx="32" cy="24" rx="8" ry="6" fill="#FFE082" opacity="0.4" />
      
      {/* Bear eyes */}
      <Circle cx="28" cy="22" r="1.5" fill="#5D4037" />
      <Circle cx="36" cy="22" r="1.5" fill="#5D4037" />
      <Circle cx="28.5" cy="21.5" r="0.5" fill="#FFFFFF" />
      <Circle cx="36.5" cy="21.5" r="0.5" fill="#FFFFFF" />
      
      {/* Bear nose */}
      <Ellipse cx="32" cy="26" rx="2" ry="1.5" fill="#5D4037" />
      
      {/* Bottle shine */}
      <Path
        d="M22 30C22 28 24 26 26 26V50C24 50 22 48 22 46V30Z"
        fill="url(#plasticBottle)"
      />
    </G>
    
    {/* Squeeze cap/nozzle */}
    <G>
      <Path
        d="M28 8L28 12H36L36 8C36 6 34 4 32 4C30 4 28 6 28 8Z"
        fill="url(#yellowCap)"
        stroke="#E65100"
        strokeWidth="0.5"
      />
      {/* Nozzle tip */}
      <Rect x="30" y="2" width="4" height="3" rx="1" fill="#FF8F00" />
      {/* Cap ridges */}
      <Path d="M28 6H36" stroke="#E65100" strokeWidth="0.5" opacity="0.5" />
      <Path d="M28 8H36" stroke="#E65100" strokeWidth="0.5" opacity="0.5" />
      <Path d="M28 10H36" stroke="#E65100" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Honey drip from nozzle */}
    <G>
      <Path
        d="M32 2C32 0 34 -2 34 0C34 2 34 4 32 4"
        fill="#FFB300"
        opacity="0"
      />
    </G>
    
    {/* Label area */}
    <G>
      <Rect x="24" y="38" width="16" height="10" rx="2" fill="#FFFFFF" opacity="0.7" />
      <Path d="M26 42H38" stroke="#FF8F00" strokeWidth="1.5" />
      <Path d="M28 45H36" stroke="#FFC107" strokeWidth="1" />
    </G>
    
    {/* Honey level line */}
    <Path d="M20 32C26 30 38 30 44 32" stroke="#FFE082" strokeWidth="1" opacity="0.6" />
  </Svg>
);

export default ProcessedHoneyIllustration;
