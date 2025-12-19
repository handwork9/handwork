import React from 'react';
import Svg, { Path, Ellipse, Rect, G } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const GrainsIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#FFB300' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    {/* Wheat stalk 1 */}
    <Path
      d="M16 58V30"
      stroke="#8D6E63"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <G>
      {[0, 1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <Ellipse
            cx={12}
            cy={28 - i * 5}
            rx="4"
            ry="2.5"
            fill={color}
            transform={`rotate(-30 12 ${28 - i * 5})`}
          />
          <Ellipse
            cx={20}
            cy={28 - i * 5}
            rx="4"
            ry="2.5"
            fill={color}
            transform={`rotate(30 20 ${28 - i * 5})`}
          />
        </React.Fragment>
      ))}
    </G>
    {/* Wheat stalk 2 */}
    <Path
      d="M32 58V32"
      stroke="#8D6E63"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <G>
      {[0, 1, 2, 3, 4].map((i) => (
        <React.Fragment key={`s2-${i}`}>
          <Ellipse
            cx={28}
            cy={30 - i * 5}
            rx="4"
            ry="2.5"
            fill={color}
            transform={`rotate(-30 28 ${30 - i * 5})`}
          />
          <Ellipse
            cx={36}
            cy={30 - i * 5}
            rx="4"
            ry="2.5"
            fill={color}
            transform={`rotate(30 36 ${30 - i * 5})`}
          />
        </React.Fragment>
      ))}
    </G>
    {/* Wheat stalk 3 */}
    <Path
      d="M48 58V28"
      stroke="#8D6E63"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <G>
      {[0, 1, 2, 3, 4].map((i) => (
        <React.Fragment key={`s3-${i}`}>
          <Ellipse
            cx={44}
            cy={26 - i * 5}
            rx="4"
            ry="2.5"
            fill={color}
            transform={`rotate(-30 44 ${26 - i * 5})`}
          />
          <Ellipse
            cx={52}
            cy={26 - i * 5}
            rx="4"
            ry="2.5"
            fill={color}
            transform={`rotate(30 52 ${26 - i * 5})`}
          />
        </React.Fragment>
      ))}
    </G>
  </Svg>
);

export default GrainsIllustration;
