import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface MilletIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const MilletIllustration: React.FC<MilletIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#C4A747',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Millet has a distinctive spray/brush-like head */}
      
      {/* First millet stalk */}
      <G>
        {/* Stem */}
        <Path
          d="M18 60C18 60 16 45 14 32"
          stroke="#6B8E23"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        
        {/* Millet head - spray of small seeds */}
        <Path d="M14 32C14 32 8 24 6 18" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <Path d="M14 32C14 32 10 22 10 14" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <Path d="M14 32C14 32 14 20 16 12" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <Path d="M14 32C14 32 18 22 22 16" stroke={color} strokeWidth={3} strokeLinecap="round" />
        <Path d="M14 32C14 32 20 26 24 22" stroke={color} strokeWidth={3} strokeLinecap="round" />
        
        {/* Small seed clusters */}
        <Circle cx="6" cy="16" r="2" fill={color} />
        <Circle cx="10" cy="12" r="2" fill={color} />
        <Circle cx="16" cy="10" r="2" fill={color} />
        <Circle cx="22" cy="14" r="2" fill={color} />
        <Circle cx="24" cy="20" r="2" fill={color} />
        <Circle cx="8" cy="20" r="1.5" fill={color} />
        <Circle cx="12" cy="16" r="1.5" fill={color} />
        <Circle cx="18" cy="14" r="1.5" fill={color} />
      </G>
      
      {/* Second millet stalk */}
      <G>
        <Path
          d="M42 62C42 62 44 48 46 36"
          stroke="#6B8E23"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        
        <Path d="M46 36C46 36 40 28 38 22" stroke="#D4B84A" strokeWidth={3} strokeLinecap="round" />
        <Path d="M46 36C46 36 44 26 44 18" stroke="#D4B84A" strokeWidth={3} strokeLinecap="round" />
        <Path d="M46 36C46 36 48 24 50 16" stroke="#D4B84A" strokeWidth={3} strokeLinecap="round" />
        <Path d="M46 36C46 36 52 28 56 22" stroke="#D4B84A" strokeWidth={3} strokeLinecap="round" />
        <Path d="M46 36C46 36 54 32 58 28" stroke="#D4B84A" strokeWidth={3} strokeLinecap="round" />
        
        <Circle cx="38" cy="20" r="2" fill="#D4B84A" />
        <Circle cx="44" cy="16" r="2" fill="#D4B84A" />
        <Circle cx="50" cy="14" r="2" fill="#D4B84A" />
        <Circle cx="56" cy="20" r="2" fill="#D4B84A" />
        <Circle cx="58" cy="26" r="2" fill="#D4B84A" />
        <Circle cx="40" cy="24" r="1.5" fill="#D4B84A" />
        <Circle cx="46" cy="20" r="1.5" fill="#D4B84A" />
        <Circle cx="52" cy="18" r="1.5" fill="#D4B84A" />
      </G>
      
      {/* Some scattered millet grains */}
      <Circle cx="28" cy="52" r="1.5" fill={color} />
      <Circle cx="32" cy="56" r="1.5" fill={color} />
      <Circle cx="36" cy="54" r="1.5" fill={color} />
      <Circle cx="30" cy="58" r="1" fill="#D4B84A" />
      <Circle cx="34" cy="60" r="1" fill="#D4B84A" />
    </Svg>
  );
};

export default MilletIllustration;
