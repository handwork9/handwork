import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface TurkeyIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const TurkeyIllustration: React.FC<TurkeyIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#8B4513',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Tail feathers - fan shape */}
      <G>
        <Path
          d="M8 24C8 24 12 8 20 6C24 6 24 12 20 18C16 24 8 24 8 24Z"
          fill="#D2691E"
        />
        <Path
          d="M12 28C12 28 10 12 18 8C22 8 24 14 20 22C16 30 12 28 12 28Z"
          fill={color}
        />
        <Path
          d="M16 30C16 30 10 16 16 10C20 8 24 14 22 24C20 32 16 30 16 30Z"
          fill="#A0522D"
        />
        <Path
          d="M20 32C20 32 12 20 18 12C22 10 26 16 24 26C22 34 20 32 20 32Z"
          fill="#CD853F"
        />
        <Path
          d="M24 32C24 32 18 22 22 14C26 12 30 18 28 28C26 34 24 32 24 32Z"
          fill={color}
        />
      </G>
      
      {/* Body */}
      <Ellipse
        cx="36"
        cy="40"
        rx="14"
        ry="12"
        fill={color}
      />
      
      {/* Wing */}
      <Path
        d="M28 38C28 38 32 34 38 36C44 38 46 44 42 46C38 48 28 44 28 38Z"
        fill="#A0522D"
      />
      <Path
        d="M30 40C30 40 34 38 38 40"
        stroke="#8B4513"
        strokeWidth={1}
        strokeLinecap="round"
      />
      <Path
        d="M32 44C32 44 36 42 40 44"
        stroke="#8B4513"
        strokeWidth={1}
        strokeLinecap="round"
      />
      
      {/* Neck */}
      <Path
        d="M46 36C46 36 50 32 52 26C54 22 54 18 52 16"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
      />
      
      {/* Head */}
      <Circle cx="52" cy="14" r="6" fill="#A0522D" />
      
      {/* Snood (red thing) */}
      <Path
        d="M54 16C54 16 56 20 54 24C52 26 50 24 50 22"
        fill="#DC143C"
      />
      
      {/* Wattle */}
      <Path
        d="M48 16C48 16 46 18 46 22C46 24 48 24 50 22"
        fill="#DC143C"
      />
      
      {/* Beak */}
      <Path
        d="M56 12C56 12 60 12 60 14C60 16 56 16 56 14"
        fill="#F4A460"
      />
      
      {/* Eye */}
      <Circle cx="54" cy="12" r="2" fill="#333" />
      <Circle cx="54.5" cy="11.5" r="0.7" fill="#FFF" />
      
      {/* Legs */}
      <Path
        d="M32 50C32 50 30 56 28 60"
        stroke="#F4A460"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M28 60C28 60 24 62 26 62C28 62 30 60 28 60Z"
        fill="#F4A460"
      />
      
      <Path
        d="M40 50C40 50 42 56 44 60"
        stroke="#F4A460"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M44 60C44 60 48 62 46 62C44 62 42 60 44 60Z"
        fill="#F4A460"
      />
    </Svg>
  );
};

export default TurkeyIllustration;
