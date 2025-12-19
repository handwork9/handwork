import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Guinea fowl meat - roasted
const GuineaFowlMeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="guineaSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#BDBDBD" />
        <Stop offset="30%" stopColor="#9E9E9E" />
        <Stop offset="70%" stopColor="#757575" />
        <Stop offset="100%" stopColor="#616161" />
      </LinearGradient>
      <LinearGradient id="guineaSpots" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#424242" />
        <Stop offset="100%" stopColor="#212121" />
      </LinearGradient>
      <LinearGradient id="guineaMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFAB91" />
        <Stop offset="50%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF7043" />
      </LinearGradient>
      <LinearGradient id="clayPot" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
    </Defs>
    
    {/* Clay pot/casserole */}
    <G>
      <Path
        d="M4 40C4 34 12 30 32 30C52 30 60 34 60 40V52C60 58 52 62 32 62C12 62 4 58 4 52V40Z"
        fill="url(#clayPot)"
        stroke="#5D4037"
        strokeWidth="0.5"
      />
      {/* Pot rim */}
      <Ellipse cx="32" cy="30" rx="28" ry="6" fill="#A1887F" stroke="#6D4C41" strokeWidth="0.5" />
      {/* Pot handles */}
      <Ellipse cx="6" cy="42" rx="4" ry="6" fill="#8D6E63" />
      <Ellipse cx="58" cy="42" rx="4" ry="6" fill="#8D6E63" />
      {/* Pot decoration */}
      <Path d="M10 46C18 44 28 48 38 46C48 44 54 46 56 48" stroke="#5D4037" strokeWidth="1" opacity="0.4" />
    </G>
    
    {/* Guinea fowl pieces in pot */}
    <G>
      {/* Main body piece */}
      <Ellipse cx="32" cy="38" rx="16" ry="10" fill="url(#guineaSkin)" />
      
      {/* Characteristic spotted pattern */}
      <Circle cx="24" cy="36" r="1.5" fill="url(#guineaSpots)" opacity="0.6" />
      <Circle cx="30" cy="34" r="1.2" fill="url(#guineaSpots)" opacity="0.5" />
      <Circle cx="36" cy="36" r="1.4" fill="url(#guineaSpots)" opacity="0.6" />
      <Circle cx="28" cy="40" r="1" fill="url(#guineaSpots)" opacity="0.5" />
      <Circle cx="34" cy="42" r="1.3" fill="url(#guineaSpots)" opacity="0.5" />
      <Circle cx="40" cy="38" r="1.1" fill="url(#guineaSpots)" opacity="0.6" />
      <Circle cx="22" cy="42" r="1" fill="url(#guineaSpots)" opacity="0.4" />
      <Circle cx="42" cy="34" r="1" fill="url(#guineaSpots)" opacity="0.5" />
      
      {/* Meat visible */}
      <Path
        d="M40 40C44 38 48 42 46 46C44 48 40 48 38 44C38 42 38 40 40 40Z"
        fill="url(#guineaMeat)"
      />
    </G>
    
    {/* Leg piece */}
    <G>
      <Path
        d="M14 42C10 44 10 50 14 52C18 54 22 52 24 48C24 44 20 42 14 42Z"
        fill="url(#guineaSkin)"
      />
      {/* Spots on leg */}
      <Circle cx="16" cy="46" r="1" fill="url(#guineaSpots)" opacity="0.5" />
      <Circle cx="20" cy="48" r="0.8" fill="url(#guineaSpots)" opacity="0.4" />
      {/* Bone */}
      <Path d="M14 52L12 56" stroke="#D7CCC8" strokeWidth="2" strokeLinecap="round" />
    </G>
    
    {/* Thigh piece */}
    <G>
      <Ellipse cx="48" cy="46" rx="8" ry="6" fill="url(#guineaSkin)" />
      {/* Spots */}
      <Circle cx="46" cy="44" r="1" fill="url(#guineaSpots)" opacity="0.5" />
      <Circle cx="50" cy="48" r="0.8" fill="url(#guineaSpots)" opacity="0.4" />
    </G>
    
    {/* Sauce/gravy */}
    <G>
      <Ellipse cx="32" cy="50" rx="20" ry="4" fill="#5D4037" opacity="0.5" />
    </G>
    
    {/* Vegetables in pot */}
    <G>
      {/* Carrots */}
      <Ellipse cx="20" cy="50" rx="3" ry="2" fill="#FF7043" />
      <Ellipse cx="44" cy="52" rx="2.5" ry="1.5" fill="#FF8A65" />
      
      {/* Onion */}
      <Circle cx="52" cy="50" r="2.5" fill="#E1BEE7" opacity="0.7" />
      
      {/* Herbs */}
      <Path d="M26 48C28 46 32 46 34 48" stroke="#66BB6A" strokeWidth="1" />
    </G>
    
    {/* Steam */}
    <G opacity="0.3">
      <Path d="M28 26C28 24 30 22 30 20" stroke="#BDBDBD" strokeWidth="1" strokeLinecap="round" />
      <Path d="M36 24C36 22 38 20 38 18" stroke="#BDBDBD" strokeWidth="1" strokeLinecap="round" />
    </G>
  </Svg>
);

export default GuineaFowlMeatIllustration;
