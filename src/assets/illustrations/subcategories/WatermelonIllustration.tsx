import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface WatermelonIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const WatermelonIllustration: React.FC<WatermelonIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#FF6B6B',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="rindGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#228B22" />
          <Stop offset="100%" stopColor="#32CD32" />
        </LinearGradient>
        <LinearGradient id="fleshGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FF6B6B" />
          <Stop offset="100%" stopColor="#DC143C" />
        </LinearGradient>
      </Defs>
      
      {/* Watermelon slice */}
      <G>
        {/* Green rind outer */}
        <Path
          d="M8 48C8 48 32 8 56 48C56 48 32 56 8 48Z"
          fill="url(#rindGrad)"
        />
        
        {/* Light green inner rind */}
        <Path
          d="M12 46C12 46 32 14 52 46C52 46 32 52 12 46Z"
          fill="#90EE90"
        />
        
        {/* Red flesh */}
        <Path
          d="M14 44C14 44 32 18 50 44C50 44 32 48 14 44Z"
          fill="url(#fleshGrad)"
        />
        
        {/* Seeds */}
        <Ellipse cx="22" cy="36" rx="1.5" ry="2.5" fill="#1a1a1a" transform="rotate(-20 22 36)" />
        <Ellipse cx="30" cy="32" rx="1.5" ry="2.5" fill="#1a1a1a" transform="rotate(10 30 32)" />
        <Ellipse cx="38" cy="34" rx="1.5" ry="2.5" fill="#1a1a1a" transform="rotate(-5 38 34)" />
        <Ellipse cx="26" cy="40" rx="1.5" ry="2.5" fill="#1a1a1a" transform="rotate(15 26 40)" />
        <Ellipse cx="34" cy="38" rx="1.5" ry="2.5" fill="#1a1a1a" transform="rotate(-10 34 38)" />
        <Ellipse cx="42" cy="40" rx="1.5" ry="2.5" fill="#1a1a1a" transform="rotate(5 42 40)" />
        <Ellipse cx="20" cy="42" rx="1.2" ry="2" fill="#1a1a1a" transform="rotate(-25 20 42)" />
        <Ellipse cx="44" cy="42" rx="1.2" ry="2" fill="#1a1a1a" transform="rotate(25 44 42)" />
        
        {/* Flesh texture highlights */}
        <Path
          d="M18 38C18 38 24 36 28 38"
          stroke="#FF8080"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.5}
        />
        <Path
          d="M36 36C36 36 42 34 46 38"
          stroke="#FF8080"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.5}
        />
      </G>
      
      {/* Small watermelon piece */}
      <G transform="translate(44, 52) scale(0.4)">
        <Path
          d="M0 20C0 20 20 -10 40 20C40 20 20 26 0 20Z"
          fill="#228B22"
        />
        <Path
          d="M4 18C4 18 20 -4 36 18C36 18 20 22 4 18Z"
          fill="#DC143C"
        />
        <Ellipse cx="14" cy="14" rx="1" ry="1.5" fill="#1a1a1a" />
        <Ellipse cx="22" cy="12" rx="1" ry="1.5" fill="#1a1a1a" />
        <Ellipse cx="28" cy="14" rx="1" ry="1.5" fill="#1a1a1a" />
      </G>
    </Svg>
  );
};

export default WatermelonIllustration;
