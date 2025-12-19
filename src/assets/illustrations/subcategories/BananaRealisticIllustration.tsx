import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface BananaRealisticIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const BananaRealisticIllustration: React.FC<BananaRealisticIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#FFD700',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFEB3B" />
          <Stop offset="40%" stopColor={color} />
          <Stop offset="100%" stopColor="#FFC107" />
        </LinearGradient>
        <LinearGradient id="bananaGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFC107" />
          <Stop offset="50%" stopColor="#FFB300" />
          <Stop offset="100%" stopColor="#FF8F00" />
        </LinearGradient>
      </Defs>
      
      {/* Banana bunch stem */}
      <Path
        d="M30 4C30 4 34 6 36 10C38 14 36 16 34 16C32 16 30 12 30 8C30 6 30 4 30 4Z"
        fill="#5D4037"
      />
      
      {/* Banana 1 - front */}
      <G>
        <Path
          d="M8 52C8 52 6 42 10 32C14 22 24 14 32 14C36 14 38 18 36 24C34 30 26 42 20 50C16 56 10 56 8 52Z"
          fill="url(#bananaGrad)"
        />
        {/* Banana edge/ridge */}
        <Path
          d="M10 50C10 50 8 40 12 32C16 24 24 16 32 16"
          stroke="#E6B800"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
        {/* Brown tip */}
        <Ellipse cx="9" cy="53" rx="2" ry="3" fill="#5D4037" />
        {/* Top connection */}
        <Circle cx="32" cy="14" r="2" fill="#8D6E63" />
        {/* Highlight */}
        <Path
          d="M16 36C16 36 20 28 26 22"
          stroke="#FFF59D"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.4}
        />
      </G>
      
      {/* Banana 2 - middle */}
      <G>
        <Path
          d="M20 56C20 56 18 46 22 36C26 26 36 16 44 16C48 16 50 20 48 26C46 32 38 44 32 52C28 58 22 58 20 56Z"
          fill="url(#bananaGrad2)"
        />
        <Path
          d="M22 54C22 54 20 44 24 36C28 28 38 18 44 18"
          stroke="#E6A100"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
        <Ellipse cx="21" cy="57" rx="2" ry="2.5" fill="#5D4037" />
        <Circle cx="44" cy="16" r="2" fill="#8D6E63" />
      </G>
      
      {/* Banana 3 - back */}
      <G>
        <Path
          d="M34 58C34 58 32 50 36 42C40 34 48 24 54 24C58 24 60 28 58 32C56 38 50 48 44 54C40 58 36 60 34 58Z"
          fill="#FFC107"
        />
        <Ellipse cx="35" cy="59" rx="2" ry="2" fill="#5D4037" />
        <Circle cx="54" cy="24" r="2" fill="#8D6E63" />
      </G>
      
      {/* Brown spots (ripe) */}
      <Circle cx="14" cy="44" r="1" fill="#8D6E63" opacity={0.6} />
      <Circle cx="18" cy="38" r="0.8" fill="#8D6E63" opacity={0.5} />
      <Circle cx="28" cy="46" r="1" fill="#8D6E63" opacity={0.6} />
      <Circle cx="40" cy="48" r="0.8" fill="#8D6E63" opacity={0.5} />
    </Svg>
  );
};

export default BananaRealisticIllustration;
