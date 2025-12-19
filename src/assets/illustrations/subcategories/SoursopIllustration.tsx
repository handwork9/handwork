import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SoursopIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const SoursopIllustration: React.FC<SoursopIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#7CB342',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="soursopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8BC34A" />
          <Stop offset="50%" stopColor={color} />
          <Stop offset="100%" stopColor="#558B2F" />
        </LinearGradient>
      </Defs>
      
      {/* Main soursop fruit - heart/oval shaped with spiny texture */}
      <G>
        {/* Base fruit shape */}
        <Path
          d="M32 6C32 6 18 10 12 26C8 38 12 52 24 58C32 62 44 58 52 50C58 42 58 28 52 18C46 10 36 6 32 6Z"
          fill="url(#soursopGrad)"
        />
        
        {/* Spiny/bumpy texture - small curved bumps */}
        {/* Row 1 */}
        <Path d="M24 14C24 14 26 12 28 14C28 16 26 16 24 14Z" fill="#9CCC65" />
        <Path d="M32 12C32 12 34 10 36 12C36 14 34 14 32 12Z" fill="#9CCC65" />
        <Path d="M40 16C40 16 42 14 44 16C44 18 42 18 40 16Z" fill="#9CCC65" />
        
        {/* Row 2 */}
        <Path d="M18 22C18 22 20 20 22 22C22 24 20 24 18 22Z" fill="#9CCC65" />
        <Path d="M26 20C26 20 28 18 30 20C30 22 28 22 26 20Z" fill="#9CCC65" />
        <Path d="M34 18C34 18 36 16 38 18C38 20 36 20 34 18Z" fill="#9CCC65" />
        <Path d="M44 22C44 22 46 20 48 22C48 24 46 24 44 22Z" fill="#9CCC65" />
        
        {/* Row 3 */}
        <Path d="M14 32C14 32 16 30 18 32C18 34 16 34 14 32Z" fill="#9CCC65" />
        <Path d="M22 28C22 28 24 26 26 28C26 30 24 30 22 28Z" fill="#9CCC65" />
        <Path d="M30 26C30 26 32 24 34 26C34 28 32 28 30 26Z" fill="#9CCC65" />
        <Path d="M38 26C38 26 40 24 42 26C42 28 40 28 38 26Z" fill="#9CCC65" />
        <Path d="M48 30C48 30 50 28 52 30C52 32 50 32 48 30Z" fill="#9CCC65" />
        
        {/* Row 4 */}
        <Path d="M16 40C16 40 18 38 20 40C20 42 18 42 16 40Z" fill="#9CCC65" />
        <Path d="M24 36C24 36 26 34 28 36C28 38 26 38 24 36Z" fill="#9CCC65" />
        <Path d="M32 34C32 34 34 32 36 34C36 36 34 36 32 34Z" fill="#9CCC65" />
        <Path d="M40 36C40 36 42 34 44 36C44 38 42 38 40 36Z" fill="#9CCC65" />
        <Path d="M50 38C50 38 52 36 54 38C54 40 52 40 50 38Z" fill="#9CCC65" />
        
        {/* Row 5 */}
        <Path d="M20 48C20 48 22 46 24 48C24 50 22 50 20 48Z" fill="#9CCC65" />
        <Path d="M28 44C28 44 30 42 32 44C32 46 30 46 28 44Z" fill="#9CCC65" />
        <Path d="M36 44C36 44 38 42 40 44C40 46 38 46 36 44Z" fill="#9CCC65" />
        <Path d="M46 46C46 46 48 44 50 46C50 48 48 48 46 46Z" fill="#9CCC65" />
        
        {/* Row 6 */}
        <Path d="M26 54C26 54 28 52 30 54C30 56 28 56 26 54Z" fill="#9CCC65" />
        <Path d="M34 52C34 52 36 50 38 52C38 54 36 54 34 52Z" fill="#9CCC65" />
        <Path d="M42 54C42 54 44 52 46 54C46 56 44 56 42 54Z" fill="#9CCC65" />
        
        {/* Stem */}
        <Path
          d="M32 6C32 6 32 2 34 0"
          stroke="#5D4037"
          strokeWidth={3}
          strokeLinecap="round"
        />
        
        {/* Highlight */}
        <Ellipse cx="22" cy="30" rx="4" ry="8" fill="#AED581" opacity={0.4} />
      </G>
    </Svg>
  );
};

export default SoursopIllustration;
