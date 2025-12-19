import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const LambIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="lambMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="30%" stopColor="#E53935" />
        <Stop offset="70%" stopColor="#D32F2F" />
        <Stop offset="100%" stopColor="#C62828" />
      </LinearGradient>
      <LinearGradient id="lambFat" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="50%" stopColor="#FAFAFA" />
        <Stop offset="100%" stopColor="#F5F5F5" />
      </LinearGradient>
      <LinearGradient id="lambBone" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
      <LinearGradient id="woodPlate" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
    </Defs>
    
    {/* Wooden serving board */}
    <G>
      <Rect x="2" y="42" width="60" height="18" rx="3" fill="url(#woodPlate)" />
      {/* Wood grain */}
      <Path d="M4 46H60" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      <Path d="M4 50H60" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      <Path d="M4 54H60" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      {/* Handle hole */}
      <Circle cx="56" cy="50" r="3" fill="#4E342E" />
    </G>
    
    {/* Lamb rack (multiple chops connected) */}
    <G>
      {/* Base meat section */}
      <Path
        d="M8 28C8 22 14 16 26 16C38 16 44 22 44 28V40C44 44 38 48 26 48C14 48 8 44 8 40V28Z"
        fill="url(#lambMeat)"
      />
      
      {/* Fat cap */}
      <Path
        d="M8 28C8 24 14 20 26 20C38 20 44 24 44 28C44 30 38 32 26 32C14 32 8 30 8 28Z"
        fill="url(#lambFat)"
      />
      
      {/* Rib bones */}
      <G>
        <Path d="M12 22L8 8" stroke="url(#lambBone)" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="8" cy="8" r="2" fill="#D7CCC8" />
        
        <Path d="M20 20L18 6" stroke="url(#lambBone)" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="18" cy="6" r="2" fill="#D7CCC8" />
        
        <Path d="M28 20L28 6" stroke="url(#lambBone)" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="28" cy="6" r="2" fill="#D7CCC8" />
        
        <Path d="M36 20L38 6" stroke="url(#lambBone)" strokeWidth="3" strokeLinecap="round" />
        <Circle cx="38" cy="6" r="2" fill="#D7CCC8" />
      </G>
      
      {/* Meat sections between ribs */}
      <Path d="M14 26V42" stroke="#C62828" strokeWidth="0.5" opacity="0.4" />
      <Path d="M24 24V44" stroke="#C62828" strokeWidth="0.5" opacity="0.4" />
      <Path d="M34 26V42" stroke="#C62828" strokeWidth="0.5" opacity="0.4" />
      
      {/* Marbling */}
      <Circle cx="18" cy="36" r="1.5" fill="#FFCDD2" opacity="0.5" />
      <Circle cx="30" cy="38" r="1.2" fill="#FFCDD2" opacity="0.4" />
      <Circle cx="22" cy="42" r="1" fill="#FFCDD2" opacity="0.4" />
      
      {/* Meat shine */}
      <Path d="M12 30C16 28 22 30 26 28" stroke="#FFEBEE" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </G>
    
    {/* Mint leaves garnish */}
    <G>
      <Path d="M50 32C52 30 56 30 58 32C58 36 54 38 50 36C52 34 52 32 50 32Z" fill="#66BB6A" />
      <Path d="M52 34L56 32" stroke="#388E3C" strokeWidth="0.5" />
      
      <Path d="M52 38C54 36 58 36 60 38C60 42 56 44 52 42C54 40 54 38 52 38Z" fill="#81C784" />
      <Path d="M54 40L58 38" stroke="#388E3C" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default LambIllustration;
