import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const PineappleIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="pineappleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
    </Defs>
    
    {/* Pineapple body */}
    <Ellipse cx="32" cy="42" rx="16" ry="20" fill="url(#pineappleGrad)" />
    
    {/* Diamond pattern */}
    <G opacity="0.4">
      {/* Row 1 */}
      <Path d="M24 30L28 26L32 30L28 34Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      <Path d="M32 30L36 26L40 30L36 34Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      {/* Row 2 */}
      <Path d="M20 38L24 34L28 38L24 42Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      <Path d="M28 38L32 34L36 38L32 42Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      <Path d="M36 38L40 34L44 38L40 42Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      {/* Row 3 */}
      <Path d="M22 46L26 42L30 46L26 50Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      <Path d="M30 46L34 42L38 46L34 50Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      <Path d="M38 46L42 42L46 46L42 50Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      {/* Row 4 */}
      <Path d="M26 54L30 50L34 54L30 58Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
      <Path d="M34 54L38 50L42 54L38 58Z" stroke="#E65100" strokeWidth="0.8" fill="none" />
    </G>
    
    {/* Crown leaves */}
    <G>
      <Path d="M32 22C32 22 32 8 32 4" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
      <Path d="M28 24C24 20 20 12 18 6" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M36 24C40 20 44 12 46 6" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M26 22C22 18 16 14 12 12" stroke="#81C784" strokeWidth="2" strokeLinecap="round" />
      <Path d="M38 22C42 18 48 14 52 12" stroke="#81C784" strokeWidth="2" strokeLinecap="round" />
      <Path d="M30 20C28 16 24 10 22 6" stroke="#A5D6A7" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M34 20C36 16 40 10 42 6" stroke="#A5D6A7" strokeWidth="1.5" strokeLinecap="round" />
    </G>
    
    {/* Highlight */}
    <Ellipse cx="26" cy="40" rx="4" ry="8" fill="#FFECB3" opacity="0.4" />
  </Svg>
);

export default PineappleIllustration;
