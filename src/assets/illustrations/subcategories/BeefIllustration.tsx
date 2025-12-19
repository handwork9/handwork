import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const BeefIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="beefMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="30%" stopColor="#E53935" />
        <Stop offset="70%" stopColor="#C62828" />
        <Stop offset="100%" stopColor="#B71C1C" />
      </LinearGradient>
      <LinearGradient id="beefFat" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFDE7" />
        <Stop offset="50%" stopColor="#FFF9C4" />
        <Stop offset="100%" stopColor="#FFF59D" />
      </LinearGradient>
      <LinearGradient id="beefMarbling" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCDD2" />
        <Stop offset="100%" stopColor="#EF9A9A" />
      </LinearGradient>
      <LinearGradient id="cuttingBoard" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
    </Defs>
    
    {/* Cutting board */}
    <G>
      <Rect x="4" y="44" width="56" height="16" rx="2" fill="url(#cuttingBoard)" />
      {/* Wood grain */}
      <Path d="M6 48H58" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      <Path d="M6 52H58" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      <Path d="M6 56H58" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
    </G>
    
    {/* Main beef steak */}
    <G>
      {/* Steak body */}
      <Path
        d="M10 24C10 18 18 12 32 12C46 12 54 18 54 24V38C54 42 46 46 32 46C18 46 10 42 10 38V24Z"
        fill="url(#beefMeat)"
      />
      
      {/* Fat cap on top */}
      <Path
        d="M10 24C10 20 18 16 32 16C46 16 54 20 54 24C54 26 46 28 32 28C18 28 10 26 10 24Z"
        fill="url(#beefFat)"
      />
      
      {/* Marbling lines */}
      <Path d="M16 30C20 28 26 32 32 30C38 28 44 32 48 30" stroke="url(#beefMarbling)" strokeWidth="2" fill="none" opacity="0.6" />
      <Path d="M18 36C22 34 28 38 34 36C40 34 46 38 50 36" stroke="url(#beefMarbling)" strokeWidth="1.5" fill="none" opacity="0.5" />
      <Path d="M20 42C24 40 30 44 36 42C42 40 48 44 52 42" stroke="url(#beefMarbling)" strokeWidth="1" fill="none" opacity="0.4" />
      
      {/* Fat pockets */}
      <Circle cx="22" cy="34" r="2" fill="#FFCDD2" opacity="0.6" />
      <Circle cx="40" cy="32" r="1.5" fill="#FFCDD2" opacity="0.5" />
      <Circle cx="30" cy="40" r="1.8" fill="#FFCDD2" opacity="0.5" />
      <Circle cx="46" cy="38" r="1.2" fill="#FFCDD2" opacity="0.4" />
      
      {/* Meat shine */}
      <Path
        d="M14 26C18 24 24 26 28 24"
        stroke="#FFEBEE"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </G>
    
    {/* T-bone shape indicator */}
    <G>
      <Path
        d="M30 20V42"
        stroke="#D7CCC8"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <Path
        d="M26 22H34"
        stroke="#D7CCC8"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
    </G>
    
    {/* Rosemary sprig */}
    <G opacity="0.8">
      <Path d="M50 8L56 4" stroke="#4CAF50" strokeWidth="1" />
      <Path d="M51 7C52 6 54 6 54 8C54 9 52 9 51 8Z" fill="#66BB6A" />
      <Path d="M53 5C54 4 56 4 56 6C56 7 54 7 53 6Z" fill="#81C784" />
      <Path d="M52 9C53 8 55 8 55 10C55 11 53 11 52 10Z" fill="#66BB6A" />
    </G>
  </Svg>
);

export default BeefIllustration;
