import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic livestock illustration - cow, goat, sheep
const LivestockIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#8D6E63' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Cow body gradient */}
      <LinearGradient id="cowBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="50%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </LinearGradient>
      {/* Cow spots gradient */}
      <RadialGradient id="cowSpot" cx="50%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#3E2723" />
      </RadialGradient>
      {/* Skin/muzzle gradient */}
      <LinearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFCCBC" />
        <Stop offset="100%" stopColor="#FFAB91" />
      </LinearGradient>
      {/* Horn gradient */}
      <LinearGradient id="hornGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#E0E0E0" />
        <Stop offset="50%" stopColor="#BDBDBD" />
        <Stop offset="100%" stopColor="#9E9E9E" />
      </LinearGradient>
      {/* Goat body gradient */}
      <LinearGradient id="goatBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#A1887F" />
      </LinearGradient>
      {/* Sheep wool gradient */}
      <RadialGradient id="sheepWool" cx="50%" cy="40%" r="60%">
        <Stop offset="0%" stopColor="#FAFAFA" />
        <Stop offset="70%" stopColor="#EEEEEE" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </RadialGradient>
      {/* Grass gradient */}
      <LinearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#43A047" />
      </LinearGradient>
    </Defs>
    
    {/* Ground/grass */}
    <Ellipse cx="32" cy="58" rx="28" ry="4" fill="url(#grassGrad)" opacity="0.4" />
    
    {/* === COW (main, center-left) === */}
    <G>
      {/* Cow body */}
      <Ellipse cx="22" cy="40" rx="14" ry="9" fill="url(#cowBody)" />
      {/* Body shadow */}
      <Ellipse cx="22" cy="44" rx="12" ry="5" fill="#BDBDBD" opacity="0.3" />
      
      {/* Cow spots */}
      <Ellipse cx="16" cy="38" rx="4" ry="3" fill="url(#cowSpot)" />
      <Ellipse cx="26" cy="42" rx="5" ry="2.5" fill="url(#cowSpot)" />
      <Circle cx="20" cy="44" r="2.5" fill="url(#cowSpot)" />
      
      {/* Cow head */}
      <Ellipse cx="36" cy="34" rx="6" ry="5" fill="url(#cowBody)" />
      
      {/* Ears */}
      <Ellipse cx="32" cy="30" rx="2.5" ry="3" fill="url(#skinGrad)" transform="rotate(-20 32 30)" />
      <Ellipse cx="40" cy="30" rx="2.5" ry="3" fill="url(#skinGrad)" transform="rotate(20 40 30)" />
      
      {/* Horns */}
      <Path
        d="M32 28C30 24 31 21 33 20"
        stroke="url(#hornGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M40 28C42 24 41 21 39 20"
        stroke="url(#hornGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      
      {/* Muzzle */}
      <Ellipse cx="39" cy="37" rx="4" ry="3" fill="url(#skinGrad)" />
      {/* Nostrils */}
      <Ellipse cx="37.5" cy="36.5" rx="0.8" ry="0.6" fill="#5D4037" />
      <Ellipse cx="40.5" cy="36.5" rx="0.8" ry="0.6" fill="#5D4037" />
      
      {/* Eyes */}
      <Circle cx="34" cy="33" r="1.5" fill="#212121" />
      <Circle cx="38" cy="33" r="1.5" fill="#212121" />
      {/* Eye highlights */}
      <Circle cx="34.5" cy="32.5" r="0.5" fill="#FFFFFF" />
      <Circle cx="38.5" cy="32.5" r="0.5" fill="#FFFFFF" />
      
      {/* Legs */}
      <Rect x="12" y="47" width="3" height="8" rx="1.5" fill="#E0E0E0" />
      <Rect x="18" y="47" width="3" height="8" rx="1.5" fill="#E0E0E0" />
      <Rect x="24" y="47" width="3" height="8" rx="1.5" fill="#EEEEEE" />
      <Rect x="30" y="47" width="3" height="8" rx="1.5" fill="#EEEEEE" />
      {/* Hooves */}
      <Rect x="12" y="53" width="3" height="2" rx="0.5" fill="#5D4037" />
      <Rect x="18" y="53" width="3" height="2" rx="0.5" fill="#5D4037" />
      <Rect x="24" y="53" width="3" height="2" rx="0.5" fill="#5D4037" />
      <Rect x="30" y="53" width="3" height="2" rx="0.5" fill="#5D4037" />
      
      {/* Tail */}
      <Path
        d="M8 40C5 38 4 42 6 45"
        stroke="#BDBDBD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Ellipse cx="6" cy="46" rx="1.5" ry="2" fill="url(#cowSpot)" />
      
      {/* Udder */}
      <Ellipse cx="22" cy="48" rx="3" ry="1.5" fill="url(#skinGrad)" />
    </G>
    
    {/* === GOAT (right side) === */}
    <G>
      {/* Goat body */}
      <Ellipse cx="52" cy="44" rx="8" ry="6" fill="url(#goatBody)" />
      
      {/* Goat head */}
      <Ellipse cx="58" cy="38" rx="4" ry="3.5" fill="url(#goatBody)" />
      
      {/* Goat beard */}
      <Path
        d="M58 41C58 44 57 46 56 46"
        stroke="#8D6E63"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Goat ears */}
      <Path d="M55 35L52 33L54 36Z" fill="#BCAAA4" />
      <Path d="M61 35L64 33L62 36Z" fill="#BCAAA4" />
      
      {/* Goat horns - curved back */}
      <Path
        d="M55 34C54 30 56 27 58 26"
        stroke="url(#hornGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M61 34C62 30 60 27 58 26"
        stroke="url(#hornGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Goat eyes */}
      <Circle cx="56" cy="37" r="1" fill="#212121" />
      <Circle cx="60" cy="37" r="1" fill="#212121" />
      
      {/* Goat nose */}
      <Ellipse cx="58" cy="40" rx="1.5" ry="1" fill="#795548" />
      
      {/* Goat legs */}
      <Rect x="46" y="48" width="2" height="7" rx="1" fill="#A1887F" />
      <Rect x="50" y="48" width="2" height="7" rx="1" fill="#A1887F" />
      <Rect x="54" y="48" width="2" height="7" rx="1" fill="#BCAAA4" />
      <Rect x="58" y="48" width="2" height="7" rx="1" fill="#BCAAA4" />
      {/* Goat hooves */}
      <Rect x="46" y="53" width="2" height="2" rx="0.5" fill="#3E2723" />
      <Rect x="50" y="53" width="2" height="2" rx="0.5" fill="#3E2723" />
      <Rect x="54" y="53" width="2" height="2" rx="0.5" fill="#3E2723" />
      <Rect x="58" y="53" width="2" height="2" rx="0.5" fill="#3E2723" />
      
      {/* Goat tail */}
      <Path
        d="M44 44C42 42 42 46 43 47"
        stroke="#8D6E63"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </G>
    
    {/* === SHEEP (background, small) === */}
    <G opacity="0.85">
      {/* Wool body */}
      <Circle cx="10" cy="24" r="6" fill="url(#sheepWool)" />
      {/* Fluffy wool texture */}
      <Circle cx="7" cy="22" r="2.5" fill="#FAFAFA" />
      <Circle cx="13" cy="22" r="2.5" fill="#FAFAFA" />
      <Circle cx="10" cy="20" r="2.5" fill="#FAFAFA" />
      <Circle cx="8" cy="26" r="2" fill="#EEEEEE" />
      <Circle cx="12" cy="26" r="2" fill="#EEEEEE" />
      
      {/* Sheep head */}
      <Ellipse cx="16" cy="22" rx="3" ry="2.5" fill="#424242" />
      {/* Sheep ears */}
      <Ellipse cx="14" cy="20" rx="1.5" ry="1" fill="#424242" transform="rotate(-30 14 20)" />
      <Ellipse cx="18" cy="20" rx="1.5" ry="1" fill="#424242" transform="rotate(30 18 20)" />
      {/* Sheep eyes */}
      <Circle cx="15" cy="21.5" r="0.7" fill="#FFFFFF" />
      <Circle cx="17" cy="21.5" r="0.7" fill="#FFFFFF" />
      
      {/* Sheep legs */}
      <Rect x="7" y="28" width="1.5" height="4" rx="0.5" fill="#424242" />
      <Rect x="11" y="28" width="1.5" height="4" rx="0.5" fill="#424242" />
    </G>
    
    {/* Fence post accent */}
    <Rect x="1" y="14" width="2" height="18" rx="0.5" fill="#8D6E63" />
    <Rect x="0" y="18" width="4" height="1.5" rx="0.5" fill="#A1887F" />
    <Rect x="0" y="24" width="4" height="1.5" rx="0.5" fill="#A1887F" />
  </Svg>
);

export default LivestockIllustration;
