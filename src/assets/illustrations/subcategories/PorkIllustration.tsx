import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const PorkIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="porkMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFAB91" />
        <Stop offset="30%" stopColor="#FF8A65" />
        <Stop offset="70%" stopColor="#FF7043" />
        <Stop offset="100%" stopColor="#F4511E" />
      </LinearGradient>
      <LinearGradient id="porkFat" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#FAFAFA" />
        <Stop offset="100%" stopColor="#F5F5F5" />
      </LinearGradient>
      <LinearGradient id="porkSkin" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="50%" stopColor="#FFB74D" />
        <Stop offset="100%" stopColor="#FFA726" />
      </LinearGradient>
      <LinearGradient id="grilledMarks" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#3E2723" />
      </LinearGradient>
      <LinearGradient id="plateSurface" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#455A64" />
        <Stop offset="50%" stopColor="#37474F" />
        <Stop offset="100%" stopColor="#263238" />
      </LinearGradient>
    </Defs>
    
    {/* Dark slate plate */}
    <G>
      <Ellipse cx="32" cy="52" rx="28" ry="8" fill="url(#plateSurface)" />
      <Ellipse cx="32" cy="50" rx="26" ry="6" fill="#37474F" />
      {/* Plate shine */}
      <Path d="M12 50C18 48 26 50 32 48" stroke="#546E7A" strokeWidth="1" opacity="0.4" />
    </G>
    
    {/* Pork belly slice */}
    <G>
      {/* Crispy skin layer */}
      <Path
        d="M8 20H48C50 20 52 22 52 24V28C52 30 50 32 48 32H8C6 32 4 30 4 28V24C4 22 6 20 8 20Z"
        fill="url(#porkSkin)"
      />
      {/* Skin crackling texture */}
      <Path d="M8 24H48" stroke="#E65100" strokeWidth="0.5" opacity="0.5" />
      <Path d="M8 28H48" stroke="#E65100" strokeWidth="0.5" opacity="0.5" />
      
      {/* Fat layer */}
      <Rect x="4" y="32" width="48" height="8" fill="url(#porkFat)" />
      
      {/* Meat layer */}
      <Path
        d="M4 40H52V50C52 52 50 54 48 54H8C6 54 4 52 4 50V40Z"
        fill="url(#porkMeat)"
      />
      
      {/* Meat grain lines */}
      <Path d="M8 44C14 42 22 46 28 44C34 42 42 46 48 44" stroke="#E64A19" strokeWidth="0.8" fill="none" opacity="0.4" />
      <Path d="M8 48C14 46 22 50 28 48C34 46 42 50 48 48" stroke="#E64A19" strokeWidth="0.6" fill="none" opacity="0.3" />
      
      {/* Grill marks */}
      <Path d="M10 22L14 30" stroke="url(#grilledMarks)" strokeWidth="2" opacity="0.6" />
      <Path d="M22 22L26 30" stroke="url(#grilledMarks)" strokeWidth="2" opacity="0.6" />
      <Path d="M34 22L38 30" stroke="url(#grilledMarks)" strokeWidth="2" opacity="0.6" />
      <Path d="M46 22L50 30" stroke="url(#grilledMarks)" strokeWidth="2" opacity="0.6" />
      
      {/* Fat marbling in meat */}
      <Circle cx="16" cy="46" r="1.5" fill="#FFCCBC" opacity="0.5" />
      <Circle cx="32" cy="44" r="1.2" fill="#FFCCBC" opacity="0.4" />
      <Circle cx="44" cy="48" r="1" fill="#FFCCBC" opacity="0.4" />
    </G>
    
    {/* Second smaller piece */}
    <G>
      <Rect x="54" y="28" width="8" height="20" rx="1" fill="url(#porkMeat)" />
      <Rect x="54" y="24" width="8" height="4" fill="url(#porkFat)" />
      <Rect x="54" y="20" width="8" height="4" rx="1" fill="url(#porkSkin)" />
      {/* Grill mark */}
      <Path d="M56 22L60 26" stroke="url(#grilledMarks)" strokeWidth="1.5" opacity="0.5" />
    </G>
    
    {/* Glaze/sauce drizzle */}
    <G opacity="0.6">
      <Path d="M14 36C16 38 18 36 20 38" stroke="#6D4C41" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M36 36C38 38 40 36 42 38" stroke="#6D4C41" strokeWidth="1.5" strokeLinecap="round" />
    </G>
  </Svg>
);

export default PorkIllustration;
