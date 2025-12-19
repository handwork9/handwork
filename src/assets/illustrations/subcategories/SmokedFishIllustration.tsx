import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect } from 'react-native-svg';

interface SmokedFishIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const SmokedFishIllustration: React.FC<SmokedFishIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#8B4513',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Smoke wisps */}
      <Path
        d="M20 8C20 8 22 12 20 16C18 20 22 22 24 18"
        stroke="#A0A0A0"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M32 6C32 6 34 10 32 14C30 18 34 20 36 16"
        stroke="#A0A0A0"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path
        d="M44 10C44 10 46 14 44 18C42 22 46 24 48 20"
        stroke="#A0A0A0"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.4}
      />
      
      {/* Fish body - darker smoked color */}
      <Path
        d="M10 38C10 38 16 28 30 26C44 24 54 30 56 38C54 46 44 52 30 50C16 48 10 38 10 38Z"
        fill={color}
        opacity={0.95}
      />
      
      {/* Smoked texture/char marks */}
      <Path
        d="M18 34C18 34 24 32 32 32"
        stroke="#5D2E0C"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M20 40C20 40 28 38 38 38"
        stroke="#5D2E0C"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M24 44C24 44 32 44 42 42"
        stroke="#5D2E0C"
        strokeWidth={2}
        strokeLinecap="round"
      />
      
      {/* Golden/caramelized highlights */}
      <Path
        d="M26 30C26 30 32 28 40 30"
        stroke="#CD853F"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
      
      {/* Tail */}
      <Path
        d="M10 38C10 38 4 32 2 30C4 34 6 38 10 38"
        fill={color}
      />
      <Path
        d="M10 38C10 38 4 44 2 46C4 42 6 38 10 38"
        fill={color}
      />
      
      {/* Head */}
      <Ellipse cx="52" cy="38" rx="5" ry="7" fill={color} />
      
      {/* Eye */}
      <Circle cx="54" cy="36" r="2" fill="#333" opacity={0.7} />
      
      {/* Dorsal fin */}
      <Path
        d="M30 26C30 26 34 20 38 22C40 24 38 26 36 26"
        fill="#6B3410"
      />
      
      {/* Grill/rack lines underneath */}
      <G opacity={0.6}>
        <Rect x="6" y="54" width="52" height="2" rx="1" fill="#333" />
        <Rect x="8" y="58" width="48" height="2" rx="1" fill="#333" />
        <Rect x="10" y="62" width="44" height="2" rx="1" fill="#333" />
      </G>
    </Svg>
  );
};

export default SmokedFishIllustration;
