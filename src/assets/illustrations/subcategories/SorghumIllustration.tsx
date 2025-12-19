import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface SorghumIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const SorghumIllustration: React.FC<SorghumIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#8B0000',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Sorghum has a dense, compact head - often reddish/brown */}
      
      {/* Main sorghum stalk */}
      <G>
        {/* Stem */}
        <Path
          d="M32 62C32 62 32 48 32 36"
          stroke="#228B22"
          strokeWidth={4}
          strokeLinecap="round"
        />
        
        {/* Leaf */}
        <Path
          d="M32 50C32 50 24 46 18 48C24 50 32 52 32 50Z"
          fill="#228B22"
        />
        <Path
          d="M32 44C32 44 40 40 46 42C40 44 32 46 32 44Z"
          fill="#228B22"
        />
        
        {/* Sorghum head - dense oval cluster */}
        <Ellipse cx="32" cy="20" rx="12" ry="16" fill={color} />
        
        {/* Seed texture - small circles */}
        <Circle cx="28" cy="12" r="2" fill="#A52A2A" />
        <Circle cx="32" cy="10" r="2" fill="#A52A2A" />
        <Circle cx="36" cy="12" r="2" fill="#A52A2A" />
        <Circle cx="26" cy="16" r="2" fill="#A52A2A" />
        <Circle cx="30" cy="14" r="2" fill="#A52A2A" />
        <Circle cx="34" cy="14" r="2" fill="#A52A2A" />
        <Circle cx="38" cy="16" r="2" fill="#A52A2A" />
        <Circle cx="24" cy="20" r="2" fill="#A52A2A" />
        <Circle cx="28" cy="18" r="2" fill="#A52A2A" />
        <Circle cx="32" cy="18" r="2" fill="#A52A2A" />
        <Circle cx="36" cy="18" r="2" fill="#A52A2A" />
        <Circle cx="40" cy="20" r="2" fill="#A52A2A" />
        <Circle cx="26" cy="24" r="2" fill="#A52A2A" />
        <Circle cx="30" cy="22" r="2" fill="#A52A2A" />
        <Circle cx="34" cy="22" r="2" fill="#A52A2A" />
        <Circle cx="38" cy="24" r="2" fill="#A52A2A" />
        <Circle cx="28" cy="28" r="2" fill="#A52A2A" />
        <Circle cx="32" cy="26" r="2" fill="#A52A2A" />
        <Circle cx="36" cy="28" r="2" fill="#A52A2A" />
        <Circle cx="32" cy="30" r="2" fill="#A52A2A" />
        
        {/* Top tassel */}
        <Path d="M32 4C32 4 28 2 26 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M32 4C32 4 32 2 32 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M32 4C32 4 36 2 38 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      </G>
      
      {/* Small secondary stalk */}
      <G opacity={0.7}>
        <Path
          d="M54 62C54 62 52 52 50 44"
          stroke="#228B22"
          strokeWidth={2}
          strokeLinecap="round"
        />
        
        <Ellipse cx="50" cy="36" rx="6" ry="8" fill="#CD5C5C" />
        <Circle cx="48" cy="32" r="1.5" fill="#B22222" />
        <Circle cx="52" cy="32" r="1.5" fill="#B22222" />
        <Circle cx="50" cy="36" r="1.5" fill="#B22222" />
        <Circle cx="48" cy="40" r="1.5" fill="#B22222" />
        <Circle cx="52" cy="40" r="1.5" fill="#B22222" />
      </G>
    </Svg>
  );
};

export default SorghumIllustration;
