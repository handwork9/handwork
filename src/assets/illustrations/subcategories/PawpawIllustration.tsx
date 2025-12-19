import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface PawpawIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const PawpawIllustration: React.FC<PawpawIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#FFA500',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="pawpawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFD700" />
          <Stop offset="50%" stopColor={color} />
          <Stop offset="100%" stopColor="#FF8C00" />
        </LinearGradient>
        <LinearGradient id="pawpawFlesh" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF6347" />
          <Stop offset="100%" stopColor="#FF4500" />
        </LinearGradient>
      </Defs>
      
      {/* Whole pawpaw in background */}
      <Ellipse cx="48" cy="24" rx="10" ry="14" fill="url(#pawpawGrad)" />
      <Path
        d="M48 10C48 10 50 8 50 6C50 4 48 4 48 6C48 8 48 10 48 10Z"
        fill="#228B22"
      />
      
      {/* Cut pawpaw showing flesh and seeds */}
      <G>
        {/* Outer skin */}
        <Ellipse cx="26" cy="38" rx="18" ry="22" fill="url(#pawpawGrad)" />
        
        {/* Inner flesh */}
        <Ellipse cx="26" cy="38" rx="14" ry="18" fill="url(#pawpawFlesh)" />
        
        {/* Seed cavity */}
        <Ellipse cx="26" cy="38" rx="6" ry="10" fill="#FF6347" opacity={0.7} />
        
        {/* Seeds - black */}
        <Circle cx="24" cy="30" r="2.5" fill="#1a1a1a" />
        <Circle cx="28" cy="32" r="2.5" fill="#1a1a1a" />
        <Circle cx="23" cy="36" r="2.5" fill="#1a1a1a" />
        <Circle cx="29" cy="38" r="2.5" fill="#1a1a1a" />
        <Circle cx="24" cy="42" r="2.5" fill="#1a1a1a" />
        <Circle cx="28" cy="44" r="2.5" fill="#1a1a1a" />
        <Circle cx="26" cy="48" r="2" fill="#1a1a1a" />
        
        {/* Seed highlights */}
        <Circle cx="23.5" cy="29.5" r="0.8" fill="#444" />
        <Circle cx="27.5" cy="31.5" r="0.8" fill="#444" />
        <Circle cx="22.5" cy="35.5" r="0.8" fill="#444" />
      </G>
      
      {/* Highlight on whole pawpaw */}
      <Ellipse cx="52" cy="18" rx="3" ry="5" fill="#FFE4B5" opacity={0.4} />
    </Svg>
  );
};

export default PawpawIllustration;
