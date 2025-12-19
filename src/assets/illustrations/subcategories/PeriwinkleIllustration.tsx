import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface PeriwinkleIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const PeriwinkleIllustration: React.FC<PeriwinkleIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#4A6741',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Multiple periwinkle shells */}
      
      {/* Main large shell */}
      <G>
        {/* Shell spiral */}
        <Ellipse cx="32" cy="36" rx="14" ry="16" fill={color} />
        <Ellipse cx="30" cy="34" rx="10" ry="12" fill="#5A7751" />
        <Ellipse cx="28" cy="32" rx="6" ry="8" fill="#3A5731" />
        <Ellipse cx="27" cy="30" rx="3" ry="4" fill="#2A4721" />
        
        {/* Shell opening */}
        <Path
          d="M40 44C40 44 44 40 44 36C44 32 42 28 38 28C34 28 32 32 32 36C32 40 36 44 40 44Z"
          fill="#8B7355"
          opacity={0.8}
        />
        
        {/* Shell ridges */}
        <Path
          d="M20 38C20 38 26 46 38 48"
          stroke="#3A5731"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.6}
        />
        <Path
          d="M22 30C22 30 30 36 40 36"
          stroke="#3A5731"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.6}
        />
      </G>
      
      {/* Small shell 1 */}
      <G>
        <Ellipse cx="12" cy="24" rx="6" ry="7" fill="#5A7751" />
        <Ellipse cx="11" cy="23" rx="4" ry="5" fill="#4A6741" />
        <Ellipse cx="10" cy="22" rx="2" ry="3" fill="#3A5731" />
        <Path
          d="M16 28C16 28 18 26 18 24C18 22 16 20 14 20"
          fill="#8B7355"
          opacity={0.7}
        />
      </G>
      
      {/* Small shell 2 */}
      <G>
        <Ellipse cx="52" cy="28" rx="6" ry="7" fill="#4A6741" />
        <Ellipse cx="51" cy="27" rx="4" ry="5" fill="#5A7751" />
        <Ellipse cx="50" cy="26" rx="2" ry="3" fill="#3A5731" />
        <Path
          d="M56 32C56 32 58 30 58 28C58 26 56 24 54 24"
          fill="#8B7355"
          opacity={0.7}
        />
      </G>
      
      {/* Small shell 3 */}
      <G>
        <Ellipse cx="16" cy="52" rx="5" ry="6" fill="#5A7751" />
        <Ellipse cx="15" cy="51" rx="3" ry="4" fill="#4A6741" />
        <Ellipse cx="14" cy="50" rx="1.5" ry="2" fill="#3A5731" />
      </G>
      
      {/* Small shell 4 */}
      <G>
        <Ellipse cx="48" cy="52" rx="5" ry="6" fill="#4A6741" />
        <Ellipse cx="47" cy="51" rx="3" ry="4" fill="#5A7751" />
        <Ellipse cx="46" cy="50" rx="1.5" ry="2" fill="#3A5731" />
      </G>
      
      {/* Small shell 5 */}
      <G>
        <Ellipse cx="32" cy="56" rx="4" ry="5" fill="#5A7751" />
        <Ellipse cx="31" cy="55" rx="2.5" ry="3" fill="#4A6741" />
      </G>
      
      {/* Water drops/wet look */}
      <Circle cx="24" cy="40" r="1.5" fill="#87CEEB" opacity={0.5} />
      <Circle cx="38" cy="30" r="1" fill="#87CEEB" opacity={0.4} />
      <Circle cx="44" cy="48" r="1.5" fill="#87CEEB" opacity={0.5} />
    </Svg>
  );
};

export default PeriwinkleIllustration;
