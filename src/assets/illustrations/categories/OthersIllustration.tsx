import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect, Polygon, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Miscellaneous / Other products illustration - basket with mixed items
const OthersIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#78909C' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Basket gradient */}
      <LinearGradient id="otherBasket" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#90A4AE" />
        <Stop offset="50%" stopColor="#78909C" />
        <Stop offset="100%" stopColor="#546E7A" />
      </LinearGradient>
      
      {/* Apple gradient */}
      <RadialGradient id="otherApple" cx="35%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="50%" stopColor="#E53935" />
        <Stop offset="100%" stopColor="#C62828" />
      </RadialGradient>
      
      {/* Carrot gradient */}
      <LinearGradient id="otherCarrot" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      
      {/* Bread gradient */}
      <RadialGradient id="otherBread" cx="50%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFE0B2" />
        <Stop offset="50%" stopColor="#FFCC80" />
        <Stop offset="100%" stopColor="#FFB74D" />
      </RadialGradient>
      
      {/* Leaf gradient */}
      <LinearGradient id="otherLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="100%" stopColor="#43A047" />
      </LinearGradient>
    </Defs>
    
    {/* Shopping basket */}
    <G>
      <Path
        d="M8 28H56L52 54H12L8 28Z"
        fill="url(#otherBasket)"
      />
      {/* Basket rim */}
      <Path
        d="M8 28H56V32H8V28Z"
        fill="#90A4AE"
      />
      {/* Basket rim highlight */}
      <Path d="M8 28H56V29H8V28Z" fill="#B0BEC5" opacity="0.5" />
      
      {/* Basket handle */}
      <Path
        d="M20 28C20 28 20 16 32 16C44 16 44 28 44 28"
        stroke="#546E7A"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Handle highlight */}
      <Path
        d="M22 26C22 26 22 18 32 18C42 18 42 26 42 26"
        stroke="#78909C"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Basket weave pattern */}
      <G opacity="0.25">
        <Path d="M12 36H52" stroke="#455A64" strokeWidth="2" />
        <Path d="M14 44H50" stroke="#455A64" strokeWidth="2" />
        <Path d="M20 32V52" stroke="#455A64" strokeWidth="2" />
        <Path d="M32 32V52" stroke="#455A64" strokeWidth="2" />
        <Path d="M44 32V52" stroke="#455A64" strokeWidth="2" />
      </G>
    </G>
    
    {/* Items peeking out of basket */}
    <G>
      {/* Carrot */}
      <Path
        d="M16 28L18 18"
        stroke="url(#otherCarrot)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Carrot top */}
      <Path
        d="M15 16L18 12L21 16"
        stroke="#4CAF50"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M18 16V13" stroke="#66BB6A" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Apple */}
      <Circle cx="28" cy="22" r="6" fill="url(#otherApple)" />
      <Path d="M28 16V14" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" />
      <Ellipse cx="30" cy="15" rx="2.5" ry="1.5" fill="url(#otherLeaf)" />
      {/* Apple highlight */}
      <Circle cx="26" cy="20" r="1.5" fill="#FFCDD2" opacity="0.4" />
      
      {/* Bread loaf */}
      <Ellipse cx="42" cy="22" rx="7" ry="5" fill="url(#otherBread)" />
      <Path d="M37 20C39 18 45 18 47 20" stroke="#F57C00" strokeWidth="1" opacity="0.5" />
      {/* Bread score marks */}
      <Path d="M39 22L40 20" stroke="#F57C00" strokeWidth="0.8" opacity="0.4" />
      <Path d="M42 22L43 20" stroke="#F57C00" strokeWidth="0.8" opacity="0.4" />
      <Path d="M45 22L46 20" stroke="#F57C00" strokeWidth="0.8" opacity="0.4" />
      
      {/* Leafy vegetable */}
      <Path
        d="M52 24C52 24 50 18 54 14C58 18 56 24 56 24C56 24 54 26 52 24Z"
        fill="url(#otherLeaf)"
      />
      <Path d="M54 14V24" stroke="#388E3C" strokeWidth="1" />
      {/* Leaf veins */}
      <Path d="M54 16L52 18" stroke="#388E3C" strokeWidth="0.5" opacity="0.5" />
      <Path d="M54 16L56 18" stroke="#388E3C" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Question mark / variety indicator */}
    <G opacity="0.3">
      <Circle cx="32" cy="44" r="6" fill="#455A64" />
      <Path d="M30 42C30 40 32 39 34 40C36 41 34 44 32 44" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Circle cx="32" cy="47" r="1" fill="#FFFFFF" />
    </G>
  </Svg>
);

export default OthersIllustration;
