import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CoconutIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CoconutIllustration: React.FC<CoconutIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#8B4513',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="coconutShell" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A0522D" />
          <Stop offset="50%" stopColor={color} />
          <Stop offset="100%" stopColor="#654321" />
        </LinearGradient>
        <LinearGradient id="coconutFlesh" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFAF0" />
          <Stop offset="100%" stopColor="#F5DEB3" />
        </LinearGradient>
      </Defs>
      
      {/* Whole coconut */}
      <G>
        <Circle cx="48" cy="18" r="12" fill="url(#coconutShell)" />
        {/* Hairy texture */}
        <Path d="M40 14C40 14 38 12 36 14" stroke="#654321" strokeWidth={1} strokeLinecap="round" />
        <Path d="M42 10C42 10 40 8 38 10" stroke="#654321" strokeWidth={1} strokeLinecap="round" />
        <Path d="M56 14C56 14 58 12 60 14" stroke="#654321" strokeWidth={1} strokeLinecap="round" />
        <Path d="M54 22C54 22 56 24 58 22" stroke="#654321" strokeWidth={1} strokeLinecap="round" />
        {/* Eyes */}
        <Circle cx="44" cy="20" r="2" fill="#4A3728" />
        <Circle cx="48" cy="22" r="2" fill="#4A3728" />
        <Circle cx="52" cy="20" r="2" fill="#4A3728" />
      </G>
      
      {/* Cut coconut half */}
      <G>
        {/* Brown shell */}
        <Circle cx="24" cy="44" r="16" fill="url(#coconutShell)" />
        
        {/* White flesh ring */}
        <Circle cx="24" cy="44" r="13" fill="url(#coconutFlesh)" />
        
        {/* Hollow center (coconut water area) */}
        <Circle cx="24" cy="44" r="8" fill="#E0FFFF" opacity={0.6} />
        
        {/* Water ripple effect */}
        <Ellipse cx="24" cy="44" rx="6" ry="4" fill="none" stroke="#ADD8E6" strokeWidth={0.5} opacity={0.5} />
        <Ellipse cx="24" cy="44" rx="4" ry="2.5" fill="none" stroke="#ADD8E6" strokeWidth={0.5} opacity={0.4} />
        
        {/* Shell edge texture */}
        <Circle cx="24" cy="44" r="14.5" fill="none" stroke="#654321" strokeWidth={1} opacity={0.5} />
        
        {/* Flesh highlights */}
        <Path
          d="M12 40C12 40 14 38 18 40"
          stroke="#FFF"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.5}
        />
        <Path
          d="M30 48C30 48 34 50 36 48"
          stroke="#FFF"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.5}
        />
      </G>
      
      {/* Small coconut piece */}
      <G>
        <Path
          d="M52 50C52 50 58 48 62 52C62 56 58 60 54 58C50 56 52 50 52 50Z"
          fill="url(#coconutShell)"
        />
        <Path
          d="M54 52C54 52 58 50 60 53C60 55 58 57 56 56C54 55 54 52 54 52Z"
          fill="url(#coconutFlesh)"
        />
      </G>
    </Svg>
  );
};

export default CoconutIllustration;
