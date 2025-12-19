import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const YogurtIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="yogurtCup" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E1BEE7" />
        <Stop offset="50%" stopColor="#F3E5F5" />
        <Stop offset="100%" stopColor="#CE93D8" />
      </LinearGradient>
      <LinearGradient id="yogurtContent" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="100%" stopColor="#F5F5F5" />
      </LinearGradient>
      <LinearGradient id="fruitSwirl" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E91E63" />
        <Stop offset="100%" stopColor="#AD1457" />
      </LinearGradient>
      <LinearGradient id="lidFoil" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#B0BEC5" />
        <Stop offset="30%" stopColor="#ECEFF1" />
        <Stop offset="70%" stopColor="#CFD8DC" />
        <Stop offset="100%" stopColor="#90A4AE" />
      </LinearGradient>
      <LinearGradient id="spoonHandle" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#BDBDBD" />
        <Stop offset="50%" stopColor="#FAFAFA" />
        <Stop offset="100%" stopColor="#9E9E9E" />
      </LinearGradient>
    </Defs>
    
    {/* Yogurt Cup */}
    <G>
      {/* Cup body */}
      <Path
        d="M10 22C10 20 12 18 14 18H42C44 18 46 20 46 22V52C46 56 42 58 38 58H18C14 58 10 56 10 52V22Z"
        fill="url(#yogurtCup)"
        stroke="#BA68C8"
        strokeWidth="0.5"
      />
      
      {/* Cup rim */}
      <Path
        d="M8 18H48V22C48 22 46 24 42 24H14C10 24 8 22 8 22V18Z"
        fill="#F3E5F5"
        stroke="#CE93D8"
        strokeWidth="0.5"
      />
      <Ellipse cx="28" cy="18" rx="20" ry="3" fill="url(#lidFoil)" />
      
      {/* Peeled back lid */}
      <Path
        d="M38 14C42 12 46 14 48 18L44 20C42 16 40 15 38 16V14Z"
        fill="url(#lidFoil)"
        stroke="#78909C"
        strokeWidth="0.3"
      />
      
      {/* Yogurt inside */}
      <Ellipse cx="28" cy="22" rx="16" ry="4" fill="url(#yogurtContent)" />
      
      {/* Fruit swirl on top */}
      <Path
        d="M20 22C22 20 26 24 28 22C30 20 34 24 36 22"
        stroke="url(#fruitSwirl)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="22" cy="22" r="1.5" fill="#E91E63" />
      <Circle cx="34" cy="21" r="1" fill="#E91E63" />
      <Circle cx="28" cy="23" r="0.8" fill="#E91E63" />
      
      {/* Fruit pieces */}
      <Circle cx="24" cy="21" r="2" fill="#EC407A" opacity="0.8" />
      <Circle cx="32" cy="22" r="1.5" fill="#F06292" opacity="0.7" />
      
      {/* Label on cup */}
      <Rect x="14" y="32" width="28" height="16" rx="2" fill="#F3E5F5" opacity="0.8" />
      <Path d="M20 38C22 36 26 40 28 38C30 36 34 40 36 38" stroke="#9C27B0" strokeWidth="1" fill="none" />
      <Circle cx="28" cy="42" r="3" fill="#9C27B0" opacity="0.3" />
      
      {/* Cup shine */}
      <Path
        d="M12 26V50"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </G>
    
    {/* Spoon */}
    <G>
      {/* Spoon bowl */}
      <Ellipse cx="54" cy="36" rx="6" ry="4" fill="url(#spoonHandle)" />
      <Ellipse cx="54" cy="35" rx="4" ry="2.5" fill="#FAFAFA" />
      
      {/* Yogurt on spoon */}
      <Ellipse cx="54" cy="35" rx="3" ry="2" fill="#F5F5F5" />
      <Circle cx="53" cy="34" r="0.8" fill="#E91E63" opacity="0.6" />
      
      {/* Spoon handle */}
      <Path
        d="M54 40L56 58"
        stroke="url(#spoonHandle)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Handle shine */}
      <Path
        d="M55 42L56 54"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.5"
      />
    </G>
  </Svg>
);

export default YogurtIllustration;
