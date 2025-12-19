import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface GuavaIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const GuavaIllustration: React.FC<GuavaIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#9ACD32',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="guavaOuter" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ADFF2F" />
          <Stop offset="50%" stopColor={color} />
          <Stop offset="100%" stopColor="#6B8E23" />
        </LinearGradient>
        <LinearGradient id="guavaFlesh" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFB6C1" />
          <Stop offset="100%" stopColor="#FF69B4" />
        </LinearGradient>
      </Defs>
      
      {/* Whole guava */}
      <G>
        <Ellipse cx="46" cy="20" rx="12" ry="14" fill="url(#guavaOuter)" />
        {/* Blossom end */}
        <Circle cx="46" cy="32" r="2" fill="#556B2F" />
        {/* Stem */}
        <Path
          d="M46 6C46 6 46 4 48 2"
          stroke="#8B4513"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Leaf */}
        <Path
          d="M48 4C48 4 54 2 56 6C54 8 50 6 48 4Z"
          fill="#228B22"
        />
        {/* Highlight */}
        <Ellipse cx="50" cy="14" rx="3" ry="4" fill="#ADFF2F" opacity={0.4} />
      </G>
      
      {/* Cut guava showing pink flesh */}
      <G>
        {/* Outer green skin */}
        <Circle cx="24" cy="42" r="16" fill="url(#guavaOuter)" />
        
        {/* Pink flesh */}
        <Circle cx="24" cy="42" r="13" fill="url(#guavaFlesh)" />
        
        {/* Inner core with seeds */}
        <Circle cx="24" cy="42" r="6" fill="#FFB6C1" />
        
        {/* Seeds scattered in core */}
        <Circle cx="22" cy="38" r="1.5" fill="#F5DEB3" />
        <Circle cx="26" cy="40" r="1.5" fill="#F5DEB3" />
        <Circle cx="21" cy="42" r="1.5" fill="#F5DEB3" />
        <Circle cx="27" cy="44" r="1.5" fill="#F5DEB3" />
        <Circle cx="23" cy="46" r="1.5" fill="#F5DEB3" />
        <Circle cx="25" cy="42" r="1" fill="#F5DEB3" />
        <Circle cx="23" cy="40" r="1" fill="#F5DEB3" />
        
        {/* Seed centers */}
        <Circle cx="22" cy="38" r="0.5" fill="#8B7355" />
        <Circle cx="26" cy="40" r="0.5" fill="#8B7355" />
        <Circle cx="21" cy="42" r="0.5" fill="#8B7355" />
        <Circle cx="27" cy="44" r="0.5" fill="#8B7355" />
        <Circle cx="23" cy="46" r="0.5" fill="#8B7355" />
        
        {/* Flesh texture */}
        <Path
          d="M12 42C12 42 16 38 20 42"
          stroke="#FF1493"
          strokeWidth={0.5}
          strokeLinecap="round"
          opacity={0.3}
        />
        <Path
          d="M28 38C28 38 32 42 36 40"
          stroke="#FF1493"
          strokeWidth={0.5}
          strokeLinecap="round"
          opacity={0.3}
        />
      </G>
    </Svg>
  );
};

export default GuavaIllustration;
