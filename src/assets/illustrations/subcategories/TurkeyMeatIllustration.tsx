import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic turkey meat - roasted turkey
const TurkeyMeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="turkeySkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="30%" stopColor="#BCAAA4" />
        <Stop offset="70%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <LinearGradient id="turkeyGolden" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#795548" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="turkeyMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCCBC" />
        <Stop offset="50%" stopColor="#FFAB91" />
        <Stop offset="100%" stopColor="#FF8A65" />
      </LinearGradient>
      <LinearGradient id="platter" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="50%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFE082" />
      </LinearGradient>
      <LinearGradient id="turkeyBone" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
    </Defs>
    
    {/* Large serving platter */}
    <G>
      <Ellipse cx="32" cy="54" rx="30" ry="9" fill="url(#platter)" />
      <Ellipse cx="32" cy="52" rx="26" ry="6" fill="#FFF8E1" />
      {/* Platter rim */}
      <Ellipse cx="32" cy="54" rx="30" ry="9" fill="none" stroke="#FFD54F" strokeWidth="1" />
    </G>
    
    {/* Large roasted turkey body */}
    <G>
      {/* Main body - larger than chicken */}
      <Ellipse cx="32" cy="34" rx="24" ry="18" fill="url(#turkeySkin)" />
      
      {/* Breast area */}
      <Ellipse cx="32" cy="30" rx="16" ry="12" fill="url(#turkeyGolden)" opacity="0.7" />
      
      {/* Crispy skin texture */}
      <Path d="M16 28C22 26 30 30 38 28C46 26 50 28 50 30" stroke="#6D4C41" strokeWidth="0.8" fill="none" opacity="0.4" />
      <Path d="M14 36C20 34 28 38 36 36C44 34 52 36 52 38" stroke="#5D4037" strokeWidth="0.6" fill="none" opacity="0.3" />
      
      {/* Skin shine/glaze */}
      <Path d="M20 26C26 24 34 26 40 24" stroke="#D7CCC8" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </G>
    
    {/* Left turkey leg - larger */}
    <G>
      <Path
        d="M10 42C4 46 0 54 2 58C4 62 10 62 16 58C20 54 20 48 16 44L10 42Z"
        fill="url(#turkeySkin)"
      />
      {/* Bone end with paper frill */}
      <Path d="M2 58L-2 62" stroke="url(#turkeyBone)" strokeWidth="4" strokeLinecap="round" />
      {/* Paper frill */}
      <G>
        <Path d="M-4 60C-6 58 -8 60 -6 62C-4 64 -2 62 -4 60Z" fill="#FFFFFF" />
        <Path d="M-2 62C-4 60 -6 62 -4 64C-2 66 0 64 -2 62Z" fill="#FAFAFA" />
      </G>
    </G>
    
    {/* Right turkey leg - larger */}
    <G>
      <Path
        d="M54 42C60 46 64 54 62 58C60 62 54 62 48 58C44 54 44 48 48 44L54 42Z"
        fill="url(#turkeySkin)"
      />
      {/* Bone end with paper frill */}
      <Path d="M62 58L66 62" stroke="url(#turkeyBone)" strokeWidth="4" strokeLinecap="round" />
      {/* Paper frill */}
      <G>
        <Path d="M68 60C70 58 72 60 70 62C68 64 66 62 68 60Z" fill="#FFFFFF" />
        <Path d="M66 62C68 60 70 62 68 64C66 66 64 64 66 62Z" fill="#FAFAFA" />
      </G>
    </G>
    
    {/* Stuffing visible */}
    <G>
      <Ellipse cx="32" cy="44" rx="8" ry="4" fill="#8D6E63" opacity="0.6" />
      <Circle cx="30" cy="44" r="1.5" fill="#A1887F" />
      <Circle cx="34" cy="43" r="1" fill="#6D4C41" />
    </G>
    
    {/* Garnish */}
    <G>
      {/* Cranberries */}
      <Circle cx="14" cy="52" r="2.5" fill="#C62828" />
      <Circle cx="18" cy="54" r="2" fill="#D32F2F" />
      <Circle cx="16" cy="50" r="1.8" fill="#B71C1C" />
      
      {/* Orange slice */}
      <G>
        <Circle cx="50" cy="52" r="4" fill="#FF9800" />
        <Circle cx="50" cy="52" r="3" fill="#FFB74D" />
        <Path d="M50 49V55M47 52H53" stroke="#F57C00" strokeWidth="0.5" />
      </G>
      
      {/* Herbs */}
      <Path d="M36 50C38 48 42 48 44 50C44 52 40 54 36 52C38 50 38 48 36 50Z" fill="#66BB6A" />
      <Path d="M38 51L42 49" stroke="#388E3C" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default TurkeyMeatIllustration;
