import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic kola nut - Nigerian traditional nut
const KolanutIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="kolaOuter" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="30%" stopColor="#6D4C41" />
        <Stop offset="70%" stopColor="#5D4037" />
        <Stop offset="100%" stopColor="#4E342E" />
      </LinearGradient>
      <LinearGradient id="kolaInner" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFCCBC" />
        <Stop offset="30%" stopColor="#FFAB91" />
        <Stop offset="70%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#FF7043" />
      </LinearGradient>
      <LinearGradient id="kolaWhite" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFF8E1" />
        <Stop offset="50%" stopColor="#FFECB3" />
        <Stop offset="100%" stopColor="#FFE082" />
      </LinearGradient>
      <LinearGradient id="calabash" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#795548" />
      </LinearGradient>
    </Defs>
    
    {/* Traditional calabash bowl */}
    <G>
      <Path
        d="M8 44C8 40 16 36 32 36C48 36 56 40 56 44V56C56 62 48 64 32 64C16 64 8 62 8 56V44Z"
        fill="url(#calabash)"
      />
      <Ellipse cx="32" cy="36" rx="24" ry="6" fill="#D7CCC8" />
      {/* Calabash pattern */}
      <Path d="M14 48C20 46 44 46 50 48" stroke="#6D4C41" strokeWidth="0.5" opacity="0.5" />
      <Path d="M16 54C24 52 40 52 48 54" stroke="#6D4C41" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Whole kola nut with brown skin - in bowl */}
    <G>
      <Ellipse cx="24" cy="44" rx="8" ry="6" fill="url(#kolaOuter)" />
      {/* Skin texture */}
      <Path d="M18 44C22 42 26 44 30 42" stroke="#4E342E" strokeWidth="0.5" opacity="0.5" />
      
      <Ellipse cx="40" cy="46" rx="7" ry="5" fill="url(#kolaOuter)" />
      <Path d="M34 46C38 44 42 46 46 44" stroke="#4E342E" strokeWidth="0.5" opacity="0.5" />
    </G>
    
    {/* Split kola nut showing lobes - main display */}
    <G>
      {/* First lobe (red/pink) */}
      <Path
        d="M16 20C12 16 14 8 22 6C30 4 36 10 36 18C36 26 30 32 22 32C14 32 12 26 16 20Z"
        fill="url(#kolaInner)"
      />
      {/* Lobe segment lines */}
      <Path d="M22 8L22 30" stroke="#E64A19" strokeWidth="1" opacity="0.4" />
      <Path d="M18 12L26 28" stroke="#E64A19" strokeWidth="0.5" opacity="0.3" />
      {/* Shine */}
      <Path d="M18 14C22 12 26 14 28 16" stroke="#FFCCBC" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      
      {/* Second lobe (white/cream) */}
      <Path
        d="M38 18C34 14 36 6 44 4C52 2 58 8 58 16C58 24 52 30 44 30C36 30 34 24 38 18Z"
        fill="url(#kolaWhite)"
      />
      <Path d="M44 6L44 28" stroke="#FFC107" strokeWidth="1" opacity="0.3" />
      <Path d="M40 10L48 26" stroke="#FFC107" strokeWidth="0.5" opacity="0.3" />
      <Path d="M40 12C44 10 48 12 50 14" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </G>
    
    {/* Single lobe outside */}
    <G>
      <Path
        d="M4 36C2 34 4 28 10 28C16 28 18 34 16 38C14 42 8 42 6 40C4 38 2 38 4 36Z"
        fill="url(#kolaInner)"
      />
      <Path d="M8 30L10 38" stroke="#E64A19" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Kola skin pieces */}
    <G opacity="0.5">
      <Path d="M52 34C54 32 58 34 56 38C54 40 50 38 52 34Z" fill="#5D4037" />
      <Path d="M28 34C30 32 34 34 32 38C30 40 26 38 28 34Z" fill="#6D4C41" />
    </G>
    
    {/* Small decorative leaf */}
    <G>
      <Path
        d="M56 8C58 6 62 8 62 12C62 16 58 18 54 16C56 14 56 10 56 8Z"
        fill="#66BB6A"
      />
      <Path d="M56 10L60 12" stroke="#388E3C" strokeWidth="0.5" />
    </G>
  </Svg>
);

export default KolanutIllustration;
