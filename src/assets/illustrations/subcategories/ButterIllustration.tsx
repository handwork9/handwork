import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const ButterIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="butterBlock" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF59D" />
        <Stop offset="50%" stopColor="#FFEE58" />
        <Stop offset="100%" stopColor="#FDD835" />
      </LinearGradient>
      <LinearGradient id="butterSide" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFEE58" />
        <Stop offset="100%" stopColor="#F9A825" />
      </LinearGradient>
      <LinearGradient id="butterSlice" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF9C4" />
        <Stop offset="50%" stopColor="#FFF59D" />
        <Stop offset="100%" stopColor="#FFEE58" />
      </LinearGradient>
      <LinearGradient id="wrapper" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#C5CAE9" />
        <Stop offset="50%" stopColor="#E8EAF6" />
        <Stop offset="100%" stopColor="#9FA8DA" />
      </LinearGradient>
      <LinearGradient id="knifeBlde" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#90A4AE" />
        <Stop offset="50%" stopColor="#ECEFF1" />
        <Stop offset="100%" stopColor="#78909C" />
      </LinearGradient>
    </Defs>
    
    {/* Butter wrapper/dish */}
    <G>
      <Path
        d="M6 40H42V56C42 58 40 60 38 60H10C8 60 6 58 6 56V40Z"
        fill="url(#wrapper)"
        stroke="#7986CB"
        strokeWidth="0.5"
      />
      {/* Wrapper fold lines */}
      <Path d="M6 45H42" stroke="#9FA8DA" strokeWidth="0.5" opacity="0.5" />
      <Path d="M6 50H42" stroke="#9FA8DA" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Main butter block */}
    <G>
      {/* Top surface */}
      <Path
        d="M8 26H40L44 30H12L8 26Z"
        fill="url(#butterBlock)"
      />
      
      {/* Front face */}
      <Path
        d="M12 30H44V40H8V30L12 30Z"
        fill="url(#butterSide)"
      />
      
      {/* Top of butter */}
      <Rect x="8" y="20" width="32" height="6" rx="1" fill="url(#butterBlock)" />
      
      {/* Butter surface texture */}
      <Path
        d="M12 22C14 21 18 23 22 22C26 21 30 23 34 22"
        stroke="#FBC02D"
        strokeWidth="0.5"
        opacity="0.5"
        fill="none"
      />
      
      {/* Measurement lines on butter */}
      <Path d="M16 20V26" stroke="#FBC02D" strokeWidth="0.5" opacity="0.4" />
      <Path d="M24 20V26" stroke="#FBC02D" strokeWidth="0.5" opacity="0.4" />
      <Path d="M32 20V26" stroke="#FBC02D" strokeWidth="0.5" opacity="0.4" />
      
      {/* Butter shine */}
      <Path
        d="M10 22H14"
        stroke="#FFFDE7"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </G>
    
    {/* Butter curl/slice */}
    <G>
      <Path
        d="M48 28C48 24 50 22 54 22C58 22 60 26 58 30C56 34 52 36 50 38C48 40 48 42 50 44"
        fill="url(#butterSlice)"
        stroke="#FBC02D"
        strokeWidth="0.5"
      />
      {/* Curl shine */}
      <Path
        d="M50 26C52 24 56 26 56 28"
        stroke="#FFFDE7"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
        fill="none"
      />
    </G>
    
    {/* Butter knife */}
    <G>
      {/* Blade */}
      <Path
        d="M46 48L62 10L64 12L50 52L46 48Z"
        fill="url(#knifeBlde)"
      />
      
      {/* Blade edge highlight */}
      <Path
        d="M48 46L62 12"
        stroke="#ECEFF1"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* Handle */}
      <Path
        d="M46 48L50 52L48 58C48 60 46 62 44 60L42 56L46 48Z"
        fill="#8D6E63"
      />
      <Path
        d="M44 54L46 50"
        stroke="#A1887F"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Butter on knife */}
      <Ellipse cx="56" cy="20" rx="3" ry="1.5" fill="#FFF59D" opacity="0.8" />
    </G>
  </Svg>
);

export default ButterIllustration;
