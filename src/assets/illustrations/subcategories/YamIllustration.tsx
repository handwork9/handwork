import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic Nigerian white yam tuber
const YamIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="yamSkinMain" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#C4A484" />
        <Stop offset="25%" stopColor="#A67B5B" />
        <Stop offset="50%" stopColor="#8B6914" />
        <Stop offset="75%" stopColor="#6B4423" />
        <Stop offset="100%" stopColor="#5C4033" />
      </LinearGradient>
      <LinearGradient id="yamSkinDark" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8B6914" />
        <Stop offset="50%" stopColor="#6B4423" />
        <Stop offset="100%" stopColor="#4A3728" />
      </LinearGradient>
      <RadialGradient id="yamFleshInner" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFFEF7" />
        <Stop offset="40%" stopColor="#FFF8DC" />
        <Stop offset="70%" stopColor="#FAEBD7" />
        <Stop offset="100%" stopColor="#F5DEB3" />
      </RadialGradient>
      <LinearGradient id="yamHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D4B896" />
        <Stop offset="100%" stopColor="#A67B5B" />
      </LinearGradient>
    </Defs>
    
    {/* Main yam tuber - elongated cylindrical shape */}
    <G>
      {/* Shadow underneath */}
      <Ellipse cx="32" cy="58" rx="20" ry="4" fill="#3E2723" opacity="0.2" />
      
      {/* Main body - characteristic elongated shape */}
      <Path
        d="M8 32C6 24 8 14 16 10C24 6 40 6 50 12C58 18 60 28 58 38C56 48 48 54 36 56C24 58 12 52 8 42C6 38 6 36 8 32Z"
        fill="url(#yamSkinMain)"
      />
      
      {/* Darker underside */}
      <Path
        d="M10 40C12 48 22 54 34 54C44 54 52 50 56 42C54 48 46 54 34 56C22 58 12 52 10 44Z"
        fill="url(#yamSkinDark)"
        opacity="0.6"
      />
      
      {/* Rough bark-like texture lines */}
      <Path d="M14 18C22 14 38 14 48 20" stroke="#5C4033" strokeWidth="0.8" opacity="0.5" />
      <Path d="M12 26C22 22 40 22 52 28" stroke="#5C4033" strokeWidth="0.7" opacity="0.4" />
      <Path d="M10 34C20 30 42 30 54 36" stroke="#5C4033" strokeWidth="0.6" opacity="0.35" />
      <Path d="M12 42C24 38 44 40 52 44" stroke="#5C4033" strokeWidth="0.6" opacity="0.3" />
      
      {/* Vertical crack lines - characteristic of yam */}
      <Path d="M20 14C22 24 20 36 22 48" stroke="#4A3728" strokeWidth="0.5" opacity="0.3" />
      <Path d="M36 12C34 22 36 34 34 46" stroke="#4A3728" strokeWidth="0.4" opacity="0.25" />
      <Path d="M48 18C46 28 48 38 46 48" stroke="#4A3728" strokeWidth="0.4" opacity="0.25" />
      
      {/* Root scars and bumps */}
      <Ellipse cx="18" cy="20" rx="2.5" ry="1.8" fill="#5C4033" opacity="0.5" />
      <Ellipse cx="32" cy="14" rx="2" ry="1.5" fill="#4A3728" opacity="0.4" />
      <Ellipse cx="46" cy="22" rx="2.2" ry="1.6" fill="#5C4033" opacity="0.45" />
      <Ellipse cx="24" cy="44" rx="2" ry="1.5" fill="#4A3728" opacity="0.4" />
      <Ellipse cx="42" cy="42" rx="1.8" ry="1.4" fill="#5C4033" opacity="0.35" />
      <Ellipse cx="50" cy="34" rx="2" ry="1.5" fill="#4A3728" opacity="0.4" />
      
      {/* Highlight on top */}
      <Path 
        d="M18 16C28 12 42 14 50 20" 
        stroke="url(#yamHighlight)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        opacity="0.35" 
      />
      
      {/* Small root at end */}
      <Path d="M56 30C60 28 62 32 60 36C58 34 58 30 56 30Z" fill="#5C4033" />
      <Path d="M60 32L64 30" stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
      <Path d="M60 34L64 36" stroke="#4A3728" strokeWidth="0.8" strokeLinecap="round" />
    </G>
    
    {/* Cut yam piece showing cream/white flesh */}
    <G>
      <Path
        d="M2 48C0 44 4 38 12 38C20 38 26 44 24 50C22 56 14 58 8 56C4 54 0 52 2 48Z"
        fill="url(#yamSkinMain)"
      />
      {/* Cut surface - cream white flesh */}
      <Ellipse cx="12" cy="48" rx="9" ry="8" fill="url(#yamFleshInner)" />
      
      {/* Flesh texture - subtle radial lines */}
      <Path d="M8 44L12 52" stroke="#F5DEB3" strokeWidth="0.5" opacity="0.4" />
      <Path d="M12 44L12 52" stroke="#FAEBD7" strokeWidth="0.4" opacity="0.3" />
      <Path d="M16 44L12 52" stroke="#F5DEB3" strokeWidth="0.5" opacity="0.4" />
      
      {/* Skin ring around flesh */}
      <Path
        d="M6 42C10 38 18 40 22 46C22 52 18 56 12 56C6 56 2 52 4 46"
        fill="none"
        stroke="#6B4423"
        strokeWidth="1.5"
        opacity="0.6"
      />
      
      {/* Moisture glistening */}
      <Ellipse cx="10" cy="46" rx="2" ry="1.5" fill="#FFFFFF" opacity="0.3" />
    </G>
  </Svg>
);

export default YamIllustration;
