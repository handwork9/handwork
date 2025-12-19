import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface OatsIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const OatsIllustration: React.FC<OatsIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#C9B896',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Oats have drooping seed heads */}
      
      {/* First oat stalk */}
      <G>
        <Path
          d="M16 60C16 60 18 48 20 36"
          stroke="#8FBC8F"
          strokeWidth={2}
          strokeLinecap="round"
        />
        
        {/* Drooping oat seeds */}
        <Path d="M20 36C20 36 16 38 14 42" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="14" cy="44" rx="2" ry="4" fill={color} transform="rotate(20 14 44)" />
        
        <Path d="M20 34C20 34 18 36 18 40" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="18" cy="42" rx="2" ry="4" fill={color} transform="rotate(10 18 42)" />
        
        <Path d="M20 32C20 32 22 34 24 38" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="24" cy="40" rx="2" ry="4" fill={color} transform="rotate(-15 24 40)" />
        
        <Path d="M20 30C20 30 14 32 12 36" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="12" cy="38" rx="2" ry="4" fill={color} transform="rotate(25 12 38)" />
        
        <Path d="M20 28C20 28 26 30 28 34" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="28" cy="36" rx="2" ry="4" fill={color} transform="rotate(-20 28 36)" />
        
        {/* Top drooping seeds */}
        <Path d="M20 26C20 26 16 26 14 28" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="14" cy="30" rx="1.5" ry="3" fill={color} transform="rotate(30 14 30)" />
        
        <Path d="M20 24C20 24 24 24 26 26" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="26" cy="28" rx="1.5" ry="3" fill={color} transform="rotate(-30 26 28)" />
      </G>
      
      {/* Second oat stalk */}
      <G>
        <Path
          d="M44 62C44 62 44 50 44 38"
          stroke="#8FBC8F"
          strokeWidth={2}
          strokeLinecap="round"
        />
        
        <Path d="M44 38C44 38 40 40 38 44" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="38" cy="46" rx="2" ry="4" fill="#D4C4A4" transform="rotate(20 38 46)" />
        
        <Path d="M44 36C44 36 48 38 50 42" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="50" cy="44" rx="2" ry="4" fill="#D4C4A4" transform="rotate(-15 50 44)" />
        
        <Path d="M44 34C44 34 42 36 42 40" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="42" cy="42" rx="2" ry="4" fill="#D4C4A4" transform="rotate(10 42 42)" />
        
        <Path d="M44 32C44 32 38 34 36 38" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="36" cy="40" rx="2" ry="4" fill="#D4C4A4" transform="rotate(25 36 40)" />
        
        <Path d="M44 30C44 30 50 32 52 36" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="52" cy="38" rx="2" ry="4" fill="#D4C4A4" transform="rotate(-20 52 38)" />
        
        <Path d="M44 28C44 28 40 28 38 30" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="38" cy="32" rx="1.5" ry="3" fill="#D4C4A4" transform="rotate(30 38 32)" />
        
        <Path d="M44 26C44 26 48 26 50 28" stroke="#8FBC8F" strokeWidth={1} />
        <Ellipse cx="50" cy="30" rx="1.5" ry="3" fill="#D4C4A4" transform="rotate(-30 50 30)" />
      </G>
      
      {/* Small oat grain pile */}
      <Ellipse cx="32" cy="58" rx="3" ry="2" fill={color} />
      <Ellipse cx="28" cy="60" rx="2.5" ry="1.5" fill="#D4C4A4" />
      <Ellipse cx="36" cy="60" rx="2.5" ry="1.5" fill={color} />
    </Svg>
  );
};

export default OatsIllustration;
