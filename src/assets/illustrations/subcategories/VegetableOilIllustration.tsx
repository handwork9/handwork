import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic vegetable oil - clear golden oil in plastic bottle
const VegetableOilIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="vegOilColor" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFF59D" />
        <Stop offset="30%" stopColor="#FFEE58" />
        <Stop offset="60%" stopColor="#FFEB3B" />
        <Stop offset="100%" stopColor="#FDD835" />
      </LinearGradient>
      <LinearGradient id="vegOilPlastic" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
      </LinearGradient>
      <LinearGradient id="vegOilCap" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FDD835" />
        <Stop offset="50%" stopColor="#FBC02D" />
        <Stop offset="100%" stopColor="#F9A825" />
      </LinearGradient>
      <LinearGradient id="vegOilHandle" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFEB3B" stopOpacity="0.6" />
        <Stop offset="50%" stopColor="#FFF59D" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#FFEB3B" stopOpacity="0.6" />
      </LinearGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="30" cy="62" rx="16" ry="2" fill="#F57F17" opacity="0.2" />
    
    {/* Main bottle - large plastic jug style */}
    <G>
      {/* Bottle body */}
      <Path
        d="M12 20C12 16 16 14 24 14L24 10L36 10L36 14C44 14 48 16 48 20L48 56C48 60 44 62 30 62C16 62 12 60 12 56L12 20Z"
        fill="url(#vegOilColor)"
      />
      
      {/* Plastic bottle texture/reflection */}
      <Path
        d="M16 22C16 18 18 16 22 16L22 58C18 58 16 56 16 54L16 22Z"
        fill="url(#vegOilPlastic)"
      />
      
      {/* Right side reflection */}
      <Path
        d="M44 22C44 20 42 18 40 18L40 58C42 58 44 56 44 54L44 22Z"
        fill="url(#vegOilPlastic)"
        opacity="0.5"
      />
      
      {/* Oil surface level */}
      <Ellipse cx="30" cy="16" rx="12" ry="2" fill="#FFF59D" opacity="0.7" />
      
      {/* Grip indentations on sides */}
      <Path d="M14 32C12 34 12 38 14 40" stroke="#FBC02D" strokeWidth="1" opacity="0.4" />
      <Path d="M14 42C12 44 12 48 14 50" stroke="#FBC02D" strokeWidth="1" opacity="0.4" />
      <Path d="M46 32C48 34 48 38 46 40" stroke="#FBC02D" strokeWidth="1" opacity="0.3" />
      <Path d="M46 42C48 44 48 48 46 50" stroke="#FBC02D" strokeWidth="1" opacity="0.3" />
    </G>
    
    {/* Handle */}
    <G>
      <Path
        d="M36 14L36 6C36 4 40 2 44 4C48 6 50 12 48 16C46 18 44 18 42 16L42 14"
        fill="url(#vegOilHandle)"
        stroke="#FDD835"
        strokeWidth="1"
      />
    </G>
    
    {/* Bottle neck */}
    <Path
      d="M24 10L24 4C24 2 26 0 30 0C34 0 36 2 36 4L36 10"
      fill="#FFEE58"
    />
    
    {/* Yellow cap */}
    <G>
      <Path
        d="M24 4L24 -2C24 -4 26 -6 30 -6C34 -6 36 -4 36 -2L36 4"
        fill="url(#vegOilCap)"
      />
      <Ellipse cx="30" cy="-2" rx="6" ry="2" fill="#FDD835" />
      {/* Cap ridges */}
      <Path d="M26 0L34 0" stroke="#F9A825" strokeWidth="0.5" opacity="0.6" />
      <Path d="M25 2L35 2" stroke="#F9A825" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Label */}
    <G>
      <Path
        d="M16 34L44 34L44 52L16 52Z"
        fill="#FFFFFF"
        opacity="0.85"
      />
      {/* Sunflower icon */}
      <Circle cx="30" cy="42" r="4" fill="#FDD835" />
      <Circle cx="30" cy="42" r="2" fill="#795548" />
      {/* Petals */}
      <Path d="M30 36L30 34" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M30 48L30 50" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M24 42L22 42" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M36 42L38 42" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M26 38L24 36" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M34 46L36 48" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M26 46L24 48" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M34 38L36 36" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" />
    </G>
    
    {/* Oil drops */}
    <G>
      <Path
        d="M54 28C56 32 54 36 52 36C50 36 50 32 52 28C52 26 54 26 54 28Z"
        fill="url(#vegOilColor)"
        opacity="0.7"
      />
      <Path
        d="M58 40C60 44 58 46 56 46C54 46 54 44 56 40"
        fill="url(#vegOilColor)"
        opacity="0.5"
      />
    </G>
    
    {/* Measuring cup with oil */}
    <G>
      <Path
        d="M52 54C50 52 50 48 54 48L62 48C64 48 64 52 62 54L62 58C62 60 60 62 56 62C52 62 52 60 52 58L52 54Z"
        fill="#E0E0E0"
        opacity="0.8"
      />
      <Ellipse cx="57" cy="52" rx="4" ry="2" fill="url(#vegOilColor)" opacity="0.8" />
      {/* Measurement lines */}
      <Path d="M52 54L54 54" stroke="#9E9E9E" strokeWidth="0.5" />
      <Path d="M52 56L53 56" stroke="#9E9E9E" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default VegetableOilIllustration;
