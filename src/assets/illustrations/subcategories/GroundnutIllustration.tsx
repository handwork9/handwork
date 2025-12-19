import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic groundnuts/peanuts - in shell and shelled
const GroundnutIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="peanutShell" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="30%" stopColor="#BCAAA4" />
        <Stop offset="70%" stopColor="#A1887F" />
        <Stop offset="100%" stopColor="#8D6E63" />
      </LinearGradient>
      <LinearGradient id="peanutKernel" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="50%" stopColor="#FFB74D" />
        <Stop offset="100%" stopColor="#FFA726" />
      </LinearGradient>
      <LinearGradient id="peanutSkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#C62828" />
        <Stop offset="50%" stopColor="#B71C1C" />
        <Stop offset="100%" stopColor="#8B0000" />
      </LinearGradient>
      <LinearGradient id="woodBowl" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8D6E63" />
        <Stop offset="50%" stopColor="#6D4C41" />
        <Stop offset="100%" stopColor="#5D4037" />
      </LinearGradient>
    </Defs>
    
    {/* Wooden bowl */}
    <G>
      <Path
        d="M6 40C6 36 14 32 32 32C50 32 58 36 58 40V54C58 60 50 64 32 64C14 64 6 60 6 54V40Z"
        fill="url(#woodBowl)"
      />
      <Ellipse cx="32" cy="32" rx="26" ry="8" fill="#8D6E63" />
      {/* Wood grain */}
      <Path d="M12 44C20 42 44 42 52 44" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
      <Path d="M14 50C22 48 42 48 50 50" stroke="#5D4037" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Peanuts in shell - in bowl */}
    <G>
      {/* Shell 1 */}
      <Path
        d="M18 38C16 36 18 30 22 30C26 30 28 34 28 38C28 42 24 44 22 44C18 44 16 42 18 38Z"
        fill="url(#peanutShell)"
      />
      <Path
        d="M28 38C26 36 28 30 32 30C36 30 38 34 38 38C38 42 34 44 32 44C28 44 26 42 28 38Z"
        fill="url(#peanutShell)"
      />
      {/* Shell texture */}
      <Path d="M20 34V40" stroke="#8D6E63" strokeWidth="0.5" opacity="0.5" />
      <Path d="M24 32V42" stroke="#8D6E63" strokeWidth="0.5" opacity="0.5" />
      <Path d="M30 34V40" stroke="#8D6E63" strokeWidth="0.5" opacity="0.5" />
      <Path d="M34 32V42" stroke="#8D6E63" strokeWidth="0.5" opacity="0.5" />
      
      {/* Shell 2 */}
      <Path
        d="M38 40C36 38 38 34 42 34C46 34 48 38 48 40C48 44 44 46 42 46C38 46 36 44 38 40Z"
        fill="url(#peanutShell)"
      />
      <Path d="M40 36V44" stroke="#8D6E63" strokeWidth="0.5" opacity="0.5" />
      <Path d="M44 36V44" stroke="#8D6E63" strokeWidth="0.5" opacity="0.5" />
      
      {/* Shell 3 */}
      <Path
        d="M26 46C24 44 26 40 30 40C34 40 36 44 36 46C36 50 32 52 30 52C26 52 24 50 26 46Z"
        fill="url(#peanutShell)"
      />
    </G>
    
    {/* Shelled peanuts outside bowl */}
    <G>
      {/* Kernel 1 with skin */}
      <Ellipse cx="12" cy="26" rx="4" ry="6" fill="url(#peanutSkin)" />
      <Ellipse cx="12" cy="26" rx="3" ry="5" fill="url(#peanutKernel)" />
      {/* Split line */}
      <Path d="M12 21V31" stroke="#E65100" strokeWidth="0.5" opacity="0.5" />
      
      {/* Kernel 2 */}
      <Ellipse cx="52" cy="24" rx="3.5" ry="5.5" fill="url(#peanutSkin)" />
      <Ellipse cx="52" cy="24" rx="2.5" ry="4.5" fill="url(#peanutKernel)" />
      <Path d="M52 19V29" stroke="#E65100" strokeWidth="0.5" opacity="0.5" />
      
      {/* Kernel 3 - half peeled */}
      <Ellipse cx="44" cy="14" rx="3" ry="5" fill="url(#peanutKernel)" />
      <Path d="M42 10C44 12 46 14 46 18" fill="url(#peanutSkin)" />
    </G>
    
    {/* Scattered shell pieces */}
    <G opacity="0.6">
      <Path d="M8 34C10 32 12 34 10 36C8 38 6 36 8 34Z" fill="#BCAAA4" />
      <Path d="M54 30C56 28 58 30 56 32C54 34 52 32 54 30Z" fill="#A1887F" />
    </G>
  </Svg>
);

export default GroundnutIllustration;
