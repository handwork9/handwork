import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';

interface PineappleRealisticIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const PineappleRealisticIllustration: React.FC<PineappleRealisticIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#FFA000',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="pineappleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD54F" />
          <Stop offset="50%" stopColor={color} />
          <Stop offset="100%" stopColor="#FF8F00" />
        </LinearGradient>
        <LinearGradient id="leafGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#388E3C" />
          <Stop offset="100%" stopColor="#7CB342" />
        </LinearGradient>
      </Defs>
      
      {/* Crown leaves */}
      <G>
        {/* Center tall leaves */}
        <Path d="M32 20C32 20 30 8 32 2C34 8 32 20 32 20Z" fill="url(#leafGrad)" />
        <Path d="M28 20C28 20 24 10 26 4C30 10 28 20 28 20Z" fill="#4CAF50" />
        <Path d="M36 20C36 20 40 10 38 4C34 10 36 20 36 20Z" fill="#4CAF50" />
        
        {/* Side leaves */}
        <Path d="M24 22C24 22 16 14 14 8C20 14 24 22 24 22Z" fill="url(#leafGrad)" />
        <Path d="M40 22C40 22 48 14 50 8C44 14 40 22 40 22Z" fill="url(#leafGrad)" />
        <Path d="M22 24C22 24 12 18 8 14C14 20 22 24 22 24Z" fill="#66BB6A" />
        <Path d="M42 24C42 24 52 18 56 14C50 20 42 24 42 24Z" fill="#66BB6A" />
        
        {/* Outer drooping leaves */}
        <Path d="M20 26C20 26 8 22 4 20C10 24 20 26 20 26Z" fill="#81C784" />
        <Path d="M44 26C44 26 56 22 60 20C54 24 44 26 44 26Z" fill="#81C784" />
      </G>
      
      {/* Main pineapple body */}
      <Path
        d="M20 24C20 24 16 32 16 42C16 52 22 60 32 60C42 60 48 52 48 42C48 32 44 24 44 24C44 24 38 22 32 22C26 22 20 24 20 24Z"
        fill="url(#pineappleGrad)"
      />
      
      {/* Diamond pattern scales */}
      <G stroke="#E65100" strokeWidth={0.8} opacity={0.6}>
        {/* Diagonal lines one way */}
        <Path d="M18 30L46 54" />
        <Path d="M16 38L42 58" />
        <Path d="M18 46L38 60" />
        <Path d="M22 26L48 46" />
        <Path d="M28 24L48 38" />
        
        {/* Diagonal lines other way */}
        <Path d="M46 30L18 54" />
        <Path d="M48 38L22 58" />
        <Path d="M46 46L26 60" />
        <Path d="M42 26L16 46" />
        <Path d="M36 24L16 38" />
      </G>
      
      {/* Scale center dots (eyes) */}
      <G fill="#5D4037" opacity={0.4}>
        <Circle cx="26" cy="32" r="1.5" />
        <Circle cx="32" cy="30" r="1.5" />
        <Circle cx="38" cy="32" r="1.5" />
        <Circle cx="22" cy="38" r="1.5" />
        <Circle cx="28" cy="36" r="1.5" />
        <Circle cx="34" cy="36" r="1.5" />
        <Circle cx="40" cy="38" r="1.5" />
        <Circle cx="20" cy="44" r="1.5" />
        <Circle cx="26" cy="42" r="1.5" />
        <Circle cx="32" cy="42" r="1.5" />
        <Circle cx="38" cy="42" r="1.5" />
        <Circle cx="44" cy="44" r="1.5" />
        <Circle cx="24" cy="50" r="1.5" />
        <Circle cx="30" cy="48" r="1.5" />
        <Circle cx="36" cy="48" r="1.5" />
        <Circle cx="42" cy="50" r="1.5" />
        <Circle cx="28" cy="54" r="1.5" />
        <Circle cx="34" cy="54" r="1.5" />
        <Circle cx="32" cy="58" r="1" />
      </G>
      
      {/* Highlight */}
      <Ellipse cx="26" cy="38" rx="4" ry="8" fill="#FFE082" opacity={0.3} />
    </Svg>
  );
};

export default PineappleRealisticIllustration;
