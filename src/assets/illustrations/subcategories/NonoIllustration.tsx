import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Nono - Nigerian fermented milk drink
const NonoIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="nonoLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="50%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#EEEEEE" />
      </LinearGradient>
      <LinearGradient id="calabashBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <LinearGradient id="gourdContainer" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="30%" stopColor="#BCAAA4" />
        <Stop offset="70%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
    </Defs>
    
    {/* Traditional gourd container */}
    <G>
      {/* Gourd body */}
      <Path
        d="M6 20C6 14 14 8 22 8C26 8 28 12 28 16V20H6Z"
        fill="url(#gourdContainer)"
        stroke="#6D4C41"
        strokeWidth="0.5"
      />
      <Path
        d="M6 20V38C6 44 12 48 22 48C32 48 38 44 38 38V20H6Z"
        fill="url(#gourdContainer)"
        stroke="#6D4C41"
        strokeWidth="0.5"
      />
      
      {/* Gourd neck */}
      <Path
        d="M16 8V4C16 2 18 2 22 2C26 2 28 2 28 4V8"
        fill="#A1887F"
        stroke="#6D4C41"
        strokeWidth="0.5"
      />
      
      {/* Gourd opening */}
      <Ellipse cx="22" cy="8" rx="6" ry="2" fill="#6D4C41" />
      
      {/* Nono visible at top */}
      <Ellipse cx="22" cy="10" rx="5" ry="1.5" fill="url(#nonoLiquid)" />
      
      {/* Gourd texture/pattern */}
      <Path d="M10 24C14 22 18 26 22 24C26 22 30 26 34 24" stroke="#8D6E63" strokeWidth="0.5" opacity="0.5" fill="none" />
      <Path d="M8 32C12 30 16 34 22 32C28 30 32 34 36 32" stroke="#8D6E63" strokeWidth="0.5" opacity="0.5" fill="none" />
      
      {/* Gourd shine */}
      <Path d="M10 22V36" stroke="#D7CCC8" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </G>
    
    {/* Drinking bowl with nono */}
    <G>
      {/* Bowl */}
      <Path
        d="M40 38C40 34 46 32 54 32C62 32 64 34 64 38V46C64 50 60 54 54 54C48 54 40 50 40 46V38Z"
        fill="url(#calabashBowl)"
        stroke="#6D4C41"
        strokeWidth="0.5"
      />
      
      {/* Bowl rim */}
      <Ellipse cx="52" cy="32" rx="12" ry="3" fill="#BCAAA4" stroke="#8D6E63" strokeWidth="0.5" />
      
      {/* Nono in bowl */}
      <Ellipse cx="52" cy="36" rx="10" ry="3" fill="url(#nonoLiquid)" />
      
      {/* Frothy top */}
      <Circle cx="48" cy="35" r="1.5" fill="#FFFFFF" opacity="0.8" />
      <Circle cx="54" cy="36" r="1" fill="#FFFFFF" opacity="0.7" />
      <Circle cx="56" cy="35" r="0.8" fill="#FFFFFF" opacity="0.6" />
      <Circle cx="50" cy="36" r="0.6" fill="#FFFFFF" opacity="0.7" />
      
      {/* Bowl pattern */}
      <Path d="M44 42C48 40 52 44 56 42C60 40 62 42 62 42" stroke="#6D4C41" strokeWidth="0.5" opacity="0.4" fill="none" />
    </G>
    
    {/* Fura balls (often served with nono) */}
    <G>
      {/* Fura ball 1 */}
      <Circle cx="50" cy="58" r="4" fill="#D7CCC8" />
      <Circle cx="49" cy="57" r="1.5" fill="#EFEBE9" opacity="0.6" />
      
      {/* Fura ball 2 */}
      <Circle cx="58" cy="60" r="3.5" fill="#BCAAA4" />
      <Circle cx="57" cy="59" r="1.2" fill="#D7CCC8" opacity="0.6" />
      
      {/* Fura ball 3 */}
      <Circle cx="44" cy="60" r="3" fill="#D7CCC8" />
      <Circle cx="43" cy="59" r="1" fill="#EFEBE9" opacity="0.5" />
    </G>
    
    {/* Drip of nono */}
    <Path
      d="M20 48C20 50 21 52 22 54C22 56 20 58 20 58"
      stroke="#F5F5F5"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.6"
    />
  </Svg>
);

export default NonoIllustration;
