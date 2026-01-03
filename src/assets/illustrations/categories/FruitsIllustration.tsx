import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic fruits illustration - apple, orange, banana, grapes
const FruitsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FF9800' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Apple gradients */}
      <RadialGradient id="fruitAppleMain" cx="35%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#FF5252" />
        <Stop offset="50%" stopColor="#E53935" />
        <Stop offset="100%" stopColor="#B71C1C" />
      </RadialGradient>
      <RadialGradient id="fruitAppleShine" cx="25%" cy="25%" r="40%">
        <Stop offset="0%" stopColor="#FFCDD2" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="#FFCDD2" stopOpacity="0" />
      </RadialGradient>
      
      {/* Orange gradients */}
      <RadialGradient id="fruitOrangeMain" cx="40%" cy="35%" r="60%">
        <Stop offset="0%" stopColor="#FFB74D" />
        <Stop offset="50%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#E65100" />
      </RadialGradient>
      
      {/* Banana gradients */}
      <LinearGradient id="fruitBananaMain" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF176" />
        <Stop offset="50%" stopColor="#FFEB3B" />
        <Stop offset="100%" stopColor="#FBC02D" />
      </LinearGradient>
      
      {/* Grape gradients */}
      <RadialGradient id="fruitGrapeMain" cx="40%" cy="35%" r="55%">
        <Stop offset="0%" stopColor="#BA68C8" />
        <Stop offset="50%" stopColor="#9C27B0" />
        <Stop offset="100%" stopColor="#6A1B9A" />
      </RadialGradient>
    </Defs>
    
    {/* Grapes cluster - back left */}
    <G>
      {/* Stem */}
      <Path d="M12 12C14 14 16 18 16 22" stroke="#8D6E63" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M16 22L14 26" stroke="#6D4C41" strokeWidth="1" strokeLinecap="round" />
      <Path d="M16 22L18 26" stroke="#6D4C41" strokeWidth="1" strokeLinecap="round" />
      {/* Grape balls */}
      <Circle cx="10" cy="30" r="5" fill="url(#fruitGrapeMain)" />
      <Circle cx="18" cy="30" r="5" fill="url(#fruitGrapeMain)" />
      <Circle cx="14" cy="36" r="5" fill="url(#fruitGrapeMain)" />
      <Circle cx="22" cy="34" r="4.5" fill="url(#fruitGrapeMain)" />
      <Circle cx="8" cy="38" r="4" fill="url(#fruitGrapeMain)" />
      <Circle cx="16" cy="42" r="4.5" fill="url(#fruitGrapeMain)" />
      <Circle cx="12" cy="46" r="4" fill="url(#fruitGrapeMain)" />
      {/* Highlights on grapes */}
      <Circle cx="9" cy="28" r="1.5" fill="#E1BEE7" opacity="0.5" />
      <Circle cx="17" cy="28" r="1.5" fill="#E1BEE7" opacity="0.5" />
      <Circle cx="13" cy="34" r="1.5" fill="#E1BEE7" opacity="0.5" />
      {/* Leaf */}
      <Path d="M12 12C8 10 6 14 8 18C10 16 14 14 12 12Z" fill="#81C784" />
    </G>
    
    {/* Apple - center */}
    <G>
      <Path
        d="M34 22C28 24 26 32 28 40C30 48 36 52 42 50C44 50 46 48 48 48C50 48 52 50 54 50C60 52 66 48 68 40C70 32 68 24 62 22C58 20 54 24 48 24C42 24 38 20 34 22Z"
        fill="url(#fruitAppleMain)"
        transform="translate(-14, 4) scale(0.85)"
      />
      {/* Apple dent at top */}
      <Path d="M37 28C38 26 40 26 41 28" stroke="#B71C1C" strokeWidth="0.5" opacity="0.3" />
      {/* Highlight */}
      <Ellipse cx="32" cy="34" rx="4" ry="5" fill="url(#fruitAppleShine)" />
      {/* Stem */}
      <Path d="M38 26L40 20" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
      {/* Leaf */}
      <Path d="M40 20C42 18 46 18 48 20C46 22 42 22 40 20Z" fill="#66BB6A" />
      <Path d="M41 20C43 20 45 20 46 20" stroke="#388E3C" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Orange - bottom right */}
    <G>
      <Circle cx="52" cy="48" r="12" fill="url(#fruitOrangeMain)" />
      {/* Orange texture (dimples) */}
      <Circle cx="48" cy="44" r="0.5" fill="#E65100" opacity="0.2" />
      <Circle cx="52" cy="42" r="0.5" fill="#E65100" opacity="0.2" />
      <Circle cx="56" cy="46" r="0.5" fill="#E65100" opacity="0.2" />
      <Circle cx="50" cy="50" r="0.5" fill="#E65100" opacity="0.2" />
      <Circle cx="54" cy="52" r="0.5" fill="#E65100" opacity="0.2" />
      <Circle cx="48" cy="52" r="0.5" fill="#E65100" opacity="0.2" />
      {/* Highlight */}
      <Ellipse cx="48" cy="43" rx="3" ry="2.5" fill="#FFE0B2" opacity="0.5" />
      {/* Stem nub */}
      <Ellipse cx="52" cy="36.5" rx="2" ry="1" fill="#8BC34A" />
      <Circle cx="52" cy="36" r="1" fill="#689F38" />
    </G>
    
    {/* Banana - bottom left */}
    <G>
      <Path
        d="M4 56C4 56 8 48 16 46C24 44 32 48 34 52C30 54 22 58 14 58C8 58 4 56 4 56Z"
        fill="url(#fruitBananaMain)"
      />
      {/* Banana ridge line */}
      <Path d="M8 54C14 50 24 50 30 52" stroke="#F9A825" strokeWidth="0.5" opacity="0.4" />
      {/* Brown tip */}
      <Ellipse cx="5" cy="56" rx="2" ry="1.5" fill="#795548" />
      <Ellipse cx="33" cy="52" rx="1.5" ry="1" fill="#795548" />
      {/* Highlight */}
      <Path d="M10 52C16 50 24 50 28 52" stroke="#FFF9C4" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
    </G>
  </Svg>
);

export default FruitsIllustration;
