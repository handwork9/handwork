import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Rect } from 'react-native-svg';

interface StockfishIllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

const StockfishIllustration: React.FC<StockfishIllustrationProps> = ({
  width = 64,
  height = 64,
  color = '#D4C4A8',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
      {/* Stockfish - dried/preserved fish, typically pale/white */}
      
      {/* First stockfish - stiff, dried */}
      <G>
        <Path
          d="M6 24C6 24 14 18 26 18C38 18 48 22 50 26C48 30 38 32 26 32C14 32 6 28 6 24Z"
          fill={color}
          opacity={0.95}
        />
        
        {/* Dried texture */}
        <Path
          d="M12 22C12 22 20 22 30 24"
          stroke="#B8A88C"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <Path
          d="M14 28C14 28 24 28 36 26"
          stroke="#B8A88C"
          strokeWidth={1}
          strokeLinecap="round"
        />
        
        {/* Tail - stiff */}
        <Path
          d="M6 24C6 24 2 20 2 18C4 20 6 22 6 24"
          fill={color}
          opacity={0.9}
        />
        <Path
          d="M6 24C6 24 2 28 2 30C4 28 6 26 6 24"
          fill={color}
          opacity={0.9}
        />
        
        {/* Head */}
        <Ellipse cx="48" cy="24" rx="4" ry="5" fill={color} />
        <Circle cx="49" cy="22" r="1.5" fill="#333" opacity={0.5} />
      </G>
      
      {/* Second stockfish */}
      <G>
        <Path
          d="M10 42C10 42 18 36 30 36C42 36 52 40 54 44C52 48 42 50 30 50C18 50 10 46 10 42Z"
          fill="#C8B898"
          opacity={0.9}
        />
        
        {/* Texture */}
        <Path
          d="M16 40C16 40 24 40 34 42"
          stroke="#A89878"
          strokeWidth={1}
          strokeLinecap="round"
        />
        <Path
          d="M18 46C18 46 28 46 40 44"
          stroke="#A89878"
          strokeWidth={1}
          strokeLinecap="round"
        />
        
        {/* Tail */}
        <Path
          d="M10 42C10 42 6 38 4 36C6 38 8 40 10 42"
          fill="#C8B898"
          opacity={0.85}
        />
        <Path
          d="M10 42C10 42 6 46 4 48C6 46 8 44 10 42"
          fill="#C8B898"
          opacity={0.85}
        />
        
        {/* Head */}
        <Ellipse cx="52" cy="42" rx="4" ry="5" fill="#C8B898" />
        <Circle cx="53" cy="40" r="1.5" fill="#333" opacity={0.5} />
      </G>
      
      {/* String/rope tying them (traditional storage) */}
      <Path
        d="M26 14C26 14 28 16 28 18"
        stroke="#8B7355"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M30 32C30 32 32 34 32 36"
        stroke="#8B7355"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M26 14C26 14 28 10 32 10C36 10 38 14 38 14"
        stroke="#8B7355"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Hanging hook */}
      <Path
        d="M32 6C32 6 32 10 32 10"
        stroke="#666"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx="32" cy="4" r="2" fill="#666" />
    </Svg>
  );
};

export default StockfishIllustration;
