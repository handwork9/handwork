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
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 8,
          elevation: isDark ? 0 : 3,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={isDark ? ['#7C3AED', '#6D28D9'] : ['#8B5CF6', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconGradient}
      >
        <Ionicons name="people" size={22} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Status & Community</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Stories, updates & connect with farmers
        </Text>
      </View>
      {totalActivity > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalActivity > 99 ? '99+' : totalActivity}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconGradient: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
});

export default StatusCommunityCard;
