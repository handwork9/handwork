import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface GuineaFowlIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const GuineaFowlIllustration: React.FC<GuineaFowlIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#4A4A4A',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Body - speckled grey */}
      <Ellipse
        cx="32"
        cy="38"
        rx="16"
        ry="14"
        fill={color}
      />
      
      {/* White spots/speckles pattern */}
      <Circle cx="22" cy="34" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="26" cy="38" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="24" cy="42" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="30" cy="32" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="34" cy="36" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="32" cy="42" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="38" cy="34" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="40" cy="40" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="36" cy="44" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="42" cy="38" r="1.5" fill="#FFF" opacity={0.8} />
      <Circle cx="28" cy="46" r="1.5" fill="#FFF" opacity={0.8} />
      
      {/* Wing */}
      <Path
        d="M22 36C22 36 28 30 36 32C44 34 48 40 44 44C40 48 22 44 22 36Z"
        fill="#3A3A3A"
      />
      <Circle cx="28" cy="36" r="1" fill="#FFF" opacity={0.7} />
      <Circle cx="34" cy="38" r="1" fill="#FFF" opacity={0.7} />
      <Circle cx="32" cy="42" r="1" fill="#FFF" opacity={0.7} />
      <Circle cx="38" cy="40" r="1" fill="#FFF" opacity={0.7} />
      
      {/* Tail */}
      <Path
        d="M16 38C16 38 10 36 8 34C10 38 14 40 16 38"
        fill="#3A3A3A"
      />
      <Path
        d="M16 40C16 40 10 42 8 44C12 44 16 42 16 40"
        fill="#3A3A3A"
      />
      
      {/* Neck */}
      <Path
        d="M44 32C44 32 48 28 50 22C52 16 50 12 48 10"
        stroke="#5C6BC0"
        strokeWidth={6}
        strokeLinecap="round"
      />
      
      {/* Head - blue/purple */}
      <Circle cx="48" cy="10" r="7" fill="#5C6BC0" />
      
      {/* Helmet/crest on top */}
      <Path
        d="M48 4C48 4 50 0 52 2C54 4 52 8 50 8C48 8 48 4 48 4Z"
        fill="#CD5C5C"
      />
      
      {/* Wattles - red */}
      <Path
        d="M42 12C42 12 40 14 40 18C40 20 42 20 44 18"
        fill="#DC143C"
      />
      <Path
        d="M54 12C54 12 56 14 56 18C56 20 54 20 52 18"
        fill="#DC143C"
      />
      
      {/* Beak */}
      <Path
        d="M52 10C52 10 58 8 58 10C58 12 52 12 52 10"
        fill="#CD853F"
      />
      
      {/* Eye */}
      <Circle cx="50" cy="8" r="2" fill="#333" />
      <Circle cx="50.5" cy="7.5" r="0.7" fill="#FFF" />
      
      {/* Legs */}
      <Path
        d="M28 50C28 50 26 56 24 60"
        stroke="#808080"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M24 60C24 60 20 62 22 62C24 62 26 60 24 60Z"
        fill="#808080"
      />
      
      <Path
        d="M38 50C38 50 40 56 42 60"
        stroke="#808080"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M42 60C42 60 46 62 44 62C42 62 40 60 42 60Z"
        fill="#808080"
      />
    </Svg>
  );
};

export default GuineaFowlIllustration;
