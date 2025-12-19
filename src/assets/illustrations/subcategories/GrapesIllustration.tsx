import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface GrapesIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const GrapesIllustration: React.FC<GrapesIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#6B238E',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="grapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#9370DB" />
          <Stop offset="50%" stopColor={color} />
          <Stop offset="100%" stopColor="#4B0082" />
        </LinearGradient>
        <LinearGradient id="greenGrapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ADFF2F" />
          <Stop offset="50%" stopColor="#9ACD32" />
          <Stop offset="100%" stopColor="#6B8E23" />
        </LinearGradient>
      </Defs>
      
      {/* Stem and vine */}
      <Path
        d="M32 4C32 4 32 10 32 14"
        stroke="#8B4513"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M32 6C32 6 38 4 42 6C40 10 36 8 32 6Z"
        fill="#228B22"
      />
      <Path
        d="M32 8C32 8 26 6 22 8C24 12 28 10 32 8Z"
        fill="#228B22"
      />
      
      {/* Purple grape cluster */}
      <G>
        {/* Top row */}
        <Circle cx="28" cy="18" r="6" fill="url(#grapeGrad)" />
        <Circle cx="36" cy="18" r="6" fill="url(#grapeGrad)" />
        
        {/* Second row */}
        <Circle cx="24" cy="28" r="6" fill="url(#grapeGrad)" />
        <Circle cx="32" cy="26" r="6" fill="url(#grapeGrad)" />
        <Circle cx="40" cy="28" r="6" fill="url(#grapeGrad)" />
        
        {/* Third row */}
        <Circle cx="20" cy="38" r="6" fill="url(#grapeGrad)" />
        <Circle cx="28" cy="36" r="6" fill="url(#grapeGrad)" />
        <Circle cx="36" cy="36" r="6" fill="url(#grapeGrad)" />
        <Circle cx="44" cy="38" r="6" fill="url(#grapeGrad)" />
        
        {/* Fourth row */}
        <Circle cx="24" cy="46" r="6" fill="url(#grapeGrad)" />
        <Circle cx="32" cy="44" r="6" fill="url(#grapeGrad)" />
        <Circle cx="40" cy="46" r="6" fill="url(#grapeGrad)" />
        
        {/* Bottom */}
        <Circle cx="28" cy="54" r="5" fill="url(#grapeGrad)" />
        <Circle cx="36" cy="54" r="5" fill="url(#grapeGrad)" />
        <Circle cx="32" cy="60" r="4" fill="url(#grapeGrad)" />
        
        {/* Highlights on grapes */}
        <Circle cx="26" cy="16" r="2" fill="#DDA0DD" opacity={0.5} />
        <Circle cx="34" cy="16" r="2" fill="#DDA0DD" opacity={0.5} />
        <Circle cx="22" cy="26" r="2" fill="#DDA0DD" opacity={0.5} />
        <Circle cx="30" cy="24" r="2" fill="#DDA0DD" opacity={0.5} />
        <Circle cx="38" cy="26" r="2" fill="#DDA0DD" opacity={0.5} />
        <Circle cx="18" cy="36" r="2" fill="#DDA0DD" opacity={0.5} />
        <Circle cx="26" cy="34" r="2" fill="#DDA0DD" opacity={0.5} />
        <Circle cx="34" cy="34" r="2" fill="#DDA0DD" opacity={0.5} />
        <Circle cx="42" cy="36" r="2" fill="#DDA0DD" opacity={0.5} />
      </G>
      
      {/* Small green grape accent */}
      <G transform="translate(50, 48) scale(0.5)">
        <Circle cx="6" cy="6" r="5" fill="url(#greenGrapeGrad)" />
        <Circle cx="14" cy="8" r="5" fill="url(#greenGrapeGrad)" />
        <Circle cx="10" cy="16" r="5" fill="url(#greenGrapeGrad)" />
        <Circle cx="4" cy="4" r="1.5" fill="#ADFF2F" opacity={0.6} />
        <Circle cx="12" cy="6" r="1.5" fill="#ADFF2F" opacity={0.6} />
      </G>
    </Svg>
  );
};

export default GrapesIllustration;
