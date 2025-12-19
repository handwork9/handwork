import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface AppleIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const AppleIllustration: React.FC<AppleIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#DC143C',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="appleRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6347" />
          <Stop offset="30%" stopColor={color} />
          <Stop offset="70%" stopColor="#B22222" />
          <Stop offset="100%" stopColor="#8B0000" />
        </LinearGradient>
        <LinearGradient id="appleGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#90EE90" />
          <Stop offset="50%" stopColor="#32CD32" />
          <Stop offset="100%" stopColor="#228B22" />
        </LinearGradient>
      </Defs>
      
      {/* Red apple */}
      <G>
        {/* Main apple body */}
        <Path
          d="M32 12C32 12 22 14 18 24C14 34 16 48 24 54C30 58 38 58 44 54C52 48 54 34 50 24C46 14 36 12 32 12Z"
          fill="url(#appleRed)"
        />
        
        {/* Apple indent at top */}
        <Path
          d="M28 14C28 14 32 18 36 14"
          stroke="#8B0000"
          strokeWidth={2}
          strokeLinecap="round"
        />
        
        {/* Stem */}
        <Path
          d="M32 14C32 14 32 8 34 6"
          stroke="#8B4513"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        
        {/* Leaf */}
        <Path
          d="M34 8C34 8 42 4 46 8C44 12 38 10 34 8Z"
          fill="#228B22"
        />
        <Path
          d="M36 8C36 8 40 7 42 8"
          stroke="#006400"
          strokeWidth={0.5}
          strokeLinecap="round"
        />
        
        {/* Highlight */}
        <Ellipse cx="24" cy="28" rx="4" ry="8" fill="#FF6347" opacity={0.5} />
        <Ellipse cx="22" cy="26" rx="2" ry="4" fill="#FFF" opacity={0.3} />
        
        {/* Bottom indent */}
        <Path
          d="M30 54C30 54 32 52 34 54"
          stroke="#8B0000"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </G>
      
      {/* Small green apple */}
      <G transform="translate(44, 42) scale(0.45)">
        <Path
          d="M20 8C20 8 12 10 8 18C4 26 6 38 12 42C17 45 27 45 32 42C38 38 40 26 36 18C32 10 24 8 20 8Z"
          fill="url(#appleGreen)"
        />
        <Path
          d="M18 10C18 10 20 12 22 10"
          stroke="#228B22"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path
          d="M20 10C20 10 20 6 22 4"
          stroke="#8B4513"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Ellipse cx="14" cy="22" rx="2" ry="4" fill="#98FB98" opacity={0.5} />
      </G>
    </Svg>
  );
};

export default AppleIllustration;
