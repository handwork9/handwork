import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const FarmerIllustration: React.FC<IllustrationProps> = ({
  width = 80,
  height = 80,
  color = '#10B981'
}) => (
  <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="shirtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#3B82F6" />
        <Stop offset="100%" stopColor="#1D4ED8" />
      </LinearGradient>
      <LinearGradient id="farmerSkinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FDBF6F" />
        <Stop offset="100%" stopColor="#D4915A" />
      </LinearGradient>
      <LinearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#059669" />
      </LinearGradient>
    </Defs>

    {/* Sun in background */}
    <Circle cx="65" cy="12" r="8" fill="#FCD34D" />
    <G opacity="0.4">
      <Path d="M65 0V4" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M65 20V24" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M53 12H57" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
      <Path d="M73 12H77" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" />
    </G>

    {/* Ground/Field */}
    <Path
      d="M0 70C0 70 20 68 40 68C60 68 80 70 80 70V80H0V70Z"
      fill="#8B5A2B"
    />
    <Path
      d="M0 68C0 68 20 66 40 66C60 66 80 68 80 68V72H0V68Z"
      fill="#A0522D"
    />

    {/* Plant/Crops behind farmer */}
    <G transform="translate(60, 45)">
      <Path d="M8 25V15" stroke="#059669" strokeWidth="2" />
      <Path d="M8 20C8 20 4 18 2 14C0 10 2 6 6 8C6 8 4 4 8 2C12 0 14 4 14 8C14 8 18 6 18 10C18 14 14 16 12 18" fill="url(#leafGradient)" />
      <Circle cx="8" cy="8" r="3" fill="#EF4444" />
    </G>

    {/* Person - Body (overalls) */}
    <Path
      d="M40 75C40 75 25 72 22 62C19 52 22 44 22 44L28 42L40 46L52 42L58 44C58 44 61 52 58 62C55 72 40 75 40 75Z"
      fill="#1E3A8A"
    />

    {/* Overalls straps */}
    <Path d="M30 44L34 58" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
    <Path d="M50 44L46 58" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />

    {/* Shirt underneath */}
    <Path
      d="M32 44C32 44 36 48 40 48C44 48 48 44 48 44L40 46L32 44Z"
      fill="url(#shirtGradient)"
    />

    {/* Person - Head */}
    <Circle cx="40" cy="24" r="14" fill="url(#farmerSkinGradient)" />

    {/* Straw Hat */}
    <Ellipse cx="40" cy="14" rx="18" ry="6" fill="#D4A853" />
    <Ellipse cx="40" cy="14" rx="12" ry="4" fill="#C9983A" />
    <Path
      d="M28 14C28 14 30 6 40 6C50 6 52 14 52 14"
      fill="#E5BE6A"
    />
    <Path
      d="M32 10L34 6M40 9V5M46 10L48 6"
      stroke="#C9983A"
      strokeWidth="1"
      strokeLinecap="round"
    />

    {/* Face - Eyes */}
    <Ellipse cx="35" cy="24" rx="2" ry="2.5" fill="#3D2314" />
    <Ellipse cx="45" cy="24" rx="2" ry="2.5" fill="#3D2314" />
    <Circle cx="34" cy="23" r="0.8" fill="#FFFFFF" />
    <Circle cx="44" cy="23" r="0.8" fill="#FFFFFF" />

    {/* Smile */}
    <Path
      d="M36 30C36 30 38 33 40 33C42 33 44 30 44 30"
      stroke="#3D2314"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Rosy cheeks */}
    <Circle cx="30" cy="28" r="3" fill="#F87171" opacity="0.3" />
    <Circle cx="50" cy="28" r="3" fill="#F87171" opacity="0.3" />

    {/* Basket with vegetables */}
    <G transform="translate(2, 50)">
      {/* Basket */}
      <Path
        d="M4 12C4 12 2 24 8 26C14 28 24 28 30 26C36 24 34 12 34 12L4 12Z"
        fill="#D4A853"
      />
      <Path d="M4 12H34" stroke="#C9983A" strokeWidth="2" />
      <Path d="M6 16H32" stroke="#C9983A" strokeWidth="1.5" opacity="0.6" />
      <Path d="M8 20H30" stroke="#C9983A" strokeWidth="1.5" opacity="0.6" />

      {/* Vegetables in basket */}
      <Circle cx="12" cy="8" r="5" fill="#EF4444" />
      <Circle cx="11" cy="6" r="1" fill="#FCA5A5" opacity="0.5" />
      <Circle cx="22" cy="9" r="4" fill="#F97316" />
      <Path d="M22 5L22 3L24 4" fill="#22C55E" />
      <Ellipse cx="17" cy="6" rx="3" ry="4" fill="#A855F7" />
      <Path d="M17 2L17 0" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="28" cy="7" r="3" fill="#22C55E" />
    </G>

    {/* Hand holding basket */}
    <Path
      d="M22 54C22 54 16 52 14 54C12 56 14 62 16 62"
      fill="url(#farmerSkinGradient)"
    />

    {/* Pitchfork/Tool in other hand */}
    <G transform="translate(54, 34)">
      <Rect x="0" y="8" width="3" height="30" rx="1" fill="#8B5A2B" />
      <Path d="M-2 8L1.5 0L5 8" stroke="#6B7280" strokeWidth="2" fill="none" />
      <Path d="M-2 8V12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
      <Path d="M5 8V12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
    </G>

    {/* Other hand */}
    <Path
      d="M54 48C54 48 58 46 60 48C62 50 60 56 58 56"
      fill="url(#farmerSkinGradient)"
    />
  </Svg>
);

export default FarmerIllustration;
