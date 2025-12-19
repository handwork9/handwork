import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CheeseRealisticIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cheeseTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="50%" stopColor="#FFCA28" />
        <Stop offset="100%" stopColor="#FFB300" />
      </LinearGradient>
      <LinearGradient id="cheeseSide" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
      <LinearGradient id="cheeseFront" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFCA28" />
        <Stop offset="50%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
      <LinearGradient id="rind" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFA726" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
    </Defs>
    
    {/* Main cheese wedge */}
    <G>
      {/* Back side of wedge */}
      <Path
        d="M12 52L32 20L52 52H12Z"
        fill="url(#cheeseSide)"
      />
      
      {/* Top surface */}
      <Path
        d="M12 52L32 20L58 38L38 52H12Z"
        fill="url(#cheeseTop)"
      />
      
      {/* Front cut surface */}
      <Path
        d="M32 20L58 38L58 52L32 52V20Z"
        fill="url(#cheeseFront)"
      />
      
      {/* Rind (outer edge) */}
      <Path
        d="M12 52L32 52L32 56C32 56 22 56 12 52Z"
        fill="url(#rind)"
      />
      <Path
        d="M32 52H58V54C58 54 45 56 32 56V52Z"
        fill="url(#rind)"
      />
      
      {/* Cheese holes on top */}
      <Ellipse cx="24" cy="42" rx="4" ry="2.5" fill="#FFA000" opacity="0.6" />
      <Ellipse cx="36" cy="36" rx="3" ry="2" fill="#FFA000" opacity="0.5" />
      <Ellipse cx="44" cy="44" rx="2.5" ry="1.5" fill="#FFA000" opacity="0.5" />
      <Circle cx="28" cy="48" r="2" fill="#FFA000" opacity="0.4" />
      <Circle cx="48" cy="40" r="1.5" fill="#FFA000" opacity="0.4" />
      
      {/* Cheese holes on front */}
      <Ellipse cx="42" cy="38" rx="3" ry="2" fill="#FF8F00" opacity="0.5" />
      <Circle cx="50" cy="44" r="2.5" fill="#FF8F00" opacity="0.4" />
      <Circle cx="38" cy="46" r="1.8" fill="#FF8F00" opacity="0.4" />
      <Circle cx="54" cy="48" r="1.5" fill="#FF8F00" opacity="0.3" />
      
      {/* Highlight on top edge */}
      <Path
        d="M14 50L30 22"
        stroke="#FFE082"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Texture lines */}
      <Path
        d="M20 48C22 46 26 44 30 44"
        stroke="#FFB300"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </G>
    
    {/* Small cheese slice */}
    <G>
      <Path
        d="M4 56L8 48L16 56H4Z"
        fill="url(#cheeseTop)"
      />
      <Path
        d="M8 48L16 56L16 58L8 54V48Z"
        fill="url(#cheeseFront)"
      />
      <Circle cx="10" cy="52" r="1.2" fill="#FFA000" opacity="0.5" />
      <Circle cx="12" cy="54" r="0.8" fill="#FFA000" opacity="0.4" />
    </G>
  </Svg>
);

export default CheeseRealisticIllustration;
