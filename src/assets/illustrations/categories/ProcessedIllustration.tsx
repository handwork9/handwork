import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Processed foods illustration - packaged/preserved items
const ProcessedIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#CD853F'
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="canGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E0E0E0" />
        <Stop offset="20%" stopColor="#F5F5F5" />
        <Stop offset="50%" stopColor="#FAFAFA" />
        <Stop offset="80%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </LinearGradient>
      <LinearGradient id="canTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#BDBDBD" />
        <Stop offset="50%" stopColor="#9E9E9E" />
        <Stop offset="100%" stopColor="#757575" />
      </LinearGradient>
      <LinearGradient id="jarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#B3E5FC" />
        <Stop offset="30%" stopColor="#E1F5FE" />
        <Stop offset="70%" stopColor="#E1F5FE" />
        <Stop offset="100%" stopColor="#B3E5FC" />
      </LinearGradient>
      <LinearGradient id="jarLid" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FFA000" />
      </LinearGradient>
      <RadialGradient id="jarContent" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#E65100" />
        <Stop offset="100%" stopColor="#BF360C" />
      </RadialGradient>
    </Defs>
    
    {/* Canned food */}
    <G>
      {/* Can body */}
      <Rect x="6" y="20" width="20" height="32" rx="2" fill="url(#canGrad)" />
      {/* Can top */}
      <Ellipse cx="16" cy="20" rx="10" ry="3" fill="url(#canTop)" />
      {/* Can bottom */}
      <Path d="M6 50C6 52 10 54 16 54C22 54 26 52 26 50" fill="#757575" />
      {/* Label */}
      <Rect x="8" y="28" width="16" height="16" fill="#C62828" rx="1" />
      <Rect x="10" y="32" width="12" height="2" fill="#FFFFFF" opacity="0.8" />
      <Rect x="10" y="36" width="8" height="1.5" fill="#FFFFFF" opacity="0.6" />
      <Rect x="10" y="40" width="10" height="1.5" fill="#FFFFFF" opacity="0.6" />
    </G>
    
    {/* Glass jar with contents */}
    <G>
      {/* Jar body */}
      <Path
        d="M36 24L36 52C36 54 38 56 44 56C50 56 52 54 52 52L52 24"
        fill="url(#jarGrad)"
      />
      {/* Jar content */}
      <Path
        d="M38 30L38 50C38 52 40 54 44 54C48 54 50 52 50 50L50 30C50 30 48 28 44 28C40 28 38 30 38 30Z"
        fill="url(#jarContent)"
      />
      {/* Jar neck */}
      <Rect x="40" y="18" width="8" height="6" fill="url(#jarGrad)" />
      {/* Jar lid */}
      <Rect x="38" y="14" width="12" height="6" rx="1" fill="url(#jarLid)" />
      {/* Lid ridges */}
      <Path d="M39 16L49 16" stroke="#FF8F00" strokeWidth="0.5" />
      <Path d="M39 18L49 18" stroke="#FF8F00" strokeWidth="0.5" />
      {/* Glass reflection */}
      <Path d="M48 28L48 48" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" />
    </G>
    
    {/* Small packet/sachet */}
    <G>
      <Path
        d="M54 36L58 36L60 58L52 58L54 36Z"
        fill="#4CAF50"
      />
      <Path
        d="M54 38L58 38"
        stroke="#388E3C"
        strokeWidth="1"
      />
      {/* Packet seal */}
      <Rect x="52" y="34" width="10" height="4" fill="#2E7D32" />
      {/* Packet label */}
      <Rect x="53" y="44" width="6" height="8" fill="#FFFFFF" opacity="0.8" rx="0.5" />
    </G>
    
    {/* Small tin/container */}
    <G>
      <Ellipse cx="8" cy="10" rx="6" ry="2" fill="#BDBDBD" />
      <Rect x="2" y="8" width="12" height="6" fill="#E0E0E0" />
      <Ellipse cx="8" cy="14" rx="6" ry="2" fill="#9E9E9E" />
      {/* Label */}
      <Rect x="3" y="9" width="10" height="4" fill="#1565C0" rx="0.5" />
    </G>
  </Svg>
);

export default ProcessedIllustration;
