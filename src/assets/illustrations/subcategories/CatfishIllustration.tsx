import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface CatfishIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CatfishIllustration: React.FC<CatfishIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#4A5568',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Body - elongated catfish shape */}
      <Path
        d="M8 32C8 32 14 22 28 20C42 18 54 24 58 32C54 40 42 46 28 44C14 42 8 32 8 32Z"
        fill={color}
        opacity={0.9}
      />
      
      {/* Belly - lighter */}
      <Path
        d="M12 34C12 34 20 40 32 40C44 40 54 36 56 32C54 38 44 42 32 42C20 42 12 38 12 34Z"
        fill="#718096"
        opacity={0.7}
      />
      
      {/* Dorsal fin */}
      <Path
        d="M28 20C28 20 32 10 36 12C40 14 38 18 36 20"
        fill={color}
      />
      
      {/* Tail fin - forked */}
      <Path
        d="M8 32C8 32 2 26 2 22C4 24 6 28 8 32"
        fill={color}
      />
      <Path
        d="M8 32C8 32 2 38 2 42C4 40 6 36 8 32"
        fill={color}
      />
      
      {/* Pectoral fins */}
      <Path
        d="M44 32C44 32 48 38 46 42C44 40 42 36 44 32"
        fill="#5A6B7A"
      />
      <Path
        d="M44 32C44 32 48 26 46 22C44 24 42 28 44 32"
        fill="#5A6B7A"
      />
      
      {/* Head */}
      <Ellipse cx="54" cy="32" rx="6" ry="8" fill={color} />
      
      {/* Eye */}
      <Circle cx="56" cy="28" r="2.5" fill="#FFF" />
      <Circle cx="56" cy="28" r="1.5" fill="#333" />
      <Circle cx="56.5" cy="27.5" r="0.5" fill="#FFF" />
      
      {/* Barbels (whiskers) - distinctive catfish feature */}
      <Path
        d="M58 30C58 30 64 28 66 24"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M58 32C58 32 66 32 68 30"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M58 34C58 34 64 36 66 40"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M58 36C58 36 66 38 68 42"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      
      {/* Body markings */}
      <Path
        d="M20 28C20 28 24 30 28 30"
        stroke="#3A4A5A"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path
        d="M32 26C32 26 36 28 40 28"
        stroke="#3A4A5A"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.5}
      />
      
      {/* Bubbles */}
      <Circle cx="62" cy="18" r="2" fill="#87CEEB" opacity={0.6} />
      <Circle cx="58" cy="14" r="1.5" fill="#87CEEB" opacity={0.5} />
      <Circle cx="64" cy="12" r="1" fill="#87CEEB" opacity={0.4} />
    </Svg>
  );
};

export default CatfishIllustration;
