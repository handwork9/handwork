import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface CrabIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CrabIllustration: React.FC<CrabIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#E85D04',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Main body */}
      <Ellipse
        cx="32"
        cy="36"
        rx="16"
        ry="12"
        fill={color}
      />
      
      {/* Body pattern */}
      <Path
        d="M24 34C24 34 28 32 32 32C36 32 40 34 40 34"
        stroke="#C44D00"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M26 38C26 38 30 40 38 38"
        stroke="#C44D00"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      
      {/* Eyes on stalks */}
      <Path
        d="M26 28C26 28 24 24 24 22"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx="24" cy="20" r="3" fill={color} />
      <Circle cx="24" cy="19" r="1.5" fill="#333" />
      <Circle cx="24.5" cy="18.5" r="0.5" fill="#FFF" />
      
      <Path
        d="M38 28C38 28 40 24 40 22"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx="40" cy="20" r="3" fill={color} />
      <Circle cx="40" cy="19" r="1.5" fill="#333" />
      <Circle cx="40.5" cy="18.5" r="0.5" fill="#FFF" />
      
      {/* Left claw */}
      <Path
        d="M16 36C16 36 10 34 8 30C6 26 8 24 12 26C14 28 14 32 16 36"
        fill={color}
      />
      <Path
        d="M8 30C8 30 4 28 4 24C4 22 6 22 8 24"
        fill="#F07020"
      />
      <Path
        d="M8 30C8 30 6 32 4 32C2 32 2 30 4 28"
        fill="#F07020"
      />
      
      {/* Right claw */}
      <Path
        d="M48 36C48 36 54 34 56 30C58 26 56 24 52 26C50 28 50 32 48 36"
        fill={color}
      />
      <Path
        d="M56 30C56 30 60 28 60 24C60 22 58 22 56 24"
        fill="#F07020"
      />
      <Path
        d="M56 30C56 30 58 32 60 32C62 32 62 30 60 28"
        fill="#F07020"
      />
      
      {/* Legs - left side */}
      <Path
        d="M18 40C18 40 12 44 8 46"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M18 44C18 44 14 50 10 52"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M20 46C20 46 18 54 16 58"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      
      {/* Legs - right side */}
      <Path
        d="M46 40C46 40 52 44 56 46"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M46 44C46 44 50 50 54 52"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Path
        d="M44 46C44 46 46 54 48 58"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default CrabIllustration;
