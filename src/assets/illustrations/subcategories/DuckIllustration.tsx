import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface DuckIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const DuckIllustration: React.FC<DuckIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#2E8B57',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Water ripples */}
      <Path
        d="M4 52C4 52 16 50 32 50C48 50 60 52 60 52"
        stroke="#87CEEB"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
      <Path
        d="M8 56C8 56 20 54 32 54C44 54 56 56 56 56"
        stroke="#87CEEB"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.4}
      />
      
      {/* Body */}
      <Ellipse
        cx="32"
        cy="40"
        rx="18"
        ry="12"
        fill="#F5F5DC"
      />
      
      {/* Wing */}
      <Path
        d="M24 36C24 36 30 32 38 34C46 36 48 42 44 44C40 46 24 42 24 36Z"
        fill="#D3D3D3"
      />
      <Path
        d="M28 38C28 38 34 36 40 38"
        stroke="#A9A9A9"
        strokeWidth={1}
        strokeLinecap="round"
      />
      <Path
        d="M30 42C30 42 36 40 42 42"
        stroke="#A9A9A9"
        strokeWidth={1}
        strokeLinecap="round"
      />
      
      {/* Tail feathers */}
      <Path
        d="M14 38C14 38 8 36 6 34C8 38 12 40 14 40"
        fill="#333"
      />
      <Path
        d="M14 40C14 40 8 40 6 42C10 42 14 42 14 40"
        fill="#333"
      />
      
      {/* Neck */}
      <Path
        d="M46 34C46 34 52 30 54 24C56 18 54 14 52 12"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
      />
      
      {/* Head - green mallard */}
      <Circle cx="52" cy="12" r="8" fill={color} />
      
      {/* White neck ring */}
      <Path
        d="M46 20C46 20 48 22 52 22C56 22 58 20 58 20"
        stroke="#FFF"
        strokeWidth={2}
        strokeLinecap="round"
      />
      
      {/* Beak - orange */}
      <Path
        d="M58 12C58 12 66 10 66 14C66 18 58 16 58 14"
        fill="#FFA500"
      />
      
      {/* Eye */}
      <Circle cx="54" cy="10" r="2" fill="#333" />
      <Circle cx="54.5" cy="9.5" r="0.7" fill="#FFF" />
      
      {/* Feet - orange, partially visible */}
      <Path
        d="M28 48C28 48 26 52 24 54"
        stroke="#FFA500"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M24 54C24 54 20 56 22 56C24 56 26 54 28 54C30 54 28 56 26 56"
        fill="#FFA500"
      />
      
      <Path
        d="M38 48C38 48 40 52 42 54"
        stroke="#FFA500"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M42 54C42 54 38 56 40 56C42 56 44 54 46 54C48 54 46 56 44 56"
        fill="#FFA500"
      />
    </Svg>
  );
};

export default DuckIllustration;
