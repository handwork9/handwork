import React from 'react';
import Svg, { Path, Circle, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';

interface ProductIllustrationProps {
  size?: number;
}

// Tomato
export const TomatoIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="tomato_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF6B6B" />
        <Stop offset="100%" stopColor="#E53935" />
      </LinearGradient>
    </Defs>
    <Circle cx="20" cy="22" r="15" fill="url(#tomato_body)" />
    <Ellipse cx="20" cy="22" rx="15" ry="13" fill="#EF5350" />
    <Path d="M16 10 Q18 6 20 8 Q22 6 24 10" stroke="#4CAF50" strokeWidth="2" fill="none" />
    <Path d="M20 8 L20 5" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
    <Path d="M18 6 Q20 3 22 6" fill="#66BB6A" />
    <Ellipse cx="14" cy="18" rx="3" ry="4" fill="#FFCDD2" opacity={0.4} />
  </Svg>
);

// Pepper
export const PepperIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="pepper_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF7043" />
        <Stop offset="100%" stopColor="#E64A19" />
      </LinearGradient>
    </Defs>
    <Path d="M20 8 Q28 12 26 25 Q24 35 20 36 Q16 35 14 25 Q12 12 20 8" fill="url(#pepper_body)" />
    <Path d="M18 6 L20 8 L22 6 Q20 4 18 6" fill="#4CAF50" />
    <Path d="M20 4 L20 2" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" />
    <Ellipse cx="16" cy="18" rx="2" ry="5" fill="#FFCCBC" opacity={0.3} />
  </Svg>
);

// Onion
export const OnionIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="onion_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFF3E0" />
        <Stop offset="100%" stopColor="#FFCC80" />
      </LinearGradient>
    </Defs>
    <Ellipse cx="20" cy="24" rx="12" ry="14" fill="url(#onion_body)" />
    <Path d="M12 20 Q20 15 28 20" stroke="#FFE0B2" strokeWidth="1" fill="none" />
    <Path d="M10 24 Q20 18 30 24" stroke="#FFE0B2" strokeWidth="1" fill="none" />
    <Path d="M18 10 Q20 4 22 10" stroke="#66BB6A" strokeWidth="2" fill="none" />
    <Path d="M16 12 Q20 2 24 12" stroke="#81C784" strokeWidth="1.5" fill="none" />
    <Ellipse cx="15" cy="22" rx="2" ry="4" fill="#FFF8E1" opacity={0.5} />
  </Svg>
);

// Cabbage
export const CabbageIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="cabbage_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#A5D6A7" />
        <Stop offset="100%" stopColor="#66BB6A" />
      </LinearGradient>
    </Defs>
    <Circle cx="20" cy="22" r="14" fill="url(#cabbage_body)" />
    <Path d="M10 18 Q20 12 30 18" stroke="#81C784" strokeWidth="2" fill="none" />
    <Path d="M12 24 Q20 18 28 24" stroke="#81C784" strokeWidth="2" fill="none" />
    <Path d="M14 30 Q20 24 26 30" stroke="#81C784" strokeWidth="2" fill="none" />
    <Circle cx="20" cy="20" r="6" fill="#C8E6C9" />
    <Circle cx="20" cy="20" r="3" fill="#E8F5E9" />
  </Svg>
);

// Corn
export const CornIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="corn_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFEE58" />
        <Stop offset="100%" stopColor="#FBC02D" />
      </LinearGradient>
    </Defs>
    <Path d="M15 10 Q14 20 15 32 Q20 36 25 32 Q26 20 25 10 Q20 6 15 10" fill="url(#corn_body)" />
    <Circle cx="17" cy="14" r="2" fill="#F9A825" />
    <Circle cx="23" cy="14" r="2" fill="#F9A825" />
    <Circle cx="17" cy="20" r="2" fill="#F9A825" />
    <Circle cx="23" cy="20" r="2" fill="#F9A825" />
    <Circle cx="20" cy="17" r="2" fill="#F9A825" />
    <Circle cx="20" cy="23" r="2" fill="#F9A825" />
    <Circle cx="17" cy="26" r="2" fill="#F9A825" />
    <Circle cx="23" cy="26" r="2" fill="#F9A825" />
    <Path d="M12 8 Q8 4 6 8 Q10 10 14 10" fill="#66BB6A" />
    <Path d="M28 8 Q32 4 34 8 Q30 10 26 10" fill="#81C784" />
    <Path d="M20 6 Q20 2 22 4 Q20 6 18 4 Q20 2 20 6" fill="#4CAF50" />
  </Svg>
);

// Carrot
export const CarrotIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="carrot_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FF8A65" />
        <Stop offset="100%" stopColor="#E64A19" />
      </LinearGradient>
    </Defs>
    <Path d="M20 10 Q26 18 24 32 Q20 38 16 32 Q14 18 20 10" fill="url(#carrot_body)" />
    <Path d="M18 32 L19 28 M20 32 L20 26 M22 32 L21 28" stroke="#BF360C" strokeWidth="0.8" />
    <Path d="M17 10 Q20 5 23 10" fill="#4CAF50" />
    <Path d="M15 8 Q20 2 25 8" fill="#66BB6A" />
    <Path d="M18 6 Q20 1 22 6" fill="#81C784" />
  </Svg>
);

// Banana
export const BananaIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="banana_body" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#FFE082" />
        <Stop offset="100%" stopColor="#FFC107" />
      </LinearGradient>
    </Defs>
    <Path d="M8 28 Q5 20 12 12 Q20 6 28 10 Q32 14 30 20 Q28 16 20 14 Q12 14 10 24 Q9 28 8 28" fill="url(#banana_body)" />
    <Path d="M28 10 Q30 8 32 10" fill="#8D6E63" />
    <Path d="M8 28 Q6 30 8 32" fill="#5D4037" />
  </Svg>
);

// Orange
export const OrangeIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="orange_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFB74D" />
        <Stop offset="100%" stopColor="#F57C00" />
      </LinearGradient>
    </Defs>
    <Circle cx="20" cy="22" r="14" fill="url(#orange_body)" />
    <Ellipse cx="16" cy="18" rx="3" ry="4" fill="#FFCC80" opacity={0.4} />
    <Path d="M20 8 L20 6" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
    <Ellipse cx="20" cy="6" rx="3" ry="2" fill="#66BB6A" />
  </Svg>
);

// Lettuce
export const LettuceIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="lettuce_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#AED581" />
        <Stop offset="100%" stopColor="#7CB342" />
      </LinearGradient>
    </Defs>
    <Path d="M8 25 Q6 18 12 12 Q20 8 28 12 Q34 18 32 25 Q28 32 20 34 Q12 32 8 25" fill="url(#lettuce_body)" />
    <Path d="M10 22 Q14 16 20 14 Q26 16 30 22" stroke="#8BC34A" strokeWidth="2" fill="none" />
    <Path d="M12 26 Q16 20 20 18 Q24 20 28 26" stroke="#9CCC65" strokeWidth="2" fill="none" />
    <Circle cx="20" cy="24" r="5" fill="#C5E1A5" />
  </Svg>
);

// Potato
export const PotatoIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="potato_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#D7CCC8" />
        <Stop offset="100%" stopColor="#A1887F" />
      </LinearGradient>
    </Defs>
    <Ellipse cx="20" cy="22" rx="14" ry="12" fill="url(#potato_body)" />
    <Circle cx="14" cy="18" r="1.5" fill="#8D6E63" />
    <Circle cx="24" cy="20" r="1.5" fill="#8D6E63" />
    <Circle cx="18" cy="26" r="1" fill="#8D6E63" />
    <Circle cx="26" cy="24" r="1" fill="#8D6E63" />
    <Ellipse cx="16" cy="20" rx="3" ry="4" fill="#EFEBE9" opacity={0.3} />
  </Svg>
);

// Watermelon
export const WatermelonIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="watermelon_rind" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#388E3C" />
      </LinearGradient>
      <LinearGradient id="watermelon_flesh" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#EF5350" />
        <Stop offset="100%" stopColor="#E53935" />
      </LinearGradient>
    </Defs>
    <Path d="M5 25 Q20 5 35 25 L35 28 Q20 32 5 28 Z" fill="url(#watermelon_rind)" />
    <Path d="M7 25 Q20 8 33 25 L33 26 Q20 30 7 26 Z" fill="url(#watermelon_flesh)" />
    <Circle cx="14" cy="22" r="1.5" fill="#212121" />
    <Circle cx="20" cy="20" r="1.5" fill="#212121" />
    <Circle cx="26" cy="22" r="1.5" fill="#212121" />
    <Circle cx="17" cy="18" r="1" fill="#212121" />
    <Circle cx="23" cy="18" r="1" fill="#212121" />
  </Svg>
);

// Ginger
export const GingerIllustration: React.FC<ProductIllustrationProps> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="ginger_body" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#FFCC80" />
        <Stop offset="100%" stopColor="#FF8F00" />
      </LinearGradient>
    </Defs>
    <Path d="M15 15 Q10 18 8 25 Q10 30 15 28 Q18 26 20 28 Q24 30 28 26 Q32 20 28 15 Q24 12 20 15 Q17 12 15 15" fill="url(#ginger_body)" />
    <Path d="M12 20 Q14 18 16 20" stroke="#E65100" strokeWidth="0.8" fill="none" />
    <Path d="M22 18 Q24 16 26 18" stroke="#E65100" strokeWidth="0.8" fill="none" />
    <Path d="M18 24 Q20 22 22 24" stroke="#E65100" strokeWidth="0.8" fill="none" />
  </Svg>
);

// Map product names to illustrations
export const getProductIllustration = (productName: string, size?: number) => {
  const name = productName.toLowerCase();
  if (name.includes('tomato')) return <TomatoIllustration size={size} />;
  if (name.includes('pepper')) return <PepperIllustration size={size} />;
  if (name.includes('onion')) return <OnionIllustration size={size} />;
  if (name.includes('cabbage')) return <CabbageIllustration size={size} />;
  if (name.includes('corn')) return <CornIllustration size={size} />;
  if (name.includes('carrot')) return <CarrotIllustration size={size} />;
  if (name.includes('banana')) return <BananaIllustration size={size} />;
  if (name.includes('orange')) return <OrangeIllustration size={size} />;
  if (name.includes('lettuce') || name.includes('salad')) return <LettuceIllustration size={size} />;
  if (name.includes('potato')) return <PotatoIllustration size={size} />;
  if (name.includes('watermelon') || name.includes('melon')) return <WatermelonIllustration size={size} />;
  if (name.includes('ginger')) return <GingerIllustration size={size} />;
  // Default to tomato
  return <TomatoIllustration size={size} />;
};

export default {
  TomatoIllustration,
  PepperIllustration,
  OnionIllustration,
  CabbageIllustration,
  CornIllustration,
  CarrotIllustration,
  BananaIllustration,
  OrangeIllustration,
  LettuceIllustration,
  PotatoIllustration,
  WatermelonIllustration,
  GingerIllustration,
  getProductIllustration,
};
