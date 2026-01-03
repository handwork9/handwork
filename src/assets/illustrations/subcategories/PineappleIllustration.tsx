import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic pineapple illustration
const PineappleIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <RadialGradient id="pineappleBodyReal" cx="40%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="30%" stopColor="#FFB300" />
        <Stop offset="60%" stopColor="#FF8F00" />
        <Stop offset="100%" stopColor="#E65100" />
      </RadialGradient>
      <LinearGradient id="crownLeafReal" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#2E7D32" />
        <Stop offset="50%" stopColor="#43A047" />
        <Stop offset="100%" stopColor="#66BB6A" />
      </LinearGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="32" cy="62" rx="14" ry="2" fill="#3E2723" opacity="0.15" />
    
    {/* Pineapple body */}
    <Ellipse cx="32" cy="44" rx="16" ry="18" fill="url(#pineappleBodyReal)" />
    
    {/* Diamond/scale pattern - detailed */}
    <G opacity="0.5">
      {/* Row 1 */}
      <Path d="M24 30L28 26L32 30L28 34Z" stroke="#BF360C" strokeWidth="1" fill="none" />
      <Path d="M32 30L36 26L40 30L36 34Z" stroke="#BF360C" strokeWidth="1" fill="none" />
      {/* Row 2 */}
      <Path d="M20 38L24 34L28 38L24 42Z" stroke="#BF360C" strokeWidth="1" fill="none" />
      <Path d="M28 38L32 34L36 38L32 42Z" stroke="#BF360C" strokeWidth="1" fill="none" />
      <Path d="M36 38L40 34L44 38L40 42Z" stroke="#BF360C" strokeWidth="1" fill="none" />
      {/* Row 3 */}
      <Path d="M18 46L22 42L26 46L22 50Z" stroke="#BF360C" strokeWidth="0.8" fill="none" />
      <Path d="M26 46L30 42L34 46L30 50Z" stroke="#BF360C" strokeWidth="0.8" fill="none" />
      <Path d="M34 46L38 42L42 46L38 50Z" stroke="#BF360C" strokeWidth="0.8" fill="none" />
      <Path d="M42 46L46 42L50 46L46 50Z" stroke="#BF360C" strokeWidth="0.8" fill="none" />
      {/* Row 4 */}
      <Path d="M22 54L26 50L30 54L26 58Z" stroke="#BF360C" strokeWidth="0.8" fill="none" />
      <Path d="M30 54L34 50L38 54L34 58Z" stroke="#BF360C" strokeWidth="0.8" fill="none" />
      <Path d="M38 54L42 50L46 54L42 58Z" stroke="#BF360C" strokeWidth="0.8" fill="none" />
    </G>
    
    {/* Scale eye dots */}
    <G opacity="0.6">
      <Circle cx="28" cy="30" r="1" fill="#5D4037" />
      <Circle cx="36" cy="30" r="1" fill="#5D4037" />
      <Circle cx="24" cy="38" r="1" fill="#5D4037" />
      <Circle cx="32" cy="38" r="1" fill="#5D4037" />
      <Circle cx="40" cy="38" r="1" fill="#5D4037" />
      <Circle cx="26" cy="46" r="0.8" fill="#5D4037" />
      <Circle cx="34" cy="46" r="0.8" fill="#5D4037" />
      <Circle cx="42" cy="46" r="0.8" fill="#5D4037" />
    </G>
    
    {/* Crown leaves - spiky tropical */}
    <G>
      {/* Center leaves */}
      <Path d="M32 24C32 20 32 10 32 4" stroke="url(#crownLeafReal)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <Path d="M30 22C28 16 26 8 24 2" stroke="url(#crownLeafReal)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Path d="M34 22C36 16 38 8 40 2" stroke="url(#crownLeafReal)" strokeWidth="3" strokeLinecap="round" fill="none" />
      
      {/* Outer leaves */}
      <Path d="M28 24C24 20 18 14 14 10" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M36 24C40 20 46 14 50 10" stroke="#66BB6A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M26 26C20 22 12 18 8 16" stroke="#81C784" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M38 26C44 22 52 18 56 16" stroke="#81C784" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      {/* Inner accent leaves */}
      <Path d="M29 20C26 14 22 6 20 0" stroke="#A5D6A7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Path d="M35 20C38 14 42 6 44 0" stroke="#A5D6A7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </G>
    
    {/* Highlight */}
    <Ellipse cx="26" cy="40" rx="5" ry="10" fill="#FFECB3" opacity="0.35" />
    <Ellipse cx="24" cy="38" rx="2" ry="4" fill="#FFFDE7" opacity="0.3" />
  </Svg>
);

export default PineappleIllustration;
