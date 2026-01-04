import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

  const handleStatusPress = () => {
    triggerHaptic();
    (navigation as any).navigate('Social');
  };

  const handleCommunityPress = () => {
    triggerHaptic();
    (navigation as any).navigate('Community');
  };

  return (
    <View style={[styles.container, style]}>
      {/* Status Card */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.08,
            shadowRadius: 8,
            elevation: isDark ? 0 : 3,
          },
        ]}
        onPress={handleStatusPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isDark ? ['#7C3AED', '#6D28D9'] : ['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <MaterialCommunityIcons name="camera-iris" size={22} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Status</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {storiesCount > 0 ? `${storiesCount} new updates` : 'View farmer stories'}
          </Text>
        </View>
        <View style={[styles.arrowContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
        {storiesCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{storiesCount > 99 ? '99+' : storiesCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Community Card */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.08,
            shadowRadius: 8,
            elevation: isDark ? 0 : 3,
          },
        ]}
        onPress={handleCommunityPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isDark ? ['#059669', '#047857'] : ['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Ionicons name="people" size={22} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Community</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Connect with farmers
          </Text>
        </View>
        <View style={[styles.arrowContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F3F4F6' }]}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
        {liveCount > 0 && (
          <View style={[styles.liveBadge]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{liveCount} Live</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 8,
    marginTop: 12,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  iconGradient: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
});

export default StatusCommunityCard;
