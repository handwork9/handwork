import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const RiderIllustration: React.FC<IllustrationProps> = ({
  width = 80,
  height = 80,
  color = '#F59E0B'
}) => (
  <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
    <Defs>
      <LinearGradient id="riderJacketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#D97706" />
      </LinearGradient>
      <LinearGradient id="riderSkinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FDBF6F" />
        <Stop offset="100%" stopColor="#E8A654" />
      </LinearGradient>
      <LinearGradient id="bikeFrameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#374151" />
        <Stop offset="100%" stopColor="#1F2937" />
      </LinearGradient>
    </Defs>

    {/* Speed lines */}
    <G opacity="0.3">
      <Path d="M2 30H10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M0 40H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 50H12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </G>

    {/* Motorcycle/Bike */}
    <G transform="translate(15, 48)">
      {/* Rear wheel */}
      <Circle cx="8" cy="22" r="10" fill="#1F2937" />
      <Circle cx="8" cy="22" r="8" fill="#374151" />
      <Circle cx="8" cy="22" r="3" fill="#6B7280" />
      {/* Spokes */}
      <G stroke="#4B5563" strokeWidth="1">
        <Path d="M8 14V30" />
        <Path d="M0 22H16" />
        <Path d="M2 16L14 28" />
        <Path d="M14 16L2 28" />
      </G>

      {/* Front wheel */}
      <Circle cx="48" cy="22" r="10" fill="#1F2937" />
      <Circle cx="48" cy="22" r="8" fill="#374151" />
      <Circle cx="48" cy="22" r="3" fill="#6B7280" />
      {/* Spokes */}
      <G stroke="#4B5563" strokeWidth="1">
        <Path d="M48 14V30" />
        <Path d="M40 22H56" />
        <Path d="M42 16L54 28" />
        <Path d="M54 16L42 28" />
      </G>

      {/* Bike frame */}
      <Path
        d="M8 22L24 10L48 22"
        stroke="url(#bikeFrameGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M24 10L32 6L42 10"
        stroke="url(#bikeFrameGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Seat */}
      <Ellipse cx="24" cy="6" rx="6" ry="3" fill="#1F2937" />

      {/* Handlebar */}
      <Path
        d="M40 4L46 2L52 6"
        stroke="#6B7280"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Engine/Body */}
      <Path
        d="M16 14C16 14 20 12 28 12C36 12 40 14 40 14L38 20L18 20L16 14Z"
        fill="url(#riderJacketGradient)"
      />
    </G>

    {/* Delivery Box */}
    <G transform="translate(4, 32)">
      <Rect x="0" y="0" width="20" height="18" rx="2" fill="#16A34A" />
      <Rect x="2" y="2" width="16" height="14" rx="1" fill="#22C55E" opacity="0.3" />
      {/* Box straps */}
      <Path d="M4 0V-4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 0V-4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
      {/* Logo on box */}
      <Circle cx="10" cy="9" r="4" fill="#FFFFFF" opacity="0.9" />
      <Path d="M8 9L10 11L14 7" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </G>

    {/* Rider body */}
    <G transform="translate(25, 20)">
      {/* Torso/Jacket */}
      <Path
        d="M12 28C12 28 4 26 2 20C0 14 4 6 4 6L10 4L12 8L14 4L20 6C20 6 24 14 22 20C20 26 12 28 12 28Z"
        fill="url(#riderJacketGradient)"
      />

      {/* Jacket details */}
      <Path d="M8 8V20" stroke="#D97706" strokeWidth="1.5" />
      <Path d="M16 8V20" stroke="#D97706" strokeWidth="1.5" />

      {/* Head */}
      <Circle cx="12" cy="-4" r="10" fill="url(#riderSkinGradient)" />

      {/* Helmet */}
      <Path
        d="M2 -6C2 -14 6 -18 12 -18C18 -18 22 -14 22 -6C22 -6 20 -8 12 -8C4 -8 2 -6 2 -6Z"
        fill="#1F2937"
      />
      <Path
        d="M2 -6C2 -6 4 -4 12 -4C20 -4 22 -6 22 -6"
        stroke="#4B5563"
        strokeWidth="2"
      />
      {/* Visor */}
      <Path
        d="M4 -8C4 -8 6 -6 12 -6C18 -6 20 -8 20 -8L20 -4L4 -4L4 -8Z"
        fill="#60A5FA"
        opacity="0.7"
      />

      {/* Face visible through visor */}
      <Ellipse cx="9" cy="-2" rx="1.5" ry="2" fill="#3D2314" />
      <Ellipse cx="15" cy="-2" rx="1.5" ry="2" fill="#3D2314" />

      {/* Arms on handlebar */}
      <Path
        d="M20 10C20 10 26 14 28 18C30 22 28 26 28 26"
        fill="url(#riderSkinGradient)"
      />
      <Path
        d="M4 10C4 10 -2 14 -4 18C-6 22 -4 26 -4 26"
        fill="url(#riderSkinGradient)"
      />

      {/* Gloves */}
      <Circle cx="28" cy="26" r="3" fill="#1F2937" />
      <Circle cx="-4" cy="26" r="3" fill="#1F2937" />
    </G>

    {/* Motion blur effect on wheels */}
    <G opacity="0.2">
      <Ellipse cx="23" cy="70" rx="12" ry="3" fill={color} />
      <Ellipse cx="63" cy="70" rx="12" ry="3" fill={color} />
    </G>
  </Svg>
);

export default RiderIllustration;
