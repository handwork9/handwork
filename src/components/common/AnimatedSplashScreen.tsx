import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { 
  Path, 
  Circle, 
  G, 
  Rect, 
  Ellipse,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  ClipPath,
  Text as SvgText,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const GLOBE_SIZE = 180;
const ORBIT_SIZE = GLOBE_SIZE + 80;

interface AnimatedSplashScreenProps {
  onAnimationComplete?: () => void;
}

// Animated SVG components
const AnimatedG = Animated.createAnimatedComponent(G);

// Delivery Bike SVG Component - Realistic motorcycle with rider and delivery box
const DeliveryBikeIcon = ({ size = 40, wheelRotation = 0 }: { size?: number; wheelRotation?: number }) => {
  const wheelRotationDeg = `${wheelRotation}deg`;
  
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 120 90">
      <Defs>
        <SvgLinearGradient id="bikeBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#2E7D32" />
          <Stop offset="100%" stopColor="#1B5E20" />
        </SvgLinearGradient>
        <SvgLinearGradient id="boxGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FF7043" />
          <Stop offset="100%" stopColor="#E64A19" />
        </SvgLinearGradient>
        <SvgLinearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#424242" />
          <Stop offset="100%" stopColor="#212121" />
        </SvgLinearGradient>
        <SvgLinearGradient id="helmetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#43A047" />
          <Stop offset="100%" stopColor="#2E7D32" />
        </SvgLinearGradient>
      </Defs>
      
      <G>
        {/* Motion blur/speed lines */}
        <G opacity="0.6">
          <Path d="M2 45 L12 45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <Path d="M0 52 L8 52" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <Path d="M4 59 L10 59" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <Path d="M2 38 L9 38" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </G>
        
        {/* Rear wheel with rotation */}
        <G rotation={wheelRotation} origin="30, 65">
          {/* Tire */}
          <Circle cx="30" cy="65" r="18" fill="url(#wheelGradient)" />
          <Circle cx="30" cy="65" r="15" fill="none" stroke="#616161" strokeWidth="6" />
          {/* Tire tread */}
          <Circle cx="30" cy="65" r="17" fill="none" stroke="#37474F" strokeWidth="2" strokeDasharray="3 2" />
          {/* Rim */}
          <Circle cx="30" cy="65" r="10" fill="#757575" />
          <Circle cx="30" cy="65" r="8" fill="#BDBDBD" />
          {/* Hub */}
          <Circle cx="30" cy="65" r="4" fill="#424242" />
          <Circle cx="30" cy="65" r="2" fill="#212121" />
          {/* Spokes */}
          <G stroke="#9E9E9E" strokeWidth="0.8">
            <Path d="M30 57 L30 73" />
            <Path d="M22 65 L38 65" />
            <Path d="M24 59 L36 71" />
            <Path d="M24 71 L36 59" />
          </G>
        </G>
        
        {/* Front wheel with rotation */}
        <G rotation={wheelRotation} origin="95, 65">
          {/* Tire */}
          <Circle cx="95" cy="65" r="18" fill="url(#wheelGradient)" />
          <Circle cx="95" cy="65" r="15" fill="none" stroke="#616161" strokeWidth="6" />
          {/* Tire tread */}
          <Circle cx="95" cy="65" r="17" fill="none" stroke="#37474F" strokeWidth="2" strokeDasharray="3 2" />
          {/* Rim */}
          <Circle cx="95" cy="65" r="10" fill="#757575" />
          <Circle cx="95" cy="65" r="8" fill="#BDBDBD" />
          {/* Hub */}
          <Circle cx="95" cy="65" r="4" fill="#424242" />
          <Circle cx="95" cy="65" r="2" fill="#212121" />
          {/* Spokes */}
          <G stroke="#9E9E9E" strokeWidth="0.8">
            <Path d="M95 57 L95 73" />
            <Path d="M87 65 L103 65" />
            <Path d="M89 59 L101 71" />
            <Path d="M89 71 L101 59" />
          </G>
        </G>
        
        {/* Motorcycle frame/body */}
        <G>
          {/* Main body */}
          <Path
            d="M28 55 Q35 45 50 42 L70 42 Q78 42 82 48 L88 55 Q92 58 95 60"
            fill="url(#bikeBodyGradient)"
            stroke="#1B5E20"
            strokeWidth="1"
          />
          {/* Engine block */}
          <Rect x="42" y="48" width="20" height="14" rx="3" fill="#37474F" />
          <Rect x="44" y="50" width="6" height="4" rx="1" fill="#616161" />
          <Rect x="52" y="50" width="6" height="4" rx="1" fill="#616161" />
          {/* Exhaust */}
          <Path d="M35 58 L25 62 L22 60" stroke="#78909C" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Ellipse cx="22" cy="60" rx="3" ry="2" fill="#546E7A" />
          {/* Exhaust smoke */}
          <G opacity="0.4">
            <Circle cx="16" cy="58" r="2" fill="#FFFFFF" />
            <Circle cx="12" cy="56" r="1.5" fill="#FFFFFF" />
            <Circle cx="9" cy="55" r="1" fill="#FFFFFF" />
          </G>
        </G>
        
        {/* Seat */}
        <Path
          d="M48 40 Q52 36 60 36 Q68 36 72 40 L72 42 L48 42 Z"
          fill="#1B5E20"
        />
        
        {/* Front fork */}
        <Path d="M88 55 L95 48 L95 65" stroke="#455A64" strokeWidth="3" fill="none" />
        <Path d="M85 52 L95 48" stroke="#455A64" strokeWidth="2" fill="none" />
        
        {/* Handlebar */}
        <Path d="M90 44 L100 42 L105 44" stroke="#37474F" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Circle cx="105" cy="44" r="2" fill="#424242" />
        <Circle cx="90" cy="44" r="2" fill="#424242" />
        
        {/* Headlight */}
        <Ellipse cx="100" cy="50" rx="4" ry="3" fill="#FFF9C4" />
        <Ellipse cx="100" cy="50" rx="3" ry="2" fill="#FFEB3B" />
        
        {/* Delivery box */}
        <G>
          {/* Box shadow */}
          <Rect x="20" y="18" width="35" height="26" rx="3" fill="rgba(0,0,0,0.2)" />
          {/* Main box */}
          <Rect x="18" y="15" width="35" height="26" rx="3" fill="url(#boxGradient)" />
          {/* Box highlight */}
          <Rect x="18" y="15" width="35" height="8" rx="3" fill="rgba(255,255,255,0.2)" />
          {/* Box straps */}
          <Rect x="25" y="15" width="3" height="26" fill="#BF360C" />
          <Rect x="42" y="15" width="3" height="26" fill="#BF360C" />
          {/* Logo area */}
          <Circle cx="35" cy="28" r="8" fill="rgba(255,255,255,0.9)" />
          <SvgText x="35" y="32" fontSize="10" fill="#E64A19" textAnchor="middle" fontWeight="bold">H</SvgText>
        </G>
        
        {/* Rider */}
        <G>
          {/* Body/torso */}
          <Path
            d="M55 38 Q58 25 62 22 Q66 25 68 38"
            fill="#2E7D32"
            stroke="#1B5E20"
            strokeWidth="1"
          />
          {/* Jacket details */}
          <Path d="M58 28 L64 28" stroke="#1B5E20" strokeWidth="1" />
          <Path d="M57 32 L65 32" stroke="#1B5E20" strokeWidth="1" />
          
          {/* Arms */}
          <Path d="M56 28 Q50 32 48 36" stroke="#2E7D32" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M66 28 Q75 30 88 42" stroke="#2E7D32" strokeWidth="4" fill="none" strokeLinecap="round" />
          
          {/* Gloves */}
          <Circle cx="48" cy="37" r="3" fill="#37474F" />
          <Circle cx="89" cy="43" r="3" fill="#37474F" />
          
          {/* Helmet */}
          <Ellipse cx="62" cy="16" rx="10" ry="9" fill="url(#helmetGradient)" />
          {/* Visor */}
          <Path
            d="M54 14 Q62 18 70 14 Q70 18 62 20 Q54 18 54 14"
            fill="#263238"
            opacity="0.8"
          />
          {/* Helmet shine */}
          <Ellipse cx="58" cy="12" rx="4" ry="2" fill="rgba(255,255,255,0.3)" transform="rotate(-20 58 12)" />
          {/* Helmet vent */}
          <Rect x="59" y="8" width="6" height="2" rx="1" fill="#1B5E20" />
          
          {/* Legs on bike */}
          <Path d="M55 38 L50 52 L42 58" stroke="#1565C0" strokeWidth="5" fill="none" strokeLinecap="round" />
          <Path d="M67 38 L72 50 L80 55" stroke="#1565C0" strokeWidth="5" fill="none" strokeLinecap="round" />
          
          {/* Shoes */}
          <Ellipse cx="42" cy="60" rx="5" ry="3" fill="#212121" />
          <Ellipse cx="80" cy="57" rx="5" ry="3" fill="#212121" />
        </G>
        
        {/* Rear fender */}
        <Path
          d="M20 55 Q30 48 40 55"
          fill="none"
          stroke="url(#bikeBodyGradient)"
          strokeWidth="3"
        />
        
        {/* Front fender */}
        <Path
          d="M85 55 Q95 48 105 55"
          fill="none"
          stroke="#455A64"
          strokeWidth="3"
        />
        
        {/* Tail light */}
        <Rect x="18" y="52" width="4" height="6" rx="1" fill="#F44336" />
        <Rect x="19" y="53" width="2" height="2" rx="0.5" fill="#FFCDD2" />
      </G>
    </Svg>
  );
};

// Animated Delivery Bike with wheel rotation
const AnimatedDeliveryBike = ({ size, bikeRotation }: { size: number; bikeRotation: Animated.Value }) => {
  const [wheelAngle, setWheelAngle] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setWheelAngle(prev => (prev + 30) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  return <DeliveryBikeIcon size={size} wheelRotation={wheelAngle} />;
};

// Globe with continents SVG Component
const GlobeIcon = () => (
  <Svg width={GLOBE_SIZE} height={GLOBE_SIZE} viewBox="0 0 200 200">
    <Defs>
      <SvgLinearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#81C784" />
        <Stop offset="50%" stopColor="#4CAF50" />
        <Stop offset="100%" stopColor="#2E7D32" />
      </SvgLinearGradient>
      <SvgLinearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#E8F5E9" />
        <Stop offset="100%" stopColor="#C8E6C9" />
      </SvgLinearGradient>
      <SvgLinearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#66BB6A" />
        <Stop offset="100%" stopColor="#43A047" />
      </SvgLinearGradient>
      <ClipPath id="globeClip">
        <Circle cx="100" cy="100" r="85" />
      </ClipPath>
    </Defs>
    
    {/* Outer glow */}
    <Circle cx="100" cy="100" r="95" fill="rgba(255,255,255,0.1)" />
    
    {/* Globe background (ocean) */}
    <Circle cx="100" cy="100" r="85" fill="url(#oceanGradient)" />
    
    {/* Continents - stylized */}
    <G clipPath="url(#globeClip)">
      {/* North America */}
      <Path
        d="M30 60 Q45 45 70 50 Q85 55 90 70 Q85 85 70 90 Q50 88 40 80 Q25 70 30 60"
        fill="url(#landGradient)"
      />
      
      {/* South America */}
      <Path
        d="M55 100 Q65 95 75 100 Q80 115 75 140 Q70 160 60 165 Q50 160 50 140 Q48 115 55 100"
        fill="url(#landGradient)"
      />
      
      {/* Europe */}
      <Path
        d="M100 45 Q120 40 135 50 Q145 55 140 70 Q130 75 115 72 Q100 68 100 45"
        fill="url(#landGradient)"
      />
      
      {/* Africa */}
      <Path
        d="M105 80 Q125 75 140 85 Q150 100 145 130 Q140 155 125 160 Q110 158 105 140 Q98 110 105 80"
        fill="url(#landGradient)"
      />
      
      {/* Asia */}
      <Path
        d="M140 50 Q170 45 185 65 Q190 85 180 100 Q165 110 150 105 Q140 95 140 75 Q138 60 140 50"
        fill="url(#landGradient)"
      />
      
      {/* Australia */}
      <Path
        d="M160 130 Q175 125 185 135 Q190 150 180 160 Q165 165 155 155 Q150 145 160 130"
        fill="url(#landGradient)"
      />
    </G>
    
    {/* Globe shine effect */}
    <Ellipse
      cx="70"
      cy="65"
      rx="35"
      ry="25"
      fill="rgba(255,255,255,0.25)"
      transform="rotate(-20 70 65)"
    />
    
    {/* Globe border */}
    <Circle
      cx="100"
      cy="100"
      r="85"
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="3"
    />
    
    {/* Latitude/Longitude lines */}
    <Ellipse cx="100" cy="100" rx="85" ry="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    <Ellipse cx="100" cy="100" rx="60" ry="85" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" transform="rotate(20 100 100)" />
    <Path d="M15 100 L185 100" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
  </Svg>
);

// Handwork Logo Icon
const HandworkLogo = () => (
  <Svg width={60} height={60} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="100%" stopColor="#E8F5E9" />
      </SvgLinearGradient>
    </Defs>
    {/* Hand with leaf */}
    <G transform="translate(10, 10)">
      {/* Palm */}
      <Path
        d="M40 75 Q20 70 15 50 Q12 35 25 25 Q35 18 45 25 Q55 18 65 25 Q78 35 75 50 Q70 70 50 75 Z"
        fill="url(#logoGradient)"
      />
      {/* Leaf */}
      <Path
        d="M40 20 Q50 5 65 15 Q55 25 45 35 Q40 30 40 20"
        fill="#81C784"
        stroke="#FFFFFF"
        strokeWidth="1"
      />
      {/* Leaf vein */}
      <Path
        d="M42 22 Q50 20 55 25"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.7"
      />
    </G>
  </Svg>
);

// Orbit path dots component
const OrbitDots = () => {
  const dots = [];
  const numDots = 24;
  const radius = ORBIT_SIZE / 2;
  
  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * 2 * Math.PI;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.4; // Elliptical orbit
    const opacity = 0.1 + (i / numDots) * 0.3;
    
    dots.push(
      <View
        key={i}
        style={[
          styles.orbitDot,
          {
            transform: [
              { translateX: x },
              { translateY: y },
            ],
            opacity,
          },
        ]}
      />
    );
  }
  
  return <View style={styles.orbitDotsContainer}>{dots}</View>;
};

// Delivery path markers
const DeliveryMarkers = ({ opacity }: { opacity: Animated.Value }) => {
  const markers = [
    { x: -80, y: -20, delay: 0 },
    { x: 60, y: -35, delay: 200 },
    { x: 90, y: 15, delay: 400 },
    { x: -70, y: 30, delay: 600 },
  ];

  return (
    <>
      {markers.map((marker, index) => (
        <Animated.View
          key={index}
          style={[
            styles.marker,
            {
              transform: [
                { translateX: marker.x },
                { translateY: marker.y },
              ],
              opacity,
            },
          ]}
        >
          <View style={styles.markerPin} />
          <View style={styles.markerDot} />
        </Animated.View>
      ))}
    </>
  );
};

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
}) => {
  // Animation values
  const globeScale = useRef(new Animated.Value(0)).current;
  const globeOpacity = useRef(new Animated.Value(0)).current;
  const globeRotation = useRef(new Animated.Value(0)).current;
  const bikeRotation = useRef(new Animated.Value(0)).current;
  const bikeBounce = useRef(new Animated.Value(0)).current;
  const bikeOpacity = useRef(new Animated.Value(0)).current;
  const orbitOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const markerOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start bike orbit animation (continuous) - smoother with easing
    const bikeOrbitAnimation = Animated.loop(
      Animated.timing(bikeRotation, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Bike bounce animation - simulates road bumps
    const bikeBounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bikeBounce, {
          toValue: 1,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bikeBounce, {
          toValue: 0,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle globe rotation
    const globeRotationAnimation = Animated.loop(
      Animated.timing(globeRotation, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse animation for logo
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Main sequence
    Animated.sequence([
      // 1. Globe appears with scale
      Animated.parallel([
        Animated.spring(globeScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(globeOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // 2. Orbit path and bike appear
      Animated.parallel([
        Animated.timing(orbitOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bikeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(trailOpacity, {
          toValue: 0.6,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // Small delay
      Animated.delay(200),

      // 3. Markers appear
      Animated.timing(markerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      // 4. App name slides up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 5. Tagline appears
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),

      // 6. Progress bar animation
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),

      // 7. Hold
      Animated.delay(300),

      // 8. Fade out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete?.();
    });

    // Start continuous animations
    bikeOrbitAnimation.start();
    bikeBounceAnimation.start();
    globeRotationAnimation.start();
    pulseAnimation.start();

    return () => {
      bikeOrbitAnimation.stop();
      bikeBounceAnimation.stop();
      globeRotationAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  // Bike orbit interpolation - creates elliptical orbit with smooth movement
  const bikeTranslateX = bikeRotation.interpolate({
    inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    outputRange: [0, ORBIT_SIZE / 2.8, ORBIT_SIZE / 2, ORBIT_SIZE / 2.8, 0, -ORBIT_SIZE / 2.8, -ORBIT_SIZE / 2, -ORBIT_SIZE / 2.8, 0],
  });

  const bikeTranslateY = bikeRotation.interpolate({
    inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    outputRange: [-ORBIT_SIZE / 4, -ORBIT_SIZE / 6, 0, ORBIT_SIZE / 6, ORBIT_SIZE / 4, ORBIT_SIZE / 6, 0, -ORBIT_SIZE / 6, -ORBIT_SIZE / 4],
  });

  // Bounce effect - small vertical oscillation simulating road bumps
  const bikeBounceY = bikeBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const bikeScale = bikeRotation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.65, 0.95, 1.15, 0.95, 0.65],
  });

  // Tilt bike when turning - lean into the curve
  const bikeTilt = bikeRotation.interpolate({
    inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    outputRange: ['0deg', '-8deg', '-12deg', '-8deg', '0deg', '8deg', '12deg', '8deg', '0deg'],
  });

  const bikeZIndex = bikeRotation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 2, 2, 2, 1],
  });

  const bikeFlip = bikeRotation.interpolate({
    inputRange: [0, 0.5, 0.501, 1],
    outputRange: [1, 1, -1, -1],
  });

  // Dynamic shadow based on position
  const bikeShadowOpacity = bikeRotation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.2, 0.4, 0.5, 0.4, 0.2],
  });

  const globeRotationStyle = {
    transform: [
      {
        rotateY: globeRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C', '#43A047']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background patterns */}
        <View style={styles.backgroundPattern}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternCircle,
                {
                  width: 100 + i * 80,
                  height: 100 + i * 80,
                  borderRadius: 50 + i * 40,
                  top: height * 0.3 - (50 + i * 40),
                  left: width * 0.5 - (50 + i * 40),
                  opacity: 0.03 - i * 0.004,
                },
              ]}
            />
          ))}
        </View>

        {/* Floating particles */}
        <FloatingParticles />

        {/* Main content container */}
        <View style={styles.contentContainer}>
          {/* Globe and orbit system */}
          <View style={styles.globeSystem}>
            {/* Orbit path visualization */}
            <Animated.View style={[styles.orbitPath, { opacity: orbitOpacity }]}>
              <View style={styles.orbitEllipse} />
              <OrbitDots />
            </Animated.View>

            {/* Delivery markers on globe */}
            <DeliveryMarkers opacity={markerOpacity} />

            {/* Globe */}
            <Animated.View
              style={[
                styles.globeContainer,
                {
                  opacity: globeOpacity,
                  transform: [
                    { scale: Animated.multiply(globeScale, pulseAnim) },
                  ],
                },
              ]}
            >
              <GlobeIcon />
              
              {/* Center logo overlay */}
              <View style={styles.centerLogo}>
                <HandworkLogo />
              </View>
            </Animated.View>

            {/* Animated delivery bike */}
            <Animated.View
              style={[
                styles.bikeContainer,
                {
                  opacity: bikeOpacity,
                  transform: [
                    { translateX: bikeTranslateX },
                    { translateY: Animated.add(bikeTranslateY, bikeBounceY) },
                    { scale: bikeScale },
                    { rotate: bikeTilt },
                    { scaleX: bikeFlip },
                  ],
                },
              ]}
            >
              {/* Dynamic motion trail */}
              <Animated.View style={[styles.bikeTrail, { opacity: trailOpacity }]}>
                <Animated.View style={[styles.trailDot, styles.trailDot1, { opacity: Animated.multiply(trailOpacity, 0.3) }]} />
                <Animated.View style={[styles.trailDot, styles.trailDot2, { opacity: Animated.multiply(trailOpacity, 0.5) }]} />
                <Animated.View style={[styles.trailDot, styles.trailDot3, { opacity: Animated.multiply(trailOpacity, 0.7) }]} />
                <Animated.View style={[styles.trailLine, { opacity: Animated.multiply(trailOpacity, 0.4) }]} />
              </Animated.View>
              
              {/* Bike shadow */}
              <Animated.View 
                style={[
                  styles.bikeShadow, 
                  { 
                    opacity: bikeShadowOpacity,
                    transform: [{ scaleX: bikeFlip }]
                  }
                ]} 
              />
              
              <AnimatedDeliveryBike size={70} bikeRotation={bikeRotation} />
            </Animated.View>
          </View>

          {/* App name */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.appName}>Handwork</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[
              styles.taglineContainer,
              {
                opacity: taglineOpacity,
                transform: [{ translateY: taglineTranslateY }],
              },
            ]}
          >
            <Text style={styles.tagline}>Farm Fresh, Delivered Worldwide</Text>
          </Animated.View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Animated.Text style={[styles.progressText, { opacity: taglineOpacity }]}>
              Loading fresh goods...
            </Animated.Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Floating particles component
const FloatingParticles = () => {
  const particles = useRef(
    [...Array(15)].map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 4 + Math.random() * 8,
      duration: 3000 + Math.random() * 4000,
      delay: Math.random() * 2000,
    }))
  ).current;

  return (
    <View style={styles.particlesContainer}>
      {particles.map((particle, index) => (
        <FloatingParticle key={index} {...particle} />
      ))}
    </View>
  );
};

const FloatingParticle = ({ 
  x, 
  y, 
  size, 
  duration, 
  delay 
}: { 
  x: number; 
  y: number; 
  size: number; 
  duration: number; 
  delay: number;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -60,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeSystem: {
    width: ORBIT_SIZE + 60,
    height: ORBIT_SIZE + 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  orbitPath: {
    position: 'absolute',
    width: ORBIT_SIZE,
    height: ORBIT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitEllipse: {
    position: 'absolute',
    width: ORBIT_SIZE,
    height: ORBIT_SIZE / 2,
    borderRadius: ORBIT_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
  },
  orbitDotsContainer: {
    position: 'absolute',
    width: ORBIT_SIZE,
    height: ORBIT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  globeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  centerLogo: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    borderRadius: 35,
    width: 70,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bikeContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bikeShadow: {
    position: 'absolute',
    bottom: -8,
    width: 50,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 25,
    transform: [{ scaleY: 0.5 }],
  },
  bikeTrail: {
    position: 'absolute',
    flexDirection: 'row',
    right: 50,
    alignItems: 'center',
    height: 20,
  },
  trailDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  trailDot1: {
    right: 0,
    transform: [{ scale: 0.5 }],
  },
  trailDot2: {
    right: 12,
    transform: [{ scale: 0.7 }],
  },
  trailDot3: {
    right: 26,
    transform: [{ scale: 0.9 }],
  },
  trailLine: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerPin: {
    width: 12,
    height: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    transform: [{ rotate: '45deg' }],
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginTop: -14,
    transform: [{ rotate: '45deg' }],
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 44,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  progressContainer: {
    alignItems: 'center',
    width: width * 0.6,
  },
  progressBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
});

export default AnimatedSplashScreen;
