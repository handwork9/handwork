import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface WheatIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const WheatIllustration: React.FC<WheatIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#DAA520',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* First wheat stalk */}
      <G>
        {/* Stem */}
        <Path
          d="M16 58C16 58 18 40 20 28"
          stroke="#9ACD32"
          strokeWidth={2}
          strokeLinecap="round"
        />
        
        {/* Wheat head */}
        <Ellipse cx="20" cy="24" rx="3" ry="5" fill={color} />
        <Ellipse cx="18" cy="20" rx="3" ry="5" fill={color} transform="rotate(-15 18 20)" />
        <Ellipse cx="22" cy="20" rx="3" ry="5" fill={color} transform="rotate(15 22 20)" />
        <Ellipse cx="20" cy="16" rx="3" ry="5" fill={color} />
        <Ellipse cx="18" cy="12" rx="2.5" ry="4" fill={color} transform="rotate(-15 18 12)" />
        <Ellipse cx="22" cy="12" rx="2.5" ry="4" fill={color} transform="rotate(15 22 12)" />
        <Ellipse cx="20" cy="8" rx="2" ry="3" fill={color} />
        
        {/* Awns (whiskers) */}
        <Path d="M20 4C20 4 20 2 20 0" stroke={color} strokeWidth={1} strokeLinecap="round" />
        <Path d="M18 8C18 8 14 4 12 2" stroke={color} strokeWidth={1} strokeLinecap="round" />
        <Path d="M22 8C22 8 26 4 28 2" stroke={color} strokeWidth={1} strokeLinecap="round" />
      </G>
      
      {/* Second wheat stalk */}
      <G>
        <Path
          d="M32 60C32 60 34 44 36 32"
          stroke="#9ACD32"
          strokeWidth={2}
          strokeLinecap="round"
        />
        
        <Ellipse cx="36" cy="28" rx="3" ry="5" fill="#D4AF37" />
        <Ellipse cx="34" cy="24" rx="3" ry="5" fill="#D4AF37" transform="rotate(-15 34 24)" />
        <Ellipse cx="38" cy="24" rx="3" ry="5" fill="#D4AF37" transform="rotate(15 38 24)" />
        <Ellipse cx="36" cy="20" rx="3" ry="5" fill="#D4AF37" />
        <Ellipse cx="34" cy="16" rx="2.5" ry="4" fill="#D4AF37" transform="rotate(-15 34 16)" />
        <Ellipse cx="38" cy="16" rx="2.5" ry="4" fill="#D4AF37" transform="rotate(15 38 16)" />
        <Ellipse cx="36" cy="12" rx="2" ry="3" fill="#D4AF37" />
        
        <Path d="M36 8C36 8 36 6 36 4" stroke="#D4AF37" strokeWidth={1} strokeLinecap="round" />
        <Path d="M34 12C34 12 30 8 28 6" stroke="#D4AF37" strokeWidth={1} strokeLinecap="round" />
        <Path d="M38 12C38 12 42 8 44 6" stroke="#D4AF37" strokeWidth={1} strokeLinecap="round" />
      </G>
      
      {/* Third wheat stalk */}
      <G>
        <Path
          d="M48 58C48 58 48 42 48 30"
          stroke="#9ACD32"
          strokeWidth={2}
          strokeLinecap="round"
        />
        
        <Ellipse cx="48" cy="26" rx="3" ry="5" fill={color} />
        <Ellipse cx="46" cy="22" rx="3" ry="5" fill={color} transform="rotate(-15 46 22)" />
        <Ellipse cx="50" cy="22" rx="3" ry="5" fill={color} transform="rotate(15 50 22)" />
        <Ellipse cx="48" cy="18" rx="3" ry="5" fill={color} />
        <Ellipse cx="46" cy="14" rx="2.5" ry="4" fill={color} transform="rotate(-15 46 14)" />
        <Ellipse cx="50" cy="14" rx="2.5" ry="4" fill={color} transform="rotate(15 50 14)" />
        <Ellipse cx="48" cy="10" rx="2" ry="3" fill={color} />
        
        <Path d="M48 6C48 6 48 4 48 2" stroke={color} strokeWidth={1} strokeLinecap="round" />
        <Path d="M46 10C46 10 42 6 40 4" stroke={color} strokeWidth={1} strokeLinecap="round" />
        <Path d="M50 10C50 10 54 6 56 4" stroke={color} strokeWidth={1} strokeLinecap="round" />
      </G>
    </Svg>
  );
};

export default WheatIllustration;
