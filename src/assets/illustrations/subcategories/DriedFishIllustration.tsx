import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect } from 'react-native-svg';

interface DriedFishIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const DriedFishIllustration: React.FC<DriedFishIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#B8860B',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* First dried fish */}
      <G>
        {/* Body - flattened/dried look */}
        <Path
          d="M12 20C12 20 18 16 28 18C38 20 44 24 44 28C44 32 38 34 28 32C18 30 12 26 12 20Z"
          fill={color}
          opacity={0.9}
        />
        
        {/* Texture lines */}
        <Path
          d="M16 22C16 22 22 22 30 24"
          stroke="#8B6914"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <Path
          d="M18 26C18 26 24 26 32 26"
          stroke="#8B6914"
          strokeWidth={1}
          strokeLinecap="round"
        />
        
        {/* Tail */}
        <Path
          d="M12 20C12 20 6 16 4 18C2 20 4 24 8 26C10 26 12 24 12 20Z"
          fill={color}
          opacity={0.8}
        />
        
        {/* Head area */}
        <Ellipse cx="42" cy="26" rx="4" ry="5" fill={color} />
        <Circle cx="43" cy="24" r="1.5" fill="#333" opacity={0.6} />
      </G>
      
      {/* Second dried fish */}
      <G>
        <Path
          d="M14 38C14 38 20 34 30 36C40 38 48 42 48 46C48 50 40 52 30 50C20 48 14 44 14 38Z"
          fill="#A67C00"
          opacity={0.85}
        />
        
        {/* Texture */}
        <Path
          d="M18 40C18 40 26 40 34 42"
          stroke="#8B6508"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <Path
          d="M20 44C20 44 28 44 36 44"
          stroke="#8B6508"
          strokeWidth={1}
          strokeLinecap="round"
        />
        
        {/* Tail */}
        <Path
          d="M14 38C14 38 8 34 6 36C4 38 6 42 10 44C12 44 14 42 14 38Z"
          fill="#A67C00"
          opacity={0.75}
        />
        
        {/* Head */}
        <Ellipse cx="46" cy="44" rx="4" ry="5" fill="#A67C00" />
        <Circle cx="47" cy="42" r="1.5" fill="#333" opacity={0.6} />
      </G>
      
      {/* Third small fish */}
      <G>
        <Path
          d="M36 12C36 12 40 10 46 11C52 12 56 14 56 16C56 18 52 19 46 18C40 17 36 15 36 12Z"
          fill="#C4A000"
          opacity={0.8}
        />
        <Path
          d="M36 12C36 12 32 10 32 12C32 14 34 15 36 14"
          fill="#C4A000"
          opacity={0.7}
        />
        <Circle cx="54" cy="15" r="1" fill="#333" opacity={0.5} />
      </G>
      
      {/* Basket/container hint at bottom */}
      <Path
        d="M8 56C8 56 20 58 32 58C44 58 56 56 56 56"
        stroke="#8B4513"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M10 60C10 60 22 62 32 62C42 62 54 60 54 60"
        stroke="#8B4513"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default DriedFishIllustration;
