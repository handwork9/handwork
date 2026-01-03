import React from 'react';
import Svg, { Path, Circle, Ellipse, G, Defs, LinearGradient, Stop, RadialGradient } from 'react-native-svg';

interface IllustrationProps {
  width?: number;
  height?: number;
  color?: string;
}

// Ultra-realistic vegetables illustration - broccoli, tomato, carrot, bell pepper
const VegetablesIllustration: React.FC<IllustrationProps> = ({ 
  width = 64, 
  height = 64, 
  color = '#4CAF50' 
}) => (
  <Svg width={width} height={height} viewBox="0 0 64 64" fill="none">
    <Defs>
      {/* Tomato gradients - photorealistic red */}
      <RadialGradient id="vegTomatoBody" cx="35%" cy="30%" r="65%">
        <Stop offset="0%" stopColor="#FF5252" />
        <Stop offset="25%" stopColor="#F44336" />
        <Stop offset="50%" stopColor="#E53935" />
        <Stop offset="75%" stopColor="#D32F2F" />
        <Stop offset="100%" stopColor="#B71C1C" />
      </RadialGradient>
      <RadialGradient id="vegTomatoShine" cx="25%" cy="25%" r="40%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
        <Stop offset="50%" stopColor="#FFCDD2" stopOpacity="0.3" />
        <Stop offset="100%" stopColor="#FFCDD2" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="vegTomatoBottom" cx="50%" cy="80%" r="50%">
        <Stop offset="0%" stopColor="#C62828" stopOpacity="0.5" />
        <Stop offset="100%" stopColor="#B71C1C" stopOpacity="0" />
      </RadialGradient>
      
      {/* Carrot gradients - realistic orange with depth */}
      <LinearGradient id="vegCarrotBody" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#EF6C00" />
        <Stop offset="30%" stopColor="#FF9800" />
        <Stop offset="50%" stopColor="#FFB74D" />
        <Stop offset="70%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#E65100" />
      </LinearGradient>
      <LinearGradient id="vegCarrotTip" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF9800" />
        <Stop offset="100%" stopColor="#BF360C" />
      </LinearGradient>
      <LinearGradient id="vegCarrotLeaf" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#388E3C" />
        <Stop offset="50%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#81C784" />
      </LinearGradient>
      
      {/* Bell pepper gradients - glossy yellow/red */}
      <RadialGradient id="vegPepperBody" cx="30%" cy="25%" r="70%">
        <Stop offset="0%" stopColor="#FFEE58" />
        <Stop offset="30%" stopColor="#FFCA28" />
        <Stop offset="60%" stopColor="#FFB300" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </RadialGradient>
      <RadialGradient id="vegPepperShine" cx="20%" cy="20%" r="35%">
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
      <LinearGradient id="vegPepperStem" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#33691E" />
        <Stop offset="50%" stopColor="#558B2F" />
        <Stop offset="100%" stopColor="#7CB342" />
      </LinearGradient>
      
      {/* Broccoli gradients - realistic green florets */}
      <RadialGradient id="vegBroccoliFloret" cx="40%" cy="30%" r="60%">
        <Stop offset="0%" stopColor="#A5D6A7" />
        <Stop offset="30%" stopColor="#81C784" />
        <Stop offset="60%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#388E3C" />
      </RadialGradient>
      <RadialGradient id="vegBroccoliFloretDark" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#66BB6A" />
        <Stop offset="50%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </RadialGradient>
      <LinearGradient id="vegBroccoliStem" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#558B2F" />
        <Stop offset="30%" stopColor="#7CB342" />
        <Stop offset="50%" stopColor="#8BC34A" />
        <Stop offset="70%" stopColor="#7CB342" />
        <Stop offset="100%" stopColor="#558B2F" />
      </LinearGradient>
    </Defs>
    
    {/* === BROCCOLI - Top Left === */}
    <G>
      {/* Main stem with realistic shape */}
      <Path
        d="M10 58L11 48C11 46 12 44 13 44C14 44 15 46 15 48L16 58"
        fill="url(#vegBroccoliStem)"
      />
      {/* Stem texture lines */}
      <Path d="M11.5 56L11 50" stroke="#558B2F" strokeWidth="0.4" opacity="0.5" />
      <Path d="M14.5 56L15 50" stroke="#558B2F" strokeWidth="0.4" opacity="0.5" />
      
      {/* Large floret clusters - layered for 3D effect */}
      {/* Back layer */}
      <Circle cx="6" cy="38" r="5" fill="url(#vegBroccoliFloretDark)" />
      <Circle cx="20" cy="38" r="5" fill="url(#vegBroccoliFloretDark)" />
      <Circle cx="13" cy="34" r="6" fill="url(#vegBroccoliFloretDark)" />
      
      {/* Middle layer */}
      <Circle cx="8" cy="36" r="5.5" fill="url(#vegBroccoliFloret)" />
      <Circle cx="18" cy="36" r="5.5" fill="url(#vegBroccoliFloret)" />
      <Circle cx="13" cy="32" r="6.5" fill="url(#vegBroccoliFloret)" />
      
      {/* Front layer - smaller florets for detail */}
      <Circle cx="5" cy="40" r="3" fill="#81C784" />
      <Circle cx="10" cy="34" r="3.5" fill="#A5D6A7" />
      <Circle cx="16" cy="34" r="3.5" fill="#A5D6A7" />
      <Circle cx="21" cy="40" r="3" fill="#81C784" />
      <Circle cx="13" cy="28" r="4" fill="#C8E6C9" />
      
      {/* Tiny floret bumps for realistic texture */}
      <Circle cx="7" cy="35" r="1.2" fill="#66BB6A" />
      <Circle cx="11" cy="32" r="1" fill="#66BB6A" />
      <Circle cx="15" cy="32" r="1" fill="#66BB6A" />
      <Circle cx="19" cy="35" r="1.2" fill="#66BB6A" />
      <Circle cx="13" cy="30" r="1.3" fill="#81C784" />
      <Circle cx="9" cy="38" r="0.8" fill="#4CAF50" />
      <Circle cx="17" cy="38" r="0.8" fill="#4CAF50" />
      
      {/* Shadow dots for depth */}
      <Circle cx="8" cy="39" r="0.5" fill="#2E7D32" opacity="0.4" />
      <Circle cx="14" cy="36" r="0.5" fill="#2E7D32" opacity="0.4" />
      <Circle cx="18" cy="39" r="0.5" fill="#2E7D32" opacity="0.4" />
    </G>
    
    {/* === TOMATO - Center === */}
    <G>
      {/* Main tomato body - perfectly round with slight bottom indent */}
      <Path
        d="M24 42C24 34 29 28 38 28C47 28 52 34 52 42C52 50 47 56 38 56C29 56 24 50 24 42Z"
        fill="url(#vegTomatoBody)"
      />
      
      {/* Tomato segment creases - subtle lines */}
      <Path d="M28 38C32 36 36 35 38 40" stroke="#C62828" strokeWidth="0.5" opacity="0.25" />
      <Path d="M38 40C40 35 44 36 48 38" stroke="#C62828" strokeWidth="0.5" opacity="0.25" />
      <Path d="M30 46C34 44 38 43 38 40" stroke="#C62828" strokeWidth="0.4" opacity="0.2" />
      <Path d="M38 40C38 43 42 44 46 46" stroke="#C62828" strokeWidth="0.4" opacity="0.2" />
      
      {/* Bottom shadow/crease */}
      <Ellipse cx="38" cy="52" rx="8" ry="3" fill="url(#vegTomatoBottom)" />
      
      {/* Main shine highlight */}
      <Ellipse cx="32" cy="34" rx="5" ry="4" fill="url(#vegTomatoShine)" />
      {/* Secondary small highlight */}
      <Circle cx="44" cy="36" r="2" fill="#FFFFFF" opacity="0.2" />
      
      {/* Green calyx (star-shaped top) */}
      <Ellipse cx="38" cy="28" rx="6" ry="2.5" fill="#2E7D32" />
      
      {/* Sepals - 5 pointed star leaves */}
      <Path d="M32 28C30 26 28 23 30 22C32 22 33 25 34 27" fill="#4CAF50" />
      <Path d="M35 27C35 24 36 20 38 20C40 20 41 24 41 27" fill="#66BB6A" />
      <Path d="M42 27C43 25 44 22 46 22C48 23 46 26 44 28" fill="#4CAF50" />
      <Path d="M30 30C28 29 26 27 27 26C29 26 31 28 32 30" fill="#388E3C" />
      <Path d="M44 30C46 28 47 26 49 27C49 28 47 30 46 30" fill="#388E3C" />
      
      {/* Center stem */}
      <Ellipse cx="38" cy="26" rx="2" ry="1" fill="#33691E" />
      <Path d="M38 26L38 22" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
      <Path d="M38 22L37 20" stroke="#4E342E" strokeWidth="1" strokeLinecap="round" />
    </G>
    
    {/* === CARROT - Right Side === */}
    <G>
      {/* Main carrot body - tapered cone shape */}
      <Path
        d="M54 14C51 14 49 18 49 24C49 32 50 40 51 48C52 54 53 60 53.5 62C54 60 55 54 56 48C57 40 58 32 58 24C58 18 56 14 53 14L54 14Z"
        fill="url(#vegCarrotBody)"
      />
      
      {/* Carrot ring lines - horizontal texture */}
      <Path d="M49.5 20C51 19.5 55 19.5 57.5 20" stroke="#E65100" strokeWidth="0.5" opacity="0.35" />
      <Path d="M49.5 26C51 25.5 55.5 25.5 57.5 26" stroke="#E65100" strokeWidth="0.5" opacity="0.35" />
      <Path d="M50 32C51.5 31.5 55 31.5 57 32" stroke="#E65100" strokeWidth="0.5" opacity="0.35" />
      <Path d="M50.5 38C52 37.5 54.5 37.5 56.5 38" stroke="#E65100" strokeWidth="0.5" opacity="0.35" />
      <Path d="M51 44C52 43.5 54.5 43.5 56 44" stroke="#E65100" strokeWidth="0.5" opacity="0.35" />
      <Path d="M51.5 50C52.5 49.5 54 49.5 55.5 50" stroke="#E65100" strokeWidth="0.5" opacity="0.35" />
      <Path d="M52 56C52.5 55.5 54 55.5 55 56" stroke="#E65100" strokeWidth="0.5" opacity="0.35" />
      
      {/* Left edge highlight */}
      <Path d="M50 18C50 24 50.5 32 51 42C51.5 50 52 56 52.5 60" stroke="#FFE0B2" strokeWidth="1.5" opacity="0.45" strokeLinecap="round" />
      
      {/* Right edge shadow */}
      <Path d="M57 18C57 24 56.5 32 56 42" stroke="#BF360C" strokeWidth="0.8" opacity="0.3" strokeLinecap="round" />
      
      {/* Carrot tip */}
      <Path d="M52.5 60C53 62 53.5 63 53.5 63C53.5 63 54 62 54.5 60" fill="url(#vegCarrotTip)" />
      
      {/* Leafy green tops - feathery carrot leaves */}
      <G>
        {/* Main center leaves */}
        <Path d="M53.5 14C53 10 52 6 50 2" stroke="url(#vegCarrotLeaf)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <Path d="M53.5 14C54 10 55 6 57 2" stroke="url(#vegCarrotLeaf)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <Path d="M53.5 14C53.5 8 53.5 4 53.5 0" stroke="url(#vegCarrotLeaf)" strokeWidth="2" strokeLinecap="round" fill="none" />
        
        {/* Side leaves - feathery */}
        <Path d="M53.5 14C51 12 48 10 46 8" stroke="#66BB6A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <Path d="M53.5 14C56 12 59 10 61 8" stroke="#66BB6A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        
        {/* Smaller feather leaves */}
        <Path d="M51 8C50 6 48 4 47 3" stroke="#81C784" strokeWidth="1" strokeLinecap="round" fill="none" />
        <Path d="M56 8C57 6 59 4 60 3" stroke="#81C784" strokeWidth="1" strokeLinecap="round" fill="none" />
        <Path d="M52 5C51 3 50 2 49 1" stroke="#A5D6A7" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        <Path d="M55 5C56 3 57 2 58 1" stroke="#A5D6A7" strokeWidth="0.8" strokeLinecap="round" fill="none" />
        
        {/* Crown base */}
        <Ellipse cx="53.5" cy="14" rx="3" ry="1.5" fill="#558B2F" />
      </G>
    </G>
    
    {/* === YELLOW BELL PEPPER - Bottom Left === */}
    <G>
      {/* Main pepper body - rounded bell shape with lobes */}
      <Path
        d="M4 52C3 46 4 40 8 36C12 33 18 33 22 36C26 40 27 46 26 52C26 58 22 62 15 62C8 62 4 58 4 52Z"
        fill="url(#vegPepperBody)"
      />
      
      {/* Pepper lobe creases */}
      <Path d="M8 42C10 40 14 39 15 44" stroke="#FF8F00" strokeWidth="0.6" opacity="0.3" />
      <Path d="M15 44C16 39 20 40 22 42" stroke="#FF8F00" strokeWidth="0.6" opacity="0.3" />
      <Path d="M6 52C10 50 15 49 15 44" stroke="#FF8F00" strokeWidth="0.5" opacity="0.25" />
      <Path d="M15 44C15 49 20 50 24 52" stroke="#FF8F00" strokeWidth="0.5" opacity="0.25" />
      
      {/* Bottom lobe lines */}
      <Path d="M8 56C11 54 14 54 15 56" stroke="#E65100" strokeWidth="0.4" opacity="0.2" />
      <Path d="M15 56C16 54 19 54 22 56" stroke="#E65100" strokeWidth="0.4" opacity="0.2" />
      
      {/* Main glossy highlight */}
      <Ellipse cx="10" cy="42" rx="4" ry="6" fill="url(#vegPepperShine)" />
      {/* Secondary highlight */}
      <Ellipse cx="20" cy="44" rx="2" ry="3" fill="#FFFFFF" opacity="0.15" />
      
      {/* Green stem */}
      <Path d="M15 36L15 30" stroke="url(#vegPepperStem)" strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Stem cap (calyx) */}
      <Ellipse cx="15" cy="30" rx="4" ry="2" fill="#7CB342" />
      <Ellipse cx="15" cy="30" rx="2.5" ry="1" fill="#8BC34A" />
      
      {/* Stem indent at top of pepper */}
      <Path d="M12 36C13 34 15 33 17 34C18 35 18 36 18 36" fill="#689F38" />
      
      {/* Tiny stem tip */}
      <Circle cx="15" cy="29" r="1" fill="#558B2F" />
    </G>
  </Svg>
);

export default VegetablesIllustration;
