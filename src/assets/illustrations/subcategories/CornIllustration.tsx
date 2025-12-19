import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CornIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF176" />
        <Stop offset="100%" stopColor="#FBC02D" />
      </LinearGradient>
    </Defs>
    
    {/* Corn cob base */}
    <Path
      d="M22 16C18 18 16 32 18 46C20 56 28 60 32 60C36 60 44 56 46 46C48 32 46 18 42 16C38 14 26 14 22 16Z"
      fill="url(#cornGrad)"
    />
    
    {/* Corn kernels - Row pattern */}
    <G>
      {/* Column 1 */}
      <Circle cx="24" cy="24" r="3" fill="#FFD54F" />
      <Circle cx="24" cy="32" r="3" fill="#FFD54F" />
      <Circle cx="24" cy="40" r="3" fill="#FFD54F" />
      <Circle cx="24" cy="48" r="3" fill="#FFD54F" />
      
      {/* Column 2 */}
      <Circle cx="32" cy="20" r="3" fill="#FFEB3B" />
      <Circle cx="32" cy="28" r="3" fill="#FFEB3B" />
      <Circle cx="32" cy="36" r="3" fill="#FFEB3B" />
      <Circle cx="32" cy="44" r="3" fill="#FFEB3B" />
      <Circle cx="32" cy="52" r="3" fill="#FFEB3B" />
      
      {/* Column 3 */}
      <Circle cx="40" cy="24" r="3" fill="#FFD54F" />
      <Circle cx="40" cy="32" r="3" fill="#FFD54F" />
      <Circle cx="40" cy="40" r="3" fill="#FFD54F" />
      <Circle cx="40" cy="48" r="3" fill="#FFD54F" />
    </G>
    
    {/* Husk leaves */}
    <G>
      <Path
        d="M22 16C16 14 10 18 8 26C6 34 10 42 16 44C16 36 18 24 22 16Z"
        fill="#8BC34A"
      />
      <Path
        d="M42 16C48 14 54 18 56 26C58 34 54 42 48 44C48 36 46 24 42 16Z"
        fill="#7CB342"
      />
      <Path
        d="M20 14C14 10 8 12 6 18C4 24 8 30 12 32C14 24 18 18 20 14Z"
        fill="#9CCC65"
      />
      <Path
        d="M44 14C50 10 56 12 58 18C60 24 56 30 52 32C50 24 46 18 44 14Z"
        fill="#AED581"
      />
    </G>
    
    {/* Silk/hair at top */}
    <G>
      <Path d="M28 16C26 12 24 6 26 4" stroke="#FDD835" strokeWidth="1" strokeLinecap="round" />
      <Path d="M32 14C32 10 32 4 34 2" stroke="#FFEB3B" strokeWidth="1" strokeLinecap="round" />
      <Path d="M36 16C38 12 40 6 38 4" stroke="#FDD835" strokeWidth="1" strokeLinecap="round" />
    </G>
  </Svg>
);

export default CornIllustration;
