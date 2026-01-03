import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic corn on the cob illustration
const CornIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cornCobReal" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FBC02D" />
        <Stop offset="25%" stopColor="#FFD54F" />
        <Stop offset="50%" stopColor="#FFEB3B" />
        <Stop offset="75%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#FBC02D" />
      </LinearGradient>
      <RadialGradient id="kernelGoldReal" cx="40%" cy="30%" r="60%">
        <Stop offset="0%" stopColor="#FFF59D" />
        <Stop offset="50%" stopColor="#FFD54F" />
        <Stop offset="100%" stopColor="#F9A825" />
      </RadialGradient>
      <RadialGradient id="kernelYellowReal" cx="40%" cy="30%" r="60%">
        <Stop offset="0%" stopColor="#FFFDE7" />
        <Stop offset="50%" stopColor="#FFEB3B" />
        <Stop offset="100%" stopColor="#FDD835" />
      </RadialGradient>
      <LinearGradient id="huskGreenReal" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#558B2F" />
        <Stop offset="50%" stopColor="#7CB342" />
        <Stop offset="100%" stopColor="#9CCC65" />
      </LinearGradient>
    </Defs>
    
    {/* Husk leaves - behind corn */}
    <G>
      <Path
        d="M22 16C14 12 6 16 4 26C2 38 8 48 16 50C16 40 18 26 22 16Z"
        fill="url(#huskGreenReal)"
      />
      <Path
        d="M42 16C50 12 58 16 60 26C62 38 56 48 48 50C48 40 46 26 42 16Z"
        fill="url(#huskGreenReal)"
      />
      {/* Husk texture */}
      <Path d="M8 26C10 34 12 42 14 48" stroke="#689F38" strokeWidth="0.5" opacity="0.4" />
      <Path d="M56 26C54 34 52 42 50 48" stroke="#689F38" strokeWidth="0.5" opacity="0.4" />
    </G>
    
    {/* Outer husk layers */}
    <Path
      d="M20 14C12 8 4 12 2 20C0 28 6 36 12 38C14 28 18 20 20 14Z"
      fill="#8BC34A"
    />
    <Path
      d="M44 14C52 8 60 12 62 20C64 28 58 36 52 38C50 28 46 20 44 14Z"
      fill="#AED581"
    />
    
    {/* Corn cob base */}
    <Path
      d="M22 16C18 18 16 32 18 46C20 56 28 60 32 60C36 60 44 56 46 46C48 32 46 18 42 16C38 14 26 14 22 16Z"
      fill="url(#cornCobReal)"
    />
    
    {/* Corn kernels - realistic staggered rows */}
    <G>
      {/* Row 1 */}
      <Ellipse cx="24" cy="22" rx="3.5" ry="4" fill="url(#kernelGoldReal)" />
      <Ellipse cx="32" cy="20" rx="3.5" ry="4" fill="url(#kernelYellowReal)" />
      <Ellipse cx="40" cy="22" rx="3.5" ry="4" fill="url(#kernelGoldReal)" />
      
      {/* Row 2 - staggered */}
      <Ellipse cx="20" cy="30" rx="3.2" ry="3.8" fill="url(#kernelYellowReal)" />
      <Ellipse cx="28" cy="28" rx="3.5" ry="4" fill="url(#kernelGoldReal)" />
      <Ellipse cx="36" cy="28" rx="3.5" ry="4" fill="url(#kernelGoldReal)" />
      <Ellipse cx="44" cy="30" rx="3.2" ry="3.8" fill="url(#kernelYellowReal)" />
      
      {/* Row 3 */}
      <Ellipse cx="24" cy="36" rx="3.5" ry="4" fill="url(#kernelGoldReal)" />
      <Ellipse cx="32" cy="36" rx="3.5" ry="4" fill="url(#kernelYellowReal)" />
      <Ellipse cx="40" cy="36" rx="3.5" ry="4" fill="url(#kernelGoldReal)" />
      
      {/* Row 4 - staggered */}
      <Ellipse cx="20" cy="44" rx="3.2" ry="3.8" fill="url(#kernelYellowReal)" />
      <Ellipse cx="28" cy="44" rx="3.5" ry="4" fill="url(#kernelGoldReal)" />
      <Ellipse cx="36" cy="44" rx="3.5" ry="4" fill="url(#kernelGoldReal)" />
      <Ellipse cx="44" cy="44" rx="3.2" ry="3.8" fill="url(#kernelYellowReal)" />
      
      {/* Row 5 */}
      <Ellipse cx="26" cy="52" rx="3.2" ry="3.5" fill="url(#kernelGoldReal)" />
      <Ellipse cx="32" cy="54" rx="3" ry="3.5" fill="url(#kernelYellowReal)" />
      <Ellipse cx="38" cy="52" rx="3.2" ry="3.5" fill="url(#kernelGoldReal)" />
      
      {/* Kernel highlights */}
      <Circle cx="23" cy="21" r="1" fill="#FFFDE7" opacity="0.4" />
      <Circle cx="31" cy="19" r="1" fill="#FFFDE7" opacity="0.4" />
      <Circle cx="27" cy="27" r="0.8" fill="#FFFDE7" opacity="0.4" />
      <Circle cx="35" cy="35" r="0.8" fill="#FFFDE7" opacity="0.4" />
    </G>
    
    {/* Silk/hair at top - corn silk */}
    <G>
      <Path d="M26 16C24 12 22 6 24 2" stroke="#F9A825" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M28 14C28 10 26 4 28 0" stroke="#FDD835" strokeWidth="1" strokeLinecap="round" />
      <Path d="M32 14C32 8 32 2 34 0" stroke="#FFEB3B" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M36 14C36 10 38 4 36 0" stroke="#FDD835" strokeWidth="1" strokeLinecap="round" />
      <Path d="M38 16C40 12 42 6 40 2" stroke="#F9A825" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M30 16C28 14 26 10 28 6" stroke="#FFD54F" strokeWidth="0.8" strokeLinecap="round" />
      <Path d="M34 16C36 14 38 10 36 6" stroke="#FFD54F" strokeWidth="0.8" strokeLinecap="round" />
    </G>
  </Svg>
);

export default CornIllustration;
