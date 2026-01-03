import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic nuts & seeds illustration - peanut, almond, walnut, sunflower seeds
const NutsSeedsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#8D6E63' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Peanut shell gradient */}
      <RadialGradient id="nutPeanutShell" cx="40%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#D4A373" />
        <Stop offset="50%" stopColor="#BC6C25" />
        <Stop offset="100%" stopColor="#9C5819" />
      </RadialGradient>
      
      {/* Almond gradient */}
      <RadialGradient id="nutAlmond" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#E8D4B8" />
        <Stop offset="40%" stopColor="#D4A574" />
        <Stop offset="100%" stopColor="#A67B5B" />
      </RadialGradient>
      
      {/* Walnut shell gradient */}
      <RadialGradient id="nutWalnut" cx="40%" cy="35%" r="65%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#4E342E" />
      </RadialGradient>
      
      {/* Walnut meat gradient */}
      <RadialGradient id="nutWalnutMeat" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#A1887F" />
      </RadialGradient>
      
      {/* Sunflower seed gradient */}
      <LinearGradient id="nutSunflower" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#455A64" />
        <Stop offset="50%" stopColor="#37474F" />
        <Stop offset="100%" stopColor="#263238" />
      </LinearGradient>
    </Defs>
    
    {/* Peanut in shell - left */}
    <G>
      {/* Top lobe */}
      <Ellipse cx="18" cy="22" rx="9" ry="7" fill="url(#nutPeanutShell)" />
      {/* Bottom lobe */}
      <Ellipse cx="18" cy="36" rx="9" ry="7" fill="url(#nutPeanutShell)" />
      {/* Center pinch */}
      <Ellipse cx="18" cy="29" rx="5" ry="4" fill="#A67B5B" />
      {/* Shell texture lines */}
      <Path d="M12 22C12 22 10 29 12 36" stroke="#8D6E63" strokeWidth="0.8" opacity="0.4" />
      <Path d="M24 22C24 22 26 29 24 36" stroke="#8D6E63" strokeWidth="0.8" opacity="0.4" />
      <Path d="M15 16C15 16 14 22 15 28" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      <Path d="M21 16C21 16 22 22 21 28" stroke="#6D4C41" strokeWidth="0.5" opacity="0.3" />
      {/* Highlight */}
      <Ellipse cx="15" cy="20" rx="3" ry="2" fill="#E8D4B8" opacity="0.3" />
    </G>
    
    {/* Almond - center */}
    <G>
      <Path
        d="M40 16C36 12 34 18 34 26C34 34 38 40 42 40C46 40 48 34 48 26C48 18 46 12 42 16L40 16Z"
        fill="url(#nutAlmond)"
      />
      {/* Almond texture */}
      <Path d="M42 18V38" stroke="#8D6E63" strokeWidth="0.6" opacity="0.3" />
      {/* Almond highlight */}
      <Ellipse cx="40" cy="26" rx="3" ry="8" fill="#F5F0E6" opacity="0.3" />
      {/* Skin texture dots */}
      <Circle cx="38" cy="24" r="0.5" fill="#6D4C41" opacity="0.2" />
      <Circle cx="44" cy="28" r="0.5" fill="#6D4C41" opacity="0.2" />
      <Circle cx="40" cy="32" r="0.5" fill="#6D4C41" opacity="0.2" />
    </G>
    
    {/* Walnut - right side */}
    <G>
      {/* Walnut shell */}
      <Circle cx="56" cy="24" r="9" fill="url(#nutWalnut)" />
      {/* Walnut brain-like pattern */}
      <Path
        d="M50 24C52 20 56 20 58 24C60 20 56 28 56 28C56 28 52 28 50 24Z"
        fill="url(#nutWalnutMeat)"
      />
      <Path d="M56 16V32" stroke="#5D4037" strokeWidth="1.2" opacity="0.5" />
      {/* Texture grooves */}
      <Path d="M52 20C53 22 55 22 56 20" stroke="#4E342E" strokeWidth="0.5" opacity="0.4" />
      <Path d="M56 20C57 22 59 22 60 20" stroke="#4E342E" strokeWidth="0.5" opacity="0.4" />
      <Path d="M52 28C53 26 55 26 56 28" stroke="#4E342E" strokeWidth="0.5" opacity="0.4" />
      <Path d="M56 28C57 26 59 26 60 28" stroke="#4E342E" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Sunflower seeds - bottom */}
    <G>
      <Ellipse cx="14" cy="54" rx="4" ry="6" fill="url(#nutSunflower)" transform="rotate(-15 14 54)" />
      <Path d="M13 50L15 58" stroke="#CFD8DC" strokeWidth="0.8" opacity="0.6" />
      
      <Ellipse cx="24" cy="52" rx="3.5" ry="5.5" fill="url(#nutSunflower)" transform="rotate(10 24 52)" />
      <Path d="M23 48L25 56" stroke="#CFD8DC" strokeWidth="0.7" opacity="0.6" />
      
      <Ellipse cx="34" cy="54" rx="4" ry="6" fill="url(#nutSunflower)" transform="rotate(-8 34 54)" />
      <Path d="M33 50L35 58" stroke="#CFD8DC" strokeWidth="0.8" opacity="0.6" />
    </G>
    
    {/* Pumpkin seeds - bottom right */}
    <G>
      <Ellipse cx="46" cy="52" rx="5" ry="3" fill="#F5F5DC" transform="rotate(20 46 52)" />
      <Path d="M43 52L49 52" stroke="#E8E8C8" strokeWidth="0.5" opacity="0.6" />
      
      <Ellipse cx="56" cy="54" rx="4.5" ry="2.5" fill="#F5F5DC" transform="rotate(-10 56 54)" />
      <Path d="M53 54L59 54" stroke="#E8E8C8" strokeWidth="0.5" opacity="0.6" />
    </G>
  </Svg>
);

export default NutsSeedsIllustration;
