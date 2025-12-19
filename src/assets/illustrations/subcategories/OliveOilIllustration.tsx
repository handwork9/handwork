import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic olive oil - green-gold oil in elegant bottle
const OliveOilIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="oliveOilColor" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#C5E1A5" />
        <Stop offset="30%" stopColor="#AED581" />
        <Stop offset="60%" stopColor="#9CCC65" />
        <Stop offset="100%" stopColor="#7CB342" />
      </LinearGradient>
      <LinearGradient id="oliveOilGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD54F" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#FFC107" stopOpacity="0.2" />
      </LinearGradient>
      <LinearGradient id="oliveBottleGlass" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
      </LinearGradient>
      <LinearGradient id="oliveCork" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="50%" stopColor="#BCAAA4" />
        <Stop offset="100%" stopColor="#A1887F" />
      </LinearGradient>
      <LinearGradient id="oliveGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#8BC34A" />
        <Stop offset="50%" stopColor="#689F38" />
        <Stop offset="100%" stopColor="#558B2F" />
      </LinearGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="26" cy="62" rx="10" ry="2" fill="#33691E" opacity="0.2" />
    
    {/* Elegant bottle shape */}
    <G>
      {/* Bottle body - tapered elegant shape */}
      <Path
        d="M18 28C16 24 18 20 22 18L24 10C24 8 25 6 26 6L30 6C31 6 32 8 32 10L34 18C38 20 40 24 38 28L36 56C36 60 32 62 26 62C20 62 16 60 18 56L18 28Z"
        fill="url(#oliveOilColor)"
      />
      
      {/* Golden hue overlay */}
      <Path
        d="M20 30C20 26 22 22 26 20L28 56C22 56 20 54 20 52L20 30Z"
        fill="url(#oliveOilGold)"
      />
      
      {/* Glass reflection */}
      <Path
        d="M22 30L22 52C22 50 24 30 22 30Z"
        fill="url(#oliveBottleGlass)"
      />
      
      {/* Oil surface */}
      <Ellipse cx="26" cy="18" rx="6" ry="1.5" fill="#C5E1A5" opacity="0.7" />
    </G>
    
    {/* Bottle neck */}
    <Path
      d="M24 6L24 2L32 2L32 6"
      fill="#AED581"
    />
    
    {/* Cork stopper */}
    <G>
      <Path
        d="M24 2L24 -2C24 -4 25 -4 28 -4C31 -4 32 -4 32 -2L32 2"
        fill="url(#oliveCork)"
      />
      <Ellipse cx="28" cy="-2" rx="4" ry="1.5" fill="#D7CCC8" />
      {/* Cork texture */}
      <Path d="M26 0L30 0" stroke="#8D6E63" strokeWidth="0.3" opacity="0.5" />
      <Path d="M25 -2L31 -2" stroke="#8D6E63" strokeWidth="0.3" opacity="0.4" />
    </G>
    
    {/* Label */}
    <G>
      <Path
        d="M20 36L36 36L36 52L20 52Z"
        fill="#FFF8E1"
        opacity="0.85"
      />
      {/* Olive branch icon */}
      <Path d="M24 44L32 44" stroke="#33691E" strokeWidth="1" />
      <Ellipse cx="26" cy="42" rx="2" ry="2.5" fill="url(#oliveGreen)" />
      <Ellipse cx="30" cy="42" rx="2" ry="2.5" fill="#689F38" />
      <Path d="M25 40L23 38" stroke="#558B2F" strokeWidth="0.8" />
      <Path d="M31 40L33 38" stroke="#558B2F" strokeWidth="0.8" />
    </G>
    
    {/* Olive branch with olives */}
    <G>
      <Path d="M44 32C50 30 56 34 58 40C56 46 50 48 48 44" stroke="#5D4037" strokeWidth="1.5" fill="none" />
      {/* Leaves */}
      <Path d="M46 34C48 32 50 34 48 36C46 38 44 36 46 34Z" fill="#8BC34A" />
      <Path d="M52 36C54 34 56 36 54 38C52 40 50 38 52 36Z" fill="#7CB342" />
      <Path d="M50 42C52 40 54 42 52 44C50 46 48 44 50 42Z" fill="#689F38" />
      {/* Olives */}
      <Ellipse cx="48" cy="40" rx="3" ry="4" fill="url(#oliveGreen)" />
      <Ellipse cx="54" cy="44" rx="2.5" ry="3.5" fill="#558B2F" />
      {/* Olive highlights */}
      <Ellipse cx="47" cy="38" rx="1" ry="1.5" fill="#AED581" opacity="0.4" />
      <Ellipse cx="53" cy="42" rx="0.8" ry="1.2" fill="#8BC34A" opacity="0.4" />
    </G>
    
    {/* Oil drizzle */}
    <Path
      d="M40 24C42 28 40 32 38 34"
      stroke="url(#oliveOilColor)"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
  </Svg>
);

export default OliveOilIllustration;
