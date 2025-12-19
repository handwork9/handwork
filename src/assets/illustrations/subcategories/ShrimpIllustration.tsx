import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface ShrimpIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const ShrimpIllustration: React.FC<ShrimpIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#FF6B6B',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Shrimp body - curved shape */}
      <Path
        d="M48 28C48 28 44 20 36 18C28 16 22 20 18 26C14 32 12 40 16 44C20 48 28 46 34 42C40 38 48 32 48 28Z"
        fill={color}
        opacity={0.9}
      />
      
      {/* Shrimp tail segments */}
      <Path
        d="M16 44C16 44 10 48 8 52C6 56 10 58 14 56C18 54 20 50 18 46"
        fill={color}
        opacity={0.8}
      />
      <Path
        d="M8 52C8 52 4 54 6 58C8 60 12 58 14 56"
        fill={color}
        opacity={0.7}
      />
      
      {/* Tail fan */}
      <Path
        d="M6 58C6 58 2 56 2 60C2 62 4 64 8 62C10 60 8 58 6 58Z"
        fill="#FF8E8E"
      />
      <Path
        d="M6 58C6 58 4 60 6 64C8 64 10 62 8 60"
        fill="#FF8E8E"
      />
      
      {/* Body segments/stripes */}
      <Path
        d="M24 24C24 24 22 28 24 32"
        stroke="#E55555"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M30 22C30 22 28 26 28 32"
        stroke="#E55555"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M36 22C36 22 34 26 32 32"
        stroke="#E55555"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      
      {/* Head */}
      <Ellipse
        cx="44"
        cy="24"
        rx="6"
        ry="5"
        fill={color}
      />
      
      {/* Eye */}
      <Circle cx="46" cy="22" r="2" fill="#333" />
      <Circle cx="46.5" cy="21.5" r="0.8" fill="#FFF" />
      
      {/* Antennae */}
      <Path
        d="M48 20C48 20 54 14 58 12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M48 22C48 22 56 18 60 18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      
      {/* Legs */}
      <Path
        d="M26 34C26 34 24 38 22 40"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <Path
        d="M30 34C30 34 28 38 26 42"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
      />
      <Path
        d="M34 32C34 32 32 36 30 40"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default ShrimpIllustration;
