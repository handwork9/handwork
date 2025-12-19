import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface MangoRealisticIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const MangoRealisticIllustration: React.FC<MangoRealisticIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#FFB300',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="mangoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFEB3B" />
          <Stop offset="30%" stopColor={color} />
          <Stop offset="70%" stopColor="#FF8F00" />
          <Stop offset="100%" stopColor="#E65100" />
        </LinearGradient>
        <LinearGradient id="mangoFlesh" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFCA28" />
          <Stop offset="100%" stopColor="#FF8F00" />
        </LinearGradient>
      </Defs>
      
      {/* Whole mango */}
      <G>
        <Path
          d="M48 10C48 10 56 16 58 28C60 40 54 52 44 54C36 56 30 50 28 40C26 30 32 16 42 12C46 10 48 10 48 10Z"
          fill="url(#mangoGrad)"
        />
        
        {/* Stem */}
        <Circle cx="48" cy="10" r="2" fill="#5D4037" />
        
        {/* Red blush area */}
        <Ellipse cx="54" cy="22" rx="6" ry="10" fill="#E53935" opacity={0.4} />
        
        {/* Highlight */}
        <Ellipse cx="44" cy="24" rx="3" ry="6" fill="#FFF59D" opacity={0.4} />
      </G>
      
      {/* Cut mango slice showing flesh */}
      <G>
        {/* Slice outer skin */}
        <Path
          d="M6 36C6 36 4 52 14 58C24 62 36 56 38 46C40 36 32 28 22 30C12 32 6 36 6 36Z"
          fill="url(#mangoGrad)"
        />
        
        {/* Orange flesh */}
        <Path
          d="M8 38C8 38 6 50 14 56C22 60 32 54 34 46C36 38 30 32 22 34C14 36 8 38 8 38Z"
          fill="url(#mangoFlesh)"
        />
        
        {/* Cube cut pattern */}
        <Path d="M12 40L12 54" stroke="#E65100" strokeWidth={1} opacity={0.4} />
        <Path d="M18 38L18 56" stroke="#E65100" strokeWidth={1} opacity={0.4} />
        <Path d="M24 36L24 54" stroke="#E65100" strokeWidth={1} opacity={0.4} />
        <Path d="M30 38L30 50" stroke="#E65100" strokeWidth={1} opacity={0.4} />
        
        <Path d="M8 44L34 42" stroke="#E65100" strokeWidth={1} opacity={0.4} />
        <Path d="M10 50L32 48" stroke="#E65100" strokeWidth={1} opacity={0.4} />
        
        {/* Flesh texture highlights */}
        <Ellipse cx="16" cy="44" rx="2" ry="3" fill="#FFE082" opacity={0.5} />
        <Ellipse cx="24" cy="46" rx="2" ry="3" fill="#FFE082" opacity={0.5} />
      </G>
    </Svg>
  );
};

export default MangoRealisticIllustration;
