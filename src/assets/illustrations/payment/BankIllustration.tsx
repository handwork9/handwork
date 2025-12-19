import React from 'react';
import Svg, { Path, Rect, G, Defs, LinearGradient, Stop, Circle, Ellipse } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const BankIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#34C759'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="bankRoofGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#2DA94F" />
      </LinearGradient>
      <LinearGradient id="bankBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#F5F5F5" />
        <Stop offset="100%" stopColor="#E8E8E8" />
      </LinearGradient>
      <LinearGradient id="pillarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E0E0E0" />
        <Stop offset="50%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E0E0E0" />
      </LinearGradient>
      <LinearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="50%" stopColor="#FFF8DC" />
        <Stop offset="100%" stopColor="#DAA520" />
      </LinearGradient>
      <LinearGradient id="doorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#4A5568" />
        <Stop offset="100%" stopColor="#2D3748" />
      </LinearGradient>
    </Defs>

    {/* Building Shadow */}
    <Ellipse cx="24" cy="44" rx="18" ry="3" fill="#000000" opacity="0.1" />

    {/* Base/Foundation */}
    <Rect x="5" y="38" width="38" height="4" rx="1" fill="#D1D5DB" />
    <Rect x="5" y="38" width="38" height="1.5" fill="#E5E7EB" />

    {/* Main Building Body */}
    <Rect x="7" y="18" width="34" height="20" fill="url(#bankBodyGradient)" />

    {/* Pillars */}
    <G>
      {/* Left Pillar */}
      <Rect x="10" y="18" width="4" height="20" fill="url(#pillarGradient)" />
      <Rect x="10" y="18" width="4" height="2" fill="#D1D5DB" />
      <Rect x="10" y="36" width="4" height="2" fill="#D1D5DB" />
      
      {/* Center-Left Pillar */}
      <Rect x="18" y="18" width="4" height="20" fill="url(#pillarGradient)" />
      <Rect x="18" y="18" width="4" height="2" fill="#D1D5DB" />
      <Rect x="18" y="36" width="4" height="2" fill="#D1D5DB" />
      
      {/* Center-Right Pillar */}
      <Rect x="26" y="18" width="4" height="20" fill="url(#pillarGradient)" />
      <Rect x="26" y="18" width="4" height="2" fill="#D1D5DB" />
      <Rect x="26" y="36" width="4" height="2" fill="#D1D5DB" />
      
      {/* Right Pillar */}
      <Rect x="34" y="18" width="4" height="20" fill="url(#pillarGradient)" />
      <Rect x="34" y="18" width="4" height="2" fill="#D1D5DB" />
      <Rect x="34" y="36" width="4" height="2" fill="#D1D5DB" />
    </G>

    {/* Door */}
    <Rect x="20" y="28" width="8" height="10" rx="1" fill="url(#doorGradient)" />
    <Circle cx="26" cy="33" r="0.8" fill="url(#goldGradient)" />

    {/* Architrave (beam above pillars) */}
    <Rect x="5" y="15" width="38" height="3" fill="#E5E7EB" />
    <Rect x="5" y="15" width="38" height="1" fill="#F3F4F6" />

    {/* Triangular Roof (Pediment) */}
    <Path
      d="M4 15L24 4L44 15H4Z"
      fill="url(#bankRoofGradient)"
    />
    <Path
      d="M6 15L24 5.5L42 15"
      stroke="#FFFFFF"
      strokeWidth="0.5"
      opacity="0.5"
    />

    {/* Roof Trim */}
    <Path
      d="M4 15H44"
      stroke="#2DA94F"
      strokeWidth="1"
    />

    {/* Dollar/Currency Symbol in Pediment */}
    <G transform="translate(20, 8)">
      <Circle cx="4" cy="3" r="4" fill="#FFFFFF" opacity="0.2" />
      <Path
        d="M4 0V6M2 1.5C2 1.5 2 1 4 1C6 1 6 2.5 4 2.5C2 2.5 2 4 4 4C6 4 6 4.5 6 4.5"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </G>

    {/* Decorative Elements on Roof */}
    <Circle cx="24" cy="4" r="1.5" fill="url(#goldGradient)" />

    {/* Steps */}
    <G>
      <Rect x="16" y="42" width="16" height="2" rx="0.5" fill="#D1D5DB" />
      <Rect x="14" y="44" width="20" height="2" rx="0.5" fill="#E5E7EB" />
    </G>

    {/* Window accents */}
    <G opacity="0.6">
      <Rect x="11" y="22" width="2" height="4" rx="0.5" fill="#9CA3AF" />
      <Rect x="35" y="22" width="2" height="4" rx="0.5" fill="#9CA3AF" />
    </G>
  </Svg>
);

export default BankIllustration;
