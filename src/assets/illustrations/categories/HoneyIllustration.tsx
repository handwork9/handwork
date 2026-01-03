import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Polygon, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic honey illustration - honey jar, honeycomb, bees, and dripping honey
const HoneyIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FFC107' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Honey gradient */}
      <LinearGradient id="honeyFill" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="50%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      
      {/* Glass jar gradient */}
      <LinearGradient id="honeyJarGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFF8E1" stopOpacity="0.3" />
        <Stop offset="15%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="30%" stopColor="#FFF8E1" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
      </LinearGradient>
      
      {/* Wooden lid gradient */}
      <LinearGradient id="honeyLid" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      
      {/* Bee body gradient */}
      <LinearGradient id="beeBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFC107" />
        <Stop offset="25%" stopColor="#212121" />
        <Stop offset="50%" stopColor="#FFC107" />
        <Stop offset="75%" stopColor="#212121" />
        <Stop offset="100%" stopColor="#FFC107" />
      </LinearGradient>
      
      {/* Honey drip gradient */}
      <LinearGradient id="honeyDrip" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF6F00" />
      </LinearGradient>
    </Defs>
    
    {/* Honey jar */}
    <G>
      {/* Jar body */}
      <Path
        d="M18 26H46V28L48 32V54C48 57 45 60 42 60H22C19 60 16 57 16 54V32L18 28V26Z"
        fill="url(#honeyFill)"
      />
      {/* Glass reflection */}
      <Path
        d="M20 30L20 54C20 56 21 58 23 58"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      
      {/* Jar rim */}
      <Path d="M18 26H46V30H18V26Z" fill="#FFE082" />
      
      {/* Wooden lid */}
      <Path d="M16 20H48V26H16V20Z" fill="url(#honeyLid)" />
      <Path d="M18 16H46V20H18V16Z" fill="#A1887F" />
      {/* Lid texture */}
      <Path d="M20 18H44" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      <Path d="M20 22H44" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      
      {/* Honey drip on jar */}
      <Path
        d="M38 28V38C38 40 40 43 40 46C40 49 37 51 34 51C31 51 28 49 28 46"
        fill="url(#honeyDrip)"
      />
      
      {/* Honeycomb pattern inside */}
      <G opacity="0.3">
        <Polygon points="26,40 30,38 34,40 34,44 30,46 26,44" fill="#FF8F00" />
        <Polygon points="34,40 38,38 42,40 42,44 38,46 34,44" fill="#FF8F00" />
        <Polygon points="26,48 30,46 34,48 34,52 30,54 26,52" fill="#FF8F00" />
        <Polygon points="34,48 38,46 42,48 42,52 38,54 34,52" fill="#FF8F00" />
      </G>
    </G>
    
    {/* Bee 1 - flying near top */}
    <G>
      {/* Body with stripes */}
      <Ellipse cx="54" cy="14" rx="6" ry="4" fill="url(#beeBody)" />
      {/* Head */}
      <Circle cx="60" cy="14" r="3" fill="#212121" />
      {/* Eye highlight */}
      <Circle cx="61" cy="13" r="0.8" fill="#616161" />
      {/* Wings */}
      <Ellipse cx="52" cy="10" rx="5" ry="2.5" fill="#E3F2FD" opacity="0.7" />
      <Ellipse cx="56" cy="10" rx="4" ry="2" fill="#E3F2FD" opacity="0.6" />
      {/* Antennae */}
      <Path d="M62 12L64 10" stroke="#212121" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M62 14L64 12" stroke="#212121" strokeWidth="0.8" strokeLinecap="round" />
      {/* Stinger */}
      <Path d="M48 14L46 14" stroke="#212121" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* Bee 2 - smaller, left side */}
    <G>
      <Ellipse cx="8" cy="34" rx="5" ry="3" fill="url(#beeBody)" />
      <Circle cx="13" cy="34" r="2.5" fill="#212121" />
      <Circle cx="14" cy="33" r="0.6" fill="#616161" />
      <Ellipse cx="7" cy="30" rx="4" ry="2" fill="#E3F2FD" opacity="0.7" />
      <Ellipse cx="10" cy="30" rx="3" ry="1.5" fill="#E3F2FD" opacity="0.6" />
      <Path d="M3 34L2 34" stroke="#212121" strokeWidth="0.8" strokeLinecap="round" />
    </G>
    
    {/* Small honey drops on surface */}
    <Ellipse cx="10" cy="58" rx="4" ry="2" fill="#FFB300" />
    <Ellipse cx="56" cy="56" rx="3" ry="1.5" fill="#FFA000" />
  </Svg>
);

export default HoneyIllustration;
