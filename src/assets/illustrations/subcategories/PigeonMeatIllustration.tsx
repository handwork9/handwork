import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Pigeon meat - roasted pigeon
const PigeonMeatIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="pigeonSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="30%" stopColor="#795548" />
        <Stop offset="70%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
      <LinearGradient id="pigeonDark" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="50%" stopColor="#4E342E" />
        <Stop offset="100%" stopColor="#3E2723" />
      </LinearGradient>
      <LinearGradient id="pigeonMeat" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D32F2F" />
        <Stop offset="50%" stopColor="#C62828" />
        <Stop offset="100%" stopColor="#B71C1C" />
      </LinearGradient>
      <LinearGradient id="whitePlate" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="50%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#EEEEEE" />
      </LinearGradient>
    </Defs>
    
    {/* White plate */}
    <G>
      <Ellipse cx="32" cy="52" rx="28" ry="10" fill="url(#whitePlate)" />
      <Ellipse cx="32" cy="50" rx="24" ry="7" fill="#FAFAFA" />
      {/* Plate rim */}
      <Ellipse cx="32" cy="52" rx="28" ry="10" fill="none" stroke="#E0E0E0" strokeWidth="1" />
    </G>
    
    {/* Roasted pigeon - typically served whole */}
    <G>
      {/* Main body */}
      <Ellipse cx="32" cy="36" rx="18" ry="14" fill="url(#pigeonSkin)" />
      
      {/* Dark breast area */}
      <Ellipse cx="32" cy="32" rx="12" ry="8" fill="url(#pigeonDark)" opacity="0.7" />
      
      {/* Crispy skin texture */}
      <Path d="M20 30C26 28 34 32 40 30C44 28 46 30 46 32" stroke="#4E342E" strokeWidth="0.8" fill="none" opacity="0.5" />
      <Path d="M18 38C24 36 32 40 40 38C46 36 48 38 48 40" stroke="#3E2723" strokeWidth="0.6" fill="none" opacity="0.4" />
      
      {/* Meat visible where carved */}
      <Path
        d="M42 36C46 34 50 38 48 42C44 46 40 44 40 40C40 38 40 36 42 36Z"
        fill="url(#pigeonMeat)"
      />
      
      {/* Skin glaze */}
      <Path d="M22 28C28 26 36 28 40 26" stroke="#A1887F" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </G>
    
    {/* Wings - tucked back */}
    <G>
      <Ellipse cx="18" cy="34" rx="6" ry="4" fill="url(#pigeonDark)" />
      <Ellipse cx="46" cy="34" rx="6" ry="4" fill="url(#pigeonDark)" />
    </G>
    
    {/* Legs */}
    <G>
      {/* Left leg */}
      <Path
        d="M20 44C16 46 14 52 16 54C20 56 24 54 26 50C26 46 24 44 20 44Z"
        fill="url(#pigeonSkin)"
      />
      <Path d="M16 54L14 58" stroke="#D7CCC8" strokeWidth="2" strokeLinecap="round" />
      
      {/* Right leg */}
      <Path
        d="M44 44C48 46 50 52 48 54C44 56 40 54 38 50C38 46 40 44 44 44Z"
        fill="url(#pigeonSkin)"
      />
      <Path d="M48 54L50 58" stroke="#D7CCC8" strokeWidth="2" strokeLinecap="round" />
    </G>
    
    {/* Jus/sauce on plate */}
    <G>
      <Ellipse cx="32" cy="50" rx="16" ry="3" fill="#4E342E" opacity="0.4" />
    </G>
    
    {/* Garnish */}
    <G>
      {/* Grapes/berries */}
      <Circle cx="12" cy="50" r="2.5" fill="#7B1FA2" />
      <Circle cx="16" cy="52" r="2" fill="#8E24AA" />
      <Circle cx="14" cy="48" r="1.8" fill="#6A1B9A" />
      
      {/* Thyme sprig */}
      <Path d="M48 48L52 44" stroke="#66BB6A" strokeWidth="1" />
      <Circle cx="49" cy="47" r="0.8" fill="#81C784" />
      <Circle cx="50" cy="46" r="0.7" fill="#81C784" />
      <Circle cx="51" cy="45" r="0.8" fill="#81C784" />
      
      {/* Microgreens */}
      <Path d="M52 50C54 48 58 48 60 50" stroke="#4CAF50" strokeWidth="1" />
      <Path d="M54 52C56 50 60 50 62 52" stroke="#66BB6A" strokeWidth="0.8" />
    </G>
    
    {/* Decorative sauce dots */}
    <G>
      <Circle cx="8" cy="52" r="1.5" fill="#4E342E" opacity="0.6" />
      <Circle cx="56" cy="54" r="1.2" fill="#4E342E" opacity="0.5" />
    </G>
  </Svg>
);

export default PigeonMeatIllustration;
