import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const GoatMeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="goatMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D32F2F" />
        <Stop offset="30%" stopColor="#C62828" />
        <Stop offset="70%" stopColor="#B71C1C" />
        <Stop offset="100%" stopColor="#8E0000" />
      </LinearGradient>
      <LinearGradient id="goatFat" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="50%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#EEEEEE" />
      </LinearGradient>
      <LinearGradient id="goatBone" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
      <LinearGradient id="plateBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ECEFF1" />
        <Stop offset="50%" stopColor="#CFD8DC" />
        <Stop offset="100%" stopColor="#B0BEC5" />
      </LinearGradient>
    </Defs>
    
    {/* Plate */}
    <G>
      <Ellipse cx="32" cy="50" rx="28" ry="10" fill="url(#plateBg)" />
      <Ellipse cx="32" cy="48" rx="24" ry="7" fill="#ECEFF1" />
      {/* Plate rim */}
      <Ellipse cx="32" cy="48" rx="24" ry="7" fill="none" stroke="#90A4AE" strokeWidth="0.5" />
    </G>
    
    {/* Goat leg/rack piece */}
    <G>
      {/* Main meat body */}
      <Path
        d="M12 26C12 20 20 14 28 14C32 14 38 16 42 20C48 26 52 34 50 40C48 46 40 50 30 50C18 50 12 42 12 34V26Z"
        fill="url(#goatMeat)"
      />
      
      {/* Fat layer on edge */}
      <Path
        d="M12 26C14 22 20 18 28 18C24 20 20 24 18 30C16 34 14 32 12 28V26Z"
        fill="url(#goatFat)"
        opacity="0.8"
      />
      
      {/* Meat texture lines */}
      <Path d="M18 28C22 26 28 30 34 28C40 26 46 30 48 32" stroke="#B71C1C" strokeWidth="1" fill="none" opacity="0.4" />
      <Path d="M16 36C20 34 26 38 32 36C38 34 44 38 48 36" stroke="#B71C1C" strokeWidth="0.8" fill="none" opacity="0.3" />
      <Path d="M20 44C24 42 30 46 36 44C42 42 46 44 48 44" stroke="#8E0000" strokeWidth="0.6" fill="none" opacity="0.3" />
      
      {/* Bone protruding */}
      <Path
        d="M44 18C48 14 54 12 58 14C60 16 58 20 54 22L44 26"
        fill="url(#goatBone)"
        stroke="#A1887F"
        strokeWidth="0.5"
      />
      {/* Bone end knob */}
      <Circle cx="58" cy="14" r="4" fill="#D7CCC8" />
      <Circle cx="58" cy="14" r="2" fill="#EFEBE9" />
      
      {/* Meat shine */}
      <Path
        d="M20 24C24 22 30 24 34 22"
        stroke="#FFCDD2"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </G>
    
    {/* Pepper garnish */}
    <G>
      <Circle cx="18" cy="46" r="2" fill="#F44336" />
      <Circle cx="18" cy="46" r="1" fill="#E53935" />
      <Path d="M18 44V42" stroke="#4CAF50" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Onion slice */}
    <G opacity="0.7">
      <Circle cx="42" cy="48" r="3" fill="#E1BEE7" />
      <Circle cx="42" cy="48" r="2" fill="#F3E5F5" />
      <Circle cx="42" cy="48" r="1" fill="#CE93D8" opacity="0.5" />
    </G>
  </Svg>
);

export default GoatMeatIllustration;
