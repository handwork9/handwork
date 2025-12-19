import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface BeansIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const BeansIllustration: React.FC<BeansIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#8B4513',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Multiple beans scattered */}
      
      {/* Bean 1 - brown */}
      <G>
        <Ellipse cx="20" cy="20" rx="8" ry="5" fill={color} transform="rotate(-20 20 20)" />
        <Path
          d="M14 18C14 18 18 20 26 18"
          stroke="#5D3A1A"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Ellipse cx="20" cy="19" rx="2" ry="1" fill="#A0522D" opacity={0.5} />
      </G>
      
      {/* Bean 2 - honey brown */}
      <G>
        <Ellipse cx="40" cy="16" rx="7" ry="4.5" fill="#CD853F" transform="rotate(15 40 16)" />
        <Path
          d="M34 15C34 15 38 17 46 14"
          stroke="#8B6914"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Ellipse cx="40" cy="15" rx="1.5" ry="0.8" fill="#DEB887" opacity={0.5} />
      </G>
      
      {/* Bean 3 - dark brown */}
      <G>
        <Ellipse cx="14" cy="38" rx="7" ry="4.5" fill="#654321" transform="rotate(-30 14 38)" />
        <Path
          d="M8 36C8 36 12 38 20 36"
          stroke="#3D2314"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Ellipse cx="14" cy="37" rx="1.5" ry="0.8" fill="#8B4513" opacity={0.5} />
      </G>
      
      {/* Bean 4 - red/kidney bean */}
      <G>
        <Ellipse cx="32" cy="32" rx="9" ry="5.5" fill="#8B0000" transform="rotate(10 32 32)" />
        <Path
          d="M24 31C24 31 30 34 40 30"
          stroke="#5C0000"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Ellipse cx="32" cy="31" rx="2" ry="1" fill="#A52A2A" opacity={0.5} />
      </G>
      
      {/* Bean 5 - black-eyed pea */}
      <G>
        <Ellipse cx="50" cy="36" rx="7" ry="4.5" fill="#F5DEB3" transform="rotate(-15 50 36)" />
        <Circle cx="50" cy="36" r="2" fill="#333" />
        <Path
          d="M44 35C44 35 48 37 56 34"
          stroke="#D2B48C"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </G>
      
      {/* Bean 6 - brown */}
      <G>
        <Ellipse cx="28" cy="50" rx="8" ry="5" fill={color} transform="rotate(25 28 50)" />
        <Path
          d="M21 49C21 49 26 52 35 48"
          stroke="#5D3A1A"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Ellipse cx="28" cy="49" rx="2" ry="1" fill="#A0522D" opacity={0.5} />
      </G>
      
      {/* Bean 7 - small honey bean */}
      <G>
        <Ellipse cx="48" cy="52" rx="6" ry="4" fill="#DEB887" transform="rotate(-10 48 52)" />
        <Path
          d="M43 51C43 51 46 53 53 51"
          stroke="#CD853F"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </G>
      
      {/* Bean 8 - small red */}
      <G>
        <Ellipse cx="56" cy="24" rx="5" ry="3" fill="#A52A2A" transform="rotate(30 56 24)" />
        <Path
          d="M52 23C52 23 55 25 60 23"
          stroke="#800000"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

export default BeansIllustration;
