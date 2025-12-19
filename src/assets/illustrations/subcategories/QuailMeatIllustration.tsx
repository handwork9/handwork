import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Quail meat - small roasted quails
const QuailMeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="quailSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="30%" stopColor="#FFB74D" />
        <Stop offset="70%" stopColor="#FFA726" />
        <Stop offset="100%" stopColor="#FB8C00" />
      </LinearGradient>
      <LinearGradient id="quailBrown" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="50%" stopColor="#8D6E63" />
        <Stop offset="100%" stopColor="#795548" />
      </LinearGradient>
      <LinearGradient id="skewer" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="grillPlate" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#424242" />
        <Stop offset="50%" stopColor="#303030" />
        <Stop offset="100%" stopColor="#212121" />
      </LinearGradient>
    </Defs>
    
    {/* Grill plate/slate */}
    <G>
      <Rect x="2" y="46" width="60" height="14" rx="2" fill="url(#grillPlate)" />
      {/* Grill lines */}
      <Path d="M6 50H58" stroke="#1A1A1A" strokeWidth="1" opacity="0.5" />
      <Path d="M6 54H58" stroke="#1A1A1A" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Wooden skewer through quails */}
    <Path d="M0 34L64 30" stroke="url(#skewer)" strokeWidth="3" strokeLinecap="round" />
    
    {/* First quail (left) */}
    <G>
      {/* Body */}
      <Ellipse cx="16" cy="34" rx="10" ry="8" fill="url(#quailSkin)" />
      
      {/* Crispy breast */}
      <Ellipse cx="16" cy="32" rx="6" ry="4" fill="url(#quailBrown)" opacity="0.5" />
      
      {/* Wings */}
      <Path
        d="M10 30C8 32 8 36 10 38C12 38 14 36 14 34"
        fill="#FFA726"
      />
      <Path
        d="M22 30C24 32 24 36 22 38C20 38 18 36 18 34"
        fill="#FFA726"
      />
      
      {/* Legs */}
      <Path d="M12 40L10 46" stroke="url(#quailSkin)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M20 40L22 46" stroke="url(#quailSkin)" strokeWidth="2" strokeLinecap="round" />
      
      {/* Char marks */}
      <Path d="M12 32L14 36" stroke="#795548" strokeWidth="1" opacity="0.4" />
      <Path d="M18 32L20 36" stroke="#795548" strokeWidth="1" opacity="0.4" />
      
      {/* Glaze shine */}
      <Path d="M12 30C14 28 18 30 20 28" stroke="#FFE082" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Second quail (center) */}
    <G>
      {/* Body */}
      <Ellipse cx="34" cy="32" rx="10" ry="8" fill="url(#quailSkin)" />
      
      {/* Crispy breast */}
      <Ellipse cx="34" cy="30" rx="6" ry="4" fill="url(#quailBrown)" opacity="0.5" />
      
      {/* Wings */}
      <Path
        d="M28 28C26 30 26 34 28 36C30 36 32 34 32 32"
        fill="#FFA726"
      />
      <Path
        d="M40 28C42 30 42 34 40 36C38 36 36 34 36 32"
        fill="#FFA726"
      />
      
      {/* Legs */}
      <Path d="M30 38L28 46" stroke="url(#quailSkin)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M38 38L40 46" stroke="url(#quailSkin)" strokeWidth="2" strokeLinecap="round" />
      
      {/* Char marks */}
      <Path d="M30 30L32 34" stroke="#795548" strokeWidth="1" opacity="0.4" />
      <Path d="M36 30L38 34" stroke="#795548" strokeWidth="1" opacity="0.4" />
      
      {/* Glaze shine */}
      <Path d="M30 28C32 26 36 28 38 26" stroke="#FFE082" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Third quail (right) */}
    <G>
      {/* Body */}
      <Ellipse cx="52" cy="30" rx="10" ry="8" fill="url(#quailSkin)" />
      
      {/* Crispy breast */}
      <Ellipse cx="52" cy="28" rx="6" ry="4" fill="url(#quailBrown)" opacity="0.5" />
      
      {/* Wings */}
      <Path
        d="M46 26C44 28 44 32 46 34C48 34 50 32 50 30"
        fill="#FFA726"
      />
      <Path
        d="M58 26C60 28 60 32 58 34C56 34 54 32 54 30"
        fill="#FFA726"
      />
      
      {/* Legs */}
      <Path d="M48 36L46 44" stroke="url(#quailSkin)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M56 36L58 44" stroke="url(#quailSkin)" strokeWidth="2" strokeLinecap="round" />
      
      {/* Char marks */}
      <Path d="M48 28L50 32" stroke="#795548" strokeWidth="1" opacity="0.4" />
      <Path d="M54 28L56 32" stroke="#795548" strokeWidth="1" opacity="0.4" />
      
      {/* Glaze shine */}
      <Path d="M48 26C50 24 54 26 56 24" stroke="#FFE082" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Garnish */}
    <G>
      {/* Lemon wedge */}
      <Path
        d="M4 52C6 50 10 50 12 52C12 56 8 58 4 56C6 54 6 52 4 52Z"
        fill="#FFF59D"
      />
      <Path d="M6 54L10 52" stroke="#FBC02D" strokeWidth="0.5" />
      
      {/* Herbs */}
      <Path d="M54 52C56 50 60 50 62 52C62 54 58 56 54 54" fill="#66BB6A" />
      <Path d="M56 53L60 51" stroke="#388E3C" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default QuailMeatIllustration;
