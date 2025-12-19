import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const BananaIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF176" />
        <Stop offset="100%" stopColor="#FBC02D" />
      </LinearGradient>
    </Defs>
    
    {/* Banana bunch */}
    {/* Banana 1 */}
    <Path
      d="M12 48C8 44 6 36 10 28C14 20 22 16 28 18C28 22 24 30 20 38C16 46 14 50 12 48Z"
      fill="url(#bananaGrad)"
    />
    <Path d="M14 44C12 40 12 32 16 26" stroke="#F9A825" strokeWidth="0.8" opacity="0.5" />
    
    {/* Banana 2 */}
    <Path
      d="M22 52C18 50 14 42 16 32C18 22 26 16 34 16C36 20 34 30 30 40C26 50 24 54 22 52Z"
      fill="url(#bananaGrad)"
    />
    <Path d="M24 48C22 44 22 34 26 26" stroke="#F9A825" strokeWidth="0.8" opacity="0.5" />
    
    {/* Banana 3 */}
    <Path
      d="M34 54C30 52 26 44 28 34C30 24 38 18 46 18C48 22 46 32 42 42C38 52 36 56 34 54Z"
      fill="url(#bananaGrad)"
    />
    <Path d="M36 50C34 46 34 36 38 28" stroke="#F9A825" strokeWidth="0.8" opacity="0.5" />
    
    {/* Banana 4 */}
    <Path
      d="M46 52C42 50 40 42 44 32C48 22 54 18 58 22C58 28 54 38 48 46C44 52 46 54 46 52Z"
      fill="url(#bananaGrad)"
    />
    
    {/* Stem/top */}
    <Path
      d="M28 18C28 14 32 10 38 10C44 10 48 12 50 16"
      stroke="#5D4037"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    
    {/* Tips */}
    <Circle cx="12" cy="48" r="2" fill="#5D4037" />
    <Circle cx="22" cy="52" r="2" fill="#5D4037" />
    <Circle cx="34" cy="54" r="2" fill="#5D4037" />
    <Circle cx="46" cy="52" r="2" fill="#6D4C41" />
  </Svg>
);

export default BananaIllustration;
