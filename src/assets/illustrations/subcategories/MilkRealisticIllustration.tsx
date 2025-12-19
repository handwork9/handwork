import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const MilkRealisticIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="milkBottle" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E8F5E9" />
        <Stop offset="30%" stopColor="#FFFFFF" />
        <Stop offset="70%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#C8E6C9" />
      </LinearGradient>
      <LinearGradient id="milkLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFDE7" />
        <Stop offset="100%" stopColor="#FFF8E1" />
      </LinearGradient>
      <LinearGradient id="glassMilk" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E3F2FD" />
        <Stop offset="50%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#BBDEFB" />
      </LinearGradient>
      <LinearGradient id="glassBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#B3E5FC" stopOpacity="0.3" />
        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#81D4FA" stopOpacity="0.3" />
      </LinearGradient>
      <LinearGradient id="bottleCap" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </LinearGradient>
    </Defs>
    
    {/* Milk Bottle */}
    <G>
      {/* Bottle body */}
      <Path
        d="M8 22C8 20 10 18 12 18H24C26 18 28 20 28 22V52C28 54 26 56 24 56H12C10 56 8 54 8 52V22Z"
        fill="url(#milkBottle)"
        stroke="#A5D6A7"
        strokeWidth="0.5"
      />
      
      {/* Bottle neck */}
      <Path
        d="M13 10H23V18H13V10Z"
        fill="url(#milkBottle)"
        stroke="#A5D6A7"
        strokeWidth="0.5"
      />
      
      {/* Cap */}
      <Rect x="12" y="6" width="12" height="5" rx="1.5" fill="url(#bottleCap)" />
      <Ellipse cx="18" cy="6" rx="5.5" ry="1" fill="#66BB6A" />
      
      {/* Milk inside bottle */}
      <Path
        d="M10 26C10 24 11 23 12 23H24C25 23 26 24 26 26V51C26 52 25 54 24 54H12C11 54 10 52 10 51V26Z"
        fill="url(#milkLiquid)"
      />
      
      {/* Milk surface */}
      <Ellipse cx="18" cy="26" rx="7" ry="2" fill="#FFFDE7" />
      
      {/* Label */}
      <Rect x="10" y="34" width="16" height="12" rx="1" fill="#E8F5E9" />
      <Path d="M14 38L18 42L22 38" stroke="#4CAF50" strokeWidth="1" fill="none" />
      <Circle cx="18" cy="40" r="2" fill="#4CAF50" />
      
      {/* Bottle shine */}
      <Path
        d="M11 22V50"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </G>
    
    {/* Glass of Milk */}
    <G>
      {/* Glass body */}
      <Path
        d="M38 28C36 28 35 30 35 32V54C35 56 37 58 40 58H52C55 58 57 56 57 54V32C57 30 56 28 54 28H38Z"
        fill="url(#glassBody)"
        stroke="#90CAF9"
        strokeWidth="0.5"
      />
      
      {/* Milk in glass */}
      <Path
        d="M36 34V53C36 55 38 57 40 57H52C54 57 56 55 56 53V34H36Z"
        fill="url(#glassMilk)"
      />
      
      {/* Milk foam on top */}
      <Ellipse cx="46" cy="34" rx="10" ry="3" fill="#FFFFFF" />
      <Circle cx="42" cy="33" r="1.5" fill="#FFFDE7" opacity="0.8" />
      <Circle cx="48" cy="34" r="1" fill="#FFFDE7" opacity="0.7" />
      <Circle cx="45" cy="32" r="0.8" fill="#FFFDE7" opacity="0.6" />
      
      {/* Glass rim */}
      <Ellipse cx="46" cy="28" rx="10" ry="2" fill="none" stroke="#64B5F6" strokeWidth="1" />
      
      {/* Glass shine */}
      <Path
        d="M38 32V52"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      {/* Condensation droplets */}
      <Circle cx="54" cy="42" r="1" fill="#E3F2FD" opacity="0.8" />
      <Circle cx="55" cy="48" r="0.8" fill="#E3F2FD" opacity="0.7" />
      <Circle cx="53" cy="52" r="0.6" fill="#E3F2FD" opacity="0.6" />
    </G>
  </Svg>
);

export default MilkRealisticIllustration;
