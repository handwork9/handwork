import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic duck meat - roasted duck
const DuckMeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="duckSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="30%" stopColor="#8D6E63" />
        <Stop offset="70%" stopColor="#795548" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="duckCrispy" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#6D4C41" />
        <Stop offset="50%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#4E342E" />
      </LinearGradient>
      <LinearGradient id="duckMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="50%" stopColor="#E53935" />
        <Stop offset="100%" stopColor="#C62828" />
      </LinearGradient>
      <LinearGradient id="darkPlate" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#37474F" />
        <Stop offset="50%" stopColor="#263238" />
        <Stop offset="100%" stopColor="#1C313A" />
      </LinearGradient>
      <LinearGradient id="orangeGlaze" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#F57C00" />
      </LinearGradient>
    </Defs>
    
    {/* Dark serving plate */}
    <G>
      <Ellipse cx="32" cy="54" rx="28" ry="8" fill="url(#darkPlate)" />
      <Ellipse cx="32" cy="52" rx="24" ry="5" fill="#263238" />
      {/* Plate shine */}
      <Path d="M14 52C20 50 28 52 36 50" stroke="#455A64" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Half roasted duck (typical presentation) */}
    <G>
      {/* Main body */}
      <Path
        d="M12 26C12 18 20 12 32 12C44 12 52 18 52 26V40C52 46 44 50 32 50C20 50 12 46 12 40V26Z"
        fill="url(#duckSkin)"
      />
      
      {/* Crispy skin top */}
      <Path
        d="M12 26C12 20 20 16 32 16C44 16 52 20 52 26C52 30 44 32 32 32C20 32 12 30 12 26Z"
        fill="url(#duckCrispy)"
      />
      
      {/* Score marks on skin (traditional duck preparation) */}
      <Path d="M18 20L22 28" stroke="#4E342E" strokeWidth="1" opacity="0.5" />
      <Path d="M26 18L28 26" stroke="#4E342E" strokeWidth="1" opacity="0.5" />
      <Path d="M34 18L36 26" stroke="#4E342E" strokeWidth="1" opacity="0.5" />
      <Path d="M42 20L46 28" stroke="#4E342E" strokeWidth="1" opacity="0.5" />
      
      {/* Duck meat visible where carved */}
      <Path
        d="M44 34C48 36 50 42 48 46C44 48 38 46 36 42C34 38 38 34 44 34Z"
        fill="url(#duckMeat)"
      />
      
      {/* Fat layer */}
      <Path
        d="M36 42C38 40 42 40 44 42"
        stroke="#FFF59D"
        strokeWidth="2"
        opacity="0.6"
      />
      
      {/* Skin glaze/shine */}
      <Path d="M18 24C24 22 32 24 38 22" stroke="#A1887F" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </G>
    
    {/* Duck leg */}
    <G>
      <Path
        d="M8 38C4 42 2 50 4 54C8 58 14 56 18 52C20 48 18 42 14 40L8 38Z"
        fill="url(#duckSkin)"
      />
      {/* Crispy skin on leg */}
      <Path d="M8 44C10 46 12 50 12 52" stroke="#5D4037" strokeWidth="0.5" opacity="0.5" />
      {/* Bone */}
      <Path d="M4 54L2 58" stroke="#D7CCC8" strokeWidth="2" strokeLinecap="round" />
    </G>
    
    {/* Orange glaze drizzle */}
    <G>
      <Path
        d="M24 32C26 34 30 32 32 34C34 36 38 34 40 36"
        stroke="url(#orangeGlaze)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </G>
    
    {/* Garnish */}
    <G>
      {/* Orange segments */}
      <Path
        d="M50 44C52 42 56 42 58 44C58 48 54 50 50 48C52 46 52 44 50 44Z"
        fill="#FFB74D"
      />
      <Path d="M52 46L56 44" stroke="#F57C00" strokeWidth="0.5" />
      
      {/* Star anise */}
      <G>
        <Circle cx="56" cy="52" r="3" fill="#5D4037" />
        <Circle cx="56" cy="52" r="1.5" fill="#4E342E" />
        {/* Star points */}
        <Circle cx="56" cy="49" r="1" fill="#6D4C41" />
        <Circle cx="59" cy="51" r="1" fill="#6D4C41" />
        <Circle cx="58" cy="54" r="1" fill="#6D4C41" />
        <Circle cx="54" cy="54" r="1" fill="#6D4C41" />
        <Circle cx="53" cy="51" r="1" fill="#6D4C41" />
      </G>
      
      {/* Green onion */}
      <Path d="M18 50L22 46" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <Path d="M20 48L24 44" stroke="#66BB6A" strokeWidth="1.5" strokeLinecap="round" />
    </G>
  </Svg>
);

export default DuckMeatIllustration;
