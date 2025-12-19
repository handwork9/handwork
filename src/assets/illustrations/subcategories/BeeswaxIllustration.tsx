import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect, Polygon } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Beeswax - golden wax blocks/bars
const BeeswaxIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="beeswaxGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="30%" stopColor="#FFD54F" />
        <Stop offset="70%" stopColor="#FFC107" />
        <Stop offset="100%" stopColor="#FFB300" />
      </LinearGradient>
      <LinearGradient id="beeswaxDark" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFC107" />
        <Stop offset="50%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      <LinearGradient id="beeswaxSide" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      <LinearGradient id="clothTexture" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#EFEBE9" />
        <Stop offset="50%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#BCAAA4" />
      </LinearGradient>
    </Defs>
    
    {/* Cloth/burlap base */}
    <G>
      <Path
        d="M2 48C2 46 8 44 32 44C56 44 62 46 62 48V58C62 60 56 62 32 62C8 62 2 60 2 58V48Z"
        fill="url(#clothTexture)"
      />
      {/* Cloth texture */}
      <Path d="M8 50H56" stroke="#A1887F" strokeWidth="0.5" opacity="0.4" />
      <Path d="M8 54H56" stroke="#A1887F" strokeWidth="0.5" opacity="0.4" />
      <Path d="M8 58H56" stroke="#A1887F" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Main beeswax block */}
    <G>
      {/* Top face */}
      <Path
        d="M12 26L32 18L52 26L52 38L32 46L12 38Z"
        fill="url(#beeswaxGold)"
      />
      
      {/* Front face */}
      <Path
        d="M12 26L12 38L32 46L32 34Z"
        fill="url(#beeswaxDark)"
      />
      
      {/* Right face */}
      <Path
        d="M32 34L32 46L52 38L52 26Z"
        fill="url(#beeswaxSide)"
      />
      
      {/* Block edges */}
      <Path d="M12 26L32 18L52 26" stroke="#FF8F00" strokeWidth="0.8" fill="none" />
      <Path d="M12 26L12 38L32 46L52 38L52 26" stroke="#E65100" strokeWidth="0.5" fill="none" />
      
      {/* Wax texture/shine */}
      <Path d="M18 28L28 24" stroke="#FFE082" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <Path d="M36 26L46 30" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </G>
    
    {/* Small wax bar in front */}
    <G>
      {/* Top */}
      <Path
        d="M18 42L28 38L38 42L38 48L28 52L18 48Z"
        fill="url(#beeswaxGold)"
      />
      {/* Front */}
      <Path
        d="M18 42L18 48L28 52L28 46Z"
        fill="url(#beeswaxDark)"
      />
      {/* Side */}
      <Path
        d="M28 46L28 52L38 48L38 42Z"
        fill="url(#beeswaxSide)"
      />
      <Path d="M20 44L26 42" stroke="#FFE082" strokeWidth="1" opacity="0.5" />
    </G>
    
    {/* Honeycomb imprint on wax (decorative) */}
    <G opacity="0.3">
      <Polygon points="24,28 28,30 28,34 24,36 20,34 20,30" fill="none" stroke="#E65100" strokeWidth="0.5" />
      <Polygon points="32,26 36,28 36,32 32,34 28,32 28,28" fill="none" stroke="#E65100" strokeWidth="0.5" />
      <Polygon points="40,28 44,30 44,34 40,36 36,34 36,30" fill="none" stroke="#E65100" strokeWidth="0.5" />
    </G>
    
    {/* Bee stamp/logo on block */}
    <G>
      <Ellipse cx="32" cy="30" rx="4" ry="2.5" fill="#E65100" opacity="0.3" />
      <Circle cx="35" cy="30" r="1.5" fill="#E65100" opacity="0.3" />
    </G>
    
    {/* Small wax crumbles */}
    <G>
      <Circle cx="44" cy="50" r="2" fill="#FFD54F" />
      <Circle cx="48" cy="52" r="1.5" fill="#FFC107" />
      <Ellipse cx="10" cy="52" rx="2" ry="1.5" fill="#FFD54F" />
    </G>
    
    {/* Flying bee */}
    <G>
      <Ellipse cx="54" cy="12" rx="4" ry="2.5" fill="#FFC107" />
      <Path d="M52 10V14" stroke="#212121" strokeWidth="0.8" />
      <Path d="M54 10V14" stroke="#212121" strokeWidth="0.8" />
      <Path d="M56 10V14" stroke="#212121" strokeWidth="0.8" />
      <Circle cx="58" cy="12" r="2" fill="#212121" />
      <Ellipse cx="52" cy="9" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.5" />
      <Ellipse cx="53" cy="8" rx="2.5" ry="1.2" fill="#FFFFFF" opacity="0.3" />
    </G>
    
    {/* Decorative honey drops */}
    <G>
      <Ellipse cx="8" cy="34" rx="2" ry="3" fill="#FFB300" opacity="0.6" />
      <Circle cx="8" cy="38" r="1.5" fill="#FF8F00" opacity="0.4" />
    </G>
  </Svg>
);

export default BeeswaxIllustration;
