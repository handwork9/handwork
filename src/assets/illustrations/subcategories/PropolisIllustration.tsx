import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Propolis - dark resinous bee product chunks
const PropolisIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="propolisDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#5D4037" />
        <Stop offset="30%" stopColor="#4E342E" />
        <Stop offset="70%" stopColor="#3E2723" />
        <Stop offset="100%" stopColor="#2E1F1A" />
      </LinearGradient>
      <LinearGradient id="propolisResin" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#6D4C41" />
        <Stop offset="50%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#3E2723" />
      </LinearGradient>
      <LinearGradient id="glassBowl" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
        <Stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
      </LinearGradient>
      <LinearGradient id="honeycombBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFB300" />
      </LinearGradient>
    </Defs>
    
    {/* Small glass bowl */}
    <G>
      <Path
        d="M10 36C10 32 16 28 32 28C48 28 54 32 54 36V50C54 56 48 60 32 60C16 60 10 56 10 50V36Z"
        fill="url(#glassBowl)"
        stroke="#BDBDBD"
        strokeWidth="0.5"
      />
      {/* Bowl base */}
      <Ellipse cx="32" cy="60" rx="18" ry="4" fill="#E0E0E0" opacity="0.5" />
    </G>
    
    {/* Propolis chunks */}
    <G>
      {/* Large chunk 1 */}
      <Path
        d="M20 38C18 36 20 32 24 32C28 32 32 34 32 38C32 42 28 46 24 46C20 46 18 42 20 38Z"
        fill="url(#propolisDark)"
      />
      {/* Resin shine */}
      <Path d="M22 36C24 34 26 36 28 34" stroke="#8D6E63" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      
      {/* Large chunk 2 */}
      <Path
        d="M36 40C34 38 36 34 40 34C44 34 48 36 48 40C48 44 44 48 40 48C36 48 34 44 36 40Z"
        fill="url(#propolisResin)"
      />
      <Path d="M38 38C40 36 42 38 44 36" stroke="#795548" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      
      {/* Medium chunk */}
      <Path
        d="M28 48C26 46 28 44 32 44C36 44 38 46 38 48C38 52 34 54 32 54C28 54 26 52 28 48Z"
        fill="url(#propolisDark)"
      />
      
      {/* Small chunks */}
      <Circle cx="22" cy="50" r="3" fill="#4E342E" />
      <Circle cx="42" cy="52" r="2.5" fill="#5D4037" />
      <Ellipse cx="36" cy="54" rx="3" ry="2" fill="#3E2723" />
    </G>
    
    {/* Decorative honeycomb piece nearby */}
    <G>
      <Path
        d="M4 18L10 22L10 30L4 34L-2 30L-2 22Z"
        fill="url(#honeycombBg)"
        stroke="#FFA000"
        strokeWidth="0.5"
      />
      <Path
        d="M12 14L18 18L18 26L12 30L6 26L6 18Z"
        fill="url(#honeycombBg)"
        stroke="#FFA000"
        strokeWidth="0.5"
      />
    </G>
    
    {/* Bee illustration */}
    <G>
      <Ellipse cx="52" cy="16" rx="5" ry="3" fill="#FFC107" />
      <Path d="M49 14V18" stroke="#212121" strokeWidth="1" />
      <Path d="M52 14V18" stroke="#212121" strokeWidth="1" />
      <Path d="M55 14V18" stroke="#212121" strokeWidth="1" />
      <Circle cx="57" cy="16" r="2.5" fill="#212121" />
      <Ellipse cx="50" cy="13" rx="4" ry="2" fill="#FFFFFF" opacity="0.5" />
    </G>
    
    {/* Label/tag */}
    <G>
      <Rect x="48" y="40" width="12" height="8" rx="1" fill="#FFF8E1" />
      <Path d="M50 44H58" stroke="#5D4037" strokeWidth="1" />
      <Circle cx="54" cy="40" r="1" fill="#8D6E63" />
    </G>
    
    {/* Propolis texture details */}
    <G opacity="0.3">
      <Circle cx="26" cy="40" r="0.8" fill="#8D6E63" />
      <Circle cx="24" cy="44" r="0.6" fill="#795548" />
      <Circle cx="40" cy="42" r="0.7" fill="#8D6E63" />
      <Circle cx="44" cy="44" r="0.5" fill="#795548" />
    </G>
  </Svg>
);

export default PropolisIllustration;
