import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const OrganicEggsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="organicEggBrown" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="30%" stopColor="#D7CCC8" />
        <Stop offset="70%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <LinearGradient id="organicEggCream" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="30%" stopColor="#FFECB3" />
        <Stop offset="70%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </LinearGradient>
      <RadialGradient id="organicHighlight" cx="30%" cy="25%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="eggCarton" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="leafGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#388E3C" />
      </LinearGradient>
    </Defs>
    
    {/* Egg carton/cardboard tray */}
    <G>
      {/* Carton base */}
      <Path
        d="M4 42H60V56C60 58 58 60 56 60H8C6 60 4 58 4 56V42Z"
        fill="url(#eggCarton)"
        stroke="#5D4037"
        strokeWidth="0.5"
      />
      
      {/* Carton egg holders - indentations */}
      <Ellipse cx="14" cy="48" rx="8" ry="4" fill="#6D4C41" opacity="0.4" />
      <Ellipse cx="32" cy="48" rx="8" ry="4" fill="#6D4C41" opacity="0.4" />
      <Ellipse cx="50" cy="48" rx="8" ry="4" fill="#6D4C41" opacity="0.4" />
      
      {/* Carton texture */}
      <Path d="M4 46H60" stroke="#5D4037" strokeWidth="0.5" opacity="0.3" />
      <Path d="M4 52H60" stroke="#5D4037" strokeWidth="0.5" opacity="0.3" />
      
      {/* Front lip of carton */}
      <Path d="M4 42H60V44H4V42Z" fill="#A1887F" />
    </G>
    
    {/* Organic eggs in carton */}
    {/* Egg 1 - brown */}
    <G>
      <Ellipse cx="14" cy="34" rx="9" ry="12" fill="url(#organicEggBrown)" />
      <Ellipse cx="11" cy="28" rx="4" ry="5" fill="url(#organicHighlight)" />
      {/* Natural variations */}
      <Circle cx="16" cy="32" r="0.6" fill="#8D6E63" opacity="0.3" />
      <Circle cx="12" cy="38" r="0.5" fill="#6D4C41" opacity="0.2" />
    </G>
    
    {/* Egg 2 - cream */}
    <G>
      <Ellipse cx="32" cy="32" rx="10" ry="14" fill="url(#organicEggCream)" />
      <Ellipse cx="28" cy="24" rx="4" ry="6" fill="url(#organicHighlight)" />
      {/* Natural variations */}
      <Circle cx="35" cy="30" r="0.5" fill="#FFCA28" opacity="0.3" />
    </G>
    
    {/* Egg 3 - brown */}
    <G>
      <Ellipse cx="50" cy="34" rx="9" ry="12" fill="url(#organicEggBrown)" />
      <Ellipse cx="47" cy="28" rx="4" ry="5" fill="url(#organicHighlight)" />
      {/* Natural variations */}
      <Circle cx="52" cy="32" r="0.6" fill="#A1887F" opacity="0.3" />
      <Circle cx="48" cy="38" r="0.4" fill="#8D6E63" opacity="0.2" />
    </G>
    
    {/* Organic leaf badge/label */}
    <G>
      <Circle cx="54" cy="14" r="8" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="1" />
      {/* Leaf inside badge */}
      <Path
        d="M50 14C52 10 58 10 58 14C58 18 54 20 50 18C52 16 52 12 50 14Z"
        fill="url(#leafGreen)"
      />
      <Path d="M52 16L56 12" stroke="#2E7D32" strokeWidth="0.5" fill="none" />
    </G>
    
    {/* Small decorative leaf */}
    <G opacity="0.8">
      <Path
        d="M6 16C8 12 14 12 16 16C16 20 12 22 8 20C10 18 10 14 6 16Z"
        fill="url(#leafGreen)"
      />
      <Path d="M8 18L14 14" stroke="#2E7D32" strokeWidth="0.5" fill="none" />
    </G>
    
    {/* "Free Range" text suggestion with dots */}
    <G opacity="0.5">
      <Circle cx="28" cy="10" r="1" fill="#4CAF50" />
      <Circle cx="32" cy="10" r="1" fill="#4CAF50" />
      <Circle cx="36" cy="10" r="1" fill="#4CAF50" />
    </G>
  </Svg>
);

export default OrganicEggsIllustration;
