import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic palm oil - red/orange oil in bottle
const PalmOilIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="palmOilColor" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF6B35" />
        <Stop offset="30%" stopColor="#E85D04" />
        <Stop offset="60%" stopColor="#DC2F02" />
        <Stop offset="100%" stopColor="#9D0208" />
      </LinearGradient>
      <LinearGradient id="palmOilGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
      </LinearGradient>
      <LinearGradient id="palmOilCap" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4A4A4A" />
        <Stop offset="50%" stopColor="#2D2D2D" />
        <Stop offset="100%" stopColor="#1A1A1A" />
      </LinearGradient>
      <RadialGradient id="palmOilShine" cx="30%" cy="30%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="32" cy="60" rx="14" ry="3" fill="#3E2723" opacity="0.2" />
    
    {/* Main bottle */}
    <G>
      {/* Bottle body */}
      <Path
        d="M18 22C18 20 20 18 24 18L24 14C24 12 26 10 28 10L36 10C38 10 40 12 40 14L40 18C44 18 46 20 46 22L46 54C46 58 42 60 32 60C22 60 18 58 18 54L18 22Z"
        fill="url(#palmOilColor)"
      />
      
      {/* Glass reflection */}
      <Path
        d="M22 24C22 22 24 20 28 20L28 54C22 54 22 52 22 50L22 24Z"
        fill="url(#palmOilGlass)"
      />
      
      {/* Oil surface shimmer */}
      <Ellipse cx="32" cy="20" rx="10" ry="2" fill="#FF8C42" opacity="0.6" />
      
      {/* Shine highlight */}
      <Path
        d="M24 26C24 24 26 22 28 22L28 40C26 40 24 38 24 36L24 26Z"
        fill="url(#palmOilShine)"
      />
    </G>
    
    {/* Bottle neck */}
    <Path
      d="M26 10L26 6C26 4 28 2 32 2C36 2 38 4 38 6L38 10"
      fill="#E85D04"
    />
    
    {/* Cap */}
    <Path
      d="M26 6L26 2C26 0 28 -2 32 -2C36 -2 38 0 38 2L38 6C38 8 36 8 32 8C28 8 26 8 26 6Z"
      fill="url(#palmOilCap)"
    />
    <Ellipse cx="32" cy="2" rx="6" ry="2" fill="#3D3D3D" />
    
    {/* Label area */}
    <G>
      <Path
        d="M22 34L42 34L42 48L22 48Z"
        fill="#FFF8E1"
        opacity="0.9"
      />
      {/* Palm fruit icon on label */}
      <Circle cx="32" cy="38" r="3" fill="#E85D04" />
      <Circle cx="30" cy="36" r="2" fill="#DC2F02" />
      <Circle cx="34" cy="36" r="2" fill="#FF6B35" />
      <Path d="M32 42L30 46" stroke="#2E7D32" strokeWidth="1" />
      <Path d="M32 42L34 46" stroke="#388E3C" strokeWidth="1" />
    </G>
    
    {/* Small bowl of palm oil */}
    <G>
      <Ellipse cx="54" cy="52" rx="8" ry="4" fill="#8D6E63" />
      <Ellipse cx="54" cy="50" rx="7" ry="3.5" fill="url(#palmOilColor)" />
      <Ellipse cx="52" cy="49" rx="2" ry="1" fill="#FF8C42" opacity="0.5" />
    </G>
  </Svg>
);

export default PalmOilIllustration;
