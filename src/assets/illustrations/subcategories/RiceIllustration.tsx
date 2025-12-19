import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const RiceIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="bowlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ECEFF1" />
        <Stop offset="100%" stopColor="#B0BEC5" />
      </LinearGradient>
    </Defs>
    
    {/* Bowl */}
    <Path
      d="M8 32C8 32 8 48 16 54C24 60 40 60 48 54C56 48 56 32 56 32L8 32Z"
      fill="url(#bowlGrad)"
    />
    <Ellipse cx="32" cy="32" rx="24" ry="6" fill="#CFD8DC" />
    
    {/* Rice pile */}
    <Ellipse cx="32" cy="30" rx="20" ry="8" fill="#FAFAFA" />
    
    {/* Rice grains on top */}
    <G>
      <Ellipse cx="24" cy="28" rx="3" ry="1.5" fill="#FFF8E1" transform="rotate(-20 24 28)" />
      <Ellipse cx="32" cy="26" rx="3" ry="1.5" fill="#FFF8E1" transform="rotate(10 32 26)" />
      <Ellipse cx="40" cy="28" rx="3" ry="1.5" fill="#FFF8E1" transform="rotate(25 40 28)" />
      <Ellipse cx="28" cy="30" rx="3" ry="1.5" fill="#FFFDE7" transform="rotate(-10 28 30)" />
      <Ellipse cx="36" cy="30" rx="3" ry="1.5" fill="#FFFDE7" transform="rotate(15 36 30)" />
      <Ellipse cx="20" cy="30" rx="2.5" ry="1.2" fill="#FFF8E1" transform="rotate(-30 20 30)" />
      <Ellipse cx="44" cy="30" rx="2.5" ry="1.2" fill="#FFF8E1" transform="rotate(30 44 30)" />
    </G>
    
    {/* Chopsticks */}
    <G>
      <Path
        d="M46 8L38 28"
        stroke="#8D6E63"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M52 10L42 28"
        stroke="#A1887F"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </G>
    
    {/* Steam */}
    <G opacity="0.4">
      <Path d="M24 20C24 18 26 16 26 14" stroke="#90A4AE" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M32 18C32 16 34 14 34 12" stroke="#90A4AE" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M40 20C40 18 42 16 42 14" stroke="#90A4AE" strokeWidth="1.5" strokeLinecap="round" />
    </G>
  </Svg>
);

export default RiceIllustration;
