import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic almonds
const AlmondIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="almondSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#A1887F" />
        <Stop offset="30%" stopColor="#8D6E63" />
        <Stop offset="70%" stopColor="#795548" />
        <Stop offset="100%" stopColor="#6D4C41" />
      </LinearGradient>
      <LinearGradient id="almondBlanched" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="30%" stopColor="#FFECB3" />
        <Stop offset="70%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </LinearGradient>
      <LinearGradient id="almondSliced" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="50%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFF8E1" />
      </LinearGradient>
      <LinearGradient id="glassBowl" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
        <Stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.2" />
        <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
      </LinearGradient>
    </Defs>
    
    {/* Glass bowl */}
    <G>
      <Path
        d="M10 40C10 36 18 32 32 32C46 32 54 36 54 40V54C54 60 46 64 32 64C18 64 10 60 10 54V40Z"
        fill="url(#glassBowl)"
        stroke="#E0E0E0"
        strokeWidth="0.5"
      />
      <Ellipse cx="32" cy="32" rx="22" ry="6" fill="#FFFFFF" opacity="0.3" />
    </G>
    
    {/* Almonds in bowl - with skin */}
    <G>
      {/* Almond 1 */}
      <Path
        d="M22 40C20 38 22 34 28 34C34 34 36 40 34 44C32 48 26 48 24 46C22 44 20 42 22 40Z"
        fill="url(#almondSkin)"
      />
      <Path d="M26 36L28 44" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      
      {/* Almond 2 */}
      <Path
        d="M34 42C32 40 34 36 40 36C46 36 48 42 46 46C44 50 38 50 36 48C34 46 32 44 34 42Z"
        fill="url(#almondSkin)"
      />
      <Path d="M38 38L40 46" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      
      {/* Almond 3 */}
      <Path
        d="M26 48C24 46 26 42 32 42C38 42 40 48 38 52C36 56 30 56 28 54C26 52 24 50 26 48Z"
        fill="url(#almondSkin)"
      />
    </G>
    
    {/* Large featured almond with skin - outside bowl */}
    <G>
      <Path
        d="M8 18C4 14 8 4 18 2C28 0 36 10 34 22C32 34 20 38 14 34C8 30 4 26 8 18Z"
        fill="url(#almondSkin)"
      />
      {/* Skin texture lines */}
      <Path d="M12 10C18 14 24 18 28 24" stroke="#5D4037" strokeWidth="1" opacity="0.3" />
      <Path d="M10 16C16 18 22 22 26 28" stroke="#5D4037" strokeWidth="0.8" opacity="0.25" />
      {/* Highlight */}
      <Path d="M14 8C18 10 22 14 24 18" stroke="#BCAAA4" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </G>
    
    {/* Blanched almond (skin removed) */}
    <G>
      <Path
        d="M44 10C42 6 46 0 54 0C62 0 66 8 64 16C62 24 54 26 50 24C46 22 42 18 44 10Z"
        fill="url(#almondBlanched)"
      />
      <Path d="M48 4C52 8 56 12 58 18" stroke="#FFC107" strokeWidth="0.8" opacity="0.3" />
      <Path d="M50 6C54 10 56 14 56 18" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </G>
    
    {/* Sliced almonds */}
    <G>
      <Ellipse cx="50" cy="28" rx="4" ry="1.5" fill="url(#almondSliced)" stroke="#A1887F" strokeWidth="0.3" />
      <Ellipse cx="56" cy="30" rx="3.5" ry="1.2" fill="url(#almondSliced)" stroke="#A1887F" strokeWidth="0.3" />
      <Ellipse cx="52" cy="32" rx="4" ry="1.5" fill="url(#almondSliced)" stroke="#8D6E63" strokeWidth="0.3" />
    </G>
    
    {/* Almond skins (peeled) */}
    <G opacity="0.5">
      <Path d="M40 58C42 56 46 58 44 62C42 64 38 62 40 58Z" fill="#8D6E63" />
      <Path d="M18 56C20 54 24 56 22 60C20 62 16 60 18 56Z" fill="#795548" />
    </G>
    
    {/* Single whole almond */}
    <G>
      <Path
        d="M4 48C2 46 4 42 8 42C12 42 14 46 12 50C10 54 6 54 4 52C4 50 2 50 4 48Z"
        fill="url(#almondSkin)"
      />
    </G>
  </Svg>
);

export default AlmondIllustration;
