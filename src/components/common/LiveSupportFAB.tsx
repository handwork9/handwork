import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';

interface LiveSupportFABProps {
  visible?: boolean;
  showLabel?: boolean;
  position?: 'bottom-right' | 'bottom-left';
  bottomOffset?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LiveSupportFAB: React.FC<LiveSupportFABProps> = ({
  visible = true,
  showLabel = false,
  position = 'bottom-right',
  bottomOffset = 80,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePress = () => {
    triggerHaptic();
    (navigation as any).navigate('LiveChat');
  };

  const handleLongPress = () => {
    triggerHaptic();
    setIsExpanded(!isExpanded);
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'bottom-right' ? styles.positionRight : styles.positionLeft,
        {
          bottom: bottomOffset + insets.bottom,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Expanded options */}
      {isExpanded && (
        <Animated.View style={styles.expandedOptions}>
          <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={() => {
              triggerHaptic();
              (navigation as any).navigate('HelpCenter');
              setIsExpanded(false);
            }}
          >
            <Ionicons name="help-circle" size={20} color="#3B82F6" />
            <Text style={[styles.optionText, { color: colors.text }]}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={() => {
              triggerHaptic();
              (navigation as any).navigate('ContactUs');
              setIsExpanded(false);
            }}
          >
            <Ionicons name="call" size={20} color="#22C55E" />
            <Text style={[styles.optionText, { color: colors.text }]}>Contact Us</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fabWrapper}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
        delayLongPress={500}
      >
        {/* Pulse effect */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.1],
                outputRange: [0.3, 0],
              }),
            },
          ]}
        />
        
        {/* Main button */}
        <View style={styles.fabButton}>
          <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
          
          {/* Online indicator */}
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
          </View>
        </View>

        {/* Label */}
        {showLabel && (
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>Support</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Badge for unread messages (optional) */}
      {/* <View style={styles.badge}>
        <Text style={styles.badgeText}>1</Text>
      </View> */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
  },
  positionRight: {
    right: 16,
  },
  positionLeft: {
    left: 16,
  },
  fabWrapper: {
    alignItems: 'center',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
  },
  onlineIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  labelContainer: {
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  expandedOptions: {
    marginBottom: 12,
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
});

export default LiveSupportFAB;
