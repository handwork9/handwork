import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface AvocadoIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const AvocadoIllustration: React.FC<AvocadoIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#568203',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="avocadoSkin" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#6B8E23" />
          <Stop offset="50%" stopColor={color} />
          <Stop offset="100%" stopColor="#2F4F4F" />
        </LinearGradient>
        <LinearGradient id="avocadoFlesh" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#9ACD32" />
          <Stop offset="50%" stopColor="#ADFF2F" />
          <Stop offset="100%" stopColor="#9ACD32" />
        </LinearGradient>
        <LinearGradient id="avocadoPit" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8B4513" />
          <Stop offset="50%" stopColor="#A0522D" />
          <Stop offset="100%" stopColor="#654321" />
        </LinearGradient>
      </Defs>
      
      {/* Whole avocado in back */}
      <G>
        <Path
          d="M50 14C50 14 58 22 58 34C58 46 52 54 46 54C40 54 34 46 34 34C34 22 42 14 50 14Z"
          fill="url(#avocadoSkin)"
        />
        {/* Stem area */}
        <Ellipse cx="50" cy="14" rx="3" ry="2" fill="#4A3728" />
        {/* Highlight */}
        <Ellipse cx="54" cy="26" rx="2" ry="6" fill="#7CFC00" opacity={0.3} />
      </G>
      
      {/* Cut avocado half showing pit */}
      <G>
        {/* Outer dark green skin */}
        <Path
          d="M24 8C24 8 36 18 36 34C36 50 28 58 20 58C12 58 4 50 4 34C4 18 16 8 24 8Z"
          fill="url(#avocadoSkin)"
        />
        
        {/* Light green flesh */}
        <Path
          d="M24 12C24 12 32 20 32 34C32 48 26 54 20 54C14 54 8 48 8 34C8 20 16 12 24 12Z"
          fill="url(#avocadoFlesh)"
        />
        
        {/* Pit cavity */}
        <Ellipse cx="20" cy="36" rx="8" ry="10" fill="#7CFC00" opacity={0.6} />
        
        {/* Pit/seed */}
        <Ellipse cx="20" cy="36" rx="7" ry="9" fill="url(#avocadoPit)" />
        
        {/* Pit highlight */}
        <Ellipse cx="17" cy="32" rx="2" ry="3" fill="#CD853F" opacity={0.5} />
        
        {/* Pit texture lines */}
        <Path
          d="M16 28C16 28 20 30 24 28"
          stroke="#654321"
          strokeWidth={0.5}
          strokeLinecap="round"
          opacity={0.4}
        />
        <Path
          d="M15 44C15 44 20 42 25 44"
          stroke="#654321"
          strokeWidth={0.5}
          strokeLinecap="round"
          opacity={0.4}
        />
        
        {/* Flesh gradient ring around pit */}
        <Ellipse 
          cx="20" 
          cy="36" 
          rx="10" 
          ry="12" 
          fill="none" 
          stroke="#ADFF2F" 
          strokeWidth={2}
          opacity={0.5}
        />
      </G>
    </Svg>
  );
};

export default AvocadoIllustration;
