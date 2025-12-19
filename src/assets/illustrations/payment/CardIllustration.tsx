import React from 'react';
import Svg, { Path, Rect, G, Defs, LinearGradient, Stop, Circle, Text as SvgText } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const CardIllustration: React.FC<IllustrationProps> = ({
  width = 48,
  height = 48,
  color = '#34C759'
}) => (
  <Svg width={width} height={height} viewBox="0 0 48 48" fill="none">
    <Defs>
      <LinearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor="#2DA94F" />
      </LinearGradient>
      <LinearGradient id="cardShine" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </LinearGradient>
      <LinearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFD700" />
        <Stop offset="100%" stopColor="#DAA520" />
      </LinearGradient>
    </Defs>

    {/* Card Shadow */}
    <Rect x="6" y="12" width="38" height="26" rx="4" fill="#000000" opacity="0.1" />

    {/* Main Card Body */}
    <Rect x="4" y="10" width="38" height="26" rx="4" fill="url(#cardGradient)" />

    {/* Card Shine Effect */}
    <Rect x="4" y="10" width="38" height="13" rx="4" fill="url(#cardShine)" />

    {/* EMV Chip */}
    <G transform="translate(9, 16)">
      <Rect width="8" height="6" rx="1" fill="url(#chipGradient)" />
      {/* Chip Lines */}
      <Path d="M1 2H7" stroke="#B8860B" strokeWidth="0.5" />
      <Path d="M1 4H7" stroke="#B8860B" strokeWidth="0.5" />
      <Path d="M4 0.5V5.5" stroke="#B8860B" strokeWidth="0.5" />
    </G>

    {/* Contactless Symbol */}
    <G transform="translate(34, 14)">
      <Path
        d="M2 6C3.5 4.5 3.5 2.5 2 1"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      <Path
        d="M4 7C6.5 4.5 6.5 1.5 4 -1"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <Path
        d="M6 8C9.5 4.5 9.5 0.5 6 -3"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </G>

    {/* Card Number Dots */}
    <G transform="translate(9, 26)">
      {[0, 1, 2, 3].map((i) => (
        <Circle key={`dot1-${i}`} cx={i * 3} cy="0" r="1" fill="#FFFFFF" opacity="0.9" />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Circle key={`dot2-${i}`} cx={14 + i * 3} cy="0" r="1" fill="#FFFFFF" opacity="0.9" />
      ))}
    </G>

    {/* Last 4 Digits */}
    <SvgText
      x="35"
      y="27"
      fill="#FFFFFF"
      fontSize="5"
      fontWeight="bold"
      opacity="0.9"
    >
      1234
    </SvgText>

    {/* Card Brand Logo Area */}
    <G transform="translate(32, 30)">
      <Circle cx="3" cy="2" r="3" fill="#EB001B" opacity="0.9" />
      <Circle cx="7" cy="2" r="3" fill="#F79E1B" opacity="0.9" />
    </G>

    {/* Decorative Corner Accent */}
    <Path
      d="M38 10H42C42 10 42 10 42 14V10"
      stroke="#FFFFFF"
      strokeWidth="0.5"
      strokeLinecap="round"
      opacity="0.3"
    />
  </Svg>
);

export default CardIllustration;
