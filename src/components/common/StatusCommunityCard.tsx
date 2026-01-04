import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { StatusCommunityIllustration } from '../../assets/illustrations/hero';

interface StatusCommunityCardProps {
  storiesCount?: number;
  liveCount?: number;
  style?: object;
}

const StatusCommunityCard: React.FC<StatusCommunityCardProps> = ({
  storiesCount = 0,
  liveCount = 0,
  style,
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    triggerHaptic();
    (navigation as any).navigate('SocialFeed');
  };

  const totalActivity = storiesCount + liveCount;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={isDark ? ['#581C87', '#4C1D95'] : ['#A855F7', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background pattern */}
        <View style={styles.patternContainer}>
          <View style={[styles.patternCircle, styles.patternCircle1]} />
          <View style={[styles.patternCircle, styles.patternCircle2]} />
        </View>

        <View style={styles.content}>
          <View style={styles.textContainer}>
            {totalActivity > 0 && (
              <View style={styles.activityBadge}>
                <View style={styles.activityDot} />
                <Text style={styles.activityText}>{totalActivity} New</Text>
              </View>
            )}
            <Text style={styles.title}>Status & Community</Text>
            <Text style={styles.subtitle}>
              View stories, updates & connect with farmers
            </Text>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Explore</Text>
              <Ionicons name="arrow-forward" size={14} color="#7C3AED" />
            </View>
          </View>

          <View style={styles.illustrationContainer}>
            <StatusCommunityIllustration size={80} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  patternCircle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -20,
  },
  patternCircle2: {
    width: 80,
    height: 80,
    bottom: -30,
    left: -20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  activityText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  buttonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#7C3AED',
  },
  illustrationContainer: {
    marginLeft: 8,
  },
});

export default StatusCommunityCard;
