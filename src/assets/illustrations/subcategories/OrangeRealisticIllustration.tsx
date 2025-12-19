import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface OrangeRealisticIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const OrangeRealisticIllustration: React.FC<OrangeRealisticIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#FF9800',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFCC80" />
          <Stop offset="30%" stopColor={color} />
          <Stop offset="70%" stopColor="#F57C00" />
          <Stop offset="100%" stopColor="#E65100" />
        </LinearGradient>
        <LinearGradient id="orangeFlesh" x1="50%" y1="0%" x2="50%" y2="100%">
          <Stop offset="0%" stopColor="#FFCC80" />
          <Stop offset="100%" stopColor="#FFB74D" />
        </LinearGradient>
      </Defs>
      
      {/* Whole orange */}
      <G>
        <Circle cx="44" cy="20" r="14" fill="url(#orangeGrad)" />
        
        {/* Texture dimples */}
        <Circle cx="38" cy="14" r="1" fill="#E65100" opacity={0.3} />
        <Circle cx="42" cy="12" r="0.8" fill="#E65100" opacity={0.3} />
        <Circle cx="48" cy="14" r="1" fill="#E65100" opacity={0.3} />
        <Circle cx="52" cy="18" r="0.8" fill="#E65100" opacity={0.3} />
        <Circle cx="50" cy="24" r="1" fill="#E65100" opacity={0.3} />
        <Circle cx="44" cy="28" r="0.8" fill="#E65100" opacity={0.3} />
        <Circle cx="38" cy="24" r="1" fill="#E65100" opacity={0.3} />
        <Circle cx="36" cy="18" r="0.8" fill="#E65100" opacity={0.3} />
        
        {/* Stem/navel */}
        <Circle cx="44" cy="8" r="2" fill="#8BC34A" />
        <Path
          d="M44 6C44 6 44 4 46 2"
          stroke="#5D4037"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        
        {/* Leaf */}
        <Path
          d="M46 4C46 4 52 2 54 6C52 8 48 6 46 4Z"
          fill="#4CAF50"
        />
        
        {/* Highlight */}
        <Ellipse cx="40" cy="14" rx="4" ry="5" fill="#FFCC80" opacity={0.4} />
      </G>
      
      {/* Cut orange half showing segments */}
      <G>
        {/* Outer peel */}
        <Circle cx="22" cy="44" r="16" fill="url(#orangeGrad)" />
        
        {/* White pith ring */}
        <Circle cx="22" cy="44" r="14" fill="#FFF8E1" />
        
        {/* Orange flesh */}
        <Circle cx="22" cy="44" r="13" fill="url(#orangeFlesh)" />
        
        {/* Segment lines */}
        <Path d="M22 31L22 57" stroke="#FFF8E1" strokeWidth={1.5} />
        <Path d="M9 44L35 44" stroke="#FFF8E1" strokeWidth={1.5} />
        <Path d="M13 35L31 53" stroke="#FFF8E1" strokeWidth={1.5} />
        <Path d="M13 53L31 35" stroke="#FFF8E1" strokeWidth={1.5} />
        <Path d="M10 39L34 49" stroke="#FFF8E1" strokeWidth={1.5} />
        <Path d="M10 49L34 39" stroke="#FFF8E1" strokeWidth={1.5} />
        
        {/* Center pith */}
        <Circle cx="22" cy="44" r="3" fill="#FFF8E1" />
        
        {/* Segment pulp texture */}
        <Ellipse cx="16" cy="38" rx="2" ry="3" fill="#FFB74D" opacity={0.6} transform="rotate(-30 16 38)" />
        <Ellipse cx="28" cy="38" rx="2" ry="3" fill="#FFB74D" opacity={0.6} transform="rotate(30 28 38)" />
        <Ellipse cx="14" cy="46" rx="2" ry="3" fill="#FFB74D" opacity={0.6} transform="rotate(-60 14 46)" />
        <Ellipse cx="30" cy="46" rx="2" ry="3" fill="#FFB74D" opacity={0.6} transform="rotate(60 30 46)" />
        <Ellipse cx="18" cy="52" rx="2" ry="3" fill="#FFB74D" opacity={0.6} transform="rotate(-80 18 52)" />
        <Ellipse cx="26" cy="52" rx="2" ry="3" fill="#FFB74D" opacity={0.6} transform="rotate(80 26 52)" />
      </G>
    </Svg>
  );
};

export default OrangeRealisticIllustration;
