import React from 'react';
import Svg, { Path, Ellipse, Rect, Circle, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic dairy illustration - milk bottle, cheese, yogurt, butter
const DairyIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#BBDEFB' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="milkBottle" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E3F2FD" />
        <Stop offset="30%" stopColor="#FFFFFF" />
        <Stop offset="70%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E3F2FD" />
      </LinearGradient>
      <LinearGradient id="milkContent" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E3F2FD" />
      </LinearGradient>
      <LinearGradient id="bottleCap" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#1E88E5" />
        <Stop offset="50%" stopColor="#1565C0" />
        <Stop offset="100%" stopColor="#0D47A1" />
      </LinearGradient>
      <RadialGradient id="cheeseGrad" cx="30%" cy="30%" r="70%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="50%" stopColor="#FFCA28" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </RadialGradient>
      <LinearGradient id="cheeseSide" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <LinearGradient id="yogurtCup" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E1BEE7" />
        <Stop offset="30%" stopColor="#F3E5F5" />
        <Stop offset="70%" stopColor="#F3E5F5" />
        <Stop offset="100%" stopColor="#E1BEE7" />
      </LinearGradient>
      <LinearGradient id="yogurtLid" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#AB47BC" />
        <Stop offset="100%" stopColor="#7B1FA2" />
      </LinearGradient>
      <LinearGradient id="butterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="50%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFD54F" />
      </LinearGradient>
    </Defs>
    
    {/* Milk bottle */}
    <G>
      {/* Bottle body */}
      <Path
        d="M14 20H26V24L28 28V52C28 54 26 56 24 56H16C14 56 12 54 12 52V28L14 24V20Z"
        fill="url(#milkBottle)"
      />
      {/* Milk inside */}
      <Path
        d="M14 30C14 30 12 32 12 52C12 54 14 56 16 56H24C26 56 28 54 28 52C28 32 26 30 26 30H14Z"
        fill="url(#milkContent)"
      />
      {/* Bottle neck */}
      <Rect x="16" y="14" width="8" height="6" fill="url(#milkBottle)" />
      {/* Cap */}
      <Rect x="15" y="10" width="10" height="5" rx="1" fill="url(#bottleCap)" />
      {/* Glass reflection */}
      <Path d="M16 26L16 50" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
      {/* Label area */}
      <Rect x="14" y="38" width="14" height="10" rx="1" fill="#E3F2FD" opacity="0.5" />
      <Ellipse cx="21" cy="43" rx="5" ry="3" fill="#1E88E5" opacity="0.2" />
    </G>
    
    {/* Cheese wedge */}
    <G>
      {/* Top face */}
      <Path
        d="M36 36L54 42L42 58L36 36Z"
        fill="url(#cheeseGrad)"
      />
      {/* Side face */}
      <Path
        d="M42 58L54 42L56 46L44 60L42 58Z"
        fill="url(#cheeseSide)"
      />
      {/* Cheese holes */}
      <Circle cx="42" cy="44" r="2.5" fill="#FFF59D" />
      <Circle cx="48" cy="48" r="2" fill="#FFF59D" />
      <Circle cx="44" cy="52" r="3" fill="#FFF59D" />
      <Circle cx="40" cy="48" r="1.5" fill="#FFF59D" />
      {/* Cheese rind edge */}
      <Path d="M36 36L42 58" stroke="#E65100" strokeWidth="1.5" opacity="0.5" />
      {/* Highlight */}
      <Path d="M38 40L44 44" stroke="#FFEE58" strokeWidth="1" opacity="0.4" />
    </G>
    
    {/* Yogurt cup */}
    <G>
      {/* Cup body */}
      <Path
        d="M44 16H58L56 30H46L44 16Z"
        fill="url(#yogurtCup)"
      />
      {/* Lid */}
      <Rect x="42" y="12" width="18" height="5" rx="1" fill="url(#yogurtLid)" />
      {/* Lid pull tab */}
      <Path d="M58 14L62 12L62 16L58 14Z" fill="#CE93D8" />
      {/* Yogurt swirl visible */}
      <Ellipse cx="51" cy="22" rx="4" ry="3" fill="#F8BBD9" opacity="0.6" />
      {/* Cup ridges */}
      <Path d="M45 20L57 20" stroke="#E1BEE7" strokeWidth="0.5" opacity="0.6" />
      <Path d="M45.5 24L56.5 24" stroke="#E1BEE7" strokeWidth="0.5" opacity="0.6" />
      {/* Label */}
      <Circle cx="51" cy="23" r="3" fill="#9C27B0" opacity="0.2" />
    </G>
    
    {/* Butter block */}
    <G>
      <Rect x="4" y="44" width="10" height="6" rx="1" fill="url(#butterGrad)" />
      <Rect x="4" y="50" width="10" height="2" fill="#FFD54F" />
      {/* Butter paper wrap */}
      <Rect x="3" y="43" width="12" height="10" rx="1" fill="none" stroke="#E0E0E0" strokeWidth="0.5" />
      <Path d="M5 44L5 52" stroke="#FFD54F" strokeWidth="0.3" opacity="0.5" />
      {/* Highlight */}
      <Rect x="6" y="45" width="3" height="2" rx="0.5" fill="#FFFDE7" opacity="0.5" />
    </G>
    
    {/* Milk splash/drops */}
    <G opacity="0.6">
      <Circle cx="32" cy="8" r="2" fill="#FFFFFF" />
      <Circle cx="36" cy="6" r="1.5" fill="#E3F2FD" />
      <Path d="M30 4C30 4 32 2 34 4C32 6 30 4 30 4Z" fill="#FFFFFF" />
    </G>
  </Svg>
);

export default DairyIllustration;
