import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const BuyerIllustration: React.FC<IllustrationProps> = ({
  width = 80,
  height = 80,
  color = '#16A34A'
}) => (
  <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#059669" />
      </LinearGradient>
      <LinearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FDBF6F" />
        <Stop offset="100%" stopColor="#E8A654" />
      </LinearGradient>
    </Defs>

    {/* Person - Body */}
    <Path
      d="M40 75C40 75 25 72 22 60C19 48 22 40 22 40L28 38L40 42L52 38L58 40C58 40 61 48 58 60C55 72 40 75 40 75Z"
      fill="url(#bagGradient)"
    />

    {/* Person - Head */}
    <Circle cx="40" cy="22" r="14" fill="url(#skinGradient)" />

    {/* Hair */}
    <Path
      d="M28 18C28 12 33 8 40 8C47 8 52 12 52 18C52 18 50 14 40 14C30 14 28 18 28 18Z"
      fill="#3D2314"
    />
    <Path
      d="M26 22C26 22 26 16 30 12C28 16 27 20 27 22"
      fill="#3D2314"
    />
    <Path
      d="M54 22C54 22 54 16 50 12C52 16 53 20 53 22"
      fill="#3D2314"
    />

    {/* Face - Eyes */}
    <Ellipse cx="35" cy="22" rx="2" ry="2.5" fill="#3D2314" />
    <Ellipse cx="45" cy="22" rx="2" ry="2.5" fill="#3D2314" />
    <Circle cx="34" cy="21" r="0.8" fill="#FFFFFF" />
    <Circle cx="44" cy="21" r="0.8" fill="#FFFFFF" />

    {/* Smile */}
    <Path
      d="M36 28C36 28 38 31 40 31C42 31 44 28 44 28"
      stroke="#3D2314"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Shopping Bag */}
    <G transform="translate(48, 42)">
      {/* Bag body */}
      <Rect x="0" y="8" width="22" height="24" rx="3" fill="#F59E0B" />
      <Rect x="2" y="10" width="18" height="20" rx="2" fill="#FCD34D" opacity="0.3" />
      {/* Bag handles */}
      <Path
        d="M5 8C5 4 8 2 11 2C14 2 17 4 17 8"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Items peeking out */}
      <Circle cx="7" cy="6" r="4" fill="#EF4444" />
      <Circle cx="15" cy="5" r="3" fill="#22C55E" />
      <Path
        d="M11 3L11 0"
        stroke="#22C55E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </G>

    {/* Hand holding bag */}
    <Path
      d="M52 52C52 52 56 50 58 52C60 54 58 58 56 58"
      fill="url(#skinGradient)"
    />

    {/* Phone in other hand */}
    <G transform="translate(8, 48)">
      <Rect x="0" y="0" width="12" height="20" rx="2" fill="#1F2937" />
      <Rect x="1" y="2" width="10" height="14" rx="1" fill="#60A5FA" />
      <Circle cx="6" cy="18" r="1.5" fill="#374151" />
    </G>

    {/* Other hand */}
    <Path
      d="M22 52C22 52 18 50 16 52C14 54 16 60 18 60"
      fill="url(#skinGradient)"
    />

    {/* Collar detail */}
    <Path
      d="M35 38L40 42L45 38"
      stroke="#059669"
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

export default BuyerIllustration;
