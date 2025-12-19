import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Realistic cassava/yuca tubers with characteristic bark and pink inner layer
const CassavaRealisticIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="cassavaBarkOuter" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8D7B68" />
        <Stop offset="30%" stopColor="#7C6A56" />
        <Stop offset="60%" stopColor="#6B5B4C" />
        <Stop offset="100%" stopColor="#5C4D3D" />
      </LinearGradient>
      <LinearGradient id="cassavaBarkDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6B5B4C" />
        <Stop offset="50%" stopColor="#5C4D3D" />
        <Stop offset="100%" stopColor="#4A3F32" />
      </LinearGradient>
      <RadialGradient id="cassavaFleshWhite" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="30%" stopColor="#FEFEFE" />
        <Stop offset="60%" stopColor="#F8F8F8" />
        <Stop offset="100%" stopColor="#F0F0F0" />
      </RadialGradient>
      <LinearGradient id="cassavaPinkLayer" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#E8B4B8" />
        <Stop offset="50%" stopColor="#D4A5A8" />
        <Stop offset="100%" stopColor="#C49698" />
      </LinearGradient>
      <LinearGradient id="cassavaCore" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#E8E8E8" />
        <Stop offset="50%" stopColor="#D8D8D8" />
        <Stop offset="100%" stopColor="#C8C8C8" />
      </LinearGradient>
    </Defs>
    
    {/* Shadow */}
    <Ellipse cx="32" cy="60" rx="26" ry="3" fill="#3E2723" opacity="0.15" />
    
    {/* Main cassava tuber 1 - elongated cylindrical */}
    <G>
      <Path
        d="M4 28C2 24 4 18 10 16C16 14 48 14 56 20C62 26 62 36 58 40C52 44 18 46 10 42C4 38 2 34 4 28Z"
        fill="url(#cassavaBarkOuter)"
      />
      
      {/* Bark texture - rough peeling patches */}
      <Path d="M12 20C24 18 44 18 54 24" stroke="#4A3F32" strokeWidth="0.8" opacity="0.5" />
      <Path d="M8 30C22 26 46 28 58 34" stroke="#4A3F32" strokeWidth="0.6" opacity="0.4" />
      <Path d="M10 38C26 34 46 36 54 40" stroke="#4A3F32" strokeWidth="0.5" opacity="0.35" />
      
      {/* Characteristic bark peeling showing pink layer */}
      <Path
        d="M20 22C24 20 30 22 28 26C26 28 20 26 20 22Z"
        fill="url(#cassavaPinkLayer)"
        opacity="0.7"
      />
      <Path
        d="M42 26C46 24 50 26 48 30C46 32 42 30 42 26Z"
        fill="url(#cassavaPinkLayer)"
        opacity="0.6"
      />
      <Path
        d="M30 34C34 32 38 34 36 38C34 40 30 38 30 34Z"
        fill="url(#cassavaPinkLayer)"
        opacity="0.5"
      />
      
      {/* Darker underside */}
      <Path
        d="M8 36C14 42 30 44 48 42C54 40 58 38 58 36"
        fill="url(#cassavaBarkDark)"
        opacity="0.4"
      />
      
      {/* Woody stem end */}
      <Circle cx="58" cy="30" r="4" fill="#5C4D3D" />
      <Circle cx="58" cy="30" r="2.5" fill="#4A3F32" />
      
      {/* Cut stem mark at other end */}
      <Ellipse cx="6" cy="30" rx="2" ry="4" fill="#5C4D3D" />
    </G>
    
    {/* Second cassava tuber - slightly behind */}
    <G>
      <Path
        d="M8 48C6 44 10 40 18 40C28 40 46 42 52 46C56 50 54 56 48 58C40 60 16 58 10 54C6 52 6 50 8 48Z"
        fill="url(#cassavaBarkDark)"
      />
      <Path d="M16 44C28 42 44 44 50 48" stroke="#4A3F32" strokeWidth="0.5" opacity="0.4" />
      
      {/* Pink patch */}
      <Path
        d="M28 46C32 44 36 46 34 50C32 52 28 50 28 46Z"
        fill="url(#cassavaPinkLayer)"
        opacity="0.5"
      />
      
      {/* Stem end */}
      <Circle cx="52" cy="50" r="3" fill="#4A3F32" />
    </G>
    
    {/* Cut cassava piece showing white flesh */}
    <G>
      <Path
        d="M50 6C48 2 52 -2 60 0C68 2 70 10 66 14C62 18 54 16 50 12C48 10 48 8 50 6Z"
        fill="url(#cassavaBarkOuter)"
      />
      
      {/* Pink layer ring */}
      <Ellipse cx="58" cy="8" rx="7" ry="8" fill="none" stroke="url(#cassavaPinkLayer)" strokeWidth="2" />
      
      {/* White flesh */}
      <Ellipse cx="58" cy="8" rx="5.5" ry="6.5" fill="url(#cassavaFleshWhite)" />
      
      {/* Fibrous center core */}
      <Ellipse cx="58" cy="8" rx="1.5" ry="2" fill="url(#cassavaCore)" />
      
      {/* Radial fibers in flesh */}
      <Path d="M54 4L58 8L54 12" stroke="#E8E8E8" strokeWidth="0.4" opacity="0.5" />
      <Path d="M62 4L58 8L62 12" stroke="#E8E8E8" strokeWidth="0.4" opacity="0.5" />
      <Path d="M58 2L58 8" stroke="#E8E8E8" strokeWidth="0.3" opacity="0.4" />
      <Path d="M58 14L58 8" stroke="#E8E8E8" strokeWidth="0.3" opacity="0.4" />
      
      {/* Outer bark ring */}
      <Ellipse cx="58" cy="8" rx="7" ry="8" fill="none" stroke="#6B5B4C" strokeWidth="1.2" />
      
      {/* Moisture highlight */}
      <Ellipse cx="56" cy="6" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.4" />
    </G>
    
    {/* Small peeled bark piece */}
    <G opacity="0.6">
      <Path
        d="M36 18C38 16 42 18 40 22C38 24 34 22 36 18Z"
        fill="#7C6A56"
      />
    </G>
  </Svg>
);

export default CassavaRealisticIllustration;
