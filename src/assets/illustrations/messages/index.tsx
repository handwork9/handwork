import React from 'react';
import Svg, { Path, Circle, Rect, Ellipse, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IllustrationProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  width?: number;
  height?: number;
  color?: string;
}

// Empty messages state - No conversations yet
export const EmptyMessagesIllustration: React.FC<IllustrationProps> = ({
  size = 120,
  primaryColor = '#4CAF50',
  secondaryColor = '#81C784',
  width,
  height,
  color,
}) => {
  const finalSize = width || height || size;
  const primary = color || primaryColor;
  const secondary = secondaryColor;

  return (
    <Svg width={finalSize} height={finalSize} viewBox="0 0 120 120" fill="none">
      <Defs>
        <LinearGradient id="msgBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primary} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={secondary} stopOpacity="0.2" />
        </LinearGradient>
      </Defs>
      
      {/* Background circle */}
      <Circle cx="60" cy="60" r="55" fill="url(#msgBg)" />
      
      {/* Main chat bubble - left */}
      <Path
        d="M25 45 C25 38 31 32 38 32 L62 32 C69 32 75 38 75 45 L75 60 C75 67 69 73 62 73 L45 73 L35 83 L35 73 L38 73 C31 73 25 67 25 60 Z"
        fill={primary}
        opacity="0.9"
      />
      
      {/* Chat lines in left bubble */}
      <Rect x="33" y="42" width="34" height="4" rx="2" fill="white" opacity="0.9" />
      <Rect x="33" y="50" width="26" height="4" rx="2" fill="white" opacity="0.7" />
      <Rect x="33" y="58" width="18" height="4" rx="2" fill="white" opacity="0.5" />
      
      {/* Secondary chat bubble - right */}
      <Path
        d="M45 55 C45 48 51 42 58 42 L82 42 C89 42 95 48 95 55 L95 70 C95 77 89 83 82 83 L95 83 L85 93 L75 83 L58 83 C51 83 45 77 45 70 Z"
        fill={secondary}
        opacity="0.85"
      />
      
      {/* Chat lines in right bubble */}
      <Rect x="53" y="52" width="34" height="4" rx="2" fill="white" opacity="0.9" />
      <Rect x="53" y="60" width="28" height="4" rx="2" fill="white" opacity="0.7" />
      <Rect x="53" y="68" width="20" height="4" rx="2" fill="white" opacity="0.5" />
      
      {/* Decorative dots */}
      <Circle cx="20" cy="35" r="3" fill={primary} opacity="0.3" />
      <Circle cx="100" cy="40" r="2" fill={secondary} opacity="0.4" />
      <Circle cx="15" cy="75" r="2" fill={primary} opacity="0.25" />
      <Circle cx="105" cy="85" r="3" fill={secondary} opacity="0.35" />
    </Svg>
  );
};

// No search results illustration
export const NoSearchResultsIllustration: React.FC<IllustrationProps> = ({
  size = 120,
  primaryColor = '#FF9800',
  secondaryColor = '#FFB74D',
  width,
  height,
  color,
}) => {
  const finalSize = width || height || size;
  const primary = color || primaryColor;
  const secondary = secondaryColor;

  return (
    <Svg width={finalSize} height={finalSize} viewBox="0 0 120 120" fill="none">
      <Defs>
        <LinearGradient id="searchBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primary} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={secondary} stopOpacity="0.15" />
        </LinearGradient>
      </Defs>
      
      {/* Background */}
      <Circle cx="60" cy="60" r="55" fill="url(#searchBg)" />
      
      {/* Magnifying glass circle */}
      <Circle
        cx="52"
        cy="50"
        r="24"
        stroke={primary}
        strokeWidth="5"
        fill="white"
        opacity="0.95"
      />
      
      {/* Magnifying glass handle */}
      <Path
        d="M70 68 L88 86"
        stroke={primary}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.9"
      />
      
      {/* Sad face in magnifying glass */}
      <Circle cx="44" cy="46" r="3" fill={primary} opacity="0.7" />
      <Circle cx="60" cy="46" r="3" fill={primary} opacity="0.7" />
      <Path
        d="M44 58 Q52 52 60 58"
        stroke={primary}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      
      {/* Question marks */}
      <G opacity="0.4">
        <Path
          d="M25 30 Q25 25 30 25 Q35 25 35 30 Q35 33 30 35 L30 38"
          stroke={secondary}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="30" cy="42" r="1.5" fill={secondary} />
      </G>
      
      <G opacity="0.3">
        <Path
          d="M90 35 Q90 30 95 30 Q100 30 100 35 Q100 38 95 40 L95 43"
          stroke={primary}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="95" cy="47" r="1.5" fill={primary} />
      </G>
    </Svg>
  );
};

// Typing indicator illustration (three dots animating)
export const TypingIndicatorIllustration: React.FC<IllustrationProps> = ({
  size = 40,
  primaryColor = '#4CAF50',
  secondaryColor = '#81C784',
  width,
  height,
  color,
}) => {
  const finalSize = width || height || size;
  const primary = color || primaryColor;

  return (
    <Svg width={finalSize} height={finalSize * 0.5} viewBox="0 0 40 20" fill="none">
      {/* Chat bubble background */}
      <Path
        d="M2 5 C2 2 5 0 8 0 L32 0 C35 0 38 2 38 5 L38 12 C38 15 35 17 32 17 L10 17 L5 20 L5 17 L8 17 C5 17 2 15 2 12 Z"
        fill={primary}
        opacity="0.15"
      />
      
      {/* Typing dots */}
      <Circle cx="12" cy="9" r="3" fill={primary} opacity="0.9" />
      <Circle cx="20" cy="9" r="3" fill={primary} opacity="0.7" />
      <Circle cx="28" cy="9" r="3" fill={primary} opacity="0.5" />
    </Svg>
  );
};

// Connection lost / offline illustration
export const OfflineIllustration: React.FC<IllustrationProps> = ({
  size = 120,
  primaryColor = '#F44336',
  secondaryColor = '#EF5350',
  width,
  height,
  color,
}) => {
  const finalSize = width || height || size;
  const primary = color || primaryColor;
  const secondary = secondaryColor;

  return (
    <Svg width={finalSize} height={finalSize} viewBox="0 0 120 120" fill="none">
      <Defs>
        <LinearGradient id="offlineBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primary} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={secondary} stopOpacity="0.15" />
        </LinearGradient>
      </Defs>
      
      {/* Background */}
      <Circle cx="60" cy="60" r="55" fill="url(#offlineBg)" />
      
      {/* Cloud shape */}
      <Path
        d="M30 70 C22 70 16 64 16 56 C16 48 22 42 30 42 C30 42 30 42 30 42 C32 32 42 24 54 24 C68 24 78 34 80 46 C80 46 80 46 80 46 C88 46 96 54 96 64 C96 72 90 78 82 80 L38 80 C34 80 30 76 30 72 Z"
        fill="white"
        stroke={primary}
        strokeWidth="3"
        opacity="0.9"
      />
      
      {/* X mark for disconnected */}
      <Path
        d="M50 50 L70 70 M70 50 L50 70"
        stroke={primary}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* Signal waves (crossed out) */}
      <G opacity="0.4">
        <Path
          d="M25 95 Q35 85 45 95"
          stroke={secondary}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M20 100 Q35 85 50 100"
          stroke={secondary}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </G>
      
      {/* Disconnection line */}
      <Path
        d="M15 90 L55 105"
        stroke={primary}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
    </Svg>
  );
};

// New message notification illustration
export const NewMessageIllustration: React.FC<IllustrationProps> = ({
  size = 60,
  primaryColor = '#2196F3',
  secondaryColor = '#64B5F6',
  width,
  height,
  color,
}) => {
  const finalSize = width || height || size;
  const primary = color || primaryColor;
  const secondary = secondaryColor;

  return (
    <Svg width={finalSize} height={finalSize} viewBox="0 0 60 60" fill="none">
      {/* Chat bubble */}
      <Path
        d="M8 15 C8 10 12 6 17 6 L43 6 C48 6 52 10 52 15 L52 35 C52 40 48 44 43 44 L25 44 L15 54 L15 44 L17 44 C12 44 8 40 8 35 Z"
        fill={primary}
        opacity="0.9"
      />
      
      {/* Notification badge */}
      <Circle cx="48" cy="12" r="10" fill={secondary} />
      <Circle cx="48" cy="12" r="8" fill="#FF5722" />
      <Path
        d="M48 8 L48 13 M48 15 L48 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Message lines */}
      <Rect x="15" y="16" width="24" height="3" rx="1.5" fill="white" opacity="0.9" />
      <Rect x="15" y="23" width="18" height="3" rx="1.5" fill="white" opacity="0.7" />
      <Rect x="15" y="30" width="12" height="3" rx="1.5" fill="white" opacity="0.5" />
    </Svg>
  );
};

// Start conversation illustration
export const StartConversationIllustration: React.FC<IllustrationProps> = ({
  size = 120,
  primaryColor = '#4CAF50',
  secondaryColor = '#81C784',
  width,
  height,
  color,
}) => {
  const finalSize = width || height || size;
  const primary = color || primaryColor;
  const secondary = secondaryColor;

  return (
    <Svg width={finalSize} height={finalSize} viewBox="0 0 120 120" fill="none">
      <Defs>
        <LinearGradient id="startChatBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primary} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={secondary} stopOpacity="0.2" />
        </LinearGradient>
      </Defs>
      
      {/* Background */}
      <Circle cx="60" cy="60" r="55" fill="url(#startChatBg)" />
      
      {/* Person silhouette - left */}
      <Circle cx="35" cy="38" r="12" fill={primary} opacity="0.8" />
      <Path
        d="M20 75 C20 60 27 52 35 52 C43 52 50 60 50 75"
        fill={primary}
        opacity="0.6"
      />
      
      {/* Person silhouette - right */}
      <Circle cx="85" cy="38" r="12" fill={secondary} opacity="0.8" />
      <Path
        d="M70 75 C70 60 77 52 85 52 C93 52 100 60 100 75"
        fill={secondary}
        opacity="0.6"
      />
      
      {/* Chat bubble connecting them */}
      <Path
        d="M50 55 L55 50 L65 50 L70 55 L65 60 L55 60 Z"
        fill={primary}
        opacity="0.7"
      />
      
      {/* Connection lines */}
      <Path
        d="M47 48 Q60 35 73 48"
        stroke={primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 2"
        fill="none"
        opacity="0.5"
      />
      
      {/* Plus sign for new conversation */}
      <Circle cx="60" cy="90" r="12" fill={primary} opacity="0.9" />
      <Path
        d="M60 84 L60 96 M54 90 L66 90"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Decorative elements */}
      <Circle cx="15" cy="25" r="2" fill={primary} opacity="0.3" />
      <Circle cx="105" cy="30" r="3" fill={secondary} opacity="0.3" />
      <Circle cx="12" cy="90" r="2" fill={secondary} opacity="0.25" />
      <Circle cx="108" cy="85" r="2" fill={primary} opacity="0.25" />
    </Svg>
  );
};

export default {
  EmptyMessagesIllustration,
  NoSearchResultsIllustration,
  TypingIndicatorIllustration,
  OfflineIllustration,
  NewMessageIllustration,
  StartConversationIllustration,
};
